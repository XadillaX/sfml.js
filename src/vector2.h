#ifndef SRC_VECTOR2_H_
#define SRC_VECTOR2_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace vector2 {

#define VECTOR2_PROPERTIES(V)                                                  \
  V(X, x)                                                                      \
  V(Y, y)

template <typename T, typename NAN_T, class V8_T>
class Vector2 : public Nan::ObjectWrap, public sf::Vector2<T> {
 public:
  static Nan::Persistent<v8::Function> constructor;
  static Nan::Persistent<v8::Function> real_constructor;

  template <const char* class_name>
  static NAN_MODULE_INIT(Init) {
    v8::Local<v8::String> name = Nan::New(class_name).ToLocalChecked();
    v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(New);

#define V(name, lowercase)                                                     \
  tpl->PrototypeTemplate()->SetAccessorProperty(                               \
      Nan::New(#lowercase).ToLocalChecked(),                                   \
      Nan::New<v8::FunctionTemplate>(name##Getter),                            \
      Nan::New<v8::FunctionTemplate>(name##Setter),                            \
      v8::PropertyAttribute::DontDelete);

    VECTOR2_PROPERTIES(V);
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

  static v8::MaybeLocal<v8::Object> NewRealInstance(
      v8::Isolate* isolate,
      size_t argc = 0,
      v8::Local<v8::Value>* argv = nullptr);

 protected:
  static NAN_METHOD(New);

#define V(name, lowercase)                                                     \
  static NAN_METHOD(name##Getter);                                             \
  static NAN_METHOD(name##Setter);

  VECTOR2_PROPERTIES(V);
#undef V

  static NAN_METHOD(SetRealConstructor);

 protected:
  Vector2();
  Vector2(T x, T y);
  Vector2(const Vector2<T, NAN_T, V8_T>& vec);
  virtual ~Vector2();
};

class Vector2I : public Vector2<int, int, v8::Int32> {
 public:
  static NAN_MODULE_INIT(Init);

 private:
  ~Vector2I();
};

class Vector2U : public Vector2<sf::Uint32, sf::Uint32, v8::Uint32> {
 public:
  static NAN_MODULE_INIT(Init);

 private:
  ~Vector2U();
};

class Vector2F : public Vector2<float, double, v8::Number> {
 public:
  static NAN_MODULE_INIT(Init);

 private:
  ~Vector2F();
};

}  // namespace vector2
}  // namespace node_sfml

#endif  // SRC_VECTOR2_H_
