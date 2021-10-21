#include "rectangle_shape.h"
#include "../vector2.h"
#include "common_drawable-inl.h"
#include "drawable-inl.h"

namespace node_sfml {
namespace drawable {

using v8::FunctionTemplate;
using v8::Local;
using v8::Object;

const char rectangle_shape_name[] = "RectangleShape";

Nan::Persistent<v8::Function> RectangleShape::constructor;

NAN_MODULE_INIT(RectangleShape::Init) {
  Shape::Init<RectangleShape, rectangle_shape_name>(target);
}

NAN_METHOD(RectangleShape::New) {
  Local<Object> v8_size = info[0].As<Object>();
  vector2::Vector2F* size = Nan::ObjectWrap::Unwrap<vector2::Vector2F>(v8_size);
  RectangleShape* shape = new RectangleShape(size->vector2());
  shape->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

RectangleShape::RectangleShape(const sf::Vector2f& size)
    : Shape(new sf::RectangleShape(size)) {}

}  // namespace drawable
}  // namespace node_sfml
