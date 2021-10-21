#ifndef SRC_DRAWABLE_SHAPE_INL_H_
#define SRC_DRAWABLE_SHAPE_INL_H_

#include "shape.h"
#include "../color.h"
#include "../rect-inl.h"
#include "../vector2-inl.h"
#include "common_drawable-inl.h"
#include "drawable-inl.h"

namespace node_sfml {
namespace drawable {

void Shape::SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  CommonDrawable2::SetPrototype<sf::Shape>(_tpl);

  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "getPointCount", GetPointCount);
  Nan::SetPrototypeMethod(tpl, "getPoint", GetPoint);
}

NAN_METHOD(Shape::GetPointCount) {
  Shape* shape = Nan::ObjectWrap::Unwrap<Shape>(info.Holder());
  sf::Shape& raw = shape->raw<sf::Shape>();
  sf::Uint32 point_count = raw.getPointCount();
  info.GetReturnValue().Set(point_count);
}

NAN_METHOD(Shape::GetPoint) {
  Shape* shape = Nan::ObjectWrap::Unwrap<Shape>(info.Holder());
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

Shape::Shape(sf::Shape* raw) : CommonDrawable2(raw) {}

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SHAPE_INL_H_
