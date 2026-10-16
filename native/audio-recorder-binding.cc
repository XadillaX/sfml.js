#include "audio-recorder.h"

namespace sfmljs::audio {

// SFML 3.1 calls onProcessSamples from the device callback. Returning false
// invokes ma_device_stop on that callback thread. Stop from an async job instead.
class WorkerRecorder final : public sf::SoundRecorder {
 public:
  explicit WorkerRecorder(std::shared_ptr<AudioWorkerState> state)
      : state_(std::move(state)) {}
  ~WorkerRecorder() override { stop(); }
 private:
  bool onProcessSamples(const std::int16_t* samples, std::size_t count) override {
    if (state_) state_->Capture(samples, count);
    return true;
  }
  std::shared_ptr<AudioWorkerState> state_;
};

NAN_METHOD(CreateAudioRecorder) {
  if (!info[0]->IsBoolean()) return Nan::ThrowTypeError("Expected a recorder kind");
  auto recorder = MakeThreadOwned<Recorder>();
  recorder->bufferRecorder = info[0]->IsTrue();
  recorder->device = sf::SoundRecorder::getDefaultDevice();
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", RecorderHandle::Create(recorder));
  Set(result, "values", MapShared(info.GetIsolate(), recorder,
                                 recorder->values.data(), sizeof(recorder->values)));
  Set(result, "channelMap", MapChannels(recorder->channels, *recorder->channels));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(PrepareAudioRecorder) {
  auto* handle = RecorderHandle::From(info[0]);
  unsigned rate, frames, slots;
  if (!handle || !Unsigned(info[1], rate) || !Unsigned(info[2], frames) ||
      !Unsigned(info[3], slots)) return;
  auto recorder = handle->owner();
  if (recorder->active) return Nan::ThrowError("Recorder is already running");
  if (rate == 0) return Nan::ThrowRangeError("Sample rate must be positive");
  const bool callbacks = recorder->bufferRecorder && info[5]->IsTrue();
  const bool direct = recorder->bufferRecorder && !callbacks;
  auto state = direct ? nullptr
      : CreateWorkerState(1, frames, recorder->values[1], rate, slots);
  if (state) state->running.store(true, std::memory_order_release);
  auto next = std::make_shared<std::shared_ptr<sf::SoundRecorder>>();
  Queue(info[4], [recorder, state, next, direct] {
    if (direct) *next = std::make_shared<sf::SoundBufferRecorder>();
    else *next = std::make_shared<WorkerRecorder>(state);
    (*next)->setChannelCount(recorder->values[1]);
    if ((*next)->getDevice() != recorder->device &&
        !(*next)->setDevice(recorder->device)) {
      throw std::runtime_error("Failed to select capture device");
    }
  }, [recorder, state, next, rate, callbacks]() -> v8::Local<v8::Value> {
    recorder->current = std::move(*next);
    recorder->worker = state;
    recorder->callbackRecorder = callbacks;
    recorder->values[0] = rate;
    auto result = Nan::New<v8::Object>();
    if (state) {
      Set(result, "handle", AudioWorkerHandle::Create(state));
      Set(result, "token", RegisterWorker(state));
    }
    return result;
  });
}

NAN_METHOD(StartAudioRecorder) {
  auto* handle = RecorderHandle::From(info[0]);
  if (!handle) return;
  auto recorder = handle->owner();
  if (!recorder->current) return Nan::ThrowError("Recorder is not prepared");
  auto ok = std::make_shared<bool>();
  Queue(info[1], [recorder, ok] {
    *ok = recorder->current->start(recorder->values[0]);
  }, [recorder, ok]() -> v8::Local<v8::Value> {
    recorder->active = *ok;
    recorder->values[2] = *ok;
    return Nan::New(*ok);
  });
}

NAN_METHOD(StopAudioRecorder) {
  auto* handle = RecorderHandle::From(info[0]);
  if (!handle) return;
  auto recorder = handle->owner();
  Queue(info[1], [recorder] {
    if (recorder->current) recorder->current->stop();
  }, [recorder]() -> v8::Local<v8::Value> {
    const bool wasActive = recorder->active;
    recorder->active = false;
    recorder->values[2] = 0;
    if (recorder->worker) {
      recorder->worker->running.store(false, std::memory_order_release);
    }
    if (!recorder->bufferRecorder || recorder->callbackRecorder || !wasActive ||
        !recorder->current) return Nan::Undefined();
    auto& buffer = static_cast<sf::SoundBufferRecorder&>(*recorder->current).getBuffer();
    auto data = MakeThreadOwned<BufferData>(recorder->current,
                                            const_cast<sf::SoundBuffer&>(buffer));
    return BufferDataHandle::Create(data);
  });
}

NAN_METHOD(CreateAudioRecorderBuffer) {
  auto* handle = RecorderHandle::From(info[0]);
  if (!handle) return;
  const auto recorder = handle->owner();
  auto buffer = std::make_shared<RecorderBuffer>(recorder->values[0],
                                                *recorder->channels);
  info.GetReturnValue().Set(RecorderBufferHandle::Create(buffer));
}

NAN_METHOD(AudioRecorderBuffer) {
  auto* handle = RecorderBufferHandle::From(info[0]);
  unsigned command;
  if (!handle || !Unsigned(info[1], command)) return;
  auto buffer = handle->owner();
  if (command == 0) {
    buffer->pcm.clear();
    buffer->result = MakeThreadOwned<BufferData>();
    buffer->finalized = false;
  } else if (command == 1) {
    Bytes samples;
    if (!ReadBytes(info[2], samples, true)) return;
    if (buffer->finalized) return Nan::ThrowError("Recorder buffer is finalized");
    const auto count = samples.size / sizeof(std::int16_t);
    if (count % buffer->channels.size()) {
      return Nan::ThrowRangeError("Recorder samples must contain complete frames");
    }
    if (count) {
      const auto* data = static_cast<const std::int16_t*>(samples.data);
      buffer->pcm.insert(buffer->pcm.end(), data, data + count);
    }
    return;
  } else if (command == 2) {
    if (!buffer->finalized) {
      auto result = MakeThreadOwned<BufferData>();
      if (!buffer->pcm.empty() &&
          !result->buffer.loadFromSamples(buffer->pcm.data(), buffer->pcm.size(),
              static_cast<unsigned>(buffer->channels.size()), buffer->rate,
              buffer->channels)) {
        return Nan::ThrowError("Failed to finalize recorder buffer");
      }
      result->Update();
      buffer->result = std::move(result);
      buffer->finalized = true;
      std::vector<std::int16_t>().swap(buffer->pcm);
    }
  } else return Nan::ThrowRangeError("Unknown recorder buffer command");
  info.GetReturnValue().Set(BufferDataHandle::Create(buffer->result));
}

NAN_METHOD(AudioRecorderDevice) {
  auto* handle = RecorderHandle::From(info[0]);
  if (!handle) return;
  auto recorder = handle->owner();
  if (info[1]->IsUndefined()) {
    info.GetReturnValue().Set(Nan::New(recorder->device).ToLocalChecked());
    return;
  }
  std::string name;
  if (!String(info[1], name)) return;
  // Device replacement is serialized with capture start/stop in TypeScript.
  auto ok = std::make_shared<bool>();
  Queue(info[2], [recorder, name, ok] {
    if (recorder->current) {
      if (recorder->active) recorder->current->stop();
      *ok = recorder->current->setDevice(name);
      if (*ok && recorder->active) {
        *ok = recorder->current->start(recorder->values[0]);
      }
    }
    else {
      const auto devices = sf::SoundRecorder::getAvailableDevices();
      *ok = std::find(devices.begin(), devices.end(), name) != devices.end();
    }
  }, [recorder, name, ok]() -> v8::Local<v8::Value> {
    if (*ok) recorder->device = name;
    else {
      recorder->active = false;
      recorder->values[2] = 0;
      if (recorder->worker) {
        recorder->worker->running.store(false, std::memory_order_release);
      }
    }
    return Nan::New(*ok);
  });
}

NAN_METHOD(AudioRecorderChannels) {
  auto* handle = RecorderHandle::From(info[0]);
  unsigned count;
  if (!handle || !Unsigned(info[1], count)) return;
  auto recorder = handle->owner();
  if (count < 1 || count > 2) return Nan::ThrowRangeError("Capture supports mono or stereo");
  if (recorder->active) return Nan::ThrowError("Stop capture before changing channels");
  recorder->values[1] = count;
  auto channels = std::make_shared<std::vector<sf::SoundChannel>>();
  if (count == 1) *channels = {sf::SoundChannel::Mono};
  else *channels = {sf::SoundChannel::FrontLeft, sf::SoundChannel::FrontRight};
  recorder->channels = channels;
  info.GetReturnValue().Set(MapChannels(channels, *channels));
}

NAN_METHOD(AudioCaptureDevices) {
  unsigned command;
  if (!Unsigned(info[0], command)) return;
  if (command == 0) {
    const auto devices = sf::SoundRecorder::getAvailableDevices();
    auto result = Nan::New<v8::Array>(static_cast<int>(devices.size()));
    for (unsigned i = 0; i < devices.size(); ++i) {
      Nan::Set(result, i, Nan::New(devices[i]).ToLocalChecked()).FromJust();
    }
    info.GetReturnValue().Set(result);
  } else if (command == 1) {
    info.GetReturnValue().Set(Nan::New(sf::SoundRecorder::getDefaultDevice()).ToLocalChecked());
  } else if (command == 2) {
    info.GetReturnValue().Set(sf::SoundRecorder::isAvailable());
  } else return Nan::ThrowRangeError("Unknown capture device command");
}

} // namespace sfmljs::audio

NAN_MODULE_INIT(InitializeAudioRecorders) {
  using namespace sfmljs::audio;
  sfmljs::SetMethod<CreateAudioRecorder>(target, "createAudioRecorder");
  sfmljs::SetMethod<PrepareAudioRecorder>(target, "prepareAudioRecorder");
  sfmljs::SetMethod<StartAudioRecorder>(target, "startAudioRecorder");
  sfmljs::SetMethod<StopAudioRecorder>(target, "stopAudioRecorder");
  sfmljs::SetMethod<CreateAudioRecorderBuffer>(target, "createAudioRecorderBuffer");
  sfmljs::SetMethod<AudioRecorderBuffer>(target, "audioRecorderBuffer");
  sfmljs::SetMethod<AudioRecorderDevice>(target, "audioRecorderDevice");
  sfmljs::SetMethod<AudioRecorderChannels>(target, "audioRecorderChannels");
  sfmljs::SetMethod<AudioCaptureDevices>(target, "audioCaptureDevices");
}
