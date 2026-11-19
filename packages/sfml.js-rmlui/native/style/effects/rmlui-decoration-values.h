// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_DECORATION_VALUES_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_DECORATION_VALUES_H_

#include <RmlUi/Core/DecorationTypes.h>
#include <nan.h>

namespace sfmlrmlui {

// Detached structural snapshots. Colors retain premultiplied bytes; numeric
// components retain their native units. Neither direction borrows DOM memory.
v8::Local<v8::Object> ColorStopsToJs(const Rml::ColorStopList& values);
v8::Local<v8::Object> BoxShadowsToJs(const Rml::BoxShadowList& values);
bool ColorStopsFromJs(v8::Local<v8::Object> value, Rml::ColorStopList* result);
bool BoxShadowsFromJs(v8::Local<v8::Object> value, Rml::BoxShadowList* result);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_DECORATION_VALUES_H_
