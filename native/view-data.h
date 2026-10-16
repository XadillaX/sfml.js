#pragma once

#include <SFML/Graphics/View.hpp>
#include <span>

namespace sfmljs {

// Center, size, rotation, normalized viewport and normalized scissor.
inline bool ValidView(std::span<const float, 13> values) {
  const auto x = values[9], y = values[10];
  const auto width = values[11], height = values[12];
  return x >= 0 && x <= 1 && y >= 0 && y <= 1 &&
      width >= 0 && height >= 0 && x + width <= 1 && y + height <= 1;
}

inline sf::View MakeView(std::span<const float, 13> values) {
  sf::View view({values[0], values[1]}, {values[2], values[3]});
  view.setRotation(sf::radians(values[4]));
  view.setViewport({{values[5], values[6]}, {values[7], values[8]}});
  view.setScissor({{values[9], values[10]}, {values[11], values[12]}});
  return view;
}

}  // namespace sfmljs
