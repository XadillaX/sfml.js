// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <window-input-backend.h>

#include <exception>

#include "native/platform/ime/windows/text-input-state.h"

namespace sfmlrmlui::ime::windows {
namespace {

void Enter(TextInputState* state,
           sfmljs::interop::WindowInputMessage* message) {
  using Kind = CompositionDelivery::Kind;
  const bool key =
      message->message == WM_KEYDOWN || message->message == WM_SYSKEYDOWN;
  const bool ime_character = message->message == WM_IME_CHAR ||
                             (message->message == WM_IME_COMPOSITION &&
                              (message->lparam & GCS_RESULTSTR));
  Kind kind = Kind::kOther;
  if (key) {
    kind = Kind::kKey;
  } else if (ime_character) {
    kind = Kind::kImeCharacter;
  } else if (message->message == WM_CHAR) {
    kind = Kind::kCharacter;
  }
  state->delivery.Enter(message,
                        kind,
                        state->accepting && (state->composing ||
                                             message->wparam == VK_PROCESSKEY));
  if (!state->accepting) {
    return;
  }
  switch (message->message) {
    case WM_IME_SETCONTEXT:
      // SFML forwards this snapshot to the original/default procedure. Keep
      // native candidates, while the RmlUi widget owns preedit presentation.
      message->lparam &= ~static_cast<LPARAM>(ISC_SHOWUICOMPOSITIONWINDOW);
      break;
    case WM_IME_STARTCOMPOSITION:
      state->queue.Cancel();
      state->composing = true;
      break;
    case WM_IME_COMPOSITION:
      ReadComposition(state, message->lparam);
      break;
    case WM_IME_ENDCOMPOSITION:
    case WM_KILLFOCUS:
      state->queue.Cancel();
      state->composing = false;
      break;
    default:
      break;
  }
}

}  // namespace

bool AttachInput(const std::shared_ptr<TextInputState>& state) {
  sfmljs::interop::WindowInputCallbacks callbacks;
  callbacks.owner = state;
  callbacks.native = [](const auto& owner, void* message, bool entering) {
    const auto state = std::static_pointer_cast<TextInputState>(owner);
    if (!entering) {
      state->delivery.Leave(message);
      return;
    }
    try {
      Enter(state.get(),
            static_cast<sfmljs::interop::WindowInputMessage*>(message));
    } catch (...) {
      state->queue.Fail(std::current_exception());
    }
  };
  callbacks.event = [](const auto& owner, const sf::Event& event) {
    const auto state = std::static_pointer_cast<TextInputState>(owner);
    if (!state->accepting) {
      return std::shared_ptr<void>{};
    }
    try {
      return std::static_pointer_cast<void>(
          state->queue.Event(event, state->delivery.handled()));
    } catch (...) {
      state->queue.Fail(std::current_exception());
      return std::shared_ptr<void>{};
    }
  };
  callbacks.closed = [](const auto& owner) {
    const auto state = std::static_pointer_cast<TextInputState>(owner);
    state->queue.Close();
    state->accepting = false;
    state->composing = false;
    state->attached = false;
    state->window = nullptr;
  };
  state->attached = sfmljs::interop::detail::RegisterWindowInput(
      reinterpret_cast<uintptr_t>(state->window), &callbacks);
  return state->attached;
}

}  // namespace sfmlrmlui::ime::windows
