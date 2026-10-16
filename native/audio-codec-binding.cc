#include "audio-stream.h"

namespace sfmljs::audio {

struct ReaderInfo {
  sf::SoundFileReader::Info info;
};
using ReaderInfoHandle = SharedHandle<ReaderInfo>;

v8::Local<v8::Object> MapReaderInfo(const std::shared_ptr<ReaderInfo>& owner) {
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", ReaderInfoHandle::Create(owner));
  Set(result, "info", NumericFields()
      .Add("sampleCount", owner->info.sampleCount)
      .Add("channelCount", owner->info.channelCount)
      .Add("sampleRate", owner->info.sampleRate).Map(owner));
  auto map = std::make_shared<std::vector<sf::SoundChannel>>(owner->info.channelMap);
  Set(result, "channelMap", MapChannels(map, *map));
  return result;
}

NAN_METHOD(CreateAudioReaderInfo) {
  info.GetReturnValue().Set(MapReaderInfo(std::make_shared<ReaderInfo>()));
}
NAN_METHOD(SetAudioReaderChannels) {
  auto* handle = ReaderInfoHandle::From(info[0]);
  std::vector<sf::SoundChannel> map;
  if (!handle || !Channels(info[1], map)) return;
  handle->owner()->info.channelMap = map;
  auto channels = std::make_shared<std::vector<sf::SoundChannel>>(std::move(map));
  info.GetReturnValue().Set(MapChannels(channels, *channels));
}

struct Reader {
  std::shared_ptr<StreamClient> stream;
  std::unique_ptr<sf::SoundFileReader> reader;
};
using ReaderHandle = SharedHandle<Reader>;

NAN_METHOD(CreateAudioReader) {
  auto reader = std::make_shared<Reader>();
  Bytes bytes;
  std::string path;
  std::shared_ptr<StreamClient> stream;
  if (info[0]->IsString()) {
    if (!String(info[0], path)) return;
  } else if (auto* handle = StreamClientHandle::TryFrom(info[0])) {
    stream = handle->owner();
  } else if (!ReadBytes(info[0], bytes)) return;
  auto work = [reader, bytes, path, stream] {
    if (stream) reader->reader = sf::SoundFileFactory::createReaderFromStream(*stream);
    else if (bytes.backing) {
      reader->reader = sf::SoundFileFactory::createReaderFromMemory(bytes.data, bytes.size);
    } else reader->reader = sf::SoundFileFactory::createReaderFromFilename(Path(path));
  };
  auto result = [reader]() -> v8::Local<v8::Value> {
    if (!reader->reader) return Nan::Undefined();
    return ReaderHandle::Create(reader);
  };
  if (stream) QueueThread(info[1], work, result, [stream] { stream->Cancel(); });
  else Queue(info[1], work, result);
}

NAN_METHOD(OpenAudioReader) {
  auto* handle = ReaderHandle::From(info[0]);
  auto* input = StreamClientHandle::From(info[1]);
  if (!handle || !input) return;
  auto reader = handle->owner();
  if (!reader->reader) return Nan::ThrowError("Reader is closed");
  auto stream = input->owner();
  auto result = std::make_shared<std::optional<sf::SoundFileReader::Info>>();
  QueueThread(info[2], [reader, stream, result] {
    *result = reader->reader->open(*stream);
  }, [reader, stream, result]() -> v8::Local<v8::Value> {
    if (!*result) return Nan::Undefined();
    reader->stream = stream;
    auto value = std::make_shared<ReaderInfo>();
    value->info = std::move(**result);
    return MapReaderInfo(value);
  }, [stream] { stream->Cancel(); });
}

NAN_METHOD(ReadAudioReader) {
  auto* handle = ReaderHandle::From(info[0]);
  Bytes bytes;
  if (!handle || !ReadBytes(info[1], bytes, true)) return;
  auto reader = handle->owner();
  if (!reader->reader || !reader->stream) return Nan::ThrowError("Reader is not open");
  auto count = std::make_shared<std::uint64_t>();
  QueueThread(info[2], [reader, bytes, count] {
    *count = reader->reader->read(static_cast<std::int16_t*>(bytes.data), bytes.size / 2);
  }, [count]() -> v8::Local<v8::Value> {
    return v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(), *count);
  }, [stream = reader->stream] { stream->Cancel(); });
}

