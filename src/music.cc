#include "music.h"
#include "load_from_file_worker.h"

namespace node_sfml {
namespace music {

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

NAN_MODULE_INIT(Music::Init) {
  Local<String> name = Nan::New("Music").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "openFromFileSync", OpenFromFileSync);
  Nan::SetPrototypeMethod(tpl, "openFromFile", OpenFromFile);

  Nan::SetPrototypeMethod(tpl, "play", Play);
  Nan::SetPrototypeMethod(tpl, "pause", Pause);
  Nan::SetPrototypeMethod(tpl, "stop", Stop);

  Nan::SetPrototypeMethod(tpl, "setPitch", SetPitch);
  Nan::SetPrototypeMethod(tpl, "getPitch", GetPitch);
  Nan::SetPrototypeMethod(tpl, "setLoop", SetLoop);
  Nan::SetPrototypeMethod(tpl, "getLoop", GetLoop);
  Nan::SetPrototypeMethod(tpl, "setVolume", SetVolume);
  Nan::SetPrototypeMethod(tpl, "getVolume", GetVolume);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
}

NAN_METHOD(Music::New) {
  Music* Texture = new Music();
  Texture->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

#define SIMPLE_ACTION(name, call)                                              \
  NAN_METHOD(Music::name) {                                                    \
    Music* music = Nan::ObjectWrap::Unwrap<Music>(info.Holder());              \
    music->music().call();                                                     \
  }

SIMPLE_ACTION(Play, play);
SIMPLE_ACTION(Pause, pause);
SIMPLE_ACTION(Stop, stop);

#undef SIMPLE_ACTION

#define SIMPLE_SETTER_GETTER(name, type, nan_to_type, v8_type)                 \
  NAN_METHOD(Music::Set##name) {                                               \
    Music* music = Nan::ObjectWrap::Unwrap<Music>(info.Holder());              \
    type val = static_cast<type>(Nan::To<nan_to_type>(info[0]).FromJust());    \
    music->music().set##name(val);                                             \
  }                                                                            \
                                                                               \
  NAN_METHOD(Music::Get##name) {                                               \
    Music* music = Nan::ObjectWrap::Unwrap<Music>(info.Holder());              \
    type val = music->music().get##name();                                     \
    Local<v8_type> ret = Nan::New<v8_type>(val);                               \
    info.GetReturnValue().Set(ret);                                            \
  }

SIMPLE_SETTER_GETTER(Loop, bool, bool, v8::Boolean);
SIMPLE_SETTER_GETTER(Pitch, float, double, v8::Number);
SIMPLE_SETTER_GETTER(Volume, float, double, v8::Number);

#undef SIMPLE_SETTER_GETTER

inline bool OpenFromFileFunction(void* target,
                                 const std::string& filename,
                                 void* _) {
  return static_cast<Music*>(target)->music().openFromFile(filename);
}

NAN_METHOD(Music::OpenFromFile) {
  Music* music = Nan::ObjectWrap::Unwrap<Music>(info.Holder());
  if (music->_loading) {
    Local<Value> err = Nan::Error("Music is loading.");
    info.GetReturnValue().Set(err);

    return;
  }

  music->_loading = true;
  Local<String> v8_filename = info[0].As<String>();
  Nan::Utf8String utf8_filename(v8_filename);
  Nan::Callback* callback = new Nan::Callback(info[1].As<Function>());

  load_from_file_worker::LoadFromFileWorker<Music, void>* worker =
      new load_from_file_worker::LoadFromFileWorker<Music, void>(
          info.Holder(),
          *utf8_filename,
          OpenFromFileFunction,
          nullptr,
          callback);
  Nan::AsyncQueueWorker(worker);
}

NAN_METHOD(Music::OpenFromFileSync) {
  Music* music = Nan::ObjectWrap::Unwrap<Music>(info.Holder());
  Nan::Utf8String filename(info[0].As<String>());
  info.GetReturnValue().Set(music->_music.openFromFile(*filename));
}

Music::Music() : Nan::ObjectWrap(), _loading(false) {}
Music::~Music() {
  _music.stop();
}

}  // namespace music
}  // namespace node_sfml
