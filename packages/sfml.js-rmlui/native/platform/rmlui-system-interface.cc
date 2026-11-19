// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/rmlui-system-interface.h"

#include <RmlUi/Core/Core.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <cmath>
#include <limits>
#include <memory>
#include <utility>
#include <vector>

#include "native/platform/system-interface-sfml.h"
#include "native/runtime/rmlui-interop.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-numeric-value.h"

namespace sfmlrmlui {
namespace {

enum Method {
  kTranslate,
  kJoin,
  kLog,
  kCursor,
  kSetClipboard,
  kGetClipboard,
  kActivate,
  kDeactivate,
  kMethodCount,
};

struct SystemClock {
  double seconds{std::numeric_limits<double>::quiet_NaN()};
};

class SystemCallbackScope final {
 public:
  SystemCallbackScope() {
    ++State().callback_depth;
    ++State().system_callback_depth;
  }
  ~SystemCallbackScope() {
    --State().system_callback_depth;
    --State().callback_depth;
  }
};

NAN_METHOD(IgnoreAsyncResult) {}

class CallbackSystem final : public SystemInterfaceSFML {
 public:
  CallbackSystem(std::shared_ptr<SystemClock> clock,
                 v8::Local<v8::Array> functions)
      : clock_(std::move(clock)) {
    for (uint32_t i = 0; i < kMethodCount; ++i) {
      if (Nan::Get(functions, i).ToLocalChecked()->IsFunction()) {
        methods_ |= 1u << i;
      }
    }
    functions_.Reset(v8::Isolate::GetCurrent(), functions);
    functions_.SetWeak();
  }

  double GetElapsedTime() override {
    const double value = clock_->seconds;
    if (std::isnan(value)) {
      return SystemInterfaceSFML::GetElapsedTime();
    }
    if (!std::isfinite(value) || value < 0) {
      CaptureCallbackException(Nan::RangeError(
          "System clock must contain nonnegative finite seconds or NaN"));
      return 0;
    }
    return value;
  }

  int TranslateString(Rml::String& translated,
                      const Rml::String& input) override {
    if (!Has(kTranslate)) {
      return SystemInterfaceSFML::TranslateString(translated, input);
    }
    int count = 0;
    translated = input;
    v8::Local<v8::Value> arg = Nan::New(input).ToLocalChecked();
    Invoke(kTranslate, 1, &arg, [&](v8::Local<v8::Value> result) {
      v8::Local<v8::Value> text;
      v8::Local<v8::Value> translations;
      if (!result->IsObject() ||
          !Nan::Get(result.As<v8::Object>(), Nan::New("value").ToLocalChecked())
               .ToLocal(&text) ||
          !Nan::Get(result.As<v8::Object>(),
                    Nan::New("translations").ToLocalChecked())
               .ToLocal(&translations)) {
        if (!result->IsObject()) {
          Nan::ThrowTypeError("Expected a translation result object");
        }
        return;
      }
      if (!text->IsString() || !translations->IsInt32() ||
          Nan::To<int32_t>(translations).FromJust() < 0) {
        Nan::ThrowTypeError(
            "Translation value must be a string with a nonnegative count");
        return;
      }
      Nan::Utf8String utf8(text);
      translated.assign(*utf8, utf8.length());
      count = Nan::To<int32_t>(translations).FromJust();
    });
    return count;
  }

  void JoinPath(Rml::String& translated,
                const Rml::String& document,
                const Rml::String& path) override {
    if (!Has(kJoin)) {
      SystemInterfaceSFML::JoinPath(translated, document, path);
      return;
    }
    v8::Local<v8::Value> args[] = {Nan::New(document).ToLocalChecked(),
                                   Nan::New(path).ToLocalChecked()};
    Invoke(kJoin, 2, args, [&](v8::Local<v8::Value> value) {
      ReadString(value, &translated);
    });
  }

