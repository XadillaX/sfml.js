// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_MACOS_TEXT_INPUT_CLIENT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_MACOS_TEXT_INPUT_CLIENT_H_

#import <AppKit/AppKit.h>
#include <RmlUi/Core/ObserverPtr.h>

#include <deque>
#include <functional>
#include <memory>

#include "native/platform/ime/macos/text-input-snapshot.h"
#include "native/platform/ime/native-text-input.h"

struct SFMLRmlPendingInput {
  std::shared_ptr<sfmlrmlui::ime::TextInputSession> session;
  std::function<void()> action;
  bool key_event{false};
};

struct SFMLRmlKeySource {
  uint64_t identity{0};
  Rml::Context* context{nullptr};
  Rml::ObserverPtr<Rml::Element> root;
  bool consumed{false};
};

@interface SFMLRmlTextInputClient : NSResponder {
 @private  // NOLINT
  NSOpenGLView* surface;
  NSTextInputContext* input_context;
  NSString* text;
  std::shared_ptr<sfmlrmlui::ime::TextInputSession> session;
  std::deque<SFMLRmlPendingInput> pending;
  uint64_t source_identity;
  NSRange selection;
  NSRange marked;
  Rml::Rectanglef caret;
  int modifiers;
  BOOL accepting;
  BOOL draining;
  BOOL closed;
  NSEvent* owned_key_event;
  size_t key_repeat_offset;
  const std::function<bool()>* continuation;
}

- (instancetype)initWithSurface:(NSOpenGLView*)surface  // NOLINT
                keyRepeatOffset:(size_t)offset;         // NOLINT
- (void)drain:(const std::function<bool()>&)can_continue;
- (BOOL)consume:(const sf::Event&)event
        context:(Rml::Context*)context
         source:
             (const std::shared_ptr<sfmljs::interop::WindowEventSource>&)source;
- (BOOL)matchesWindow:(id)handle;
- (BOOL)sfmljsOwnsTextInputEvent:(NSEvent*)event;  // NOLINT

- (void)submit:(std::function<void()>)action;
- (void)interpretEvent:(NSEvent*)event;             // NOLINT
- (void)windowWillClose:(NSNotification*)notice;    // NOLINT
- (void)windowResignedKey:(NSNotification*)notice;  // NOLINT
- (void)windowBecameKey:(NSNotification*)notice;    // NOLINT

@end

@interface SFMLRmlTextInputClient (Focus)  // NOLINT
- (void)activate:(std::shared_ptr<sfmlrmlui::ime::TextInputSession>)session;
- (void)deactivate:(BOOL)destroyed;
@end

// cpplint treats required Objective-C selector syntax as C++ casts/calls.
// Exempt only those declaration lines; implementation C++ remains checked.
@interface SFMLRmlTextInputClient (Editing)<NSTextInputClient>  // NOLINT
- (void)setCaret:(Rml::Rectanglef)bounds;                       // NOLINT
- (void)syncSnapshot;
- (void)applySnapshot:(sfmlrmlui::ime::CocoaTextSnapshot)snapshot;  // NOLINT
- (void)replaceSnapshot:(NSString*)text range:(NSRange)range;       // NOLINT
@end

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_MACOS_TEXT_INPUT_CLIENT_H_
