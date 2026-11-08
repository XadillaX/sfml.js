#pragma once

// Public native surface for downstream addons. Bump SFMLJS_INTEROP_VERSION
// when a public symbol or the SharedHandle layout changes.

#define SFMLJS_INTEROP_VERSION 1

#include <nan.h>

#include "exception-boundary.h"
#include "numeric-fields.h"
#include "shared-handle.h"
#include <SFML/Graphics/RenderWindow.hpp>
#include <SFML/Window/Window.hpp>

namespace sfmljs {
namespace interop {

// Window handles carry the notifications slot set by MakeWindowHandle; other
// SharedHandle payloads do not, which rejects them without using the per-
// instantiation identity marker that is not shared across DSOs.
// The owner is a RenderWindowState, so its sf::Window subobject sits at
// offset 0; RTTI is not exported across DSOs, so this cannot be dynamic_cast.
inline sf::RenderWindow* RenderWindowFrom(v8::Local<v8::Value> value) {
  if (!value->IsObject() || value.As<v8::Object>()->InternalFieldCount() != 1) {
    Nan::ThrowTypeError("Expected an sfml.js RenderWindow handle");
    return nullptr;
  }
  auto object = value.As<v8::Object>();
  v8::Local<v8::Value> slot;
  if (!Nan::GetPrivate(object,
                       Nan::New("sfml.window.notifications").ToLocalChecked())
           .ToLocal(&slot) ||
      !slot->IsExternal()) {
    Nan::ThrowTypeError("Expected an sfml.js RenderWindow handle");
    return nullptr;
  }
  auto* handle = static_cast<SharedHandle<sf::Window>*>(
      Nan::GetInternalFieldPointer(object, 0));
  if (!handle || !handle->owner()) {
    Nan::ThrowTypeError("Expected an sfml.js RenderWindow handle");
    return nullptr;
  }
  return static_cast<sf::RenderWindow*>(handle->owner().get());
}

}  // namespace interop
}  // namespace sfmljs
