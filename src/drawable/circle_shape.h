#ifndef SRC_DRAWABLE_CIRCLE_SHAPE_H_
#define SRC_DRAWABLE_CIRCLE_SHAPE_H_

#include "shape.h"

namespace node_sfml {
namespace drawable {

class CircleShape : public Shape<sf::CircleShape> {
 public:
  static Nan::Persistent<v8::Function> constructor;

  static NAN_MODULE_INIT(Init);
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(SetPointCount);

 private:
  explicit CircleShape(float radius = 0, size_t point_count = 30);
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_CIRCLE_SHAPE_H_
