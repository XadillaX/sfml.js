#include "audio-stream.h"

#include <atomic>
#include <condition_variable>
#include <cstring>
#include <thread>

namespace sfmljs::audio {
namespace {

struct Request {
  unsigned operation{};
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
using RequestHandle = SharedHandle<Request>;

NAN_METHOD(CompleteStreamRequest) {
  auto* handle = RequestHandle::From(info.Data());
  if (!handle) return;
  auto request = handle->owner();
  std::lock_guard lock(request->mutex);
  if (request->complete) return;
  GuardExceptions([&] {
    if (!info[0]->IsNullOrUndefined()) {
      Nan::Utf8String error(info[0]);
      request->error.assign(*error, error.length());
      if (request->error.empty()) request->error = "Audio InputStream failed";
    } else if (!info[1]->IsUndefined()) {
      bool lossless{};
      const auto value = info[1]->IsBigInt()
          ? info[1].As<v8::BigInt>()->Uint64Value(&lossless) : 0;
      if (!lossless || value > std::numeric_limits<std::size_t>::max() ||
          (request->operation == 0 && value > request->bytes.size())) {
        request->error = "Stream result must be a non-negative bigint within range";
      } else {
        request->result = static_cast<std::size_t>(value);
        if (request->operation == 0) {
          request->snapshot.assign(request->bytes.begin(), request->bytes.begin() + value);
        }
      }
    }
  }, [&](const char* error) { request->error = error; });
  request->complete = true;
  request->ready.notify_one();
}

class ThreadJob {
 public:
  ThreadJob(v8::Local<v8::Function> callback, Job::Action work,
             Job::Result result, Job::Action cancel)
      : callback_(callback), resource_("sfml:AudioStream"),
        work_(std::move(work)), result_(std::move(result)), cancel_(std::move(cancel)) {}
  void Start() {
    const int status = uv_async_init(node::GetCurrentEventLoop(v8::Isolate::GetCurrent()),
        &async_, [](uv_async_t* handle) { static_cast<ThreadJob*>(handle->data)->Finish(); });
    if (status) throw std::runtime_error(uv_strerror(status));
    async_.data = this;
    cleanup_ = node::AddEnvironmentCleanupHook(v8::Isolate::GetCurrent(),
        [](void* pointer, void (*done)(void*), void* argument) {
          auto* job = static_cast<ThreadJob*>(pointer);
          job->cleanupDone_ = done;
          job->cleanupArgument_ = argument;
          if (job->cancel_) job->cancel_();
        }, this);
    GuardExceptions([&] {
      thread_ = std::thread([this] {
        GuardExceptions(work_, [this](const char* error) { error_ = error; });
        uv_async_send(&async_);
      });
    }, [this](const char* error) {
      error_ = error;
      uv_async_send(&async_);
    });
  }
 private:
  void Finish() {
    if (thread_.joinable()) thread_.join();
    if (!cleanupDone_) {
      node::RemoveEnvironmentCleanupHook(std::move(cleanup_));
      Nan::HandleScope scope;
      v8::Local<v8::Value> value = Nan::Undefined();
      if (error_.empty()) {
        GuardExceptions([&] { value = result_(); },
                        [this](const char* error) { error_ = error; });
      }
      v8::Local<v8::Value> error = error_.empty()
          ? v8::Local<v8::Value>(Nan::Null()) : Error(error_.c_str());
      v8::Local<v8::Value> args[] = {error, value};
      callback_.Call(2, args, &resource_);
    }
    uv_close(reinterpret_cast<uv_handle_t*>(&async_), [](uv_handle_t* handle) {
      auto* job = static_cast<ThreadJob*>(handle->data);
      const auto done = job->cleanupDone_;
      const auto argument = job->cleanupArgument_;
      delete job;
      if (done) done(argument);
    });
  }
  uv_async_t async_{};
  std::thread thread_;
  Nan::Callback callback_;
  Nan::AsyncResource resource_;
  Job::Action work_;
  Job::Result result_;
  Job::Action cancel_;
  std::string error_;
  node::AsyncCleanupHookHandle cleanup_;
  void (*cleanupDone_)(void*){};
  void* cleanupArgument_{};
};
}

void QueueThread(v8::Local<v8::Value> callback, Job::Action work,
                 Job::Result result, Job::Action cancel) {
  if (!callback->IsFunction()) return Nan::ThrowTypeError("Expected a callback");
  auto job = std::make_unique<ThreadJob>(callback.As<v8::Function>(),
      std::move(work), std::move(result), std::move(cancel));
  job->Start();
  job.release();
}

struct StreamClient::Bridge : std::enable_shared_from_this<Bridge> {
  uv_async_t async{};
  Nan::Callback dispatch;
  std::unique_ptr<Nan::AsyncResource> resource =
      std::make_unique<Nan::AsyncResource>("sfml:AudioInputStream");
  std::mutex mutex;
  std::shared_ptr<Request> request;
  bool cancelled{};
  bool closing{};
  bool cleanup{};
  v8::Isolate* isolate{};
  explicit Bridge(v8::Local<v8::Function> callback) : dispatch(callback) {}

