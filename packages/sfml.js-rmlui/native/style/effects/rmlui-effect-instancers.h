// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_EFFECT_INSTANCERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_EFFECT_INSTANCERS_H_

#include <RmlUi/Core/Decorator.h>
#include <RmlUi/Core/Filter.h>
#include <RmlUi/Core/FontEffectInstancer.h>
#include <nan.h>

namespace sfmlrmlui {

// Typed generation references shared by factory lookup and effect lists.
template <typename T>
v8::Local<v8::Value> WrapEffectInstancer(T* pointer);
template <typename T>
bool ReadEffectInstancer(v8::Local<v8::Value> input, T** pointer);
void ReleaseEffectInstancers();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_EFFECT_INSTANCERS_H_
