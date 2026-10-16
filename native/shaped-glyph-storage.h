#pragma once

#include <SFML/Graphics/Text.hpp>

#include <cstddef>
#include <cstdint>
#include <type_traits>
#include <vector>

namespace sfmljs {

// Fixed wire layout across 32/64-bit targets. Vertex indices are doubles,
// matching JS numbers without exposing platform-dependent size_t fields.
struct ShapedGlyphData {
  sf::Glyph glyph;
  sf::Vector2f position;
  std::uint32_t cluster;
  std::uint32_t textDirection;
  float baseline;
  double vertexOffset;
  double vertexCount;

  explicit ShapedGlyphData(const sf::Text::ShapedGlyph& source)
      : glyph(source.glyph), position(source.position), cluster(source.cluster),
        textDirection(static_cast<std::uint32_t>(source.textDirection)),
        baseline(source.baseline), vertexOffset(source.vertexOffset),
        vertexCount(source.vertexCount) {}
};

static_assert(std::is_standard_layout_v<ShapedGlyphData>);
static_assert(std::is_trivially_copyable_v<ShapedGlyphData>);
static_assert(sizeof(ShapedGlyphData) == 80);
static_assert(offsetof(ShapedGlyphData, glyph) == 0);
static_assert(offsetof(ShapedGlyphData, position) == 44);
static_assert(offsetof(ShapedGlyphData, cluster) == 52);
static_assert(offsetof(ShapedGlyphData, textDirection) == 56);
static_assert(offsetof(ShapedGlyphData, baseline) == 60);
static_assert(offsetof(ShapedGlyphData, vertexOffset) == 64);
static_assert(offsetof(ShapedGlyphData, vertexCount) == 72);

// Never mutate or resize an allocation after publishing its mapped buffer.
// New layouts replace the allocation; escaped buffers/members retain the old one.
using ShapedGlyphStorage = std::vector<ShapedGlyphData>;

}  // namespace sfmljs
