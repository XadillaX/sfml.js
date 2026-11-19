// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_EFFECT_CALLBACKS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_EFFECT_CALLBACKS_H_

#include <RmlUi/Core/FontEffect.h>
#include <nan.h>

namespace sfmlrmlui {

struct GlyphDestination;

Rml::SharedPtr<Rml::FontEffect> CreateFontEffectCallbacks(
    v8::Local<v8::Array> functions);
bool IsCustomFontEffect(const Rml::FontEffect* value);
void BindFontEffectCallbacks(v8::Local<v8::Object> handle,
                             const Rml::FontEffect* value);
// Pin a handoff until the outer runtime boundary resolves actual owners.
void RetainFontEffectCallbacks(const Rml::FontEffect* value);
void RetainFontEffectValueCallbacks(const Rml::Variant& value);
void RefreshFontEffectOwnership();
// Manual destinations can be transferred or resized by a captured JS closure.
// Check the original view after the callback, before committing scratch bytes.
void GenerateCustomFontGlyphTexture(const Rml::FontEffect* effect,
                                    const GlyphDestination& destination,
                                    const Rml::FontGlyph& glyph,
                                    v8::Local<v8::Uint8Array> view);
void ReleaseFontEffectCallbacks();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_EFFECT_CALLBACKS_H_
