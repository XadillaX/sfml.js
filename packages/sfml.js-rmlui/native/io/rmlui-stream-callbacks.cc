// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/io/rmlui-stream-callbacks.h"

#include <cmath>
#include <cstring>
#include <limits>
#include <memory>

#include "native/io/rmlui-stream.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

enum Method {
  kLength,
  kTell,
  kSeek,
  kRead,
  kWrite,
  kTruncate,
  kReadReady,
  kWriteReady,
  kClose,
  kEOS,
  kPeek,
  kPushFront,
  kPushBack,
  kPopFront,
  kPopBack,
};

constexpr const char* kMethods[] = {"length",
                                    "tell",
                                    "seek",
                                    "read",
                                    "write",
                                    "truncate",
                                    "isReadReady",
                                    "isWriteReady",
                                    "close",
                                    "isEOS",
                                    "peek",
                                    "pushFront",
                                    "pushBack",
                                    "popFront",
                                    "popBack"};

class StreamCallbackScope final {
 public:
  StreamCallbackScope() {
    ++State().callback_depth;
    ++State().stream_callback_depth;
  }
  ~StreamCallbackScope() {
    --State().stream_callback_depth;
    --State().callback_depth;
  }
};

NAN_METHOD(IgnoreAsyncResult) {}

class CallbackStream final : public Rml::Stream {
 public:
  CallbackStream(v8::Local<v8::Array> methods, const Rml::URL& url, int mode) {
    callbacks_.Reset(v8::Isolate::GetCurrent(), methods);
    callbacks_.SetWeak();
    SetStreamDetails(url, mode);
  }

  void Close() override {
    if (Has(kClose)) {
      Invoke(kClose, 0, nullptr, [](v8::Local<v8::Value>) {});
    }
    Rml::Stream::Close();
  }
  size_t Length() const override { return Count(kLength); }
  size_t Tell() const override { return Count(kTell); }
  bool Seek(StreamOffset offset, int origin) const override {
    v8::Local<v8::Value> args[] = {Nan::New(static_cast<double>(offset)),
                                   Nan::New(origin)};
    return Boolean(kSeek, 2, args);
  }
  bool IsEOS() const override {
    return Has(kEOS) ? Boolean(kEOS) : Rml::Stream::IsEOS();
  }
  bool IsReadReady() override { return Boolean(kReadReady); }
  bool IsWriteReady() override { return Boolean(kWriteReady); }
  bool HasReadError() const override {
    return !State().callback_exception.IsEmpty();
  }
  size_t Read(void* buffer, size_t bytes) const override {
    return ReadBytes(kRead, buffer, bytes);
  }
  size_t Peek(void* buffer, size_t bytes) const override {
    return Has(kPeek) ? ReadBytes(kPeek, buffer, bytes)
                      : Rml::Stream::Peek(buffer, bytes);
  }
  size_t Write(const void* buffer, size_t bytes) override {
    return WriteBytes(kWrite, buffer, bytes);
  }
  size_t Truncate(size_t bytes) override {
    auto arg = Nan::New(static_cast<double>(bytes));
    v8::Local<v8::Value> value = arg;
    return Count(kTruncate, 1, &value);
  }
  size_t PushFront(const void* buffer, size_t bytes) override {
    return WriteBytes(kPushFront, buffer, bytes);
  }
  size_t PushBack(const void* buffer, size_t bytes) override {
    return Has(kPushBack) ? WriteBytes(kPushBack, buffer, bytes)
                          : Rml::Stream::PushBack(buffer, bytes);
  }
  size_t PopFront(size_t bytes) override {
    v8::Local<v8::Value> arg = Nan::New(static_cast<double>(bytes));
    return Count(kPopFront, 1, &arg, bytes);
  }
  size_t PopBack(size_t bytes) override {
    if (!Has(kPopBack)) {
      const size_t length = Length();
      return State().callback_exception.IsEmpty()
                 ? Truncate(length - std::min(bytes, length))
                 : 0;
    }
    v8::Local<v8::Value> arg = Nan::New(static_cast<double>(bytes));
    return Count(kPopBack, 1, &arg, bytes);
  }

 private:
  bool Has(Method method) const {
    if (callbacks_.IsEmpty()) {
      return false;
    }
    return Nan::Get(callbacks_.Get(v8::Isolate::GetCurrent()), method)
        .ToLocalChecked()
        ->IsFunction();
  }

