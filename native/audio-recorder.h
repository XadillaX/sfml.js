#pragma once

#include "audio-worker.h"

namespace sfmljs::audio {

struct Recorder {
  bool bufferRecorder{};
  bool callbackRecorder{};
  bool active{};
  std::shared_ptr<sf::SoundRecorder> current;
  std::shared_ptr<AudioWorkerState> worker;
  std::array<std::uint32_t, 3> values{44100, 1, 0};
  std::shared_ptr<std::vector<sf::SoundChannel>> channels =
      std::make_shared<std::vector<sf::SoundChannel>>(
          std::initializer_list<sf::SoundChannel>{sf::SoundChannel::Mono});
  std::string device;
  ~Recorder() { CloseBeforeThreadExit(); }
  void CloseBeforeThreadExit() {
    if (current) current->stop();
    if (worker) worker->closed.store(true, std::memory_order_release);
  }
};
using RecorderHandle = SharedHandle<Recorder>;

// Each callback session owns an independent accumulator. Old callbacks cannot
// append to a subsequent capture, and retained SoundBuffers remain snapshots.
struct RecorderBuffer {
  unsigned rate;
  std::vector<sf::SoundChannel> channels;
  std::vector<std::int16_t> pcm;
  std::shared_ptr<BufferData> result = MakeThreadOwned<BufferData>();
  bool finalized{};
  RecorderBuffer(unsigned sampleRate, std::vector<sf::SoundChannel> map)
      : rate(sampleRate), channels(std::move(map)) {}
};
using RecorderBufferHandle = SharedHandle<RecorderBuffer>;

} // namespace sfmljs::audio
