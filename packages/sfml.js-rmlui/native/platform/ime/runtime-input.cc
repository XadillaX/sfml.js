// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/ime/runtime-input.h"

#include "native/platform/ime/deferred-text-input.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui::ime {

sfmljs::interop::WindowInputResult InterpretWindowInput(
    const std::function<void()>& action) {
  using sfmljs::interop::WindowInputResult;
  auto result = WindowInputResult::kRejected;
  Nan::TryCatch caught;
  {
    RuntimeScope scope;
    if (scope && CanInvokeCallback()) {
      result = WindowInputResult::kComplete;
      try {
        action();
      } catch (...) {
        if (caught.HasCaught()) {
          CaptureCallbackException(caught.Exception());
        }
        // A native formatter may unwind after a JS font callback failed.
        // Preserve the original host exception through ownership refresh.
        if (State().callback_exception.IsEmpty()) {
          throw;
        }
      }
      if (caught.HasCaught()) {
        CaptureCallbackException(caught.Exception());
      }
      if (!State().callback_exception.IsEmpty()) {
        result = WindowInputResult::kInterrupted;
      }
    }
  }
  if (caught.HasCaught()) {
    // Deferred destruction/ownership callbacks may fail in the scope's exit.
    // Do not let the next native interpreter absorb that pending host error.
    if (result == WindowInputResult::kComplete) {
      result = WindowInputResult::kInterrupted;
    }
    caught.ReThrow();
  }
  return result;
}

void DrainRuntimeTextInput(DeferredTextInput* queue) {
  if (!CanInvokeCallback()) {
    return;
  }
  const size_t depth = State().active_elements.size();
  const auto protect = [&] {
    const auto session = queue->active_session();
    auto* element = session ? session->element() : nullptr;
    auto& active = State().active_elements;
    if (element && (active.size() == depth || active.back() != element)) {
      active.push_back(element);
    }
  };
  protect();
  try {
    queue->Drain([&] {
      if (!CanInvokeCallback()) {
        return false;
      }
      protect();
      return true;
    });
  } catch (...) {
    State().active_elements.resize(depth);
    throw;
  }
  State().active_elements.resize(depth);
}

}  // namespace sfmlrmlui::ime
