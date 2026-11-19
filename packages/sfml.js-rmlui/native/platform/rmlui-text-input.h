// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_RMLUI_TEXT_INPUT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_RMLUI_TEXT_INPUT_H_

#include <RmlUi/Core/Types.h>
#include <nan.h>

#include <memory>

namespace Rml {
class TextInputHandler;
}

namespace sfmlrmlui {

struct TextInputHandlerState;
struct ContextInputOwnership;
struct ContextState;

bool ReadTextInputHandler(v8::Local<v8::Value> input,
                          Rml::TextInputHandler** output);
v8::Local<v8::Value> WrapTextInputHandler(Rml::TextInputHandler* handler);
void TrackContextTextInputHandler(const std::shared_ptr<ContextState>& token);
void InstallTextInputNotifications();
void RefreshTextInputOwnership();
void DrainTextInputDestroyCallbacks();
// After native widgets, contexts and the upstream default handler are gone.
void ReleaseTextInputBindings();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_RMLUI_TEXT_INPUT_H_
