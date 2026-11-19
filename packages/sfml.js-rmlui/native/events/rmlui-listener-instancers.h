// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_LISTENER_INSTANCERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_LISTENER_INSTANCERS_H_

#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/Event.h>
#include <RmlUi/Core/EventListener.h>
#include <nan.h>

#include <functional>
#include <memory>

namespace sfmlrmlui {

struct LuaHost;

// Used by document hosts so inline listeners share the checked, GC-visible
// ownership and direct Factory facade of all other typed event listeners.
Rml::EventListener* CreateCapturedEventListener(
    v8::Local<v8::Function> callback);
Rml::EventListener* CreateNativeEventListener(
    std::function<void(Rml::Event*)> callback,
    std::shared_ptr<LuaHost> lua_host = nullptr);

void AddTypedEventListener(Rml::Element* element,
                           v8::Local<v8::Value> listener,
                           Rml::EventId id,
                           bool capture);
void RemoveTypedEventListener(Rml::Element* element,
                              v8::Local<v8::Value> listener,
                              Rml::EventId id,
                              bool capture);
void DrainListenerNotifications();
void RefreshTypedListenerOwnership();
void ReleaseListenerInstancers();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_LISTENER_INSTANCERS_H_