  bool LogMessage(Rml::Log::Type type, const Rml::String& message) override {
    if (!Has(kLog)) {
      return SystemInterfaceSFML::LogMessage(type, message);
    }
    bool result = true;
    v8::Local<v8::Value> args[] = {Nan::New(static_cast<int>(type)),
                                   Nan::New(message).ToLocalChecked()};
    Invoke(kLog, 2, args, [&](v8::Local<v8::Value> value) {
      if (!value->IsBoolean()) {
        Nan::ThrowTypeError("System log callback must return a boolean");
        return;
      }
      result = Nan::To<bool>(value).FromJust();
    });
    return result;
  }

  void SetMouseCursor(const Rml::String& cursor) override {
    if (Has(kCursor)) {
      InvokeText(kCursor, cursor);
    } else {
      SystemInterfaceSFML::SetMouseCursor(cursor);
    }
  }

  void SetClipboardText(const Rml::String& text) override {
    if (Has(kSetClipboard)) {
      InvokeText(kSetClipboard, text);
    } else {
      SystemInterfaceSFML::SetClipboardText(text);
    }
  }

  void GetClipboardText(Rml::String& text) override {
    if (Has(kGetClipboard)) {
      Invoke(kGetClipboard, 0, nullptr, [&](v8::Local<v8::Value> value) {
        ReadString(value, &text);
      });
    } else {
      SystemInterfaceSFML::GetClipboardText(text);
    }
  }

  void ActivateKeyboard(Rml::Vector2f caret, float height) override {
    SystemInterfaceSFML::ActivateKeyboard(caret, height);
    if (!Has(kActivate)) {
      return;
    }
    auto point = Nan::New<v8::Object>();
    point
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             Nan::New("x").ToLocalChecked(),
                             Nan::New(caret.x))
        .FromJust();
    point
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             Nan::New("y").ToLocalChecked(),
                             Nan::New(caret.y))
        .FromJust();
    v8::Local<v8::Value> args[] = {point, Nan::New(height)};
    Invoke(kActivate, 2, args, [](v8::Local<v8::Value>) {});
  }

  void DeactivateKeyboard() override {
    if (Has(kDeactivate)) {
      Invoke(kDeactivate, 0, nullptr, [](v8::Local<v8::Value>) {});
    } else {
      SystemInterfaceSFML::DeactivateKeyboard();
    }
  }

 private:
  bool Has(Method method) const {
    return (methods_ & (1u << method)) != 0 && !functions_.IsEmpty();
  }

  void InvokeText(Method method, const Rml::String& text) {
    v8::Local<v8::Value> arg = Nan::New(text).ToLocalChecked();
    Invoke(method, 1, &arg, [](v8::Local<v8::Value>) {});
  }

  static bool ReadString(v8::Local<v8::Value> value, Rml::String* result) {
    if (!value->IsString()) {
      Nan::ThrowTypeError("System callback must return a string");
      return false;
    }
    Nan::Utf8String text(value);
    result->assign(*text, text.length());
    return true;
  }

