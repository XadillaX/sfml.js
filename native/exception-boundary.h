#pragma once

#include <nan.h>
#include <SFML/System/Exception.hpp>

#include <exception>

namespace sfmljs {

inline v8::Local<v8::String> ErrorStateKey() {
  return Nan::New("sfml.error.state").ToLocalChecked();
}

inline void InitializeErrors(v8::Local<v8::Object> target) {
  auto state = Nan::New<v8::Object>();
  Nan::Set(state, Nan::New("prototype").ToLocalChecked(), Nan::Undefined()).FromJust();
  Nan::Set(target, Nan::New("errorState").ToLocalChecked(), state).FromJust();
  Nan::SetPrivate(Nan::GetCurrentContext()->Global(), ErrorStateKey(), state)
      .FromJust();
}

// The JS realm owns its prototype. No persistent C++ handle or teardown hook.
inline v8::Local<v8::Value> Error(const char* message) {
  auto error = Nan::Error(message);
  auto object = error.As<v8::Object>();
  v8::Local<v8::Value> state;
  v8::Local<v8::Value> prototype;
  if (Nan::GetPrivate(Nan::GetCurrentContext()->Global(), ErrorStateKey())
          .ToLocal(&state) && state->IsObject() &&
      Nan::Get(state.As<v8::Object>(), Nan::New("prototype").ToLocalChecked())
          .ToLocal(&prototype) && prototype->IsObject()) {
    object->SetPrototype(Nan::GetCurrentContext(), prototype).FromJust();
  }
  Nan::Set(object, Nan::New("name").ToLocalChecked(),
           Nan::New("SFMLError").ToLocalChecked()).FromJust();
  return error;
}

inline void ThrowError(const char* message) {
  Nan::ThrowError(Error(message));
}

template <typename Action, typename Failure>
void GuardExceptions(Action&& action, Failure&& failure) {
  try {
    action();
  } catch (const sf::Exception& error) {
    // Match the prebuilt library's concrete type across DSO boundaries.
    failure(error.what());
  } catch (const std::exception& error) {
    failure(error.what());
  } catch (...) {
    failure("Unknown native exception");
  }
}

template <Nan::FunctionCallback Callback>
void ExceptionBoundary(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  GuardExceptions([&] { Callback(info); },
                  [](const char* message) { ThrowError(message); });
}

// The callback is a compile-time parameter: no per-call dispatch allocation.
template <Nan::FunctionCallback Callback>
void SetMethod(v8::Local<v8::Object> target, const char* name) {
  Nan::SetMethod(target, name, ExceptionBoundary<Callback>);
}

// libuv executes these callbacks outside the synchronous NAN call stack.
class AsyncWorker : public Nan::AsyncWorker {
 public:
  using Nan::AsyncWorker::AsyncWorker;

  void Execute() final {
    GuardExceptions([this] { ExecuteWork(); },
                    [this](const char* message) { SetErrorMessage(message); });
  }

  void HandleOKCallback() final {
    GuardExceptions([this] { CompleteWork(); }, [this](const char* message) {
      SetErrorMessage(message);
      HandleErrorCallback();
    });
  }

  void HandleErrorCallback() final {
    Nan::HandleScope scope;
    v8::Local<v8::Value> args[] = {Error(ErrorMessage())};
    callback->Call(1, args, async_resource);
  }

 protected:
  virtual void ExecuteWork() = 0;
  virtual void CompleteWork() = 0;
};

}  // namespace sfmljs
