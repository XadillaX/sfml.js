// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#import <AppKit/AppKit.h>
#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>
#include <RmlUi/Core/EventListener.h>

#include <cassert>
#include <cmath>
#include <cstdint>
#include <functional>
#include <iostream>
#include <memory>
#include <utility>

#include "native/platform/ime/native-text-input.h"
#include "native/platform/rmlui-platform-sfml.h"
#include "test/native/platform/ime/macos/cocoa-keyboard-fixture.h"

namespace {

class StopAfterKey final : public Rml::EventListener {
 public:
  void ProcessEvent(Rml::Event&) override { continuing = false; }

  bool continuing{true};
};

class SwitchAfterKey final : public Rml::EventListener {
 public:
  explicit SwitchAfterKey(std::function<void()> action)
      : action_(std::move(action)) {}

  void ProcessEvent(Rml::Event&) override { action_(); }

 private:
  std::function<void()> action_;
};

NSEvent* KeyEvent(NSWindow* window, NSString* characters, uint16_t code) {
  return [NSEvent keyEventWithType:NSEventTypeKeyDown
                          location:NSZeroPoint
                     modifierFlags:0
                         timestamp:NSProcessInfo.processInfo.systemUptime
                      windowNumber:window.windowNumber
                           context:nil
                        characters:characters
       charactersIgnoringModifiers:characters
                         isARepeat:NO
                           keyCode:code];
}

NSOpenGLView* Surface(NSView* view) {
  if ([view isKindOfClass:NSOpenGLView.class]) {
    return static_cast<NSOpenGLView*>(view);
  }
  for (NSView* child in view.subviews) {
    if (auto* result = Surface(child)) {
      return result;
    }
  }
  return nil;
}

void CandidateBounds(id<NSTextInputClient> client,
                     NSOpenGLView* surface,
                     sfmlrmlui::ime::NativeTextInput* adapter) {
  adapter->SetCaret(
      Rml::Rectanglef::FromPositionSize({120.f, 80.f}, {1.f, 32.f}));
  NSRange actual;
  const NSRect bounds = [client firstRectForCharacterRange:NSMakeRange(1, 0)
                                               actualRange:&actual];
  const CGFloat ratio = surface.wantsBestResolutionOpenGLSurface
                            ? surface.window.backingScaleFactor
                            : 1.;
  const CGFloat top =
      surface.isFlipped ? 80. / ratio : NSHeight(surface.bounds) - 112. / ratio;
  const NSPoint point = [surface.window
      convertPointToScreen:[surface convertPoint:NSMakePoint(120. / ratio, top)
                                          toView:nil]];
  assert(std::abs(bounds.origin.x - point.x) < 0.001);
  assert(std::abs(bounds.origin.y - point.y) < 0.001);
  assert(std::abs(bounds.size.height - 32. / ratio) < 0.001);
  assert(bounds.size.width > 0);
  assert(actual.location != NSNotFound);
}

void SharedContextRouting(
    Rml::Context* first_context,
    Rml::ElementFormControlInput* first_input,
    const std::function<Rml::TextInputContext*()>& active_input,
    sf::RenderWindow* window,
    NSOpenGLView* surface,
    const sfmlrmlui::test::CocoaKeyboardFixture& keyboard) {
  using sfmlrmlui::ime::NativeTextInput;
  using sfmlrmlui::ime::TextInputSession;

  auto* second_context = Rml::CreateContext("ime-shared-window", {320, 200});
  assert(second_context);
  auto* document = second_context->LoadDocumentFromMemory(
      "<rml><body><input id='second'/></body></rml>");
  assert(document);
  document->Show();
  second_context->Update();
  auto* second_input = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
      document->GetElementById("second"));
  assert(second_input);

  auto adapter = NativeTextInput::Create(window);
  assert(adapter && first_input->Focus());
  adapter->Activate(
      std::make_shared<TextInputSession>(active_input(), first_input));
  SwitchAfterKey switch_context([&] {
    adapter->Deactivate(false);
    first_input->Blur();
    assert(second_input->Focus());
    adapter->Activate(
        std::make_shared<TextInputSession>(active_input(), second_input));
  });
  first_input->AddEventListener("keydown", &switch_context);
  while (window->pollEvent()) {
    // Start with only the two keys captured while the first context is active.
  }
  keyboard.Send(KeyEvent(surface.window, @"a", 0));
  keyboard.Send(KeyEvent(surface.window, @"b", 11));
  adapter->Drain([] { return true; });
  first_input->RemoveEventListener("keydown", &switch_context);

