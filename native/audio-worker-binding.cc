#include "audio-worker.h"

#include <limits>
#include <unordered_map>

namespace sfmljs::audio {
namespace {
std::mutex registryMutex;
std::unordered_map<std::uint64_t, std::weak_ptr<AudioWorkerState>> registry;
std::uint64_t nextToken{};
}

std::shared_ptr<AudioWorkerState> CreateWorkerState(
    unsigned kind, unsigned frames, unsigned channels, unsigned rate,
    unsigned slots) {
  if (kind > 2 || frames < 64 || frames > 65536 || channels < 1 ||
      channels > 32 || rate < 1 || slots < 2 || slots > 32) {
    throw std::range_error("Invalid audio queue dimensions");
  }
  return std::make_shared<AudioWorkerState>(kind, frames, channels, rate, slots);
}

v8::Local<v8::Value> RegisterWorker(const std::shared_ptr<AudioWorkerState>& state) {
  std::lock_guard lock(registryMutex);
  std::erase_if(registry, [](const auto& item) { return item.second.expired(); });
  const auto token = ++nextToken;
  registry.emplace(token, state);
  return v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(), token);
}

v8::Local<v8::Object> MapWorker(const std::shared_ptr<AudioWorkerState>& state) {
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", AudioWorkerHandle::Create(state));
  Set(result, "fields", MapShared(v8::Isolate::GetCurrent(), state,
                                state->fields.data(), sizeof(state->fields)));
  Set(result, "time", MapShared(v8::Isolate::GetCurrent(), state,
                              state->time.data(), sizeof(state->time)));
  auto mapPipe = [&](AudioPipe& pipe) {
    auto array = Nan::New<v8::Array>(static_cast<int>(pipe.blocks.size()));
    for (unsigned i = 0; i < pipe.blocks.size(); ++i) {
      auto& block = *pipe.blocks[i];
      auto buffer = state->kind == 2
          ? MapShared(v8::Isolate::GetCurrent(), state, block.floats.data(),
                      block.floats.size() * sizeof(float))
          : MapShared(v8::Isolate::GetCurrent(), state, block.pcm.data(),
                      block.pcm.size() * sizeof(std::int16_t));
      Nan::Set(array, i, buffer).FromJust();
    }
    return array;
  };
  Set(result, "input", mapPipe(state->input));
  Set(result, "output", mapPipe(state->output));
  return result;
}

bool AudioWorkerState::Stream(sf::SoundStream::Chunk& chunk) {
  if (streamLease) { input.Release(); streamLease = false; }
  if (closed.load(std::memory_order_acquire)) return false;
  const auto current = generation.load(std::memory_order_acquire);
  for (unsigned i = 0; i < input.blocks.size(); ++i) {
    auto* block = input.Read();
    if (!block) break;
    if (block->generation != current) { input.Release(); continue; }
    chunk = {block->pcm.data(), block->count};
    loop = block->loop;
    streamLease = true;
    processed.fetch_add(block->count, std::memory_order_relaxed);
    return block->more;
  }
  underruns.fetch_add(1, std::memory_order_relaxed);
  chunk = {silence.data(), silence.size()};
  return true;
}

void AudioWorkerState::Capture(const std::int16_t* samples, std::size_t count) {
  if (closed.load(std::memory_order_acquire) ||
      finish.load(std::memory_order_acquire)) return;
  const unsigned capacity = frames * channels;
  while (count) {
    auto* block = input.Write();
    if (!block) { overruns.fetch_add(count, std::memory_order_relaxed); return; }
    const auto size = static_cast<unsigned>(std::min<std::size_t>(count, capacity));
    std::memcpy(block->pcm.data(), samples, size * sizeof(*samples));
    block->count = size;
    block->channels = channels;
    input.Publish();
    samples += size;
    count -= size;
  }
}

