#ifndef SRC_DRAWABLE_DRAWABLE_H_
#define SRC_DRAWABLE_DRAWABLE_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace drawable {

class Drawable : public Nan::ObjectWrap {
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
    Self::constructor.Reset(func);

    Nan::Set(target, name, func);
  }

  explicit Drawable(sf::Drawable* raw) : _raw(raw) {}
  ~Drawable() {
    if (_raw != nullptr) {
      delete _raw;
      _raw = nullptr;
    }
  }

  template <class TT>
  inline TT& raw() {
    return *(reinterpret_cast<TT*>(_raw));
  }

  inline sf::Drawable& raw() { return raw<sf::Drawable>(); }

  // TODO(XadillaX): `virtual void draw(...)`, etc.

 private:
  sf::Drawable* _raw = nullptr;
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_DRAWABLE_H_
