#ifndef SRC_VECTOR2_INL_H_
#define SRC_VECTOR2_INL_H_

#include "utils-inl.h"
#include "vector2.h"

namespace node_sfml {
namespace vector2 {

#define TEMPLATE_INNER T, NAN_T, V8_T

template <typename T, typename NAN_T, class V8_T>
v8::MaybeLocal<v8::Object> Vector2<TEMPLATE_INNER>::NewRealInstance(
    v8::Isolate* isolate, size_t argc, v8::Local<v8::Value>* argv) {
  v8::Local<v8::Function> cons = real_constructor.Get(isolate);

  v8::MaybeLocal<v8::Object> maybe_ret =
      cons->NewInstance(isolate->GetCurrentContext(), argc, argv);
  return maybe_ret;
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
    Vector2<T, NAN_T, V8_T>* rect =                                            \
        Nan::ObjectWrap::Unwrap<Vector2<T, NAN_T, V8_T>>(info.Holder());       \
    v8::Local<V8_T> ret = Nan::New<V8_T>(static_cast<NAN_T>(rect->lowercase)); \
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
    Vector2<T, NAN_T, V8_T>* rect =                                            \
        Nan::ObjectWrap::Unwrap<Vector2<T, NAN_T, V8_T>>(info.Holder());       \
    rect->lowercase = static_cast<T>(val);                                     \
  }

VECTOR2_PROPERTIES(V);
#undef V

template <typename T, typename NAN_T, class V8_T>
NAN_METHOD(Vector2<TEMPLATE_INNER>::SetRealConstructor) {
  real_constructor.Reset(info[0].As<v8::Function>());
}

template <typename T, typename NAN_T, class V8_T>
Vector2<T, NAN_T, V8_T>::Vector2() : sf::Vector2<T>() {}

template <typename T, typename NAN_T, class V8_T>
Vector2<T, NAN_T, V8_T>::Vector2(T x, T y) : sf::Vector2<T>(x, y) {}

template <typename T, typename NAN_T, class V8_T>
Vector2<T, NAN_T, V8_T>::Vector2(const Vector2<T, NAN_T, V8_T>& vec)
    : sf::Vector2<T>(vec) {}

template <typename T, typename NAN_T, class V8_T>
Vector2<T, NAN_T, V8_T>::~Vector2() {}

#undef TEMPLATE_INNER

}  // namespace vector2
}  // namespace node_sfml

#endif  // SRC_VECTOR2_INL_H_
