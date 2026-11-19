// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cassert>
#include <iostream>
#include <memory>
#include <type_traits>

#if __has_include("window-input-registry.h")
#include "window-input-registry.h"
#endif
#if __has_include("window-input-scope.h")
#include "window-input-scope.h"
#endif

#if __has_include("window-input-registry.h")
namespace {

template <typename Registry>
void NativeTeardownContract(Registry* registry) {
  sfmljs::interop::WindowInputCallbacks client;
  client.owner = std::make_shared<int>(1);
  const std::weak_ptr<void> watch = client.owner;
  client.event = [](const auto&, const sf::Event&) {
    return std::shared_ptr<void>{};
  };
  client.closed = [](const auto& owner) {
    *std::static_pointer_cast<int>(owner) = -1;
  };
  registry->Open(47);
  assert(registry->Attach(47, &client));
  client.owner.reset();
  // The registry must stop late capture immediately, but native XIC teardown
  // can still call its client_data before destruction finishes.
  using Retired = decltype(registry->Close(47));
  if constexpr (std::is_void_v<Retired>) {
    registry->Close(47);
    assert(!watch.expired() && "native teardown lost its callback owner");
  } else {
    auto retired = registry->Close(47);
    assert(retired && !watch.expired());
    assert(*std::static_pointer_cast<int>(retired->owner) == -1);
    assert(!registry->Client(47));
    assert(!registry->Capture(47, sf::Event::TextEntered{U'x'}));
    retired.reset();
    assert(watch.expired());
  }
  std::cout << "PASS native teardown retains only its retired callback owner\n";
}

}  // namespace
#endif

int main() {
#if __has_include("window-input-registry.h")
  using sfmljs::interop::WindowInputCallbacks;
  using sfmljs::interop::detail::WindowInputRegistry;
  WindowInputRegistry registry;
  WindowInputCallbacks client;
  client.owner = std::make_shared<int>(0);
  client.event = [](const auto& owner, const sf::Event& event) {
    if (event.is<sf::Event::TextEntered>()) {
      ++*std::static_pointer_cast<int>(owner);
      return std::static_pointer_cast<void>(std::make_shared<int>(7));
    }
    return std::shared_ptr<void>{};
  };
  client.closed = [](const auto& owner) {
    *std::static_pointer_cast<int>(owner) = -1;
  };
  const sf::Event text = sf::Event::TextEntered{U'中'};
  assert(!registry.Attach(41, &client));
  registry.Open(41);
  registry.Open(42);
  assert(registry.Attach(41, &client));
  auto captured = registry.Capture(41, text);
  assert(captured && *std::static_pointer_cast<int>(captured) == 7);
  assert(*std::static_pointer_cast<int>(client.owner) == 1);
  assert(!registry.Capture(42, text));
  assert(!registry.Capture(41, sf::Event::Closed{}));
  std::cout << "PASS window input routes only the owning keyboard stream\n";

  const std::weak_ptr<void> watch = captured;
  assert(registry.Attach(41, nullptr));
  assert(!registry.Capture(41, text));
  captured.reset();
  assert(watch.expired());
  std::cout << "PASS input registry retains no captured event history\n";

  assert(registry.Attach(41, &client));
  auto delivery = registry.Client(41);
  registry.Close(41);
  assert(!registry.Attach(41, &client));
  assert(!registry.Capture(41, text));
  assert(*std::static_pointer_cast<int>(client.owner) == -1);
  assert(delivery && delivery->owner == client.owner);
  registry.Open(41);
  assert(!registry.Client(41));
  std::cout << "PASS closing and reused handles retire their input client\n";

  registry.Open(43, [](const auto*) { return false; });
  assert(!registry.Attach(43, &client));
  assert(!registry.Client(43));
  std::cout << "PASS unsupported native input styles reject attachment\n";

  registry.Open(44, [&registry](const auto*) {
    registry.Close(44);
    return true;
  });
  assert(!registry.Attach(44, &client));
  assert(!registry.Client(44));
  std::cout << "PASS native close during configuration rejects attachment\n";
  NativeTeardownContract(&registry);

#if __has_include("window-input-scope.h")
  using sfmljs::interop::detail::WindowInputScope;
  struct Delivery {
    int depth{0};
    int calls{0};
    bool filtered{false};
  };
  auto first = std::make_shared<Delivery>();
  auto second = std::make_shared<Delivery>();
  WindowInputCallbacks scoped;
  scoped.owner = first;
  scoped.native = [](const auto& owner, void*, bool entering) {
    auto state = std::static_pointer_cast<Delivery>(owner);
    state->depth += entering ? 1 : -1;
  };
  scoped.event = [](const auto& owner, const sf::Event&) {
    auto state = std::static_pointer_cast<Delivery>(owner);
    assert(state->depth > 0);
    ++state->calls;
    return owner;
  };
  scoped.filtered = [](const auto& owner, bool filtered) {
    std::static_pointer_cast<Delivery>(owner)->filtered = filtered;
  };
  registry.Open(45);
  assert(registry.Attach(45, &scoped));
  {
    WindowInputScope outer(registry, 45, nullptr);
    WindowInputScope::Filtered(true);
    assert(first->filtered && !second->filtered);
    assert(WindowInputScope::Capture(registry, 45, text) == first);
    scoped.owner = second;
    assert(registry.Attach(45, &scoped));
    {
      WindowInputScope inner(registry, 45, nullptr);
      WindowInputScope::Filtered(true);
      assert(second->filtered);
      assert(WindowInputScope::Capture(registry, 45, text) == second);
      assert(registry.Attach(45, nullptr));
      assert(WindowInputScope::Capture(registry, 45, text) == second);
    }
    WindowInputScope::Filtered(false);
    assert(!first->filtered && second->filtered);
    assert(WindowInputScope::Capture(registry, 45, text) == first);
    assert(!WindowInputScope::Capture(registry, 42, text));
  }
  assert(first->depth == 0 && second->depth == 0);
  assert(first->calls == 2 && second->calls == 2);
  assert(!WindowInputScope::Capture(registry, 45, text));
  std::cout << "PASS nested delivery retains and restores its exact client\n";

  scoped.owner = first;
  assert(registry.Attach(45, &scoped));
  try {
    WindowInputScope scope(registry, 45, nullptr);
    throw 1;
  } catch (int) {
  }
  assert(first->depth == 0);
  assert(registry.Attach(45, nullptr));
  assert(!WindowInputScope::Capture(registry, 45, text));
  std::cout << "PASS native delivery unwinding releases its scope\n";

  scoped.native = [](const auto&, void*, bool entering) {
    if (entering) {
      throw 2;
    }
  };
  assert(registry.Attach(45, &scoped));
  try {
    WindowInputScope scope(registry, 45, nullptr);
    assert(false);
  } catch (int) {
  }
  assert(registry.Attach(45, nullptr));
  assert(!WindowInputScope::Capture(registry, 45, text));
  std::cout << "PASS failed native entry leaves no active delivery\n";
#else
  assert(false && "native delivery scope is not implemented");
#endif
#else
  assert(false && "SFML window input registry is not implemented");
#endif
}
