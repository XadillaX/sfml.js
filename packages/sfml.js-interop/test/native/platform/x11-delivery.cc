// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cassert>
#include <chrono>  // NOLINT(build/c++11)
#include <deque>
#include <iostream>
#include <memory>
#include <vector>

#include "platform/event-queue.h"
#include "window-input-scope.h"
#include <SFML/System/Sleep.hpp>
#include <SFML/System/Time.hpp>

namespace {

using sf::Event;
using sf::milliseconds;
using sf::sleep;
using sf::Time;
using sfmljs::interop::WindowInputResult;

// Only the unavailable X server is substituted. Collection and, once
// connected, deferral execute the exact prepared SFML function bodies.
enum { kKeyPress = 2, kKeyRelease = 3, kClientMessage = 33 };
using XPointer = char*;
struct XKeyEvent {
  unsigned keycode;
  uint64_t time;
};
struct XEvent {
  int type;
  XKeyEvent xkey;
};
std::deque<XEvent> server_events;
bool XCheckIfEvent(void*, XEvent* event, void*, XPointer) {
  if (server_events.empty()) {
    return false;
  }
  *event = server_events.front();
  server_events.pop_front();
  return true;
}
namespace WindowImplX11Impl {
void* check_event = nullptr;
}  // namespace WindowImplX11Impl
struct ClipboardImpl {
  static void processEvents() {}
};

sfmljs::interop::detail::WindowInputRegistry registry;
namespace sfmljs_backend {
auto& windowInputs() {
  return registry;
}
uintptr_t windowInputHandle(uintptr_t handle) {
  return handle;
}
std::shared_ptr<void>& currentEventSource() {
  static std::shared_ptr<void> source;
  return source;
}
std::shared_ptr<void>& poppedEventSource() {
  static std::shared_ptr<void> source;
  return source;
}
}  // namespace sfmljs_backend

class WindowImpl {
 public:
  virtual ~WindowImpl() = default;
  std::optional<Event> pollEvent();
  std::optional<Event> waitEvent(Time timeout);
  void closeEventQueue(std::shared_ptr<WindowImpl> retirement);

 protected:
  void deferEvent(std::function<void()> interpret);
  void deferGuardedEvent(std::function<WindowInputResult()> interpret);
  void pushEvent(const Event& event);
  virtual void populateEventQueue() = 0;
  virtual uintptr_t getNativeHandle() const = 0;
  sfmljs::interop::detail::WindowEventQueue events_;

 private:
  std::optional<Event> popEvent();
  std::shared_ptr<sfmljs::interop::WindowInputCallbacks> retired_input_client_;
};

class WindowImplX11 final : public WindowImpl {
 public:
  std::vector<int> interpreted;
  std::function<void()> collecting;
  std::function<void()> interpreting;
  std::function<void()> destroyed;
  bool input_current{true};
  ~WindowImplX11() override {
    if (destroyed) {
      destroyed();
    }
  }
  void processEvents();
  void deferEvent(XEvent event) {
#if defined(SFMLJS_DEFERRED_DELIVERY)
#define windowEvent event
#define m_window window_
#include "x11-defer-body.inc"
#undef m_window
#undef windowEvent
#else
    processEvent(event);
#endif
  }
  void PollAll() {
    while (pollEvent()) {
    }
  }
  void Repeat(bool enabled) { key_repeat_ = enabled; }

