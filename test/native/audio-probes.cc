#include "../../native/audio-worker.h"
#include "../../native/audio-recorder.h"

namespace {
using namespace sfmljs;
using namespace sfmljs::audio;

NAN_METHOD(AudioSourceOracle) {
  auto* handle = SourceHandle::From(info[0]);
  if (!handle) return;
  auto& sound = *handle->owner()->sound;
  if (info[1]->IsTrue()) {
    sound.setVolume(41);
    sound.setPosition({7, 8, 9});
  }
  const auto cone = sound.getCone();
  const auto position = sound.getPosition();
  const auto direction = sound.getDirection();
  const auto velocity = sound.getVelocity();
  const std::array<float, 24> values{
    sound.getPitch(), sound.getPan(), sound.getVolume(),
    static_cast<float>(sound.isSpatializationEnabled()),
    position.x, position.y, position.z,
    direction.x, direction.y, direction.z,
    cone.innerAngle.asRadians(), cone.outerAngle.asRadians(), cone.outerGain,
    velocity.x, velocity.y, velocity.z,
    sound.getDopplerFactor(), sound.getDirectionalAttenuationFactor(),
    static_cast<float>(sound.isRelativeToListener()),
    sound.getMinDistance(), sound.getMaxDistance(), sound.getMinGain(),
    sound.getMaxGain(), sound.getAttenuation()
  };
  auto result = Nan::New<v8::Array>(values.size());
  for (unsigned i = 0; i < values.size(); ++i) {
    Nan::Set(result, i, Nan::New(values[i])).FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(AudioBufferAliases) {
  auto* handle = BufferHandle::From(info[0]);
  Bytes samples;
  if (!handle || !ReadBytes(info[1], samples, true)) return;
  const auto& buffer = handle->owner()->current->buffer;
  info.GetReturnValue().Set(buffer.getSamples() == samples.data &&
      buffer.getSampleCount() * sizeof(std::int16_t) == samples.size);
}

NAN_METHOD(AudioSoundBufferMatches) {
  auto* source = SourceHandle::From(info[0]);
  auto* buffer = BufferHandle::From(info[1]);
  if (!source || !buffer) return;
  const auto* sound = source->owner()->AsSound();
  if (!sound) return Nan::ThrowTypeError("Expected a Sound");
  info.GetReturnValue().Set(
      &sound->getBuffer() == &buffer->owner()->current->buffer);
}

NAN_METHOD(AudioAssignmentState) {
  auto* handle = SourceHandle::From(info[0]);
  if (!handle) return;
  const auto source = handle->owner();
  auto result = Nan::New<v8::Object>();
  const auto pointer = [&](const void* value) {
    return v8::BigInt::NewFromUnsigned(info.GetIsolate(),
        reinterpret_cast<std::uintptr_t>(value));
  };
  Set(result, "sound", pointer(source->sound.get()));
  Set(result, "effect", pointer(source->effect.get()));
  Set(result, "generation", v8::BigInt::NewFromUnsigned(info.GetIsolate(),
      source->effect ? source->effect->generation.load(std::memory_order_acquire) : 0));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(CreateAudioQueueProbe) {
  unsigned kind, frames, channels, rate, slots;
  if (!Unsigned(info[0], kind) || !Unsigned(info[1], frames) ||
      !Unsigned(info[2], channels) || !Unsigned(info[3], rate) ||
      !Unsigned(info[4], slots)) return;
  auto state = CreateWorkerState(kind, frames, channels, rate, slots);
  state->running = true;
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", AudioWorkerHandle::Create(state));
  Set(result, "token", RegisterWorker(state));
  info.GetReturnValue().Set(result);
}

// Exercise the real capture queue and native accumulator without opening a
// device. Only the two hardware operations are replaced by the JS fixture.
NAN_METHOD(PrepareAudioRecorderProbe) {
  auto* handle = RecorderHandle::From(info[0]);
  unsigned rate, frames, slots;
  if (!handle || !Unsigned(info[1], rate) || !Unsigned(info[2], frames) ||
      !Unsigned(info[3], slots)) return;
  auto recorder = handle->owner();
  if (recorder->active) return Nan::ThrowError("Recorder is already running");
  if (!rate) return Nan::ThrowRangeError("Sample rate must be positive");
  recorder->callbackRecorder = recorder->bufferRecorder && info[4]->IsTrue();
  recorder->values[0] = rate;
  recorder->current.reset();
  recorder->worker = recorder->bufferRecorder && !recorder->callbackRecorder
      ? nullptr : CreateWorkerState(1, frames, recorder->values[1], rate, slots);
  auto result = Nan::New<v8::Object>();
  if (recorder->worker) {
    recorder->worker->running.store(true, std::memory_order_release);
    Set(result, "handle", AudioWorkerHandle::Create(recorder->worker));
    Set(result, "token", RegisterWorker(recorder->worker));
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(StartAudioRecorderProbe) {
  auto* handle = RecorderHandle::From(info[0]);
  if (!handle) return;
  auto recorder = handle->owner();
  recorder->active = info[1]->IsTrue();
  recorder->values[2] = recorder->active;
  info.GetReturnValue().Set(recorder->active);
}

NAN_METHOD(AudioQueueProbe) {
  auto* handle = AudioWorkerHandle::From(info[0]);
  unsigned command;
  if (!handle || !Unsigned(info[1], command)) return;
  auto state = handle->owner();
  if (command == 0) {
    sf::SoundStream::Chunk chunk;
    const bool more = state->Stream(chunk);
    auto samples = std::make_shared<std::vector<std::int16_t>>();
    if (chunk.sampleCount) samples->assign(chunk.samples, chunk.samples + chunk.sampleCount);
    auto result = Nan::New<v8::Object>();
    Set(result, "more", Nan::New(more));
    Set(result, "samples", samples->empty()
        ? v8::ArrayBuffer::New(info.GetIsolate(), 0)
        : MapShared(info.GetIsolate(), samples, samples->data(), samples->size() * 2));
    info.GetReturnValue().Set(result);
  } else if (command == 1) {
    Bytes samples;
    if (!ReadBytes(info[2], samples, true)) return;
    state->Capture(static_cast<std::int16_t*>(samples.data), samples.size / 2);
  } else if (command == 2) {
    unsigned outFrames, channels;
    if (!Unsigned(info[3], outFrames) || !Unsigned(info[4], channels)) return;
    if (outFrames > 65536 || !channels || channels > 32) {
      return Nan::ThrowRangeError("Invalid probe dimensions");
    }
    float* input = nullptr;
    unsigned inFrames{};
    if (!info[2]->IsNull()) {
      if (!info[2]->IsFloat32Array()) return Nan::ThrowTypeError("Expected float samples");
      auto view = info[2].As<v8::Float32Array>();
      if (view->Buffer()->WasDetached()) return Nan::ThrowTypeError("Detached samples");
      input = reinterpret_cast<float*>(
          static_cast<std::byte*>(view->Buffer()->GetBackingStore()->Data()) + view->ByteOffset());
      inFrames = static_cast<unsigned>(view->Length() / channels);
    }
    auto output = std::make_shared<std::vector<float>>(outFrames * channels);
    state->Effect(input, inFrames, output->data(), outFrames, channels);
    auto result = Nan::New<v8::Object>();
    Set(result, "inputFrames", Nan::New(inFrames));
    Set(result, "outputFrames", Nan::New(outFrames));
    Set(result, "samples", MapShared(info.GetIsolate(), output, output->data(), output->size() * 4));
    info.GetReturnValue().Set(result);
  } else if (command == 3) {
    if (!info[2]->IsBigInt()) return Nan::ThrowTypeError("Expected seek microseconds");
    state->Seek(info[2].As<v8::BigInt>()->Int64Value());
  } else if (command == 4) {
    state->running.store(false, std::memory_order_release);
  } else return Nan::ThrowRangeError("Unknown audio probe command");
}
}

NAN_MODULE_INIT(InitializeAudioProbes) {
  sfmljs::SetMethod<AudioSourceOracle>(target, "audioSourceOracle");
  sfmljs::SetMethod<AudioBufferAliases>(target, "audioBufferAliases");
  sfmljs::SetMethod<AudioSoundBufferMatches>(target, "audioSoundBufferMatches");
  sfmljs::SetMethod<AudioAssignmentState>(target, "audioAssignmentState");
  sfmljs::SetMethod<CreateAudioQueueProbe>(target, "createAudioQueueProbe");
  sfmljs::SetMethod<PrepareAudioRecorderProbe>(target, "prepareAudioRecorderProbe");
  sfmljs::SetMethod<StartAudioRecorderProbe>(target, "startAudioRecorderProbe");
  sfmljs::SetMethod<AudioQueueProbe>(target, "audioQueueProbe");
}