void AudioWorkerState::Effect(const float* in, unsigned& inFrames, float* out,
                              unsigned& outFrames, unsigned channelCount) {
  if (closed.load(std::memory_order_acquire) || channelCount > channels ||
      channelCount == 0) {
    std::fill_n(out, outFrames * channelCount, 0.f);
    if (!in) outFrames = 0;
    return;
  }
  const unsigned accepted = in ? std::min(inFrames, frames) : 0;
  const auto current = generation.load(std::memory_order_acquire);
  if (in) tailDone.store(false, std::memory_order_release);
  if (in || !tailDone.load(std::memory_order_acquire)) {
    if (auto* block = input.Write()) {
      block->count = accepted * channelCount;
      block->channels = channelCount;
      block->tail = !in;
      block->generation = current;
      if (accepted) std::memcpy(block->floats.data(), in, block->count * sizeof(float));
      pending.fetch_add(1, std::memory_order_relaxed);
      input.Publish();
    } else {
      overruns.fetch_add(accepted, std::memory_order_relaxed);
    }
  }
  inFrames = accepted;
  const unsigned requested = outFrames;
  unsigned written{};
  while (written < requested) {
    auto* block = output.Read();
    if (!block) break;
    if (block->channels != channelCount || block->generation != current) {
      output.Release();
      outputOffset = 0;
      continue;
    }
    const auto count = std::min(requested - written,
                                (block->count - outputOffset) / channelCount);
    std::memcpy(out + written * channelCount, block->floats.data() + outputOffset,
                count * channelCount * sizeof(float));
    written += count;
    outputOffset += count * channelCount;
    if (outputOffset == block->count) {
      output.Release();
      outputOffset = 0;
    }
  }
  if (!in && tailDone.load(std::memory_order_acquire) &&
      pending.load(std::memory_order_acquire) == 0) {
    outFrames = written;
    return;
  }
  if (written < requested) {
    underruns.fetch_add(requested - written, std::memory_order_relaxed);
    std::fill(out + written * channelCount, out + requested * channelCount, 0.f);
  }
}

class WorkerStream final : public sf::SoundStream {
 public:
  WorkerStream(std::shared_ptr<AudioWorkerState> state,
                const std::vector<sf::SoundChannel>& channels)
      : state_(std::move(state)) {
    initialize(state_->channels, state_->rate, channels);
  }
  ~WorkerStream() override {
    stop();
    state_->closed.store(true, std::memory_order_release);
  }
  bool onGetData(Chunk& chunk) override { return state_->Stream(chunk); }
  void onSeek(sf::Time time) override { state_->Seek(time.asMicroseconds()); }
  std::optional<std::uint64_t> onLoop() override {
    if (state_->loop < 0) return std::nullopt;
    const auto sample = static_cast<std::uint64_t>(state_->loop);
    state_->Seek(static_cast<std::int64_t>(
        sample / state_->channels * 1000000 / state_->rate), state_->loop);
    return sample;
  }
 private:
  std::shared_ptr<AudioWorkerState> state_;
};

