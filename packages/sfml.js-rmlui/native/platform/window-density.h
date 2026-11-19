// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_WINDOW_DENSITY_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_WINDOW_DENSITY_H_

#include <SFML/Graphics/RenderWindow.hpp>

namespace sfmlrmlui {

// Enable native pixel rendering without changing the window's on-screen size.
// SFML remains responsible for window sizes, input coordinates and capture.
bool EnableHighDpi(sf::RenderWindow* window);

// Actual framebuffer pixels per density-independent pixel, not a UI zoom.
float WindowDensity(sf::RenderWindow* window);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_WINDOW_DENSITY_H_
