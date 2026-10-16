#include "audio-stream.h"

namespace sfmljs::audio {

struct InputFile {
  Bytes bytes;
  std::shared_ptr<StreamClient> stream;
  sf::InputSoundFile file;
  bool open{};
  Metadata metadata;
  std::vector<sf::SoundChannel> channelMap;
  void Update() {
    metadata.count = file.getSampleCount();
    metadata.offset = file.getSampleOffset();
    metadata.duration = file.getDuration().asMicroseconds();
    metadata.timeOffset = file.getTimeOffset().asMicroseconds();
    metadata.rate = file.getSampleRate();
    metadata.channels = file.getChannelCount();
  }
};

struct Input {
  std::shared_ptr<InputFile> current = std::make_shared<InputFile>();
};
using InputHandle = SharedHandle<Input>;

void QueueInput(v8::Local<v8::Value> callback, const std::shared_ptr<InputFile>& file,
                 Job::Action work, Job::Result result) {
  if (file->stream) {
    QueueThread(callback, std::move(work), std::move(result),
                [stream = file->stream] { stream->Cancel(); });
  } else Queue(callback, std::move(work), std::move(result));
}

v8::Local<v8::Object> MapInput(const std::shared_ptr<InputFile>& file) {
  auto result = Nan::New<v8::Object>();
  Set(result, "buffer", MapShared(v8::Isolate::GetCurrent(), file,
                                 &file->metadata, sizeof(file->metadata)));
  Set(result, "channelMap", MapChannels(file, file->channelMap));
  return result;
}

NAN_METHOD(CreateAudioInput) {
  auto input = std::make_shared<Input>();
  auto result = MapInput(input->current);
  Set(result, "handle", InputHandle::Create(input));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(OpenAudioInput) {
  auto* handle = InputHandle::From(info[0]);
  if (!handle) return;
  auto input = handle->owner();
  auto next = std::make_shared<InputFile>();
  std::string path;
  if (info[1]->IsString()) {
    if (!String(info[1], path)) return;
  } else if (auto* stream = StreamClientHandle::TryFrom(info[1])) {
    next->stream = stream->owner();
  } else if (!ReadBytes(info[1], next->bytes)) return;
  auto ok = std::make_shared<bool>();
  QueueInput(info[2], next, [next, path, ok] {
    *ok = next->stream ? next->file.openFromStream(*next->stream)
        : next->bytes.backing
        ? next->file.openFromMemory(next->bytes.data, next->bytes.size)
        : next->file.openFromFile(Path(path));
  }, [input, next, ok]() -> v8::Local<v8::Value> {
    if (!*ok) return Nan::Undefined();
    next->open = true;
    next->Update();
    next->channelMap = next->file.getChannelMap();
    input->current = next;
    return MapInput(next);
  });
}

NAN_METHOD(ReadAudioInput) {
  auto* handle = InputHandle::From(info[0]);
  Bytes bytes;
  if (!handle || !ReadBytes(info[1], bytes, true)) return;
  auto file = handle->owner()->current;
  auto count = std::make_shared<std::uint64_t>();
  QueueInput(info[2], file, [file, bytes, count] {
    *count = file->open
        ? file->file.read(static_cast<std::int16_t*>(bytes.data), bytes.size / 2)
        : 0;
  }, [file, count]() -> v8::Local<v8::Value> {
    if (file->open) file->Update();
    file->metadata.transferred = *count;
    return Nan::Undefined();
  });
}

NAN_METHOD(SeekAudioInput) {
  auto* handle = InputHandle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsBigInt() || !info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected an offset and time flag");
  }
  const bool time = info[2]->IsTrue();
  bool lossless{};
  const auto signedOffset = info[1].As<v8::BigInt>()->Int64Value();
  const auto offset = time
      ? static_cast<std::uint64_t>(info[1].As<v8::BigInt>()->Int64Value(&lossless))
      : info[1].As<v8::BigInt>()->Uint64Value(&lossless);
  if (!lossless) return Nan::ThrowRangeError("Offset is outside its scalar range");
  auto file = handle->owner()->current;
  QueueInput(info[3], file, [file, time, offset, signedOffset] {
    if (!file->open) return;
    if (time) file->file.seek(sf::microseconds(signedOffset));
    else file->file.seek(offset);
  }, [file]() -> v8::Local<v8::Value> {
    if (file->open) file->Update();
    return Nan::Undefined();
  });
}

NAN_METHOD(CloseAudioInput) {
  auto* handle = InputHandle::From(info[0]);
  if (!handle) return;
  // Old views own old metadata; the file closes before releasing its bytes.
  auto input = handle->owner();
  auto old = input->current;
  QueueInput(info[1], old, [old] {
    old->file.close();
    if (old->stream) old->stream->Cancel();
    old->stream.reset();
  },
      [input]() -> v8::Local<v8::Value> {
        input->current = std::make_shared<InputFile>();
        return MapInput(input->current);
      });
}

struct Output {
  sf::OutputSoundFile file;
  bool open{};
};
using OutputHandle = SharedHandle<Output>;

NAN_METHOD(CreateAudioOutput) {
  info.GetReturnValue().Set(OutputHandle::Create(std::make_shared<Output>()));
}

NAN_METHOD(OpenAudioOutput) {
  auto* handle = OutputHandle::From(info[0]);
  std::string path;
  unsigned rate, count;
  std::vector<sf::SoundChannel> channels;
  if (!handle || !String(info[1], path) || !Unsigned(info[2], rate) ||
      !Unsigned(info[3], count) || !Channels(info[4], channels)) return;
  auto output = handle->owner();
  auto ok = std::make_shared<bool>();
  Queue(info[5], [output, path, rate, count, channels, ok] {
    *ok = output->file.openFromFile(Path(path), rate, count, channels);
    output->open = *ok;
  }, [ok]() -> v8::Local<v8::Value> { return Nan::New(*ok); });
}

NAN_METHOD(WriteAudioOutput) {
  auto* handle = OutputHandle::From(info[0]);
  Bytes bytes;
  if (!handle || !ReadBytes(info[1], bytes, true)) return;
  auto output = handle->owner();
  Queue(info[2], [output, bytes] {
    if (!output->open) throw std::runtime_error("Audio output file is not open");
    output->file.write(static_cast<std::int16_t*>(bytes.data), bytes.size / 2);
  }, []() -> v8::Local<v8::Value> { return Nan::Undefined(); });
}

NAN_METHOD(CloseAudioOutput) {
  auto* handle = OutputHandle::From(info[0]);
  if (!handle) return;
  auto output = handle->owner();
  Queue(info[1], [output] { output->file.close(); output->open = false; },
      []() -> v8::Local<v8::Value> { return Nan::Undefined(); });
}

} // namespace sfmljs::audio

NAN_MODULE_INIT(InitializeAudioFiles) {
  using namespace sfmljs::audio;
  sfmljs::SetMethod<CreateAudioInput>(target, "createAudioInput");
  sfmljs::SetMethod<OpenAudioInput>(target, "openAudioInput");
  sfmljs::SetMethod<ReadAudioInput>(target, "readAudioInput");
  sfmljs::SetMethod<SeekAudioInput>(target, "seekAudioInput");
  sfmljs::SetMethod<CloseAudioInput>(target, "closeAudioInput");
  sfmljs::SetMethod<CreateAudioOutput>(target, "createAudioOutput");
  sfmljs::SetMethod<OpenAudioOutput>(target, "openAudioOutput");
  sfmljs::SetMethod<WriteAudioOutput>(target, "writeAudioOutput");
  sfmljs::SetMethod<CloseAudioOutput>(target, "closeAudioOutput");
}
