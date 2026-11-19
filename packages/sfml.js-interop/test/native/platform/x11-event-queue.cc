// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cassert>
#include <iostream>
#include <memory>
#include <stdexcept>

#if __has_include("platform/event-queue.h")
#include "platform/event-queue.h"
#include "window-input-registry.h"

namespace {

using sfmljs::interop::WindowInputResult;
using sfmljs::interop::detail::WindowEventQueue;

void Ordering() {
  WindowEventQueue queue;
  int deliveries = 0;
  const auto first = std::make_shared<int>(1);
  const auto second = std::make_shared<int>(2);
  queue.Push(sf::Event::FocusGained{});
  queue.Defer([&] {
    ++deliveries;
    queue.Push(sf::Event::TextEntered{U'中'}, first);
    queue.Push(sf::Event::TextEntered{U'😀'}, first);
  });
  queue.Defer([&] {
    ++deliveries;
    queue.Push(sf::Event::TextEntered{U'中'}, second);
  });
  assert(deliveries == 0);
  assert(queue.Pop()->event.is<sf::Event::FocusGained>());
  assert(deliveries == 0);
  auto event = queue.Pop();
  assert(event &&
         event->event.getIf<sf::Event::TextEntered>()->unicode == U'中');
  assert(event->source == first && deliveries == 1);
  event = queue.Pop();
  assert(event &&
         event->event.getIf<sf::Event::TextEntered>()->unicode == U'😀');
  assert(event->source == first && deliveries == 1);
  event = queue.Pop();
  assert(event &&
         event->event.getIf<sf::Event::TextEntered>()->unicode == U'中');
  assert(event->source == second && deliveries == 2);
  assert(queue.Empty() && !queue.Pop());
  std::cout << "PASS deferred native output precedes later native deliveries\n";
}

void Nested() {
  WindowEventQueue outer;
  WindowEventQueue inner;
  inner.Defer([&] { inner.Push(sf::Event::TextEntered{U'b'}); });
  outer.Defer([&] {
    assert(!outer.Empty() && !outer.Pop());
    auto nested = inner.Pop();
    assert(nested &&
           nested->event.getIf<sf::Event::TextEntered>()->unicode == U'b');
    outer.Push(sf::Event::TextEntered{U'a'});
  });
  auto event = outer.Pop();
  assert(event &&
         event->event.getIf<sf::Event::TextEntered>()->unicode == U'a');
  assert(inner.Empty() && outer.Empty());
  std::cout << "PASS nested polling defers only its currently active window\n";
}

void Retirement() {
  WindowEventQueue queue;
  auto host = std::make_shared<int>(7);
  const std::weak_ptr<int> retired = host;
  auto later_owner = std::make_shared<int>(8);
  const std::weak_ptr<int> pending = later_owner;
  queue.Defer([&] {
    queue.Close(std::move(host));
    assert(!retired.expired() && pending.expired());
    queue.Push(sf::Event::TextEntered{U'x'});
    queue.Defer([] { assert(false && "closed host accepted native input"); });
    assert(!queue.Pop());
  });
  queue.Defer([owner = std::move(later_owner)] {
    assert(false && "closed host retained a later native delivery");
  });
  assert(!queue.Pop());
  assert(retired.expired() && queue.Empty());
  std::cout << "PASS closing retires the host after active delivery returns\n";
}

void Destruction() {
  auto owner = std::make_unique<WindowEventQueue>();
  auto* queue = owner.get();
  queue->Defer([&] { owner.reset(); });
  queue->Defer([] { assert(false && "destroyed queue ran native input"); });
  assert(!queue->Pop());
  assert(!owner);
  std::cout << "PASS queue destruction during interpretation releases safely\n";
}

void Exception() {
  WindowEventQueue queue;
  int deliveries = 0;
  queue.Defer([&] {
    ++deliveries;
    queue.Push(sf::Event::TextEntered{U'a'});
    throw std::runtime_error("native interpretation failed");
  });
  queue.Defer([&] {
    ++deliveries;
    queue.Push(sf::Event::TextEntered{U'b'});
  });
  bool caught = false;
  try {
    queue.Pop();
  } catch (const std::runtime_error&) {
    caught = true;
  }
  assert(caught && deliveries == 1);
  auto event = queue.Pop();
  assert(event &&
         event->event.getIf<sf::Event::TextEntered>()->unicode == U'a');
  assert(deliveries == 1);
  event = queue.Pop();
  assert(event &&
         event->event.getIf<sf::Event::TextEntered>()->unicode == U'b');
  assert(deliveries == 2 && queue.Empty());
  std::cout << "PASS interpreter exceptions preserve queued output and order\n";
}

template <typename Registry>
void ClientGeneration() {
  Registry registry;
  sfmljs::interop::WindowInputCallbacks client;
  client.owner = std::make_shared<int>(1);
  client.event = [](const auto& owner, const sf::Event&) { return owner; };
  registry.Open(71);
  assert(registry.Attach(71, &client));
  if constexpr (requires { registry.Delivery(71); }) {
    const auto delivery = registry.Delivery(71);
    const std::weak_ptr<void> previous = client.owner;
    assert(delivery.Current());
    client.owner = std::make_shared<int>(2);
    assert(registry.Attach(71, &client));
    assert(!delivery.Current() && previous.expired());
    const auto replacement = registry.Delivery(71);
    assert(replacement.Current());
    assert(registry.Attach(71, nullptr));
    assert(!replacement.Current());
    const auto detached = registry.Delivery(71);
    assert(detached.Current());
    assert(registry.Attach(71, &client));
    assert(registry.Attach(71, nullptr));
    assert(!detached.Current());
    const auto closing = registry.Delivery(71);
    registry.Close(71);
    registry.Open(71);
    assert(!closing.Current());
    assert(!registry.Delivery(72).Current());
    std::function<bool()> current;
    registry.Open(73, [&](const auto*) {
      registry.Close(73);
      assert(!current() &&
             "native close left an on-stack configuration generation live");
      return true;
    });
    const auto configuring = registry.Delivery(73);
    current = [configuring] { return configuring.Current(); };
    assert(!registry.Attach(73, &client));
  } else {
    assert(false && "native deliveries do not track input-client generations");
  }
  std::cout << "PASS queued input cannot cross client or native generations\n";
}

template <typename Queue>
void PollRetirement() {
  Queue queue;
  auto host = std::make_shared<int>(9);
  const std::weak_ptr<int> retired = host;
  if constexpr (requires { queue.PollingScope(); }) {
    {
      const auto polling = queue.PollingScope();
      queue.Defer([&] { queue.Close(std::move(host)); });
      assert(!queue.Pop());
      assert(!retired.expired() && polling.Closed());
    }
    assert(retired.expired());
    assert(!queue.Active());
  } else {
    assert(false && "waitEvent loses its host before the polling loop exits");
  }
  std::cout
      << "PASS active polling retains a closed host through wait return\n";
}

template <typename Queue>
void RejectedInterpretation() {
  Queue queue;
  bool allowed = false;
  int deliveries = 0;
  std::function<WindowInputResult()> interpret = [&] {
    if (!allowed) {
      return WindowInputResult::kRejected;
    }
    ++deliveries;
    queue.Push(sf::Event::TextEntered{U'a'});
    return WindowInputResult::kComplete;
  };
  if constexpr (requires {
                  queue.DeferGuarded(interpret);
                  queue.Blocked();
                }) {
    queue.DeferGuarded(interpret);
    queue.Defer([&] {
      ++deliveries;
      queue.Push(sf::Event::TextEntered{U'b'});
    });
    assert(!queue.Pop() && queue.Blocked() && deliveries == 0);
    assert(!queue.Pop() && queue.Blocked() && deliveries == 0);
    allowed = true;
    auto event = queue.Pop();
    assert(event &&
           event->event.template getIf<sf::Event::TextEntered>()->unicode ==
               U'a');
    assert(!queue.Blocked() && deliveries == 1);
    event = queue.Pop();
    assert(event &&
           event->event.template getIf<sf::Event::TextEntered>()->unicode ==
               U'b');
    assert(deliveries == 2 && queue.Empty());
  } else {
    assert(false && "rejected runtime input cannot be retried without loss");
  }
  std::cout
      << "PASS rejected interpretation retains delivery and later order\n";
}

void InterruptedOutput() {
  WindowEventQueue queue;
  int deliveries = 0;
  queue.DeferGuarded([&] {
    ++deliveries;
    queue.Push(sf::Event::TextEntered{U'a'});
    return WindowInputResult::kInterrupted;
  });
  queue.Defer([&] {
    ++deliveries;
    queue.Push(sf::Event::TextEntered{U'b'});
  });
  assert(!queue.Pop() && queue.Blocked() && deliveries == 1);
  auto event = queue.Pop();
  assert(event &&
         event->event.getIf<sf::Event::TextEntered>()->unicode == U'a');
  assert(deliveries == 1 && !queue.Blocked());
  event = queue.Pop();
  assert(event &&
         event->event.getIf<sf::Event::TextEntered>()->unicode == U'b');
  assert(deliveries == 2 && queue.Empty());
  std::cout
      << "PASS interrupted output survives without replay or reordering\n";
}

}  // namespace
#endif

int main() {
#if __has_include("platform/event-queue.h")
  Ordering();
  Nested();
  Retirement();
  Destruction();
  Exception();
  ClientGeneration<sfmljs::interop::detail::WindowInputRegistry>();
  PollRetirement<WindowEventQueue>();
  RejectedInterpretation<WindowEventQueue>();
  InterruptedOutput();
#else
  assert(false && "deferred native event queue is not implemented");
#endif
}
