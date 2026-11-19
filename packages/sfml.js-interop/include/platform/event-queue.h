// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_INTEROP_INCLUDE_PLATFORM_EVENT_QUEUE_H_
#define PACKAGES_SFML_JS_INTEROP_INCLUDE_PLATFORM_EVENT_QUEUE_H_

#include <deque>
#include <functional>
#include <memory>
#include <optional>
#include <utility>

#include "../window-input-callbacks.h"
#include <SFML/Window/Event.hpp>

namespace sfmljs::interop::detail {

// Native collection records an interpreter without invoking it. Runtime
// polling executes it before returning its real SFML events. Generated output
// keeps its native delivery's position ahead of later collected deliveries.
class WindowEventQueue final {
 private:
  struct Entry {
    std::optional<sf::Event> event;
    std::shared_ptr<void> source;
    std::function<WindowInputResult()> interpret;
  };

  struct State {
    std::deque<Entry> pending;
    std::deque<Entry> generated;
    std::shared_ptr<void> retirement;
    unsigned polling{0};
    bool active{false};
    bool blocked{false};
    bool closed{false};
  };

 public:
  struct Delivery {
    sf::Event event;
    std::shared_ptr<void> source;
  };

  WindowEventQueue() = default;
  ~WindowEventQueue() { Close(); }
  WindowEventQueue(const WindowEventQueue&) = delete;
  WindowEventQueue& operator=(const WindowEventQueue&) = delete;

  class Polling final {
   public:
    ~Polling() {
      if (--state_->polling == 0 && !state_->active) {
        state_->retirement.reset();
      }
    }
    Polling(const Polling&) = delete;
    Polling& operator=(const Polling&) = delete;
    bool Closed() const { return state_->closed; }

   private:
    explicit Polling(std::shared_ptr<State> state) : state_(std::move(state)) {
      ++state_->polling;
    }
    std::shared_ptr<State> state_;
    friend class WindowEventQueue;
  };

  // waitEvent may continue after a delivery generated no SFML event. Its
  // native host must survive until that outer polling stack has returned.
  Polling PollingScope() const { return Polling(state_); }
  bool Active() const { return state_->active; }
  bool Blocked() const { return state_->blocked; }

  bool Empty() const {
    // A nested poll must not repopulate the OS queue of its active interpreter.
    if (state_->active) {
      return false;
    }
    return state_->closed ||
           (state_->generated.empty() && state_->pending.empty());
  }

  void Push(const sf::Event& event, std::shared_ptr<void> source = {}) {
    if (!state_->closed) {
      auto& output = state_->active ? state_->generated : state_->pending;
      output.push_back({event, std::move(source), {}});
    }
  }

  void Defer(std::function<void()> interpret) {
    if (interpret) {
      DeferGuarded([interpret = std::move(interpret)] {
        interpret();
        return WindowInputResult::kComplete;
      });
    }
  }

  // A rejected runtime entry has executed no native input. Keep that delivery
  // at the front for the next permitted poll, without allocating on rejection.
  void DeferGuarded(std::function<WindowInputResult()> interpret) {
    if (!state_->closed && interpret) {
      state_->pending.push_back({{}, {}, std::move(interpret)});
    }
  }

  std::optional<Delivery> Pop() {
    // A callback may destroy this queue. From here on, retain and access only
    // its native state; no reference into either deque survives interpretation.
    const auto state = state_;
    if (state->active || state->closed) {
      return {};
    }
    state->blocked = false;
    const Interpretation scope(state);
    while (!state->closed &&
           (!state->generated.empty() || !state->pending.empty())) {
      const bool generated = !state->generated.empty();
      auto entry = std::move(generated ? state->generated.front()
                                       : state->pending.front());
      if (entry.interpret) {
        // Leave a slot in pending, but retain no deque reference across the
        // callback. Close may clear it or destroy the entire native host.
        try {
          const auto result = entry.interpret();
          if (result == WindowInputResult::kRejected) {
            if (!state->closed) {
              state->pending.front() = std::move(entry);
              state->blocked = true;
            }
            return {};
          }
          if (!state->closed) {
            state->pending.pop_front();
          }
          // The delivery ran but its runtime raised an exception. Return to
          // that host now; generated output remains before the next delivery.
          if (result == WindowInputResult::kInterrupted) {
            state->blocked = true;
            return {};
          }
        } catch (...) {
          if (!state->closed) {
            state->pending.pop_front();
          }
          throw;
        }
      } else {
        (generated ? state->generated : state->pending).pop_front();
        return Delivery{std::move(*entry.event), std::move(entry.source)};
      }
    }
    return {};
  }

  // One queue belongs to one native host. Closing discards pending sources
  // immediately; an optional retired host survives the active Pop stack.
  void Close(std::shared_ptr<void> retirement = {}) {
    state_->closed = true;
    state_->generated.clear();
    state_->pending.clear();
    if ((state_->active || state_->polling) && retirement) {
      state_->retirement = std::move(retirement);
    }
  }

 private:
  class Interpretation final {
   public:
    explicit Interpretation(std::shared_ptr<State> state)
        : state_(std::move(state)) {
      state_->active = true;
    }
    ~Interpretation() {
      // Output emitted before an exception remains ahead of later input.
      // Queue unwinding needs no merging or allocation. Retire the native
      // host only after the interpreter and its captured entry have returned.
      state_->active = false;
      if (!state_->polling) {
        state_->retirement.reset();
      }
    }
    Interpretation(const Interpretation&) = delete;
    Interpretation& operator=(const Interpretation&) = delete;

   private:
    std::shared_ptr<State> state_;
  };

  std::shared_ptr<State> state_{std::make_shared<State>()};
};

}  // namespace sfmljs::interop::detail

#endif  // PACKAGES_SFML_JS_INTEROP_INCLUDE_PLATFORM_EVENT_QUEUE_H_
