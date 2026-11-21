// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_CARET_BOUNDS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_CARET_BOUNDS_H_

#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/Matrix4.h>
#include <RmlUi/Core/Rectangle.h>
#include <RmlUi/Core/Types.h>

#include <array>
#include <cmath>

#include "vendor/rmlui/Source/Core/TransformState.h"

namespace sfmlrmlui::ime {

// The widget supplies its actual caret, including its current text scroll.
inline Rml::Rectanglef CaretBounds(Rml::Element* element,
                                   Rml::Vector2f position,
                                   float height) {
  if (!element || !std::isfinite(position.x) || !std::isfinite(position.y) ||
      !std::isfinite(height) || height <= 0.f) {
    return Rml::Rectanglef::MakeInvalid();
  }
  const auto bounds =
      Rml::Rectanglef::FromPositionSize(position, {1.f, height});
  const auto* state = element->GetTransformState();
  const auto* transform = state ? state->GetTransform() : nullptr;
  if (!transform) {
    return bounds;
  }

  // Match RmlUi's orthographic depth range. x/w and y/w are already window
  // pixels; applying the viewport transform a second time would shift them.
  constexpr float depth_limit = 10'000.f;
  const std::array corners{bounds.TopLeft(),
                           bounds.TopRight(),
                           bounds.BottomRight(),
                           bounds.BottomLeft()};
  Rml::Rectanglef projected = Rml::Rectanglef::MakeInvalid();
  for (const auto corner : corners) {
    const auto point = *transform * Rml::Vector4f(corner.x, corner.y, 0.f, 1.f);
    if (!std::isfinite(point.x) || !std::isfinite(point.y) ||
        !std::isfinite(point.z) || !std::isfinite(point.w) || point.w <= 0.f ||
        std::abs(point.z) > depth_limit * point.w) {
      return Rml::Rectanglef::MakeInvalid();
    }
    const Rml::Vector2f screen{point.x / point.w, point.y / point.w};
    if (!std::isfinite(screen.x) || !std::isfinite(screen.y)) {
      return Rml::Rectanglef::MakeInvalid();
    }
    projected = projected.Valid() ? projected.Join(screen)
                                  : Rml::Rectanglef::FromPosition(screen);
  }
  return projected;
}

}  // namespace sfmlrmlui::ime

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_CARET_BOUNDS_H_
