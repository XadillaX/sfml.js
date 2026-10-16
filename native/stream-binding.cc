#include "image-state.h"
#include "exception-boundary.h"

#include <SFML/System/InputStream.hpp>

#include <condition_variable>
#include <atomic>
#include <cstring>
#include <mutex>
#include <thread>
#include <vector>

namespace {

enum class Operation { Read, Seek, Tell, Size };

struct Request {
  Operation operation;
  std::size_t position{};
  std::vector<std::uint8_t> bytes;
  std::vector<std::uint8_t> snapshot;
  std::mutex mutex;
  std::condition_variable ready;
  bool complete{};
  bool dispatched{};
  std::optional<std::size_t> result;
  std::string error;
};

using RequestHandle = sfmljs::SharedHandle<Request>;

NAN_METHOD(CompleteRequest) {
  auto* handle = RequestHandle::From(info.Data());
  if (!handle) return;
  auto request = handle->owner();
  std::lock_guard lock(request->mutex);
  if (request->complete) return;
  sfmljs::GuardExceptions([&] {
    if (!info[0]->IsNullOrUndefined()) {
      Nan::Utf8String error(info[0]);
      request->error.assign(*error, error.length());
      if (request->error.empty()) request->error = "InputStream operation failed";
    } else if (!info[1]->IsUndefined()) {
      bool lossless = false;
      const auto value = info[1]->IsBigInt()
          ? info[1].As<v8::BigInt>()->Uint64Value(&lossless) : 0;
      if (!lossless || value > std::numeric_limits<std::size_t>::max() ||
          (request->operation == Operation::Read &&
           value > request->bytes.size())) {
        request->error = "Stream result must be a non-negative bigint within range";
      } else {
        request->result = static_cast<std::size_t>(value);
        if (request->operation == Operation::Read) {
          request->snapshot.assign(request->bytes.begin(),
              request->bytes.begin() + value);
        }
      }
    }
  }, [&](const char* message) {
    request->result.reset();
    request->error = message;
  });
  request->complete = true;
  request->ready.notify_one();
}

// Dedicated threads leave libuv's pool available to Promise-based file reads.
// Only OnAsync touches V8; the decoder waits on one request at a time.
class StreamLoader final : public sf::InputStream {
 public:
  StreamLoader(std::shared_ptr<sfmljs::ImageState> state,
               v8::Local<v8::Function> dispatch,
               v8::Local<v8::Function> callback)
      : state_(std::move(state)), dispatch_(dispatch), callback_(callback),
        resource_("sfml:ImageStream") {}

  void Start() {
    const int status = uv_async_init(node::GetCurrentEventLoop(
        v8::Isolate::GetCurrent()), &async_, OnAsync);
    if (status != 0) throw std::runtime_error(uv_strerror(status));
    async_.data = this;
    sfmljs::GuardExceptions([&] {
      cleanup_ = node::AddEnvironmentCleanupHook(v8::Isolate::GetCurrent(),
          [](void* data, void (*done)(void*), void* argument) {
            auto* self = static_cast<StreamLoader*>(data);
            self->cleanupDone_ = done;
            self->cleanupArgument_ = argument;
            self->cancelled_ = true;
            std::shared_ptr<Request> request;
            {
              std::lock_guard lock(self->mutex_);
              request = self->request_;
            }
            if (request) {
              std::lock_guard lock(request->mutex);
              request->complete = true;
              request->ready.notify_one();
            }
          }, this);
      thread_ = std::thread([this] {
        try {
          image_ = std::make_shared<sf::Image>();
          ok_ = image_->loadFromStream(*this);
        } catch (const std::exception& error) {
          error_ = error.what();
        } catch (...) {
          error_ = "Unknown SFML stream error";
        }
        {
          std::lock_guard lock(mutex_);
          finished_ = true;
        }
        uv_async_send(&async_);
      });
    }, [&](const char* message) {
      error_ = message;
      finished_ = true;
      uv_async_send(&async_);
    });
  }

  std::optional<std::size_t> read(void* data, std::size_t size) override {
    auto request = Exchange(Operation::Read, size);
    if (request->result && *request->result) {
      std::memcpy(data, request->snapshot.data(), *request->result);
    }
    return request->result;
  }
  std::optional<std::size_t> seek(std::size_t position) override {
    return Exchange(Operation::Seek, position)->result;
  }
  std::optional<std::size_t> tell() override {
    return Exchange(Operation::Tell)->result;
  }
  std::optional<std::size_t> getSize() override {
    return Exchange(Operation::Size)->result;
  }