  template <typename Visitor>
  void Invoke(Method method,
              int count,
              v8::Local<v8::Value>* args,
              const Visitor& visitor) {
    auto& state = State();
    if (functions_.IsEmpty() || state.cleaning_up || !state.boundary_depth ||
        !state.callback_exception.IsEmpty() ||
        (state.initialized && !CanInvokeCallback())) {
      return;
    }
    Nan::TryCatch caught;
    SystemCallbackScope scope;
    const auto function =
        Nan::Get(functions_.Get(v8::Isolate::GetCurrent()), method)
            .ToLocalChecked()
            .As<v8::Function>();
    v8::Local<v8::Value> result;
    RecordDiagnosticCallback(DiagnosticCallback::kSystem);
    if (function->Call(Nan::GetCurrentContext(), Nan::Undefined(), count, args)
            .ToLocal(&result)) {
      if (result->IsPromise()) {
        auto ignore =
            Nan::GetFunction(Nan::New<v8::FunctionTemplate>(IgnoreAsyncResult))
                .ToLocalChecked();
        v8::Local<v8::Promise> ignored;
        if (result.As<v8::Promise>()
                ->Catch(Nan::GetCurrentContext(), ignore)
                .ToLocal(&ignored)) {
          Nan::ThrowTypeError("System callbacks must be synchronous");
        }
      } else {
        visitor(result);
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }

  std::shared_ptr<SystemClock> clock_;
  v8::Global<v8::Array> functions_;
  uint32_t methods_{0};
};

struct SystemState {
  std::shared_ptr<SystemInterfaceSFML> value;
  std::shared_ptr<SystemClock> clock;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

using SystemHandle = sfmljs::SharedHandle<SystemState>;

auto& Systems() {
  static std::vector<std::weak_ptr<SystemState>> systems;
  return systems;
}

auto& Selected() {
  static std::shared_ptr<SystemState> selected;
  return selected;
}

auto& SelectedHandle() {
  // Core borrows this installed interface across all document operations.
  static v8::Global<v8::Object> handle;
  return handle;
}

uint64_t SystemGeneration() {
  return State().generation + (State().initialized ? 0 : 1);
}

std::shared_ptr<SystemState> SystemOf(v8::Local<v8::Value> value) {
  auto* handle = SystemHandle::From(value);
  if (!handle) {
    return {};
  }
  auto owner = handle->owner();
  if (!owner->value || owner->generation != SystemGeneration()) {
    Nan::ThrowError("RmlUi system interface is no longer valid");
    return {};
  }
  return owner;
}

v8::Local<v8::Object> CreateSystem(v8::Local<v8::Object> window_handle,
                                   v8::Local<v8::Array> functions) {
  auto* window = GetRenderWindow(window_handle);
  if (!window) {
    return {};
  }
  ClaimRuntimeSetup();
  auto owner = std::make_shared<SystemState>();
  owner->clock = std::make_shared<SystemClock>();
  owner->value = std::make_shared<CallbackSystem>(owner->clock, functions);
  owner->value->SetWindow(window);
  owner->generation = SystemGeneration();
  auto handle = SystemHandle::Create(owner);
  auto* isolate = v8::Isolate::GetCurrent();
  auto backing = sfmljs::MapShared(isolate,
                                   owner->clock,
                                   &owner->clock->seconds,
                                   sizeof(owner->clock->seconds));
  auto clock = v8::Float64Array::New(backing, 0, 1);
  Nan::SetPrivate(
      handle, Nan::New("rml.system.functions").ToLocalChecked(), functions)
      .FromJust();
  Nan::SetPrivate(
      handle, Nan::New("rml.system.window").ToLocalChecked(), window_handle)
      .FromJust();
  Nan::SetPrivate(handle, Nan::New("rml.system.clock").ToLocalChecked(), clock)
      .FromJust();
  owner->handle.Reset(isolate, handle);
  owner->handle.SetWeak();
  static size_t threshold = 64;
  if (Systems().size() >= threshold) {
    std::erase_if(Systems(), [](const auto& weak) { return weak.expired(); });
    threshold = std::max<size_t>(64, Systems().size() * 2);
  }
  Systems().push_back(owner);
  return handle;
}

NAN_METHOD(CreateSystemInterface) {
  if (!info[1]->IsArray() ||
      info[1].As<v8::Array>()->Length() != kMethodCount) {
    return Nan::ThrowTypeError("Expected eight system callbacks");
  }
  const auto input = info[1].As<v8::Array>();
  auto functions = Nan::New<v8::Array>(kMethodCount);
  for (uint32_t i = 0; i < kMethodCount; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(input, i).ToLocal(&value)) {
      return;
    }
    if (!value->IsUndefined() && !value->IsFunction()) {
      return Nan::ThrowTypeError("Expected optional system callback functions");
    }
    functions->CreateDataProperty(Nan::GetCurrentContext(), i, value)
        .FromJust();
  }
  auto* window = GetRenderWindow(info[0]);
  if (!window) {
    return;
  }
  auto handle = CreateSystem(info[0].As<v8::Object>(), functions);
  if (!handle.IsEmpty()) {
    info.GetReturnValue().Set(handle);
  }
}

NAN_METHOD(GetSystemClock) {
  if (auto owner = SystemOf(info[0])) {
    info.GetReturnValue().Set(
        Nan::GetPrivate(owner->handle.Get(v8::Isolate::GetCurrent()),
                        Nan::New("rml.system.clock").ToLocalChecked())
            .ToLocalChecked());
  }
}

NAN_METHOD(GetSystemInterface) {
  if (!Rml::GetSystemInterface()) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  info.GetReturnValue().Set(SelectedHandle().Get(v8::Isolate::GetCurrent()));
}

NAN_METHOD(SetSystemInterface) {
  if (State().initialized) {
    return Nan::ThrowError("Set system interface before initialization");
  }
  if (info[0]->IsNull()) {
    Rml::SetSystemInterface(nullptr);
    State().system_interface.reset();
    SelectedHandle().Reset();
    Selected().reset();
    return;
  }
  auto owner = SystemOf(info[0]);
  if (!owner) {
    return;
  }
  SelectedHandle().Reset(v8::Isolate::GetCurrent(), info[0].As<v8::Object>());
  Selected() = owner;
  State().system_interface = owner->value;
  Rml::SetSystemInterface(owner->value.get());
}

bool ReadText(v8::Local<v8::Value> input, Rml::String* result) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a system input string");
    return false;
  }
  Nan::Utf8String text(input);
  result->assign(*text, text.length());
  return true;
}

