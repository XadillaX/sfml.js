#include "color.h"

namespace node_sfml {
namespace color {

using v8::Context;
using v8::EscapableHandleScope;
using v8::Function;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;
using v8::Value;

Nan::Persistent<Function> constructor;
Nan::Persistent<Function> real_constructor;

MaybeLocal<Object> Color::NewRealColorInstance(Isolate* isolate,
                                               sf::Uint32 val) {
  EscapableHandleScope scope(isolate);

  Local<Object> ret;
  if (real_constructor.IsEmpty()) {
    Nan::ThrowError("Color constructor has not been initialized yet.");
    return scope.Escape(ret);
  }

  Local<Function> func = real_constructor.Get(isolate);
  Local<Context> context = isolate->GetCurrentContext();
  Local<Value> argv[] = {Nan::New(val)};

  Nan::TryCatch try_catch;
  ret = func->NewInstance(context, 1, argv).ToLocalChecked();
  if (try_catch.HasCaught()) {
    try_catch.ReThrow();
    Local<Object> empty;
    return scope.Escape(empty);
  }

  return scope.Escape(ret);
}

NAN_METHOD(SetRealColorConstructor) {
  Local<Function> func = Nan::To<Function>(info[0]).ToLocalChecked();
  real_constructor.Reset(func);
}

NAN_MODULE_INIT(Color::Init) {
  Local<String> name = Nan::New("Color").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "toInteger", ToInteger);

#define V(name, lowercase)                                                     \
  tpl->PrototypeTemplate()->SetAccessorProperty(                               \
      Nan::New(#lowercase).ToLocalChecked(),                                   \
      Nan::New<FunctionTemplate>(name##Getter),                                \
      Nan::New<FunctionTemplate>(name##Setter),                                \
      v8::PropertyAttribute::DontDelete);

  RGBAProperties(V);

#undef V

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
  Nan::Set(target,
           Nan::New("setRealColorConstructor").ToLocalChecked(),
           Nan::GetFunction(Nan::New<FunctionTemplate>(SetRealColorConstructor))
               .ToLocalChecked());
}

NAN_METHOD(Color::New) {
  Color* color = nullptr;
  Local<v8::Uint32> color_val;
  Local<v8::Uint32> red;
  Local<v8::Uint32> green;
  Local<v8::Uint32> blue;
  Local<v8::Uint32> alpha;

  switch (info.Length()) {
    case 0:
      color = new Color();
      break;

    case 4: {
      alpha = info[3].As<v8::Uint32>();
      // fallthrough
    }

    case 3: {
      red = info[0].As<v8::Uint32>();
      green = info[1].As<v8::Uint32>();
      blue = info[2].As<v8::Uint32>();

      break;
    }

    case 1: {
      color_val = info[0].As<v8::Uint32>();
      break;
    }

    default: {
      Nan::ThrowError("Invalid arguments count.");
      return;
    }
  }

  if (color == nullptr) {
    if (!color_val.IsEmpty()) {
      sf::Uint32 val = Nan::To<sf::Uint32>(color_val).FromJust();
      if (val > 0xffffffff) {
        Nan::ThrowRangeError("Color value should between 0 and 0xffffffff.");
        return;
      }
      color = new Color(val);
    } else {
      sf::Uint32 a =
          alpha.IsEmpty() ? 255 : Nan::To<sf::Uint32>(alpha).FromJust();
      sf::Uint32 r = Nan::To<sf::Uint32>(red).FromJust();
      sf::Uint32 g = Nan::To<sf::Uint32>(green).FromJust();
      sf::Uint32 b = Nan::To<sf::Uint32>(blue).FromJust();

      if (a > 0xff || r > 0xff || g > 0xff || b > 0xff) {
        Nan::ThrowRangeError(
            "Each value of R / G / B / A should between 0 and 0xff.");
        return;
      }

      color = new Color(r, g, b, a);
    }
  }

  color->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Color::ToInteger) {
  Color* color = Nan::ObjectWrap::Unwrap<Color>(info.Holder());
  info.GetReturnValue().Set(color->_color.toInteger());
}

#define V(name, lowercase)                                                     \
  NAN_METHOD(Color::name##Getter) {                                            \
    Color* color = Nan::ObjectWrap::Unwrap<Color>(info.Holder());              \
    info.GetReturnValue().Set(color->_color.lowercase);                        \
  }                                                                            \
                                                                               \
  NAN_METHOD(Color::name##Setter) {                                            \
    if (!info[0]->IsUint32()) {                                                \
      Nan::ThrowTypeError("`" #lowercase "` should be an unsigned integer.");  \
      return;                                                                  \
    }                                                                          \
                                                                               \
    sf::Uint32 val = info[0].As<v8::Uint32>()->Value();                        \
    if (val < 0 || val > 0xff) {                                               \
      Nan::ThrowRangeError("`" #lowercase "` should between 0 and 0xff.");     \
      return;                                                                  \
    }                                                                          \
                                                                               \
    Color* color = Nan::ObjectWrap::Unwrap<Color>(info.Holder());              \
    color->_color.lowercase = val;                                             \
  }

RGBAProperties(V);
#undef V

Color::Color() : _color() {}
Color::Color(sf::Uint32 color) : _color(color) {}
Color::Color(sf::Uint8 red, sf::Uint8 green, sf::Uint8 blue, sf::Uint8 alpha)
    : _color(red, green, blue, alpha) {}
Color::~Color() {}

}  // namespace color
}  // namespace node_sfml
