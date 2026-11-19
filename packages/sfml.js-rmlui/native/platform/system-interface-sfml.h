// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Adapted from RmlUi Backends/RmlUi_Platform_SFML.h (MIT license),
// reduced to the SFML 3 API used by sfml.js.

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_SYSTEM_INTERFACE_SFML_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_SYSTEM_INTERFACE_SFML_H_

#include <RmlUi/Core/SystemInterface.h>
#include <RmlUi/Core/Types.h>

#include <memory>

#include <SFML/Graphics/RenderWindow.hpp>
#include <SFML/System/Clock.hpp>
#include <SFML/Window/Cursor.hpp>

namespace sfmlrmlui {

class SystemInterfaceSFML : public Rml::SystemInterface {
 public:
  SystemInterfaceSFML();

  // The window must outlive the system interface; it is needed for cursor
  // changes and clipboard access.
  void SetWindow(sf::RenderWindow* window);
  sf::RenderWindow* window() const { return window_; }
  Rml::Vector2f keyboard_caret() const { return keyboard_caret_; }
  float keyboard_line_height() const { return keyboard_line_height_; }

  double GetElapsedTime() override;
  void SetMouseCursor(const Rml::String& cursor_name) override;
  void SetClipboardText(const Rml::String& text) override;
  void GetClipboardText(Rml::String& text) override;
  void ActivateKeyboard(Rml::Vector2f caret, float height) override;
  void DeactivateKeyboard() override;

 protected:
  // JS windows retain the aliasing owner until their native cursor changes
  // or the window closes, even after this system interface is destroyed.
  virtual void ApplyMouseCursor(std::shared_ptr<sf::Cursor> cursor);

 private:
  struct Cursors {
    Cursors();

    sf::Cursor cursor_default;
    sf::Cursor cursor_move;
    sf::Cursor cursor_pointer;
    sf::Cursor cursor_resize;
    sf::Cursor cursor_cross;
    sf::Cursor cursor_text;
    sf::Cursor cursor_unavailable;
  };

  sf::Clock timer_;
  sf::RenderWindow* window_{nullptr};
  Rml::Vector2f keyboard_caret_;
  float keyboard_line_height_{1.f};
  std::shared_ptr<Cursors> cursors_;
};

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_SYSTEM_INTERFACE_SFML_H_
