#include "audio-worker.h"
#include "audio-stream.h"
#include "time-value.h"
#include <SFML/System/Err.hpp>
#include <ostream>

namespace sfmljs {
SFMLJS_MEMBER(BufferRate, sf::SoundBuffer, unsigned, m_sampleRate);
SFMLJS_MEMBER(BufferDuration, sf::SoundBuffer, sf::Time, m_duration);
}

namespace sfmljs::audio {

Source::~Source() {
  CloseBeforeThreadExit();
  if (effect) effect->attached.store(nullptr, std::memory_order_release);
}

void Source::CloseBeforeThreadExit() {
  if (sound) sound->stop();
}

void CopySourceSettings(sf::SoundSource& to, const sf::SoundSource& from) {
  to.setPitch(from.getPitch());
  to.setPan(from.getPan());
  to.setVolume(from.getVolume());
  to.setSpatializationEnabled(from.isSpatializationEnabled());
  to.setPosition(from.getPosition());
  to.setDirection(from.getDirection());
  to.setCone(from.getCone());
  to.setVelocity(from.getVelocity());
  to.setDopplerFactor(from.getDopplerFactor());
  to.setDirectionalAttenuationFactor(from.getDirectionalAttenuationFactor());
  to.setRelativeToListener(from.isRelativeToListener());
  to.setMinDistance(from.getMinDistance());
  to.setMaxDistance(from.getMaxDistance());
  to.setMinGain(from.getMinGain());
  to.setMaxGain(from.getMaxGain());
  to.setAttenuation(from.getAttenuation());
}

void InstallSourceEffect(const std::shared_ptr<Source>& source) {
  if (!source->effect) return;
  auto state = source->effect;
  state->Seek(0);
  source->sound->setEffectProcessor(
      [state](const float* in, unsigned& inFrames, float* out,
              unsigned& outFrames, unsigned channels) {
        state->Effect(in, inFrames, out, outFrames, channels);
      });
}

v8::Local<v8::Object> MapBuffer(const std::shared_ptr<BufferData>& data) {
  data->Update();
  auto result = Nan::New<v8::Object>();
  Set(result, "info", NumericFields()
      .Add("sampleCount", data->count)
      .Add("channelCount", data->channels)
      .Add("sampleRate", Field<BufferRate>(data->buffer))
      .Add("duration", Field<BufferDuration>(data->buffer), "i64").Map(data));
  Set(result, "samples", data->count == 0
      ? v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), 0)
      : MapShared(v8::Isolate::GetCurrent(), data,
          const_cast<std::int16_t*>(data->buffer.getSamples()),
          data->count * sizeof(std::int16_t)));
  Set(result, "channelMap", MapChannels(data, data->buffer.getChannelMap()));
  return result;
}

void CommitBuffer(const std::shared_ptr<Buffer>& buffer,
                  const std::shared_ptr<BufferData>& data) {
  std::erase_if(buffer->sounds, [&](const auto& weak) {
    const auto source = weak.lock();
    if (!source || source->buffer != buffer) return true;
    auto* sound = source->AsSound();
    if (!sound) return true;
    sound->setBuffer(data->buffer);
    source->samples = data;
    return false;
  });
  buffer->current = data;
}

