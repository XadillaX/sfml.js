// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_VALUES_RMLUI_COMPUTED_VALUES_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_VALUES_RMLUI_COMPUTED_VALUES_H_

#include <RmlUi/Core/ComputedValues.h>
#include <nan.h>

namespace sfmlrmlui {

// Valid only in an owning RuntimeScope, after reading all JS inputs.
const Rml::ComputedValues* ReadComputedValues(v8::Local<v8::Value> handle);
Rml::ComputedValues* WriteComputedValues(v8::Local<v8::Value> handle,
                                         Rml::Element* element);
void MarkComputedFontGeneration(v8::Local<v8::Value> handle);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_VALUES_RMLUI_COMPUTED_VALUES_H_
