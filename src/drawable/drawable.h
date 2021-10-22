#ifndef SRC_DRAWABLE_DRAWABLE_H_
#define SRC_DRAWABLE_DRAWABLE_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace drawable {

class Drawable : public Nan::ObjectWrap {
 public:
  template <class Self, const char* class_name>
  inline static NAN_MODULE_INIT(Init);

  Drawable();
  explicit Drawable(sf::Drawable* raw);
  virtual ~Drawable();

  template <class TT>
  inline TT& raw() {
    return *(reinterpret_cast<TT*>(_raw));
  }

  inline sf::Drawable& raw() { return raw<sf::Drawable>(); }

  // TODO(XadillaX): `virtual void draw(...)`, etc.

 protected:
  sf::Drawable* _raw;
};

class DrawableWithTexture : public Drawable {
 public:
  DrawableWithTexture();
  explicit DrawableWithTexture(sf::Drawable* raw);
  virtual ~DrawableWithTexture();

  virtual void SetTexture(v8::Local<v8::Object> texture_object,
                          bool reset_rect = false);
  v8::MaybeLocal<v8::Object> GetTexture();

 private:
  Nan::Persistent<v8::Object> _texture;
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_DRAWABLE_H_
