#include "sprite.h"
#include "shape-inl.h"

namespace node_sfml {
namespace drawable {

using v8::FunctionTemplate;
using v8::Int32;
using v8::Local;
using v8::Object;
using v8::Value;

const char sprite_name[] = "Sprite";

Nan::Persistent<v8::Function> Sprite::constructor;

NAN_MODULE_INIT(Sprite::Init) {
  CommonDrawable1<sf::Sprite>::Init<Sprite, sprite_name>(target);
}

void Sprite::SetPrototype(Local<FunctionTemplate>* _tpl) {
  CommonDrawable1<sf::Sprite>::SetPrototype(_tpl);

  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;
  Nan::SetPrototypeMethod(tpl, "setTexture", SetTexture);
  Nan::SetPrototypeMethod(tpl, "setTextureRect", SetTextureRect);
  Nan::SetPrototypeMethod(tpl, "setColor", SetColor);

  Nan::SetPrototypeMethod(tpl, "getTexture", GetTexture);
  Nan::SetPrototypeMethod(tpl, "getTextureRect", GetTextureRect);
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

NAN_METHOD(Sprite::SetTexture) {
  Sprite* sprite = Nan::ObjectWrap::Unwrap<Sprite>(info.Holder());
  sprite->SetTexture(info[0].As<Object>());
}

NAN_METHOD(Sprite::GetTexture) {
  Sprite* sprite = Nan::ObjectWrap::Unwrap<Sprite>(info.Holder());
  if (sprite->_texture.IsEmpty()) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }

  info.GetReturnValue().Set(sprite->_texture.Get(info.GetIsolate()));
}

NAN_METHOD(Sprite::SetTextureRect) {
  Sprite* sprite = Nan::ObjectWrap::Unwrap<Sprite>(info.Holder());
  rect::IntRect* rect =
      Nan::ObjectWrap::Unwrap<rect::IntRect>(info[1].As<Object>());
  sprite->raw<sf::Sprite>().setTextureRect(*rect);
}

NAN_METHOD(Sprite::GetTextureRect) {
  Sprite* sprite = Nan::ObjectWrap::Unwrap<Sprite>(info.Holder());
  sf::IntRect rect = sprite->raw<sf::Sprite>().getTextureRect();
  int argc = 4;
  Local<Value> argv[] = {
      Nan::New<Int32>(rect.left),
      Nan::New<Int32>(rect.top),
      Nan::New<Int32>(rect.width),
      Nan::New<Int32>(rect.height),
  };
  rect::IntRect::NewRealInstance(info.GetIsolate(), argc, argv);
}

NAN_METHOD(Sprite::SetColor) {
  Sprite* sprite = Nan::ObjectWrap::Unwrap<Sprite>(info.Holder());
  sf::Sprite& raw = sprite->raw<sf::Sprite>();
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  raw.setColor(*color);
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

Sprite::Sprite() : CommonDrawable1<sf::Sprite>(new sf::Sprite()) {}

Sprite::Sprite(Local<Object> texture_object, const texture::Texture& texture)
    : CommonDrawable1<sf::Sprite>(new sf::Sprite(texture.texture())) {
  _texture.Reset(texture_object);
}

Sprite::Sprite(Local<Object> texture_object,
               const texture::Texture& texture,
               const rect::IntRect& rect)
    : CommonDrawable1<sf::Sprite>(new sf::Sprite(texture.texture(), rect)) {
  _texture.Reset(texture_object);
}

Sprite::~Sprite() {
  _texture.Reset();
}

void Sprite::SetTexture(Local<Object> texture_object) {
  texture::Texture* texture =
      Nan::ObjectWrap::Unwrap<texture::Texture>(texture_object);
  this->raw<sf::Sprite>().setTexture(texture->texture());
}

}  // namespace drawable
}  // namespace node_sfml
