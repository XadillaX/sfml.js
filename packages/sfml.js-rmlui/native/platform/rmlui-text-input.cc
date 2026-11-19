// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/rmlui-text-input.h"

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/TextInputContext.h>
#include <RmlUi/Core/TextInputHandler.h>
#include <sfml-js-interop.h>

#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/platform/ime/platform-text-input.h"
#include "native/runtime/rmlui-callback-leases.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

struct InputState {
  Rml::TextInputContext* value{nullptr};
  Rml::ObserverPtr<Rml::Element> element;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

struct Notice {
  uint32_t kind{0};
  std::shared_ptr<InputState> input;
};

}  // namespace

struct TextInputHandlerState {
  ~TextInputHandlerState();
  Rml::TextInputHandler* value{nullptr};
  std::unique_ptr<Rml::TextInputHandler> owned;
  v8::Global<v8::Object> handle;
  v8::Global<v8::Array> functions;
  std::vector<Notice> notices;
  uint64_t generation{0};
  uint32_t native_roots{0};
  bool active{false};
};

namespace {

using HandlerHandle = sfmljs::SharedHandle<TextInputHandlerState>;
using InputHandle = sfmljs::SharedHandle<InputState>;
using InputOwners = CallbackLeaseOwners<TextInputHandlerState,
                                        v8::Array,
                                        &TextInputHandlerState::functions>;

InputOwners& Owners() {
  static InputOwners owners("rml.text.input.callbacks");
  return owners;
}

struct WidgetLease {
  std::shared_ptr<InputState> input;
  std::shared_ptr<TextInputHandlerState> handler;
  std::shared_ptr<InputOwners::Lease> ownership;
};

auto& Handlers() {
  static std::unordered_map<Rml::TextInputHandler*,
                            std::weak_ptr<TextInputHandlerState>>
      values;
  return values;
}

auto& Widgets() {
  static std::unordered_map<Rml::TextInputContext*, WidgetLease> values;
  return values;
}

auto& Globals() {
  // Core's contract retains every installed handler until shutdown.
  static std::unordered_map<Rml::TextInputHandler*,
                            std::shared_ptr<TextInputHandlerState>>
      values;
  return values;
}

auto& DestroyCallbacks() {
  struct Pending {
    std::shared_ptr<TextInputHandlerState> handler;
    std::shared_ptr<InputState> input;
  };
  static std::vector<Pending> values;
  return values;
}

auto& InvalidatedInputs() {
  static std::vector<std::shared_ptr<InputState>> values;
  return values;
}

uint64_t HandlerGeneration() {
  // Setup objects belong to the next successful initialization. Setup-only
  // shutdown invalidates them explicitly, without advancing a live generation.
  return State().generation + (State().initialized ? 0 : 1);
}

std::shared_ptr<TextInputHandlerState> ShareHandler(
    Rml::TextInputHandler* handler) {
  if (!handler) {
    return {};
  }
  auto& weak = Handlers()[handler];
  if (auto owner = weak.lock()) {
    return owner;
  }
  auto owner = std::make_shared<TextInputHandlerState>();
  owner->value = handler;
  owner->generation = HandlerGeneration();
  weak = owner;
  return owner;
}

v8::Local<v8::Object> WrapInput(const std::shared_ptr<InputState>& input) {
  if (!input->handle.IsEmpty()) {
    return input->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = InputHandle::Create(input);
  input->handle.Reset(v8::Isolate::GetCurrent(), handle);
  input->handle.SetWeak();
  if (input->value && input->element) {
    Nan::SetPrivate(handle,
                    Nan::New("rml.text.input.element").ToLocalChecked(),
                    WrapElement(input->element.get()))
        .FromJust();
  }
  return handle;
}

class InputCallbackScope final {
 public:
  InputCallbackScope() {
    ++State().callback_depth;
    ++State().text_input_callback_depth;
  }
  ~InputCallbackScope() {
    --State().text_input_callback_depth;
    --State().callback_depth;
  }
};

void Invoke(const std::shared_ptr<TextInputHandlerState>& handler,
            uint32_t kind,
            const std::shared_ptr<InputState>& input) {
  if (handler->functions.IsEmpty() || !CanInvokeCallback()) {
    return;
  }
  Nan::HandleScope handles;
  Nan::TryCatch caught;
  auto callback =
      Nan::Get(handler->functions.Get(v8::Isolate::GetCurrent()), kind)
          .ToLocalChecked();
  if (callback->IsFunction()) {
    if (handler->active) {
      Nan::ThrowError("Recursive text input handler callback");
    } else {
      handler->active = true;
      InputCallbackScope callback_scope;
      v8::Local<v8::Value> argument =
          input ? v8::Local<v8::Value>(WrapInput(input))
                : v8::Local<v8::Value>(Nan::Null());
      v8::Local<v8::Value> ignored;
      RecordDiagnosticCallback(DiagnosticCallback::kTextInput);
      const bool called =
          callback.As<v8::Function>()
              ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 1, &argument)
              .ToLocal(&ignored);
      (void)called;
      handler->active = false;
    }
  }
  if (caught.HasCaught()) {
    CaptureCallbackException(caught.Exception());
  }
}

class NativeHandler final : public Rml::TextInputHandler {
 public:
  std::weak_ptr<TextInputHandlerState> state;

