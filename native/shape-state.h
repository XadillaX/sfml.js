#pragma once

#include "graphics-state.h"
#include <SFML/Graphics/CircleShape.hpp>
#include <SFML/Graphics/RectangleShape.hpp>
#include <SFML/Graphics/ConvexShape.hpp>

namespace sfmljs {

SFMLJS_MEMBER(ShapeThickness, sf::Shape, float, m_outlineThickness);
SFMLJS_MEMBER(ShapeMiterLimit, sf::Shape, float, m_miterLimit);
SFMLJS_MEMBER(ShapeBounds, sf::Shape, sf::FloatRect, m_bounds);
SFMLJS_MEMBER(CircleRadius, sf::CircleShape, float, m_radius);
SFMLJS_MEMBER(CircleCount, sf::CircleShape, std::size_t, m_pointCount);
SFMLJS_MEMBER(RectangleSize, sf::RectangleShape, sf::Vector2f, m_size);

// Custom JS shapes publish points during update(); drawing never calls JS.
struct PointShape : sf::Shape {
  std::vector<sf::Vector2f> points;
  std::size_t getPointCount() const override { return points.size(); }
  sf::Vector2f getPoint(std::size_t index) const override { return points[index]; }
  void Replace(std::vector<sf::Vector2f> input) {
    points = std::move(input);
    update();
  }
};

// This layout also occupies DrawCommand::payload for shape commands.
struct ShapeAppearance {
  std::uint32_t textureId{};
  std::uint32_t fill{0xffffffff};
  std::uint32_t outline{0xffffffff};
  sf::IntRect rectangle;
};
static_assert(sizeof(ShapeAppearance) == 28);
static_assert(offsetof(ShapeAppearance, rectangle) == 12);

inline void ApplyShapeAppearance(sf::Shape& shape, const sf::Texture* texture,
                                 const ShapeAppearance& appearance) {
  shape.setTexture(texture);
  shape.setTextureRect(appearance.rectangle);
  shape.setFillColor(sf::Color(appearance.fill));
  shape.setOutlineColor(sf::Color(appearance.outline));
}

struct ShapeState : TransformableState {
  ShapeState(std::shared_ptr<GraphicsContext> context, std::uint32_t id,
             unsigned kind, std::unique_ptr<sf::Shape> shape)
      : TransformableState(shape.get()), context(std::move(context)),
        id(id), kind(kind), shape(std::move(shape)) {}
  ~ShapeState() { context->shapes.erase(id); }

  void SyncShape() {
    Sync();
    ApplyShapeAppearance(*shape, texture.get(), appearance);
  }

  std::shared_ptr<GraphicsContext> context;
  std::uint32_t id;
  unsigned kind; // 0 custom, 1 circle, 2 rectangle, 3 convex
  std::unique_ptr<sf::Shape> shape;
  std::shared_ptr<const sf::Texture> texture;
  ShapeAppearance appearance;
  // Vector-backed custom/convex shapes have no standalone SFML count field.
  std::uint32_t pointCount{};
};

}  // namespace sfmljs
