// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#import <AppKit/AppKit.h>

#include <limits>
#include <optional>

#include "native/platform/window-density.h"

namespace sfmlrmlui {
namespace {

NSOpenGLView* FindSurface(NSView* view) {
  if ([view isKindOfClass:[NSOpenGLView class]]) {
    return static_cast<NSOpenGLView*>(view);
  }
  for (NSView* child in view.subviews) {
    if (auto* surface = FindSurface(child)) return surface;
  }
  return nil;
}

NSOpenGLView* WindowSurface(sf::RenderWindow* window) {
  if (!window || !window->isOpen()) return nil;
  id handle = static_cast<id>(window->getNativeHandle());
  NSView* content = [handle isKindOfClass:[NSWindow class]]
                        ? [static_cast<NSWindow*>(handle) contentView]
                        : static_cast<NSView*>(handle);
  return FindSurface(content);
}

std::optional<sf::Vector2u> ScaleLimit(NSSize points, float ratio) {
  const auto maximum = std::numeric_limits<unsigned>::max();
  if ((points.width == 0 && points.height == 0) ||
      points.width * ratio >= maximum || points.height * ratio >= maximum) {
    return std::nullopt;
  }
  return sf::Vector2u(static_cast<unsigned>(points.width * ratio),
                      static_cast<unsigned>(points.height * ratio));
}

}  // namespace

bool EnableHighDpi(sf::RenderWindow* window) {
  auto* surface = WindowSurface(window);
  if (!surface) return false;
  const NSSize points = surface.bounds.size;
  const auto original_size = window->getSize();
  const BOOL was_enabled = surface.wantsBestResolutionOpenGLSurface;
  const float old_density = WindowDensity(window);
  // SFML exposes setters only; Cocoa stores the corresponding point limits.
  const NSSize minimum = surface.window.contentMinSize;
  const NSSize maximum = surface.window.contentMaxSize;
  window->setMinimumSize(std::nullopt);
  window->setMaximumSize(std::nullopt);
  surface.wantsBestResolutionOpenGLSurface = YES;
  [surface.openGLContext update];
  const NSRect backing = [surface convertRectToBacking:surface.bounds];
  // The patched SFML backend scales this request back to Cocoa points and
  // updates WindowBase's size cache immediately, before the first pollEvent.
  window->setSize({static_cast<unsigned>(backing.size.width),
                   static_cast<unsigned>(backing.size.height)});
  if (!NSEqualSizes(surface.bounds.size, points)) {
    // A replaced or stale SDK must not silently double the on-screen window.
    surface.wantsBestResolutionOpenGLSurface = was_enabled;
    [surface.openGLContext update];
    window->setSize(original_size);
    window->setMinimumSize(ScaleLimit(minimum, old_density));
    window->setMaximumSize(ScaleLimit(maximum, old_density));
    return false;
  }
  const float ratio = WindowDensity(window);
  window->setMinimumSize(ScaleLimit(minimum, ratio));
  window->setMaximumSize(ScaleLimit(maximum, ratio));
  window->setView(window->getView());
  return true;
}

float WindowDensity(sf::RenderWindow* window) {
  auto* surface = WindowSurface(window);
  if (!surface || !surface.wantsBestResolutionOpenGLSurface) return 1.f;
  return static_cast<float>(surface.window.backingScaleFactor);
}

}  // namespace sfmlrmlui
