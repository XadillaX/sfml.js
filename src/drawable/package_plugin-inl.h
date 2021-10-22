#ifndef SRC_DRAWABLE_PACKAGE_PLUGIN_INL_H_
#define SRC_DRAWABLE_PACKAGE_PLUGIN_INL_H_

#include "../color.h"
#include "../rect.h"
#include "../texture.h"
#include "drawable.h"
#include "package_plugin.h"

namespace node_sfml {
namespace drawable {
namespace pacekage_plugin_texture {

template <class T, class RAW_T>
inline void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "setTexture", SetTexture<T>);
  Nan::SetPrototypeMethod(tpl, "getTexture", GetTexture<T>);
  Nan::SetPrototypeMethod(tpl, "setTextureRect", SetTextureRect<RAW_T>);
  Nan::SetPrototypeMethod(tpl, "getTextureRect", GetTextureRect<RAW_T>);
}

template <class T>
inline static NAN_METHOD(SetTexture) {
  T* drawable = Nan::ObjectWrap::Unwrap<T>(info.Holder());
  drawable->SetTexture(info[0].As<v8::Object>());
}

template <class T>
inline static NAN_METHOD(SetTextureRect) {
  Drawable* target = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  rect::IntRect* rect =
      Nan::ObjectWrap::Unwrap<rect::IntRect>(info[0].As<v8::Object>());
  target->raw<T>().setTextureRect(rect->rect());
}

template <class T>
inline static NAN_METHOD(GetTexture) {
  T* drawable = Nan::ObjectWrap::Unwrap<T>(info.Holder());
  v8::MaybeLocal<v8::Object> texture = drawable->GetTexture();
  if (texture.IsEmpty()) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  info.GetReturnValue().Set(texture.ToLocalChecked());
}

template <class T>
inline static NAN_METHOD(GetTextureRect) {
  Drawable* sprite = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  sf::IntRect rect = sprite->raw<T>().getTextureRect();
  int argc = 4;
  v8::Local<v8::Value> argv[] = {
      Nan::New<v8::Int32>(rect.left),
      Nan::New<v8::Int32>(rect.top),
      Nan::New<v8::Int32>(rect.width),
      Nan::New<v8::Int32>(rect.height),
  };
  rect::IntRect::NewRealInstance(info.GetIsolate(), argc, argv);
}

}  // namespace pacekage_plugin_texture

namespace pacekage_plugin_bounds {

template <class T>
inline void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "getLocalBounds", GetLocalBounds<T>);
  Nan::SetPrototypeMethod(tpl, "getGlobalBounds", GetGlobalBounds<T>);
}

#define GET_BOUNDS_IMPL(type)                                                  \
  template <class T>                                                           \
  inline NAN_METHOD(Get##type##Bounds) {                                       \
    Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());     \
    sf::FloatRect rect = drawable->raw<T>().get##type##Bounds();               \
                                                                               \
    Nan::TryCatch try_catch;                                                   \
    v8::MaybeLocal<v8::Object> maybe_rect =                                    \
        rect::FloatRect::NewRealInstance(info.GetIsolate());                   \
    if (try_catch.HasCaught()) {                                               \
      try_catch.ReThrow();                                                     \
      return;                                                                  \
    }                                                                          \
                                                                               \
    v8::Local<v8::Object> node_rect = maybe_rect.ToLocalChecked();             \
    sf::FloatRect& ret =                                                       \
        Nan::ObjectWrap::Unwrap<rect::FloatRect>(node_rect)->rect();           \
    ret.top = rect.top;                                                        \
    ret.left = rect.left;                                                      \
    ret.width = rect.width;                                                    \
    ret.height = rect.height;                                                  \
                                                                               \
    info.GetReturnValue().Set(node_rect);                                      \
  }

GET_BOUNDS_IMPL(Local);
GET_BOUNDS_IMPL(Global);

#undef GET_BOUNDS_IMPL

}  // namespace pacekage_plugin_bounds

namespace pacekage_plugin_color_and_thickness {

template <class T>
inline void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "setFillColor", SetFillColor<T>);
  Nan::SetPrototypeMethod(tpl, "getFillColor", GetFillColor<T>);

  Nan::SetPrototypeMethod(tpl, "setOutlineColor", SetOutlineColor<T>);
  Nan::SetPrototypeMethod(tpl, "getOutlineColor", GetOutlineColor<T>);

  Nan::SetPrototypeMethod(tpl, "setOutlineThickness", SetOutlineThickness<T>);
  Nan::SetPrototypeMethod(tpl, "getOutlineThickness", GetOutlineThickness<T>);
}

template <class T>
inline NAN_METHOD(SetFillColor) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  drawable->raw<T>().setFillColor(color->color());
}

template <class T>
inline NAN_METHOD(GetFillColor) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  const sf::Color color = drawable->raw<T>().getFillColor();

  v8::MaybeLocal<v8::Object> ret =
      color::Color::NewRealColorInstance(info.GetIsolate(), color.toInteger());
  if (ret.IsEmpty()) return;

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
inline NAN_METHOD(SetOutlineColor) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  drawable->raw<T>().setOutlineColor(color->color());
}

template <class T>
inline NAN_METHOD(GetOutlineColor) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  const sf::Color color = drawable->raw<T>().getOutlineColor();

  v8::MaybeLocal<v8::Object> ret =
      color::Color::NewRealColorInstance(info.GetIsolate(), color.toInteger());
  if (ret.IsEmpty()) return;

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
inline NAN_METHOD(SetOutlineThickness) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  float thickness = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  drawable->raw<T>().setOutlineThickness(thickness);
}

template <class T>
inline NAN_METHOD(GetOutlineThickness) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  float thickness = drawable->raw<T>().getOutlineThickness();
  info.GetReturnValue().Set(static_cast<double>(thickness));
}

}  // namespace pacekage_plugin_color_and_thickness
}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_PACKAGE_PLUGIN_INL_H_
