// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#pragma once

#include <nan.h>
#include <sfml-js-interop.h>

#include <SFML/Graphics/RenderWindow.hpp>

namespace sfmlimgui {

// Thin forwarder so addon code never includes sfml.js headers directly.

inline sf::RenderWindow* GetRenderWindow(v8::Local<v8::Value> value) {
  return sfmljs::interop::RenderWindowFrom(value);
}

}  // namespace sfmlimgui
