#include "exception-boundary.h"
#include "image-state.h"
#include "shared-handle.h"

#include <SFML/System/Err.hpp>

#include <algorithm>
#include <deque>
#include <memory>
#include <mutex>
#include <ostream>
#include <streambuf>
#include <string>
#include <vector>

namespace {

struct Environment;
struct Sink;

// Installed once: changing a destination never races an SFML writer's rdbuf().
// Only the byte router is process-wide. All V8 objects stay on their JS thread.
class Router final : public std::streambuf {
 public:
  static Router& Get() {
    static Router router;
    return router;
  }
  ~Router() override {
    sf::err().rdbuf(original);
    original->pubsync();
  }

  std::mutex mutex;
  std::streambuf* original;
  Environment* owner{};
  Sink* destination{};  // owner + nullptr means muted

 protected:
  std::streamsize xsputn(const char* data, std::streamsize size) override;
  int_type overflow(int_type value) override {
    if (traits_type::eq_int_type(value, traits_type::eof())) {
      return traits_type::not_eof(value);
    }
    const char byte = traits_type::to_char_type(value);
    return xsputn(&byte, 1) == 1 ? value : traits_type::eof();
  }
  int sync() override {
    std::lock_guard lock(mutex);
    return owner ? 0 : original->pubsync();
  }

 private:
  Router() : original(sf::err().rdbuf(this)) {}
};

struct Sink {
  uv_async_t async{};
  std::unique_ptr<Nan::Callback> callback;
  std::unique_ptr<Nan::AsyncResource> resource;
  std::deque<std::string> chunks;  // protected by Router::mutex
  std::weak_ptr<Environment> environment;
  bool active{true};              // protected by Router::mutex
  bool closing{};                 // JS thread only
  bool dispatching{};             // JS thread only

  bool Dispatch();
  void Close();
};

struct Environment {
  std::vector<std::shared_ptr<Sink>> sinks;

