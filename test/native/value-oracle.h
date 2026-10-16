#pragma once

#include <nan.h>
#include <SFML/System/Angle.hpp>

#include <cmath>
#include <type_traits>

namespace sfmljs {

inline void Set(v8::Local<v8::Object> object, const char* key, double value) {
  Nan::Set(object, Nan::New(key).ToLocalChecked(), Nan::New(value)).FromJust();
}

template <typename T>
v8::Local<v8::Value> ScalarValue(T value) {
  if constexpr (std::is_integral_v<T> && sizeof(T) == 8) {
    if constexpr (std::is_signed_v<T>) {
      return v8::BigInt::New(v8::Isolate::GetCurrent(), value);
    } else {
      return v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(), value);
    }
  } else {
    return Nan::New(static_cast<double>(value));
  }
}

template <typename T>
  requires(std::is_integral_v<T> && sizeof(T) == 8)
void Set(v8::Local<v8::Object> object, const char* key, T value) {
  Nan::Set(object, Nan::New(key).ToLocalChecked(), ScalarValue(value)).FromJust();
}

template <typename V>
v8::Local<v8::Array> Coordinates(const V& vector) {
  constexpr bool is3d = requires { vector.z; };
  constexpr bool is4d = requires { vector.w; };
  auto array = Nan::New<v8::Array>(is4d ? 4 : is3d ? 3 : 2);
  Nan::Set(array, 0, ScalarValue(vector.x)).FromJust();
  Nan::Set(array, 1, ScalarValue(vector.y)).FromJust();
  if constexpr (is3d) {
    Nan::Set(array, 2, ScalarValue(vector.z)).FromJust();
  }
  if constexpr (is4d) {
    Nan::Set(array, 3, ScalarValue(vector.w)).FromJust();
  }
  return array;
}

template <typename V>
void SetVector(v8::Local<v8::Object> object, const char* key, const V& vector) {
  Nan::Set(object, Nan::New(key).ToLocalChecked(), Coordinates(vector)).FromJust();
}

// Internal test oracle. Signed inputs and all their intermediate arithmetic
// must stay in range; C++ signed overflow is undefined.
template <typename V>
void EvaluateOperators(v8::Local<v8::Object> result,
                       const V& lhs, const V& rhs, decltype(V::x) scalar) {
  SetVector(result, "add", lhs + rhs);
  SetVector(result, "subtract", lhs - rhs);
  SetVector(result, "negate", -lhs);
  SetVector(result, "multiply", lhs * scalar);
  SetVector(result, "leftMultiply", scalar * lhs);
  SetVector(result, "divide", lhs / scalar);
  auto value = lhs;
  SetVector(result, "addAssign", value += rhs);
  value = lhs;
  SetVector(result, "subtractAssign", value -= rhs);
  value = lhs;
  SetVector(result, "multiplyAssign", value *= scalar);
  value = lhs;
  SetVector(result, "divideAssign", value /= scalar);
  Set(result, "equal", lhs == rhs);
  Set(result, "notEqual", lhs != rhs);
}

template <typename V>
void EvaluateFloating(v8::Local<v8::Object> result, const V& lhs) {
  if constexpr (std::is_floating_point_v<decltype(V::x)>) {
    Set(result, "length", lhs.length());
    if (lhs != V{} && lhs.length() != 0) {
      SetVector(result, "normalized", lhs.normalized());
    }
  }
}

}  // namespace sfmljs
