// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/window-density.h"

#ifndef __APPLE__
namespace sfmlrmlui {

bool EnableHighDpi(sf::RenderWindow*) {
  return true;
}

float WindowDensity(sf::RenderWindow*) {
  return 1.f;
}

}  // namespace sfmlrmlui
#endif