NAN_METHOD(CreateAudioStream) {
  unsigned frames, channels, rate, slots;
  std::vector<sf::SoundChannel> map;
  if (!Unsigned(info[0], frames) || !Unsigned(info[1], channels) ||
      !Unsigned(info[2], rate) || !Unsigned(info[3], slots) ||
      !Channels(info[4], map)) return;
  if (map.size() != channels) return Nan::ThrowRangeError("Channel map size mismatch");
  auto state = CreateWorkerState(0, frames, channels, rate, slots);
  auto source = MakeThreadOwned<Source>();
  source->kind = 2;
  source->stream = state;
  source->sound = std::make_unique<WorkerStream>(state, map);
  auto result = MapSource(source);
  Set(result, "token", RegisterWorker(state));
  Set(result, "worker", AudioWorkerHandle::Create(state));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(OpenAudioMusicStream) {
  auto* handle = SourceHandle::From(info[0]);
  unsigned frames, channels, rate, slots;
  std::vector<sf::SoundChannel> map;
  if (!handle || !Unsigned(info[1], frames) || !Unsigned(info[2], channels) ||
      !Unsigned(info[3], rate) || !Unsigned(info[4], slots) ||
      !Channels(info[5], map)) return;
  bool lossless{};
  const auto count = info[6]->IsBigInt() ? info[6].As<v8::BigInt>()->Uint64Value(&lossless) : 0;
  if (!lossless || map.size() != channels) return Nan::ThrowRangeError("Invalid music metadata");
  auto source = handle->owner();
  if (source->kind != 1 && source->kind != 3) return Nan::ThrowTypeError("Expected Music");
  auto state = CreateWorkerState(0, frames, channels, rate, slots);
  state->music = true;
  state->sampleCount = count;
  state->loopLength = count;
  const bool looping = source->AsStream()->isLooping();
  auto sound = std::make_unique<WorkerStream>(state, map);
  CopySourceSettings(*sound, *source->sound);
  sound->setLooping(looping);
  state->looping = looping;
  source->sound->stop();
  source->sound = std::move(sound);
  source->encoded = {};
  source->kind = 3;
  source->stream = state;
  InstallSourceEffect(source);
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", AudioWorkerHandle::Create(state));
  Set(result, "token", RegisterWorker(state));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(AttachAudioWorker) {
  if (!info[0]->IsBigInt()) return Nan::ThrowTypeError("Expected an audio worker token");
  const auto token = info[0].As<v8::BigInt>()->Uint64Value();
  std::shared_ptr<AudioWorkerState> state;
  {
    std::lock_guard lock(registryMutex);
    const auto found = registry.find(token);
    if (found != registry.end()) { state = found->second.lock(); registry.erase(found); }
  }
  if (!state) return Nan::ThrowError("Audio worker token has expired or was already used");
  info.GetReturnValue().Set(MapWorker(state));
}

NAN_METHOD(PollAudioWorker) {
  auto* handle = AudioWorkerHandle::From(info[0]);
  if (!handle) return;
  auto& state = *handle->owner();
  if (state.closed.load(std::memory_order_acquire)) {
    info.GetReturnValue().Set(-3); return;
  }
  if (state.kind == 1 && state.finish.load(std::memory_order_acquire)) {
    info.GetReturnValue().Set(state.running.load(std::memory_order_acquire) ? -1 : -3);
    return;
  }
  if (state.leased) return Nan::ThrowError("Previous audio block is still leased");
  auto& f = state.fields;
  if (state.kind == 0) {
    const auto sequence = state.seekSequence.load(std::memory_order_acquire);
    const auto generation = state.generation.load(std::memory_order_acquire);
    if (sequence & 1) { info.GetReturnValue().Set(-1); return; }
    if (state.workerGeneration != generation) {
      const auto offset = state.seek.load(std::memory_order_relaxed);
      const auto sample = state.seekSample.load(std::memory_order_relaxed);
      if (state.seekSequence.load(std::memory_order_acquire) != sequence) {
        info.GetReturnValue().Set(-1); return;
      }
      state.workerGeneration = generation;
      state.workerEof = false;
      state.time[0] = offset;
      state.time[5] = sample;
      info.GetReturnValue().Set(-2); return;
    }
    if (state.workerEof || !state.input.Write()) {
      info.GetReturnValue().Set(-1); return;
    }
    f[0] = static_cast<int>(state.input.tail % state.input.blocks.size());
    f[2] = state.frames * state.channels;
    f[3] = 1;
    f[4] = state.looping.load(std::memory_order_acquire);
    state.time[1] = 0;
    state.time[2] = static_cast<std::int64_t>(state.sampleCount);
    state.time[3] = static_cast<std::int64_t>(state.loopOffset.load(std::memory_order_acquire));
    state.time[4] = static_cast<std::int64_t>(state.loopLength.load(std::memory_order_acquire));
  } else {
    auto* input = state.input.Read();
    while (input && state.kind == 2 &&
           input->generation != state.generation.load(std::memory_order_acquire)) {
      state.input.Release();
      state.pending.fetch_sub(1, std::memory_order_release);
      state.workerOffset = 0;
      input = state.input.Read();
    }
    if (!input && state.kind == 1 &&
        !state.running.load(std::memory_order_acquire)) {
      info.GetReturnValue().Set(-3); return;
    }
    if (!input || (state.kind == 2 && !state.output.Write())) {
      info.GetReturnValue().Set(-1); return;
    }
    f[0] = static_cast<int>(state.input.head % state.input.blocks.size());
    f[1] = static_cast<int>(state.output.tail % state.output.blocks.size());
    f[2] = input->count - state.workerOffset;
    f[3] = input->channels;
    f[4] = state.workerOffset;
    f[5] = input->tail;
    f[6] = state.frames;
    f[7] = state.kind == 2 ? f[2] / f[3] : f[2];
  }
  state.leased = true;
  info.GetReturnValue().Set(0);
}

NAN_METHOD(CommitAudioWorker) {
  auto* handle = AudioWorkerHandle::From(info[0]);
  if (!handle) return;
  auto& state = *handle->owner();
  if (!state.leased) return Nan::ThrowError("No leased audio block");
  auto& f = state.fields;
  if (state.kind == 0) {
    if (f[2] < 0 || static_cast<unsigned>(f[2]) > state.frames * state.channels ||
        f[2] % state.channels || (f[2] == 0 && f[3])) {
      return Nan::ThrowRangeError("Invalid stream sample count");
    }
    auto* block = state.input.Write();
    block->count = f[2];
    block->more = f[3] != 0;
    block->generation = state.workerGeneration;
    block->loop = state.time[1];
    state.workerEof = !block->more;
    state.input.Publish();
  } else if (state.kind == 1) {
    state.processed.fetch_add(state.input.Read()->count, std::memory_order_relaxed);
    state.input.Release();
    if (!info[1]->IsTrue()) state.finish.store(true, std::memory_order_release);
  } else {
    auto* input = state.input.Read();
    if (f[6] < 0 || static_cast<unsigned>(f[6]) > state.frames || f[7] < 0 ||
        static_cast<unsigned>(f[7]) > (input->count - state.workerOffset) / input->channels ||
        (f[6] == 0 && f[7] == 0 && !input->tail)) {
      return Nan::ThrowRangeError("Invalid effect frame counts or no progress");
    }
    if (f[6]) {
      auto* output = state.output.Write();
      output->count = f[6] * input->channels;
      output->channels = input->channels;
      output->generation = input->generation;
      state.output.Publish();
    }
    state.workerOffset += f[7] * input->channels;
    state.processed.fetch_add(f[7], std::memory_order_relaxed);
    if (input->tail || state.workerOffset == input->count) {
      if (input->tail && input->generation ==
          state.generation.load(std::memory_order_acquire)) {
        state.tailDone.store(f[6] == 0, std::memory_order_release);
      }
      state.input.Release();
      state.pending.fetch_sub(1, std::memory_order_release);
      state.workerOffset = 0;
    }
  }
  state.leased = false;
}

NAN_METHOD(CloseAudioWorker) {
  auto* handle = AudioWorkerHandle::From(info[0]);
  if (handle) handle->owner()->closed.store(true, std::memory_order_release);
}

NAN_METHOD(AudioWorkerStats) {
  auto* handle = AudioWorkerHandle::From(info[0]);
  if (!handle) return;
  auto state = handle->owner();
  auto values = std::make_shared<std::array<std::uint64_t, 3>>();
  *values = {state->underruns.load(std::memory_order_relaxed),
             state->overruns.load(std::memory_order_relaxed),
             state->processed.load(std::memory_order_relaxed)};
  info.GetReturnValue().Set(MapShared(info.GetIsolate(), values,
                                     values->data(), sizeof(*values)));
}

NAN_METHOD(CreateAudioEffect) {
  unsigned frames, channels, slots;
  if (!Unsigned(info[0], frames) || !Unsigned(info[1], channels) ||
      !Unsigned(info[2], slots)) return;
  auto state = CreateWorkerState(2, frames, channels, 1, slots);
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", AudioWorkerHandle::Create(state));
  Set(result, "token", RegisterWorker(state));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SetAudioEffect) {
  auto* source = SourceHandle::From(info[0]);
  if (!source) return;
  auto change = [&](auto action) {
    auto& owner = *source->owner();
    const auto status = owner.sound->getStatus();
    const auto offset = owner.AsSound() ? owner.AsSound()->getPlayingOffset()
                                        : owner.AsStream()->getPlayingOffset();
    owner.sound->stop();
    action();
    if (owner.AsSound()) owner.AsSound()->setPlayingOffset(offset);
    else owner.AsStream()->setPlayingOffset(offset);
    if (status != sf::SoundSource::Status::Stopped) owner.sound->play();
    if (status == sf::SoundSource::Status::Paused) owner.sound->pause();
  };
  if (info[1]->IsNullOrUndefined()) {
    change([&] { source->owner()->sound->setEffectProcessor({}); });
    if (source->owner()->effect) {
      source->owner()->effect->attached.store(nullptr, std::memory_order_release);
      source->owner()->effect.reset();
    }
    return;
  }
  auto* handle = AudioWorkerHandle::From(info[1]);
  if (!handle) return;
  auto state = handle->owner();
  if (state->kind != 2) return Nan::ThrowTypeError("Expected an effect processor");
  if (state->closed.load(std::memory_order_acquire)) {
    return Nan::ThrowError("Effect processor is closed");
  }
  if (source->owner()->effect == state) return;
  Source* expected = nullptr;
  if (!state->attached.compare_exchange_strong(expected, source->owner().get())) {
    return Nan::ThrowError("An effect processor can be attached to one source");
  }
  change([&] {
    if (source->owner()->effect) {
      source->owner()->effect->attached.store(nullptr, std::memory_order_release);
    }
    source->owner()->effect = state;
    state->Seek(0);
    source->owner()->sound->setEffectProcessor(
        [state](const float* in, unsigned& inFrames, float* out,
                unsigned& outFrames, unsigned channels) {
          state->Effect(in, inFrames, out, outFrames, channels);
        });
  });
}

} // namespace sfmljs::audio

NAN_MODULE_INIT(InitializeAudioWorkers) {
  using namespace sfmljs::audio;
  sfmljs::SetMethod<CreateAudioStream>(target, "createAudioStream");
  sfmljs::SetMethod<OpenAudioMusicStream>(target, "openAudioMusicStream");
  sfmljs::SetMethod<AttachAudioWorker>(target, "attachAudioWorker");
  sfmljs::SetMethod<PollAudioWorker>(target, "pollAudioWorker");
  sfmljs::SetMethod<CommitAudioWorker>(target, "commitAudioWorker");
  sfmljs::SetMethod<CloseAudioWorker>(target, "closeAudioWorker");
  sfmljs::SetMethod<AudioWorkerStats>(target, "audioWorkerStats");
  sfmljs::SetMethod<CreateAudioEffect>(target, "createAudioEffect");
  sfmljs::SetMethod<SetAudioEffect>(target, "setAudioEffect");
}
