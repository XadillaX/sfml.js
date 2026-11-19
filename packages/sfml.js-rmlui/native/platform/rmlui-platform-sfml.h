// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Adapted from RmlUi Backends/RmlUi_Platform_SFML.cpp (MIT license),
// reduced to the SFML 3 API used by sfml.js.

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_RMLUI_PLATFORM_SFML_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_RMLUI_PLATFORM_SFML_H_

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Input.h>

#include <SFML/Window/Event.hpp>

namespace sfmlrmlui::platform {

// Forward an SFML 3 event to the RmlUi context.
// @return Propagation for key/text/wheel; non-interaction for mouse/touch.
bool InputHandler(Rml::Context* context, const sf::Event& event);

// Convert an SFML key code to an RmlUi key identifier.
Rml::Input::KeyIdentifier ConvertKey(sf::Keyboard::Key sfml_key);

// Read the current modifier key state as an RmlUi bitmask.
int GetKeyModifierState();

}  // namespace sfmlrmlui::platform

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_RMLUI_PLATFORM_SFML_H_
