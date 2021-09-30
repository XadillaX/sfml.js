#ifndef SRC_DRAWABLE_SHAPE_INL_H_
#define SRC_DRAWABLE_SHAPE_INL_H_

#include "../color.h"
#include "shape.h"

namespace node_sfml {
namespace drawable {

template <class T>
void Shape<T>::SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;
  Nan::SetPrototypeMethod(tpl, "setFillColor", SetFillColor);
  Nan::SetPrototypeMethod(tpl, "getFillColor", GetFillColor);
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
Shape<T>::Shape(T* raw) : Drawable<sf::Shape>(raw) {}

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SHAPE_INL_H_
