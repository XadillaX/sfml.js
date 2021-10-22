#ifndef SRC_PLUGINS_TRANSFORMABLE_PLUGIN_INL_H_
#define SRC_PLUGINS_TRANSFORMABLE_PLUGIN_INL_H_

#include "../vector2.h"
#include "transformable_plugin.h"

namespace node_sfml {
namespace transformable {

template <class T>
inline void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "setPosition", SetPosition<T>);
  Nan::SetPrototypeMethod(tpl, "getPosition", GetPosition<T>);

  Nan::SetPrototypeMethod(tpl, "setScale", SetScale<T>);
  Nan::SetPrototypeMethod(tpl, "getScale", GetScale<T>);

  Nan::SetPrototypeMethod(tpl, "setOrigin", SetOrigin<T>);
  Nan::SetPrototypeMethod(tpl, "getOrigin", GetOrigin<T>);

  Nan::SetPrototypeMethod(tpl, "setRotation", SetRotation<T>);
  Nan::SetPrototypeMethod(tpl, "getRotation", GetRotation<T>);

  Nan::SetPrototypeMethod(tpl, "move", Move<T>);
  Nan::SetPrototypeMethod(tpl, "scale", Scale<T>);
  Nan::SetPrototypeMethod(tpl, "rotate", Rotate<T>);
}

template <class T>
inline NAN_METHOD(SetRotation) {
  T* target = Nan::ObjectWrap::Unwrap<T>(info.Holder());
  float rotation = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  target->transformable().setRotation(rotation);
}

template <class T>
inline NAN_METHOD(GetRotation) {
  T* target = Nan::ObjectWrap::Unwrap<T>(info.Holder());
  float rotation = target->transformable().getRotation();
  info.GetReturnValue().Set(static_cast<double>(rotation));
}

template <class T>
inline NAN_METHOD(Rotate) {
  T* target = Nan::ObjectWrap::Unwrap<T>(info.Holder());
  float rotation = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  target->transformable().rotate(rotation);
}

#define VECTOR2F_ACTION(name, call)                                            \
  template <class T>                                                           \
  inline NAN_METHOD(name) {                                                    \
    T* target = Nan::ObjectWrap::Unwrap<T>(info.Holder());                     \
                                                                               \
    if (info.Length() == 1) {                                                  \
      vector2::Vector2F* vec = Nan::ObjectWrap::Unwrap<vector2::Vector2F>(     \
          info[0].As<v8::Object>());                                           \
      target->transformable().call(vec->vector2());                            \
      return;                                                                  \
    }                                                                          \
                                                                               \
    float x = static_cast<float>(Nan::To<double>(info[0]).FromJust());         \
    float y = static_cast<float>(Nan::To<double>(info[1]).FromJust());         \
    target->transformable().call(x, y);                                        \
  }

#define VECTOR2F_GETTER_SETTER(name)                                           \
  template <class T>                                                           \
  inline NAN_METHOD(Set##name) {                                               \
    T* target = Nan::ObjectWrap::Unwrap<T>(info.Holder());                     \
                                                                               \
    switch (info.Length()) {                                                   \
      case 1: {                                                                \
        vector2::Vector2F* vec = Nan::ObjectWrap::Unwrap<vector2::Vector2F>(   \
            info[0].As<v8::Object>());                                         \
        target->transformable().set##name(vec->vector2());                     \
        break;                                                                 \
      }                                                                        \
                                                                               \
      case 2:                                                                  \
      default: {                                                               \
        float x = static_cast<float>(Nan::To<double>(info[0]).FromJust());     \
        float y = static_cast<float>(Nan::To<double>(info[1]).FromJust());     \
        target->transformable().set##name(x, y);                               \
        break;                                                                 \
      }                                                                        \
    }                                                                          \
  }                                                                            \
                                                                               \
  template <class T>                                                           \
  inline NAN_METHOD(Get##name) {                                               \
    T* target = Nan::ObjectWrap::Unwrap<T>(info.Holder());                     \
                                                                               \
    const sf::Vector2f& vec = target->transformable().get##name();             \
                                                                               \
    Nan::TryCatch try_catch;                                                   \
    v8::MaybeLocal<v8::Object> maybe_vec =                                     \
        vector2::Vector2F::NewRealInstance(info.GetIsolate(), vec);            \
    if (maybe_vec.IsEmpty()) {                                                 \
      try_catch.ReThrow();                                                     \
      return;                                                                  \
    }                                                                          \
                                                                               \
    info.GetReturnValue().Set(maybe_vec.ToLocalChecked());                     \
  }

VECTOR2F_ACTION(Move, move);
VECTOR2F_ACTION(Scale, scale);
VECTOR2F_GETTER_SETTER(Position);
VECTOR2F_GETTER_SETTER(Scale);
VECTOR2F_GETTER_SETTER(Origin);

#undef VECTOR2F_ACTION
#undef VECTOR2F_GETTER_SETTER

}  // namespace transformable
}  // namespace node_sfml

#endif  // SRC_PLUGINS_TRANSFORMABLE_PLUGIN_INL_H_
