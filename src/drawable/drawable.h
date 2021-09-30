#ifndef SRC_DRAWABLE_DRAWABLE_H_
#define SRC_DRAWABLE_DRAWABLE_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace drawable {

class BaseDrawable : public Nan::ObjectWrap {
 public:
  explicit BaseDrawable(sf::Drawable* raw) : _raw(raw) {}
  ~BaseDrawable() {
    if (_raw != nullptr) {
      delete _raw;
      _raw = nullptr;
    }
  }

  template <class T>
  inline T& raw() {
    return *(reinterpret_cast<T*>(_raw));
  }

 private:
  sf::Drawable* _raw = nullptr;
};

template <class T>
class Drawable : public BaseDrawable {
 public:
  static Nan::Persistent<v8::Function> constructor;

  template <class Self, const char* class_name>
  static NAN_MODULE_INIT(Init) {
    v8::Local<v8::String> name = Nan::New(class_name).ToLocalChecked();
    v8::Local<v8::FunctionTemplate> tpl =
        Nan::New<v8::FunctionTemplate>(Self::New);

    Self::SetPrototype(&tpl);

    tpl->SetClassName(name);
    tpl->InstanceTemplate()->SetInternalFieldCount(1);

    v8::Local<v8::Function> func = Nan::GetFunction(tpl).ToLocalChecked();
    constructor.Reset(func);

    Nan::Set(target, name, func);
  }

 protected:
  inline T& raw() { return BaseDrawable::raw<T>(); }
  explicit Drawable(sf::Drawable* raw) : BaseDrawable(raw) {}

  // TODO(XadillaX): `virtual void draw(...)`, etc.
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_DRAWABLE_H_
