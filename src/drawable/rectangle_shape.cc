#include <SFML/Graphics/RectangleShape.hpp>

#include "../vector2.h"
#include "drawable-inl.h"
#include "rectangle_shape.h"

namespace node_sfml {
namespace drawable {

using v8::FunctionTemplate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::Value;

const char rectangle_shape_name[] = "RectangleShape";

Nan::Persistent<v8::Function> RectangleShape::constructor;

NAN_MODULE_INIT(RectangleShape::Init) {
  Shape::Init<RectangleShape, rectangle_shape_name>(target);
}

void RectangleShape::SetPrototype(Local<FunctionTemplate>* _tpl) {
  Shape::SetPrototype(_tpl);

  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;
  Nan::SetPrototypeMethod(tpl, "setSize", SetSize);
  Nan::SetPrototypeMethod(tpl, "getSize", GetSize);
}

NAN_METHOD(RectangleShape::New) {
  Local<Object> v8_size = info[0].As<Object>();
  vector2::Vector2F* size = Nan::ObjectWrap::Unwrap<vector2::Vector2F>(v8_size);
  RectangleShape* shape = new RectangleShape(size->vector2());
  shape->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(RectangleShape::GetSize) {
  RectangleShape* shape =
      Nan::ObjectWrap::Unwrap<RectangleShape>(info.Holder());
  sf::Vector2f vec = shape->raw<sf::RectangleShape>().getSize();

  Nan::TryCatch try_catch;
  MaybeLocal<Value> maybe_vec =
      vector2::Vector2F::NewRealInstance(info.GetIsolate(), vec);
  if (maybe_vec.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(maybe_vec.ToLocalChecked());
}

NAN_METHOD(RectangleShape::SetSize) {
  RectangleShape* shape =
      Nan::ObjectWrap::Unwrap<RectangleShape>(info.Holder());
  vector2::Vector2F* vec =
      Nan::ObjectWrap::Unwrap<vector2::Vector2F>(info[0].As<Object>());

  shape->raw<sf::RectangleShape>().setSize(vec->vector2());
}

RectangleShape::RectangleShape(const sf::Vector2f& size)
    : Shape(new sf::RectangleShape(size)) {}

}  // namespace drawable
}  // namespace node_sfml
