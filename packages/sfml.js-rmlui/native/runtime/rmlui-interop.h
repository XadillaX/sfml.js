// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_INTEROP_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_INTEROP_H_

#include <nan.h>
#include <sfml-js-interop.h>

#include <SFML/Graphics/RenderWindow.hpp>

namespace sfmlrmlui {

// Thin forwarder so addon code never includes sfml.js headers directly.
inline sf::RenderWindow* GetRenderWindow(v8::Local<v8::Value> value) {
  return sfmljs::interop::RenderWindowFrom(value);
}

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_INTEROP_H_
