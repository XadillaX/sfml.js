#ifndef SRC_DRAWABLE_SHAPE_INL_H_
#define SRC_DRAWABLE_SHAPE_INL_H_

#include "shape.h"
#include "../plugins/transformable_plugin-inl.h"
#include "package_plugin-inl.h"

namespace node_sfml {
namespace drawable {

using v8::Local;
using v8::Object;

void Shape::SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "getPointCount", GetPointCount);
  Nan::SetPrototypeMethod(tpl, "getPoint", GetPoint);

  transformable::SetPrototype<Shape>(_tpl);
  package_plugin_bounds::SetPrototype<sf::Shape>(_tpl);
  package_plugin_color_and_thickness::SetPrototype<sf::Shape>(_tpl);
  package_plugin_texture::SetPrototype<Shape, sf::Shape>(_tpl);
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

Shape::Shape(sf::Shape* raw) : DrawableWithTexture(raw) {}

void Shape::SetTexture(Local<Object> texture_object, bool reset_rect) {
  texture::Texture* texture =
      Nan::ObjectWrap::Unwrap<texture::Texture>(texture_object);
  raw<sf::Shape>().setTexture(&texture->texture());
  DrawableWithTexture::SetTexture(texture_object);
}

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SHAPE_INL_H_
