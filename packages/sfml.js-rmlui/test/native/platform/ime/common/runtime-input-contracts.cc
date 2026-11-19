// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>

#include <memory>
#include <string>
#include <utility>

#include "native/platform/ime/deferred-text-input.h"
#include "native/runtime/rmlui-state.h"
#include "platform/event-queue.h"
#if __has_include("native/platform/ime/runtime-input.h")
#include "native/platform/ime/runtime-input.h"
#endif

namespace {

sfmljs::interop::detail::WindowEventQueue queue;
sfmlrmlui::ime::DeferredTextInput edits;
Rml::TextInputContext::FocusCallbackForBinding previous_focus = nullptr;
Rml::TextInputContext* focused_input = nullptr;

void CaptureFocus(Rml::TextInputContext* input,
                  Rml::Element* element,
                  bool active) {
  if (previous_focus) {
    previous_focus(input, element, active);
  }
  if (active) {
    focused_input = input;
  }
}

NAN_METHOD(EnableEdits) {
  sfmlrmlui::RuntimeScope scope;
  if (!scope) {
    return;
  }
  auto* context = sfmlrmlui::ContextOf(info[0]);
  auto* element = context ? context->GetFocusElement() : nullptr;
  if (!element) {
    Nan::ThrowError("Focus an actual text widget before enabling edits");
    return;
  }
  element->Blur();
  previous_focus = Rml::TextInputContext::FocusCallbackSlotForBinding();
  focused_input = nullptr;
  Rml::TextInputContext::SetFocusCallbackForBinding(CaptureFocus);
  element->Focus();
  Rml::TextInputContext::SetFocusCallbackForBinding(previous_focus);
  if (!focused_input) {
    Nan::ThrowError("The actual widget did not report its text input context");
    return;
  }
  auto session = std::make_shared<sfmlrmlui::ime::TextInputSession>(
      focused_input, element);
  session->EnableLayoutCapture();
  edits.Activate(std::move(session));
}

NAN_METHOD(EnqueueEdit) {
  Nan::Utf8String text(info[0]);
  queue.DeferGuarded([value = std::string(*text, text.length())] {
#if __has_include("native/platform/ime/runtime-input.h")
    return sfmlrmlui::ime::InterpretWindowInput([&] {
      edits.Mark(value, {1, 1});
      sfmlrmlui::ime::DrainRuntimeTextInput(&edits);
    });
#else
    Nan::ThrowError("Guarded RmlUi input editing is not implemented");
    return sfmljs::interop::WindowInputResult::kRejected;
#endif
  });
}

NAN_METHOD(ResetEdits) {
  sfmlrmlui::RuntimeScope scope;
  if (scope) {
    edits.Deactivate(true);
  }
}

NAN_METHOD(ReceiverCount) {
  info.GetReturnValue().Set(Nan::New(
      static_cast<uint32_t>(sfmlrmlui::State().active_elements.size())));
}

NAN_METHOD(Enqueue) {
  auto callback = std::make_shared<v8::Global<v8::Function>>(
      info.GetIsolate(), info[0].As<v8::Function>());
  queue.DeferGuarded([callback] {
#if __has_include("native/platform/ime/runtime-input.h")
    return sfmlrmlui::ime::InterpretWindowInput([&] {
      (void)Nan::Call(
          v8::Local<v8::Function>::New(v8::Isolate::GetCurrent(), *callback),
          Nan::GetCurrentContext()->Global(),
          0,
          nullptr);
    });
#else
    Nan::ThrowError("Guarded RmlUi input interpretation is not implemented");
    return sfmljs::interop::WindowInputResult::kRejected;
#endif
  });
}

NAN_METHOD(Poll) {
  try {
    (void)queue.Pop();
  } catch (const std::exception& error) {
    Nan::ThrowError(error.what());
  }
}

NAN_METHOD(Inspect) {
  auto result = Nan::New<v8::Object>();
  Nan::Set(result,
           Nan::New("depth").ToLocalChecked(),
           Nan::New(sfmlrmlui::State().boundary_depth))
      .FromJust();
  Nan::Set(result,
           Nan::New("canInvoke").ToLocalChecked(),
           Nan::New(sfmlrmlui::CanInvokeCallback()))
      .FromJust();
  info.GetReturnValue().Set(result);
}

void Initialize(v8::Local<v8::Object> target, v8::Local<v8::Value>, void*) {
  Nan::SetMethod(target, "enableEdits", EnableEdits);
  Nan::SetMethod(target, "enqueueEdit", EnqueueEdit);
  Nan::SetMethod(target, "resetEdits", ResetEdits);
  Nan::SetMethod(target, "receiverCount", ReceiverCount);
  Nan::SetMethod(target, "enqueue", Enqueue);
  Nan::SetMethod(target, "poll", Poll);
  Nan::SetMethod(target, "inspect", Inspect);
}

NODE_MODULE(runtime_input_contracts, Initialize)

}  // namespace