  void Flush() {
    // A destination's write() may change the current route while dispatching.
    const auto pending = sinks;
    for (const auto& sink : pending) {
      if (!sink->Dispatch()) break;
    }
  }
};

std::streamsize Router::xsputn(const char* data, std::streamsize size) {
  if (size <= 0) return 0;
  std::lock_guard lock(mutex);
  if (!owner) return original->sputn(data, size);
  if (!destination) return size;
  constexpr std::size_t capacity = 64 * 1024;
  auto& queue = destination->chunks;
  auto remaining = static_cast<std::size_t>(size);
  while (remaining) {
    if (queue.empty() || queue.back().size() == capacity) queue.emplace_back();
    const auto count = std::min(remaining, capacity - queue.back().size());
    queue.back().append(data, count);
    data += count;
    remaining -= count;
  }
  uv_async_send(&destination->async);
  return size;
}

void Sink::Close() {
  if (closing) return;
  closing = true;
  callback.reset();
  resource.reset();
  uv_close(reinterpret_cast<uv_handle_t*>(&async), [](uv_handle_t* handle) {
    auto* retained = static_cast<std::shared_ptr<Sink>*>(handle->data);
    if (const auto env = (*retained)->environment.lock()) {
      std::erase(env->sinks, *retained);
    }
    delete retained;
  });
}

bool Sink::Dispatch() {
  if (closing || dispatching ||
      v8::Isolate::GetCurrent()->IsExecutionTerminating()) return true;
  dispatching = true;
  struct Reset {
    bool& flag;
    ~Reset() { flag = false; }
  } reset{dispatching};
  bool complete = true;
  std::deque<std::string> pending;
  {
    std::lock_guard lock(Router::Get().mutex);
    pending.swap(chunks);
  }
  Nan::HandleScope scope;
  for (auto& chunk : pending) {
    auto bytes = std::make_unique<std::string>(std::move(chunk));
    auto buffer = Nan::NewBuffer(bytes->data(),
        static_cast<std::uint32_t>(bytes->size()),
        [](char*, void* data) { delete static_cast<std::string*>(data); },
        bytes.get()).ToLocalChecked();
    bytes.release();
    v8::Local<v8::Value> args[]{buffer};
    Nan::TryCatch caught;
    callback->Call(1, args, resource.get());
    if (caught.HasCaught()) {
      // Preserve JS errors, including errors thrown by the caller's Writable.
      // Worker termination is not a catchable JS exception.
      if (caught.CanContinue()) caught.ReThrow();
      complete = false;
      break;
    }
  }
  dispatching = false;
  bool finished;
  {
    std::lock_guard lock(Router::Get().mutex);
    finished = !active && chunks.empty();
  }
  if (finished) Close();
  return complete;
}

v8::Local<v8::String> EnvironmentKey() {
  return Nan::New("sfml.error.stream.environment").ToLocalChecked();
}

std::shared_ptr<Environment> CurrentEnvironment() {
  auto value = Nan::GetPrivate(Nan::GetCurrentContext()->Global(),
      EnvironmentKey()).ToLocalChecked();
  return sfmljs::SharedHandle<Environment>::From(value)->owner();
}

NAN_METHOD(SetErrorOutput) {
  if (!info[0]->IsFunction() && !info[0]->IsNullOrUndefined()) {
    return Nan::ThrowTypeError("Expected an output callback, null or undefined");
  }
  const auto env = CurrentEnvironment();
  std::shared_ptr<Sink> next;
  if (info[0]->IsFunction()) {
    next = std::make_shared<Sink>();
    next->environment = env;
    next->callback = std::make_unique<Nan::Callback>(info[0].As<v8::Function>());
    next->resource = std::make_unique<Nan::AsyncResource>("sfml:ErrorOutput");
    env->sinks.push_back(next);
    auto retained = std::make_unique<std::shared_ptr<Sink>>(next);
    const int status = uv_async_init(node::GetCurrentEventLoop(info.GetIsolate()),
        &next->async, [](uv_async_t* handle) {
          Nan::HandleScope scope;
          Nan::TryCatch caught;
          sfmljs::GuardExceptions([&] {
            (*static_cast<std::shared_ptr<Sink>*>(handle->data))->Dispatch();
          }, [](const char* message) { sfmljs::ThrowError(message); });
          if (caught.HasCaught() && caught.CanContinue()) {
            Nan::FatalException(caught);
          }
        });
    if (status != 0) {
      std::erase(env->sinks, next);
      return sfmljs::ThrowError(uv_strerror(status));
    }
    next->async.data = retained.release();
    // An idle logger does not keep an application/Worker alive.
    uv_unref(reinterpret_cast<uv_handle_t*>(&next->async));
  }
  auto& router = Router::Get();
  {
    std::lock_guard lock(router.mutex);
    router.original->pubsync();
    if (router.destination) {
      router.destination->active = false;
      uv_async_send(&router.destination->async);
    }
    router.owner = info[0]->IsUndefined() ? nullptr : env.get();
    router.destination = next.get();
  }
  // Hand this environment's captured bytes to their original destinations
  // before the caller closes an old Writable after changing the route.
  env->Flush();
}

NAN_METHOD(WriteError) {
  std::span<const std::uint8_t> bytes;
  if (!sfmljs::ReadImageBytes(info[0], bytes)) return;
  auto& stream = sf::err();
  stream.write(reinterpret_cast<const char*>(bytes.data()), bytes.size());
  stream.flush();
  if (!stream) {
    stream.clear();
    sfmljs::ThrowError("SFML error stream write failed");
  }
}

NAN_METHOD(FlushErrorOutput) {
  CurrentEnvironment()->Flush();
}

void Cleanup(void* data) {
  auto* retained = static_cast<std::shared_ptr<Environment>*>(data);
  const auto& env = *retained;
  auto& router = Router::Get();
  {
    std::lock_guard lock(router.mutex);
    if (router.owner == env.get()) {
      router.owner = nullptr;
      router.destination = nullptr;
    }
    for (const auto& sink : env->sinks) {
      sink->active = false;
      // No V8 calls during teardown. Normal exit drains in beforeExit; Worker
      // termination sends remaining native bytes to the original sink.
      for (const auto& chunk : sink->chunks) {
        router.original->sputn(chunk.data(), chunk.size());
      }
      sink->chunks.clear();
    }
    router.original->pubsync();
  }
  for (const auto& sink : env->sinks) sink->Close();
  delete retained;
}

}  // namespace

NAN_MODULE_INIT(InitializeErrorStream) {
  Router::Get();
  auto env = std::make_shared<Environment>();
  Nan::SetPrivate(Nan::GetCurrentContext()->Global(), EnvironmentKey(),
      sfmljs::SharedHandle<Environment>::Create(env)).FromJust();
  node::AddEnvironmentCleanupHook(v8::Isolate::GetCurrent(), Cleanup,
      new std::shared_ptr<Environment>(env));
  sfmljs::SetMethod<WriteError>(target, "writeError");
  sfmljs::SetMethod<SetErrorOutput>(target, "setErrorOutput");
  sfmljs::SetMethod<FlushErrorOutput>(target, "flushErrorOutput");
}
