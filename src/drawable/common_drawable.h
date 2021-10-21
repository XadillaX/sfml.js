#ifndef SRC_DRAWABLE_COMMON_DRAWABLE_H_
#define SRC_DRAWABLE_COMMON_DRAWABLE_H_

#include "drawable.h"

namespace node_sfml {
namespace drawable {

class CommonDrawable1 : public Drawable {
 public:
  template <class T>
  inline static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 protected:
  template <class T>
  inline static NAN_METHOD(GetLocalBounds);
  template <class T>
  inline static NAN_METHOD(GetGlobalBounds);

  template <class T>
  inline static NAN_METHOD(SetPosition);
  template <class T>
  inline static NAN_METHOD(GetPosition);

  template <class T>
  inline static NAN_METHOD(SetRotation);
  template <class T>
  inline static NAN_METHOD(GetRotation);

  template <class T>
  inline static NAN_METHOD(SetScale);
  template <class T>
  inline static NAN_METHOD(GetScale);

  template <class T>
  inline static NAN_METHOD(SetOrigin);
  template <class T>
  inline static NAN_METHOD(GetOrigin);

  template <class T>
  inline static NAN_METHOD(Move);

  // TODO(XadillaX): More methods.

 protected:
  CommonDrawable1();
  explicit CommonDrawable1(sf::Drawable* raw);
  inline virtual ~CommonDrawable1() {}
};

class CommonDrawable2 : public CommonDrawable1 {
 public:
  template <class T>
  inline static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 protected:
  template <class T>
  inline static NAN_METHOD(SetFillColor);
  template <class T>
  inline static NAN_METHOD(GetFillColor);

  template <class T>
  inline static NAN_METHOD(SetOutlineColor);
  template <class T>
  inline static NAN_METHOD(GetOutlineColor);

  template <class T>
  inline static NAN_METHOD(SetOutlineThickness);
  template <class T>
  inline static NAN_METHOD(GetOutlineThickness);

 protected:
  CommonDrawable2();
  explicit CommonDrawable2(sf::Drawable* raw);
  inline virtual ~CommonDrawable2() {}
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_COMMON_DRAWABLE_H_
