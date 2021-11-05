#ifndef SRC_TEXTURE_H_
#define SRC_TEXTURE_H_

#include <nan.h>

#include <SFML/Graphics/Texture.hpp>

#include "base_class_with_loading.h"

namespace node_sfml {
namespace texture {

class Texture : public Nan::ObjectWrap, public BaseClassWithLoading {
 public:
  static NAN_MODULE_INIT(Init);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(Create);
  static NAN_METHOD(LoadFromFile);
  static NAN_METHOD(LoadFromMemory);
  static NAN_METHOD(LoadFromFileSync);
  static NAN_METHOD(GetSize);

  static NAN_METHOD(SetSmooth);

  // Update family
  static NAN_METHOD(UpdateByImage);
  static NAN_METHOD(UpdateByTexture);

  inline const sf::Texture& texture() const { return _texture; }
  inline sf::Texture& mutable_texture() { return _texture; }

 private:
  Texture();
  explicit Texture(const Texture& src);
  virtual ~Texture();

 private:
  sf::Texture _texture;
};

}  // namespace texture
}  // namespace node_sfml

#endif  // SRC_TEXTURE_H_
