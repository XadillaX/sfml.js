// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_PLATFORM_TEXT_INPUT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_PLATFORM_TEXT_INPUT_H_

#include <RmlUi/Core/Types.h>
#include <window-event-source.h>

#include <SFML/Graphics/RenderWindow.hpp>
#include <SFML/Window/Event.hpp>

namespace Rml {
class Context;
class Element;
class TextInputContext;
}  // namespace Rml

namespace sfmlrmlui {

// These functions run inside RuntimeScope, including lifetime invalidation.
void PlatformTextInputFocus(Rml::TextInputContext* input,
                            Rml::Element* element,
                            bool active);
void PlatformTextInputDestroyed(Rml::TextInputContext* input);
void PlatformTextInputCaret(Rml::Element* element,
                            Rml::Vector2f position,
                            float height);
bool ConsumePlatformTextInput(
    Rml::Context* context,
    const sf::Event& event,
    const std::shared_ptr<sfmljs::interop::WindowEventSource>& source);
void DrainPlatformTextInput(Rml::Context* context);
void ReleasePlatformTextInputContext(Rml::Context* context);
void ReleasePlatformTextInput();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_PLATFORM_TEXT_INPUT_H_
