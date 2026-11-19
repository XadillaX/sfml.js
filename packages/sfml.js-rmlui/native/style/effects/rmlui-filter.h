// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_FILTER_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_FILTER_H_

#include <RmlUi/Core/Filter.h>
#include <nan.h>

namespace sfmlrmlui {

v8::Local<v8::Object> WrapFilter(const Rml::SharedPtr<Rml::Filter>& value);
bool CopyFilter(v8::Local<v8::Value> handle,
                Rml::SharedPtr<Rml::Filter>* result);
void ReleaseFilters();
bool ReadFilterRectangle(v8::Local<v8::Value> input, Rml::Rectanglef* value);
v8::Local<v8::Object> WrapFilterRectangle(const Rml::Rectanglef& value);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_FILTER_H_
