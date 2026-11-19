// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_STRING_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_STRING_H_

#include <RmlUi/Core/StringUtilities.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include "native/data/rmlui-data-diagnostics.h"

namespace sfmlrmlui {

// Copy explicit UTF-8 bytes without coercion or truncation at embedded NUL.
bool ReadString(v8::Local<v8::Value> input, Rml::String* result);

// Validate integer bounds before narrowing native byte/codepoint offsets.
bool ReadStringInteger(v8::Local<v8::Value> input,
                       double minimum,
                       double maximum,
                       int64_t* result);

// Preserve the explicit native byte length when converting to JavaScript.
v8::Local<v8::String> WriteString(const Rml::String& value);

// Format checked JS scalars with native printf conversions and length rules.
// Shared by pure string formatting and runtime-owned application logging.
bool FormatStringScalars(v8::Local<v8::Value> input_format,
                         v8::Local<v8::Value> input_values,
                         Rml::String* result,
                         uint32_t* length);

// Count pure-resource calls without runtime ownership maintenance.
template <Nan::FunctionCallback callback>
void StringBoundary(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  RecordDiagnosticString(&DataDiagnostics::runtime_entries);
  callback(info);
}

template <Nan::FunctionCallback callback>
void SetStringMethod(v8::Local<v8::Object> target, const char* name) {
  sfmljs::SetMethod<StringBoundary<callback>>(target, name);
}

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_STRING_H_
