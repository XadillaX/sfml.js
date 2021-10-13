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

  static NAN_METHOD(SetFillColor);
  static NAN_METHOD(GetFillColor);

  static NAN_METHOD(SetOutlineColor);
  static NAN_METHOD(GetOutlineColor);

  static NAN_METHOD(SetOutlineThickness);
  static NAN_METHOD(GetOutlineThickness);

  static NAN_METHOD(GetPointCount);

  static NAN_METHOD(GetLocalBounds);
  static NAN_METHOD(GetGlobalBounds);

  static NAN_METHOD(GetPoint);

  static NAN_METHOD(SetPosition);
  static NAN_METHOD(GetPosition);

  static NAN_METHOD(SetRotation);
  static NAN_METHOD(GetRotation);

  static NAN_METHOD(SetScale);
  static NAN_METHOD(GetScale);

  static NAN_METHOD(SetOrigin);
  static NAN_METHOD(GetOrigin);

  // TODO(XadillaX): More methods.

 protected:
  explicit Shape(T* raw);
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SHAPE_H_