  void OnActivate(Rml::TextInputContext* input) override { Notify(0, input); }
  void OnDeactivate(Rml::TextInputContext* input) override { Notify(1, input); }
  // Destructors cannot call into V8. The native hook follows this virtual and
  // invalidates before destroy callbacks drain at a safe entry.
  void OnDestroy(Rml::TextInputContext*) override {}

 private:
  void Notify(uint32_t kind, Rml::TextInputContext* pointer) {
    if (auto owner = state.lock()) {
      const auto found = Widgets().find(pointer);
      auto input = found == Widgets().end() ? nullptr : found->second.input;
      owner->notices.push_back({kind, input});
      Invoke(owner, kind, input);
    }
  }
};

void InputLifetimeChanged(Rml::TextInputContext* pointer,
                          Rml::TextInputHandler* handler,
                          Rml::Element* element,
                          bool destroyed) {
  if (!destroyed) {
    auto input = std::make_shared<InputState>();
    input->value = pointer;
    input->element = element->GetObserverPtr();
    input->generation = State().generation;
    auto owner = ShareHandler(handler);
    auto lease = owner && !owner->functions.IsEmpty()
                     ? Owners().Add(owner, element)
                     : nullptr;
    Widgets().emplace(pointer,
                      WidgetLease{input, std::move(owner), std::move(lease)});
    return;
  }
  PlatformTextInputDestroyed(pointer);
  const auto found = Widgets().find(pointer);
  if (found == Widgets().end()) {
    return;
  }
  auto widget = std::move(found->second);
  Widgets().erase(found);
  widget.input->value = nullptr;
  widget.input->element.reset();
  if (!widget.input->handle.IsEmpty()) {
    InvalidatedInputs().push_back(widget.input);
  }
  if (widget.handler->owned) {
    widget.handler->notices.push_back({2, widget.input});
  }
  if (!widget.handler->functions.IsEmpty() && !State().cleaning_up) {
    if (widget.handler->functions.IsWeak()) {
      widget.handler->functions.ClearWeak();
    }
    ++widget.handler->native_roots;
    DestroyCallbacks().push_back({widget.handler, widget.input});
  }
}

std::shared_ptr<TextInputHandlerState> HandlerOf(v8::Local<v8::Value> input) {
  Rml::TextInputHandler* pointer;
  if (!ReadTextInputHandler(input, &pointer) || !pointer) {
    return {};
  }
  return HandlerHandle::TryFrom(input)->owner();
}

std::shared_ptr<InputState> InputOf(v8::Local<v8::Value> value) {
  auto* handle = InputHandle::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a TextInputContext");
    return {};
  }
  auto owner = handle->owner();
  if (!owner->value || owner->generation != State().generation) {
    Nan::ThrowError("Text input context is no longer valid");
    return {};
  }
  if (owner->element) {
    State().active_elements.push_back(owner->element.get());
  }
  return owner;
}

