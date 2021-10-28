#include "sound.h"

namespace node_sfml {
namespace sound {

using v8::Boolean;
using v8::Function;
using v8::FunctionTemplate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

namespace {
Nan::Persistent<Function> constructor;
}  // namespace

NAN_MODULE_INIT(Sound::Init) {
  Local<String> name = Nan::New("Sound").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "setLoop", SetLoop);
  Nan::SetPrototypeMethod(tpl, "getLoop", GetLoop);

  Nan::SetPrototypeMethod(tpl, "setBuffer", SetBuffer);

  sound::SoundSource::SetCommonPrototype(&tpl);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
}

NAN_METHOD(Sound::New) {
  Sound* sound = nullptr;
  if (info.Length() == 0 || info[0]->IsNullOrUndefined()) {
    sound = new Sound();
  } else if (info.Length() >= 1) {
    SoundBuffer* sb =
        Nan::ObjectWrap::Unwrap<SoundBuffer>(info[0].As<Object>());
    sound = new Sound(sb);
  }

  if (!sound) {
    Nan::ThrowError("Cannot create Sound instance.");
    return;
  }

  sound->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Sound::SetBuffer) {
  Sound* sound = Nan::ObjectWrap::Unwrap<Sound>(info.Holder());
  SoundBuffer* sb = Nan::ObjectWrap::Unwrap<SoundBuffer>(info[0].As<Object>());
  sound->sound().setBuffer(sb->sound_buffer());

  sound->_sound_buffer = sb;
  sound->_sound_buffer_object.Reset(sb->handle());
}

NAN_METHOD(Sound::SetLoop) {
  Sound* sound = Nan::ObjectWrap::Unwrap<Sound>(info.Holder());
  bool val = Nan::To<bool>(info[0]).FromJust();
  sound->sound().setLoop(val);
}

NAN_METHOD(Sound::GetLoop) {
  Sound* sound = Nan::ObjectWrap::Unwrap<Sound>(info.Holder());
  bool val = sound->sound().getLoop();
  Local<Boolean> ret = Nan::New<Boolean>(val);
  info.GetReturnValue().Set(ret);
}

// Because `sf::Sound::play()` is not virtual, we can't call
// `sf::SoundSource::play()` directly.
inline void SoundPlay(SoundSource* ss) {
  ss->sound_source<sf::Sound>().play();
}

// Because `sf::Sound::pause()` is not virtual, we can't call
// `sf::SoundSource::pause()` directly.
inline void SoundPause(SoundSource* ss) {
  ss->sound_source<sf::Sound>().pause();
}

// Because `sf::Sound::stop()` is not virtual, we can't call
// `sf::SoundSource::stop()` directly.
inline void SoundStop(SoundSource* ss) {
  ss->sound_source<sf::Sound>().stop();
}

Sound::Sound()
    : SoundSource(SoundSource::SoundType::kSound,
                  new sf::Sound(),
                  {SoundPlay, SoundPause, SoundStop}),
      _sound_buffer(nullptr) {}

Sound::Sound(SoundBuffer* sound_buffer)
    : SoundSource(SoundSource::SoundType::kSound,
                  new sf::Sound(sound_buffer->sound_buffer()),
                  {SoundPlay, SoundPause, SoundStop}),
      _sound_buffer(sound_buffer),
      _sound_buffer_object(sound_buffer->handle()) {}

Sound::~Sound() {
  _sound_buffer_object.Reset();
}

}  // namespace sound
}  // namespace node_sfml