NAN_METHOD(SeekAudioReader) {
  auto* handle = ReaderHandle::From(info[0]);
  if (!handle) return;
  bool lossless{};
  const auto offset = info[1]->IsBigInt() ? info[1].As<v8::BigInt>()->Uint64Value(&lossless) : 0;
  if (!lossless) return Nan::ThrowRangeError("Expected uint64 sample offset");
  auto reader = handle->owner();
  if (!reader->reader || !reader->stream) return Nan::ThrowError("Reader is not open");
  QueueThread(info[2], [reader, offset] { reader->reader->seek(offset); },
      []() -> v8::Local<v8::Value> { return Nan::Undefined(); },
      [stream = reader->stream] { stream->Cancel(); });
}

NAN_METHOD(CloseAudioReader) {
  auto* handle = ReaderHandle::From(info[0]);
  if (!handle) return;
  auto reader = handle->owner();
  Queue(info[1], [reader] {
    reader->reader.reset();
    if (reader->stream) reader->stream->Cancel();
    reader->stream.reset();
  }, []() -> v8::Local<v8::Value> { return Nan::Undefined(); });
}

struct Writer { std::unique_ptr<sf::SoundFileWriter> writer; };
using WriterHandle = SharedHandle<Writer>;
NAN_METHOD(CreateAudioWriter) {
  std::string path;
  if (!String(info[0], path)) return;
  auto writer = std::make_shared<Writer>();
  writer->writer = sf::SoundFileFactory::createWriterFromFilename(Path(path));
  if (writer->writer) info.GetReturnValue().Set(WriterHandle::Create(writer));
}
NAN_METHOD(OpenAudioWriter) {
  auto* handle = WriterHandle::From(info[0]);
  std::string path;
  unsigned rate, count;
  std::vector<sf::SoundChannel> map;
  if (!handle || !String(info[1], path) || !Unsigned(info[2], rate) ||
      !Unsigned(info[3], count) || !Channels(info[4], map)) return;
  auto writer = handle->owner();
  if (!writer->writer) return Nan::ThrowError("Writer is closed");
  auto result = std::make_shared<bool>();
  Queue(info[5], [writer, path, rate, count, map, result] {
    *result = writer->writer->open(Path(path), rate, count, map);
  }, [result]() -> v8::Local<v8::Value> { return Nan::New(*result); });
}
NAN_METHOD(WriteAudioWriter) {
  auto* handle = WriterHandle::From(info[0]);
  Bytes samples;
  if (!handle || !ReadBytes(info[1], samples, true)) return;
  auto writer = handle->owner();
  if (!writer->writer) return Nan::ThrowError("Writer is closed");
  Queue(info[2], [writer, samples] {
    writer->writer->write(static_cast<std::int16_t*>(samples.data), samples.size / 2);
  }, []() -> v8::Local<v8::Value> { return Nan::Undefined(); });
}
NAN_METHOD(CloseAudioWriter) {
  auto* handle = WriterHandle::From(info[0]);
  if (!handle) return;
  auto writer = handle->owner();
  Queue(info[1], [writer] { writer->writer.reset(); },
        []() -> v8::Local<v8::Value> { return Nan::Undefined(); });
}

