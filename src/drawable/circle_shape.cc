#include "circle_shape.h"
#include "shape-inl.h"

namespace node_sfml {
namespace drawable {

using v8::Local;
using v8::Number;

const char circle_shape_name[] = "CircleShape";

template <class T>
Nan::Persistent<v8::Function> Drawable<T>::constructor;

NAN_MODULE_INIT(CircleShape::Init) {
  Drawable<sf::Shape>::Init<CircleShape, circle_shape_name>(target);
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

CircleShape::CircleShape(float radius, size_t point_count)
    : Shape<sf::CircleShape>(new sf::CircleShape(radius, point_count)) {}

}  // namespace drawable
}  // namespace node_sfml
