// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_EVENTS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_EVENTS_H_

#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/Event.h>
#include <sfml-js-interop.h>

#include <optional>
#include <vector>

namespace sfmlrmlui {

// Dispatch handles borrow an expiring event. Direct instancing additionally
// owns EventPtr; observer guards reject pointers destroyed outside dispatch.
struct EventState {
  ~EventState();
  Rml::Event* event{nullptr};
  std::weak_ptr<Rml::ScriptInterface*> variant_pointer;
  Rml::EventPtr owned;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
  std::vector<Rml::ObserverPtr<Rml::Element>> references;
  std::optional<Rml::ObserverPtr<Rml::Element>> current_reference;
  bool processing_default_action{false};
  bool processing_listener{false};
};

using EventHandle = sfmljs::SharedHandle<EventState>;

Rml::Event* EventOf(v8::Local<v8::Value> value);

// The upstream Context drag generator uses an unguarded Element* only for
// drag events under this exact key. Other opaque pointers remain untrusted.
bool IsNativeDragElementParameter(const Rml::Event& event,
                                  const Rml::String& key,
                                  const Rml::Variant& value);

void InvokeEventCallback(Rml::Event* event, v8::Local<v8::Function> callback);
v8::MaybeLocal<v8::Object> WrapEventData(const Rml::Event& event,
                                         v8::Local<v8::Object> handle);

// Native-owned trees root callbacks; detached trees retain callbacks through
// their V8 root handle so closure/element cycles remain collectible.
void RefreshEventListenerOwnership(bool allow_rebuild = true);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_EVENTS_H_
