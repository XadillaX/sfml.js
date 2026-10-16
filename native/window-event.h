#pragma once

#include <nan.h>
#include <SFML/Window/Event.hpp>
#include <type_traits>

namespace sfmljs {

template <typename T>
inline v8::Local<v8::Value> EventValue(T value) {
  if constexpr (std::is_same_v<T, bool>) return Nan::New(value);
  else return Nan::New(static_cast<double>(value));
}

template <typename T>
inline v8::Local<v8::Value> EventValue(sf::Vector2<T> value) {
  auto result = Nan::New<v8::Array>(2);
  Nan::Set(result, 0, EventValue(value.x)).FromJust();
  Nan::Set(result, 1, EventValue(value.y)).FromJust();
  return result;
}

template <typename T>
inline v8::Local<v8::Value> EventValue(sf::Vector3<T> value) {
  auto result = Nan::New<v8::Array>(3);
  Nan::Set(result, 0, EventValue(value.x)).FromJust();
  Nan::Set(result, 1, EventValue(value.y)).FromJust();
  Nan::Set(result, 2, EventValue(value.z)).FromJust();
  return result;
}

inline v8::Local<v8::Object> WindowEvent(const sf::Event& event) {
  auto result = Nan::New<v8::Object>();
  event.visit([&](const auto& data) {
    using T = std::decay_t<decltype(data)>;
    const char* kind;
#define EVENT_KIND(name) \
    if constexpr (std::is_same_v<T, sf::Event::name>) kind = #name; else
    EVENT_KIND(Closed)
    EVENT_KIND(Resized)
    EVENT_KIND(FocusLost)
    EVENT_KIND(FocusGained)
    EVENT_KIND(TextEntered)
    EVENT_KIND(KeyPressed)
    EVENT_KIND(KeyReleased)
    EVENT_KIND(MouseWheelScrolled)
    EVENT_KIND(MouseButtonPressed)
    EVENT_KIND(MouseButtonReleased)
    EVENT_KIND(MouseMoved)
    EVENT_KIND(MouseMovedRaw)
    EVENT_KIND(MouseEntered)
    EVENT_KIND(MouseLeft)
    EVENT_KIND(JoystickButtonPressed)
    EVENT_KIND(JoystickButtonReleased)
    EVENT_KIND(JoystickMoved)
    EVENT_KIND(JoystickConnected)
    EVENT_KIND(JoystickDisconnected)
    EVENT_KIND(TouchBegan)
    EVENT_KIND(TouchMoved)
    EVENT_KIND(TouchEnded)
    EVENT_KIND(SensorChanged)
    static_assert(!sizeof(T), "Unmapped SFML event subtype");
#undef EVENT_KIND
    Nan::Set(result, Nan::New("kind").ToLocalChecked(),
             Nan::New(kind).ToLocalChecked()).FromJust();
#define EVENT_FIELD(name) \
    if constexpr (requires { data.name; }) \
      Nan::Set(result, Nan::New(#name).ToLocalChecked(), \
               EventValue(data.name)).FromJust();
    EVENT_FIELD(size)
    EVENT_FIELD(unicode)
    EVENT_FIELD(code)
    EVENT_FIELD(scancode)
    EVENT_FIELD(alt)
    EVENT_FIELD(control)
    EVENT_FIELD(shift)
    EVENT_FIELD(system)
    EVENT_FIELD(wheel)
    EVENT_FIELD(delta)
    EVENT_FIELD(position)
    EVENT_FIELD(button)
    EVENT_FIELD(joystickId)
    EVENT_FIELD(axis)
    EVENT_FIELD(finger)
    EVENT_FIELD(type)
    EVENT_FIELD(value)
#undef EVENT_FIELD
  });
  return result;
}

}  // namespace sfmljs
