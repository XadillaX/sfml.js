// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <imgui-SFML.h>
#include <imgui.h>
#include <nan.h>

#include <cmath>
#include <cstdint>
#include <optional>
#include <string>

#include "native/imgui-draw-callbacks.h"
#include "native/interop.h"
#include <SFML/System/Time.hpp>
#include <SFML/Window/Event.hpp>

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
  if (!ReadProperty(object, name, &raw) || !raw->IsString()) return false;
  Nan::Utf8String text(raw);
  value->assign(*text, text.length());
  return true;
}

bool ReadNumber(v8::Local<v8::Object> object, const char* name, double* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw) || !raw->IsNumber()) return false;
  *value = Nan::To<double>(raw).FromJust();
  return true;
}

bool ReadInt(v8::Local<v8::Object> object, const char* name, int* value) {
  double number{};
  if (!ReadNumber(object, name, &number)) return false;
  *value = static_cast<int>(number);
  return true;
}

bool ReadUnsigned(v8::Local<v8::Object> object,
                  const char* name,
                  unsigned* value) {
  double number{};
  if (!ReadNumber(object, name, &number)) return false;
  *value = static_cast<unsigned>(number);
  return true;
}

bool ReadBool(v8::Local<v8::Object> object, const char* name, bool* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw) || !raw->IsBoolean()) return false;
  *value = raw->IsTrue();
  return true;
}

bool ReadVector2i(v8::Local<v8::Object> object,
                  const char* name,
                  sf::Vector2i* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw)) return false;
  if (raw->IsArray()) {
    auto array = raw.As<v8::Array>();
    if (array->Length() != 2) return false;
    value->x = Nan::To<int>(Nan::Get(array, 0).ToLocalChecked()).FromJust();
    value->y = Nan::To<int>(Nan::Get(array, 1).ToLocalChecked()).FromJust();
    return true;
  }
  if (!raw->IsObject()) return false;
  auto vector = raw.As<v8::Object>();
  v8::Local<v8::Value> x;
  v8::Local<v8::Value> y;
  if (!Nan::Get(vector, Nan::New("x").ToLocalChecked()).ToLocal(&x) ||
      !Nan::Get(vector, Nan::New("y").ToLocalChecked()).ToLocal(&y) ||
      !x->IsNumber() || !y->IsNumber()) {
    return false;
  }
  value->x = Nan::To<int>(x).FromJust();
  value->y = Nan::To<int>(y).FromJust();
  return true;
}

bool ReadVector2u(v8::Local<v8::Object> object,
                  const char* name,
                  sf::Vector2u* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw)) return false;
  if (raw->IsArray()) {
    auto array = raw.As<v8::Array>();
    if (array->Length() != 2) return false;
    value->x =
        Nan::To<std::uint32_t>(Nan::Get(array, 0).ToLocalChecked()).FromJust();
    value->y =
        Nan::To<std::uint32_t>(Nan::Get(array, 1).ToLocalChecked()).FromJust();
    return true;
  }
  if (!raw->IsObject()) return false;
  auto vector = raw.As<v8::Object>();
  v8::Local<v8::Value> x;
  v8::Local<v8::Value> y;
  if (!Nan::Get(vector, Nan::New("x").ToLocalChecked()).ToLocal(&x) ||
      !Nan::Get(vector, Nan::New("y").ToLocalChecked()).ToLocal(&y) ||
      !x->IsNumber() || !y->IsNumber()) {
    return false;
  }
  value->x = Nan::To<std::uint32_t>(x).FromJust();
  value->y = Nan::To<std::uint32_t>(y).FromJust();
  return true;
}

bool ReadVector3f(v8::Local<v8::Object> object,
                  const char* name,
                  sf::Vector3f* value) {
  v8::Local<v8::Value> raw;
  if (!ReadProperty(object, name, &raw)) return false;
  if (raw->IsArray()) {
    auto array = raw.As<v8::Array>();
    if (array->Length() != 3) return false;
    value->x = static_cast<float>(
        Nan::To<double>(Nan::Get(array, 0).ToLocalChecked()).FromJust());
    value->y = static_cast<float>(
        Nan::To<double>(Nan::Get(array, 1).ToLocalChecked()).FromJust());
    value->z = static_cast<float>(
        Nan::To<double>(Nan::Get(array, 2).ToLocalChecked()).FromJust());
    return true;
  }
  if (!raw->IsObject()) return false;
  auto vector = raw.As<v8::Object>();
  const char* keys[] = {"x", "y", "z"};
  float* fields[] = {&value->x, &value->y, &value->z};
  for (int index = 0; index < 3; ++index) {
    v8::Local<v8::Value> field;
    if (!Nan::Get(vector, Nan::New(keys[index]).ToLocalChecked())
             .ToLocal(&field) ||
        !field->IsNumber()) {
      return false;
    }
    *fields[index] = static_cast<float>(Nan::To<double>(field).FromJust());
  }
  return true;
}

// sfml.js publishes Event.data as plain values; rebuild the tagged sf::Event
// so imgui-SFML sees the same variant it would from a C++ loop.

