#include "sound_source.h"

#include "music.h"
#include "sound.h"

namespace node_sfml {
namespace sound {

using v8::Boolean;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Number;

std::map<SoundSource*, SoundSource::SoundType> SoundSource::registered_sounds;

void SoundSource::Stop(SoundType type, SoundSource* source, bool delete_ptr) {
#define CASE(camel_case)                                                       \
  case SoundType::k##camel_case: {                                             \
    if (delete_ptr) {                                                          \
      sf::camel_case* val =                                                    \
          reinterpret_cast<sf::camel_case*>(source->_sound_source.release());  \
      val->stop();                                                             \
      delete val;                                                              \
    } else {                                                                   \
      (reinterpret_cast<sf::camel_case*>(source->_sound_source.get()))         \
          ->stop();                                                            \
    }                                                                          \
    break;                                                                     \
  }

  switch (type) {
    CASE(Music)
    CASE(Sound)
  }
}

void SoundSource::AtExit(void* argv) {
  for (auto it = registered_sounds.begin(); it != registered_sounds.end();
       it++) {
    SoundSource::Stop(it->second, it->first, true);
  }

  registered_sounds.clear();
}

void SoundSource::SetCommonPrototype(Local<FunctionTemplate>* _tpl) {
  Local<FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "play", Play);
  Nan::SetPrototypeMethod(tpl, "pause", Pause);
  Nan::SetPrototypeMethod(tpl, "stop", Stop);
  Nan::SetPrototypeMethod(tpl, "getStatus", GetStatus);

#define SIMPLE_GETTER_AND_SETTER_PROTOTYPE(name, _, __, ___)                   \
  Nan::SetPrototypeMethod(tpl, "set" #name, Set##name);                        \
  Nan::SetPrototypeMethod(tpl, "get" #name, Get##name);
  SOUND_SOURCE_SIMPLE_SETTER_AND_GETTERS(SIMPLE_GETTER_AND_SETTER_PROTOTYPE);
#undef SIMPLE_GETTER_AND_SETTER_PROTOTYPE
}

NAN_METHOD(SoundSource::GetStatus) {
  SoundSource* ss = Nan::ObjectWrap::Unwrap<SoundSource>(info.Holder());
  sf::SoundSource::Status status =
      ss->sound_source<sf::SoundSource>().getStatus();
  Local<Number> ret = Nan::New<Number>(status);
  info.GetReturnValue().Set(ret);
}

#define SIMPLE_ACTION(name, call)                                              \
  NAN_METHOD(SoundSource::name) {                                              \
    SoundSource* ss = Nan::ObjectWrap::Unwrap<SoundSource>(info.Holder());     \
    if (ss->_simple_actions.call != nullptr) {                                 \
      ss->_simple_actions.call(ss);                                            \
    } else {                                                                   \
      ss->sound_source<sf::SoundSource>().call();                              \
    }                                                                          \
  }

SIMPLE_ACTION(Play, play);
SIMPLE_ACTION(Pause, pause);
SIMPLE_ACTION(Stop, stop);

#undef SIMPLE_ACTION

#define getRelativeToListener isRelativeToListener
#define SIMPLE_SETTER_GETTER(name, type, nan_to_type, v8_type)                 \
  NAN_METHOD(SoundSource::Set##name) {                                         \
    SoundSource* ss = Nan::ObjectWrap::Unwrap<SoundSource>(info.Holder());     \
    type val = static_cast<type>(Nan::To<nan_to_type>(info[0]).FromJust());    \
    ss->sound_source<sf::SoundSource>().set##name(val);                        \
  }                                                                            \
                                                                               \
  NAN_METHOD(SoundSource::Get##name) {                                         \
    SoundSource* ss = Nan::ObjectWrap::Unwrap<SoundSource>(info.Holder());     \
    type val = ss->sound_source<sf::SoundSource>().get##name();                \
    Local<v8_type> ret = Nan::New<v8_type>(val);                               \
    info.GetReturnValue().Set(ret);                                            \
  }

SOUND_SOURCE_SIMPLE_SETTER_AND_GETTERS(SIMPLE_SETTER_GETTER);
#undef SIMPLE_SETTER_GETTER

SoundSource::SoundSource(SoundType type,
                         sf::SoundSource* sound_source,
                         SimpleActions simple_actions)
    : _sound_source(sound_source),
      _simple_actions(simple_actions),
      _type(type) {
  registered_sounds[this] = type;
}

SoundSource::~SoundSource() {
  auto it = registered_sounds.find(this);
  if (it == registered_sounds.end()) {
    return;
  }

  SoundSource::Stop(it->second, this);
  registered_sounds.erase(it);
}

}  // namespace sound
}  // namespace node_sfml
