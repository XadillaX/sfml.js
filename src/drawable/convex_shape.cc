#include <SFML/Graphics/ConvexShape.hpp>

#include "../vector2.h"
#include "convex_shape.h"
#include "drawable-inl.h"

namespace node_sfml {
namespace drawable {

using v8::FunctionTemplate;
using v8::Local;
using v8::Object;

const char rectangle_shape_name[] = "ConvexShape";
Nan::Persistent<v8::Function> ConvexShape::constructor;

NAN_MODULE_INIT(ConvexShape::Init) {
  Shape::Init<ConvexShape, rectangle_shape_name>(target);
}

void ConvexShape::SetPrototype(Local<FunctionTemplate>* _tpl) {
  Shape::SetPrototype(_tpl);

  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;
  Nan::SetPrototypeMethod(tpl, "setPointCount", SetPointCount);
  Nan::SetPrototypeMethod(tpl, "setPoint", SetPoint);
}

NAN_METHOD(ConvexShape::New) {
  sf::Uint32 point_count = Nan::To<sf::Uint32>(info[0]).FromJust();
  ConvexShape* shape = new ConvexShape(point_count);
  shape->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(ConvexShape::SetPointCount) {
  ConvexShape* shape = Nan::ObjectWrap::Unwrap<ConvexShape>(info.Holder());
  sf::ConvexShape& raw = shape->raw<sf::ConvexShape>();
  sf::Uint32 point_count = Nan::To<sf::Uint32>(info[0]).FromJust();
  raw.setPointCount(point_count);
}

NAN_METHOD(ConvexShape::SetPoint) {
  ConvexShape* shape = Nan::ObjectWrap::Unwrap<ConvexShape>(info.Holder());
  sf::ConvexShape& raw = shape->raw<sf::ConvexShape>();
  sf::Uint32 idx = Nan::To<sf::Uint32>(info[0]).FromJust();
  Local<Object> point_object = info[1].As<Object>();
  vector2::Vector2F* point =
      Nan::ObjectWrap::Unwrap<vector2::Vector2F>(point_object);
  raw.setPoint(idx, point->vector2());
}

ConvexShape::ConvexShape(std::size_t point_count)
    : Shape(new sf::ConvexShape(point_count)) {}

}  // namespace drawable
}  // namespace node_sfml
