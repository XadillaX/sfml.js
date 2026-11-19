// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#import <AppKit/AppKit.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>
#import <objc/runtime.h>

#include <cassert>
#include <iostream>
#include <string>

#include "native/platform/ime/platform-text-input.h"

namespace {

BOOL IsKeyWindow(id, SEL) {
  return YES;
}

class ScopedKeyWindow final {
 public:
  explicit ScopedKeyWindow(NSWindow* window)
      : window_(window), original_(object_getClass(window)) {
    Class subclass = objc_getClass("SFMLRmlKeyFocusFixture");
    if (!subclass) {
      subclass = objc_allocateClassPair(original_, "SFMLRmlKeyFocusFixture", 0);
      const Method method =
          class_getInstanceMethod(original_, @selector(isKeyWindow));
      assert(subclass && method);
      class_addMethod(subclass,
                      @selector(isKeyWindow),
                      reinterpret_cast<IMP>(IsKeyWindow),
                      method_getTypeEncoding(method));
      objc_registerClassPair(subclass);
    }
    object_setClass(window_, subclass);
  }

  ~ScopedKeyWindow() { object_setClass(window_, original_); }

 private:
  NSWindow* window_;
  Class original_;
};

thread_local int activation_calls = 0;

// Observe this instance while preserving the real Cocoa implementation.
// Its original class is restored before the fixture releases the context.
void ObserveActivation(id context, SEL selector) {
  ++activation_calls;
  const Class base = class_getSuperclass(object_getClass(context));
  const IMP implementation = class_getMethodImplementation(base, selector);
  reinterpret_cast<void (*)(id, SEL)>(implementation)(context, selector);
}

class ScopedActivationProbe final {
 public:
  explicit ScopedActivationProbe(NSTextInputContext* context)
      : context_(context), original_(object_getClass(context)) {
    Class subclass = objc_getClass("SFMLRmlActivationProbe");
    if (!subclass) {
      subclass = objc_allocateClassPair(original_, "SFMLRmlActivationProbe", 0);
      const Method method =
          class_getInstanceMethod(original_, @selector(activate));
      assert(subclass && method);
      class_addMethod(subclass,
                      @selector(activate),
                      reinterpret_cast<IMP>(ObserveActivation),
                      method_getTypeEncoding(method));
      objc_registerClassPair(subclass);
    }
    activation_calls = 0;
    object_setClass(context_, subclass);
  }

  ~ScopedActivationProbe() { object_setClass(context_, original_); }

 private:
  NSTextInputContext* context_;
  Class original_;
};

void FailFocusOperation(id context, SEL) {
  object_setClass(context, class_getSuperclass(object_getClass(context)));
  @throw [NSException exceptionWithName:@"SFMLRmlFocusFailure"  // NOLINT
                                 reason:@"Injected Cocoa focus exception"
                               userInfo:nil];
}

void FailNextOperation(NSTextInputContext* context,
                       SEL selector,
                       const char* name) {
  const Class base = object_getClass(context);
  Class subclass = objc_getClass(name);
  if (!subclass) {
    subclass = objc_allocateClassPair(base, name, 0);
    const Method method = class_getInstanceMethod(base, selector);
    assert(subclass && method);
    class_addMethod(subclass,
                    selector,
                    reinterpret_cast<IMP>(FailFocusOperation),
                    method_getTypeEncoding(method));
    objc_registerClassPair(subclass);
  }
  // Inject into this instance only and restore its class before throwing.
  object_setClass(context, subclass);
}

void CheckSnapshot(id<NSTextInputClient> client, NSString* expected) {
  NSRange actual;
  auto* snapshot = [client
      attributedSubstringForProposedRange:NSMakeRange(0, expected.length)
                              actualRange:&actual];
  assert([snapshot.string isEqualToString:expected]);
  assert(NSEqualRanges(actual, NSMakeRange(0, expected.length)));
}

}  // namespace

