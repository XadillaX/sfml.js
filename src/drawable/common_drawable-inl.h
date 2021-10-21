#ifndef SRC_DRAWABLE_COMMON_DRAWABLE_INL_H_
#define SRC_DRAWABLE_COMMON_DRAWABLE_INL_H_

#include "common_drawable.h"

#include "../color.h"
#include "../rect-inl.h"
#include "../vector2-inl.h"

namespace node_sfml {
namespace drawable {

template <class T>
inline void CommonDrawable1::SetPrototype(
    v8::Local<v8::FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "getLocalBounds", GetLocalBounds<T>);
  Nan::SetPrototypeMethod(tpl, "getGlobalBounds", GetGlobalBounds<T>);

  Nan::SetPrototypeMethod(tpl, "setPosition", SetPosition<T>);
  Nan::SetPrototypeMethod(tpl, "getPosition", GetPosition<T>);

  Nan::SetPrototypeMethod(tpl, "setRotation", SetRotation<T>);
  Nan::SetPrototypeMethod(tpl, "getRotation", GetRotation<T>);

  Nan::SetPrototypeMethod(tpl, "setScale", SetScale<T>);
  Nan::SetPrototypeMethod(tpl, "getScale", GetScale<T>);

  Nan::SetPrototypeMethod(tpl, "setOrigin", SetScale<T>);
  Nan::SetPrototypeMethod(tpl, "getOrigin", GetScale<T>);

  Nan::SetPrototypeMethod(tpl, "move", Move<T>);
}

#define VECTOR2F_GETTER_SETTER(name)                                           \
  template <class T>                                                           \
  inline NAN_METHOD(CommonDrawable1::Set##name) {                              \
    CommonDrawable1* drawable =                                                \
        Nan::ObjectWrap::Unwrap<CommonDrawable1>(info.Holder());               \
                                                                               \
    switch (info.Length()) {                                                   \
      case 1: {                                                                \
        vector2::Vector2F* val = Nan::ObjectWrap::Unwrap<vector2::Vector2F>(   \
            info[0].As<v8::Object>());                                         \
        drawable->raw<T>().set##name(val->vector2());                          \
        break;                                                                 \
      }                                                                        \
                                                                               \
      case 2:                                                                  \
      default: {                                                               \
        float x = static_cast<float>(Nan::To<double>(info[0]).FromJust());     \
        float y = static_cast<float>(Nan::To<double>(info[1]).FromJust());     \
        drawable->raw<T>().set##name(x, y);                                    \
        break;                                                                 \
      }                                                                        \
    }                                                                          \
  }                                                                            \
                                                                               \
  template <class T>                                                           \
  inline NAN_METHOD(CommonDrawable1::Get##name) {                              \
    CommonDrawable1* drawable =                                                \
        Nan::ObjectWrap::Unwrap<CommonDrawable1>(info.Holder());               \
                                                                               \
    const sf::Vector2f& val = drawable->raw<T>().get##name();                  \
                                                                               \
    Nan::TryCatch try_catch;                                                   \
    v8::MaybeLocal<v8::Object> maybe_vec =                                     \
        vector2::Vector2F::NewRealInstance(info.GetIsolate(), val);            \
    if (maybe_vec.IsEmpty()) {                                                 \
      try_catch.ReThrow();                                                     \
      return;                                                                  \
    }                                                                          \
                                                                               \
    info.GetReturnValue().Set(maybe_vec.ToLocalChecked());                     \
  }

VECTOR2F_GETTER_SETTER(Position);
VECTOR2F_GETTER_SETTER(Scale);
VECTOR2F_GETTER_SETTER(Origin);

template <class T>
inline NAN_METHOD(CommonDrawable1::SetRotation) {
  CommonDrawable1* drawable =
      Nan::ObjectWrap::Unwrap<CommonDrawable1>(info.Holder());
  float rotation = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  drawable->raw<T>().setRotation(rotation);
}

template <class T>
inline NAN_METHOD(CommonDrawable1::GetRotation) {
  CommonDrawable1* drawable =
      Nan::ObjectWrap::Unwrap<CommonDrawable1>(info.Holder());
  float rotation = drawable->raw<T>().getRotation();
  info.GetReturnValue().Set(static_cast<double>(rotation));
}

template <class T>
inline NAN_METHOD(CommonDrawable1::Move) {
  CommonDrawable1* drawable =
      Nan::ObjectWrap::Unwrap<CommonDrawable1>(info.Holder());

  if (info.Length() == 1) {
    vector2::Vector2F* offset =
        Nan::ObjectWrap::Unwrap<vector2::Vector2F>(info[0].As<v8::Object>());
    drawable->raw<T>().move(offset->vector2());
    return;
  }

  float offset_x = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  float offset_y = static_cast<float>(Nan::To<double>(info[1]).FromJust());
  drawable->raw<T>().move(offset_x, offset_y);
}

#define GET_BOUNDS_IMPL(type)                                                  \
  template <class T>                                                           \
  inline NAN_METHOD(CommonDrawable1::Get##type##Bounds) {                      \
    CommonDrawable1* drawable =                                                \
        Nan::ObjectWrap::Unwrap<CommonDrawable1>(info.Holder());               \
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

template <class T>
inline void CommonDrawable2::SetPrototype(
    v8::Local<v8::FunctionTemplate>* _tpl) {
  CommonDrawable1::SetPrototype<T>(_tpl);

  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;
  Nan::SetPrototypeMethod(tpl, "setFillColor", SetFillColor<T>);
  Nan::SetPrototypeMethod(tpl, "getFillColor", GetFillColor<T>);

  Nan::SetPrototypeMethod(tpl, "setOutlineColor", SetOutlineColor<T>);
  Nan::SetPrototypeMethod(tpl, "getOutlineColor", GetOutlineColor<T>);

  Nan::SetPrototypeMethod(tpl, "setOutlineThickness", SetOutlineThickness<T>);
  Nan::SetPrototypeMethod(tpl, "getOutlineThickness", GetOutlineThickness<T>);
}

template <class T>
inline NAN_METHOD(CommonDrawable2::SetFillColor) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  drawable->raw<T>().setFillColor(color->color());
}

template <class T>
inline NAN_METHOD(CommonDrawable2::GetFillColor) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  const sf::Color color = drawable->raw<T>().getFillColor();

  v8::MaybeLocal<v8::Object> ret =
      color::Color::NewRealColorInstance(info.GetIsolate(), color.toInteger());
  if (ret.IsEmpty()) return;

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
inline NAN_METHOD(CommonDrawable2::SetOutlineColor) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  drawable->raw<T>().setOutlineColor(color->color());
}

template <class T>
inline NAN_METHOD(CommonDrawable2::GetOutlineColor) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  const sf::Color color = drawable->raw<T>().getOutlineColor();

  v8::MaybeLocal<v8::Object> ret =
      color::Color::NewRealColorInstance(info.GetIsolate(), color.toInteger());
  if (ret.IsEmpty()) return;

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
inline NAN_METHOD(CommonDrawable2::SetOutlineThickness) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  float thickness = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  drawable->raw<T>().setOutlineThickness(thickness);
}

template <class T>
inline NAN_METHOD(CommonDrawable2::GetOutlineThickness) {
  Drawable* drawable = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  float thickness = drawable->raw<T>().getOutlineThickness();
  info.GetReturnValue().Set(static_cast<double>(thickness));
}

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_COMMON_DRAWABLE_INL_H_
