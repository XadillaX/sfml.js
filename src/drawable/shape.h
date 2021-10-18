#ifndef SRC_DRAWABLE_SHAPE_H_
#define SRC_DRAWABLE_SHAPE_H_

#include "common_drawable.h"

namespace node_sfml {
namespace drawable {

template <class T>
class Shape : public CommonDrawable<T> {
 public:
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 protected:
  static NAN_METHOD(GetPointCount);
  static NAN_METHOD(GetPoint);

  // TODO(XadillaX): More methods.

 protected:
  explicit Shape(T* raw);
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SHAPE_H_
