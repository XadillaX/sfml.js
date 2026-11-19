// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/events/rmlui-event-bridge.h"

#include <cmath>
#include <limits>
#include <string>

namespace sfmlrmlui {
namespace {

bool ReadProperty(v8::Local<v8::Object> object,
                  const char* name,
                  v8::Local<v8::Value>* value) {
  return Nan::Get(object, Nan::New(name).ToLocalChecked()).ToLocal(value);
}

bool ReadString(v8::Local<v8::Object> object,
                const char* name,
                std::string* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw) || !raw->IsString()) {
    return false;
  }
  Nan::Utf8String text(raw);
  value->assign(*text, text.length());
  return true;
}

bool ReadInt(v8::Local<v8::Object> object, const char* name, int* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw) || !raw->IsNumber()) {
    return false;
  }
  const double number = Nan::To<double>(raw).FromJust();
  if (!std::isfinite(number) || std::trunc(number) != number ||
      number < std::numeric_limits<int>::min() ||
      number > std::numeric_limits<int>::max()) {
    return false;
  }
  *value = static_cast<int>(number);
  return true;
}

bool ReadUnsigned(v8::Local<v8::Object> object,
                  const char* name,
                  unsigned* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw) || !raw->IsNumber()) {
    return false;
  }
  const double number = Nan::To<double>(raw).FromJust();
  if (!std::isfinite(number) || std::trunc(number) != number || number < 0 ||
      number > std::numeric_limits<unsigned>::max()) {
    return false;
  }
  *value = static_cast<unsigned>(number);
  return true;
}

bool ReadNumber(v8::Local<v8::Object> object, const char* name, double* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw) || !raw->IsNumber()) {
    return false;
  }
  *value = Nan::To<double>(raw).FromJust();
  return std::isfinite(*value) &&
         std::abs(*value) <= std::numeric_limits<float>::max();
}

bool ReadBool(v8::Local<v8::Object> object, const char* name, bool* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw) || !raw->IsBoolean()) {
    return false;
  }
  *value = raw->IsTrue();
  return true;
}

bool ReadVector2i(v8::Local<v8::Object> object,
                  const char* name,
                  sf::Vector2i* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw) || !raw->IsObject()) {
    return false;
  }
  auto vector = raw.As<v8::Object>();
  return ReadInt(vector, "x", &value->x) && ReadInt(vector, "y", &value->y);
}

