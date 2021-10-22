#ifndef SRC_DRAWABLE_SPRITE_H_
#define SRC_DRAWABLE_SPRITE_H_

#include "../rect.h"
#include "../texture.h"
#include "drawable.h"

namespace node_sfml {
namespace drawable {

class Sprite : public DrawableWithTexture {
 public:
  static Nan::Persistent<v8::Function> constructor;

  static NAN_MODULE_INIT(Init);
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

  const sf::Sprite& transformable() const {
    return *reinterpret_cast<sf::Sprite*>(_raw);
  }

  sf::Sprite& transformable() { return *reinterpret_cast<sf::Sprite*>(_raw); }

  virtual void SetTexture(v8::Local<v8::Object> texture_object,
                          bool reset_rect = false);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(SetColor);
  static NAN_METHOD(GetColor);

 private:
  Sprite();
  Sprite(v8::Local<v8::Object> texture_object, const texture::Texture& texture);
  Sprite(v8::Local<v8::Object> texture_object,
         const texture::Texture& texture,
         const rect::IntRect& rect);
  virtual ~Sprite();

 private:
  Nan::Persistent<v8::Object> _texture;
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SPRITE_H_
