#ifndef SRC_RECT_INL_H_
#define SRC_RECT_INL_H_

#include "rect.h"

namespace node_sfml {
namespace rect {

#define TEMPLATE_INNER T, NAN_T, V8_T

template <typename T, typename NAN_T, class V8_T>
bool ParseParameters(Nan::NAN_METHOD_ARGS_TYPE info,
                     size_t parameter_count,
                     T* val) {
  v8::MaybeLocal<V8_T> maybe;
  for (size_t i = 0; i < parameter_count; i++) {
    maybe = Nan::To<V8_T>(info[i]);
    if (maybe.IsEmpty()) {
      Nan::ThrowError("Invalid parameter type.");
      return false;
    }

    NAN_T v = Nan::To<NAN_T>(maybe.ToLocalChecked()).FromJust();
    val[i] = static_cast<T>(v);
  }

  return true;
}

template <typename T, typename NAN_T, class V8_T>
v8::MaybeLocal<v8::Object> Rect<TEMPLATE_INNER>::NewRealInstance(
    v8::Isolate* isolate, size_t argc, v8::Local<v8::Value>* argv) {
  v8::Local<v8::Function> cons = real_constructor.Get(isolate);

  v8::MaybeLocal<v8::Object> maybe_ret =
      cons->NewInstance(isolate->GetCurrentContext(), argc, argv);
  return maybe_ret;
}

template <typename T, typename NAN_T, class V8_T>
NAN_METHOD(Rect<TEMPLATE_INNER>::New) {
  Rect<T, NAN_T, V8_T>* rect = nullptr;
  if (info.Length() == 0) {
    rect = new Rect<T, NAN_T, V8_T>();
    rect->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
    return;
  }

  if (info.Length() < 4) {
    Nan::ThrowError("Rect's constructor should have 4 parameters.");
    return;
  }

  T val[4];
  if (!ParseParameters<T, NAN_T, V8_T>(info, 4, val)) return;
  rect = new Rect<T, NAN_T, V8_T>(val[0], val[1], val[2], val[3]);

  rect->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

template <typename T, typename NAN_T, class V8_T>
NAN_METHOD(Rect<TEMPLATE_INNER>::Contains) {
  T val[2];
  if (!ParseParameters<T, NAN_T, V8_T>(info, 2, val)) return;

  Rect<T, NAN_T, V8_T>* rect =
      Nan::ObjectWrap::Unwrap<Rect<T, NAN_T, V8_T>>(info.Holder());
  info.GetReturnValue().Set(rect->contains(val[0], val[1]));
}

template <typename T, typename NAN_T, class V8_T>
NAN_METHOD(Rect<TEMPLATE_INNER>::Intersects) {
  Rect<T, NAN_T, V8_T>* rect =
      Nan::ObjectWrap::Unwrap<Rect<T, NAN_T, V8_T>>(info.Holder());

  // DO CHECK instanceof `Rect` out in JavaScript.
  Rect<T, NAN_T, V8_T>* another =
      Nan::ObjectWrap::Unwrap<Rect<T, NAN_T, V8_T>>(info[0].As<v8::Object>());

  v8::Local<v8::Function> cons = real_constructor.Get(info.GetIsolate());
  v8::Local<v8::Object> ret =
      cons->NewInstance(info.GetIsolate()->GetCurrentContext())
          .ToLocalChecked();
  Rect<T, NAN_T, V8_T>* ret_rect =
      Nan::ObjectWrap::Unwrap<Rect<T, NAN_T, V8_T>>(ret);

  bool succ = rect->intersects(*another, *ret_rect);
  if (succ) {
    info.GetReturnValue().Set(ret);
  } else {
    info.GetReturnValue().Set(Nan::False());
  }
}

#define V(name, lowercase)                                                     \
  template <typename T, typename NAN_T, class V8_T>                            \
  NAN_METHOD(Rect<TEMPLATE_INNER>::name##Getter) {                             \
    Rect<T, NAN_T, V8_T>* rect =                                               \
        Nan::ObjectWrap::Unwrap<Rect<T, NAN_T, V8_T>>(info.Holder());          \
    v8::Local<V8_T> ret = Nan::New<V8_T>(static_cast<NAN_T>(rect->lowercase)); \
    info.GetReturnValue().Set(ret);                                            \
  }                                                                            \
                                                                               \
  template <typename T, typename NAN_T, class V8_T>                            \
  NAN_METHOD(Rect<TEMPLATE_INNER>::name##Setter) {                             \
    v8::MaybeLocal<V8_T> maybe_value = info[0].As<V8_T>();                     \
    if (maybe_value.IsEmpty()) {                                               \
      Nan::ThrowTypeError("Invalid type for `" #lowercase "`.");               \
    }                                                                          \
                                                                               \
    NAN_T val = maybe_value.ToLocalChecked()->Value();                         \
    Rect<T, NAN_T, V8_T>* rect =                                               \
        Nan::ObjectWrap::Unwrap<Rect<T, NAN_T, V8_T>>(info.Holder());          \
    rect->lowercase = static_cast<T>(val);                                     \
  }

RECT_PROPERTIES(V);
#undef V

template <typename T, typename NAN_T, class V8_T>
NAN_METHOD(Rect<TEMPLATE_INNER>::SetRealConstructor) {
  real_constructor.Reset(info[0].As<v8::Function>());
}

template <typename T, typename NAN_T, class V8_T>
Rect<T, NAN_T, V8_T>::Rect() : sf::Rect<T>() {}

template <typename T, typename NAN_T, class V8_T>
Rect<T, NAN_T, V8_T>::Rect(T rect_left, T rect_top, T rect_width, T rect_height)
    : sf::Rect<T>(rect_left, rect_top, rect_width, rect_height) {}

template <typename T, typename NAN_T, class V8_T>
Rect<T, NAN_T, V8_T>::~Rect() {}

#undef TEMPLATE_INNER

}  // namespace rect
}  // namespace node_sfml

#endif  // SRC_RECT_INL_H_