bool ReadIndex(v8::Local<v8::Value> value, int* output) {
  if (!value->IsInt32() || Nan::To<int>(value).FromJust() < 0) {
    Nan::ThrowRangeError("Expected a nonnegative int32 character offset");
    return false;
  }
  *output = Nan::To<int>(value).FromJust();
  return true;
}

bool ReadRange(v8::Local<v8::Value> first,
               v8::Local<v8::Value> last,
               int* start,
               int* end) {
  if (!ReadIndex(first, start) || !ReadIndex(last, end)) {
    return false;
  }
  if (*end < *start) {
    Nan::ThrowRangeError("Expected an ordered character range");
    return false;
  }
  return true;
}

NAN_METHOD(CreateHandler) {
  auto functions = Nan::New<v8::Array>(3);
  for (int i = 0; i < 3; ++i) {
    if (!info[i]->IsUndefined() && !info[i]->IsFunction()) {
      return Nan::ThrowTypeError("Expected text input handler callbacks");
    }
    Nan::Set(functions, i, info[i]).FromJust();
  }
  ClaimRuntimeSetup();
  auto owner = std::make_shared<TextInputHandlerState>();
  auto adapter = std::make_unique<NativeHandler>();
  adapter->state = owner;
  owner->value = adapter.get();
  owner->owned = std::move(adapter);
  owner->generation = HandlerGeneration();
  if (info[0]->IsFunction() || info[1]->IsFunction() || info[2]->IsFunction()) {
    owner->functions.Reset(v8::Isolate::GetCurrent(), functions);
    owner->functions.SetWeak();
  }
  Handlers()[owner->value] = owner;
  auto handle = WrapTextInputHandler(owner->value).As<v8::Object>();
  Nan::SetPrivate(
      handle, Nan::New("rml.text.input.functions").ToLocalChecked(), functions)
      .FromJust();
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(GetHandler) {
  info.GetReturnValue().Set(WrapTextInputHandler(Rml::GetTextInputHandler()));
}

NAN_METHOD(SetHandler) {
  Rml::TextInputHandler* pointer;
  if (!ReadTextInputHandler(info[0], &pointer)) {
    return;
  }
  if (auto owner = ShareHandler(pointer)) {
    if (!Globals().contains(pointer)) {
      ++owner->native_roots;
      if (owner->functions.IsWeak()) {
        owner->functions.ClearWeak();
      }
      Globals().emplace(pointer, owner);
    }
  }
  Rml::SetTextInputHandler(pointer);
}

NAN_METHOD(IsHandlerValid) {
  Rml::TextInputHandler* handler;
  if (ReadTextInputHandler(info[0], &handler)) {
    info.GetReturnValue().Set(true);
  }
}

NAN_METHOD(IsInputValid) {
  auto* handle = InputHandle::TryFrom(info[0]);
  if (!handle) {
    return Nan::ThrowTypeError("Expected a TextInputContext");
  }
  const auto& owner = handle->owner();
  info.GetReturnValue().Set(State().initialized && owner->value &&
                            owner->generation == State().generation);
}

NAN_METHOD(DrainEvents) {
  auto owner = HandlerOf(info[0]);
  if (!owner) {
    return;
  }
  auto notices = std::move(owner->notices);
  owner->notices.clear();
  // Map a native-owned immutable snapshot. Never copy the event plane into V8.
  auto kinds = std::make_shared<std::vector<uint32_t>>();
  kinds->reserve(notices.size());
  for (const auto& notice : notices) {
    kinds->push_back(notice.kind);
  }
  auto contexts = Nan::New<v8::Array>(notices.size());
  for (uint32_t i = 0; i < notices.size(); ++i) {
    Nan::Set(contexts,
             i,
             notices[i].input
                 ? v8::Local<v8::Value>(WrapInput(notices[i].input))
                 : v8::Local<v8::Value>(Nan::Null()))
        .FromJust();
  }
  auto buffer = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                  kinds,
                                  kinds->data(),
                                  kinds->size() * sizeof(uint32_t));
  auto result = Nan::New<v8::Object>();
  Nan::Set(result,
           Nan::New("kinds").ToLocalChecked(),
           v8::Uint32Array::New(buffer, 0, kinds->size()))
      .FromJust();
  Nan::Set(result, Nan::New("contexts").ToLocalChecked(), contexts).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetBoundingBox) {
  auto owner = InputOf(info[0]);
  if (!owner) {
    return;
  }
  Rml::Rectanglef rectangle;
  if (!owner->value->GetBoundingBox(rectangle)) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  auto result = Nan::New<v8::Object>();
  const char* names[] = {"x", "y", "width", "height"};
  const float values[] = {
      rectangle.Left(), rectangle.Top(), rectangle.Width(), rectangle.Height()};
  for (int i = 0; i < 4; ++i) {
    Nan::Set(result, Nan::New(names[i]).ToLocalChecked(), Nan::New(values[i]))
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetSelectionRange) {
  if (auto owner = InputOf(info[0])) {
    int start;
    int end;
    owner->value->GetSelectionRange(start, end);
    auto result = Nan::New<v8::Object>();
    Nan::Set(result, Nan::New("start").ToLocalChecked(), Nan::New(start))
        .FromJust();
    Nan::Set(result, Nan::New("end").ToLocalChecked(), Nan::New(end))
        .FromJust();
    info.GetReturnValue().Set(result);
  }
}

template <bool composition>
NAN_METHOD(SetRange) {
  auto owner = InputOf(info[0]);
  int start;
  int end;
  if (!owner || !ReadRange(info[1], info[2], &start, &end)) {
    return;
  }
  if constexpr (composition) {
    owner->value->SetCompositionRange(start, end);
  } else {
    owner->value->SetSelectionRange(start, end);
  }
}

NAN_METHOD(SetCursorPosition) {
  auto owner = InputOf(info[0]);
  int position;
  if (owner && ReadIndex(info[1], &position)) {
    owner->value->SetCursorPosition(position);
  }
}

template <bool composition>
NAN_METHOD(SetText) {
  auto owner = InputOf(info[0]);
  if (!owner) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a text string");
  }
  Nan::Utf8String text(info[1]);
  const Rml::StringView value(*text, *text + text.length());
  if constexpr (composition) {
    owner->value->CommitComposition(value);
  } else {
    int start;
    int end;
    if (ReadRange(info[2], info[3], &start, &end)) {
      owner->value->SetText(value, start, end);
    }
  }
}

