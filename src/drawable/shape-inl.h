#ifndef SRC_DRAWABLE_SHAPE_INL_H_
#define SRC_DRAWABLE_SHAPE_INL_H_

#include "../color.h"
#include "../rect-inl.h"
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