struct FileMetadata {
  Metadata value;
  std::vector<sf::SoundChannel> channels;
  void UpdateTime() {
    value.timeOffset = sf::seconds(static_cast<float>(value.offset) /
        static_cast<float>(value.channels) / static_cast<float>(value.rate)).asMicroseconds();
  }
};
using FileMetadataHandle = SharedHandle<FileMetadata>;
NAN_METHOD(CreateAudioFileMetadata) {
  auto* infoHandle = ReaderInfoHandle::From(info[0]);
  if (!infoHandle) return;
  const auto& metadata = infoHandle->owner()->info;
  if (!metadata.sampleRate || !metadata.channelCount ||
      metadata.channelCount != metadata.channelMap.size()) {
    return Nan::ThrowRangeError("Invalid codec audio format");
  }
  auto file = std::make_shared<FileMetadata>();
  file->value.count = metadata.sampleCount;
  file->value.channels = metadata.channelCount;
  file->value.rate = metadata.sampleRate;
  file->channels = metadata.channelMap;
  file->value.duration = sf::seconds(static_cast<float>(metadata.sampleCount) /
      static_cast<float>(metadata.channelCount) / static_cast<float>(metadata.sampleRate)).asMicroseconds();
  auto result = Nan::New<v8::Object>();
  Set(result, "handle", FileMetadataHandle::Create(file));
  Set(result, "buffer", MapShared(info.GetIsolate(), file, &file->value, sizeof(file->value)));
  Set(result, "channelMap", MapChannels(file, file->channels));
  info.GetReturnValue().Set(result);
}
NAN_METHOD(UpdateAudioFileMetadata) {
  auto* handle = FileMetadataHandle::From(info[0]);
  unsigned operation;
  if (!handle || !Unsigned(info[1], operation)) return;
  auto& file = *handle->owner();
  bool lossless{};
  const auto offset = info[2]->IsBigInt() ? info[2].As<v8::BigInt>()->Uint64Value(&lossless) : 0;
  if (!lossless && operation != 2 && operation != 3) {
    return Nan::ThrowRangeError("Expected uint64 sample count");
  }
  if (operation == 0) { // read completed
    file.value.offset += offset;
    file.value.transferred = offset;
  } else if (operation == 1) { // prepare sample seek
    file.value.transferred = std::min(offset / file.value.channels * file.value.channels, file.value.count);
  } else if (operation == 2) { // prepare Time seek, preserving SFML float arithmetic
    if (!info[2]->IsBigInt()) return Nan::ThrowTypeError("Expected microseconds");
    const auto time = sf::microseconds(info[2].As<v8::BigInt>()->Int64Value());
    file.value.transferred = std::min(static_cast<std::uint64_t>(
        time.asSeconds() * static_cast<float>(file.value.rate)) * file.value.channels, file.value.count);
  } else if (operation == 3) file.value.offset = file.value.transferred;
  else return Nan::ThrowRangeError("Unknown metadata operation");
  file.UpdateTime();
}

NAN_METHOD(AllocateAudioSamples) {
  unsigned count;
  if (!Unsigned(info[0], count)) return;
  if (static_cast<std::uint64_t>(count) * 2 > node::Buffer::kMaxLength) {
    return Nan::ThrowRangeError("Audio sample buffer is too large");
  }
  auto data = std::make_shared<std::vector<std::int16_t>>(count);
  info.GetReturnValue().Set(count ? MapShared(info.GetIsolate(), data, data->data(), count * 2)
      : v8::ArrayBuffer::New(info.GetIsolate(), 0));
}

} // namespace sfmljs::audio

NAN_MODULE_INIT(InitializeAudioCodecs) {
  using namespace sfmljs::audio;
  sfmljs::SetMethod<CreateAudioReaderInfo>(target, "createAudioReaderInfo");
  sfmljs::SetMethod<SetAudioReaderChannels>(target, "setAudioReaderChannels");
  sfmljs::SetMethod<CreateAudioReader>(target, "createAudioReader");
  sfmljs::SetMethod<OpenAudioReader>(target, "openAudioReader");
  sfmljs::SetMethod<ReadAudioReader>(target, "readAudioReader");
  sfmljs::SetMethod<SeekAudioReader>(target, "seekAudioReader");
  sfmljs::SetMethod<CloseAudioReader>(target, "closeAudioReader");
  sfmljs::SetMethod<CreateAudioWriter>(target, "createAudioWriter");
  sfmljs::SetMethod<OpenAudioWriter>(target, "openAudioWriter");
  sfmljs::SetMethod<WriteAudioWriter>(target, "writeAudioWriter");
  sfmljs::SetMethod<CloseAudioWriter>(target, "closeAudioWriter");
  sfmljs::SetMethod<CreateAudioFileMetadata>(target, "createAudioFileMetadata");
  sfmljs::SetMethod<UpdateAudioFileMetadata>(target, "updateAudioFileMetadata");
  sfmljs::SetMethod<AllocateAudioSamples>(target, "allocateAudioSamples");
}