  template <typename Visitor>
  void Invoke(Method method,
              int count,
              v8::Local<v8::Value>* args,
              const Visitor& visitor) const {
    if (!CanInvokeCallback() || callbacks_.IsEmpty()) {
      return;
    }
    Nan::TryCatch caught;
    StreamCallbackScope scope;
    v8::Local<v8::Value> function;
    v8::Local<v8::Value> returned;
    if (!Nan::Get(callbacks_.Get(v8::Isolate::GetCurrent()), method)
             .ToLocal(&function)) {
      // Captured array entries have no accessors.
    } else if (!function->IsFunction()) {
      Nan::ThrowTypeError("Stream callback is not implemented");
    } else {
      RecordDiagnosticCallback(DiagnosticCallback::kStream);
      if (function.As<v8::Function>()
              ->Call(Nan::GetCurrentContext(), Nan::Undefined(), count, args)
              .ToLocal(&returned)) {
        if (returned->IsPromise()) {
          auto ignore = Nan::GetFunction(
                            Nan::New<v8::FunctionTemplate>(IgnoreAsyncResult))
                            .ToLocalChecked();
          v8::Local<v8::Promise> ignored;
          if (returned.As<v8::Promise>()
                  ->Catch(Nan::GetCurrentContext(), ignore)
                  .ToLocal(&ignored)) {
            Nan::ThrowTypeError("Stream callbacks must be synchronous");
          }
        } else {
          visitor(returned);
        }
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }

  static bool ReadCount(v8::Local<v8::Value> input,
                        size_t limit,
                        size_t* output) {
    if (!input->IsNumber()) {
      Nan::ThrowTypeError("Stream callback must return a byte count");
      return false;
    }
    const double count = Nan::To<double>(input).FromJust();
    if (!std::isfinite(count) || count < 0 || std::floor(count) != count ||
        count > static_cast<double>(limit)) {
      Nan::ThrowRangeError("Stream callback returned an invalid byte count");
      return false;
    }
    *output = static_cast<size_t>(count);
    return true;
  }

  size_t Count(Method method,
               int count = 0,
               v8::Local<v8::Value>* args = nullptr,
               size_t limit = 9007199254740991ULL) const {
    Nan::HandleScope handles;
    size_t result = 0;
    Invoke(method, count, args, [&](v8::Local<v8::Value> returned) {
      ReadCount(returned, limit, &result);
    });
    return result;
  }

  bool Boolean(Method method,
               int count = 0,
               v8::Local<v8::Value>* args = nullptr) const {
    Nan::HandleScope handles;
    bool result = false;
    Invoke(method, count, args, [&](v8::Local<v8::Value> returned) {
      if (!returned->IsBoolean()) {
        Nan::ThrowTypeError("Stream callback must return a boolean");
      } else {
        result = returned->IsTrue();
      }
    });
    return result;
  }

  size_t ReadBytes(Method method, void* output, size_t bytes) const {
    Nan::HandleScope handles;
    const auto buffer = v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), bytes);
    const auto view = v8::Uint8Array::New(buffer, 0, bytes);
    v8::Local<v8::Value> args[] = {view, Nan::New(static_cast<double>(bytes))};
    size_t result = 0;
    Invoke(method, 2, args, [&](v8::Local<v8::Value> returned) {
      if (buffer->WasDetached() || view->ByteLength() != bytes) {
        Nan::ThrowTypeError("Stream callback detached or resized its buffer");
      } else if (ReadCount(returned, bytes, &result) && result) {
        std::memcpy(output, buffer->GetBackingStore()->Data(), result);
      }
    });
    return State().callback_exception.IsEmpty() ? result : 0;
  }

  size_t WriteBytes(Method method, const void* input, size_t bytes) const {
    Nan::HandleScope handles;
    const auto buffer = v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), bytes);
    if (bytes) {
      std::memcpy(buffer->GetBackingStore()->Data(), input, bytes);
    }
    v8::Local<v8::Value> args[] = {v8::Uint8Array::New(buffer, 0, bytes),
                                   Nan::New(static_cast<double>(bytes))};
    return Count(method, 2, args, bytes);
  }

  v8::Global<v8::Array> callbacks_;
};

}  // namespace

v8::MaybeLocal<v8::Array> ReadStreamCallbacks(v8::Local<v8::Value> input) {
  if (!input->IsObject() || input->IsArray()) {
    Nan::ThrowTypeError("Expected synchronous Stream callbacks");
    return {};
  }
  const auto result = Nan::New<v8::Array>(std::size(kMethods));
  for (uint32_t i = 0; i < std::size(kMethods); ++i) {
    v8::Local<v8::Value> method;
    if (!Nan::Get(input.As<v8::Object>(),
                  Nan::New(kMethods[i]).ToLocalChecked())
             .ToLocal(&method)) {
      return {};
    }
    if (!method->IsFunction() && (i <= kWriteReady || !method->IsUndefined())) {
      Nan::ThrowTypeError(
          (Rml::String("Expected Stream callback: ") + kMethods[i]).c_str());
      return {};
    }
    result->CreateDataProperty(Nan::GetCurrentContext(), i, method).FromJust();
  }
  return result;
}

std::unique_ptr<Rml::Stream> MakeCallbackStream(v8::Local<v8::Array> callbacks,
                                                const Rml::URL& url,
                                                int mode) {
  return std::make_unique<CallbackStream>(callbacks, url, mode);
}

}  // namespace sfmlrmlui
