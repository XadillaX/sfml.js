// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/layers/stencil-attachment.h"

#include <SFML/Graphics/Image.hpp>
#include <SFML/Graphics/RectangleShape.hpp>
#include <SFML/Graphics/RenderStates.hpp>
#include <SFML/Graphics/RenderTexture.hpp>
#include <SFML/Graphics/Sprite.hpp>

namespace sfmlrmlui {

bool VerifyStencilAttachment(sf::RenderTexture* target) {
  target->setView(target->getDefaultView());
  target->clear(sf::Color::Transparent);
  target->clearStencil(sf::StencilValue(128));

  sf::RectangleShape probe(sf::Vector2f{1.f, 1.f});
  sf::RenderStates states;
  states.blendMode = sf::BlendNone;
  states.stencilMode = sf::StencilMode{
      sf::StencilComparison::Equal,
      sf::StencilUpdateOperation::Keep,
      sf::StencilValue(128),
      sf::StencilValue(255),
      false,
  };
  probe.setFillColor(sf::Color::Green);
  target->draw(probe, states);

  states.stencilMode.stencilReference = sf::StencilValue(0);
  probe.setFillColor(sf::Color::Red);
  target->draw(probe, states);
  target->display();

  // Crop on the GPU rather than reading a full-size layer to inspect one pixel.
  sf::RenderTexture readback(sf::Vector2u{1, 1});
  sf::Sprite sprite(target->getTexture());
  sprite.setTextureRect(sf::IntRect{{0, 0}, {1, 1}});
  readback.draw(sprite, sf::RenderStates(sf::BlendNone));
  readback.display();
  const bool valid =
      readback.getTexture().copyToImage().getPixel({0, 0}) == sf::Color::Green;
  target->clear(sf::Color::Transparent);
  target->clearStencil(sf::StencilValue(0));
  return valid;
}

}  // namespace sfmlrmlui
