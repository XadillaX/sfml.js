#ifndef SRC_DRAWABLE_CONVEX_SHAPE_H_
#define SRC_DRAWABLE_CONVEX_SHAPE_H_

#include "shape.h"

namespace node_sfml {
namespace drawable {

class ConvexShape : public Shape {
 public:
  static Nan::Persistent<v8::Function> constructor;

  static NAN_MODULE_INIT(Init);
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(SetPointCount);
  static NAN_METHOD(SetPoint);

 private:
  explicit ConvexShape(std::size_t point_count);
  inline virtual ~ConvexShape() {}
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_CONVEX_SHAPE_H_
