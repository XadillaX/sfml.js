#ifndef SRC_DRAWABLE_SHAPE_INL_H_
#define SRC_DRAWABLE_SHAPE_INL_H_

#include "../color.h"
#include "../rect-inl.h"
#include "../vector2-inl.h"
#include "shape.h"

namespace node_sfml {
namespace drawable {

template <class T>
void Shape<T>::SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "setFillColor", SetFillColor);
  Nan::SetPrototypeMethod(tpl, "getFillColor", GetFillColor);

  Nan::SetPrototypeMethod(tpl, "setOutlineColor", SetOutlineColor);
  Nan::SetPrototypeMethod(tpl, "getOutlineColor", GetOutlineColor);

  Nan::SetPrototypeMethod(tpl, "setOutlineThickness", SetOutlineThickness);
  Nan::SetPrototypeMethod(tpl, "getOutlineThickness", GetOutlineThickness);

  Nan::SetPrototypeMethod(tpl, "getPointCount", GetPointCount);

  Nan::SetPrototypeMethod(tpl, "getLocalBounds", GetLocalBounds);
  Nan::SetPrototypeMethod(tpl, "getGlobalBounds", GetGlobalBounds);

  Nan::SetPrototypeMethod(tpl, "getPoint", GetPoint);

  Nan::SetPrototypeMethod(tpl, "setPosition", SetPosition);
  Nan::SetPrototypeMethod(tpl, "getPosition", GetPosition);

  Nan::SetPrototypeMethod(tpl, "setRotation", SetRotation);
  Nan::SetPrototypeMethod(tpl, "getRotation", GetRotation);

  Nan::SetPrototypeMethod(tpl, "setScale", SetScale);
  Nan::SetPrototypeMethod(tpl, "getScale", GetScale);

  Nan::SetPrototypeMethod(tpl, "setOrigin", SetScale);
  Nan::SetPrototypeMethod(tpl, "getOrigin", GetScale);
}

template <class T>
NAN_METHOD(Shape<T>::SetFillColor) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  raw.setFillColor(*color);
}

template <class T>
NAN_METHOD(Shape<T>::GetFillColor) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  const sf::Color color = raw.getFillColor();

  v8::MaybeLocal<v8::Object> ret =
      color::Color::NewRealColorInstance(info.GetIsolate(), color.toInteger());
  if (ret.IsEmpty()) return;

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
NAN_METHOD(Shape<T>::SetOutlineColor) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  color::Color* color =
      Nan::ObjectWrap::Unwrap<color::Color>(info[0].As<v8::Object>());
  raw.setOutlineColor(*color);
}

template <class T>
NAN_METHOD(Shape<T>::GetOutlineColor) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  const sf::Color color = raw.getOutlineColor();

  v8::MaybeLocal<v8::Object> ret =
      color::Color::NewRealColorInstance(info.GetIsolate(), color.toInteger());
  if (ret.IsEmpty()) return;

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

template <class T>
NAN_METHOD(Shape<T>::SetOutlineThickness) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  float thickness = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  raw.setOutlineThickness(thickness);
}

template <class T>
NAN_METHOD(Shape<T>::GetOutlineThickness) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  float thickness = raw.getOutlineThickness();
  info.GetReturnValue().Set(static_cast<double>(thickness));
}

template <class T>
NAN_METHOD(Shape<T>::GetPointCount) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  sf::Uint32 point_count = raw.getPointCount();
  info.GetReturnValue().Set(point_count);
}

template <class T>
NAN_METHOD(Shape<T>::GetPoint) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  if (!info[0]->IsUint32()) {
    Nan::ThrowTypeError("`idx` should be unsigned integer.");
    return;
  }

  sf::Vector2f point = raw.getPoint(Nan::To<sf::Uint32>(info[0]).FromJust());

  Nan::TryCatch try_catch;
  v8::MaybeLocal<v8::Object> maybe_vec =
      vector2::Vector2F::NewRealInstance(info.GetIsolate(), point);
  if (maybe_vec.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }
  info.GetReturnValue().Set(maybe_vec.ToLocalChecked());
}

#define VECTOR2F_GETTER_SETTER(name)                                           \
  template <class T>                                                           \
  NAN_METHOD(Shape<T>::Set##name) {                                            \
    Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());        \
    sf::Shape& raw = shape->raw();                                             \
                                                                               \
    switch (info.Length()) {                                                   \
      case 1: {                                                                \
        vector2::Vector2F* val = Nan::ObjectWrap::Unwrap<vector2::Vector2F>(   \
            info[0].As<v8::Object>());                                         \
        raw.set##name(*val);                                                   \
        break;                                                                 \
      }                                                                        \
                                                                               \
      case 2:                                                                  \
      default: {                                                               \
        float x = static_cast<float>(Nan::To<double>(info[0]).FromJust());     \
        float y = static_cast<float>(Nan::To<double>(info[1]).FromJust());     \
        raw.set##name(x, y);                                                   \
        break;                                                                 \
      }                                                                        \
    }                                                                          \
  }                                                                            \
                                                                               \
  template <class T>                                                           \
  NAN_METHOD(Shape<T>::Get##name) {                                            \
    Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());        \
    sf::Shape& raw = shape->raw();                                             \
                                                                               \
    const sf::Vector2f& val = raw.get##name();                                 \
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
NAN_METHOD(Shape<T>::SetRotation) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  float rotation = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  raw.setRotation(rotation);
}

template <class T>
NAN_METHOD(Shape<T>::GetRotation) {
  Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());
  sf::Shape& raw = shape->raw();
  float rotation = raw.getRotation();
  info.GetReturnValue().Set(static_cast<double>(rotation));
}

#define GET_BOUNDS_IMPL(type)                                                  \
  template <class T>                                                           \
  NAN_METHOD(Shape<T>::Get##type##Bounds) {                                    \
    Shape<T>* shape = Nan::ObjectWrap::Unwrap<Shape<T>>(info.Holder());        \
    sf::Shape& raw = shape->raw();                                             \
    sf::FloatRect rect = raw.get##type##Bounds();                              \
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
Shape<T>::Shape(T* raw) : Drawable<sf::Shape>(raw) {}

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SHAPE_INL_H_
