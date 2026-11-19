// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_EVENT_SOURCE_H_
#define PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_EVENT_SOURCE_H_

#include <nan.h>

#include <cstdint>
#include <memory>
#include <utility>

#include "shared-handle.h"
#include "window-input-backend.h"
#include <SFML/Window/Event.hpp>

namespace sfmljs::interop {

// Addons choose a domain for their opaque payload. SFML retains the source on
// the actual queued event; the host's public key/text stream remains intact.
struct WindowEventSource {
  uint64_t domain;
  std::shared_ptr<void> payload;
};

namespace detail {

struct PolledWindowEvent {
  sf::Event event;
  std::shared_ptr<WindowEventSource> source;
};

inline v8::Local<v8::String> EventSourceKey() {
  return Nan::New("sfml.window.event.source.v1").ToLocalChecked();
}

inline v8::Local<v8::String> EventSourcePointerKey() {
  return Nan::New("sfml.window.event.source.pointer.v1").ToLocalChecked();
}

inline bool SameSourceEvent(const sf::Event& first, const sf::Event& second) {
  if (const auto* key = first.getIf<sf::Event::KeyPressed>()) {
    const auto* other = second.getIf<sf::Event::KeyPressed>();
    return other && key->code == other->code &&
           key->scancode == other->scancode && key->alt == other->alt &&
           key->control == other->control && key->shift == other->shift &&
           key->system == other->system;
  }
  if (const auto* text = first.getIf<sf::Event::TextEntered>()) {
    const auto* other = second.getIf<sf::Event::TextEntered>();
    return other && text->unicode == other->unicode;
  }
  return false;
}

}  // namespace detail

inline bool HasWindowEventSources() {
  const auto& backend = detail::EventSourceBackend();
  return backend.set && backend.take;
}

// Call only during Cocoa responder delivery. The patched SFML backend restores
// an outer delivery's source when nested delivery ends, including early exits.
inline void CaptureWindowEventSource(
    const std::shared_ptr<WindowEventSource>& source) {
  if (const auto set = detail::EventSourceBackend().set) {
    const std::shared_ptr<void> opaque = source;
    set(&opaque);
  }
}

// Call immediately after pollEvent/waitEvent, before another native poll.
inline std::shared_ptr<WindowEventSource> TakeWindowEventSource() {
  const auto take = detail::EventSourceBackend().take;
  if (!take) {
    return {};
  }
  std::shared_ptr<void> opaque;
  take(&opaque);
  return std::static_pointer_cast<WindowEventSource>(std::move(opaque));
}

// Only this native snapshot receives the private owner. JS spreads, Event
// construction, and JSON serialization produce independent public payloads.
inline void AttachWindowEventSource(v8::Local<v8::Object> result,
                                    const sf::Event& event) {
  auto source = TakeWindowEventSource();
  if (!source) {
    return;
  }
  auto retained = std::make_shared<detail::PolledWindowEvent>(
      detail::PolledWindowEvent{event, std::move(source)});
  auto handle = SharedHandle<detail::PolledWindowEvent>::Create(retained);
  // An External inside a private, owning object is safe across addon DSOs;
  // per-instantiation SharedHandle identity addresses are deliberately unused.
  Nan::SetPrivate(handle,
                  detail::EventSourcePointerKey(),
                  Nan::New<v8::External>(retained.get()))
      .FromJust();
  Nan::SetPrivate(result, detail::EventSourceKey(), handle).FromJust();
}

inline std::shared_ptr<WindowEventSource> ReadWindowEventSource(
    v8::Local<v8::Value> data, const sf::Event& event) {
  if (!data->IsObject()) {
    return {};
  }
  v8::Local<v8::Value> owner;
  v8::Local<v8::Value> pointer;
  if (!Nan::GetPrivate(data.As<v8::Object>(), detail::EventSourceKey())
           .ToLocal(&owner) ||
      !owner->IsObject() ||
      !Nan::GetPrivate(owner.As<v8::Object>(), detail::EventSourcePointerKey())
           .ToLocal(&pointer) ||
      !pointer->IsExternal()) {
    return {};
  }
  const auto* retained = static_cast<const detail::PolledWindowEvent*>(
      pointer.As<v8::External>()->Value());
  // Mutating a public key/text field invalidates provenance for that payload.
  return retained && detail::SameSourceEvent(retained->event, event)
             ? retained->source
             : nullptr;
}

}  // namespace sfmljs::interop

#endif  // PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_EVENT_SOURCE_H_
