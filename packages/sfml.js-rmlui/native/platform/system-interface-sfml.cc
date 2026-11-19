// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Adapted from RmlUi Backends/RmlUi_Platform_SFML.cpp (MIT license),
// reduced to the SFML 3 API used by sfml.js.

#include "native/platform/system-interface-sfml.h"

#include <RmlUi/Core/StringUtilities.h>

#include <string>

#include <SFML/System/Exception.hpp>
#include <SFML/System/String.hpp>
#include <SFML/Window/Clipboard.hpp>

namespace sfmlrmlui {

SystemInterfaceSFML::Cursors::Cursors()
    : cursor_default(sf::Cursor::Type::Arrow),
      cursor_move(sf::Cursor::Type::SizeAll),
      cursor_pointer(sf::Cursor::Type::Hand),
      cursor_resize(
          sf::Cursor::createFromSystem(sf::Cursor::Type::SizeTopLeftBottomRight)
              .value_or(sf::Cursor(sf::Cursor::Type::SizeAll))),
      cursor_cross(sf::Cursor::Type::Cross),
      cursor_text(sf::Cursor::Type::Text),
      cursor_unavailable(sf::Cursor::Type::NotAllowed) {}

SystemInterfaceSFML::SystemInterfaceSFML() {
  try {
    cursors_ = std::make_unique<Cursors>();
  } catch (const sf::Exception&) {
    // Cursor creation can fail on headless systems; mouse cursor support
    // then degrades gracefully to no-ops.
    cursors_.reset();
  }
}

void SystemInterfaceSFML::SetWindow(sf::RenderWindow* window) {
  window_ = window;
}

double SystemInterfaceSFML::GetElapsedTime() {
  return static_cast<double>(timer_.getElapsedTime().asMicroseconds()) /
         1'000'000.0;
}

void SystemInterfaceSFML::SetMouseCursor(const Rml::String& cursor_name) {
  if (!cursors_ || !window_) {
    return;
  }

  sf::Cursor* cursor = nullptr;
  if (cursor_name.empty() || cursor_name == "arrow") {
    cursor = &cursors_->cursor_default;
  } else if (cursor_name == "move") {
    cursor = &cursors_->cursor_move;
  } else if (cursor_name == "pointer") {
    cursor = &cursors_->cursor_pointer;
  } else if (cursor_name == "resize") {
    cursor = &cursors_->cursor_resize;
  } else if (cursor_name == "cross") {
    cursor = &cursors_->cursor_cross;
  } else if (cursor_name == "text") {
    cursor = &cursors_->cursor_text;
  } else if (cursor_name == "unavailable") {
    cursor = &cursors_->cursor_unavailable;
  } else if (Rml::StringUtilities::StartsWith(cursor_name, "rmlui-scroll")) {
    cursor = &cursors_->cursor_move;
  }

  if (cursor) {
    window_->setMouseCursor(*cursor);
  }
}

void SystemInterfaceSFML::SetClipboardText(const Rml::String& text_utf8) {
  sf::Clipboard::setString(
      sf::String::fromUtf8(text_utf8.begin(), text_utf8.end()));
}

void SystemInterfaceSFML::GetClipboardText(Rml::String& text) {
  const auto utf8 = sf::Clipboard::getString().toUtf8();
  text.assign(utf8.begin(), utf8.end());
}

void SystemInterfaceSFML::ActivateKeyboard(Rml::Vector2f caret, float height) {
  keyboard_caret_ = caret;
  keyboard_line_height_ = height;
}

void SystemInterfaceSFML::DeactivateKeyboard() {
  // The widget focus hook owns cancellation. Cursor blinking and custom
  // keyboard visibility callbacks must not destroy a live composition.
}

}  // namespace sfmlrmlui
