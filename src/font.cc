#include "font.h"
#include "rect-inl.h"
#include "workers/load_from_file_worker.h"

namespace node_sfml {
namespace font {

using v8::Function;
using v8::FunctionTemplate;
using v8::Local;
using v8::MaybeLocal;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

Nan::Persistent<Function> constructor;

NAN_MODULE_INIT(Font::Init) {
  Local<String> name = Nan::New("Font").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "loadFromMemory", LoadFromMemory);
  Nan::SetPrototypeMethod(tpl, "loadFromFileSync", LoadFromFileSync);
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

inline bool LoadFromFileFunction(void* target,
                                 const std::string& filename,
                                 void* _) {
  return static_cast<Font*>(target)->font().loadFromFile(filename);
}

NAN_METHOD(Font::LoadFromFile) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  if (font->_loading) {
    Local<Value> err = Nan::Error("Font is loading.");
    info.GetReturnValue().Set(err);

    return;
  }

  font->_related_buffer.Reset();
  font->_loading = true;
  Local<String> v8_filename = info[0].As<String>();
  Nan::Utf8String utf8_filename(v8_filename);
  Nan::Callback* callback = new Nan::Callback(info[1].As<Function>());

  load_from_file_worker::LoadFromFileWorker<Font, void>* worker =
      new load_from_file_worker::LoadFromFileWorker<Font, void>(
          info.Holder(),
          *utf8_filename,
          LoadFromFileFunction,
          nullptr,
          callback);
  Nan::AsyncQueueWorker(worker);
}

NAN_METHOD(Font::LoadFromFileSync) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  font->_related_buffer.Reset();
  Nan::Utf8String filename(info[0].As<String>());
  info.GetReturnValue().Set(font->_font->loadFromFile(*filename));
}

NAN_METHOD(Font::LoadFromMemory) {
  Font* fnt = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  if (fnt->_loading) {
    Nan::ThrowError("Font is loading.");
    return;
  }

  fnt->_related_buffer.Reset(info[0].As<Object>());
  const char* buff = node::Buffer::Data(info[0]);
  size_t length = node::Buffer::Length(info[0]);
  info.GetReturnValue().Set(fnt->_font->loadFromMemory(buff, length));
}

NAN_METHOD(Font::GetInfo) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Font::Info font_info = font->_font->getInfo();

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

  sf::Glyph glyph = font->_font->getGlyph(
      code_point, character_size, bold, outline_thickness);

  Local<Object> ret = Nan::New<Object>();
  Nan::Set(ret,
           Nan::New<String>("advance").ToLocalChecked(),
           Nan::New<Number>(static_cast<double>(glyph.advance)));

  Nan::TryCatch try_catch;
  MaybeLocal<Value> maybe_float_rect_object =
      rect::FloatRect::NewRealInstance(info.GetIsolate());
  if (maybe_float_rect_object.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }
  Local<Object> float_rect_object =
      maybe_float_rect_object.ToLocalChecked().As<Object>();
  rect::FloatRect* float_rect =
      Nan::ObjectWrap::Unwrap<rect::FloatRect>(float_rect_object);
  sf::FloatRect& float_rect_inner = float_rect->rect();
  float_rect_inner.top = glyph.bounds.top;
  float_rect_inner.left = glyph.bounds.left;
  float_rect_inner.width = glyph.bounds.width;
  float_rect_inner.height = glyph.bounds.height;
  Nan::Set(ret, Nan::New<String>("bounds").ToLocalChecked(), float_rect_object);

  MaybeLocal<Value> maybe_int_rect_object =
      rect::IntRect::NewRealInstance(info.GetIsolate());
  if (maybe_int_rect_object.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }
  Local<Object> int_rect_object =
      maybe_int_rect_object.ToLocalChecked().As<Object>();
  rect::IntRect* int_rect =
      Nan::ObjectWrap::Unwrap<rect::IntRect>(int_rect_object);
  sf::IntRect& int_rect_inner = int_rect->rect();
  int_rect_inner.top = glyph.textureRect.top;
  int_rect_inner.left = glyph.textureRect.left;
  int_rect_inner.width = glyph.textureRect.width;
  int_rect_inner.height = glyph.textureRect.height;
  Nan::Set(
      ret, Nan::New<String>("textureRect").ToLocalChecked(), int_rect_object);

  info.GetReturnValue().Set(ret);
}

NAN_METHOD(Font::GetKerning) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Uint32 first = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::Uint32 second = Nan::To<sf::Uint32>(info[1]).FromJust();
  sf::Uint32 character_size = Nan::To<sf::Uint32>(info[2]).FromJust();

  float kerning = font->_font->getKerning(first, second, character_size);
  info.GetReturnValue().Set(static_cast<double>(kerning));
}

NAN_METHOD(Font::GetLineSpacing) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Uint32 character_size = Nan::To<sf::Uint32>(info[0]).FromJust();

  float line_spacing = font->_font->getLineSpacing(character_size);
  info.GetReturnValue().Set(static_cast<double>(line_spacing));
}

NAN_METHOD(Font::GetUnderlinePosition) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Uint32 character_size = Nan::To<sf::Uint32>(info[0]).FromJust();

  float underline_position = font->_font->getUnderlinePosition(character_size);
  info.GetReturnValue().Set(static_cast<double>(underline_position));
}

NAN_METHOD(Font::GetUnderlineThickness) {
  Font* font = Nan::ObjectWrap::Unwrap<Font>(info.Holder());
  sf::Uint32 character_size = Nan::To<sf::Uint32>(info[0]).FromJust();

  float underline_thickness = font->_font->getUnderlinePosition(character_size);
  info.GetReturnValue().Set(static_cast<double>(underline_thickness));
}

Font::Font() : _font(new sf::Font()) {}
Font::Font(const sf::Font& copy) : _font(new sf::Font(copy)) {
  _related_buffer.Reset();
}

Font::~Font() {
  _related_buffer.Reset();
  if (_font != nullptr) {
    delete _font;
    _font = nullptr;
  }
}

}  // namespace font
}  // namespace node_sfml
