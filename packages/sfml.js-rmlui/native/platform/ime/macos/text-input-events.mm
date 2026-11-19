// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#import <objc/runtime.h>

#include <algorithm>
#include <atomic>
#include <cstring>
#include <utility>

#import "native/platform/ime/macos/text-input-client.h"
#include "native/platform/rmlui-platform-sfml.h"

// SFML's Cocoa backend supplies this conversion. Check its availability before
// installing the responder rather than guessing hardware/layout mappings.
@interface NSOpenGLView (SFMLRmlKeyboardConversion)  // NOLINT
+ (BOOL)sfmljsSupportsNativeTextInput;
+ (sf::Event::KeyPressed)convertNSKeyDownEventToSFMLEvent:
    (NSEvent*)event;  // NOLINT
@end

namespace {

constexpr uint64_t kTextInputSourceDomain = 0x726d6c7569696d65;

uint64_t NextSourceIdentity() {
  static std::atomic<uint64_t> next{1};
  return next.fetch_add(1, std::memory_order_relaxed);
}

int Modifiers(NSEvent* event) {
  const auto flags = event.modifierFlags;
  return ((flags & NSEventModifierFlagControl) ? Rml::Input::KM_CTRL : 0) |
         ((flags & NSEventModifierFlagShift) ? Rml::Input::KM_SHIFT : 0) |
         ((flags & NSEventModifierFlagOption) ? Rml::Input::KM_ALT : 0) |
         ((flags & NSEventModifierFlagCommand) ? Rml::Input::KM_META : 0);
}

bool TextKey(const sf::Event::KeyPressed& key) {
  using Key = sf::Keyboard::Key;
  return !key.control && !key.system &&
         ((key.code >= Key::A && key.code <= Key::Num9) ||
          (key.code >= Key::Semicolon && key.code <= Key::Apostrophe) ||
          key.code == Key::Space);
}

}  // namespace

@implementation SFMLRmlTextInputClient

- (instancetype)initWithSurface:(NSOpenGLView*)view  // NOLINT
                keyRepeatOffset:(size_t)offset {     // NOLINT
  self = [super init];
  if (self) {
    source_identity = NextSourceIdentity();
    surface = [view retain];
    text = [@"" retain];
    selection = NSMakeRange(0, 0);
    marked = NSMakeRange(NSNotFound, 0);
    caret = Rml::Rectanglef::MakeInvalid();
    key_repeat_offset = offset;
    input_context = [[NSTextInputContext alloc] initWithClient:self];
    [NSNotificationCenter.defaultCenter
        addObserver:self
           selector:@selector(windowWillClose:)
               name:NSWindowWillCloseNotification
             object:view.window];
    [NSNotificationCenter.defaultCenter
        addObserver:self
           selector:@selector(windowResignedKey:)
               name:NSWindowDidResignKeyNotification
             object:view.window];
    [NSNotificationCenter.defaultCenter
        addObserver:self
           selector:@selector(windowBecameKey:)
               name:NSWindowDidBecomeKeyNotification
             object:view.window];
  }
  return self;
}

- (void)dealloc {
  [self deactivate:YES];
  [NSNotificationCenter.defaultCenter removeObserver:self];
  [input_context release];
  [text release];
  [surface release];
  [super dealloc];
}

- (NSTextInputContext*)inputContext {  // NOLINT
  return input_context;
}

- (BOOL)matchesWindow:(id)handle {
  return !closed && surface.window &&
         (handle == surface.window ||
          ([handle isKindOfClass:NSView.class] &&
           [surface isDescendantOf:static_cast<NSView*>(handle)]));
}

- (void)windowWillClose:(NSNotification*)notice {  // NOLINT
  (void)notice;
  // The notification can run outside a RmlUi entry. Retain only a cancellation
  // request; native widget access waits until drain or runtime destruction.
  closed = YES;
  accepting = NO;
  pending.clear();
  [input_context discardMarkedText];
  [input_context deactivate];
}

- (void)windowResignedKey:(NSNotification*)notice {  // NOLINT
  (void)notice;
  if (accepting && session) {
    auto active_session = session;
    [self submit:[active_session] { active_session->Cancel(); }];
    [input_context discardMarkedText];
    [input_context deactivate];
  }
}

