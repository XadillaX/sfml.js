#ifndef SRC_RECT_H_
#define SRC_RECT_H_

#include <nan.h>

#include <SFML/Graphics.hpp>

#include "vector2.h"

namespace node_sfml {
namespace rect {

#define RECT_PROPERTIES(V)                                                     \
  V(Left, left)                                                                \
  V(Top, top)                                                                  \
  V(Width, width)                                                              \
  V(Height, height)

template <typename T, typename NAN_T, class V8_T>
class Rect : public Nan::ObjectWrap {
 public:
  static Nan::Persistent<v8::Function> constructor;
  static Nan::Persistent<v8::Function> real_constructor;

  inline const sf::Rect<T>& rect() const { return _rect; }
  inline sf::Rect<T>& rect() { return _rect; }

  template <const char* class_name>
  static NAN_MODULE_INIT(Init) {
    v8::Local<v8::String> name = Nan::New(class_name).ToLocalChecked();
    v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);

    Nan::SetPrototypeMethod(tpl, "contains", Contains);
    Nan::SetPrototypeMethod(tpl, "intersects", Intersects);

#define V(name, lowercase)                                                     \
  tpl->PrototypeTemplate()->SetAccessorProperty(                               \
      Nan::New(#lowercase).ToLocalChecked(),                                   \
      Nan::New<v8::FunctionTemplate>(name##Getter),                            \
      Nan::New<v8::FunctionTemplate>(name##Setter),                            \
      v8::PropertyAttribute::DontDelete);

    RECT_PROPERTIES(V);
#undef V

    tpl->SetClassName(name);
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    v8::Local<v8::Function> func = Nan::GetFunction(tpl).ToLocalChecked();
    constructor.Reset(func);

    Nan::Set(target, name, func);
    Nan::SetMethod(func, "setRealConstructor", SetRealConstructor);
  }

  static v8::MaybeLocal<v8::Value> NewRealInstance(
      v8::Isolate* isolate,
      size_t argc = 0,
      v8::Local<v8::Value>* argv = nullptr);

 protected:
  static NAN_METHOD(New);
  static NAN_METHOD(Contains);
  static NAN_METHOD(Intersects);

#define V(name, lowercase)                                                     \
  static NAN_METHOD(name##Getter);                                             \
  static NAN_METHOD(name##Setter);

  RECT_PROPERTIES(V);
#undef V

  static NAN_METHOD(SetRealConstructor);

 protected:
  Rect();
  Rect(T rect_left, T rect_top, T rect_width, T rect_height);
  Rect(const vector2::Vector2<T, NAN_T, V8_T>& pos,
       const vector2::Vector2<T, NAN_T, V8_T>& size);
  virtual ~Rect();

 protected:
  sf::Rect<T> _rect;
};

class IntRect : public Rect<int, int, v8::Int32> {
 public:
  static NAN_MODULE_INIT(Init);

 private:
  ~IntRect();
};

class FloatRect : public Rect<float, double, v8::Number> {
 public:
  static NAN_MODULE_INIT(Init);

 private:
  ~FloatRect();
};

}  // namespace rect
}  // namespace node_sfml

#endif  // SRC_RECT_H_