  static void Cleanup(void* pointer) {
    auto self = *static_cast<std::shared_ptr<Bridge>*>(pointer);
    self->cleanup = true;
    self->Cancel();
    self->Close();
  }
  void Start() {
    isolate = v8::Isolate::GetCurrent();
    const int status = uv_async_init(node::GetCurrentEventLoop(isolate), &async,
        [](uv_async_t* handle) {
          auto self = *static_cast<std::shared_ptr<Bridge>*>(handle->data);
          self->Dispatch();
        });
    if (status) throw std::runtime_error(uv_strerror(status));
    async.data = new std::shared_ptr<Bridge>(shared_from_this());
    uv_unref(reinterpret_cast<uv_handle_t*>(&async));
    node::AddEnvironmentCleanupHook(isolate, Cleanup, async.data);
  }
  void Cancel() {
    std::lock_guard lock(mutex);
    cancelled = true;
    if (request) {
      std::lock_guard requestLock(request->mutex);
      request->complete = true;
      request->error = "Audio InputStream closed";
      request->ready.notify_one();
    }
    if (!closing) uv_async_send(&async);
  }
  void Close() {
    {
      std::lock_guard lock(mutex);
      if (closing) return;
      closing = true;
    }
    if (!cleanup) node::RemoveEnvironmentCleanupHook(isolate, Cleanup, async.data);
    dispatch.Reset();
    resource.reset();
    uv_close(reinterpret_cast<uv_handle_t*>(&async), [](uv_handle_t* handle) {
      delete static_cast<std::shared_ptr<Bridge>*>(handle->data);
    });
  }
  std::shared_ptr<Request> Exchange(unsigned operation, std::size_t value = 0) {
    auto next = std::make_shared<Request>();
    next->operation = operation;
    next->position = value;
    if (operation == 0) {
      if (value > node::Buffer::kMaxLength) throw std::length_error("Stream read too large");
      next->bytes.resize(value);
    }
    {
      std::lock_guard lock(mutex);
      if (cancelled) throw std::runtime_error("Audio InputStream closed");
      request = next;
      uv_async_send(&async);
    }
    std::unique_lock lock(next->mutex);
    next->ready.wait(lock, [&] { return next->complete; });
    if (!next->error.empty()) throw std::runtime_error(next->error);
    return next;
  }
  void Dispatch() {
    std::shared_ptr<Request> next;
    bool cancel;
    {
      std::lock_guard lock(mutex);
      cancel = cancelled;
      next = request;
    }
    if (cancel) { Close(); return; }
    if (!next || next->dispatched) return;
    next->dispatched = true;
    Nan::HandleScope scope;
    GuardExceptions([&] {
      auto complete = Nan::GetFunction(Nan::New<v8::FunctionTemplate>(
          CompleteStreamRequest, RequestHandle::Create(next))).ToLocalChecked();
      v8::Local<v8::Value> data = Nan::Undefined();
      if (next->operation == 0) {
        auto buffer = next->bytes.empty() ? v8::ArrayBuffer::New(isolate, 0)
            : MapShared(isolate, next, next->bytes.data(), next->bytes.size());
        data = v8::Uint8Array::New(buffer, 0, next->bytes.size());
      }
      v8::Local<v8::Value> args[] = {
        Nan::New(next->operation), data,
        v8::BigInt::NewFromUnsigned(isolate, next->position), complete,
      };
      Nan::TryCatch caught;
      dispatch.Call(4, args, resource.get());
      if (caught.HasCaught()) {
        std::lock_guard lock(next->mutex);
        if (!next->complete) {
          Nan::Utf8String error(caught.Exception());
          next->error.assign(*error, error.length());
          next->complete = true;
          next->ready.notify_one();
        }
      }
    }, [&](const char* error) {
      std::lock_guard lock(next->mutex);
      if (!next->complete) {
        next->error = error;
        next->complete = true;
        next->ready.notify_one();
      }
    });
  }
};

StreamClient::StreamClient(v8::Local<v8::Function> dispatch)
    : bridge(std::make_shared<Bridge>(dispatch)) { bridge->Start(); }
StreamClient::~StreamClient() { bridge->Cancel(); }
void StreamClient::Cancel() { bridge->Cancel(); }
std::optional<std::size_t> StreamClient::read(void* data, std::size_t size) {
  auto request = bridge->Exchange(0, size);
  if (request->result && *request->result) {
    std::memcpy(data, request->snapshot.data(), *request->result);
  }
  return request->result;
}
std::optional<std::size_t> StreamClient::seek(std::size_t position) {
  return bridge->Exchange(1, position)->result;
}
std::optional<std::size_t> StreamClient::tell() { return bridge->Exchange(2)->result; }
std::optional<std::size_t> StreamClient::getSize() { return bridge->Exchange(3)->result; }

NAN_METHOD(CreateAudioInputStream) {
  if (!info[0]->IsFunction()) return Nan::ThrowTypeError("Expected stream dispatch");
  info.GetReturnValue().Set(StreamClientHandle::Create(
      std::make_shared<StreamClient>(info[0].As<v8::Function>())));
}
NAN_METHOD(CloseAudioInputStream) {
  auto* handle = StreamClientHandle::From(info[0]);
  if (handle) handle->owner()->Cancel();
}

} // namespace sfmljs::audio

NAN_MODULE_INIT(InitializeAudioStreams) {
  using namespace sfmljs::audio;
  sfmljs::SetMethod<CreateAudioInputStream>(target, "createAudioInputStream");
  sfmljs::SetMethod<CloseAudioInputStream>(target, "closeAudioInputStream");
}
