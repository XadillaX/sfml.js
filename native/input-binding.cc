#include "shared-handle.h"
#include "exception-boundary.h"
#include "window-event.h"

#include <SFML/System/String.hpp>
#include <SFML/Window/Clipboard.hpp>
#include <SFML/Window/Joystick.hpp>
#include <SFML/Window/Keyboard.hpp>
#include <SFML/Window/Mouse.hpp>
#include <SFML/Window/Sensor.hpp>
#include <SFML/Window/Touch.hpp>
#include <SFML/Window/Window.hpp>

namespace {

bool ReadIndex(v8::Local<v8::Value> value, int count, int& result,
               int minimum = 0) {
  if (!value->IsInt32()) {
    Nan::ThrowRangeError("Expected an integer input index");
    return false;
  }
  result = Nan::To<int>(value).FromJust();
  if (result < minimum || result >= count) {
    Nan::ThrowRangeError("Input index is out of range");
    return false;
  }
  return true;
}

bool ReadBoolean(v8::Local<v8::Value> value) {
  if (value->IsBoolean()) return true;
  Nan::ThrowTypeError("Expected a boolean");
  return false;
}

v8::Local<v8::String> StringValue(const sf::String& value) {
  const auto utf8 = value.toUtf8();
  return Nan::New(reinterpret_cast<const char*>(utf8.data()),
                  static_cast<int>(utf8.size())).ToLocalChecked();
}

NAN_METHOD(GetClipboardString) {
  info.GetReturnValue().Set(StringValue(sf::Clipboard::getString()));
}

NAN_METHOD(SetClipboardString) {
  if (!info[0]->IsString()) return Nan::ThrowTypeError("Expected clipboard text");
  Nan::Utf8String text(info[0]);
  sf::Clipboard::setString(sf::String::fromUtf8(*text, *text + text.length()));
}

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
NAN_METHOD(IsTouchDown) {
  if (!info[0]->IsUint32()) return Nan::ThrowRangeError("Invalid finger index");
  info.GetReturnValue().Set(
      sf::Touch::isDown(Nan::To<std::uint32_t>(info[0]).FromJust()));
}

NAN_METHOD(GetTouchPosition) {
  if (!info[0]->IsUint32()) return Nan::ThrowRangeError("Invalid finger index");
  const auto finger = Nan::To<std::uint32_t>(info[0]).FromJust();
  sf::Vector2i position;
  if (info[1]->IsUndefined()) {
    position = sf::Touch::getPosition(finger);
  } else {
    auto* window = sfmljs::SharedHandle<sf::Window>::From(info[1]);
    if (!window) return;
    position = sf::Touch::getPosition(finger, *window->owner());
  }
  info.GetReturnValue().Set(sfmljs::EventValue(position));
}
#pragma GCC diagnostic pop

NAN_METHOD(IsKeyPressed) {
  if (!ReadBoolean(info[1])) return;
  const bool scancode = info[1]->IsTrue();
  int code;
  if (!ReadIndex(info[0], scancode ? sf::Keyboard::ScancodeCount
                                  : sf::Keyboard::KeyCount, code, -1)) return;
  info.GetReturnValue().Set(scancode
      ? sf::Keyboard::isKeyPressed(static_cast<sf::Keyboard::Scancode>(code))
      : sf::Keyboard::isKeyPressed(static_cast<sf::Keyboard::Key>(code)));
}

NAN_METHOD(LocalizeKey) {
  int code;
  if (!ReadIndex(info[0], sf::Keyboard::ScancodeCount, code, -1)) return;
  info.GetReturnValue().Set(static_cast<int>(
      sf::Keyboard::localize(static_cast<sf::Keyboard::Scancode>(code))));
}

NAN_METHOD(DelocalizeKey) {
  int key;
  if (!ReadIndex(info[0], sf::Keyboard::KeyCount, key, -1)) return;
  info.GetReturnValue().Set(static_cast<int>(
      sf::Keyboard::delocalize(static_cast<sf::Keyboard::Key>(key))));
}

NAN_METHOD(GetKeyDescription) {
  int code;
  if (!ReadIndex(info[0], sf::Keyboard::ScancodeCount, code, -1)) return;
  info.GetReturnValue().Set(StringValue(
      sf::Keyboard::getDescription(static_cast<sf::Keyboard::Scancode>(code))));
}

NAN_METHOD(SetVirtualKeyboardVisible) {
  if (ReadBoolean(info[0])) {
    sf::Keyboard::setVirtualKeyboardVisible(info[0]->IsTrue());
  }
}

NAN_METHOD(IsMouseButtonPressed) {
  int button;
  if (!ReadIndex(info[0], sf::Mouse::ButtonCount, button)) return;
  info.GetReturnValue().Set(
      sf::Mouse::isButtonPressed(static_cast<sf::Mouse::Button>(button)));
}

NAN_METHOD(GetMousePosition) {
  sf::Vector2i position;
  if (info[0]->IsUndefined()) {
    position = sf::Mouse::getPosition();
  } else {
    auto* window = sfmljs::SharedHandle<sf::Window>::From(info[0]);
    if (!window) return;
    position = sf::Mouse::getPosition(*window->owner());
  }
  info.GetReturnValue().Set(sfmljs::EventValue(position));
}

NAN_METHOD(SetMousePosition) {
  if (!info[0]->IsInt32() || !info[1]->IsInt32()) {
    return Nan::ThrowTypeError("Expected integer coordinates");
  }
  const sf::Vector2i position{Nan::To<int>(info[0]).FromJust(),
                              Nan::To<int>(info[1]).FromJust()};
  if (info[2]->IsUndefined()) {
    sf::Mouse::setPosition(position);
  } else {
    auto* window = sfmljs::SharedHandle<sf::Window>::From(info[2]);
    if (window) sf::Mouse::setPosition(position, *window->owner());
  }
}

NAN_METHOD(IsJoystickConnected) {
  int joystick;
  if (!ReadIndex(info[0], sf::Joystick::Count, joystick)) return;
  info.GetReturnValue().Set(sf::Joystick::isConnected(joystick));
}

NAN_METHOD(GetJoystickButtonCount) {
  int joystick;
  if (!ReadIndex(info[0], sf::Joystick::Count, joystick)) return;
  info.GetReturnValue().Set(sf::Joystick::getButtonCount(joystick));
}

NAN_METHOD(JoystickHasAxis) {
  int joystick, axis;
  if (!ReadIndex(info[0], sf::Joystick::Count, joystick) ||
      !ReadIndex(info[1], sf::Joystick::AxisCount, axis)) return;
  info.GetReturnValue().Set(
      sf::Joystick::hasAxis(joystick, static_cast<sf::Joystick::Axis>(axis)));
}

NAN_METHOD(IsJoystickButtonPressed) {
  int joystick, button;
  if (!ReadIndex(info[0], sf::Joystick::Count, joystick) ||
      !ReadIndex(info[1], sf::Joystick::ButtonCount, button)) return;
  info.GetReturnValue().Set(sf::Joystick::isButtonPressed(joystick, button));
}

NAN_METHOD(GetJoystickAxisPosition) {
  int joystick, axis;
  if (!ReadIndex(info[0], sf::Joystick::Count, joystick) ||
      !ReadIndex(info[1], sf::Joystick::AxisCount, axis)) return;
  info.GetReturnValue().Set(
      sf::Joystick::getAxisPosition(joystick,
                                    static_cast<sf::Joystick::Axis>(axis)));
}

NAN_METHOD(GetJoystickIdentification) {
  int joystick;
  if (!ReadIndex(info[0], sf::Joystick::Count, joystick)) return;
  const auto id = sf::Joystick::getIdentification(joystick);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("name").ToLocalChecked(),
           StringValue(id.name)).FromJust();
  Nan::Set(result, Nan::New("vendorId").ToLocalChecked(),
           Nan::New(id.vendorId)).FromJust();
  Nan::Set(result, Nan::New("productId").ToLocalChecked(),
           Nan::New(id.productId)).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(UpdateJoysticks) {
  sf::Joystick::update();
}

NAN_METHOD(IsSensorAvailable) {
  int sensor;
  if (!ReadIndex(info[0], sf::Sensor::Count, sensor)) return;
  info.GetReturnValue().Set(
      sf::Sensor::isAvailable(static_cast<sf::Sensor::Type>(sensor)));
}

NAN_METHOD(SetSensorEnabled) {
  int sensor;
  if (!ReadIndex(info[0], sf::Sensor::Count, sensor) ||
      !ReadBoolean(info[1])) return;
  sf::Sensor::setEnabled(static_cast<sf::Sensor::Type>(sensor), info[1]->IsTrue());
}

NAN_METHOD(GetSensorValue) {
  int sensor;
  if (!ReadIndex(info[0], sf::Sensor::Count, sensor)) return;
  info.GetReturnValue().Set(sfmljs::EventValue(
      sf::Sensor::getValue(static_cast<sf::Sensor::Type>(sensor))));
}

}  // namespace

