#pragma once

#include "font-state.h"
#include "shaped-glyph-storage.h"
#include "vertex-storage.h"

#include <SFML/Graphics/Text.hpp>

#include <array>
#include <memory>
#include <stdexcept>

namespace sfmljs {
namespace text_members {

// Explicit instantiation may name private members (C++ [temp.explicit]).
// Member pointers follow the installed SFML headers; no object-layout replica
// or hard-coded offset into the polymorphic sf::Text object is used.
template <typename Tag, typename Tag::Type Pointer>
struct Access {
  friend typename Tag::Type Member(Tag) { return Pointer; }
};

#define SFMLJS_TEXT_MEMBER(Tag, Value, Name) \
  struct Tag { \
    using Type = Value sf::Text::*; \
    friend Type Member(Tag); \
  }; \
  template struct Access<Tag, &sf::Text::Name>

SFMLJS_TEXT_MEMBER(CharacterSize, unsigned int, m_characterSize);
SFMLJS_TEXT_MEMBER(LetterSpacing, float, m_letterSpacingFactor);
SFMLJS_TEXT_MEMBER(LineSpacing, float, m_lineSpacingFactor);
SFMLJS_TEXT_MEMBER(Style, std::uint32_t, m_style);
SFMLJS_TEXT_MEMBER(FillColor, sf::Color, m_fillColor);
SFMLJS_TEXT_MEMBER(OutlineColor, sf::Color, m_outlineColor);
SFMLJS_TEXT_MEMBER(OutlineThickness, float, m_outlineThickness);
SFMLJS_TEXT_MEMBER(LineAlignment, sf::Text::LineAlignment, m_lineAlignment);
SFMLJS_TEXT_MEMBER(Orientation, sf::Text::TextOrientation, m_textOrientation);
SFMLJS_TEXT_MEMBER(Grouping, sf::Text::ClusterGrouping, m_clusterGrouping);
SFMLJS_TEXT_MEMBER(GeometryNeedUpdate, bool, m_geometryNeedUpdate);
SFMLJS_TEXT_MEMBER(Bounds, sf::FloatRect, m_bounds);
SFMLJS_TEXT_MEMBER(PreProcessor, sf::Text::GlyphPreProcessor, m_glyphPreProcessor);

#undef SFMLJS_TEXT_MEMBER

template <typename Tag>
decltype(auto) Get(sf::Text& text, Tag tag = {}) {
  return text.*Member(tag);
}

// These ten real SFML fields form the exposed 40-byte numeric region.
// Check every member address before creating any view.
inline void* Properties(sf::Text& text) {
  static_assert(sizeof(unsigned int) == 4 && sizeof(float) == 4);
  static_assert(sizeof(sf::Color) == 4 && sizeof(bool) == 1);
  static_assert(sizeof(sf::Text::LineAlignment) == 4);
  static_assert(sizeof(sf::Text::TextOrientation) == 4);
  static_assert(sizeof(sf::Text::ClusterGrouping) == 4);
  const std::array<const void*, 10> fields{
      &Get<CharacterSize>(text), &Get<LetterSpacing>(text),
      &Get<LineSpacing>(text), &Get<Style>(text), &Get<FillColor>(text),
      &Get<OutlineColor>(text), &Get<OutlineThickness>(text),
      &Get<LineAlignment>(text), &Get<Orientation>(text), &Get<Grouping>(text)};
  const auto start = reinterpret_cast<std::uintptr_t>(fields[0]);
  for (std::size_t i = 0; i < fields.size(); ++i) {
    if (reinterpret_cast<std::uintptr_t>(fields[i]) != start + i * 4) {
      throw std::runtime_error("Unsupported SFML Text field layout");
    }
  }
  return &Get<CharacterSize>(text);
}

}  // namespace text_members

struct TextState : TransformableState {
  explicit TextState(std::shared_ptr<FontData> source)
      : TransformableState(nullptr), font(std::move(source)), text(font->font) {
    object = &text;
    text_members::Get<text_members::GeometryNeedUpdate>(text) = true;
  }

  explicit TextState(const TextState& source)
      : TransformableState(nullptr), font(source.font), text(source.text) {
    object = &text;
    values = source.values;
    if (source.glyphs) {
      glyphs = std::make_shared<ShapedGlyphStorage>(*source.glyphs);
    }
  }

  // The font outlives sf::Text and its shaper. Mapped subobjects and handles
  // alias this one thread-owned resource.
  std::shared_ptr<FontData> font;
  sf::Text text;
  std::shared_ptr<ShapedGlyphStorage> glyphs;
};

using TextHandle = SharedHandle<TextState>;

}  // namespace sfmljs