  int second_keys = 0;
  int second_text = 0;
  while (auto event = window->pollEvent()) {
    const auto source = sfmljs::interop::TakeWindowEventSource();
    if (const auto* key = event->getIf<sf::Event::KeyPressed>()) {
      if (key->code == sf::Keyboard::Key::B) {
        ++second_keys;
        assert(adapter->Consume(second_context, *event, source));
        assert(!adapter->Consume(second_context, *event, {}));
      }
    } else if (const auto* text = event->getIf<sf::Event::TextEntered>()) {
      if (text->unicode == U'b') {
        ++second_text;
        assert(adapter->Consume(second_context, *event, source));
        assert(!adapter->Consume(first_context, *event, source));
      }
    }
  }
  assert(second_keys == 1);
  assert(second_text == 0);
  assert(second_input->GetValue() == "b");
  adapter->Deactivate(true);
  document->Close();
  second_context->Update();
  assert(Rml::RemoveContext("ime-shared-window"));
  assert(first_input->Focus());
  std::cout << "PASS queued keys follow shared-window context focus changes\n";
}

}  // namespace

void CocoaImeContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input) {
  using sfmlrmlui::ime::NativeTextInput;
  using sfmlrmlui::ime::TextInputSession;

  @autoreleasepool {
    sf::RenderWindow window(sf::VideoMode({320, 200}), "RmlUi IME contracts");
    auto* native_window =
        static_cast<NSWindow*>(static_cast<id>(window.getNativeHandle()));
    auto* surface = Surface(native_window.contentView);
    assert(surface);
    sfmlrmlui::test::CocoaKeyboardFixture keyboard(surface);
    NSResponder* original = surface.nextResponder;
    auto adapter = NativeTextInput::Create(&window);
    assert(adapter);

    auto* document = context->LoadDocumentFromMemory(
        "<rml><head><style>input{width:160px;height:30px;}</style></head>"
        "<body><input id='input' value='A😀B'/></body></rml>");
    assert(document);
    document->Show();
    context->Update();
    auto* input = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
        document->GetElementById("input"));
    assert(input && input->Focus() && active_input());
    auto session = std::make_shared<TextInputSession>(active_input(), input);
    session->SetSelection({1, 2});
    adapter->Activate(session);

    id<NSTextInputClient> client =
        static_cast<id<NSTextInputClient>>(surface.nextResponder);
    assert([client conformsToProtocol:@protocol(NSTextInputClient)]);
    assert(surface.nextResponder != original);
    [client setMarkedText:@"ni"
            selectedRange:NSMakeRange(2, 0)
         replacementRange:NSMakeRange(NSNotFound, 0)];
    assert(input->GetValue() == "A😀B");
    assert([client hasMarkedText]);
    assert(NSEqualRanges([client markedRange], NSMakeRange(1, 2)));
    [client setMarkedText:@"你"
            selectedRange:NSMakeRange(1, 0)
         replacementRange:NSMakeRange(NSNotFound, 0)];
    adapter->Drain([] { return true; });
    assert(input->GetValue() == "A你B");
    assert(NSEqualRanges([client markedRange], NSMakeRange(1, 1)));
    [client insertText:@"你好" replacementRange:NSMakeRange(NSNotFound, 0)];
    assert(input->GetValue() == "A你B");
    adapter->Drain([] { return true; });
    assert(input->GetValue() == "A你好B");
    assert(![client hasMarkedText]);
    std::cout << "PASS Cocoa preedit queue and commit at safe native entry\n";

    // Real input methods clear preedit with an empty setMarkedText callback.
    // Match AppKit's public marking state before and after the safe replay,
    // retaining the session's rollback until an explicit cancellation.
    NSTextView* reference = [[NSTextView alloc] initWithFrame:NSZeroRect];
    [reference setMarkedText:@"ni"
               selectedRange:NSMakeRange(2, 0)
            replacementRange:NSMakeRange(NSNotFound, 0)];
    [reference setMarkedText:@""
               selectedRange:NSMakeRange(0, 0)
            replacementRange:NSMakeRange(NSNotFound, 0)];
    assert(!reference.hasMarkedText);
    assert(reference.markedRange.length == 0);
    session->SetSelection({1, 3});
    adapter->Activate(session);
    [client setMarkedText:@"ni"
            selectedRange:NSMakeRange(2, 0)
         replacementRange:NSMakeRange(NSNotFound, 0)];
    adapter->Drain([] { return true; });
    [client setMarkedText:@""
            selectedRange:NSMakeRange(0, 0)
         replacementRange:NSMakeRange(NSNotFound, 0)];
    assert([client hasMarkedText] == reference.hasMarkedText);
    assert(NSEqualRanges([client markedRange], NSMakeRange(1, 0)));
    adapter->Drain([] { return true; });
    assert([client hasMarkedText] == reference.hasMarkedText);
    assert(NSEqualRanges([client markedRange], NSMakeRange(1, 0)));
    [client doCommandBySelector:@selector(cancelOperation:)];
    adapter->Drain([] { return true; });
    assert(input->GetValue() == "A你好B");
    [reference release];
    std::cout
        << "PASS empty Cocoa preedit clears marking and preserves rollback\n";

    input->SetValue("A😀中B");
    session->Refresh();
    session->SetSelection({1, 3});
    adapter->Activate(session);
    NSRange actual;
    auto* substring =
        [client attributedSubstringForProposedRange:NSMakeRange(2, 1)
                                        actualRange:&actual];
    assert([substring.string isEqualToString:@"😀"]);
    assert(NSEqualRanges(actual, NSMakeRange(1, 2)));
    [client insertText:@"界" replacementRange:NSMakeRange(1, 3)];
    adapter->Drain([] { return true; });
    assert(input->GetValue() == "A界B");
    std::cout << "PASS Cocoa UTF16 replacement and whole-surrogate queries\n";

    CandidateBounds(client, surface, adapter.get());
    const BOOL density = surface.wantsBestResolutionOpenGLSurface;
    surface.wantsBestResolutionOpenGLSurface = YES;
    CandidateBounds(client, surface, adapter.get());
    surface.wantsBestResolutionOpenGLSurface = density;
    std::cout
        << "PASS candidate screen coordinates at both surface densities\n";

    adapter->SetCaret(
        Rml::Rectanglef::FromPositionSize({120.f, 80.f}, {32.f, 1.f}));
    const NSRect rotated = [client firstRectForCharacterRange:NSMakeRange(1, 0)
                                                  actualRange:&actual];
    const CGFloat ratio = density ? surface.window.backingScaleFactor : 1.;
    assert(std::abs(rotated.size.width - 32. / ratio) < 0.001);
    assert(std::abs(rotated.size.height - 1. / ratio) < 0.001);
    adapter->SetCaret(Rml::Rectanglef::MakeInvalid());
    assert(NSEqualRects([client firstRectForCharacterRange:NSMakeRange(1, 0)
                                               actualRange:&actual],
                        NSZeroRect));
    std::cout
        << "PASS Cocoa preserves projected width and hides invalid caret\n";

    session->SetSelection({1, 2});
    adapter->Activate(session);
    [client setMarkedText:@"pending"
            selectedRange:NSMakeRange(7, 0)
         replacementRange:NSMakeRange(NSNotFound, 0)];
    adapter->Drain([] { return true; });
    [client doCommandBySelector:@selector(cancelOperation:)];
    assert(input->GetValue() == "ApendingB");
    adapter->Drain([] { return true; });
    assert(input->GetValue() == "A界B");
    adapter->Deactivate(false);
    assert(surface.nextResponder == original);
    std::cout << "PASS cancellation and exact responder restoration\n";

    input->SetValue("");
    session->Refresh();
    session->SetSelection({0, 0});
    adapter->Activate(session);
    while (window.pollEvent()) {
      // Drain construction and focus notifications before the key probe.
    }
    NSEvent* key =
        [NSEvent keyEventWithType:NSEventTypeKeyDown
                               location:NSZeroPoint
                          modifierFlags:0
                              timestamp:NSProcessInfo.processInfo.systemUptime
                           windowNumber:native_window.windowNumber
                                context:nil
                             characters:@"a"
            charactersIgnoringModifiers:@"a"
                              isARepeat:NO
                                keyCode:0];
    keyboard.Send(key);
    assert(input->GetValue().empty());
    adapter->Drain([] { return true; });
    const auto native_text = input->GetValue();
    int pressed = 0;
    while (auto event = window.pollEvent()) {
      const auto source = sfmljs::interop::TakeWindowEventSource();
      if (const auto* pressed_event = event->getIf<sf::Event::KeyPressed>()) {
        ++pressed;
        const bool consumed = adapter->Consume(context, *event, source);
        if (!consumed) {
          std::cerr << "IME source diagnostic: key="
                    << static_cast<int>(pressed_event->code)
                    << " scancode=" << static_cast<int>(pressed_event->scancode)
                    << " source=" << static_cast<bool>(source)
                    << " domain=" << (source ? source->domain : 0)
                    << " key_window=" << native_window.isKeyWindow
                    << " client_installed="
                    << (surface.nextResponder == static_cast<id>(client))
                    << " session_valid=" << session->valid() << "\n";
        }
        assert(consumed);
        assert(!adapter->Consume(context, *event, {}));
      } else if (event->is<sf::Event::TextEntered>()) {
        assert(adapter->Consume(context, *event, source));
        assert(!adapter->Consume(context, *event, {}));
      }
    }
    assert(pressed == 1);
    assert(input->GetValue() == native_text);
    std::cout
        << "PASS synthetic Cocoa keyboard routing without SFML duplicates\n";

    input->SetValue("");
    session->Refresh();
    adapter->Activate(session);
    StopAfterKey stop;
    input->AddEventListener("keydown", &stop);
    keyboard.Send(key);
    adapter->Drain([&stop] { return stop.continuing; });
    assert(!stop.continuing);
    assert(input->GetValue().empty());
    input->RemoveEventListener("keydown", &stop);
    while (window.pollEvent()) {
      // The interrupted native key transaction is not retried.
    }
    input->SetValue(native_text);
    session->Refresh();
    std::cout << "PASS interrupted key dispatch stops Cocoa interpretation\n";

    window.setKeyRepeatEnabled(false);
    NSEvent* repeat =
        [NSEvent keyEventWithType:NSEventTypeKeyDown
                               location:NSZeroPoint
                          modifierFlags:0
                              timestamp:NSProcessInfo.processInfo.systemUptime
                           windowNumber:native_window.windowNumber
                                context:nil
                             characters:@"a"
            charactersIgnoringModifiers:@"a"
                              isARepeat:YES
                                keyCode:0];
    keyboard.Send(repeat);
    adapter->Drain([] { return true; });
    assert(input->GetValue() == native_text);
    window.setKeyRepeatEnabled(true);
    adapter->Deactivate(false);
    input->SetValue("A界B");
    session->Refresh();
    std::cout << "PASS SFML disabled key repeat is preserved\n";

    SharedContextRouting(
        context, input, active_input, &window, surface, keyboard);

    sf::RenderWindow second(sf::VideoMode({160, 120}), "Other window");
    auto* other_window =
        static_cast<NSWindow*>(static_cast<id>(second.getNativeHandle()));
    auto* other_surface = Surface(other_window.contentView);
    NSResponder* other_original = other_surface.nextResponder;
    adapter->Activate(session);
    assert(other_surface.nextResponder == other_original);
    adapter->Deactivate(false);
    second.close();
    std::cout << "PASS independent window responder ownership\n";

    adapter->Activate(session);
    [client setMarkedText:@"destroy"
            selectedRange:NSMakeRange(7, 0)
         replacementRange:NSMakeRange(NSNotFound, 0)];
    adapter->Deactivate(true);
    [client insertText:@"ignored" replacementRange:NSMakeRange(NSNotFound, 0)];
    adapter->Drain([] { return true; });
    assert(input->GetValue() == "A界B");
    assert(!session->valid());
    assert(surface.nextResponder == original);
    session = std::make_shared<TextInputSession>(active_input(), input);
    session->SetSelection({1, 2});
    adapter->Activate(session);
    [client setMarkedText:@"close"
            selectedRange:NSMakeRange(5, 0)
         replacementRange:NSMakeRange(NSNotFound, 0)];
    adapter->Drain([] { return true; });
    assert(input->GetValue() == "AcloseB");
    window.close();
    adapter->Drain([] { return true; });
    assert(input->GetValue() == "A界B");
    assert(!adapter->MatchesWindow(&window));
    window.create(sf::VideoMode({320, 200}), "Recreated IME window");
    assert(!adapter->MatchesWindow(&window));
    auto recreated = NativeTextInput::Create(&window);
    assert(recreated && recreated->MatchesWindow(&window));
    std::cout
        << "PASS window close cancels and recreation gets a new adapter\n";
    document->Close();
    context->Update();
    window.close();
    std::cout << "PASS destruction drops pending and late Cocoa edits\n";
  }
}
