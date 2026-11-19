// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_REGISTRY_H_
#define PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_REGISTRY_H_

#include <functional>
#include <memory>
#include <unordered_map>
#include <utility>

#include "window-input-callbacks.h"

namespace sfmljs::interop::detail {

// Owned by the SFML Window DSO, on the window/event-pump thread. Hosts exist
// only while their native windows live; the registry never keeps event history.
class WindowInputRegistry final {
 public:
  using Configure = std::function<bool(const WindowInputCallbacks*)>;

  // A raw delivery belongs to the input context present at collection. This
  // weak token neither retains that client's owner nor revives a reused host.
  class DeliveryToken final {
   public:
    bool Current() const { return !generation_.expired(); }

   private:
    explicit DeliveryToken(std::weak_ptr<const int> generation)
        : generation_(std::move(generation)) {}
    std::weak_ptr<const int> generation_;
    friend class WindowInputRegistry;
  };

  void Open(uintptr_t handle, Configure configure = {}) {
    if (hosts_.find(handle) == hosts_.end()) {
      hosts_.emplace(
          handle,
          std::make_shared<Host>(
              Host{std::move(configure), {}, std::make_shared<const int>(0)}));
    }
  }

  bool Attach(uintptr_t handle, const WindowInputCallbacks* callbacks) {
    const auto found = hosts_.find(handle);
    if (found == hosts_.end() ||
        (callbacks && (!callbacks->owner || !callbacks->event))) {
      return false;
    }
    // Stage ownership before native configuration. A rejected style or an
    // allocation failure must leave the current client in place.
    auto next = callbacks ? std::make_shared<WindowInputCallbacks>(*callbacks)
                          : nullptr;
    const auto generation = std::make_shared<const int>(0);
    const auto host = found->second;
    if (host->configure && !host->configure(next.get())) {
      return false;
    }
    // Configuration may pump native messages and close/recreate the handle.
    const auto current = hosts_.find(handle);
    if (current == hosts_.end() || current->second != host) {
      return false;
    }
    host->client = std::move(next);
    host->generation = generation;
    return true;
  }

  DeliveryToken Delivery(uintptr_t handle) const {
    const auto found = hosts_.find(handle);
    return DeliveryToken(found == hosts_.end() ? std::weak_ptr<const int>{}
                                               : found->second->generation);
  }

  std::shared_ptr<WindowInputCallbacks> Client(uintptr_t handle) const {
    const auto found = hosts_.find(handle);
    return found == hosts_.end() ? nullptr : found->second->client;
  }

  std::shared_ptr<void> Capture(uintptr_t handle,
                                const sf::Event& event) const {
    const auto client = Client(handle);
    if (!client || (!event.is<sf::Event::KeyPressed>() &&
                    !event.is<sf::Event::TextEntered>())) {
      return {};
    }
    return client->event(client->owner, event);
  }

  // The native host retains this result through XIC/default-procedure
  // teardown. Closing rejects new capture immediately, without leaving a
  // dangling native client_data pointer during destruction callbacks.
  std::shared_ptr<WindowInputCallbacks> Close(uintptr_t handle) {
    const auto found = hosts_.find(handle);
    if (found == hosts_.end()) {
      return {};
    }
    const auto client = found->second->client;
    // Attach may retain Host while native configuration is on-stack. Revoke
    // its generation before invoking teardown, even if Host still survives.
    found->second->generation.reset();
    hosts_.erase(found);
    if (client && client->closed) {
      client->closed(client->owner);
    }
    return client;
  }

 private:
  struct Host {
    Configure configure;
    std::shared_ptr<WindowInputCallbacks> client;
    std::shared_ptr<const int> generation;
  };

  std::unordered_map<uintptr_t, std::shared_ptr<Host>> hosts_;
};

}  // namespace sfmljs::interop::detail

#endif  // PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_REGISTRY_H_
