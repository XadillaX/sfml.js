#include <SFML/Graphics/CircleShape.hpp>

#include "circle_shape.h"
#include "drawable-inl.h"

namespace node_sfml {
namespace drawable {

using v8::FunctionTemplate;
using v8::Local;
using v8::Number;

Nan::Persistent<v8::Function> CircleShape::constructor;
const char circle_shape_name[] = "CircleShape";

NAN_MODULE_INIT(CircleShape::Init) {
  Shape::Init<CircleShape, circle_shape_name>(target);
}

void CircleShape::SetPrototype(Local<FunctionTemplate>* _tpl) {
  Shape::SetPrototype(_tpl);

  v8::Local<FunctionTemplate>& tpl = *_tpl;
  Nan::SetPrototypeMethod(tpl, "setPointCount", SetPointCount);
}

NAN_METHOD(CircleShape::New) {
  CircleShape* circle_shape = nullptr;
  Local<Number> radius;
  Local<v8::Uint32> point_count;

  switch (info.Length()) {
    case 0:
      circle_shape = new CircleShape();
      break;

    case 2: {
      point_count = info[1].As<v8::Uint32>();
      // fallthrough
    }

    case 1: {
      radius = info[0].As<Number>();
      break;
    }

    default: {
      Nan::ThrowError("Invalid arguments count.");
      return;
    }
  }

  if (circle_shape == nullptr) {
    if (point_count.IsEmpty()) {
      circle_shape = new CircleShape(Nan::To<double>(radius).FromJust());
    } else {
      circle_shape =
          new CircleShape(Nan::To<double>(radius).FromJust(),
                          Nan::To<sf::Uint32>(point_count).FromJust());
    }
  }

  circle_shape->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(CircleShape::SetPointCount) {
  CircleShape* shape = Nan::ObjectWrap::Unwrap<CircleShape>(info.Holder());
  sf::CircleShape& raw = shape->raw<sf::CircleShape>();
  sf::Uint32 point_count = Nan::To<sf::Uint32>(info[0]).FromJust();
  raw.setPointCount(point_count);
}

CircleShape::CircleShape(float radius, size_t point_count)
    : Shape(new sf::CircleShape(radius, point_count)) {}

}  // namespace drawable
}  // namespace node_sfml
