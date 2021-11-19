#ifndef SRC_VECTOR2_INL_H_
#define SRC_VECTOR2_INL_H_

#include "utils-inl.h"
#include "vector2.h"

namespace node_sfml {
namespace vector2 {

template <class T>
NAN_METHOD(Subtract) {
  T* left = Nan::ObjectWrap::Unwrap<T>(info[0].As<v8::Object>());
  T* right = Nan::ObjectWrap::Unwrap<T>(info[1].As<v8::Object>());

  Nan::TryCatch try_catch;
  v8::MaybeLocal<v8::Value> ret =
      T::NewRealInstance(info.GetIsolate(), left->vector2() - right->vector2());
  if (ret.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
NAN_METHOD(Add) {
  T* left = Nan::ObjectWrap::Unwrap<T>(info[0].As<v8::Object>());
  T* right = Nan::ObjectWrap::Unwrap<T>(info[1].As<v8::Object>());

  Nan::TryCatch try_catch;
  v8::MaybeLocal<v8::Value> ret =
      T::NewRealInstance(info.GetIsolate(), left->vector2() + right->vector2());
  if (ret.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class Self, typename T, typename NAN_T>
NAN_METHOD(Multiply) {
  Self* left = Nan::ObjectWrap::Unwrap<Self>(info[0].As<v8::Object>());
  T right = static_cast<T>(Nan::To<NAN_T>(info[1]).FromJust());

  Nan::TryCatch try_catch;
  v8::MaybeLocal<v8::Value> ret =
      Self::NewRealInstance(info.GetIsolate(), left->vector2() * right);
  if (ret.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class Self, typename T, typename NAN_T>
NAN_METHOD(Div) {
  Self* left = Nan::ObjectWrap::Unwrap<Self>(info[0].As<v8::Object>());
  T right = static_cast<T>(Nan::To<NAN_T>(info[1]).FromJust());

  Nan::TryCatch try_catch;
  v8::MaybeLocal<v8::Value> ret =
      Self::NewRealInstance(info.GetIsolate(), left->vector2() / right);
  if (ret.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
NAN_METHOD(Equals) {
  T* left = Nan::ObjectWrap::Unwrap<T>(info[0].As<v8::Object>());
  T* right = Nan::ObjectWrap::Unwrap<T>(info[1].As<v8::Object>());
  info.GetReturnValue().Set(left->vector2() == right->vector2());
}

template <class T>
NAN_METHOD(NotEquals) {
  T* left = Nan::ObjectWrap::Unwrap<T>(info[0].As<v8::Object>());
  T* right = Nan::ObjectWrap::Unwrap<T>(info[1].As<v8::Object>());
  info.GetReturnValue().Set(left->vector2() != right->vector2());
}

#define TEMPLATE_INNER T, NAN_T, V8_T

template <typename T, typename NAN_T, class V8_T>
v8::MaybeLocal<v8::Value> Vector2<TEMPLATE_INNER>::NewRealInstance(
    v8::Isolate* isolate, size_t argc, v8::Local<v8::Value>* argv) {
  v8::Local<v8::Function> cons = real_constructor.Get(isolate);
  if (cons.IsEmpty()) {
    Nan::ThrowError("`real_constructor` is not set.");
    return v8::MaybeLocal<v8::Value>();
  }

  v8::MaybeLocal<v8::Value> maybe_ret = Nan::Call(cons, cons, argc, argv);
  cons->NewInstance(isolate->GetCurrentContext(), argc, argv);
  return maybe_ret;
}

template <typename T, typename NAN_T, class V8_T>
v8::MaybeLocal<v8::Value> Vector2<TEMPLATE_INNER>::NewRealInstance(
    v8::Isolate* isolate, const sf::Vector2<T>& src) {
  v8::MaybeLocal<v8::Value> maybe =
      Vector2<TEMPLATE_INNER>::NewRealInstance(isolate);
  if (maybe.IsEmpty()) return maybe;

  v8::Local<v8::Object> vec = maybe.ToLocalChecked().As<v8::Object>();
  Vector2<TEMPLATE_INNER>* vec_wrapper =
      Nan::ObjectWrap::Unwrap<Vector2<TEMPLATE_INNER>>(vec);
  sf::Vector2<T>& v = vec_wrapper->vector2();
  v.x = src.x;
  v.y = src.y;

  return vec;
}

template <typename T, typename NAN_T, class V8_T>
NAN_METHOD(Vector2<TEMPLATE_INNER>::New) {
  Vector2<T, NAN_T, V8_T>* rect = nullptr;
  if (info.Length() == 0) {
    rect = new Vector2<T, NAN_T, V8_T>();
    rect->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
    return;
  }

  if (info.Length() == 1) {
    Vector2<T, NAN_T, V8_T>* another =
        Nan::ObjectWrap::Unwrap<Vector2<T, NAN_T, V8_T>>(
            info[0].As<v8::Object>());
    rect = new Vector2(*another);
    rect->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
    return;
  }

  T val[2];
  if (!ParseParameters<T, NAN_T, V8_T>(info, 2, val)) return;
  rect = new Vector2<T, NAN_T, V8_T>(val[0], val[1]);

  rect->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

#define V(name, lowercase)                                                     \
  template <typename T, typename NAN_T, class V8_T>                            \
  NAN_METHOD(Vector2<TEMPLATE_INNER>::name##Getter) {                          \
    Vector2<T, NAN_T, V8_T>* vec =                                             \
        Nan::ObjectWrap::Unwrap<Vector2<T, NAN_T, V8_T>>(info.This());         \
    v8::Local<V8_T> ret =                                                      \
        Nan::New<V8_T>(static_cast<NAN_T>(vec->vector2().lowercase));          \
    info.GetReturnValue().Set(ret);                                            \
  }                                                                            \
                                                                               \
  template <typename T, typename NAN_T, class V8_T>                            \
  NAN_METHOD(Vector2<TEMPLATE_INNER>::name##Setter) {                          \
    v8::MaybeLocal<V8_T> maybe_value = info[0].As<V8_T>();                     \
    if (maybe_value.IsEmpty()) {                                               \
      Nan::ThrowTypeError("Invalid type for `" #lowercase "`.");               \
    }                                                                          \
                                                                               \
    NAN_T val = maybe_value.ToLocalChecked()->Value();                         \
    Vector2<T, NAN_T, V8_T>* vec =                                             \
        Nan::ObjectWrap::Unwrap<Vector2<T, NAN_T, V8_T>>(info.This());         \
    vec->vector2().lowercase = static_cast<T>(val);                            \
  }

VECTOR2_PROPERTIES(V);
#undef V

template <typename T, typename NAN_T, class V8_T>
NAN_METHOD(Vector2<TEMPLATE_INNER>::SetRealConstructor) {
  real_constructor.Reset(info[0].As<v8::Function>());
}

template <typename T, typename NAN_T, class V8_T>
Vector2<T, NAN_T, V8_T>::Vector2() : Nan::ObjectWrap(), _vec() {}

template <typename T, typename NAN_T, class V8_T>
Vector2<T, NAN_T, V8_T>::Vector2(T x, T y) : Nan::ObjectWrap(), _vec(x, y) {}

template <typename T, typename NAN_T, class V8_T>
Vector2<T, NAN_T, V8_T>::Vector2(const Vector2<T, NAN_T, V8_T>& vec)
    : Nan::ObjectWrap(), _vec(vec.vector2()) {}

template <typename T, typename NAN_T, class V8_T>
Vector2<T, NAN_T, V8_T>::~Vector2() {}

#undef TEMPLATE_INNER

}  // namespace vector2
}  // namespace node_sfml

#endif  // SRC_VECTOR2_INL_H_
