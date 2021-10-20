#ifndef SRC_DRAWABLE_COMMON_DRAWABLE_H_
#define SRC_DRAWABLE_COMMON_DRAWABLE_H_

#include "drawable.h"

namespace node_sfml {
namespace drawable {

template <class T>
class CommonDrawable1 : public Drawable {
 public:
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 protected:
  static NAN_METHOD(GetLocalBounds);
  static NAN_METHOD(GetGlobalBounds);

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
  CommonDrawable1();
  explicit CommonDrawable1(T* raw);
};

template <class T>
class CommonDrawable2 : public CommonDrawable1<T> {
 public:
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 protected:
  static NAN_METHOD(SetFillColor);
  static NAN_METHOD(GetFillColor);

  static NAN_METHOD(SetOutlineColor);
  static NAN_METHOD(GetOutlineColor);

  static NAN_METHOD(SetOutlineThickness);
  static NAN_METHOD(GetOutlineThickness);

 protected:
  CommonDrawable2();
  explicit CommonDrawable2(T* raw);
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_COMMON_DRAWABLE_H_