 private:
  bool processEvent(const XEvent& event, bool current = true) {
    input_current = current;
    interpreted.push_back(event.type);
    if (interpreting) {
      interpreting();
    }
    if (event.type != kClientMessage) {
      pushEvent(sf::Event::FocusGained{});
    }
    return true;
  }
  void populateEventQueue() override {
    if (collecting) {
      collecting();
    }
    processEvents();
  }
  uintptr_t getNativeHandle() const override { return window_; }
  std::shared_ptr<int> display_;
  uintptr_t window_{81};
  bool key_repeat_{true};
};

#define m_display display_
#define m_window window_
#define m_keyRepeat key_repeat_
#define KeyPress kKeyPress
#define KeyRelease kKeyRelease
#define checkEvent check_event
#include "x11-collect-body.inc"
#undef checkEvent
#undef KeyRelease
#undef KeyPress
#undef m_keyRepeat
#undef m_window
#undef m_display
#define m_events events_
#define m_retiredInputClient retired_input_client_
#include "x11-poll-body.inc"
#define empty Empty
#include "x11-wait-body.inc"
#undef empty
#include "x11-enqueue-body.inc"
#if defined(SFMLJS_GUARDED_DELIVERY)
#include "x11-guarded-body.inc"
#endif
#include "x11-pop-body.inc"
#include "x11-push-body.inc"
#include "x11-retire-body.inc"
#undef m_retiredInputClient
#undef m_events

void Collection() {
  registry.Open(81);
  WindowImplX11 host;
  server_events = {{kClientMessage, {}}, {kKeyPress, {7, 10}}};
  host.processEvents();
  assert(host.interpreted.empty() &&
         "SFML invoked native interpretation inside its X server pump");
  host.PollAll();
  assert((host.interpreted == std::vector<int>{kClientMessage, kKeyPress}));
  std::cout << "PASS actual SFML collection defers ordered native delivery\n";
}

void Repeats() {
  for (bool repeat : {false, true}) {
    WindowImplX11 host;
    host.Repeat(repeat);
    server_events = {{kKeyRelease, {7, 10}},
                     {kKeyPress, {7, 11}},
                     {kKeyRelease, {7, 20}},
                     {kClientMessage, {}},
                     {kKeyPress, {8, 30}}};
    host.processEvents();
    assert(host.interpreted.empty());
    host.PollAll();
    const std::vector<int> expected =
        repeat ? std::vector<int>{kKeyPress,
                                  kKeyRelease,
                                  kClientMessage,
                                  kKeyPress}
               : std::vector<int>{kKeyRelease, kClientMessage, kKeyPress};
    assert(host.interpreted == expected);
  }
  std::cout << "PASS actual SFML collection preserves both key-repeat modes\n";
}

void Replacement() {
  WindowImplX11 host;
  server_events = {{kClientMessage, {}}};
  host.processEvents();
  sfmljs::interop::WindowInputCallbacks client;
  client.owner = std::make_shared<int>(1);
  client.event = [](const auto& owner, const sf::Event&) { return owner; };
  assert(registry.Attach(81, &client));
  host.PollAll();
  assert(!host.input_current);
  assert((host.interpreted == std::vector<int>{kClientMessage}));
  registry.Close(81);
  std::cout
      << "PASS replaced XIC suppresses stale input and keeps WM delivery\n";
}

void WaitCallbacks() {
  registry.Open(81);
  WindowImplX11 host;
  int collections = 0;
  host.collecting = [&] {
    if (++collections == 2) {
      server_events.push_back({kKeyPress, {7, 30}});
    }
  };
  server_events = {{kClientMessage, {}}};
  const auto event = host.waitEvent(milliseconds(500));
  assert(event && event->is<Event::FocusGained>() &&
         "waitEvent returned before callback-only native delivery was drained");
  assert(collections == 2);
  assert((host.interpreted == std::vector<int>{kClientMessage, kKeyPress}));
  assert(!host.waitEvent(milliseconds(1)));
  registry.Close(81);
  std::cout << "PASS actual SFML wait continues after callback-only delivery\n";
}

void WaitRetirement() {
  registry.Open(81);
  auto owner = std::make_unique<WindowImplX11>();
  auto* host = owner.get();
  bool destroyed = false;
  host->destroyed = [&] { destroyed = true; };
  host->interpreting = [&] {
    assert(!host->pollEvent());
    assert(!host->waitEvent(Time::Zero));
    auto retirement = std::shared_ptr<WindowImpl>(std::move(owner));
    host->closeEventQueue(std::move(retirement));
    assert(!destroyed && !registry.Delivery(81).Current());
  };
  server_events = {{kClientMessage, {}}, {kKeyPress, {7, 30}}};
  assert(!host->waitEvent(Time::Zero));
  assert(destroyed && !owner);
  std::cout << "PASS actual SFML wait retires callback-closed hosts safely\n";
}

template <typename Callbacks>
void GuardedWait() {
  registry.Open(81);
  Callbacks client;
  client.owner = std::make_shared<int>(1);
  client.event = [](const auto& owner, const sf::Event&) { return owner; };
  bool allowed = false;
  int attempts = 0;
  if constexpr (requires { client.interpret; }) {
    struct Guard {
      bool* allowed;
      int* attempts;
    };
    client.owner = std::make_shared<Guard>(Guard{&allowed, &attempts});
    client.interpret = [](const auto& owner,
                          const std::function<void()>& action) {
      const auto guard = std::static_pointer_cast<Guard>(owner);
      ++*guard->attempts;
      if (!*guard->allowed) {
        return WindowInputResult::kRejected;
      }
      action();
      return WindowInputResult::kComplete;
    };
    assert(registry.Attach(81, &client));
    WindowImplX11 host;
    server_events = {{kClientMessage, {}}, {kKeyPress, {7, 10}}};
    assert(!host.waitEvent(Time::Zero));
    assert(attempts == 1 && host.interpreted.empty() &&
           "waitEvent lost input or spun on a rejected runtime entry");
    allowed = true;
    auto event = host.pollEvent();
    assert(event && event->template is<Event::FocusGained>());
    assert(attempts == 3);
    assert((host.interpreted == std::vector<int>{kClientMessage, kKeyPress}));
  } else {
    assert(false && "SFML has no optional guarded runtime interpreter");
  }
  registry.Close(81);
  std::cout << "PASS actual SFML wait rejects once and retries native input\n";
}

}  // namespace

int main() {
  Collection();
  Repeats();
  Replacement();
  WaitCallbacks();
  WaitRetirement();
  GuardedWait<sfmljs::interop::WindowInputCallbacks>();
}
