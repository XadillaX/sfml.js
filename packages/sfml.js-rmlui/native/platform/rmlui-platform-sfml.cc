// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Adapted from RmlUi Backends/RmlUi_Platform_SFML.cpp (MIT license),
// reduced to the SFML 3 API used by sfml.js.

#include "native/platform/rmlui-platform-sfml.h"

#include <SFML/Window/Keyboard.hpp>

namespace sfmlrmlui::platform {
namespace {

template <typename KeyEvent>
int KeyModifiers(const KeyEvent& key) {
  return (key.control ? Rml::Input::KM_CTRL : 0) |
         (key.shift ? Rml::Input::KM_SHIFT : 0) |
         (key.alt ? Rml::Input::KM_ALT : 0) |
         (key.system ? Rml::Input::KM_META : 0);
}

template <typename TouchEvent>
Rml::TouchList Touches(const TouchEvent& touch) {
  return {{static_cast<Rml::TouchId>(touch.finger),
           {static_cast<float>(touch.position.x),
            static_cast<float>(touch.position.y)}}};
}

}  // namespace

bool InputHandler(Rml::Context* context, const sf::Event& ev) {
  bool result = true;

  if (auto mouse_moved = ev.getIf<sf::Event::MouseMoved>()) {
    result = context->ProcessMouseMove(mouse_moved->position.x,
                                       mouse_moved->position.y,
                                       GetKeyModifierState());
  } else if (auto pressed = ev.getIf<sf::Event::MouseButtonPressed>()) {
    result = context->ProcessMouseButtonDown(static_cast<int>(pressed->button),
                                             GetKeyModifierState());
  } else if (auto released = ev.getIf<sf::Event::MouseButtonReleased>()) {
    result = context->ProcessMouseButtonUp(static_cast<int>(released->button),
                                           GetKeyModifierState());
  } else if (auto wheel = ev.getIf<sf::Event::MouseWheelScrolled>()) {
    const Rml::Vector2f delta = {
        wheel->wheel == sf::Mouse::Wheel::Horizontal ? -wheel->delta : 0.f,
        wheel->wheel == sf::Mouse::Wheel::Vertical ? -wheel->delta : 0.f,
    };
    result = context->ProcessMouseWheel(delta, GetKeyModifierState());
  } else if (ev.is<sf::Event::MouseLeft>()) {
    result = context->ProcessMouseLeave();
  } else if (auto text = ev.getIf<sf::Event::TextEntered>()) {
    Rml::Character character = Rml::Character(text->unicode);
    if (character == Rml::Character('\r')) {
      character = Rml::Character('\n');
    }
    if (text->unicode >= 32 || character == Rml::Character('\n')) {
      result = context->ProcessTextInput(character);
    }
  } else if (auto key = ev.getIf<sf::Event::KeyPressed>()) {
    result = context->ProcessKeyDown(ConvertKey(key->code), KeyModifiers(*key));
  } else if (auto key = ev.getIf<sf::Event::KeyReleased>()) {
    result = context->ProcessKeyUp(ConvertKey(key->code), KeyModifiers(*key));
  } else if (auto touch = ev.getIf<sf::Event::TouchBegan>()) {
    result = context->ProcessTouchStart(Touches(*touch), GetKeyModifierState());
  } else if (auto touch = ev.getIf<sf::Event::TouchMoved>()) {
    result = context->ProcessTouchMove(Touches(*touch), GetKeyModifierState());
  } else if (auto touch = ev.getIf<sf::Event::TouchEnded>()) {
    result = context->ProcessTouchEnd(Touches(*touch), GetKeyModifierState());
  }

  return result;
}

Rml::Input::KeyIdentifier ConvertKey(sf::Keyboard::Key sfml_key) {
  using Key = sf::Keyboard::Key;
  switch (sfml_key) {
    case Key::A:
      return Rml::Input::KI_A;
    case Key::B:
      return Rml::Input::KI_B;
    case Key::C:
      return Rml::Input::KI_C;
    case Key::D:
      return Rml::Input::KI_D;
    case Key::E:
      return Rml::Input::KI_E;
    case Key::F:
      return Rml::Input::KI_F;
    case Key::G:
      return Rml::Input::KI_G;
    case Key::H:
      return Rml::Input::KI_H;
    case Key::I:
      return Rml::Input::KI_I;
    case Key::J:
      return Rml::Input::KI_J;
    case Key::K:
      return Rml::Input::KI_K;
    case Key::L:
      return Rml::Input::KI_L;
    case Key::M:
      return Rml::Input::KI_M;
    case Key::N:
      return Rml::Input::KI_N;
    case Key::O:
      return Rml::Input::KI_O;
    case Key::P:
      return Rml::Input::KI_P;
    case Key::Q:
      return Rml::Input::KI_Q;
    case Key::R:
      return Rml::Input::KI_R;
    case Key::S:
      return Rml::Input::KI_S;
    case Key::T:
      return Rml::Input::KI_T;
    case Key::U:
      return Rml::Input::KI_U;
    case Key::V:
      return Rml::Input::KI_V;
    case Key::W:
      return Rml::Input::KI_W;
    case Key::X:
      return Rml::Input::KI_X;
    case Key::Y:
      return Rml::Input::KI_Y;
    case Key::Z:
      return Rml::Input::KI_Z;
    case Key::Num0:
      return Rml::Input::KI_0;
    case Key::Num1:
      return Rml::Input::KI_1;
    case Key::Num2:
      return Rml::Input::KI_2;
    case Key::Num3:
      return Rml::Input::KI_3;
    case Key::Num4:
      return Rml::Input::KI_4;
    case Key::Num5:
      return Rml::Input::KI_5;
    case Key::Num6:
      return Rml::Input::KI_6;
    case Key::Num7:
      return Rml::Input::KI_7;
    case Key::Num8:
      return Rml::Input::KI_8;
    case Key::Num9:
      return Rml::Input::KI_9;
    case Key::Numpad0:
      return Rml::Input::KI_NUMPAD0;
    case Key::Numpad1:
      return Rml::Input::KI_NUMPAD1;
    case Key::Numpad2:
      return Rml::Input::KI_NUMPAD2;
    case Key::Numpad3:
      return Rml::Input::KI_NUMPAD3;
    case Key::Numpad4:
      return Rml::Input::KI_NUMPAD4;
    case Key::Numpad5:
      return Rml::Input::KI_NUMPAD5;
    case Key::Numpad6:
      return Rml::Input::KI_NUMPAD6;
    case Key::Numpad7:
      return Rml::Input::KI_NUMPAD7;
    case Key::Numpad8:
      return Rml::Input::KI_NUMPAD8;
    case Key::Numpad9:
      return Rml::Input::KI_NUMPAD9;
    case Key::Left:
      return Rml::Input::KI_LEFT;
    case Key::Right:
      return Rml::Input::KI_RIGHT;
    case Key::Up:
      return Rml::Input::KI_UP;
    case Key::Down:
      return Rml::Input::KI_DOWN;
    case Key::Add:
      return Rml::Input::KI_ADD;
    case Key::Backspace:
      return Rml::Input::KI_BACK;
    case Key::Delete:
      return Rml::Input::KI_DELETE;
    case Key::Divide:
      return Rml::Input::KI_DIVIDE;
    case Key::End:
      return Rml::Input::KI_END;
    case Key::Escape:
      return Rml::Input::KI_ESCAPE;
    case Key::F1:
      return Rml::Input::KI_F1;
    case Key::F2:
      return Rml::Input::KI_F2;
    case Key::F3:
      return Rml::Input::KI_F3;
    case Key::F4:
      return Rml::Input::KI_F4;
    case Key::F5:
      return Rml::Input::KI_F5;
    case Key::F6:
      return Rml::Input::KI_F6;
    case Key::F7:
      return Rml::Input::KI_F7;
    case Key::F8:
      return Rml::Input::KI_F8;
    case Key::F9:
      return Rml::Input::KI_F9;
    case Key::F10:
      return Rml::Input::KI_F10;
    case Key::F11:
      return Rml::Input::KI_F11;
    case Key::F12:
      return Rml::Input::KI_F12;
    case Key::F13:
      return Rml::Input::KI_F13;
    case Key::F14:
      return Rml::Input::KI_F14;
    case Key::F15:
      return Rml::Input::KI_F15;
    case Key::PageUp:
      return Rml::Input::KI_PRIOR;
    case Key::PageDown:
      return Rml::Input::KI_NEXT;
    case Key::LSystem:
#if defined(__APPLE__)
      return Rml::Input::KI_LMETA;
#else
      return Rml::Input::KI_LWIN;
#endif
    case Key::RSystem:
#if defined(__APPLE__)
      return Rml::Input::KI_RMETA;
#else
      return Rml::Input::KI_RWIN;
#endif
    case Key::LAlt:
      return Rml::Input::KI_LMENU;
    case Key::RAlt:
      return Rml::Input::KI_RMENU;
    case Key::Menu:
      return Rml::Input::KI_APPS;
    case Key::Semicolon:
      return Rml::Input::KI_OEM_1;
    case Key::Equal:
      return Rml::Input::KI_OEM_PLUS;
    case Key::Comma:
      return Rml::Input::KI_OEM_COMMA;
    case Key::Hyphen:
      return Rml::Input::KI_OEM_MINUS;
    case Key::Period:
      return Rml::Input::KI_OEM_PERIOD;
    case Key::Slash:
      return Rml::Input::KI_OEM_2;
    case Key::Grave:
      return Rml::Input::KI_OEM_3;
    case Key::LBracket:
      return Rml::Input::KI_OEM_4;
    case Key::Backslash:
      return Rml::Input::KI_OEM_5;
    case Key::RBracket:
      return Rml::Input::KI_OEM_6;
    case Key::Apostrophe:
      return Rml::Input::KI_OEM_7;
    case Key::Home:
      return Rml::Input::KI_HOME;
    case Key::Insert:
      return Rml::Input::KI_INSERT;
    case Key::LControl:
      return Rml::Input::KI_LCONTROL;
    case Key::LShift:
      return Rml::Input::KI_LSHIFT;
    case Key::Multiply:
      return Rml::Input::KI_MULTIPLY;
    case Key::Pause:
      return Rml::Input::KI_PAUSE;
    case Key::RControl:
      return Rml::Input::KI_RCONTROL;
    case Key::Enter:
      return Rml::Input::KI_RETURN;
    case Key::RShift:
      return Rml::Input::KI_RSHIFT;
    case Key::Space:
      return Rml::Input::KI_SPACE;
    case Key::Subtract:
      return Rml::Input::KI_SUBTRACT;
    case Key::Tab:
      return Rml::Input::KI_TAB;
    default:
      return Rml::Input::KI_UNKNOWN;
  }
}

int GetKeyModifierState() {
  int modifiers = 0;
  if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::LShift) ||
      sf::Keyboard::isKeyPressed(sf::Keyboard::Key::RShift)) {
    modifiers |= Rml::Input::KM_SHIFT;
  }
  if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::LControl) ||
      sf::Keyboard::isKeyPressed(sf::Keyboard::Key::RControl)) {
    modifiers |= Rml::Input::KM_CTRL;
  }
  if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::LAlt) ||
      sf::Keyboard::isKeyPressed(sf::Keyboard::Key::RAlt)) {
    modifiers |= Rml::Input::KM_ALT;
  }
  if (sf::Keyboard::isKeyPressed(sf::Keyboard::Key::LSystem) ||
      sf::Keyboard::isKeyPressed(sf::Keyboard::Key::RSystem)) {
    modifiers |= Rml::Input::KM_META;
  }
  return modifiers;
}

}  // namespace sfmlrmlui::platform
