#pragma once

#include "deferred-delete.h"
#include "exception-boundary.h"
#include "numeric-fields.h"

#include <SFML/Audio.hpp>
#include <SFML/System/MemoryInputStream.hpp>

#include <array>
#include <functional>
#include <span>
#include <string>
#include <vector>

namespace sfmljs::audio {

using Info = Nan::FunctionCallbackInfo<v8::Value>;

inline void Set(v8::Local<v8::Object> object, const char* name,
                v8::Local<v8::Value> value) {
  Nan::Set(object, Nan::New(name).ToLocalChecked(), value).FromJust();
}

inline bool Unsigned(v8::Local<v8::Value> value, unsigned& result) {
  if (!value->IsUint32()) {
    Nan::ThrowRangeError("Expected an unsigned 32-bit integer");
    return false;
  }
  result = Nan::To<unsigned>(value).FromJust();
  return true;
}

inline bool String(v8::Local<v8::Value> value, std::string& result) {
  if (!value->IsString()) {
    Nan::ThrowTypeError("Expected a string");
    return false;
  }
  Nan::Utf8String text(value);
  result.assign(*text, text.length());
  if (result.find('\0') != std::string::npos) {
    Nan::ThrowTypeError("Unexpected null byte in string");
    return false;
  }
  return true;
}

inline std::filesystem::path Path(const std::string& path) {
  return std::filesystem::path(std::u8string(path.begin(), path.end()));
}

// Retain the allocation, not the JS wrapper. Transfer cannot invalidate a job.
struct Bytes {
  std::shared_ptr<v8::BackingStore> backing;
  void* data{};
  std::size_t size{};
};

inline bool ReadBytes(v8::Local<v8::Value> value, Bytes& result,
                      bool samples = false) {
  if (samples ? !value->IsInt16Array() : !value->IsUint8Array()) {
    Nan::ThrowTypeError(samples ? "Expected an Int16Array" : "Expected a Uint8Array");
    return false;
  }
  auto view = value.As<v8::ArrayBufferView>();
  auto buffer = view->Buffer();
  auto backing = buffer->GetBackingStore();
  if (buffer->WasDetached() || backing->IsShared()
#if V8_MAJOR_VERSION >= 11
      || backing->IsResizableByUserJavaScript()
#endif
  ) {
    Nan::ThrowTypeError("Expected attached, fixed, non-shared storage");
    return false;
  }
  result = {backing, static_cast<std::byte*>(backing->Data()) + view->ByteOffset(),
            view->ByteLength()};
  return true;
}

inline bool Channels(v8::Local<v8::Value> value,
                     std::vector<sf::SoundChannel>& result) {
  if (!value->IsInt32Array()) {
    Nan::ThrowTypeError("Expected an Int32Array channel map");
    return false;
  }
  auto view = value.As<v8::Int32Array>();
  if (view->Buffer()->WasDetached()) {
    Nan::ThrowTypeError("Detached channel map");
    return false;
  }
  Nan::TypedArrayContents<std::int32_t> data(value);
  for (std::size_t i = 0; i < view->Length(); ++i) {
    if ((*data)[i] < 0 || (*data)[i] > static_cast<int>(sf::SoundChannel::TopBackCenter)) {
      Nan::ThrowRangeError("Unknown sound channel");
      return false;
    }
    result.push_back(static_cast<sf::SoundChannel>((*data)[i]));
  }
  return true;
}

template <typename Owner>
v8::Local<v8::ArrayBuffer> MapChannels(const std::shared_ptr<Owner>& owner,
                                      const std::vector<sf::SoundChannel>& map) {
  static_assert(sizeof(sf::SoundChannel) == 4);
  return map.empty() ? v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), 0)
      : MapShared(v8::Isolate::GetCurrent(), owner,
          const_cast<sf::SoundChannel*>(map.data()), map.size() * sizeof(map[0]));
}

// Derived facts and async results only. SFML-owned scalar members map directly
// wherever their lifetime is stable; no JavaScript metadata mirror.
struct Metadata {
  std::uint64_t count{};
  std::uint64_t offset{};
  std::int64_t duration{};
  std::int64_t timeOffset{};
  std::uint64_t transferred{};
  std::uint32_t rate{};
  std::uint32_t channels{};
};
static_assert(sizeof(Metadata) == 48);

