// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_EFFECT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_EFFECT_H_

#include <RmlUi/Core/FontEffect.h>
#include <nan.h>

namespace sfmlrmlui {

v8::Local<v8::Object> WrapFontEffect(
    const Rml::SharedPtr<const Rml::FontEffect>& value);
bool CopyFontEffect(v8::Local<v8::Value> handle,
                    Rml::SharedPtr<const Rml::FontEffect>* result);
// Native parsers set metadata on the result. Preserve the source snapshot.
Rml::SharedPtr<Rml::FontEffect> CloneFontEffect(v8::Local<v8::Value> handle);
void ReleaseFontEffects();
// Resolve flattened metadata facades without relying on RTTI.
const Rml::FontEffect* FontEffectImplementation(const Rml::FontEffect* value);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_EFFECT_H_
