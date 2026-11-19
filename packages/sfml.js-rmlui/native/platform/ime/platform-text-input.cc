// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/ime/platform-text-input.h"

#include <unordered_map>
#include <utility>

#include "native/platform/ime/caret-bounds.h"
#include "native/platform/ime/native-text-input.h"
#include "native/rendering/textures/rmlui-resources.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

struct WindowInput {
  std::unique_ptr<ime::NativeTextInput> adapter;
  Rml::TextInputContext* input{nullptr};
  std::shared_ptr<ime::TextInputSession> session;
};

auto& Windows() {
  static std::unordered_map<sf::RenderWindow*, WindowInput> windows;
  return windows;
}

sf::RenderWindow* ContextWindow(Rml::Context* context) {
  const auto found = State().contexts.find(context);
  return found == State().contexts.end()
             ? nullptr
             : RenderWindowFor(found->second->render_interface);
}

WindowInput* Entry(sf::RenderWindow* window) {
  if (!window || !window->isOpen()) {
    return nullptr;
  }
  auto found = Windows().find(window);
  if (found != Windows().end() &&
      !found->second.adapter->MatchesWindow(window)) {
    Windows().erase(found);
    found = Windows().end();
  }
  if (found == Windows().end()) {
    auto adapter = ime::NativeTextInput::Create(window);
    if (!adapter) {
      return nullptr;
    }
    found =
        Windows()
            .emplace(window, WindowInput{std::move(adapter), nullptr, nullptr})
            .first;
  }
  return &found->second;
}

}  // namespace

#if !defined(__APPLE__) && !defined(_WIN32) && !defined(__linux__)
std::unique_ptr<ime::NativeTextInput> ime::NativeTextInput::Create(
    sf::RenderWindow*) {
  return {};
}
#endif

void PlatformTextInputFocus(Rml::TextInputContext* input,
                            Rml::Element* element,
                            bool active) {
  if (!active) {
    for (auto& [window, entry] : Windows()) {
      if (entry.input == input) {
        entry.adapter->Deactivate(false);
        entry.input = nullptr;
        entry.session.reset();
      }
    }
    return;
  }
  auto* entry = Entry(ContextWindow(element->GetContext()));
  if (!entry) {
    return;
  }
  if (entry->input == input) {
    entry->session->Refresh();
    return;
  }
  // The adapter prepares its native snapshot before replacing the active
  // session. Publish the registry entry only after activation succeeds.
  auto next_session = std::make_shared<ime::TextInputSession>(input, element);
  entry->adapter->Activate(next_session);
  entry->session = std::move(next_session);
  entry->input = input;
}

void PlatformTextInputDestroyed(Rml::TextInputContext* input) {
  for (auto& [window, entry] : Windows()) {
    if (entry.input == input) {
      entry.adapter->Deactivate(true);
      entry.input = nullptr;
      entry.session.reset();
    }
  }
}

void PlatformTextInputCaret(Rml::Element* element,
                            Rml::Vector2f position,
                            float height) {
  const auto found = Windows().find(ContextWindow(element->GetContext()));
  if (found != Windows().end() && found->second.session &&
      found->second.session->element() == element) {
    // Several contexts can render focused widgets into the same window.
    // Only the active session may position that window's candidate UI.
    found->second.session->Refresh();
    found->second.adapter->SetCaret(
        ime::CaretBounds(element, position, height));
  }
}

bool ConsumePlatformTextInput(
    Rml::Context* context,
    const sf::Event& event,
    const std::shared_ptr<sfmljs::interop::WindowEventSource>& source) {
  const auto found = Windows().find(ContextWindow(context));
  return found != Windows().end() &&
         found->second.adapter->Consume(context, event, source);
}

void DrainPlatformTextInput(Rml::Context* context) {
  const auto found = Windows().find(ContextWindow(context));
  if (found == Windows().end() || !found->second.session) {
    return;
  }
  auto session = found->second.session;
  const size_t depth = State().active_elements.size();
  if (session->element()) {
    State().active_elements.push_back(session->element());
  }
  try {
    found->second.adapter->Drain(
        [] { return State().callback_exception.IsEmpty(); });
  } catch (...) {
    State().active_elements.resize(depth);
    throw;
  }
  State().active_elements.resize(depth);
}

void ReleasePlatformTextInputContext(Rml::Context* context) {
  auto* window = ContextWindow(context);
  const auto found = Windows().find(window);
  if (found == Windows().end()) {
    return;
  }
  for (const auto& [other, token] : State().contexts) {
    if (other != context &&
        RenderWindowFor(token->render_interface) == window) {
      return;
    }
  }
  found->second.adapter->Deactivate(true);
  Windows().erase(found);
}

void ReleasePlatformTextInput() {
  for (auto& [window, entry] : Windows()) {
    entry.adapter->Deactivate(true);
  }
  Windows().clear();
}

}  // namespace sfmlrmlui
