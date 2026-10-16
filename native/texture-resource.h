#pragma once

#include "numeric-fields.h"

#include <SFML/Graphics/Texture.hpp>

namespace sfmljs {

SFMLJS_MEMBER(TextureSize, sf::Texture, sf::Vector2u, m_size);
SFMLJS_MEMBER(TextureId, sf::Texture, unsigned int, m_texture);
SFMLJS_MEMBER(TextureSmooth, sf::Texture, bool, m_isSmooth);
SFMLJS_MEMBER(TextureSrgb, sf::Texture, bool, m_sRgb);
SFMLJS_MEMBER(TextureRepeated, sf::Texture, bool, m_isRepeated);

inline v8::Local<v8::Object> MapTexture(
    const std::shared_ptr<const sf::Texture>& texture) {
  const auto& size = Field<TextureSize>(*texture);
  return NumericFields()
      .Add("width", size.x).Add("height", size.y)
      .Add("nativeHandle", Field<TextureId>(*texture))
      .Add("smooth", Field<TextureSmooth>(*texture))
      .Add("sRgb", Field<TextureSrgb>(*texture))
      .Add("repeated", Field<TextureRepeated>(*texture)).Map(texture);
}

// RenderTexture lends a const alias; ordinary Texture owns a writable handle.
inline std::shared_ptr<const sf::Texture> ReadTexture(v8::Local<v8::Value> value) {
  if (auto* handle = SharedHandle<sf::Texture>::TryFrom(value)) {
    return handle->owner();
  }
  if (auto* handle = SharedHandle<const sf::Texture>::TryFrom(value)) {
    return handle->owner();
  }
  Nan::ThrowTypeError("Expected a texture handle");
  return {};
}

inline v8::Local<v8::Object> DescribeTexture(const sf::Texture& texture) {
  auto result = Nan::New<v8::Object>();
  const auto size = texture.getSize();
  Nan::Set(result, Nan::New("width").ToLocalChecked(), Nan::New(size.x)).FromJust();
  Nan::Set(result, Nan::New("height").ToLocalChecked(), Nan::New(size.y)).FromJust();
  Nan::Set(result, Nan::New("smooth").ToLocalChecked(),
           Nan::New(texture.isSmooth())).FromJust();
  Nan::Set(result, Nan::New("repeated").ToLocalChecked(),
           Nan::New(texture.isRepeated())).FromJust();
  Nan::Set(result, Nan::New("sRgb").ToLocalChecked(),
           Nan::New(texture.isSrgb())).FromJust();
  return result;
}

}  // namespace sfmljs
