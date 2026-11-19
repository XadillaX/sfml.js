// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Vertex.h>

#include <algorithm>
#include <array>
#include <cassert>
#include <cmath>
#include <filesystem>
#include <iostream>
#include <limits>

#include "native/rendering/effects/blur-kernel.h"
#include "native/rendering/render-interface-sfml.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Window/VideoMode.hpp>

namespace {

using Renderer = sfmlrmlui::RenderInterfaceSFML;

constexpr unsigned kWidth = 161;
constexpr unsigned kHeight = 121;

Rml::CompiledGeometryHandle Geometry(Renderer* renderer) {
  const Rml::ColourbPremultiplied red(128, 0, 0, 128);
  const std::array<Rml::Vertex, 4> vertices{{
      {{20.f, 13.f}, red, {0.f, 0.f}},
      {{60.f, 13.f}, red, {1.f, 0.f}},
      {{60.f, 47.f}, red, {1.f, 1.f}},
      {{20.f, 47.f}, red, {0.f, 1.f}},
  }};
  const std::array<int, 6> indices{0, 1, 2, 0, 2, 3};
  return renderer->CompileGeometry({vertices.data(), vertices.size()},
                                   {indices.data(), indices.size()});
}

Rml::Rectanglei FullBounds() {
  return Rml::Rectanglei::FromPositionSize(
      {}, {static_cast<int>(kWidth), static_cast<int>(kHeight)});
}

sf::Image ReadLayer(Renderer* renderer, Rml::Rectanglei bounds) {
  renderer->SetScissorRegion(bounds);
  const auto handle = renderer->SaveLayerAsTexture();
  assert(handle);
  const auto* texture = reinterpret_cast<const sf::Texture*>(handle);
  auto image = texture->copyToImage();
  renderer->ReleaseTexture(handle);
  return image;
}

void ExpectIdentical(const sf::Image& actual, const sf::Image& expected) {
  assert(actual.getSize() == expected.getSize());
  const auto size = actual.getSize();
  assert(std::equal(actual.getPixelsPtr(),
                    actual.getPixelsPtr() + size.x * size.y * 4,
                    expected.getPixelsPtr()));
}

void ExpectPremultiplied(const sf::Image& image, Rml::Rectanglei bounds) {
  const auto size = image.getSize();
  bool positive = false;
  for (unsigned y = 0; y < size.y; ++y) {
    for (unsigned x = 0; x < size.x; ++x) {
      const auto pixel = image.getPixel({x, y});
      assert(pixel.r <= pixel.a && pixel.g <= pixel.a && pixel.b <= pixel.a);
      const int column = static_cast<int>(x);
      const int row = static_cast<int>(y);
      const bool inside = column >= bounds.p0.x && column < bounds.p1.x &&
                          row >= bounds.p0.y && row < bounds.p1.y;
      assert(inside || pixel == sf::Color::Transparent);
      positive |= pixel.a > 0;
    }
  }
  assert(positive);
}

sf::Image CaptureFilter(sf::RenderWindow* window,
                        const char* name,
                        float sigma,
                        bool bounded) {
  Renderer renderer;
  renderer.SetWindow(window);
  window->clear(sf::Color::Black);
  renderer.BeginFrame();
  const auto geometry = Geometry(&renderer);
  const auto layer = renderer.PushLayer();
  renderer.RenderGeometry(geometry, {}, 0);
  const auto original = ReadLayer(&renderer, FullBounds());
  renderer.EnableScissorRegion(true);
  renderer.SetScissorRegion(Rml::Rectanglei::FromPositionSize(
      bounded ? Rml::Vector2i{17, 11} : Rml::Vector2i{0, 0},
      bounded ? Rml::Vector2i{83, 67}
              : Rml::Vector2i{static_cast<int>(kWidth),
                              static_cast<int>(kHeight)}));
  Rml::Dictionary parameters;
  parameters["sigma"] = sigma;
  parameters["offset"] = Rml::Vector2f{9.f, 15.f};
  parameters["color"] = Rml::Colourb(0, 128, 255, 128);
  const auto filter = renderer.CompileFilter(name, parameters);
  assert(filter);
  const std::array<Rml::CompiledFilterHandle, 1> filters{filter};
  renderer.CompositeLayers(
      layer, 0, Rml::BlendMode::Replace, {filters.data(), filters.size()});
  // Postprocessing may reuse scratch textures but cannot change the layer
  // whose geometry was submitted, even while applying a large shadow blur.
  ExpectIdentical(ReadLayer(&renderer, FullBounds()), original);
  renderer.PopLayer();
  const auto result = ReadLayer(&renderer, FullBounds());
  const auto bounds =
      bounded ? Rml::Rectanglei::FromPositionSize({17, 11}, {83, 67})
              : FullBounds();
  ExpectPremultiplied(result, bounds);
  if (std::string(name) == "drop-shadow") {
    // At an interior source pixel the original red contribution survives.
    assert(result.getPixel({40, 30}).r == 128);
  }
  renderer.ReleaseFilter(filter);
  renderer.ReleaseGeometry(geometry);
  renderer.EndFrame();
  assert(window->setActive(true));
  sf::Texture capture(window->getSize());
  capture.update(*window);
  return capture.copyToImage();
}

bool CompareReference(const sf::Image& actual,
                      const sf::Image& expected,
                      const std::string& name) {
  assert(actual.getSize() == expected.getSize());
  int maximum = 0;
  double total = 0;
  bool positive = false;
  for (unsigned y = 0; y < kHeight; ++y) {
    for (unsigned x = 0; x < kWidth; ++x) {
      const auto a = actual.getPixel({x, y});
      const auto b = expected.getPixel({x, y});
      positive |= name.starts_with("drop-shadow") ? a.b > 0 : a.r > 0;
      const std::array<int, 3> differences{
          std::abs(static_cast<int>(a.r) - b.r),
          std::abs(static_cast<int>(a.g) - b.g),
          std::abs(static_cast<int>(a.b) - b.b)};
      for (const int difference : differences) {
        maximum = std::max(maximum, difference);
        total += difference;
      }
    }
  }
  // Independent backends can round a normalized 8-bit pass differently.
  // Require both a tight per-channel bound and a tight whole-image average.
  const double mean = total / (kWidth * kHeight * 3);
  const bool passed = positive && maximum <= 2 && mean <= 0.1;
  std::cout << (passed ? "PASS " : "FAIL ") << name << " max=" << maximum
            << " mean=" << mean << "\n";
  return passed;
}

void KernelAndParameterContracts(sf::RenderWindow* window) {
  for (const auto [sigma, levels] : {std::pair{0.f, 0},
                                     {0.05f, 0},
                                     {0.49f, 0},
                                     {0.5f, 0},
                                     {1.f, 0},
                                     {3.f, 1},
                                     {8.f, 2},
                                     {24.f, 4},
                                     {std::numeric_limits<float>::max(), 10}}) {
    const sfmlrmlui::BlurKernel kernel(sigma);
    assert(kernel.levels == levels);
    float total = kernel.weights[0];
    for (size_t i = 1; i < kernel.weights.size(); ++i) {
      assert(std::isfinite(kernel.weights[i]) && kernel.weights[i] >= 0.f);
      total += 2.f * kernel.weights[i];
    }
    assert(std::abs(total - 1.f) < 0.000001f);
  }
  Renderer renderer;
  renderer.SetWindow(window);
  for (const float sigma : {-1.f,
                            std::numeric_limits<float>::infinity(),
                            std::numeric_limits<float>::quiet_NaN()}) {
    Rml::Dictionary parameters;
    parameters["sigma"] = sigma;
    assert(renderer.CompileFilter("blur", parameters) == 0);
    assert(renderer.CompileFilter("drop-shadow", parameters) == 0);
  }
  Rml::Dictionary parameters;
  parameters["offset"] =
      Rml::Vector2f{std::numeric_limits<float>::infinity(), 0.f};
  assert(renderer.CompileFilter("drop-shadow", parameters) == 0);
}

void OrderedChainAndScratchReuse(sf::RenderWindow* window) {
  sfmlrmlui::DataDiagnostics diagnostics;
  diagnostics.active = true;
  Renderer renderer(&diagnostics);
  renderer.SetWindow(window);
  const auto geometry = Geometry(&renderer);
  Rml::Dictionary opacity_parameters;
  opacity_parameters["value"] = 0.5f;
  const auto opacity = renderer.CompileFilter("opacity", opacity_parameters);
  Rml::Dictionary shadow_parameters;
  shadow_parameters["sigma"] = 24.f;
  shadow_parameters["color"] = Rml::Colourb(0, 128, 255, 128);
  shadow_parameters["offset"] = Rml::Vector2f{9.f, 15.f};
  const auto shadow = renderer.CompileFilter("drop-shadow", shadow_parameters);
  assert(opacity && shadow);
  const std::array<Rml::CompiledFilterHandle, 3> filters{
      shadow, opacity, shadow};
  sf::Image previous;
  for (int frame = 0; frame < 3; ++frame) {
    window->clear(sf::Color::Black);
    renderer.BeginFrame();
    const auto layer = renderer.PushLayer();
    renderer.RenderGeometry(geometry, {}, 0);
    renderer.EnableScissorRegion(true);
    renderer.SetScissorRegion(FullBounds());
    renderer.CompositeLayers(
        layer, 0, Rml::BlendMode::Replace, {filters.data(), filters.size()});
    renderer.PopLayer();
    const auto image = ReadLayer(&renderer, FullBounds());
    ExpectPremultiplied(image, FullBounds());
    assert(image.getPixel({40, 30}).r == 64);
    if (frame > 0) {
      ExpectIdentical(image, previous);
    }
    previous = image;
    renderer.EndFrame();
    assert(diagnostics.post_target_allocations == 3);
  }
  renderer.ReleaseFilter(opacity);
  renderer.ReleaseFilter(shadow);
  renderer.ReleaseGeometry(geometry);
}

void EmptyAndCollapsedWindows(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto geometry = Geometry(&renderer);
  Rml::Dictionary parameters;
  parameters["sigma"] = std::numeric_limits<float>::max();
  const auto filter = renderer.CompileFilter("blur", parameters);
  assert(filter);
  const std::array<Rml::CompiledFilterHandle, 1> filters{filter};
  for (const auto bounds : {Rml::Rectanglei::FromPositionSize({30, 20}, {0, 5}),
                            Rml::Rectanglei::FromPositionSize({30, 20}, {1, 1}),
                            FullBounds()}) {
    window->clear(sf::Color::Black);
    renderer.BeginFrame();
    const auto layer = renderer.PushLayer();
    renderer.RenderGeometry(geometry, {}, 0);
    renderer.EnableScissorRegion(true);
    renderer.SetScissorRegion(bounds);
    renderer.CompositeLayers(
        layer, 0, Rml::BlendMode::Replace, {filters.data(), filters.size()});
    renderer.PopLayer();
    const auto image = ReadLayer(&renderer, FullBounds());
    ExpectIdentical(image,
                    sf::Image({kWidth, kHeight}, sf::Color::Transparent));
    renderer.EndFrame();
  }
  renderer.ReleaseFilter(filter);
  renderer.ReleaseGeometry(geometry);
}

void FractionalBlurAndShadowOrientation(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto geometry = Geometry(&renderer);
  for (const auto offset :
       {Rml::Vector2f{-9.f, -15.f}, Rml::Vector2f{9.5f, 15.25f}}) {
    Rml::Dictionary parameters;
    parameters["color"] = Rml::Colourb(0, 128, 255, 128);
    parameters["offset"] = offset;
    const auto filter = renderer.CompileFilter("drop-shadow", parameters);
    assert(filter);
    const std::array<Rml::CompiledFilterHandle, 1> filters{filter};
    window->clear(sf::Color::Black);
    renderer.BeginFrame();
    const auto layer = renderer.PushLayer();
    renderer.RenderGeometry(geometry, {}, 0);
    renderer.EnableScissorRegion(true);
    renderer.SetScissorRegion(FullBounds());
    renderer.CompositeLayers(
        layer, 0, Rml::BlendMode::Replace, {filters.data(), filters.size()});
    renderer.PopLayer();
    const auto image = ReadLayer(&renderer, FullBounds());
    ExpectPremultiplied(image, FullBounds());
    if (offset.x < 0) {
      assert(image.getPixel({15, 5}) == sf::Color(0, 32, 64, 64));
      assert(image.getPixel({40, 60}) == sf::Color::Transparent);
    } else {
      assert(image.getPixel({69, 40}) == sf::Color(0, 16, 32, 32));
      assert(image.getPixel({65, 55}) == sf::Color(0, 32, 64, 64));
      assert(image.getPixel({65, 5}) == sf::Color::Transparent);
    }
    renderer.EndFrame();
    renderer.ReleaseFilter(filter);
  }

  // Blur sigma below 0.5 still performs the pinned kernel; the shadow filter
  // alone has the upstream 0.5 threshold before its optional blur pass.
  Rml::Dictionary parameters;
  parameters["sigma"] = 0.49f;
  const auto filter = renderer.CompileFilter("blur", parameters);
  assert(filter);
  const std::array<Rml::CompiledFilterHandle, 1> filters{filter};
  window->clear(sf::Color::Black);
  renderer.BeginFrame();
  const auto layer = renderer.PushLayer();
  renderer.RenderGeometry(geometry, {}, 0);
  renderer.EnableScissorRegion(true);
  renderer.SetScissorRegion(FullBounds());
  renderer.CompositeLayers(
      layer, 0, Rml::BlendMode::Replace, {filters.data(), filters.size()});
  renderer.PopLayer();
  const auto image = ReadLayer(&renderer, FullBounds());
  ExpectPremultiplied(image, FullBounds());
  assert(image.getPixel({19, 30}).r > 0);
  assert(image.getPixel({40, 30}).r == 128);
  renderer.EndFrame();
  renderer.ReleaseFilter(filter);
  renderer.ReleaseGeometry(geometry);
}

}  // namespace

