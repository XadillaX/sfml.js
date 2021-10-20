#ifndef SRC_DRAWABLE_COMMON_DRAWABLE_INL_H_
#define SRC_DRAWABLE_COMMON_DRAWABLE_INL_H_

#include "common_drawable.h"

#include "../color.h"
#include "../rect-inl.h"
#include "../vector2-inl.h"

namespace node_sfml {
namespace drawable {

template <class T>
void CommonDrawable1<T>::SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "getLocalBounds", GetLocalBounds);
  Nan::SetPrototypeMethod(tpl, "getGlobalBounds", GetGlobalBounds);

  Nan::SetPrototypeMethod(tpl, "setPosition", SetPosition);
  Nan::SetPrototypeMethod(tpl, "getPosition", GetPosition);

  Nan::SetPrototypeMethod(tpl, "setRotation", SetRotation);
  Nan::SetPrototypeMethod(tpl, "getRotation", GetRotation);

  Nan::SetPrototypeMethod(tpl, "setScale", SetScale);
  Nan::SetPrototypeMethod(tpl, "getScale", GetScale);

  Nan::SetPrototypeMethod(tpl, "setOrigin", SetScale);
  Nan::SetPrototypeMethod(tpl, "getOrigin", GetScale);
}

#define VECTOR2F_GETTER_SETTER(name)                                           \
  template <class T>                                                           \
  NAN_METHOD(CommonDrawable1<T>::Set##name) {                                  \
    CommonDrawable1<T>* shape =                                                \
        Nan::ObjectWrap::Unwrap<CommonDrawable1<T>>(info.Holder());            \
                                                                               \
    switch (info.Length()) {                                                   \
      case 1: {                                                                \
        vector2::Vector2F* val = Nan::ObjectWrap::Unwrap<vector2::Vector2F>(   \
            info[0].As<v8::Object>());                                         \
        shape->raw<T>().set##name(*val);                                       \
        break;                                                                 \
      }                                                                        \
                                                                               \
      case 2:                                                                  \
      default: {                                                               \
        float x = static_cast<float>(Nan::To<double>(info[0]).FromJust());     \
        float y = static_cast<float>(Nan::To<double>(info[1]).FromJust());     \
        shape->raw<T>().set##name(x, y);                                       \
        break;                                                                 \
      }                                                                        \
    }                                                                          \
  }                                                                            \
                                                                               \
  template <class T>                                                           \
  NAN_METHOD(CommonDrawable1<T>::Get##name) {                                  \
    CommonDrawable1<T>* shape =                                                \
        Nan::ObjectWrap::Unwrap<CommonDrawable1<T>>(info.Holder());            \
                                                                               \
    const sf::Vector2f& val = shape->raw<T>().get##name();                     \
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
NAN_METHOD(CommonDrawable1<T>::SetRotation) {
  CommonDrawable1<T>* shape =
      Nan::ObjectWrap::Unwrap<CommonDrawable1<T>>(info.Holder());
  float rotation = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  shape->raw<T>().setRotation(rotation);
}

template <class T>
NAN_METHOD(CommonDrawable1<T>::GetRotation) {
  CommonDrawable1<T>* shape =
      Nan::ObjectWrap::Unwrap<CommonDrawable1<T>>(info.Holder());
  float rotation = shape->raw<T>().getRotation();
  info.GetReturnValue().Set(static_cast<double>(rotation));
}

#define GET_BOUNDS_IMPL(type)                                                  \
  template <class T>                                                           \
  NAN_METHOD(CommonDrawable1<T>::Get##type##Bounds) {                          \
    CommonDrawable1<T>* shape =                                                \
        Nan::ObjectWrap::Unwrap<CommonDrawable1<T>>(info.Holder());            \
    sf::FloatRect rect = shape->raw<T>().get##type##Bounds();                  \
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
    rect::FloatRect* ret =                                                     \
        Nan::ObjectWrap::Unwrap<rect::FloatRect>(node_rect);                   \
    ret->top = rect.top;                                                       \
    ret->left = rect.left;                                                     \
    ret->width = rect.width;                                                   \
    ret->height = rect.height;                                                 \
                                                                               \
    info.GetReturnValue().Set(node_rect);                                      \
  }

GET_BOUNDS_IMPL(Local);
GET_BOUNDS_IMPL(Global);

template <class T>
CommonDrawable1<T>::CommonDrawable1() : Drawable() {}

template <class T>
CommonDrawable1<T>::CommonDrawable1(T* raw) : Drawable(raw) {}

template <class T>
void CommonDrawable2<T>::SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  CommonDrawable1<T>::SetPrototype(_tpl);

  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;
  Nan::SetPrototypeMethod(tpl, "setFillColor", SetFillColor);
  Nan::SetPrototypeMethod(tpl, "getFillColor", GetFillColor);

  Nan::SetPrototypeMethod(tpl, "setOutlineColor", SetOutlineColor);
  Nan::SetPrototypeMethod(tpl, "getOutlineColor", GetOutlineColor);

  Nan::SetPrototypeMethod(tpl, "setOutlineThickness", SetOutlineThickness);
  Nan::SetPrototypeMethod(tpl, "getOutlineThickness", GetOutlineThickness);
}

template <class T>
NAN_METHOD(CommonDrawable2<T>::SetFillColor) {
  Drawable* shape = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  shape->raw<T>().setFillColor(*color);
}

template <class T>
NAN_METHOD(CommonDrawable2<T>::GetFillColor) {
  Drawable* shape = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  const sf::Color color = shape->raw<T>().getFillColor();

  v8::MaybeLocal<v8::Object> ret =
      color::Color::NewRealColorInstance(info.GetIsolate(), color.toInteger());
  if (ret.IsEmpty()) return;

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
NAN_METHOD(CommonDrawable2<T>::SetOutlineColor) {
  Drawable* shape = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  shape->raw<T>().setOutlineColor(*color);
}

template <class T>
NAN_METHOD(CommonDrawable2<T>::GetOutlineColor) {
  Drawable* shape = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  const sf::Color color = shape->raw<T>().getOutlineColor();

  v8::MaybeLocal<v8::Object> ret =
      color::Color::NewRealColorInstance(info.GetIsolate(), color.toInteger());
  if (ret.IsEmpty()) return;

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
NAN_METHOD(CommonDrawable2<T>::SetOutlineThickness) {
  Drawable* shape = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  float thickness = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  shape->raw<T>().setOutlineThickness(thickness);
}

template <class T>
NAN_METHOD(CommonDrawable2<T>::GetOutlineThickness) {
  Drawable* shape = Nan::ObjectWrap::Unwrap<Drawable>(info.Holder());
  float thickness = shape->raw<T>().getOutlineThickness();
  info.GetReturnValue().Set(static_cast<double>(thickness));
}

template <class T>
CommonDrawable2<T>::CommonDrawable2() : CommonDrawable1<T>() {}

template <class T>
CommonDrawable2<T>::CommonDrawable2(T* raw) : CommonDrawable1<T>(raw) {}

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_COMMON_DRAWABLE_INL_H_
