// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#import <AppKit/AppKit.h>

#include <cassert>
#include <cmath>
#include <iostream>

#include <SFML/Graphics/Image.hpp>
#include <SFML/Graphics/RectangleShape.hpp>
#include <SFML/Graphics/RenderWindow.hpp>
#include <SFML/Graphics/Texture.hpp>
#include <SFML/Window/Mouse.hpp>

// Run on a real Retina desktop against the SDK used by all workspace addons.
// This exercises SFML's nonvirtual WindowBase size/capture/input paths, not an
// overridden RenderTarget::getSize that leaves those paths at half resolution.
int main() {
  sf::RenderWindow window(sf::VideoMode({400, 300}), "Retina regression");
  auto* native = static_cast<NSWindow*>(window.getNativeHandle());
  auto* view = static_cast<NSOpenGLView*>(native.contentView);
  const auto scale = static_cast<unsigned>(native.backingScaleFactor);
  assert(!view.wantsBestResolutionOpenGLSurface);
  assert(window.getSize() == sf::Vector2u(400, 300));

  for (const bool enabled : {true, false, true}) {
    view.wantsBestResolutionOpenGLSurface = enabled ? YES : NO;
    [view.openGLContext update];
    const auto ratio = enabled ? scale : 1u;
    const sf::Vector2u pixels{400u * ratio, 300u * ratio};
    window.setSize(pixels);
    while (window.pollEvent()) {
    }
    assert(window.getSize() == pixels);
    assert(static_cast<sf::Window&>(window).getSize() == pixels);
    assert(view.bounds.size.width == 400);
    assert(view.bounds.size.height == 300);

    window.setView(sf::View(sf::FloatRect({0.f, 0.f}, sf::Vector2f(pixels))));
    window.clear(sf::Color::Black);
    sf::RectangleShape line({1.f, 10.f});
    line.setPosition({20.f, 20.f});
    line.setFillColor(sf::Color::White);
    window.draw(line);
    sf::Texture capture(pixels);
    capture.update(window);
    const auto image = capture.copyToImage();
    assert(image.getPixel({20, 20}) == sf::Color::White);
    assert(image.getPixel({19, 20}) == sf::Color::Black);
    assert(image.getPixel({21, 20}) == sf::Color::Black);
    const auto old_mouse = sf::Mouse::getPosition();
    sf::Mouse::setPosition({41, 61}, window);
    const auto mouse = sf::Mouse::getPosition(window);
    // Cocoa may quantize a warped pointer to whole screen points.
    assert(std::abs(mouse.x - 41) < static_cast<int>(ratio));
    assert(std::abs(mouse.y - 61) < static_cast<int>(ratio));
    sf::Mouse::setPosition(old_mouse);
    std::cout << "surface=" << ratio << "x size=" << pixels.x << "x" << pixels.y
              << " single-pixel capture and mouse passed\n";
  }
}
