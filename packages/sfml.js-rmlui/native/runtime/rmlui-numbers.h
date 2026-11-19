// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_NUMBERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_NUMBERS_H_

#include <nan.h>

#include <cmath>
#include <limits>

namespace sfmlrmlui {

// Validate before narrowing, without coercion or calls into user JavaScript.
inline bool ReadFiniteFloat(v8::Local<v8::Value> value, float* result) {
  if (!value->IsNumber()) {
    Nan::ThrowTypeError("Expected a number");
    return false;
  }
  const double number = Nan::To<double>(value).FromJust();
  if (!std::isfinite(number) ||
      std::abs(number) > std::numeric_limits<float>::max()) {
    Nan::ThrowRangeError("Expected a finite float");
    return false;
  }
  *result = static_cast<float>(number);
  return true;
}

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_NUMBERS_H_
