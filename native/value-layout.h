#pragma once

#include <SFML/Graphics/Color.hpp>
#include <SFML/Graphics/Glsl.hpp>
#include <SFML/Graphics/Glyph.hpp>
#include <SFML/Graphics/Rect.hpp>
#include <SFML/Graphics/Transform.hpp>
#include <SFML/Graphics/Vertex.hpp>
#include <SFML/System/Angle.hpp>
#include <SFML/System/Vector2.hpp>
#include <SFML/System/Vector3.hpp>

#include <cstddef>
#include <tuple>
#include <type_traits>

namespace sfmljs::values {

// No default layout: exposing a new native value requires an explicit contract.
template <typename T>
struct Layout;

template <>
struct Layout<sf::Angle> {
  static constexpr std::size_t bytes = 4;
  // Standard layout makes the object and its first private float
  // pointer-interconvertible; checked along with sizeof by ReturnMapped.
};

template <>
struct Layout<sf::Transform> {
  // A sole private std::array<float, 16>; standard layout and size are
  // checked by ReturnMapped, and getMatrix() is verified by native probes.
  static constexpr std::size_t bytes = 64;
};

template <>
struct Layout<sf::Color> {
  static constexpr std::size_t bytes = 4;
  static_assert(offsetof(sf::Color, r) == 0 && offsetof(sf::Color, g) == 1 &&
                offsetof(sf::Color, b) == 2 && offsetof(sf::Color, a) == 3);
};

template <typename T>
struct Layout<sf::Vector2<T>> {
  using Scalar = T;
  using Value = sf::Vector2<T>;
  static constexpr std::size_t bytes = 2 * sizeof(T);
  static_assert(sizeof(T) == 1 || sizeof(T) == 2 ||
                sizeof(T) == 4 || sizeof(T) == 8);
  static_assert(offsetof(Value, x) == 0 && offsetof(Value, y) == sizeof(T));
};

template <typename T>
struct Layout<sf::Vector3<T>> {
  using Scalar = T;
  using Value = sf::Vector3<T>;
  static constexpr std::size_t bytes = 3 * sizeof(T);
  static_assert(sizeof(T) == 1 || sizeof(T) == 2 ||
                sizeof(T) == 4 || sizeof(T) == 8);
  static_assert(offsetof(Value, x) == 0 && offsetof(Value, y) == sizeof(T) &&
                offsetof(Value, z) == 2 * sizeof(T));
};

template <typename T>
struct Layout<sf::priv::Vector4<T>> {
  using Scalar = T;
  using Value = sf::priv::Vector4<T>;
  static constexpr std::size_t bytes = 4 * sizeof(T);
  static_assert(sizeof(T) == 4 || (std::is_same_v<T, bool> && sizeof(T) == 1));
  static_assert(offsetof(Value, x) == 0 && offsetof(Value, y) == sizeof(T) &&
                offsetof(Value, z) == 2 * sizeof(T) &&
                offsetof(Value, w) == 3 * sizeof(T));
};

template <typename T>
struct Layout<sf::Rect<T>> {
  using Scalar = T;
  using Value = sf::Rect<T>;
  static constexpr std::size_t bytes = 16;
  // Tuple order is the member index used by the internal TS binding.
  static constexpr auto members = std::tuple{&Value::position, &Value::size};
  static_assert(offsetof(Value, position) == 0 && offsetof(Value, size) == 8);
};

template <std::size_t Columns, std::size_t Rows>
struct Layout<sf::priv::Matrix<Columns, Rows>> {
  using Value = sf::priv::Matrix<Columns, Rows>;
  static constexpr std::size_t bytes = Columns * Rows * sizeof(float);
  static_assert(sizeof(float) == 4);
  static_assert(offsetof(Value, array) == 0);
};

template <>
struct Layout<sf::Vertex> {
  static constexpr std::size_t bytes = 20;
  static constexpr auto members = std::tuple{
      &sf::Vertex::position, &sf::Vertex::color, &sf::Vertex::texCoords};
  static_assert(offsetof(sf::Vertex, position) == 0 &&
                offsetof(sf::Vertex, color) == 8 &&
                offsetof(sf::Vertex, texCoords) == 12);
};

template <>
struct Layout<sf::Glyph> {
  static constexpr std::size_t bytes = 44;
  static constexpr auto members = std::tuple{
      &sf::Glyph::bounds, &sf::Glyph::textureRect};
  static_assert(offsetof(sf::Glyph, advance) == 0 &&
                offsetof(sf::Glyph, lsbDelta) == 4 &&
                offsetof(sf::Glyph, rsbDelta) == 8 &&
                offsetof(sf::Glyph, bounds) == 12 &&
                offsetof(sf::Glyph, textureRect) == 28);
};

}  // namespace sfmljs::values