- (void)windowBecameKey:(NSNotification*)notice {  // NOLINT
  (void)notice;
  // Activation can invoke the input method's client callbacks. Run it after
  // any queued cancellation and only while this window still owns key focus.
  [self submit:[self] {
    if (!closed && accepting && surface.window.isKeyWindow) {
      [input_context activate];
    }
  }];
}

- (void)submit:(std::function<void()>)action {
  if (!accepting || !session || (continuation && !(*continuation)())) {
    return;
  }
  if (draining) {
    action();
    [self syncSnapshot];
  } else {
    pending.push_back({session, std::move(action)});
  }
}

- (void)keyDown:(NSEvent*)event {  // NOLINT
  owned_key_event = nil;
  if (!accepting || !session) {
    [self.nextResponder keyDown:event];
    return;
  }
  if (event.isARepeat) {
    // SFML forwards to nextResponder before checking this setting. The pinned
    // backend stores a BOOL here; Create validates its type and object bounds
    // before installing the bridge. No SFML field is changed.
    BOOL enabled;
    std::memcpy(&enabled,
                reinterpret_cast<const char*>(surface) + key_repeat_offset,
                sizeof(enabled));
    if (!enabled) {
      return;
    }
  }
  auto forwarded = std::make_shared<SFMLRmlKeySource>();
  forwarded->identity = source_identity;
  auto source = std::make_shared<sfmljs::interop::WindowEventSource>(
      sfmljs::interop::WindowEventSource{kTextInputSourceDomain, forwarded});
  // Keep the event alive across the SFML poll. No RmlUi or host callback runs
  // on this Cocoa stack, including callbacks originating from the input method.
  auto retained = std::shared_ptr<NSEvent>(
      [event retain], [](NSEvent* value) { [value release]; });
  pending.push_back(
      {session,
       [self, retained, forwarded] {
         forwarded->consumed = accepting && session;
         // Earlier queued keys may switch the active context.
         // Duplicate SFML text belongs to this replay target.
         if (forwarded->consumed) {
           forwarded->context = session->element()->GetContext();
           forwarded->root =
               forwarded->context->GetRootElement()->GetObserverPtr();
         }
         [self interpretEvent:retained.get()];
       },
       true});
  owned_key_event = event;
  // SFML emits key/text entries after nextResponder returns. Its delivery
  // scope attaches this source to those exact entries, then restores the
  // previous scope. Polling or discarding an entry cannot leave a key ledger.
  sfmljs::interop::CaptureWindowEventSource(source);
}

- (BOOL)sfmljsOwnsTextInputEvent:(NSEvent*)event {  // NOLINT
  // SFML queries immediately after keyDown returns. No second Cocoa client
  // may interpret an event already queued for this text input context.
  const BOOL owned = owned_key_event == event;
  owned_key_event = nil;
  return owned;
}

- (void)interpretEvent:(NSEvent*)event {  // NOLINT
  if (!session || !session->valid()) {
    return;
  }
  auto active_session = session;
  active_session->Refresh();
  [self syncSnapshot];
  modifiers = Modifiers(event);
  const auto key = [surface.class convertNSKeyDownEventToSFMLEvent:event];
  const bool dispatched = TextKey(key) && !active_session->composition();
  if (dispatched) {
    active_session->element()->GetContext()->ProcessKeyDown(
        sfmlrmlui::platform::ConvertKey(key.code), modifiers);
    active_session->Refresh();
  }
  if (!accepting || session != active_session || !active_session->valid() ||
      (continuation && !(*continuation)())) {
    return;
  }
  const BOOL handled = [input_context handleEvent:event];
  if (!handled && accepting && session == active_session &&
      active_session->valid() && (!continuation || (*continuation)())) {
    auto* owner = active_session->element()->GetContext();
    if (!dispatched) {
      owner->ProcessKeyDown(sfmlrmlui::platform::ConvertKey(key.code),
                            modifiers);
      active_session->Refresh();
    }
  }
  [self syncSnapshot];
}

- (void)drain:(const std::function<bool()>&)can_continue {
  if (draining) {
    return;
  }
  if (closed) {
    [self deactivate:NO];
    return;
  }
  draining = YES;
  continuation = &can_continue;
  try {
    while (!pending.empty() && can_continue()) {
      auto entry = std::move(pending.front());
      pending.pop_front();
      if (accepting && session && session->valid() &&
          (entry.key_event || entry.session == session)) {
        entry.action();
        [self syncSnapshot];
      }
    }
  } catch (...) {
    continuation = nullptr;
    draining = NO;
    throw;
  }
  continuation = nullptr;
  draining = NO;
}

