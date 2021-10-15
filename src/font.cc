#include "font.h"
#include "rect-inl.h"

namespace node_sfml {
namespace font {

using v8::Function;
using v8::FunctionTemplate;
using v8::Local;
using v8::MaybeLocal;
using v8::Number;
using v8::Object;
using v8::String;

Nan::Persistent<Function> constructor;

NAN_MODULE_INIT(Font::Init) {
  Local<String> name = Nan::New("Font").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "loadFromFile", LoadFromFile);
  Nan::SetPrototypeMethod(tpl, "getInfo", GetInfo);
  Nan::SetPrototypeMethod(tpl, "getGlyph", GetGlyph);
  Nan::SetPrototypeMethod(tpl, "getKerning", GetKerning);
  Nan::SetPrototypeMethod(tpl, "getLineSpacing", GetLineSpacing);
  Nan::SetPrototypeMethod(tpl, "getUnderlinePosition", GetUnderlinePosition);
  Nan::SetPrototypeMethod(tpl, "getUnderlineThickness", GetUnderlineThickness);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
}

NAN_METHOD(Font::New) {
  Font* font = new Font();
  font->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Font::LoadFromFile) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  Nan::Utf8String filename(info[0].As<String>());

  // TODO(XadillaX): asyncify.
  info.GetReturnValue().Set(font->loadFromFile(*filename));
}

NAN_METHOD(Font::GetInfo) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Font::Info font_info = font->getInfo();

  Local<Object> ret = Nan::New<Object>();
  Nan::Set(ret,
           Nan::New<String>("family").ToLocalChecked(),
           Nan::New<String>(font_info.family.c_str()).ToLocalChecked());
  info.GetReturnValue().Set(ret);
}

NAN_METHOD(Font::GetGlyph) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Uint32 code_point = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::Uint32 character_size = Nan::To<sf::Uint32>(info[1]).FromJust();
  bool bold = Nan::To<bool>(info[2]).FromJust();
  float outline_thickness =
      static_cast<float>(Nan::To<double>(info[3]).FromJust());

  sf::Glyph glyph =
      font->getGlyph(code_point, character_size, bold, outline_thickness);

  Local<Object> ret = Nan::New<Object>();
  Nan::Set(ret,
           Nan::New<String>("advance").ToLocalChecked(),
           Nan::New<Number>(static_cast<double>(glyph.advance)));

  Nan::TryCatch try_catch;
  MaybeLocal<Object> maybe_float_rect_object =
      rect::FloatRect::NewRealInstance(info.GetIsolate());
  if (maybe_float_rect_object.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }
  Local<Object> float_rect_object = maybe_float_rect_object.ToLocalChecked();
  rect::FloatRect* float_rect =
      Nan::ObjectWrap::Unwrap<rect::FloatRect>(float_rect_object);
  float_rect->top = glyph.bounds.top;
  float_rect->left = glyph.bounds.left;
  float_rect->width = glyph.bounds.width;
  float_rect->height = glyph.bounds.height;
  Nan::Set(ret, Nan::New<String>("bounds").ToLocalChecked(), float_rect_object);

  MaybeLocal<Object> maybe_int_rect_object =
      rect::IntRect::NewRealInstance(info.GetIsolate());
  if (maybe_int_rect_object.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }
  Local<Object> int_rect_object = maybe_int_rect_object.ToLocalChecked();
  rect::IntRect* int_rect =
      Nan::ObjectWrap::Unwrap<rect::IntRect>(int_rect_object);
  int_rect->top = glyph.textureRect.top;
  int_rect->left = glyph.textureRect.left;
  int_rect->width = glyph.textureRect.width;
  int_rect->height = glyph.textureRect.height;
  Nan::Set(
      ret, Nan::New<String>("textureRect").ToLocalChecked(), int_rect_object);

  info.GetReturnValue().Set(ret);
}

NAN_METHOD(Font::GetKerning) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Uint32 first = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::Uint32 second = Nan::To<sf::Uint32>(info[1]).FromJust();
  sf::Uint32 character_size = Nan::To<sf::Uint32>(info[2]).FromJust();

  float kerning = font->getKerning(first, second, character_size);
  info.GetReturnValue().Set(static_cast<double>(kerning));
}

NAN_METHOD(Font::GetLineSpacing) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Uint32 character_size = Nan::To<sf::Uint32>(info[0]).FromJust();

  float line_spacing = font->getLineSpacing(character_size);
  info.GetReturnValue().Set(static_cast<double>(line_spacing));
}

NAN_METHOD(Font::GetUnderlinePosition) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Uint32 character_size = Nan::To<sf::Uint32>(info[0]).FromJust();

  float underline_position = font->getUnderlinePosition(character_size);
  info.GetReturnValue().Set(static_cast<double>(underline_position));
}

NAN_METHOD(Font::GetUnderlineThickness) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Uint32 character_size = Nan::To<sf::Uint32>(info[0]).FromJust();

  float underline_thickness = font->getUnderlinePosition(character_size);
  info.GetReturnValue().Set(static_cast<double>(underline_thickness));
}

Font::Font() {}
Font::Font(const sf::Font& copy) : sf::Font(copy) {}
Font::~Font() {}

}  // namespace font
}  // namespace node_sfml
