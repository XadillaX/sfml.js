#pragma once

#include <nan.h>
#include <SFML/Window/ContextSettings.hpp>
#include "shared-handle.h"

namespace sfmljs {

template <typename Owner>
v8::Local<v8::ArrayBuffer> MapContextSettings(
    v8::Isolate* isolate, const std::shared_ptr<Owner>& owner,
    const sf::ContextSettings& settings) {
  static_assert(offsetof(sf::ContextSettings, depthBits) == 0);
  static_assert(offsetof(sf::ContextSettings, stencilBits) == 4);
  static_assert(offsetof(sf::ContextSettings, antiAliasingLevel) == 8);
  static_assert(offsetof(sf::ContextSettings, majorVersion) == 12);
  static_assert(offsetof(sf::ContextSettings, minorVersion) == 16);
  static_assert(offsetof(sf::ContextSettings, attributeFlags) == 20);
  static_assert(offsetof(sf::ContextSettings, sRgbCapable) == 24);
  static_assert(sizeof(bool) == 1);
  return MapShared(isolate, owner, const_cast<sf::ContextSettings*>(&settings),
                   sizeof(settings));
}

inline bool ReadContextSettings(v8::Local<v8::Value> value,
                                sf::ContextSettings& settings) {
  if (value->IsUndefined()) return true;
  // Existing internal probes can still supply the stencil size alone.
  if (value->IsUint32()) {
    settings.stencilBits = Nan::To<std::uint32_t>(value).FromJust();
  } else {
    if (!value->IsObject() || value->IsNull() || value->IsArray()) {
      Nan::ThrowTypeError("Expected ContextSettings");
      return false;
    }
    const auto object = value.As<v8::Object>();
    const auto integer = [&](const char* name, unsigned int& output) {
      v8::Local<v8::Value> field;
      if (!Nan::Get(object, Nan::New(name).ToLocalChecked()).ToLocal(&field)) {
        return false;
      }
      if (field->IsUndefined()) return true;
      if (!field->IsUint32()) {
        Nan::ThrowRangeError("Context settings require unsigned 32-bit integers");
        return false;
      }
      output = Nan::To<std::uint32_t>(field).FromJust();
      return true;
    };
    if (!integer("depthBits", settings.depthBits) ||
        !integer("stencilBits", settings.stencilBits) ||
        !integer("antiAliasingLevel", settings.antiAliasingLevel) ||
        !integer("majorVersion", settings.majorVersion) ||
        !integer("minorVersion", settings.minorVersion) ||
        !integer("attributeFlags", settings.attributeFlags)) return false;
    v8::Local<v8::Value> srgb;
    if (!Nan::Get(object, Nan::New("sRgbCapable").ToLocalChecked()).ToLocal(
            &srgb)) return false;
    if (!srgb->IsUndefined()) {
      if (!srgb->IsBoolean()) {
        Nan::ThrowTypeError("sRgbCapable must be a boolean");
        return false;
      }
      settings.sRgbCapable = srgb->IsTrue();
    }
  }
  if (settings.stencilBits > 32 || (settings.attributeFlags & ~5u)) {
    Nan::ThrowRangeError("Invalid stencil size or context attribute flags");
    return false;
  }
  return true;
}

}  // namespace sfmljs
