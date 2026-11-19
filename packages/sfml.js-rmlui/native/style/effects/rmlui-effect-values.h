// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_EFFECT_VALUES_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_EFFECT_VALUES_H_

#include <RmlUi/Core/Variant.h>
#include <nan.h>

namespace sfmlrmlui {

// Generation-owned references preserve the native shared-pointer identity.
// Release before stylesheet specifications and effect instancers shut down.
v8::Local<v8::Object> EffectValueToJs(const Rml::Variant& value);
bool EffectValueFromJs(v8::Local<v8::Object> object,
                       Rml::Variant::Type type,
                       Rml::Variant* result);
void ReleaseEffectValues();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_EFFECT_VALUES_H_
