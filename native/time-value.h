#pragma once

#include <nan.h>
#include <SFML/System/Time.hpp>

namespace sfmljs {

// Durations cross the binding by value. No persistent owner or mapped buffer.
inline bool ReadTime(v8::Local<v8::Value> value, sf::Time& result) {
  if (!value->IsBigInt()) {
    Nan::ThrowTypeError("Expected a microsecond bigint");
    return false;
  }
  bool lossless = false;
  const auto count = value.As<v8::BigInt>()->Int64Value(&lossless);
  if (!lossless) {
    Nan::ThrowRangeError("Time must fit in a signed 64-bit microsecond count");
    return false;
  }
  result = sf::microseconds(count);
  return true;
}

inline v8::Local<v8::BigInt> WriteTime(v8::Isolate* isolate, sf::Time value) {
  return v8::BigInt::New(isolate, value.asMicroseconds());
}

}  // namespace sfmljs