 private:
  std::shared_ptr<Request> Exchange(Operation operation, std::size_t value = 0) {
    if (cancelled_) throw std::runtime_error("Stream loading cancelled");
    auto request = std::make_shared<Request>();
    request->operation = operation;
    request->position = value;
    if (!error_.empty()) return request;
    if (operation == Operation::Read) {
      if (value > node::Buffer::kMaxLength) {
        throw std::length_error("Stream read exceeds the byte buffer limit");
      }
      request->bytes.resize(value);
    }
    {
      std::lock_guard lock(mutex_);
      if (cancelled_) throw std::runtime_error("Stream loading cancelled");
      request_ = request;
    }
    uv_async_send(&async_);
    std::unique_lock lock(request->mutex);
    request->ready.wait(lock, [&] { return request->complete; });
    if (cancelled_) throw std::runtime_error("Stream loading cancelled");
    if (!request->error.empty()) error_ = request->error;
    return request;
  }

  static void OnAsync(uv_async_t* async) {
    auto* self = static_cast<StreamLoader*>(async->data);
    std::shared_ptr<Request> request;
    bool finished;
    {
      std::lock_guard lock(self->mutex_);
      finished = self->finished_;
      request = self->request_;
    }
    if (finished) {
      if (self->thread_.joinable()) self->thread_.join();
      if (!self->cleanupDone_) {
        if (self->cleanup_) {
          node::RemoveEnvironmentCleanupHook(std::move(self->cleanup_));
        }
        Nan::HandleScope scope;
        self->Finish();
      }
      uv_close(reinterpret_cast<uv_handle_t*>(async), [](uv_handle_t* handle) {
        auto* loader = static_cast<StreamLoader*>(handle->data);
        const auto done = loader->cleanupDone_;
        const auto argument = loader->cleanupArgument_;
        delete loader;
        if (done) done(argument);
      });
      return;
    }
    if (!request || request->dispatched || self->cancelled_) return;
    request->dispatched = true;
    Nan::HandleScope scope;
    sfmljs::GuardExceptions([&] {
      auto complete = Nan::GetFunction(Nan::New<v8::FunctionTemplate>(
          CompleteRequest, RequestHandle::Create(request))).ToLocalChecked();
      v8::Local<v8::Value> data = Nan::Undefined();
      if (request->operation == Operation::Read) {
        auto buffer = request->bytes.empty()
            ? v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), 0)
            : sfmljs::MapShared(v8::Isolate::GetCurrent(), request,
                request->bytes.data(), request->bytes.size());
        data = v8::Uint8Array::New(buffer, 0, request->bytes.size());
      }
      v8::Local<v8::Value> args[] = {
          Nan::New(static_cast<int>(request->operation)), data,
          v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(), request->position),
          complete};
      Nan::TryCatch caught;
      self->dispatch_.Call(4, args, &self->resource_);
      if (caught.HasCaught()) {
        std::lock_guard lock(request->mutex);
        if (!request->complete) {
          Nan::Utf8String error(caught.Exception());
          request->error.assign(*error, error.length());
          request->complete = true;
          request->ready.notify_one();
        }
      }
    }, [&](const char* message) {
      std::lock_guard lock(request->mutex);
      if (request->complete) return;
      request->result.reset();
      request->error = message;
      request->complete = true;
      request->ready.notify_one();
    });
  }

  void Finish() {
    v8::Local<v8::Value> result = Nan::Undefined();
    sfmljs::GuardExceptions([&] {
      if (ok_ && error_.empty()) {
        if (sfmljs::ImageBytes(*image_) > node::Buffer::kMaxLength) {
          throw std::length_error("Decoded image exceeds the pixel buffer limit");
        }
        result = sfmljs::MapImage(v8::Isolate::GetCurrent(), image_);
        state_->current = image_;
      }
    }, [&](const char* message) { error_ = message; });
    v8::Local<v8::Value> error = error_.empty()
        ? v8::Local<v8::Value>(Nan::Null()) : sfmljs::Error(error_.c_str());
    v8::Local<v8::Value> args[] = {error, result};
    callback_.Call(2, args, &resource_);
  }

  uv_async_t async_{};
  std::thread thread_;
  std::mutex mutex_;
  std::shared_ptr<Request> request_;
  bool finished_{};
  std::atomic<bool> cancelled_{false};
  node::AsyncCleanupHookHandle cleanup_;
  void (*cleanupDone_)(void*){};
  void* cleanupArgument_{};
  std::shared_ptr<sfmljs::ImageState> state_;
  std::shared_ptr<sf::Image> image_;
  Nan::Callback dispatch_;
  Nan::Callback callback_;
  Nan::AsyncResource resource_;
  bool ok_{};
  std::string error_;
};

NAN_METHOD(LoadImageStream) {
  auto* image = sfmljs::ImageHandle::From(info[0]);
  if (!image) return;
  if (!info[1]->IsFunction() || !info[2]->IsFunction()) {
    return Nan::ThrowTypeError("Expected stream dispatch and completion callbacks");
  }
  try {
    auto loader = std::make_unique<StreamLoader>(image->owner(),
        info[1].As<v8::Function>(), info[2].As<v8::Function>());
    loader->Start();
    loader.release();
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeStream) {
  sfmljs::SetMethod<LoadImageStream>(target, "loadImageStream");
}