template <Nan::FunctionCallback callback, bool require_initialized = true>
void InputBoundary(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  RuntimeScope scope(
      require_initialized, true, false, false, false, false, true);
  if (scope) {
    State().data_diagnostics.Record(&DataDiagnostics::runtime_entries);
    Nan::TryCatch caught;
    callback(info);
    if (caught.HasCaught()) {
      if (State().boundary_depth == 1) {
        CaptureCallbackException(caught.Exception());
      } else {
        caught.ReThrow();
      }
    }
  }
}

}  // namespace

struct ContextInputOwnership {
  std::shared_ptr<TextInputHandlerState> handler;
  std::shared_ptr<InputOwners::Lease> lease;
};

TextInputHandlerState::~TextInputHandlerState() {
  if (value) {
    const auto found = Handlers().find(value);
    if (found != Handlers().end() && found->second.expired()) {
      Handlers().erase(found);
    }
  }
}

bool ReadTextInputHandler(v8::Local<v8::Value> input,
                          Rml::TextInputHandler** output) {
  *output = nullptr;
  if (input->IsNull()) {
    return true;
  }
  auto* handle = HandlerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a TextInputHandler or null");
    return false;
  }
  const auto& owner = handle->owner();
  if (!owner->value || owner->generation != HandlerGeneration()) {
    Nan::ThrowError("Text input handler is no longer valid");
    return false;
  }
  *output = owner->value;
  return true;
}

