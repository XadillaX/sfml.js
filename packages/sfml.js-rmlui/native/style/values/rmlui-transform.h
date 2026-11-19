// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_VALUES_RMLUI_TRANSFORM_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_VALUES_RMLUI_TRANSFORM_H_

#include <RmlUi/Core/Transform.h>
#include <nan.h>

namespace sfmlrmlui {

// Transform owns only numerical values. These conversions copy primitives;
// no borrowed DOM pointers, runtime resources or V8 callbacks are retained.
bool TransformFromJs(v8::Local<v8::Object> object, Rml::TransformPtr* result);
v8::Local<v8::Object> TransformToJs(const Rml::TransformPtr& value);
bool PrimitiveListFromJs(v8::Local<v8::Value> value,
                         Rml::Transform::PrimitiveList* result);
bool PrimitiveFromJs(v8::Local<v8::Value> value,
                     Rml::TransformPrimitive* result);
v8::Local<v8::Array> PrimitiveListToJs(
    const Rml::Transform::PrimitiveList& values);
v8::Local<v8::Object> PrimitiveToJs(const Rml::TransformPrimitive& value);
bool ConstructPrimitive(v8::Local<v8::Value> type,
                        v8::Local<v8::Value> values,
                        Rml::TransformPrimitive* result);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_VALUES_RMLUI_TRANSFORM_H_
