// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <window-input-backend.h>

#include <exception>

#include "native/platform/ime/runtime-input.h"
#include "native/platform/ime/x11/text-input-state.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui::ime::x11 {
namespace {

class Interpretation final {
 public:
  explicit Interpretation(TextInputState* state)
      : state_(state),
        flush_(state->flush),
        can_continue_(state->can_continue) {
    state_->flush = DrainRuntimeTextInput;
    state_->can_continue = CanInvokeCallback;
  }
  ~Interpretation() {
    state_->flush = flush_;
    state_->can_continue = can_continue_;
  }
  Interpretation(const Interpretation&) = delete;
  Interpretation& operator=(const Interpretation&) = delete;

 private:
  TextInputState* state_;
  void (*flush_)(DeferredTextInput*);
  bool (*can_continue_)();
};

}  // namespace

bool AttachInput(const std::shared_ptr<TextInputState>& state) {
  sfmljs::interop::WindowInputCallbacks callbacks;
  callbacks.owner = state;
  callbacks.interpret = [](const auto& owner,
                           const std::function<void()>& action) {
    const auto state = std::static_pointer_cast<TextInputState>(owner);
    return InterpretWindowInput([&] {
      const Interpretation interpretation(state.get());
      action();
      DrainRuntimeTextInput(&state->queue);
    });
  };
  callbacks.configure =
      [](const auto& owner, void* display, void* method, void*) -> void* {
    const auto state = std::static_pointer_cast<TextInputState>(owner);
    try {
      return CreateInputContext(state.get(),
                                static_cast<Display*>(display),
                                static_cast<XIM>(method));
    } catch (...) {
      state->queue.Fail(std::current_exception());
      return nullptr;
    }
  };
  callbacks.native = [](const auto& owner, void* payload, bool entering) {
    const auto state = std::static_pointer_cast<TextInputState>(owner);
    if (!entering) {
      if (!state->deliveries.empty() &&
          state->deliveries.back().identity == payload) {
        state->deliveries.pop_back();
      }
      return;
    }
    try {
      state->deliveries.push_back({payload, false});
      const auto* event = static_cast<XEvent*>(payload);
      if (event->type == FocusOut && state->accepting) {
        state->preedit.Reset(&state->queue);
      }
    } catch (...) {
      state->queue.Fail(std::current_exception());
    }
  };
  callbacks.filtered = [](const auto& owner, bool filtered) {
    const auto state = std::static_pointer_cast<TextInputState>(owner);
    if (!state->deliveries.empty()) {
      state->deliveries.back().filtered = filtered;
    }
  };
  callbacks.event = [](const auto& owner, const sf::Event& event) {
    const auto state = std::static_pointer_cast<TextInputState>(owner);
    if (!state->accepting) {
      return std::shared_ptr<void>{};
    }
    try {
      const bool filtered =
          !state->deliveries.empty() && state->deliveries.back().filtered;
      return std::static_pointer_cast<void>(
          state->queue.Event(event, filtered));
    } catch (...) {
      state->queue.Fail(std::current_exception());
      return std::shared_ptr<void>{};
    }
  };
  callbacks.closed = [](const auto& owner) {
    const auto state = std::static_pointer_cast<TextInputState>(owner);
    state->queue.Close();
    state->accepting = false;
    state->attached = false;
    state->preedit.Clear();
    state->window = 0;
    state->context = nullptr;
    state->display = nullptr;
  };
  state->attached = sfmljs::interop::detail::RegisterWindowInput(
      static_cast<uintptr_t>(state->window), &callbacks);
  return state->attached;
}

}  // namespace sfmlrmlui::ime::x11
