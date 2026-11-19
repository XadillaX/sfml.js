// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_NUMERIC_VALUE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_NUMERIC_VALUE_H_

#include <RmlUi/Core/NumericValue.h>
#include <nan.h>

namespace sfmlrmlui {

// Independent native values; shared views never retain a DOM/runtime owner.
v8::Local<v8::Object> WrapNumericValue(Rml::NumericValue value);
bool CopyNumericValue(v8::Local<v8::Value> handle, Rml::NumericValue* result);
bool ReadFiniteNumericFloat(v8::Local<v8::Value> value, float* result);
bool ReadUnit(v8::Local<v8::Value> value, Rml::Unit* result);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_NUMERIC_VALUE_H_