NAN_METHOD(CreateAudioBuffer) {
  auto buffer = std::make_shared<Buffer>();
  if (info[0]->IsInt16Array()) {
    Bytes samples;
    unsigned rate, count;
    std::vector<sf::SoundChannel> channels;
    if (!ReadBytes(info[0], samples, true) || !Unsigned(info[1], rate) ||
        !Unsigned(info[2], count) || !Channels(info[3], channels)) return;
    if (!buffer->current->buffer.loadFromSamples(
        static_cast<std::int16_t*>(samples.data), samples.size / 2,
        count, rate, channels)) {
      return sfmljs::ThrowError("Failed to load sound buffer from samples");
    }
  } else if (!info[0]->IsUndefined()) {
    auto* source = BufferHandle::From(info[0]);
    if (!source) return;
    buffer->current->buffer = source->owner()->current->buffer;
  }
  auto result = MapBuffer(buffer->current);
  Set(result, "handle", BufferHandle::Create(buffer));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(AssignAudioBuffer) {
  auto* target = BufferHandle::From(info[0]);
  auto* source = BufferHandle::From(info[1]);
  if (!target || !source) return;
  if (target->owner() == source->owner()) {
    info.GetReturnValue().Set(MapBuffer(target->owner()->current));
    return;
  }
  // Copy into a fresh SFML allocation: old views continue to own the previous
  // samples, while the target handle and its attached Sounds remain stable.
  auto data = MakeThreadOwned<BufferData>();
  data->buffer = source->owner()->current->buffer;
  auto result = MapBuffer(data);
  CommitBuffer(target->owner(), data);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(LoadAudioBuffer) {
  auto data = MakeThreadOwned<BufferData>();
  auto ok = std::make_shared<bool>();
  std::string path;
  Bytes bytes;
  std::shared_ptr<StreamClient> stream;
  if (info[0]->IsString()) {
    if (!String(info[0], path)) return;
  } else if (auto* handle = StreamClientHandle::TryFrom(info[0])) {
    stream = handle->owner();
  } else if (!ReadBytes(info[0], bytes)) return;
  auto work = [data, ok, path, bytes, stream] {
    *ok = stream ? data->buffer.loadFromStream(*stream) : bytes.backing
        ? data->buffer.loadFromMemory(bytes.data, bytes.size)
        : data->buffer.loadFromFile(Path(path));
  };
  auto result = [data, ok]() -> v8::Local<v8::Value> {
    return *ok ? v8::Local<v8::Value>(BufferDataHandle::Create(data))
               : v8::Local<v8::Value>(Nan::Undefined());
  };
  if (stream) QueueThread(info[1], work, result, [stream] { stream->Cancel(); });
  else Queue(info[1], work, result);
}

NAN_METHOD(AudioBufferSamples) {
  Bytes samples;
  unsigned rate, count;
  std::vector<sf::SoundChannel> channels;
  if (!ReadBytes(info[0], samples, true) || !Unsigned(info[1], rate) ||
      !Unsigned(info[2], count) || !Channels(info[3], channels)) return;
  auto data = MakeThreadOwned<BufferData>();
  if (data->buffer.loadFromSamples(static_cast<std::int16_t*>(samples.data),
                                  samples.size / 2, count, rate, channels)) {
    info.GetReturnValue().Set(BufferDataHandle::Create(data));
  }
}

NAN_METHOD(CommitAudioBuffer) {
  auto* buffer = BufferHandle::From(info[0]);
  auto* data = BufferDataHandle::From(info[1]);
  if (!buffer || !data) return;
  CommitBuffer(buffer->owner(), data->owner());
  info.GetReturnValue().Set(MapBuffer(data->owner()));
}

NAN_METHOD(SaveAudioBuffer) {
  auto* buffer = BufferHandle::From(info[0]);
  std::string path;
  if (!buffer || !String(info[1], path)) return;
  auto data = buffer->owner()->current;
  auto ok = std::make_shared<bool>();
  Queue(info[2], [data, ok, path] { *ok = data->buffer.saveToFile(Path(path)); },
      [ok]() -> v8::Local<v8::Value> { return Nan::New(*ok); });
}

NAN_METHOD(CreateAudioSource) {
  auto source = MakeThreadOwned<Source>();
  if (info[0]->IsUndefined()) {
    source->sound = std::make_unique<sf::Music>();
  } else {
    source->kind = 0;
    auto* buffer = BufferHandle::From(info[0]);
    if (!buffer) return;
    source->buffer = buffer->owner();
    source->samples = source->buffer->current;
    if (info[1]->IsUndefined()) {
      source->sound = std::make_unique<sf::Sound>(source->samples->buffer);
    } else {
      auto* copy = SourceHandle::From(info[1]);
      if (!copy) return;
      auto* sound = copy->owner()->AsSound();
      if (!sound) return Nan::ThrowTypeError("Expected a Sound");
      source->sound = std::make_unique<sf::Sound>(*sound);
      // A Worker queue has one device-thread producer, so a copied Sound must
      // receive its own effect explicitly rather than share the callback.
      source->sound->setEffectProcessor({});
    }
    source->buffer->sounds.push_back(source);
  }
  info.GetReturnValue().Set(MapSource(source));
}

NAN_METHOD(SetAudioBuffer) {
  auto* handle = SourceHandle::From(info[0]);
  auto* buffer = BufferHandle::From(info[1]);
  if (!handle || !buffer) return;
  auto source = handle->owner();
  auto* sound = source->AsSound();
  if (!sound) return Nan::ThrowTypeError("Expected a Sound");
  sound->setBuffer(buffer->owner()->current->buffer);
  source->buffer = buffer->owner();
  source->samples = source->buffer->current;
  source->buffer->sounds.push_back(source);
}

// Scalar/vector/cone payloads use the same memory in both languages.
NAN_METHOD(AssignAudioSource) {
  auto* targetHandle = SourceHandle::From(info[0]);
  auto* sourceHandle = SourceHandle::From(info[1]);
  if (!targetHandle || !sourceHandle) return;
  if (!info[2]->IsBoolean()) return Nan::ThrowTypeError("Expected a Sound assignment flag");
  auto target = targetHandle->owner();
  auto source = sourceHandle->owner();
  const bool fullSound = info[2]->IsTrue();
  if (fullSound && (!target->AsSound() || !source->AsSound())) {
    return Nan::ThrowTypeError("Expected two Sounds");
  }
  if (target == source) return;
  if (!fullSound) {
    CopySourceSettings(*target->sound, *source->sound);
    return;
  }
  // Reserve before touching playback so registering the new buffer cannot
  // fail after the SFML Sound has changed. Old buffer storage stays retained
  // until setBuffer() has stopped and detached the sound.
  const auto buffer = source->buffer;
  buffer->sounds.reserve(buffer->sounds.size() + 1);
  target->sound->stop();
  if (target->effect) target->effect->Seek(0);
  target->AsSound()->setBuffer(buffer->current->buffer);
  CopySourceSettings(*target->sound, *source->sound);
  target->AsSound()->setLooping(source->AsSound()->isLooping());
  if (target->buffer) {
    std::erase_if(target->buffer->sounds, [&](const auto& weak) {
      const auto value = weak.lock();
      return !value || value == target;
    });
  }
  target->buffer = buffer;
  target->samples = buffer->current;
  buffer->sounds.push_back(target);
}

NAN_METHOD(AudioSourceField) {
  auto* handle = SourceHandle::From(info[0]);
  unsigned field;
  if (!handle || !Unsigned(info[1], field)) return;
  if (!info[2]->IsBoolean()) return Nan::ThrowTypeError("Expected a write flag");
  const bool write = info[2]->IsTrue();
  auto& source = *handle->owner();
  auto& sound = *source.sound;
  auto& f = source.values;
  auto vector = [&](unsigned i) { return sf::Vector3f{f[i], f[i+1], f[i+2]}; };
  auto store = [&](unsigned i, sf::Vector3f v) { f[i]=v.x; f[i+1]=v.y; f[i+2]=v.z; };
#define SFMLJS_AUDIO_SCALAR(Id, Set, Get) \
  case Id: if (write) sound.Set(f[Id]); else f[Id] = sound.Get(); break
  switch (field) {
    SFMLJS_AUDIO_SCALAR(0, setPitch, getPitch);
    SFMLJS_AUDIO_SCALAR(1, setPan, getPan);
    SFMLJS_AUDIO_SCALAR(2, setVolume, getVolume);
    SFMLJS_AUDIO_SCALAR(3, setSpatializationEnabled, isSpatializationEnabled);
    case 4: if (write) sound.setPosition(vector(4)); else store(4, sound.getPosition()); break;
    case 7: if (write) sound.setDirection(vector(7)); else store(7, sound.getDirection()); break;
    case 10:
      if (write) sound.setCone({sf::radians(f[10]), sf::radians(f[11]), f[12]});
      else {
        const auto cone = sound.getCone();
        f[10]=cone.innerAngle.asRadians(); f[11]=cone.outerAngle.asRadians(); f[12]=cone.outerGain;
      }
      break;
    case 13: if (write) sound.setVelocity(vector(13)); else store(13, sound.getVelocity()); break;
    SFMLJS_AUDIO_SCALAR(16, setDopplerFactor, getDopplerFactor);
    SFMLJS_AUDIO_SCALAR(17, setDirectionalAttenuationFactor, getDirectionalAttenuationFactor);
    SFMLJS_AUDIO_SCALAR(18, setRelativeToListener, isRelativeToListener);
    SFMLJS_AUDIO_SCALAR(19, setMinDistance, getMinDistance);
    SFMLJS_AUDIO_SCALAR(20, setMaxDistance, getMaxDistance);
    SFMLJS_AUDIO_SCALAR(21, setMinGain, getMinGain);
    SFMLJS_AUDIO_SCALAR(22, setMaxGain, getMaxGain);
    SFMLJS_AUDIO_SCALAR(23, setAttenuation, getAttenuation);
    case 24:
      if (write && source.stream) {
        source.stream->looping.store(f[24] != 0, std::memory_order_release);
      }
      if (auto* value = source.AsSound()) {
        if (write) value->setLooping(f[24] != 0); else f[24] = value->isLooping();
      } else if (auto* value = source.AsStream()) {
        if (write) {
          const bool changed = value->isLooping() != (f[24] != 0);
          value->setLooping(f[24] != 0);
          // Buffered Music may already have a final block at a loop boundary.
          // Refill from the current position when that boundary changes.
          if (changed && source.kind == 3) {
            value->setPlayingOffset(value->getPlayingOffset());
          }
        } else f[24] = value->isLooping();
      }
      break;
    case 25:
      if (write) return Nan::ThrowTypeError("Status is read-only");
      f[25] = static_cast<float>(sound.getStatus());
      break;
    case 26:
    case 27:
      if (write) return Nan::ThrowTypeError("Stream metadata is read-only");
      if (auto* stream = source.AsStream()) {
        f[26] = stream->getSampleRate(); f[27] = stream->getChannelCount();
      }
      break;
    default: return Nan::ThrowRangeError("Unknown audio field");
  }
#undef SFMLJS_AUDIO_SCALAR
}

NAN_METHOD(AudioSourceCommand) {
  auto* handle = SourceHandle::From(info[0]);
  unsigned command;
  if (!handle || !Unsigned(info[1], command)) return;
  auto& source = *handle->owner();
  auto& sound = *source.sound;
  if (source.effect && (command == 2 || command == 3 ||
      (command == 0 && sound.getStatus() != sf::SoundSource::Status::Paused))) {
    source.effect->Seek(0);
  }
  switch (command) {
    case 0: sound.play(); break;
    case 1: sound.pause(); break;
    case 2: sound.stop(); break;
    case 3:
    case 4:
      if (auto* value = source.AsSound()) {
        if (command == 3) value->setPlayingOffset(sf::microseconds(source.times[0]));
        else source.times[0] = value->getPlayingOffset().asMicroseconds();
      } else if (auto* value = source.AsStream()) {
        if (command == 3) value->setPlayingOffset(sf::microseconds(source.times[0]));
        else source.times[0] = value->getPlayingOffset().asMicroseconds();
      }
      break;
    case 5:
    case 6:
    case 7: {
      if (source.kind == 3) {
        auto& state = *source.stream;
        auto* stream = source.AsStream();
        auto toSamples = [&](std::int64_t time) {
          return (static_cast<std::uint64_t>(time) * state.rate * state.channels + 500000) / 1000000;
        };
        auto toTime = [&](std::uint64_t samples) {
          return static_cast<std::int64_t>(samples * 1000000 / (state.channels * state.rate));
        };
        if (command == 5) {
          auto offset = toSamples(source.times[2]);
          auto length = toSamples(source.times[3]);
          offset += state.channels - 1;
          offset -= offset % state.channels;
          length += state.channels - 1;
          length -= length % state.channels;
          if (!state.sampleCount || offset >= state.sampleCount || !length) {
            sf::err() << "Music loop points are outside the valid sample range.\n";
          } else {
            length = std::min(length, state.sampleCount - offset);
            if (offset != state.loopOffset || length != state.loopLength) {
              const auto status = stream->getStatus();
              const auto position = stream->getPlayingOffset();
              stream->stop();
              state.loopOffset = offset;
              state.loopLength = length;
              if (position != sf::Time::Zero) stream->setPlayingOffset(position);
              if (status == sf::SoundSource::Status::Playing) stream->play();
            }
          }
        }
        source.times[1] = sf::seconds(static_cast<float>(state.sampleCount) /
            static_cast<float>(state.channels) / static_cast<float>(state.rate)).asMicroseconds();
        source.times[2] = toTime(state.loopOffset);
        source.times[3] = toTime(state.loopLength);
        break;
      }
      auto* music = source.AsMusic();
      if (!music) return Nan::ThrowTypeError("Expected a Music");
      if (command == 5) music->setLoopPoints({sf::microseconds(source.times[2]),
                                            sf::microseconds(source.times[3])});
      const auto span = music->getLoopPoints();
      source.times[1] = music->getDuration().asMicroseconds();
      source.times[2] = span.offset.asMicroseconds();
      source.times[3] = span.length.asMicroseconds();
      break;
    }
    default: return Nan::ThrowRangeError("Unknown audio command");
  }
}

NAN_METHOD(OpenAudioMusic) {
  auto* handle = SourceHandle::From(info[0]);
  if (!handle) return;
  auto source = handle->owner();
  if (source->kind != 1 && source->kind != 3) {
    return Nan::ThrowTypeError("Expected a Music");
  }
  auto next = MakeThreadOwned<Source>();
  next->sound = std::make_unique<sf::Music>();
  std::string path;
  if (info[1]->IsString()) {
    if (!String(info[1], path)) return;
  } else if (!ReadBytes(info[1], next->encoded)) return;
  auto ok = std::make_shared<bool>();
  Queue(info[2], [next, path, ok] {
    auto& music = static_cast<sf::Music&>(*next->sound);
    *ok = next->encoded.backing
        ? music.openFromMemory(next->encoded.data, next->encoded.size)
        : music.openFromFile(Path(path));
  }, [source, next, ok]() -> v8::Local<v8::Value> {
    if (*ok) {
      CopySourceSettings(*next->sound, *source->sound);
      next->AsMusic()->setLooping(source->AsStream()->isLooping());
      source->sound->stop();
      source->sound.swap(next->sound);
      std::swap(source->encoded, next->encoded);
      source->kind = 1;
      source->stream.reset();
      InstallSourceEffect(source);
    }
    return Nan::New(*ok);
  });
}

NAN_METHOD(CloseAudioMusic) {
  auto* handle = SourceHandle::From(info[0]);
  if (!handle) return;
  auto source = handle->owner();
  if (source->kind != 1 && source->kind != 3) {
    return Nan::ThrowTypeError("Expected Music");
  }
  auto sound = std::make_unique<sf::Music>();
  CopySourceSettings(*sound, *source->sound);
  sound->setLooping(source->AsStream()->isLooping());
  source->sound->stop();
  source->sound = std::move(sound);
  source->stream.reset();
  source->encoded = {};
  source->kind = 1;
  InstallSourceEffect(source);
}

NAN_METHOD(AudioSourceChannels) {
  auto* handle = SourceHandle::From(info[0]);
  if (!handle) return;
  auto source = handle->owner();
  auto* stream = source->AsStream();
  if (!stream) return Nan::ThrowTypeError("Expected a SoundStream");
  // Channels may be replaced by initialize/open. Each returned view owns a
  // snapshot so old views cannot dangle while a stream is reopened.
  auto channels = std::make_shared<std::vector<sf::SoundChannel>>(stream->getChannelMap());
  info.GetReturnValue().Set(MapChannels(channels, *channels));
}

using ListenerData = std::array<float, 16>;
NAN_METHOD(CreateAudioListener) {
  auto data = std::make_shared<ListenerData>();
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", SharedHandle<ListenerData>::Create(data));
  Set(result, "buffer", MapShared(info.GetIsolate(), data, data->data(), sizeof(*data)));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(CreateAudioValue) {
  unsigned kind;
  if (!Unsigned(info[0], kind)) return;
  if (kind == 0) {
    static_assert(sizeof(sf::SoundSource::Cone) == 12);
    auto value = std::make_shared<sf::SoundSource::Cone>();
    info.GetReturnValue().Set(MapShared(info.GetIsolate(), value, value.get(), sizeof(*value)));
  } else if (kind == 1) {
    static_assert(sizeof(sf::Music::TimeSpan) == 16);
    auto value = std::make_shared<sf::Music::TimeSpan>();
    info.GetReturnValue().Set(MapShared(info.GetIsolate(), value, value.get(), sizeof(*value)));
  } else {
    return Nan::ThrowRangeError("Unknown audio value");
  }
}

NAN_METHOD(AudioListenerField) {
  auto* handle = SharedHandle<ListenerData>::From(info[0]);
  unsigned field;
  if (!handle || !Unsigned(info[1], field)) return;
  if (!info[2]->IsBoolean()) return Nan::ThrowTypeError("Expected a write flag");
  const bool write = info[2]->IsTrue();
  auto& f = *handle->owner();
  auto vector = [&](unsigned i) { return sf::Vector3f{f[i], f[i+1], f[i+2]}; };
  auto store = [&](unsigned i, sf::Vector3f v) { f[i]=v.x; f[i+1]=v.y; f[i+2]=v.z; };
  switch (field) {
    case 0:
      if (write) sf::Listener::setGlobalVolume(f[0]); else f[0] = sf::Listener::getGlobalVolume();
      break;
    case 1: if (write) sf::Listener::setPosition(vector(1)); else store(1, sf::Listener::getPosition()); break;
    case 4: if (write) sf::Listener::setDirection(vector(4)); else store(4, sf::Listener::getDirection()); break;
    case 7: if (write) sf::Listener::setVelocity(vector(7)); else store(7, sf::Listener::getVelocity()); break;
    case 10: if (write) sf::Listener::setUpVector(vector(10)); else store(10, sf::Listener::getUpVector()); break;
    case 13:
      if (write) sf::Listener::setCone({sf::radians(f[13]), sf::radians(f[14]), f[15]});
      else {
        const auto cone = sf::Listener::getCone();
        f[13]=cone.innerAngle.asRadians(); f[14]=cone.outerAngle.asRadians(); f[15]=cone.outerGain;
      }
      break;
    default: return Nan::ThrowRangeError("Unknown listener field");
  }
}

} // namespace sfmljs::audio

NAN_MODULE_INIT(InitializeAudio) {
  using namespace sfmljs::audio;
  sfmljs::SetMethod<CreateAudioBuffer>(target, "createAudioBuffer");
  sfmljs::SetMethod<AssignAudioBuffer>(target, "assignAudioBuffer");
  sfmljs::SetMethod<LoadAudioBuffer>(target, "loadAudioBuffer");
  sfmljs::SetMethod<AudioBufferSamples>(target, "audioBufferSamples");
  sfmljs::SetMethod<CommitAudioBuffer>(target, "commitAudioBuffer");
  sfmljs::SetMethod<SaveAudioBuffer>(target, "saveAudioBuffer");
  sfmljs::SetMethod<CreateAudioSource>(target, "createAudioSource");
  sfmljs::SetMethod<SetAudioBuffer>(target, "setAudioBuffer");
  sfmljs::SetMethod<AssignAudioSource>(target, "assignAudioSource");
  sfmljs::SetMethod<AudioSourceField>(target, "audioSourceField");
  sfmljs::SetMethod<AudioSourceCommand>(target, "audioSourceCommand");
  sfmljs::SetMethod<OpenAudioMusic>(target, "openAudioMusic");
  sfmljs::SetMethod<CloseAudioMusic>(target, "closeAudioMusic");
  sfmljs::SetMethod<AudioSourceChannels>(target, "audioSourceChannels");
  sfmljs::SetMethod<CreateAudioListener>(target, "createAudioListener");
  sfmljs::SetMethod<CreateAudioValue>(target, "createAudioValue");
  sfmljs::SetMethod<AudioListenerField>(target, "audioListenerField");
}