std::optional<sf::Event> BuildEvent(v8::Local<v8::Value> value) {
  if (!value->IsObject()) {
    Nan::ThrowTypeError("Expected an sfml.js event data object");
    return std::nullopt;
  }
  auto object = value.As<v8::Object>();
  std::string kind;
  if (!ReadString(object, "kind", &kind)) {
    Nan::ThrowTypeError("Expected an event kind");
    return std::nullopt;
  }

  if (kind == "Closed") return sf::Event(sf::Event::Closed{});
  if (kind == "FocusLost") return sf::Event(sf::Event::FocusLost{});
  if (kind == "FocusGained") return sf::Event(sf::Event::FocusGained{});
  if (kind == "MouseEntered") return sf::Event(sf::Event::MouseEntered{});
  if (kind == "MouseLeft") return sf::Event(sf::Event::MouseLeft{});

  if (kind == "Resized") {
    sf::Event::Resized event;
    if (!ReadVector2u(object, "size", &event.size)) {
      Nan::ThrowTypeError("Invalid Resized event");
      return std::nullopt;
    }
    return sf::Event(event);
  }

  if (kind == "TextEntered") {
    unsigned unicode{};
    if (!ReadUnsigned(object, "unicode", &unicode)) {
      Nan::ThrowTypeError("Invalid TextEntered event");
      return std::nullopt;
    }
    sf::Event::TextEntered event;
    event.unicode = static_cast<char32_t>(unicode);
    return sf::Event(event);
  }

  if (kind == "KeyPressed" || kind == "KeyReleased") {
    int code{}, scancode{};
    bool alt{}, control{}, shift{}, system{};
    if (!ReadInt(object, "code", &code) ||
        !ReadInt(object, "scancode", &scancode) ||
        !ReadBool(object, "alt", &alt) ||
        !ReadBool(object, "control", &control) ||
        !ReadBool(object, "shift", &shift) ||
        !ReadBool(object, "system", &system)) {
      Nan::ThrowTypeError("Invalid key event");
      return std::nullopt;
    }
    const auto key = static_cast<sf::Keyboard::Key>(code);
    const auto scan = static_cast<sf::Keyboard::Scancode>(scancode);
    if (kind == "KeyPressed") {
      sf::Event::KeyPressed event;
      event.code = key;
      event.scancode = scan;
      event.alt = alt;
      event.control = control;
      event.shift = shift;
      event.system = system;
      return sf::Event(event);
    }
    sf::Event::KeyReleased event;
    event.code = key;
    event.scancode = scan;
    event.alt = alt;
    event.control = control;
    event.shift = shift;
    event.system = system;
    return sf::Event(event);
  }

  if (kind == "MouseWheelScrolled") {
    int wheel{};
    double delta{};
    sf::Vector2i position;
    if (!ReadInt(object, "wheel", &wheel) ||
        !ReadNumber(object, "delta", &delta) ||
        !ReadVector2i(object, "position", &position)) {
      Nan::ThrowTypeError("Invalid MouseWheelScrolled event");
      return std::nullopt;
    }
    sf::Event::MouseWheelScrolled event;
    event.wheel = static_cast<sf::Mouse::Wheel>(wheel);
    event.delta = static_cast<float>(delta);
    event.position = position;
    return sf::Event(event);
  }

  if (kind == "MouseButtonPressed" || kind == "MouseButtonReleased") {
    int button{};
    sf::Vector2i position;
    if (!ReadInt(object, "button", &button) ||
        !ReadVector2i(object, "position", &position)) {
      Nan::ThrowTypeError("Invalid mouse button event");
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

  if (kind == "MouseMoved") {
    sf::Event::MouseMoved event;
    if (!ReadVector2i(object, "position", &event.position)) {
      Nan::ThrowTypeError("Invalid MouseMoved event");
      return std::nullopt;
    }
    return sf::Event(event);
  }

  if (kind == "MouseMovedRaw") {
    sf::Event::MouseMovedRaw event;
    if (!ReadVector2i(object, "delta", &event.delta)) {
      Nan::ThrowTypeError("Invalid MouseMovedRaw event");
      return std::nullopt;
    }
    return sf::Event(event);
  }

  if (kind == "JoystickButtonPressed" || kind == "JoystickButtonReleased") {
    unsigned joystickId{}, button{};
    if (!ReadUnsigned(object, "joystickId", &joystickId) ||
        !ReadUnsigned(object, "button", &button)) {
      Nan::ThrowTypeError("Invalid joystick button event");
      return std::nullopt;
    }
    if (kind == "JoystickButtonPressed") {
      sf::Event::JoystickButtonPressed event;
      event.joystickId = joystickId;
      event.button = button;
      return sf::Event(event);
    }
    sf::Event::JoystickButtonReleased event;
    event.joystickId = joystickId;
    event.button = button;
    return sf::Event(event);
  }

  if (kind == "JoystickMoved") {
    unsigned joystickId{};
    int axis{};
    double position{};
    if (!ReadUnsigned(object, "joystickId", &joystickId) ||
        !ReadInt(object, "axis", &axis) ||
        !ReadNumber(object, "position", &position)) {
      Nan::ThrowTypeError("Invalid JoystickMoved event");
      return std::nullopt;
    }
    sf::Event::JoystickMoved event;
    event.joystickId = joystickId;
    event.axis = static_cast<sf::Joystick::Axis>(axis);
    event.position = static_cast<float>(position);
    return sf::Event(event);
  }

  if (kind == "JoystickConnected" || kind == "JoystickDisconnected") {
    unsigned joystickId{};
    if (!ReadUnsigned(object, "joystickId", &joystickId)) {
      Nan::ThrowTypeError("Invalid joystick connection event");
      return std::nullopt;
    }
    if (kind == "JoystickConnected") {
      sf::Event::JoystickConnected event;
      event.joystickId = joystickId;
      return sf::Event(event);
    }
    sf::Event::JoystickDisconnected event;
    event.joystickId = joystickId;
    return sf::Event(event);
  }

  if (kind == "TouchBegan" || kind == "TouchMoved" || kind == "TouchEnded") {
    unsigned finger{};
    sf::Vector2i position;
    if (!ReadUnsigned(object, "finger", &finger) ||
        !ReadVector2i(object, "position", &position)) {
      Nan::ThrowTypeError("Invalid touch event");
      return std::nullopt;
    }
    if (kind == "TouchBegan") {
      sf::Event::TouchBegan event;
      event.finger = finger;
      event.position = position;
      return sf::Event(event);
    }
    if (kind == "TouchMoved") {
      sf::Event::TouchMoved event;
      event.finger = finger;
      event.position = position;
      return sf::Event(event);
    }
    sf::Event::TouchEnded event;
    event.finger = finger;
    event.position = position;
    return sf::Event(event);
  }

  if (kind == "SensorChanged") {
    int type{};
    sf::Vector3f value;
    if (!ReadInt(object, "type", &type) ||
        !ReadVector3f(object, "value", &value)) {
      Nan::ThrowTypeError("Invalid SensorChanged event");
      return std::nullopt;
    }
    sf::Event::SensorChanged event;
    event.type = static_cast<sf::Sensor::Type>(type);
    event.value = value;
    return sf::Event(event);
  }

  Nan::ThrowTypeError("Unsupported sfml.js event kind");
  return std::nullopt;
}

bool ReadWindow(v8::Local<v8::Value> value, sf::RenderWindow** window) {
  *window = sfmlimgui::GetRenderWindow(value);
  return *window != nullptr;
}

NAN_METHOD(Init) {
  sf::RenderWindow* window;
  if (!ReadWindow(info[0], &window)) return;
  if (!info[1]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
  info.GetReturnValue().Set(ImGui::SFML::Init(*window, info[1]->IsTrue()));
}

NAN_METHOD(Shutdown) {
  sf::RenderWindow* window;
  if (!ReadWindow(info[0], &window)) return;
  ImGui::SFML::Shutdown(*window);
}

NAN_METHOD(SetCurrentWindow) {
  sf::RenderWindow* window;
  if (!ReadWindow(info[0], &window)) return;
  ImGui::SFML::SetCurrentWindow(*window);
}

NAN_METHOD(ProcessEvent) {
  sf::RenderWindow* window;
  if (!ReadWindow(info[0], &window)) return;
  auto event = BuildEvent(info[1]);
  if (!event) return;
  ImGui::SFML::ProcessEvent(*window, *event);
}

NAN_METHOD(Update) {
  sf::RenderWindow* window;
  if (!ReadWindow(info[0], &window)) return;
  if (!info[1]->IsNumber()) return Nan::ThrowTypeError("Expected seconds");
  const double seconds = Nan::To<double>(info[1]).FromJust();
  if (!std::isfinite(seconds) || seconds < 0) {
    return Nan::ThrowRangeError("Expected finite non-negative seconds");
  }
  ImGui::SFML::Update(*window, sf::seconds(static_cast<float>(seconds)));
}

NAN_METHOD(Render) {
  sf::RenderWindow* window;
  if (!ReadWindow(info[0], &window)) return;
  ImGui::SFML::Render(*window);
  sfmlimgui::ThrowPendingImGuiDrawCallbackException(info);
}

NAN_METHOD(UpdateFontTexture) {
  info.GetReturnValue().Set(ImGui::SFML::UpdateFontTexture());
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiIntegration) {
  sfmljs::SetMethod<Init>(target, "init");
  sfmljs::SetMethod<Shutdown>(target, "shutdown");
  sfmljs::SetMethod<SetCurrentWindow>(target, "setCurrentWindow");
  sfmljs::SetMethod<ProcessEvent>(target, "processEvent");
  sfmljs::SetMethod<Update>(target, "update");
  sfmljs::SetMethod<Render>(target, "render");
  sfmljs::SetMethod<UpdateFontTexture>(target, "updateFontTexture");
}
