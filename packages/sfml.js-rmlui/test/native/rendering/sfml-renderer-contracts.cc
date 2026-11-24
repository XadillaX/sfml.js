// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Vertex.h>

#include <array>
#include <cassert>
#include <iostream>

#include "native/rendering/render-interface-sfml.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Window/VideoMode.hpp>

namespace {

using Renderer = sfmlrmlui::RenderInterfaceSFML;

Rml::CompiledGeometryHandle Quad(
    Renderer* renderer,
    float size,
    Rml::ColourbPremultiplied red = {255, 0, 0, 255}) {
  const std::array<Rml::Vertex, 4> vertices{{
      {{0.f, 0.f}, red, {0.f, 0.f}},
      {{size, 0.f}, red, {1.f, 0.f}},
      {{size, size}, red, {1.f, 1.f}},
      {{0.f, size}, red, {0.f, 1.f}},
  }};
  const std::array<int, 6> indices{0, 1, 2, 0, 2, 3};
  const auto handle = renderer->CompileGeometry(
      {vertices.data(), vertices.size()}, {indices.data(), indices.size()});
  assert(handle);
  return handle;
}

sf::Image Capture(sf::RenderWindow* window) {
  assert(window->setActive(true));
  sf::Texture capture(window->getSize());
  capture.update(*window);
  return capture.copyToImage();
}

void Expect(const sf::Image& image, unsigned x, unsigned y, bool red) {
  const auto pixel = image.getPixel({x, y});
  const auto expected = red ? sf::Color::Red : sf::Color::Black;
  if (pixel != expected) {
    std::cerr << "Unexpected pixel " << x << "," << y << ": "
              << static_cast<unsigned>(pixel.r) << ","
              << static_cast<unsigned>(pixel.g) << ","
              << static_cast<unsigned>(pixel.b) << "\n";
    assert(false);
  }
}

void ToggleRetainsDefinition(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto fill = Quad(&renderer, 80.f);
  const auto mask = Quad(&renderer, 20.f);
  renderer.EnableClipMask(true);
  renderer.RenderToClipMask(Rml::ClipMaskOperation::Set, mask, {10.f, 10.f});
  renderer.ReleaseGeometry(mask);

  window->clear(sf::Color::Black);
  renderer.RenderGeometry(fill, {}, 0);
  auto image = Capture(window);
  Expect(image, 15, 15, true);
  Expect(image, 40, 40, false);

  renderer.EnableClipMask(false);
  window->clear(sf::Color::Black);
  renderer.RenderGeometry(fill, {}, 0);
  Expect(Capture(window), 40, 40, true);

  renderer.EnableClipMask(true);
  window->clear(sf::Color::Black);
  renderer.RenderGeometry(fill, {}, 0);
  image = Capture(window);
  Expect(image, 15, 15, true);
  Expect(image, 40, 40, false);
  renderer.ReleaseGeometry(fill);
}

void DisabledDefinitionSurvivesTargetSwitch(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto fill = Quad(&renderer, 80.f);
  const auto mask = Quad(&renderer, 20.f);
  renderer.EnableClipMask(false);
  renderer.RenderToClipMask(Rml::ClipMaskOperation::Set, mask, {10.f, 10.f});
  renderer.ReleaseGeometry(mask);
  renderer.EnableClipMask(true);

  for (int frame = 0; frame < 3; ++frame) {
    window->clear(sf::Color::Black);
    renderer.BeginFrame();
    renderer.PushLayer();
    renderer.RenderGeometry(fill, {}, 0);
    const auto layer = renderer.GetActiveLayer();
    renderer.CompositeLayers(layer, 0, Rml::BlendMode::Blend, {});
    renderer.PopLayer();
    renderer.EndFrame();
    const auto image = Capture(window);
    Expect(image, 15, 15, true);
    Expect(image, 40, 40, false);
  }
  renderer.ReleaseGeometry(fill);
}

void WriteScissorAndTransformAreSnapshots(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto fill = Quad(&renderer, 80.f);
  const auto mask = Quad(&renderer, 50.f);
  auto transform = Rml::Matrix4f::Identity();
  transform.data()[12] = 10.f;
  renderer.SetTransform(&transform);
  renderer.EnableScissorRegion(true);
  renderer.SetScissorRegion(
      Rml::Rectanglei::FromPositionSize({15, 15}, {10, 10}));
  renderer.EnableClipMask(true);
  renderer.RenderToClipMask(Rml::ClipMaskOperation::Set, mask, {});
  renderer.ReleaseGeometry(mask);
  transform.data()[12] = 90.f;
  renderer.SetTransform(nullptr);
  renderer.EnableScissorRegion(false);

  window->clear(sf::Color::Black);
  renderer.RenderGeometry(fill, {}, 0);
  auto image = Capture(window);
  Expect(image, 20, 20, true);
  Expect(image, 10, 20, false);
  Expect(image, 40, 40, false);
  renderer.EnableClipMask(false);
  renderer.EnableClipMask(true);
  const auto layer = renderer.PushLayer();
  renderer.RenderGeometry(fill, {}, 0);
  renderer.CompositeLayers(layer, 0, Rml::BlendMode::Blend, {});
  renderer.PopLayer();
  image = Capture(window);
  Expect(image, 20, 20, true);
  Expect(image, 40, 40, false);
  renderer.ReleaseGeometry(fill);
}

void ScissoredCompositeKeepsBothTriangles(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto fill = Quad(&renderer, 58.f, {128, 0, 0, 128});
  const auto mask = Quad(&renderer, 91.f);
  const auto scissor = Rml::Rectanglei::FromPositionSize({27, 17}, {70, 92});
  for (const auto mode : {Rml::BlendMode::Blend, Rml::BlendMode::Replace}) {
    window->clear(sf::Color::Blue);
    renderer.EnableScissorRegion(false);
    renderer.EnableClipMask(false);
    const auto layer = renderer.PushLayer();
    renderer.RenderGeometry(fill, {18.f, 13.f}, 0);
    renderer.RenderToClipMask(Rml::ClipMaskOperation::Set, mask, {13.f, 7.f});
    renderer.SetScissorRegion(scissor);
    renderer.EnableScissorRegion(true);
    renderer.EnableClipMask(true);
    renderer.CompositeLayers(layer, 0, mode, {});
    renderer.PopLayer();

    const auto image = Capture(window);
    for (unsigned y = 0; y < image.getSize().y; ++y) {
      for (unsigned x = 0; x < image.getSize().x; ++x) {
        const bool inside = x >= 27 && x < 97 && y >= 17 && y < 98;
        const bool red = inside && x < 76 && y < 71;
        const bool replace = inside && mode == Rml::BlendMode::Replace;
        const auto pixel = image.getPixel({x, y});
        const auto expected_blue = replace ? 0 : (red ? 127 : 255);
        if (pixel.r != (red ? 128 : 0) || pixel.g != 0 ||
            pixel.b != expected_blue) {
          std::cerr << "Wrong scissored layer composite at " << x << "," << y
                    << " for replace=" << replace << "\n";
          assert(false);
        }
      }
    }
  }
  renderer.ReleaseGeometry(fill);
  renderer.ReleaseGeometry(mask);
}

void InvalidIndicesFailWithoutPartialGeometry(sf::RenderWindow* window) {
  sfmlrmlui::DataDiagnostics diagnostics;
  diagnostics.active = true;
  Renderer renderer(&diagnostics);
  renderer.SetWindow(window);
  const std::array<Rml::Vertex, 1> vertices{};
  for (const int index : {-1, 1}) {
    const std::array<int, 3> indices{0, 0, index};
    assert(renderer.CompileGeometry({vertices.data(), vertices.size()},
                                    {indices.data(), indices.size()}) == 0);
  }
  assert(diagnostics.geometry_compiles == 0);
  assert(diagnostics.geometry_expansion_bytes == 0);
  const auto valid = Quad(&renderer, 20.f);
  assert(diagnostics.geometry_compiles == 1);
  renderer.ReleaseGeometry(valid);
}

void DeepIntersectionsHaveBoundedNormalization(sf::RenderWindow* window) {
  sfmlrmlui::DataDiagnostics diagnostics;
  diagnostics.active = true;
  Renderer renderer(&diagnostics);
  renderer.SetWindow(window);
  const auto fill = Quad(&renderer, 80.f);
  const auto large = Quad(&renderer, 50.f);
  const auto small = Quad(&renderer, 10.f);
  renderer.EnableClipMask(true);
  renderer.RenderToClipMask(Rml::ClipMaskOperation::Set, large, {});
  for (int i = 0; i < 520; ++i) {
    renderer.RenderToClipMask(Rml::ClipMaskOperation::Intersect, large, {});
  }
  renderer.RenderToClipMask(
      Rml::ClipMaskOperation::Intersect, small, {15.f, 15.f});
  renderer.ReleaseGeometry(large);
  renderer.ReleaseGeometry(small);
  window->clear(sf::Color::Black);
  renderer.RenderGeometry(fill, {}, 0);
  const auto image = Capture(window);
  Expect(image, 20, 20, true);
  Expect(image, 30, 30, false);
  assert(diagnostics.mask_draws == 522 + 4);
  renderer.ReleaseGeometry(fill);
}

}  // namespace

int main() {
  sf::ContextSettings settings;
  settings.stencilBits = 8;
  sf::RenderWindow window(sf::VideoMode({161, 121}),
                          "Native SFML contracts",
                          sf::Style::Default,
                          sf::State::Windowed,
                          settings);
  window.setVisible(false);

  ToggleRetainsDefinition(&window);
  std::cout << "PASS native-mask-toggle-retains-released-definition\n";
  DisabledDefinitionSurvivesTargetSwitch(&window);
  std::cout << "PASS native-disabled-definition-frame-layer-pool-reuse\n";
  WriteScissorAndTransformAreSnapshots(&window);
  std::cout << "PASS native-mask-write-scissor-transform-snapshots\n";
  ScissoredCompositeKeepsBothTriangles(&window);
  std::cout << "PASS native-scissored-layer-composite-exact-pixels\n";
  InvalidIndicesFailWithoutPartialGeometry(&window);
  std::cout << "PASS native-geometry-invalid-index-transaction\n";
  DeepIntersectionsHaveBoundedNormalization(&window);
  std::cout << "PASS native-deep-mask-two-pass-normalization\n";
}
