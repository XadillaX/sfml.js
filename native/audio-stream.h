#pragma once

#include "audio-state.h"

#include <SFML/System/InputStream.hpp>

namespace sfmljs::audio {

// Decoder threads may wait for asynchronous InputStream methods. Device
// callbacks never use this bridge; Music routes it through a PCM queue.
struct StreamClient : sf::InputStream {
  struct Bridge;
  std::shared_ptr<Bridge> bridge;
  explicit StreamClient(v8::Local<v8::Function> dispatch);
  ~StreamClient() override;
  std::optional<std::size_t> read(void* data, std::size_t size) override;
  std::optional<std::size_t> seek(std::size_t position) override;
  std::optional<std::size_t> tell() override;
  std::optional<std::size_t> getSize() override;
  void Cancel();
};

using StreamClientHandle = SharedHandle<StreamClient>;

void QueueThread(v8::Local<v8::Value> callback, Job::Action work,
                 Job::Result result, Job::Action cancel = {});

} // namespace sfmljs::audio
