// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_CALLBACKS_H_
#define PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_CALLBACKS_H_

#include <cstdint>
#include <functional>
#include <memory>

#include <SFML/Window/Event.hpp>

namespace sfmljs::interop {

enum class WindowInputResult { kRejected, kComplete, kInterrupted };

// Private SFML extension protocol. The installer copies this exact header
// into the rebuilt Window library, so both sides share the same definitions.
// Collection callbacks only copy OS state. The optional interpreter runs at
// deferred polling and brackets the entire native delivery with its runtime.
struct WindowInputCallbacks {
  std::shared_ptr<void> owner;
  std::shared_ptr<void> (*event)(const std::shared_ptr<void>&,
                                 const sf::Event&) = nullptr;
  void (*native)(const std::shared_ptr<void>&, void*, bool) = nullptr;
  // XFilterEvent's actual result, reported before its SFML KeyPressed entry.
  void (*filtered)(const std::shared_ptr<void>&, bool) = nullptr;
  void (*closed)(const std::shared_ptr<void>&) = nullptr;
  void* (*configure)(const std::shared_ptr<void>&,
                     void* display,
                     void* input_method,
                     void* current_context) = nullptr;
  // Rejection ran no native work; interruption stops after this delivery.
  WindowInputResult (*interpret)(const std::shared_ptr<void>&,
                                 const std::function<void()>&) = nullptr;
};

// The Win32 pump passes a stack snapshot to native(). X11 passes XEvent.
// Enter/leave calls bracket the original native handler, including nesting.
// Win32 clients may clear composition-UI bits in lparam before SFML forwards
// WM_IME_SETCONTEXT; message identity and all other parameters stay original.
struct WindowInputMessage {
  uint32_t message;
  uintptr_t wparam;
  intptr_t lparam;
};

}  // namespace sfmljs::interop

#endif  // PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_CALLBACKS_H_
