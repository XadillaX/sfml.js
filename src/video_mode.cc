#include "video_mode.h"

namespace node_sfml {
namespace video_mode {

using v8::Array;
using v8::Context;
using v8::Function;
using v8::FunctionTemplate;
using v8::Int32;
using v8::Local;
using v8::String;
using v8::Value;

Nan::Persistent<Function> constructor;
enum PropertyIndex { kWidth = 0, kHeight, kBitsPerPixel };

NAN_METHOD(GetDesktopMode) {
  sf::VideoMode raw_mode = sf::VideoMode::getDesktopMode();
  Local<Function> cons = Nan::New(constructor);
  const int argc = 3;
  Local<Value> argv[] = {Nan::New(raw_mode.width),
                         Nan::New(raw_mode.height),
                         Nan::New(raw_mode.bitsPerPixel)};
  info.GetReturnValue().Set(
      Nan::NewInstance(cons, argc, argv).ToLocalChecked());
}

NAN_METHOD(GetFullScreenModes) {
  const std::vector<sf::VideoMode>& modes = sf::VideoMode::getFullscreenModes();
  Local<Array> ret = Nan::New<Array>(modes.size());
  Local<Function> cons = Nan::New(constructor);
  const int argc = 3;

  int i = 0;
  for (auto it = modes.begin(); it != modes.end(); it++, i++) {
    Local<Value> argv[] = {Nan::New((*it).width),
                           Nan::New((*it).height),
                           Nan::New((*it).bitsPerPixel)};
    Nan::Set(ret, i, Nan::NewInstance(cons, argc, argv).ToLocalChecked());
  }

  info.GetReturnValue().Set(ret);
}

NAN_MODULE_INIT(VideoMode::Init) {
  Local<String> name = Nan::New("VideoMode").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "isValid", IsValid);
  Nan::SetPrototypeMethod(tpl, "getProperty", GetProperty);
  Nan::SetPrototypeMethod(tpl, "setProperty", SetProperty);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
  Nan::Set(func,
           Nan::New("getDesktopMode").ToLocalChecked(),
           Nan::GetFunction(Nan::New<FunctionTemplate>(GetDesktopMode))
               .ToLocalChecked());
  Nan::Set(func,
           Nan::New("getFullscreenModes").ToLocalChecked(),
           Nan::GetFunction(Nan::New<FunctionTemplate>(GetFullScreenModes))
               .ToLocalChecked());

  Nan::Set(func, Nan::New("kWidth").ToLocalChecked(), Nan::New(kWidth));
  Nan::Set(func, Nan::New("kHeight").ToLocalChecked(), Nan::New(kHeight));
  Nan::Set(func,
           Nan::New("kBitsPerPixel").ToLocalChecked(),
           Nan::New(kBitsPerPixel));
}

NAN_METHOD(VideoMode::New) {
  VideoMode* mode = nullptr;
  Local<v8::Uint32> mode_width;
  Local<v8::Uint32> mode_height;
  Local<v8::Uint32> mode_bits_per_pixel;

  switch (info.Length()) {
    case 0:
      mode = new VideoMode();
      break;
    case 3: {
      mode_bits_per_pixel = info[2].As<v8::Uint32>();
      // fallthrough
    }

    case 2: {
      mode_width = info[0].As<v8::Uint32>();
      mode_height = info[1].As<v8::Uint32>();
      break;
    }

    default: {
      Nan::ThrowError("Invalid arguments count.");
      return;
    }
  }

  if (mode == nullptr) {
    if (mode_bits_per_pixel.IsEmpty()) {
      mode = new VideoMode(Nan::To<sf::Uint32>(mode_width).FromJust(),
                           Nan::To<sf::Uint32>(mode_height).FromJust());
    } else {
      mode = new VideoMode(Nan::To<sf::Uint32>(mode_width).FromJust(),
                           Nan::To<sf::Uint32>(mode_height).FromJust(),
                           Nan::To<sf::Uint32>(mode_bits_per_pixel).FromJust());
    }
  }

  mode->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(VideoMode::IsValid) {
  VideoMode* mode = Nan::ObjectWrap::Unwrap<VideoMode>(info.Holder());
  info.GetReturnValue().Set(mode->isValid());
}

NAN_METHOD(VideoMode::SetProperty) {
  VideoMode* mode = Nan::ObjectWrap::Unwrap<VideoMode>(info.Holder());
  Local<v8::Uint32> v8_idx = info[0].As<v8::Uint32>();
  Local<v8::Uint32> v8_val = info[1].As<v8::Uint32>();
  PropertyIndex idx =
      static_cast<PropertyIndex>(Nan::To<sf::Uint32>(v8_idx).FromJust());
  sf::Uint32 val = Nan::To<sf::Uint32>(v8_val).FromJust();

  switch (idx) {
    case PropertyIndex::kWidth:
      mode->width = val;
      break;
    case PropertyIndex::kHeight:
      mode->height = val;
      break;
    case PropertyIndex::kBitsPerPixel:
      mode->bitsPerPixel = val;
      break;
    default:
      Nan::ThrowRangeError("Invalid property index.");
      return;
  }
}

NAN_METHOD(VideoMode::GetProperty) {
  VideoMode* mode = Nan::ObjectWrap::Unwrap<VideoMode>(info.Holder());
  Local<v8::Uint32> v8_idx = info[0].As<v8::Uint32>();
  PropertyIndex idx =
      static_cast<PropertyIndex>(Nan::To<sf::Uint32>(v8_idx).FromJust());

  sf::Uint32 val = 0;
  switch (idx) {
    case PropertyIndex::kWidth:
      val = mode->width;
      break;
    case PropertyIndex::kHeight:
      val = mode->height;
      break;
    case PropertyIndex::kBitsPerPixel:
      val = mode->bitsPerPixel;
      break;
    default:
      Nan::ThrowRangeError("Invalid property index.");
      return;
  }

  info.GetReturnValue().Set(val);
}

VideoMode::VideoMode() {}

VideoMode::VideoMode(sf::Uint32 mode_width,
                     sf::Uint32 mode_height,
                     sf::Uint32 mode_bits_per_pixel)
    : sf::VideoMode(mode_width, mode_height, mode_bits_per_pixel) {}

VideoMode::~VideoMode() {}

}  // namespace video_mode
}  // namespace node_sfml
