#pragma once

#include "audio-state.h"

#include <atomic>
#include <cstring>

namespace sfmljs::audio {

// The producer owns an empty slot and the consumer owns a published slot.
// Only publication/release cross threads. Samples and descriptors stay native.
struct AudioBlock {
  std::vector<std::int16_t> pcm;
  std::vector<float> floats;
  std::atomic<bool> ready{false};
  unsigned count{};
  unsigned channels{};
  std::uint64_t generation{};
  bool more{true};
  bool tail{};
  std::int64_t loop{};
};

struct AudioPipe {
  std::vector<std::unique_ptr<AudioBlock>> blocks;
  std::size_t head{}; // consumer only
  std::size_t tail{}; // producer only
  AudioPipe(unsigned slots, unsigned samples, bool floating) {
    for (unsigned i = 0; i < slots; ++i) {
      auto block = std::make_unique<AudioBlock>();
      if (floating) block->floats.resize(samples);
      else block->pcm.resize(samples);
      blocks.push_back(std::move(block));
    }
  }
  AudioBlock* Write() {
    auto* block = blocks[tail % blocks.size()].get();
    return block->ready.load(std::memory_order_acquire) ? nullptr : block;
  }
  void Publish() {
    blocks[tail++ % blocks.size()]->ready.store(true, std::memory_order_release);
  }
  AudioBlock* Read() {
    auto* block = blocks[head % blocks.size()].get();
    return block->ready.load(std::memory_order_acquire) ? block : nullptr;
  }
  void Release() {
    blocks[head++ % blocks.size()]->ready.store(false, std::memory_order_release);
  }
};

struct AudioWorkerState {
  // 0: stream, 1: capture, 2: effect.
  const unsigned kind;
  const unsigned frames;
  const unsigned channels;
  const unsigned rate;
  AudioPipe input;
  AudioPipe output;
  std::vector<std::int16_t> silence;
  std::atomic<bool> closed{false};
  std::atomic<bool> running{false};
  std::atomic<bool> finish{false};
  std::atomic<bool> tailDone{false};
  std::atomic<unsigned> pending{};
  std::atomic<Source*> attached{};
  bool music{};
  std::uint64_t sampleCount{};
  std::atomic<std::uint64_t> loopOffset{};
  std::atomic<std::uint64_t> loopLength{};
  std::atomic<bool> looping{};
  std::atomic<std::uint64_t> generation{1};
  // Stream-only publication sequence: odd while the two seek units are updated.
  std::atomic<std::uint64_t> seekSequence{};
  std::atomic<std::int64_t> seek{};
  // Exact interleaved sample position for loop seeks; -1 for explicit times.
  std::atomic<std::int64_t> seekSample{-1};
  std::atomic<std::uint64_t> underruns{};
  std::atomic<std::uint64_t> overruns{};
  std::atomic<std::uint64_t> processed{};
  // Used only on the attached Worker thread.
  std::uint64_t workerGeneration{};
  bool workerEof{};
  bool leased{};
  unsigned workerOffset{};
  std::array<std::int32_t, 8> fields{};
  std::array<std::int64_t, 6> time{};
  // Used only on the SFML consumer thread.
  bool streamLease{};
  unsigned outputOffset{};
  std::int64_t loop{};

  AudioWorkerState(unsigned mode, unsigned blockFrames, unsigned channelCount,
                   unsigned sampleRate, unsigned slots)
      : kind(mode), frames(blockFrames), channels(channelCount), rate(sampleRate),
        input(slots, blockFrames * channelCount, mode == 2),
        output(slots, blockFrames * channelCount, mode == 2),
        silence(mode == 0 ? blockFrames * channelCount : 0) {}
  void Seek(std::int64_t offset, std::int64_t sample = -1) {
    // SFML serializes a stream's seek callbacks. Publish both units together.
    if (kind == 0) seekSequence.fetch_add(1, std::memory_order_acq_rel);
    seek.store(offset, std::memory_order_relaxed);
    if (kind == 0) seekSample.store(sample, std::memory_order_relaxed);
    generation.fetch_add(1, std::memory_order_release);
    if (kind == 0) seekSequence.fetch_add(1, std::memory_order_release);
  }
  bool Stream(sf::SoundStream::Chunk& chunk);
  void Capture(const std::int16_t* samples, std::size_t count);
  void Effect(const float* in, unsigned& inFrames, float* out,
              unsigned& outFrames, unsigned channelCount);
};

using AudioWorkerHandle = SharedHandle<AudioWorkerState>;

std::shared_ptr<AudioWorkerState> CreateWorkerState(
    unsigned kind, unsigned frames, unsigned channels, unsigned rate,
    unsigned slots);
v8::Local<v8::Object> MapWorker(const std::shared_ptr<AudioWorkerState>& state);
v8::Local<v8::Value> RegisterWorker(const std::shared_ptr<AudioWorkerState>& state);

} // namespace sfmljs::audio