struct BufferData {
  std::shared_ptr<void> retained;
  std::unique_ptr<sf::SoundBuffer> owned;
  sf::SoundBuffer& buffer;
  std::uint64_t count{};
  std::uint32_t channels{};
  BufferData() : owned(std::make_unique<sf::SoundBuffer>()), buffer(*owned) {}
  BufferData(std::shared_ptr<void> owner, sf::SoundBuffer& value)
      : retained(std::move(owner)), buffer(value) {}
  void Update() {
    count = buffer.getSampleCount();
    channels = buffer.getChannelCount();
  }
};

struct Source;
struct AudioWorkerState;
struct Buffer {
  std::shared_ptr<BufferData> current = MakeThreadOwned<BufferData>();
  std::vector<std::weak_ptr<Source>> sounds;
};

// Control/result storage is confined to the owning JS thread. The SFML calls
// implement the engine's conversions and synchronization, not naked writes.
struct Source {
  unsigned kind{1}; // 0 Sound, 1 Music, 2 custom SoundStream
  std::shared_ptr<Buffer> buffer;
  std::shared_ptr<BufferData> samples;
  Bytes encoded;
  std::unique_ptr<sf::SoundSource> sound;
  std::shared_ptr<AudioWorkerState> effect;
  std::shared_ptr<AudioWorkerState> stream;
  std::array<float, 32> values{};
  std::array<std::int64_t, 4> times{};
  std::vector<sf::SoundChannel> channels;
  virtual ~Source();
  sf::Sound* AsSound() {
    return kind == 0 ? static_cast<sf::Sound*>(sound.get()) : nullptr;
  }
  sf::SoundStream* AsStream() {
    return kind != 0 ? static_cast<sf::SoundStream*>(sound.get()) : nullptr;
  }
  sf::Music* AsMusic() {
    return kind == 1 ? static_cast<sf::Music*>(sound.get()) : nullptr;
  }
  void CloseBeforeThreadExit();
};

using BufferHandle = SharedHandle<Buffer>;
using BufferDataHandle = SharedHandle<BufferData>;
using SourceHandle = SharedHandle<Source>;

inline v8::Local<v8::Object> MapSource(const std::shared_ptr<Source>& source) {
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", SourceHandle::Create(source));
  Set(result, "values", MapShared(v8::Isolate::GetCurrent(), source,
                                 source->values.data(), sizeof(source->values)));
  Set(result, "times", MapShared(v8::Isolate::GetCurrent(), source,
                                source->times.data(), sizeof(source->times)));
  return result;
}

class Job final : public sfmljs::AsyncWorker {
 public:
  using Action = std::function<void()>;
  using Result = std::function<v8::Local<v8::Value>()>;
  Job(Nan::Callback* callback, Action work, Result result)
      : AsyncWorker(callback, "sfml:Audio"), work_(std::move(work)),
        result_(std::move(result)) {}
  void ExecuteWork() override { work_(); }
  void CompleteWork() override {
    Nan::HandleScope scope;
    v8::Local<v8::Value> args[] = {Nan::Null(), result_()};
    callback->Call(2, args, async_resource);
  }
 private:
  Action work_;
  Result result_;
};

inline void Queue(v8::Local<v8::Value> callback, Job::Action work,
                  Job::Result result) {
  if (!callback->IsFunction()) return Nan::ThrowTypeError("Expected a callback");
  auto cb = std::make_unique<Nan::Callback>(callback.As<v8::Function>());
  auto job = std::make_unique<Job>(cb.get(), std::move(work), std::move(result));
  cb.release();
  Nan::AsyncQueueWorker(job.release());
}

v8::Local<v8::Object> MapBuffer(const std::shared_ptr<BufferData>& data);
void CommitBuffer(const std::shared_ptr<Buffer>& buffer,
                  const std::shared_ptr<BufferData>& data);
void CopySourceSettings(sf::SoundSource& to, const sf::SoundSource& from);
void InstallSourceEffect(const std::shared_ptr<Source>& source);

} // namespace sfmljs::audio