NAN_METHOD(GetElapsedTime) {
  if (auto owner = SystemOf(info[0])) {
    info.GetReturnValue().Set(owner->value->GetElapsedTime());
  }
}

NAN_METHOD(TranslateString) {
  Rml::String input;
  if (!ReadText(info[1], &input)) {
    return;
  }
  if (auto owner = SystemOf(info[0])) {
    Rml::String value;
    const int count = owner->value->TranslateString(value, input);
    auto result = Nan::New<v8::Object>();
    result
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             Nan::New("value").ToLocalChecked(),
                             Nan::New(value).ToLocalChecked())
        .FromJust();
    result
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             Nan::New("translations").ToLocalChecked(),
                             Nan::New(count))
        .FromJust();
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(JoinPath) {
  Rml::String document;
  Rml::String path;
  if (!ReadText(info[1], &document) || !ReadText(info[2], &path)) {
    return;
  }
  if (auto owner = SystemOf(info[0])) {
    Rml::String result;
    owner->value->JoinPath(result, document, path);
    info.GetReturnValue().Set(Nan::New(result).ToLocalChecked());
  }
}

NAN_METHOD(LogMessage) {
  Rml::String message;
  if (!info[1]->IsInt32() || Nan::To<int>(info[1]).FromJust() < 0 ||
      Nan::To<int>(info[1]).FromJust() >= Rml::Log::LT_MAX) {
    return Nan::ThrowRangeError("Expected a native log type");
  }
  if (!ReadText(info[2], &message)) {
    return;
  }
  if (auto owner = SystemOf(info[0])) {
    info.GetReturnValue().Set(owner->value->LogMessage(
        static_cast<Rml::Log::Type>(Nan::To<int>(info[1]).FromJust()),
        message));
  }
}

template <bool clipboard>
NAN_METHOD(SetText) {
  Rml::String text;
  if (!ReadText(info[1], &text)) {
    return;
  }
  if (auto owner = SystemOf(info[0])) {
    if constexpr (clipboard) {
      owner->value->SetClipboardText(text);
    } else {
      owner->value->SetMouseCursor(text);
    }
  }
}

NAN_METHOD(GetClipboardText) {
  if (auto owner = SystemOf(info[0])) {
    Rml::String text;
    owner->value->GetClipboardText(text);
    info.GetReturnValue().Set(Nan::New(text).ToLocalChecked());
  }
}

