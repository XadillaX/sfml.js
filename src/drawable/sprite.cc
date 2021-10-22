#include "sprite.h"
#include "../color.h"
#include "../plugins/transformable_plugin-inl.h"
#include "../rect-inl.h"
#include "drawable-inl.h"
#include "package_plugin-inl.h"

namespace node_sfml {
namespace drawable {

using v8::FunctionTemplate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::Value;

const char sprite_name[] = "Sprite";
Nan::Persistent<v8::Function> Sprite::constructor;

NAN_MODULE_INIT(Sprite::Init) {
  Drawable::Init<Sprite, sprite_name>(target);
}

void Sprite::SetPrototype(Local<FunctionTemplate>* _tpl) {
  transformable::SetPrototype<Sprite>(_tpl);
  package_plugin_bounds::SetPrototype<sf::Sprite>(_tpl);
  package_plugin_texture::SetPrototype<Sprite, sf::Sprite>(_tpl);

  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;
  Nan::SetPrototypeMethod(tpl, "setColor", SetColor);
  Nan::SetPrototypeMethod(tpl, "getColor", GetColor);
}

NAN_METHOD(Sprite::New) {
  if (info.Length() == 0) {
    Sprite* sprite = new Sprite();
    sprite->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
    return;
  }

  texture::Texture* texture =
      Nan::ObjectWrap::Unwrap<texture::Texture>(info[0].As<Object>());
  if (info.Length() == 1) {
    Sprite* sprite = new Sprite(info[0].As<Object>(), *texture);
    sprite->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
    return;
  }

  rect::IntRect* rect =
      Nan::ObjectWrap::Unwrap<rect::IntRect>(info[1].As<Object>());
  Sprite* sprite = new Sprite(info[0].As<Object>(), *texture, *rect);
  sprite->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
  return;
}

NAN_METHOD(Sprite::SetColor) {
  Sprite* sprite = Nan::ObjectWrap::Unwrap<Sprite>(info.Holder());
  sf::Sprite& raw = sprite->raw<sf::Sprite>();
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  raw.setColor(color->color());
}

NAN_METHOD(Sprite::GetColor) {
  Sprite* sprite = Nan::ObjectWrap::Unwrap<Sprite>(info.Holder());
  sf::Sprite& raw = sprite->raw<sf::Sprite>();
  sf::Color color = raw.getColor();

  Nan::TryCatch try_catch;
  v8::MaybeLocal<v8::Object> ret =
      color::Color::NewRealColorInstance(info.GetIsolate(), color.toInteger());
  if (ret.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

Sprite::Sprite() : DrawableWithTexture(new sf::Sprite()) {}

Sprite::Sprite(Local<Object> texture_object, const texture::Texture& texture)
    : DrawableWithTexture(new sf::Sprite(texture.texture())) {
  DrawableWithTexture::SetTexture(texture_object);
}

Sprite::Sprite(Local<Object> texture_object,
               const texture::Texture& texture,
               const rect::IntRect& rect)
    : DrawableWithTexture(new sf::Sprite(texture.texture(), rect.rect())) {
  DrawableWithTexture::SetTexture(texture_object);
}

Sprite::~Sprite() {}

void Sprite::SetTexture(v8::Local<v8::Object> texture_object, bool reset_rect) {
  texture::Texture* texture =
      Nan::ObjectWrap::Unwrap<texture::Texture>(texture_object);
  raw<sf::Sprite>().setTexture(texture->texture(), reset_rect);
  DrawableWithTexture::SetTexture(texture_object);
}

}  // namespace drawable
}  // namespace node_sfml
