#ifndef SRC_DRAWABLE_SHAPE_H_
#define SRC_DRAWABLE_SHAPE_H_

#include "drawable.h"

namespace node_sfml {
namespace drawable {

template <class T>
class Shape : public Drawable<sf::Shape> {
 public:
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 protected:
  inline T& real_raw() { return BaseDrawable::raw<T>(); }

  // TODO(XadillaX): Use `Color` class as parameter.
  static NAN_METHOD(SetFillColor);
  static NAN_METHOD(GetFillColor);

  // TODO(XadillaX): More methods.

 protected:
  explicit Shape(T* raw);
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SHAPE_H_
