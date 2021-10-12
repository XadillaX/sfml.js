#ifndef SRC_RECT_H_
#define SRC_RECT_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace rect {

#define RECT_PROPERTIES(V)                                                     \
  V(Left, left)                                                                \
  V(Top, top)                                                                  \
  V(Width, width)                                                              \
  V(Height, height)

template <typename T, typename NAN_T, class V8_T>
class Rect : public Nan::ObjectWrap, sf::Rect<T> {
 public:
  static Nan::Persistent<v8::Function> constructor;
  static Nan::Persistent<v8::Function> real_constructor;

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

    Nan::Set(
        func,
        Nan::New("setRealConstructor").ToLocalChecked(),
        Nan::GetFunction(Nan::New<v8::FunctionTemplate>(SetRealConstructor))
            .ToLocalChecked());
  }

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
  virtual ~Rect();
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
