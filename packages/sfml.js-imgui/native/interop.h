// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_IMGUI_NATIVE_INTEROP_H_
#define PACKAGES_SFML_JS_IMGUI_NATIVE_INTEROP_H_

#include <nan.h>
#include <sfml-js-interop.h>

#include <SFML/Graphics/RenderWindow.hpp>

namespace sfmlimgui {

// Thin forwarder so addon code never includes sfml.js headers directly.

inline sf::RenderWindow* GetRenderWindow(v8::Local<v8::Value> value) {
  return sfmljs::interop::RenderWindowFrom(value);
}

}  // namespace sfmlimgui

#endif  // PACKAGES_SFML_JS_IMGUI_NATIVE_INTEROP_H_