v8::Local<v8::Value> WrapTextInputHandler(Rml::TextInputHandler* handler) {
  auto owner = ShareHandler(handler);
  if (!owner) {
    return Nan::Null();
  }
  if (!owner->handle.IsEmpty()) {
    return owner->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = HandlerHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  if (!owner->functions.IsEmpty()) {
    Nan::SetPrivate(handle,
                    Nan::New("rml.text.input.functions").ToLocalChecked(),
                    owner->functions.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  return handle;
}

void TrackContextTextInputHandler(const std::shared_ptr<ContextState>& token) {
  if (token->input_ownership) {
    return;
  }
  if (auto handler = ShareHandler(token->context->GetTextInputHandler())) {
    auto ownership = std::make_shared<ContextInputOwnership>();
    ownership->handler = handler;
    if (!handler->functions.IsEmpty()) {
      ownership->lease =
          Owners().Add(handler, token->context->GetRootElement());
    }
    token->input_ownership = std::move(ownership);
  }
}

void InstallTextInputNotifications() {
  Rml::TextInputContext::SetLifetimeCallbackForBinding(InputLifetimeChanged);
  Rml::TextInputContext::SetFocusCallbackForBinding(PlatformTextInputFocus);
  Rml::TextInputContext::SetCaretCallbackForBinding(PlatformTextInputCaret);
}

void RefreshTextInputOwnership() {
  Owners().Refresh(DiagnosticOwnership::kTextInput);
}

void DrainTextInputDestroyCallbacks() {
  auto invalidated = std::move(InvalidatedInputs());
  InvalidatedInputs().clear();
  for (const auto& input : invalidated) {
    if (!input->handle.IsEmpty() && !State().cleaning_up) {
      Nan::SetPrivate(input->handle.Get(v8::Isolate::GetCurrent()),
                      Nan::New("rml.text.input.element").ToLocalChecked(),
                      Nan::Undefined())
          .FromJust();
    }
  }
  while (!DestroyCallbacks().empty()) {
    auto notices = std::move(DestroyCallbacks());
    DestroyCallbacks().clear();
    for (const auto& notice : notices) {
      Invoke(notice.handler, 2, notice.input);
      --notice.handler->native_roots;
      if (!notice.handler->native_roots &&
          !notice.handler->functions.IsEmpty() &&
          !notice.handler->functions.IsWeak()) {
        notice.handler->functions.SetWeak();
      }
    }
  }
}

void ReleaseTextInputBindings() {
  ReleasePlatformTextInput();
  Rml::TextInputContext::SetFocusCallbackForBinding(nullptr);
  Rml::TextInputContext::SetCaretCallbackForBinding(nullptr);
  Rml::TextInputContext::SetLifetimeCallbackForBinding(nullptr);
  DestroyCallbacks().clear();
  InvalidatedInputs().clear();
  Owners().Clear();
  Widgets().clear();
  for (const auto& [pointer, weak] : Handlers()) {
    if (auto owner = weak.lock()) {
      owner->functions.Reset();
      owner->handle.Reset();
      owner->notices.clear();
      owner->value = nullptr;
      owner->generation = 0;
      owner->owned.reset();
    }
  }
  Globals().clear();
  Handlers().clear();
}

NAN_MODULE_INIT(InitializeRmlTextInput) {
  SetRuntimeMethod<CreateHandler, false, false>(target,
                                                "createTextInputHandler");
  SetRuntimeMethod<GetHandler, false, false>(target, "getTextInputHandler");
  SetRuntimeMethod<SetHandler, false, false>(target, "setTextInputHandler");
  SetRuntimeMethod<IsHandlerValid, true, false, false, true, true>(
      target, "isTextInputHandlerValid");
  SetRuntimeMethod<DrainEvents, false, false>(target, "drainTextInputEvents");
  sfmljs::SetMethod<InputBoundary<IsInputValid, false>>(
      target, "isTextInputContextValid");
  sfmljs::SetMethod<InputBoundary<GetBoundingBox>>(target,
                                                   "textInputGetBoundingBox");
  sfmljs::SetMethod<InputBoundary<GetSelectionRange>>(
      target, "textInputGetSelectionRange");
  sfmljs::SetMethod<InputBoundary<SetRange<false>>>(
      target, "textInputSetSelectionRange");
  sfmljs::SetMethod<InputBoundary<SetRange<true>>>(
      target, "textInputSetCompositionRange");
  sfmljs::SetMethod<InputBoundary<SetCursorPosition>>(
      target, "textInputSetCursorPosition");
  sfmljs::SetMethod<InputBoundary<SetText<false>>>(target, "textInputSetText");
  sfmljs::SetMethod<InputBoundary<SetText<true>>>(target,
                                                  "textInputCommitComposition");
}

}  // namespace sfmlrmlui