void PlatformFocusExceptionContracts(NSOpenGLView* surface,
                                     Rml::TextInputContext* first_input,
                                     Rml::ElementFormControlInput* first,
                                     Rml::TextInputContext* second_input,
                                     Rml::ElementFormControlInput* second) {
  using sfmlrmlui::PlatformTextInputFocus;

  // A CLI fixture has no desktop key-window guarantee. Force only this
  // instance's status to exercise activation; this is synthetic API evidence.
  ScopedKeyWindow key_window(surface.window);
  NSResponder* responder = surface.nextResponder;
  auto client = static_cast<id<NSTextInputClient>>(responder);
  auto* context = [responder inputContext];
  assert(context);

  struct Operation {
    SEL selector;
    const char* subclass;
    const char* description;
    bool switching;
  };
  const Operation operations[] = {
      {@selector(deactivate), "SFMLRmlFailFocusDeactivate", "deactivate", true},
      {@selector(discardMarkedText),
       "SFMLRmlFailFocusDiscard",
       "discard",
       true},
      {@selector(activate), "SFMLRmlFailFocusActivate", "activate", true},
      {@selector(deactivate),
       "SFMLRmlFailFocusDeactivate",
       "deactivate",
       false},
      {@selector(discardMarkedText),
       "SFMLRmlFailFocusDiscard",
       "discard",
       false},
  };
  for (const auto& operation : operations) {
    const std::string committed = first->GetValue();
    [client setMarkedText:@"pending"
            selectedRange:NSMakeRange(7, 0)
         replacementRange:NSMakeRange(0, 0)];
    sfmlrmlui::DrainPlatformTextInput(first->GetContext());
    const auto preedit = "pending" + committed;
    assert(first->GetValue() == preedit);
    auto* expected = [NSString stringWithUTF8String:preedit.c_str()];
    assert([client hasMarkedText]);

    FailNextOperation(context, operation.selector, operation.subclass);
    bool failed = false;
    @try {
      if (operation.switching) {
        PlatformTextInputFocus(second_input, second, true);
      } else {
        PlatformTextInputFocus(first_input, first, false);
      }
    } @catch (NSException* error) {
      failed = [error.name isEqualToString:@"SFMLRmlFocusFailure"];
    }
    assert(failed);
    assert(surface.nextResponder == responder);
    assert(first->GetValue() == preedit);
    CheckSnapshot(client, expected);
    // This call follows the registry's same-input fast path. Its result must
    // still refer to the same widget as Cocoa, without a hidden focus repair.
    PlatformTextInputFocus(first_input, first, true);
    CheckSnapshot(client, expected);
    assert([client hasMarkedText]);
    [client insertText:@"中" replacementRange:NSMakeRange(NSNotFound, 0)];
    sfmlrmlui::DrainPlatformTextInput(first->GetContext());
    assert(first->GetValue() == "中" + committed);
    assert(![client hasMarkedText]);
    std::cout << "PASS synthetic Cocoa " << operation.description
              << (operation.switching ? " switch" : " blur")
              << " exception preserves composition and permits commit\n";
  }

  [context deactivate];
  ScopedActivationProbe activation(context);
  [NSNotificationCenter.defaultCenter
      postNotificationName:NSWindowDidBecomeKeyNotification
                    object:surface.window];
  assert(activation_calls == 0);
  sfmlrmlui::DrainPlatformTextInput(first->GetContext());
  assert(activation_calls == 1);
  CheckSnapshot(client,
                [NSString stringWithUTF8String:first->GetValue().c_str()]);
  std::cout << "PASS synthetic Cocoa key-window regain activates the input "
               "context at drain\n";

  [NSNotificationCenter.defaultCenter
      postNotificationName:NSWindowDidBecomeKeyNotification
                    object:surface.window];
  assert(activation_calls == 1);
  PlatformTextInputFocus(first_input, first, false);
  sfmlrmlui::DrainPlatformTextInput(first->GetContext());
  assert(activation_calls == 1);
  std::cout << "PASS synthetic Cocoa retired focus drops queued "
               "input-context activation\n";
  PlatformTextInputFocus(first_input, first, true);
}