std::optional<sf::Event> DecodeWindowEvent(v8::Local<v8::Value> value,
                                           Nan::TryCatch* try_catch) {
  const auto invalid = [try_catch](const char* message) {
    if (!try_catch->HasCaught()) {
      Nan::ThrowTypeError(message);
    }
  };
  if (!value->IsObject()) {
    invalid("Expected an sfml.js event data object");
    return std::nullopt;
  }
  auto object = value.As<v8::Object>();
  std::string kind;
  if (!ReadString(object, "kind", &kind)) {
    invalid("Expected an event kind");
    return std::nullopt;
  }

  if (kind == "MouseLeft") {
    return sf::Event(sf::Event::MouseLeft{});
  }

  if (kind == "Resized") {
    sf::Vector2i size;
    if (!ReadVector2i(object, "size", &size) || size.x < 0 || size.y < 0) {
      invalid("Invalid Resized event");
      return std::nullopt;
    }
    return sf::Event(sf::Event::Resized{sf::Vector2u(
        static_cast<unsigned>(size.x), static_cast<unsigned>(size.y))});
  }

  if (kind == "MouseMoved") {
    sf::Event::MouseMoved event;
    if (!ReadVector2i(object, "position", &event.position)) {
      invalid("Invalid MouseMoved event");
      return std::nullopt;
    }
    return sf::Event(event);
  }

  if (kind == "MouseButtonPressed" || kind == "MouseButtonReleased") {
    int button{};
    sf::Vector2i position;
    if (!ReadInt(object, "button", &button) || button < 0 ||
        button >= static_cast<int>(sf::Mouse::ButtonCount) ||
        !ReadVector2i(object, "position", &position)) {
      invalid("Invalid mouse button event");
      return std::nullopt;
    }
    if (kind == "MouseButtonPressed") {
      sf::Event::MouseButtonPressed event;
      event.button = static_cast<sf::Mouse::Button>(button);
      event.position = position;
      return sf::Event(event);
    }
    sf::Event::MouseButtonReleased event;
    event.button = static_cast<sf::Mouse::Button>(button);
    event.position = position;
    return sf::Event(event);
  }

  if (kind == "MouseWheelScrolled") {
    int wheel{};
    double delta{};
    sf::Vector2i position;
    if (!ReadInt(object, "wheel", &wheel) ||
        (wheel != static_cast<int>(sf::Mouse::Wheel::Horizontal) &&
         wheel != static_cast<int>(sf::Mouse::Wheel::Vertical)) ||
        !ReadNumber(object, "delta", &delta) ||
        !ReadVector2i(object, "position", &position)) {
      invalid("Invalid MouseWheelScrolled event");
      return std::nullopt;
    }
    sf::Event::MouseWheelScrolled event;
    event.wheel = static_cast<sf::Mouse::Wheel>(wheel);
    event.delta = static_cast<float>(delta);
    event.position = position;
    return sf::Event(event);
  }

  if (kind == "TextEntered") {
    unsigned unicode{};
    if (!ReadUnsigned(object, "unicode", &unicode) || unicode > 0x10ffff) {
      invalid("Invalid TextEntered event");
      return std::nullopt;
    }
    sf::Event::TextEntered event;
    event.unicode = static_cast<char32_t>(unicode);
    return sf::Event(event);
  }

  if (kind == "KeyPressed" || kind == "KeyReleased") {
    int code{};
    int scancode{};
    bool alt{};
    bool control{};
    bool shift{};
    bool system{};
    if (!ReadInt(object, "code", &code) || code < -1 ||
        code >= static_cast<int>(sf::Keyboard::KeyCount) ||
        !ReadInt(object, "scancode", &scancode) ||
        !ReadBool(object, "alt", &alt) ||
        !ReadBool(object, "control", &control) ||
        !ReadBool(object, "shift", &shift) ||
        !ReadBool(object, "system", &system)) {
      invalid("Invalid key event");
      return std::nullopt;
    }
    if (kind == "KeyPressed") {
      sf::Event::KeyPressed event;
      event.code = static_cast<sf::Keyboard::Key>(code);
      event.scancode = static_cast<sf::Keyboard::Scancode>(scancode);
      event.alt = alt;
      event.control = control;
      event.shift = shift;
      event.system = system;
      return sf::Event(event);
    }
    sf::Event::KeyReleased event;
    event.code = static_cast<sf::Keyboard::Key>(code);
    event.scancode = static_cast<sf::Keyboard::Scancode>(scancode);
    event.alt = alt;
    event.control = control;
    event.shift = shift;
    event.system = system;
    return sf::Event(event);
  }

  if (kind == "TouchBegan" || kind == "TouchMoved" || kind == "TouchEnded") {
    unsigned finger{};
    sf::Vector2i position;
    if (!ReadUnsigned(object, "finger", &finger) ||
        !ReadVector2i(object, "position", &position)) {
      invalid("Invalid touch event");
      return std::nullopt;
    }
    // Touch coordinates become Vector2f before RmlUi converts them to int.
    if (static_cast<double>(static_cast<float>(position.x)) >
            std::numeric_limits<int>::max() ||
        static_cast<double>(static_cast<float>(position.y)) >
            std::numeric_limits<int>::max()) {
      invalid("Invalid touch coordinate range");
      return std::nullopt;
    }
    if (kind == "TouchBegan") {
      return sf::Event(sf::Event::TouchBegan{finger, position});
    }
    if (kind == "TouchMoved") {
      return sf::Event(sf::Event::TouchMoved{finger, position});
    }
    return sf::Event(sf::Event::TouchEnded{finger, position});
  }

  // RmlUi ignores the remaining sfml.js event kinds.
  return std::nullopt;
}

}  // namespace

std::optional<sf::Event> BuildWindowEvent(v8::Local<v8::Value> value) {
  Nan::TryCatch try_catch;
  auto result = DecodeWindowEvent(value, &try_catch);
  if (try_catch.HasCaught()) {
    try_catch.ReThrow();
    return std::nullopt;
  }
  return result;
}

}  // namespace sfmlrmlui
