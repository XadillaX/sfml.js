// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <nan.h>

#include <cmath>
#include <cstdint>
#include <cstring>
#include <limits>
#include <string>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

bool Integer(v8::Local<v8::Value> value,
             int min,
             int max,
             int* result,
             const char* message) {
  if (value->IsNumber()) {
    const double number = Nan::To<double>(value).FromJust();
    if (std::isfinite(number) && std::trunc(number) == number &&
        number >= min && number <= max) {
      *result = static_cast<int>(number);
      return true;
    }
  }
  Nan::ThrowTypeError(message);
  return false;
}

bool Modifiers(v8::Local<v8::Value> value, int* result) {
  return Integer(value, 0, 127, result, "Invalid input modifier bitmask");
}

bool Float(v8::Local<v8::Value> value, float* result) {
  if (!value->IsNumber()) {
    return false;
  }
  const double number = Nan::To<double>(value).FromJust();
  if (!std::isfinite(number) ||
      std::abs(number) > std::numeric_limits<float>::max()) {
    return false;
  }
  *result = static_cast<float>(number);
  return true;
}

bool Vector(v8::Local<v8::Value> value,
            Rml::Vector2f* result,
            const char* message) {
  if (value->IsObject()) {
    auto object = value.As<v8::Object>();
    v8::Local<v8::Value> x;
    v8::Local<v8::Value> y;
    if (!Nan::Get(object, Nan::New("x").ToLocalChecked()).ToLocal(&x) ||
        !Nan::Get(object, Nan::New("y").ToLocalChecked()).ToLocal(&y)) {
      return false;
    }
    if (Float(x, &result->x) && Float(y, &result->y)) {
      return true;
    }
  }
  Nan::ThrowTypeError(message);
  return false;
}

bool TouchIdentifier(v8::Local<v8::Value> value, Rml::TouchId* result) {
  constexpr auto max = std::numeric_limits<Rml::TouchId>::max();
  if (value->IsBigInt()) {
    bool lossless = false;
    const uint64_t identifier = value.As<v8::BigInt>()->Uint64Value(&lossless);
    if (lossless && identifier <= max) {
      *result = static_cast<Rml::TouchId>(identifier);
      return true;
    }
  } else if (value->IsNumber()) {
    const double identifier = Nan::To<double>(value).FromJust();
    if (std::isfinite(identifier) && identifier >= 0 &&
        identifier <= 9007199254740991.0 &&
        identifier <= static_cast<double>(max) &&
        std::trunc(identifier) == identifier) {
      *result = static_cast<Rml::TouchId>(identifier);
      return true;
    }
  }
  Nan::ThrowTypeError("Invalid touch identifier; expected an exact uintptr_t");
  return false;
}

bool Touches(v8::Local<v8::Value> value, Rml::TouchList* result) {
  if (!value->IsArray()) {
    Nan::ThrowTypeError("Expected a touch list");
    return false;
  }
  auto array = value.As<v8::Array>();
  const uint32_t length = array->Length();
  for (uint32_t i = 0; i < length; ++i) {
    v8::Local<v8::Value> item;
    if (!Nan::Get(array, i).ToLocal(&item)) {
      return false;
    }
    if (!item->IsObject()) {
      Nan::ThrowTypeError("Invalid touch entry");
      return false;
    }
    auto object = item.As<v8::Object>();
    v8::Local<v8::Value> identifier;
    v8::Local<v8::Value> position;
    if (!Nan::Get(object, Nan::New("identifier").ToLocalChecked())
             .ToLocal(&identifier) ||
        !Nan::Get(object, Nan::New("position").ToLocalChecked())
             .ToLocal(&position)) {
      return false;
    }
    Rml::Touch touch;
    if (!TouchIdentifier(identifier, &touch.identifier) ||
        !Vector(position, &touch.position, "Invalid touch position")) {
      return false;
    }
    // Upstream converts touch coordinates to int for its mouse simulation.
    // Check the rounded float too, since INT_MAX rounds up when stored as
    // float.
    if (static_cast<double>(touch.position.x) <
            std::numeric_limits<int>::min() ||
        static_cast<double>(touch.position.x) >
            std::numeric_limits<int>::max() ||
        static_cast<double>(touch.position.y) <
            std::numeric_limits<int>::min() ||
        static_cast<double>(touch.position.y) >
            std::numeric_limits<int>::max()) {
      Nan::ThrowTypeError("Touch position exceeds native coordinate range");
      return false;
    }
    result->push_back(touch);
  }
  return true;
}

template <bool down>
NAN_METHOD(ProcessKey) {
  int key{};
  int modifiers{};
  if (!Integer(info[1],
               0,
               Rml::Input::KI_LAST_CUSTOM_KEY,
               &key,
               "Invalid key identifier") ||
      !Modifiers(info[2], &modifiers)) {
    return;
  }
  if (auto* context = ContextOf(info[0])) {
    const auto identifier = static_cast<Rml::Input::KeyIdentifier>(key);
    info.GetReturnValue().Set(
        down ? context->ProcessKeyDown(identifier, modifiers)
             : context->ProcessKeyUp(identifier, modifiers));
  }
}

