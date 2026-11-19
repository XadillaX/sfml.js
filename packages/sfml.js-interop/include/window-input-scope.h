// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_SCOPE_H_
#define PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_SCOPE_H_

#include <memory>

#include "window-input-registry.h"

namespace sfmljs::interop::detail {

// One stack entry for each actual native delivery, including nested default
// window procedures. Retaining its client makes detach/replacement safe.
class WindowInputScope final {
 public:
  WindowInputScope(const WindowInputRegistry& registry,
                   uintptr_t handle,
                   void* event,
                   bool current = true)
      : handle_(handle),
        event_(event),
        client_(current ? registry.Client(handle) : nullptr),
        previous_(current_) {
    current_ = this;
    try {
      if (client_ && client_->native) {
        client_->native(client_->owner, event_, true);
      }
    } catch (...) {
      current_ = previous_;
      throw;
    }
  }

  ~WindowInputScope() {
    if (client_ && client_->native) {
      client_->native(client_->owner, event_, false);
    }
    current_ = previous_;
  }

  WindowInputScope(const WindowInputScope&) = delete;
  WindowInputScope& operator=(const WindowInputScope&) = delete;

  static void Filtered(bool filtered) {
    if (current_ && current_->client_ && current_->client_->filtered) {
      const auto& client = current_->client_;
      client->filtered(client->owner, filtered);
    }
  }

  static std::shared_ptr<void> Capture(const WindowInputRegistry& registry,
                                       uintptr_t handle,
                                       const sf::Event& event) {
    if (!event.is<sf::Event::KeyPressed>() &&
        !event.is<sf::Event::TextEntered>()) {
      return {};
    }
    if (current_ && current_->handle_ == handle) {
      const auto& client = current_->client_;
      return client ? client->event(client->owner, event) : nullptr;
    }
    return registry.Capture(handle, event);
  }

 private:
  uintptr_t handle_;
  void* event_;
  std::shared_ptr<WindowInputCallbacks> client_;
  WindowInputScope* previous_;
  static inline thread_local WindowInputScope* current_{nullptr};
};

}  // namespace sfmljs::interop::detail

#endif  // PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_SCOPE_H_