int main(int argc, char** argv) {
  assert(argc == 3);
  const std::filesystem::path references(argv[1]);
  const std::filesystem::path output(argv[2]);
  assert(std::filesystem::is_directory(references));
  assert(std::filesystem::is_directory(output));
  sf::ContextSettings settings;
  settings.stencilBits = 8;
  sf::RenderWindow window(sf::VideoMode({kWidth, kHeight}),
                          "Native filter contracts",
                          sf::Style::Default,
                          sf::State::Windowed,
                          settings);
  window.setVisible(false);

  KernelAndParameterContracts(&window);
  std::cout << "PASS native-filter-finite-normalized-kernel-parameters\n";
  OrderedChainAndScratchReuse(&window);
  std::cout << "PASS native-filter-ordered-chain-alpha-scratch-reuse\n";
  EmptyAndCollapsedWindows(&window);
  std::cout << "PASS native-filter-empty-large-sigma-no-stale-source\n";
  FractionalBlurAndShadowOrientation(&window);
  std::cout
      << "PASS native-filter-fractional-sigma-shadow-offset-orientation\n";

  bool passed = true;
  for (const auto* name : {"blur", "drop-shadow"}) {
    for (const int sigma : {0, 3, 8, 24}) {
      for (const bool bounded : {false, true}) {
        const auto filename = std::string(name) + "-" + std::to_string(sigma) +
                              (bounded ? "-bounded.png" : "-full.png");
        const auto image =
            CaptureFilter(&window, name, static_cast<float>(sigma), bounded);
        assert(image.saveToFile(output / filename));
        const sf::Image expected(references / filename);
        passed &= CompareReference(image, expected, filename);
      }
    }
  }
  return passed ? 0 : 1;
}
