// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_DICTIONARY_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_DICTIONARY_H_

#include <RmlUi/Core/PropertyDictionary.h>
#include <nan.h>

#include <cstdint>

namespace sfmlrmlui {

struct PropertyDictionaryState {
  Rml::PropertyDictionary value;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

// Require the runtime owner. The handle is checked again after JS accessors.
PropertyDictionaryState* PropertyDictionaryOf(v8::Local<v8::Value> handle);
v8::Local<v8::Object> WrapPropertyDictionary(
    const Rml::PropertyDictionary& value);
// Rebind copied callback leases and expose their retention edges to V8.
void RefreshPropertyDictionary(v8::Local<v8::Object> handle,
                               PropertyDictionaryState* state);
void ReleasePropertyDictionaries();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_DICTIONARY_H_
