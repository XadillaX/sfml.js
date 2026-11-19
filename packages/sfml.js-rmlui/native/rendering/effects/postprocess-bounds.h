// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_POSTPROCESS_BOUNDS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_POSTPROCESS_BOUNDS_H_

#include <RmlUi/Core/Rectangle.h>
#include <RmlUi/Core/Types.h>

#include <SFML/Graphics/Shader.hpp>

namespace sfmlrmlui {

// RmlUi and SFML rectangles use top-left pixels; render-texture shader
// coordinates use bottom-left UVs after SFML's texture matrix.
inline Rml::Rectanglei FlipPostBounds(Rml::Rectanglei bounds, unsigned height) {
  return Rml::Rectanglei::FromCorners(
      {bounds.p0.x, static_cast<int>(height) - bounds.p1.y},
      {bounds.p1.x, static_cast<int>(height) - bounds.p0.y});
}

// Compare exact pixel centers before normalizing UVs. This preserves GL3's
// half-texel limits without interpolation rounding dropping a boundary row.
inline void SetPostSampleBounds(sf::Shader* shader,
                                Rml::Rectanglei bounds,
                                sf::Vector2u size,
                                bool normalized = false) {
  const auto flipped = FlipPostBounds(bounds, size.y);
  sf::Vector2f minimum{flipped.p0.x + 0.5f, flipped.p0.y + 0.5f};
  sf::Vector2f maximum{flipped.p1.x - 0.5f, flipped.p1.y - 0.5f};
  if (normalized) {
    minimum.x /= size.x;
    minimum.y /= size.y;
    maximum.x /= size.x;
    maximum.y /= size.y;
  }
  shader->setUniform(normalized ? "texCoordMin" : "sampleMin", minimum);
  shader->setUniform(normalized ? "texCoordMax" : "sampleMax", maximum);
  if (!normalized) {
    shader->setUniform(
        "targetSize",
        sf::Vector2f{static_cast<float>(size.x), static_cast<float>(size.y)});
  }
}

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_POSTPROCESS_BOUNDS_H_
