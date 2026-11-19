// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_ADDRESS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_ADDRESS_H_

#include <RmlUi/Core/DataTypes.h>
#include <nan.h>

namespace sfmlrmlui {

bool ReadDataAddressEntry(v8::Local<v8::Value> input,
                          Rml::DataAddressEntry* output);
bool ReadDataAddress(v8::Local<v8::Array> input, Rml::DataAddress* output);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_ADDRESS_H_