- (BOOL)consume:(const sf::Event&)event
        context:(Rml::Context*)owner
         source:(const std::shared_ptr<sfmljs::interop::WindowEventSource>&)
                    source {
  if (!source || source->domain != kTextInputSourceDomain) {
    return NO;
  }
  const auto forwarded =
      std::static_pointer_cast<SFMLRmlKeySource>(source->payload);
  if (forwarded->identity != source_identity || !forwarded->consumed ||
      !forwarded->root) {
    return NO;
  }
  return event.is<sf::Event::KeyPressed>() ||
         (event.is<sf::Event::TextEntered>() && forwarded->context == owner);
}

@end

namespace sfmlrmlui::ime {
namespace {

NSOpenGLView* FindSurface(NSView* view) {
  if ([view isKindOfClass:NSOpenGLView.class]) {
    return static_cast<NSOpenGLView*>(view);
  }
  for (NSView* child in view.subviews) {
    if (auto* surface = FindSurface(child)) {
      return surface;
    }
  }
  return nil;
}

class MacTextInput final : public NativeTextInput {
 public:
  MacTextInput(sf::RenderWindow* window,
               NSOpenGLView* surface,
               size_t repeat_offset)
      : window_(window),
        client_([[SFMLRmlTextInputClient alloc]
            initWithSurface:surface
            keyRepeatOffset:repeat_offset]) {}

  ~MacTextInput() override { [client_ release]; }

  void Activate(std::shared_ptr<TextInputSession> session) override {
    [client_ activate:std::move(session)];
  }

  void Deactivate(bool destroyed) override {
    [client_ deactivate:destroyed ? YES : NO];
  }

  void SetCaret(Rml::Rectanglef bounds) override { [client_ setCaret:bounds]; }

  void Drain(const std::function<bool()>& can_continue) override {
    if (!window_->isOpen()) {
      [client_ deactivate:NO];
      return;
    }
    [client_ drain:can_continue];
  }

  bool Consume(Rml::Context* context,
               const sf::Event& event,
               const std::shared_ptr<sfmljs::interop::WindowEventSource>&
                   source) override {
    return [client_ consume:event context:context source:source] == YES;
  }

  bool MatchesWindow(sf::RenderWindow* window) const override {
    return window && window->isOpen() &&
           [client_ matchesWindow:static_cast<id>(window->getNativeHandle())];
  }

 private:
  sf::RenderWindow* window_;
  SFMLRmlTextInputClient* client_;
};

}  // namespace

std::unique_ptr<NativeTextInput> NativeTextInput::Create(
    sf::RenderWindow* window) {
  if (!window || !window->isOpen() ||
      !sfmljs::interop::HasWindowEventSources()) {
    return {};
  }
  id handle = static_cast<id>(window->getNativeHandle());
  NSView* content = [handle isKindOfClass:NSWindow.class]
                        ? static_cast<NSWindow*>(handle).contentView
                        : static_cast<NSView*>(handle);
  auto* surface = FindSurface(content);
  if (!surface ||
      ![surface.class respondsToSelector:@selector
                      (convertNSKeyDownEventToSFMLEvent:)] ||
      ![surface.class respondsToSelector:@selector
                      (sfmljsSupportsNativeTextInput)] ||
      ![surface.class sfmljsSupportsNativeTextInput]) {
    return {};
  }
  const Ivar repeat =
      class_getInstanceVariable(surface.class, "m_useKeyRepeat");
  if (!repeat ||
      std::strcmp(ivar_getTypeEncoding(repeat), @encode(BOOL)) != 0) {
    return {};
  }
  const auto offset = ivar_getOffset(repeat);
  const auto size = class_getInstanceSize(surface.class);
  if (offset < 0 || static_cast<size_t>(offset) > size ||
      sizeof(BOOL) > size - static_cast<size_t>(offset)) {
    return {};
  }
  return std::make_unique<MacTextInput>(window, surface, offset);
}

}  // namespace sfmlrmlui::ime