NAN_METHOD(ProcessTextInput) {
  if (info[1]->IsString()) {
    // V8's UTF-8 conversion replaces isolated UTF-16 surrogates. Reject them
    // explicitly so input text never changes silently at the language boundary.
    Nan::Utf8String utf8(info[1]);
    auto text = info[1].As<v8::String>();
    std::u16string utf16(static_cast<size_t>(text->Length()), u'\0');
    text->Write(v8::Isolate::GetCurrent(),
                reinterpret_cast<uint16_t*>(utf16.data()),
                0,
                text->Length(),
                v8::String::NO_NULL_TERMINATION);
    for (size_t i = 0; i < utf16.size(); ++i) {
      const auto character = utf16[i];
      if (character >= 0xd800 && character <= 0xdbff) {
        if (++i < utf16.size() && utf16[i] >= 0xdc00 && utf16[i] <= 0xdfff) {
          continue;
        }
        return Nan::ThrowTypeError("Text must contain valid Unicode");
      }
      if (character >= 0xdc00 && character <= 0xdfff) {
        return Nan::ThrowTypeError("Text must contain valid Unicode");
      }
    }
    if (auto* context = ContextOf(info[0])) {
      info.GetReturnValue().Set(context->ProcessTextInput(
          Rml::String(*utf8, static_cast<size_t>(utf8.length()))));
    }
    return;
  }
  int character{};
  if (!Integer(info[1],
               0,
               0x10ffff,
               &character,
               "Expected Unicode text or a Unicode scalar value")) {
    return;
  }
  if (character >= 0xd800 && character <= 0xdfff) {
    return Nan::ThrowTypeError("Invalid Unicode scalar value");
  }
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(
        context->ProcessTextInput(static_cast<Rml::Character>(character)));
  }
}

NAN_METHOD(ProcessTextInputChar) {
  int byte{};
  if (!Integer(info[1], 0, 255, &byte, "Expected a native char byte (0-255)")) {
    return;
  }
  if (auto* context = ContextOf(info[0])) {
    // Preserve the byte pattern without implementation-defined integer-to-char
    // narrowing. RmlUi rejects high bytes through its native ASCII guard.
    const auto unsigned_byte = static_cast<unsigned char>(byte);
    char character{};
    std::memcpy(&character, &unsigned_byte, sizeof(character));
    info.GetReturnValue().Set(context->ProcessTextInput(character));
  }
}

NAN_METHOD(ProcessMouseMove) {
  int x{};
  int y{};
  int modifiers{};
  if (!Integer(info[1],
               std::numeric_limits<int>::min(),
               std::numeric_limits<int>::max(),
               &x,
               "Invalid mouse coordinate") ||
      !Integer(info[2],
               std::numeric_limits<int>::min(),
               std::numeric_limits<int>::max(),
               &y,
               "Invalid mouse coordinate") ||
      !Modifiers(info[3], &modifiers)) {
    return;
  }
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(context->ProcessMouseMove(x, y, modifiers));
  }
}

template <bool down>
NAN_METHOD(ProcessMouseButton) {
  int button{};
  int modifiers{};
  if (!Integer(info[1],
               0,
               std::numeric_limits<int>::max(),
               &button,
               "Invalid mouse button index") ||
      !Modifiers(info[2], &modifiers)) {
    return;
  }
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(
        down ? context->ProcessMouseButtonDown(button, modifiers)
             : context->ProcessMouseButtonUp(button, modifiers));
  }
}

NAN_METHOD(ProcessMouseWheel) {
  Rml::Vector2f delta{};
  int modifiers{};
  if (info[1]->IsNumber()) {
    if (!Float(info[1], &delta.y)) {
      return Nan::ThrowTypeError("Invalid wheel delta");
    }
  } else if (!Vector(info[1], &delta, "Invalid wheel delta")) {
    return;
  }
  if (!Modifiers(info[2], &modifiers)) {
    return;
  }
  // Property access may execute JS. Resolve the handle only after conversion.
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(context->ProcessMouseWheel(delta, modifiers));
  }
}

NAN_METHOD(ProcessMouseLeave) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(context->ProcessMouseLeave());
  }
}

NAN_METHOD(IsMouseInteracting) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(context->IsMouseInteracting());
  }
}

template <bool (Rml::Context::*process)(const Rml::TouchList&, int)>
NAN_METHOD(ProcessTouches) {
  Rml::TouchList touches;
  int modifiers{};
  if (!Touches(info[1], &touches) || !Modifiers(info[2], &modifiers)) {
    return;
  }
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set((context->*process)(touches, modifiers));
  }
}

NAN_METHOD(ProcessTouchCancel) {
  Rml::TouchList touches;
  if (!Touches(info[1], &touches)) {
    return;
  }
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(context->ProcessTouchCancel(touches));
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlInput) {
  SetRuntimeMethod<ProcessKey<true>>(target, "processKeyDown");
  SetRuntimeMethod<ProcessKey<false>>(target, "processKeyUp");
  SetRuntimeMethod<ProcessTextInput>(target, "processTextInput");
  SetRuntimeMethod<ProcessTextInputChar>(target, "processTextInputChar");
  SetRuntimeMethod<ProcessMouseMove>(target, "processMouseMove");
  SetRuntimeMethod<ProcessMouseButton<true>>(target, "processMouseButtonDown");
  SetRuntimeMethod<ProcessMouseButton<false>>(target, "processMouseButtonUp");
  SetRuntimeMethod<ProcessMouseWheel>(target, "processMouseWheel");
  SetRuntimeMethod<ProcessMouseLeave>(target, "processMouseLeave");
  SetRuntimeMethod<IsMouseInteracting, true>(target, "isMouseInteracting");
  SetRuntimeMethod<ProcessTouches<&Rml::Context::ProcessTouchStart>>(
      target, "processTouchStart");
  SetRuntimeMethod<ProcessTouches<&Rml::Context::ProcessTouchMove>>(
      target, "processTouchMove");
  SetRuntimeMethod<ProcessTouches<&Rml::Context::ProcessTouchEnd>>(
      target, "processTouchEnd");
  SetRuntimeMethod<ProcessTouchCancel>(target, "processTouchCancel");
}

}  // namespace sfmlrmlui