NAN_MODULE_INIT(InitializeInput) {
  sfmljs::SetMethod<GetClipboardString>(target, "getClipboardString");
  sfmljs::SetMethod<SetClipboardString>(target, "setClipboardString");
  sfmljs::SetMethod<IsTouchDown>(target, "isTouchDown");
  sfmljs::SetMethod<GetTouchPosition>(target, "getTouchPosition");
  sfmljs::SetMethod<IsKeyPressed>(target, "isKeyPressed");
  sfmljs::SetMethod<LocalizeKey>(target, "localizeKey");
  sfmljs::SetMethod<DelocalizeKey>(target, "delocalizeKey");
  sfmljs::SetMethod<GetKeyDescription>(target, "getKeyDescription");
  sfmljs::SetMethod<SetVirtualKeyboardVisible>(target, "setVirtualKeyboardVisible");
  sfmljs::SetMethod<IsMouseButtonPressed>(target, "isMouseButtonPressed");
  sfmljs::SetMethod<GetMousePosition>(target, "getMousePosition");
  sfmljs::SetMethod<SetMousePosition>(target, "setMousePosition");
  sfmljs::SetMethod<IsJoystickConnected>(target, "isJoystickConnected");
  sfmljs::SetMethod<GetJoystickButtonCount>(target, "getJoystickButtonCount");
  sfmljs::SetMethod<JoystickHasAxis>(target, "joystickHasAxis");
  sfmljs::SetMethod<IsJoystickButtonPressed>(target, "isJoystickButtonPressed");
  sfmljs::SetMethod<GetJoystickAxisPosition>(target, "getJoystickAxisPosition");
  sfmljs::SetMethod<GetJoystickIdentification>(target, "getJoystickIdentification");
  sfmljs::SetMethod<UpdateJoysticks>(target, "updateJoysticks");
  sfmljs::SetMethod<IsSensorAvailable>(target, "isSensorAvailable");
  sfmljs::SetMethod<SetSensorEnabled>(target, "setSensorEnabled");
  sfmljs::SetMethod<GetSensorValue>(target, "getSensorValue");
}
