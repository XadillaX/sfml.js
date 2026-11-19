// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_FILTER_RECORD_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_FILTER_RECORD_H_

#include <RmlUi/Core/Rectangle.h>

#include <memory>

#include "native/rendering/effects/color-filter.h"
#include <SFML/Graphics/Color.hpp>
#include <SFML/Graphics/Texture.hpp>

namespace sfmlrmlui {

// Immutable compiled effect state. Masks retain their captured pixels and
// top-left bounds; color filters retain their native matrix and opacity.
struct FilterRecord {
  enum class Kind {
    kBlur,
    kDropShadow,
    kMask,
    kColor,
  };

  Kind kind{Kind::kBlur};
  float sigma{0.f};
  sf::Vector2f offset;
  sf::Color color{sf::Color::Black};
  ColorFilterData color_filter;
  std::unique_ptr<sf::Texture> mask_texture;
  Rml::Rectanglei mask_bounds;
};

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_FILTER_RECORD_H_
