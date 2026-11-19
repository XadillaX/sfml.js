// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_VALUES_RMLUI_STYLE_VALUES_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_VALUES_RMLUI_STYLE_VALUES_H_

#include <RmlUi/Core/StyleTypes.h>
#include <nan.h>

namespace sfmlrmlui {

// Only plain native scalar structs are shared with JS. Copies validate mapped
// enum and float fields before passing them to RmlUi bitfields or arithmetic.
#define SFMLRMLUI_STYLE_VALUE(Type)                                            \
  v8::Local<v8::Object> StyleValueToJs(Rml::Style::Type value);                \
  bool ReadStyleValue(v8::Local<v8::Value> handle, Rml::Style::Type* value)

SFMLRMLUI_STYLE_VALUE(LengthPercentageAuto);
SFMLRMLUI_STYLE_VALUE(LengthPercentage);
SFMLRMLUI_STYLE_VALUE(NumberAuto);
SFMLRMLUI_STYLE_VALUE(VerticalAlign);
SFMLRMLUI_STYLE_VALUE(LineHeight);
SFMLRMLUI_STYLE_VALUE(Clip);

#undef SFMLRMLUI_STYLE_VALUE

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_VALUES_RMLUI_STYLE_VALUES_H_