NAN_METHOD(ActivateKeyboard) {
  Rml::Vector2f caret;
  float height;
  if (!ReadFiniteNumericFloat(info[1], &caret.x) ||
      !ReadFiniteNumericFloat(info[2], &caret.y) ||
      !ReadFiniteNumericFloat(info[3], &height)) {
    return;
  }
  if (auto owner = SystemOf(info[0])) {
    owner->value->ActivateKeyboard(caret, height);
  }
}

NAN_METHOD(DeactivateKeyboard) {
  if (auto owner = SystemOf(info[0])) {
    owner->value->DeactivateKeyboard();
  }
}

}  // namespace

void PrepareSystemInterface(v8::Local<v8::Object> window_handle) {
  if (Selected()) {
    return;
  }
  auto functions = Nan::New<v8::Array>(kMethodCount);
  for (uint32_t i = 0; i < kMethodCount; ++i) {
    functions->CreateDataProperty(Nan::GetCurrentContext(), i, Nan::Undefined())
        .FromJust();
  }
  auto handle = CreateSystem(window_handle, functions);
  if (!handle.IsEmpty()) {
    Selected() = SystemOf(handle);
    SelectedHandle().Reset(v8::Isolate::GetCurrent(), handle);
    State().system_interface = Selected()->value;
    Rml::SetSystemInterface(State().system_interface.get());
  }
}

void ReleaseSystemInterfaceBindings() {
  std::vector<std::shared_ptr<SystemState>> owners;
  for (const auto& weak : Systems()) {
    if (auto owner = weak.lock()) {
      owners.push_back(std::move(owner));
    }
  }
  for (const auto& owner : owners) {
    owner->clock->seconds = std::numeric_limits<double>::quiet_NaN();
    owner->value.reset();
    owner->generation = 0;
    if (!owner->handle.IsEmpty()) {
      const auto handle = owner->handle.Get(v8::Isolate::GetCurrent());
      Nan::SetPrivate(handle,
                      Nan::New("rml.system.functions").ToLocalChecked(),
                      Nan::Undefined())
          .FromJust();
      Nan::SetPrivate(handle,
                      Nan::New("rml.system.window").ToLocalChecked(),
                      Nan::Undefined())
          .FromJust();
    }
    owner->handle.Reset();
  }
  Systems().clear();
  SelectedHandle().Reset();
  Selected().reset();
  State().system_interface.reset();
}

NAN_MODULE_INIT(InitializeRmlSystemInterface) {
  SetRuntimeMethod<CreateSystemInterface, false, false>(
      target, "createSystemInterface");
  // Events may read the selected provider and its clock, as upstream does
  // when a form records its submission time. System callbacks stay excluded.
  SetRuntimeMethod<GetSystemClock, true, false>(target, "getSystemClock");
  SetRuntimeMethod<GetSystemInterface, true, false>(target,
                                                    "getSystemInterface");
  SetRuntimeMethod<SetSystemInterface, false, false>(target,
                                                     "setSystemInterface");
  SetRuntimeMethod<GetElapsedTime, true, false>(target, "systemGetElapsedTime");
  SetRuntimeMethod<TranslateString, false, false>(target,
                                                  "systemTranslateString");
  SetRuntimeMethod<JoinPath, false, false>(target, "systemJoinPath");
  SetRuntimeMethod<LogMessage, false, false>(target, "systemLogMessage");
  SetRuntimeMethod<SetText<false>, false, false>(target,
                                                 "systemSetMouseCursor");
  SetRuntimeMethod<SetText<true>, false, false>(target,
                                                "systemSetClipboardText");
  SetRuntimeMethod<GetClipboardText, false, false>(target,
                                                   "systemGetClipboardText");
  SetRuntimeMethod<ActivateKeyboard, false, false>(target,
                                                   "systemActivateKeyboard");
  SetRuntimeMethod<DeactivateKeyboard, false, false>(
      target, "systemDeactivateKeyboard");
}

}  // namespace sfmlrmlui
