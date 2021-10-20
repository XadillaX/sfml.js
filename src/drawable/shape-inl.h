#ifndef SRC_DRAWABLE_SHAPE_INL_H_
#define SRC_DRAWABLE_SHAPE_INL_H_

#include "../color.h"
#include "../rect-inl.h"
#include "../vector2-inl.h"
#include "common_drawable-inl.h"
#include "shape.h"

namespace node_sfml {
namespace drawable {

template <class T>
void Shape<T>::SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  CommonDrawable2<T>::SetPrototype(_tpl);

  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "getPointCount", GetPointCount);
  Nan::SetPrototypeMethod(tpl, "getPoint", GetPoint);
}

template <class T>
NAN_METHOD(Shape<T>::GetPointCount) {
  drawable::Drawable* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw<sf::Shape>();
  sf::Uint32 point_count = raw.getPointCount();
  info.GetReturnValue().Set(point_count);
}

template <class T>
NAN_METHOD(Shape<T>::GetPoint) {
  drawable::Drawable* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw<sf::Shape>();
  if (!info[0]->IsUint32()) {
    Nan::ThrowTypeError("`idx` should be unsigned integer.");
    return;
  }

  sf::Vector2f point = raw.getPoint(Nan::To<sf::Uint32>(info[0]).FromJust());

  Nan::TryCatch try_catch;
  v8::MaybeLocal<v8::Object> maybe_vec =
      vector2::Vector2F::NewRealInstance(info.GetIsolate(), point);
  if (maybe_vec.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }
  info.GetReturnValue().Set(maybe_vec.ToLocalChecked());
}

template <class T>
Shape<T>::Shape(T* raw) : CommonDrawable2<T>(raw) {}

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SHAPE_INL_H_
