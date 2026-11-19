// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_PLATFORM_IME_MACOS_COCOA_KEYBOARD_FIXTURE_H_
#define PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_PLATFORM_IME_MACOS_COCOA_KEYBOARD_FIXTURE_H_

#import <AppKit/AppKit.h>
#import <objc/runtime.h>

#include <cassert>

namespace sfmlrmlui::test {
namespace keyboard_fixture {

inline thread_local bool sending{false};

inline void KeyDown(id surface, SEL selector, NSEvent* event) {
  if (!sending) {
    return;
  }
  const Class base = class_getSuperclass(object_getClass(surface));
  const IMP implementation = class_getMethodImplementation(base, selector);
  reinterpret_cast<void (*)(id, SEL, NSEvent*)>(implementation)(
      surface, selector, event);
}

}  // namespace keyboard_fixture

// This surface accepts explicitly sent synthetic keys only. Desktop typing
// cannot introduce extra events while SFML pumps the native event queue.
// The original class and all other views remain untouched outside this scope.
class CocoaKeyboardFixture final {
 public:
  explicit CocoaKeyboardFixture(NSOpenGLView* surface)
      : surface_([surface retain]), original_(object_getClass(surface)) {
    Class subclass = objc_getClass("SFMLRmlSyntheticKeyboardFixture");
    if (!subclass) {
      subclass = objc_allocateClassPair(
          original_, "SFMLRmlSyntheticKeyboardFixture", 0);
      assert(subclass);
      for (const SEL selector :
           { @selector(keyDown:), @selector(flagsChanged:) }) {
        const Method method = class_getInstanceMethod(original_, selector);
        assert(method);
        assert(class_addMethod(subclass,
                               selector,
                               reinterpret_cast<IMP>(keyboard_fixture::KeyDown),
                               method_getTypeEncoding(method)));
      }
      objc_registerClassPair(subclass);
    }
    assert(class_getSuperclass(subclass) == original_);
    object_setClass(surface_, subclass);
  }

  ~CocoaKeyboardFixture() {
    object_setClass(surface_, original_);
    [surface_ release];
  }

  void Send(NSEvent* event) const {
    const bool previous = keyboard_fixture::sending;
    keyboard_fixture::sending = true;
    @try {
      [surface_ keyDown:event];
    } @finally {
      keyboard_fixture::sending = previous;
    }
  }

 private:
  NSOpenGLView* surface_;
  Class original_;
};

}  // namespace sfmlrmlui::test

#endif  // PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_PLATFORM_IME_MACOS_COCOA_KEYBOARD_FIXTURE_H_
