// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_COMMANDS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_COMMANDS_H_

#include <nan.h>

#include <cstdint>

namespace sfmlrmlui {

// Numeric command storage owns bytes independently from its DOM lease table.
NAN_MODULE_INIT(InitializeRmlElementCommands);
v8::MaybeLocal<v8::Object> CreateElementCommandMapping(
    v8::Local<v8::Value> context,
    v8::Local<v8::Value> elements,
    uint32_t capacity);
// Scheduler integration shares validation/snapshots without an Addon entry.
bool PrepareElementCommands(v8::Local<v8::Value> handle);
bool ConsumeElementCommands(v8::Local<v8::Value> handle, uint32_t count);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_COMMANDS_H_
