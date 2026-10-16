#include "../../native/exception-boundary.h"

#include <SFML/Graphics/Font.hpp>
#include <SFML/System/Exception.hpp>

#include <atomic>
#include <memory>
#include <stdexcept>

namespace {

std::atomic<unsigned> activeScopes{};

struct Scope {
  Scope() { ++activeScopes; }
  ~Scope() { --activeScopes; }
};

void Fail(unsigned kind) {
  const Scope scope;
  if (kind == 0) throw sf::Exception("SFML exception message");
  if (kind == 1) throw std::runtime_error("C++ exception message");
  if (kind == 2) throw 42;
  // Exercise a real throwing SFML constructor, not only a synthetic exception.
  if (kind == 3) {
    const sf::Font font(nullptr, 0);
  }
}

NAN_METHOD(ThrowNativeException) {
  Fail(Nan::To<unsigned>(info[0]).FromMaybe(0));
  info.GetReturnValue().Set(false);
}

NAN_METHOD(ReadExceptionScopes) {
  info.GetReturnValue().Set(Nan::New(activeScopes.load()));
}

NAN_METHOD(PassJsException) {
  if (!info[0]->IsFunction()) return Nan::ThrowTypeError("Expected a callback");
  // A pending JS exception must pass through without being replaced.
  Nan::Call(info[0].As<v8::Function>(), Nan::GetCurrentContext()->Global(), 0, nullptr);
}

class FailureWorker final : public sfmljs::AsyncWorker {
 public:
  FailureWorker(Nan::Callback* callback, unsigned kind, bool completion)
      : sfmljs::AsyncWorker(callback, "sfml:ExceptionProbe"),
        kind_(kind), completion_(completion) {}

  void ExecuteWork() override {
    if (!completion_) Fail(kind_);
  }

  void CompleteWork() override {
    Nan::HandleScope scope;
    if (completion_) Fail(kind_);
    v8::Local<v8::Value> args[] = {Nan::Null(), Nan::False()};
    callback->Call(2, args, async_resource);
  }

 private:
  unsigned kind_;
  bool completion_;
};

NAN_METHOD(QueueNativeException) {
  if (!info[2]->IsFunction()) return Nan::ThrowTypeError("Expected a callback");
  auto callback = std::make_unique<Nan::Callback>(info[2].As<v8::Function>());
  auto worker = std::make_unique<FailureWorker>(callback.get(),
      Nan::To<unsigned>(info[0]).FromMaybe(0), info[1]->IsTrue());
  callback.release();
  Nan::AsyncQueueWorker(worker.release());
}

}  // namespace

NAN_MODULE_INIT(InitializeExceptionProbes) {
  sfmljs::SetMethod<ThrowNativeException>(target, "throwNativeException");
  sfmljs::SetMethod<ReadExceptionScopes>(target, "readExceptionScopes");
  sfmljs::SetMethod<PassJsException>(target, "passJsException");
  sfmljs::SetMethod<QueueNativeException>(target, "queueNativeException");
}
