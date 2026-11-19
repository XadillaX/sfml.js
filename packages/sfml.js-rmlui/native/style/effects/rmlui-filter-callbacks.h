// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_FILTER_CALLBACKS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_FILTER_CALLBACKS_H_

#include <RmlUi/Core/Filter.h>
#include <nan.h>

namespace sfmlrmlui {

Rml::SharedPtr<Rml::Filter> CreateFilterCallbacks(
    v8::Local<v8::Function> compile, v8::Local<v8::Value> overflow);
Rml::SharedPtr<Rml::Filter> DetachFilterCallbacks(
    const Rml::SharedPtr<Rml::Filter>& value);
Rml::SharedPtr<Rml::Filter> RetainFilterCallbacks(
    const Rml::SharedPtr<Rml::Filter>& value);
void BindFilterCallbacks(v8::Local<v8::Object> handle,
                         const Rml::SharedPtr<Rml::Filter>& value);
void RefreshFilterOwnership();
void ReleaseFilterCallbacks();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_FILTER_CALLBACKS_H_
