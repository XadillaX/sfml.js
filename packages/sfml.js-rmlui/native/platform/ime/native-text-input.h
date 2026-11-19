// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_NATIVE_TEXT_INPUT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_NATIVE_TEXT_INPUT_H_

#include <RmlUi/Core/Rectangle.h>
#include <window-event-source.h>

#include <functional>
#include <memory>

#include "native/platform/ime/text-input-session.h"
#include <SFML/Graphics/RenderWindow.hpp>
#include <SFML/Window/Event.hpp>

namespace sfmlrmlui::ime {

// Each implementation attaches to its owning native window. OS callbacks
// capture state; widget edits and host callbacks wait for the runtime drain.
class NativeTextInput {
 public:
  virtual ~NativeTextInput() = default;
  static std::unique_ptr<NativeTextInput> Create(sf::RenderWindow* window);

  virtual void Activate(std::shared_ptr<TextInputSession> session) = 0;
  virtual void Deactivate(bool destroyed) = 0;
  virtual void SetCaret(Rml::Rectanglef bounds) = 0;
  virtual void Drain(const std::function<bool()>& can_continue) = 0;
  virtual bool Consume(
      Rml::Context* context,
      const sf::Event& event,
      const std::shared_ptr<sfmljs::interop::WindowEventSource>& source) = 0;
  virtual bool MatchesWindow(sf::RenderWindow* window) const = 0;
};

}  // namespace sfmlrmlui::ime

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_NATIVE_TEXT_INPUT_H_
