// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#import <AppKit/AppKit.h>
#import <objc/runtime.h>

#include <cassert>
#include <iostream>

#include "window-input-backend.h"
#include <SFML/Window.hpp>

@interface SFMLTestTextOwner : NSResponder {
 @public  // NOLINT
  BOOL claim;
  BOOL capture;
  NSEvent* delivered;
  NSTextInputContext* supplied_context;
}
- (BOOL)sfmljsOwnsTextInputEvent:(NSEvent*)event;  // NOLINT
@end

@implementation SFMLTestTextOwner
- (NSTextInputContext*)inputContext {  // NOLINT
  return supplied_context;
}
- (void)keyDown:(NSEvent*)event {  // NOLINT
  delivered = event;
  if (capture) {
    const std::shared_ptr<void> source = std::make_shared<int>(1);
    sfmljs::interop::detail::EventSourceBackend().set(&source);
  }
}
- (BOOL)sfmljsOwnsTextInputEvent:(NSEvent*)event {  // NOLINT
  return claim && delivered == event;
}
@end

namespace {

int interpretations = 0;

// Substitute only the hidden view's engine call, so this contract cannot
// activate or modify a desktop input method. Production keyDown still runs.
void Interpret(id view, SEL, NSArray*) {
  ++interpretations;
  [view setString:@"a"];
}

NSOpenGLView* Surface(NSView* view) {
  if ([view isKindOfClass:NSOpenGLView.class]) {
    return static_cast<NSOpenGLView*>(view);
  }
  for (NSView* child in view.subviews) {
    if (auto* surface = Surface(child)) {
      return surface;
    }
  }
  return nil;
}

NSEvent* Key(NSWindow* window, BOOL repeat) {
  return [NSEvent keyEventWithType:NSEventTypeKeyDown
                          location:NSZeroPoint
                     modifierFlags:0
                         timestamp:NSProcessInfo.processInfo.systemUptime
                      windowNumber:window.windowNumber
                           context:nil
                        characters:@"a"
       charactersIgnoringModifiers:@"a"
                         isARepeat:repeat
                           keyCode:0];
}

void Verify(sf::Window* window, int keys, int texts) {
  int actual_keys = 0;
  int actual_texts = 0;
  while (auto event = window->pollEvent()) {
    if (event->is<sf::Event::KeyPressed>()) {
      ++actual_keys;
    } else if (event->is<sf::Event::TextEntered>()) {
      ++actual_texts;
      assert(event->getIf<sf::Event::TextEntered>()->unicode == U'a');
    }
  }
  assert(actual_keys == keys);
  assert(actual_texts == texts);
}

}  // namespace

int main() {
  @autoreleasepool {
    sf::Window window(sf::VideoMode({320, 200}), "Cocoa text ownership");
    window.setVisible(false);
    auto* native_window = static_cast<NSWindow*>(window.getNativeHandle());
    auto* surface = Surface(native_window.contentView);
    assert(surface);
    const Ivar ivar =
        class_getInstanceVariable(surface.class, "m_hiddenTextView");
    assert(ivar);
    id hidden = object_getIvar(surface, ivar);
    const Class original = object_getClass(hidden);
    const Class fixture =
        objc_allocateClassPair(original, "SFMLHiddenTextCounter", 0);
    const SEL selector = @selector(interpretKeyEvents:);
    assert(class_addMethod(
        fixture,
        selector,
        reinterpret_cast<IMP>(Interpret),
        method_getTypeEncoding(class_getInstanceMethod(original, selector))));
    objc_registerClassPair(fixture);
    object_setClass(hidden, fixture);
    NSResponder* responder = surface.nextResponder;
    auto* owner = [[SFMLTestTextOwner alloc] init];
    surface.nextResponder = owner;
    while (window.pollEvent()) {
    }

    owner->claim = YES;
    [surface keyDown:Key(native_window, NO)];
    assert(interpretations == 0);
    Verify(&window, 1, 0);
    std::cout << "PASS claimed Cocoa key has exactly one text owner\n";

    owner->claim = NO;
    owner->capture = YES;
    [surface keyDown:Key(native_window, NO)];
    assert(interpretations == 1);
    Verify(&window, 1, 1);
    std::cout << "PASS provenance alone preserves ordinary text fallback\n";

    window.setKeyRepeatEnabled(false);
    [surface keyDown:Key(native_window, YES)];
    assert(interpretations == 1);
    Verify(&window, 0, 0);
    std::cout << "PASS disabled repeat suppresses key and text entries\n";

    window.setKeyRepeatEnabled(true);
    [surface keyDown:Key(native_window, YES)];
    assert(interpretations == 2);
    Verify(&window, 1, 1);
    std::cout << "PASS enabled repeat preserves ordinary text fallback\n";

    owner->supplied_context = [hidden inputContext];
    assert(owner->supplied_context);
    assert(surface.inputContext == owner->supplied_context);
    owner->supplied_context = nil;
    std::cout << "PASS first responder exposes the owning input context\n";

    surface.nextResponder = responder;
    [owner release];
    object_setClass(hidden, original);
    window.close();
  }
}
