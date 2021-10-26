#include "sound_source.h"

namespace node_sfml {
namespace sound {

using v8::Boolean;
using v8::FunctionTemplate;
using v8::Local;
using v8::Number;

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
    ss->sound_source<sf::SoundSource>().call();                                \
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

SoundSource::SoundSource(sf::SoundSource* sound_source)
    : _sound_source(sound_source) {}

SoundSource::~SoundSource() {}

}  // namespace sound
}  // namespace node_sfml
