#include "image.h"

namespace node_sfml {
namespace image {

using v8::Function;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;

Nan::Persistent<Function> constructor;
Nan::Persistent<Function> real_constructor;

NAN_METHOD(SetRealConstructor) {
  real_constructor.Reset(info[0].As<v8::Function>());
}

MaybeLocal<Object> Image::NewRealInstance(Isolate* isolate) {
  v8::Local<v8::Function> cons = real_constructor.Get(isolate);
  v8::MaybeLocal<v8::Object> maybe_ret =
      cons->NewInstance(isolate->GetCurrentContext());
  return maybe_ret;
}

NAN_MODULE_INIT(Image::Init) {
  Local<String> name = Nan::New("Image").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
  Nan::SetMethod(func, "setRealConstructor", SetRealConstructor);
}

NAN_METHOD(Image::New) {
  Image* Texture = new Image();
  Texture->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

void Image::SetInnerImage(const sf::Image& image) {
  _image = image;
}

Image::Image() {}

}  // namespace image
}  // namespace node_sfml
