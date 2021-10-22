#ifndef SRC_DRAWABLE_RECTANGLE_SHAPE_H_
#define SRC_DRAWABLE_RECTANGLE_SHAPE_H_

#include "shape.h"

namespace node_sfml {
namespace drawable {

class RectangleShape : public Shape {
 public:
  static Nan::Persistent<v8::Function> constructor;

  static NAN_MODULE_INIT(Init);
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(SetSize);
  static NAN_METHOD(GetSize);

 private:
  explicit RectangleShape(const sf::Vector2f& size);
  inline virtual ~RectangleShape() {}
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_RECTANGLE_SHAPE_H_
