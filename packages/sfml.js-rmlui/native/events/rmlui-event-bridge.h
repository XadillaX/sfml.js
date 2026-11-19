// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_EVENT_BRIDGE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_EVENT_BRIDGE_H_

#include <nan.h>

#include <optional>

#include <SFML/Window/Event.hpp>

namespace sfmlrmlui {

// Rebuild the tagged sf::Event variant from the plain data object published
// by sfml.js, so the RmlUi platform handler sees the same event shape.
std::optional<sf::Event> BuildWindowEvent(v8::Local<v8::Value> value);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_EVENTS_RMLUI_EVENT_BRIDGE_H_
