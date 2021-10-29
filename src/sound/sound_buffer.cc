#include "sound_buffer.h"
#include "../resizable_buffer.h"
#include "../workers/save_to_file_worker.h"

namespace node_sfml {
namespace sound {

using std::string;
using v8::Array;
using v8::ArrayBuffer;
using v8::BigInt;
using v8::Function;
using v8::FunctionTemplate;
using v8::Int16Array;
using v8::Isolate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;
using v8::Value;

namespace {
Nan::Persistent<Function> constructor;
}  // namespace

NAN_MODULE_INIT(SoundBuffer::Init) {
  Local<String> name = Nan::New("SoundBuffer").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "duplicateSamples", DuplicateSamples);
  Nan::SetPrototypeMethod(tpl, "loadFromSamples", LoadFromSamples);
  Nan::SetPrototypeMethod(tpl, "loadFromMemory", LoadFromMemory);

  Nan::SetPrototypeMethod(tpl, "getSampleCount", GetSampleCount);
  Nan::SetPrototypeMethod(tpl, "getSampleRate", GetSampleRate);
  Nan::SetPrototypeMethod(tpl, "getChannelCount", GetChannelCount);
  Nan::SetPrototypeMethod(tpl, "getDuration", GetDuration);
  Nan::SetPrototypeMethod(tpl, "saveToFile", SaveToFile);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
}

NAN_METHOD(SoundBuffer::New) {
  SoundBuffer* sb = nullptr;
  if (info.Length() == 0 || info[0]->IsNullOrUndefined()) {
    sb = new SoundBuffer();
  } else if (info.Length() == 1) {
    if (node::Buffer::HasInstance(info[0])) {
      char* buf = node::Buffer::Data(info[0]);
      int len = node::Buffer::Length(info[0]);
      sb = new SoundBuffer(buf, len);
    }

    // TODO(XadillaX): SoundBuffer
  }

  if (!sb) {
    Nan::ThrowError("Cannot create SoundBuffer instance.");
    return;
  }

  sb->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(SoundBuffer::LoadFromMemory) {
  SoundBuffer* sb = Nan::ObjectWrap::Unwrap<SoundBuffer>(info.Holder());
  if (sb->_saving) {
    Nan::ThrowError("SoundBuffer is saving to file.");
  }

  char* buf = node::Buffer::Data(info[0]);
  int len = node::Buffer::Length(info[0]);

  info.GetReturnValue().Set(sb->LoadFromMemory(buf, len));
}

NAN_METHOD(SoundBuffer::LoadFromSamples) {
  SoundBuffer* sb = Nan::ObjectWrap::Unwrap<SoundBuffer>(info.Holder());
  if (sb->_saving) {
    Nan::ThrowError("SoundBuffer is saving to file.");
    return;
  }

  ResizableBuffer<sf::Int16> buff;
  if (info[0]->IsInt16Array()) {
    Local<Int16Array> int16_array = info[0].As<Int16Array>();
    size_t array_length = int16_array->Length();
    buff.Realloc(array_length);
    sf::Int16* ptr = buff.buffer();

    Nan::TryCatch try_catch;
    MaybeLocal<Value> maybe;
    Local<Value> val;
    for (size_t i = 0; i < array_length; i++) {
      maybe = Nan::Get(int16_array, i);
      if (try_catch.HasCaught()) {
        try_catch.ReThrow();
        return;
      }

      val = maybe.ToLocalChecked();
      ptr[i] = static_cast<sf::Int16>(Nan::To<sf::Int32>(val).FromJust());
    }
  } else {
    Local<Array> arr = info[0].As<Array>();
    size_t array_length = arr->Length();
    buff.Realloc(array_length);
    sf::Int16* ptr = buff.buffer();

    Nan::TryCatch try_catch;
    MaybeLocal<Value> maybe;
    Local<Value> val;
    for (size_t i = 0; i < array_length; i++) {
      maybe = Nan::Get(arr, i);
      if (try_catch.HasCaught()) {
        try_catch.ReThrow();
        return;
      }

      val = maybe.ToLocalChecked();
      if (!val->IsInt32()) {
        Nan::ThrowTypeError("samples should be numbers.");
        try_catch.ReThrow();
        return;
      }

      sf::Int32 sample = Nan::To<sf::Int32>(val).FromJust();
      if (sample < -32768 || sample > 32767) {
        Nan::ThrowRangeError("samples should be Int16.");
        try_catch.ReThrow();
        return;
      }

      ptr[i] = static_cast<sf::Int16>(sample);
    }
  }

  sf::Uint32 channel_count = Nan::To<sf::Uint32>(info[1]).FromJust();
  sf::Uint32 sample_rate = Nan::To<sf::Uint32>(info[2]).FromJust();

  info.GetReturnValue().Set(sb->_sound_buffer.loadFromSamples(
      buff.buffer(), buff.length(), channel_count, sample_rate));
}

NAN_METHOD(SoundBuffer::DuplicateSamples) {
  SoundBuffer* sb = Nan::ObjectWrap::Unwrap<SoundBuffer>(info.Holder());
  const sf::Int16* samples = sb->_sound_buffer.getSamples();
  sf::Uint64 sample_count = sb->_sound_buffer.getSampleCount();

  ResizableBuffer<sf::Int16> resizable(sample_count);
  memcpy(resizable.buffer(), samples, resizable.byte_length());
  ReleasedResizableBuffer<sf::Int16> rrb = resizable.Release();

  Local<ArrayBuffer> ab = ArrayBuffer::New(
      info.GetIsolate(),
      ArrayBuffer::NewBackingStore(
          rrb.buffer,
          rrb.byte_length,
          [](void* buff, size_t length, void* info) { free(buff); },
          nullptr));

  Local<Int16Array> i16a = Int16Array::New(ab, 0, rrb.length);
  info.GetReturnValue().Set(i16a);
}

NAN_METHOD(SoundBuffer::GetSampleCount) {
  SoundBuffer* sb = Nan::ObjectWrap::Unwrap<SoundBuffer>(info.Holder());
  info.GetReturnValue().Set(
      static_cast<sf::Uint32>(sb->_sound_buffer.getSampleCount()));
}

NAN_METHOD(SoundBuffer::GetSampleRate) {
  SoundBuffer* sb = Nan::ObjectWrap::Unwrap<SoundBuffer>(info.Holder());
  info.GetReturnValue().Set(sb->_sound_buffer.getSampleRate());
}

NAN_METHOD(SoundBuffer::GetChannelCount) {
  SoundBuffer* sb = Nan::ObjectWrap::Unwrap<SoundBuffer>(info.Holder());
  info.GetReturnValue().Set(sb->_sound_buffer.getChannelCount());
}

NAN_METHOD(SoundBuffer::GetDuration) {
  SoundBuffer* sb = Nan::ObjectWrap::Unwrap<SoundBuffer>(info.Holder());
  info.GetReturnValue().Set(sb->_sound_buffer.getDuration().asMilliseconds());
}

// TODO(XadillaX): Use Node.js fs API + Buffer in pure JavaScript side.
NAN_METHOD(SoundBuffer::SaveToFile) {
  Local<String> v8_filename = info[0].As<String>();
  Nan::Utf8String utf8_filename(v8_filename);
  Nan::Callback* callback = new Nan::Callback(info[1].As<Function>());

  Nan::ObjectWrap::Unwrap<SoundBuffer>(info.Holder())->SetSaving(true);
  save_to_file_worker::SaveToFileWorker<SoundBuffer, void>* worker =
      new save_to_file_worker::SaveToFileWorker<SoundBuffer, void>(
          info.Holder(),
          *utf8_filename,
          [](void* target, const string& filename, void* _) {
            SoundBuffer* sb = reinterpret_cast<SoundBuffer*>(target);
            return sb->sound_buffer().saveToFile(filename);
          },
          nullptr,
          callback);
  Nan::AsyncQueueWorker(worker);
}

inline bool SoundBuffer::LoadFromMemory(const char* buff, size_t len) {
  return _sound_buffer.loadFromMemory(buff, len);
}

SoundBuffer::SoundBuffer() : _sound_buffer() {}
SoundBuffer::SoundBuffer(const char* buff, size_t len) : SoundBuffer() {
  LoadFromMemory(buff, len);
}
SoundBuffer::~SoundBuffer() {}

}  // namespace sound
}  // namespace node_sfml
