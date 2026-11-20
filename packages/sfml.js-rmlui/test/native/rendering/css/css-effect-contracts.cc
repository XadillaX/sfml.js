// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <algorithm>
#include <array>
#include <cassert>
#include <cmath>
#include <filesystem>
#include <iostream>
#include <map>
#include <string>
#include <utility>

#include "native/rendering/render-interface-sfml.h"
#include "test/native/rendering/css/effect-scenes.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Window/VideoMode.hpp>

namespace {

sf::Image Capture(sf::RenderWindow* window) {
  assert(window->setActive(true));
  sf::Texture texture(window->getSize());
  texture.update(*window);
  return texture.copyToImage();
}

bool Identical(const sf::Image& actual, const sf::Image& expected) {
  assert(actual.getSize() == expected.getSize());
  const auto size = actual.getSize();
  return std::equal(actual.getPixelsPtr(),
                    actual.getPixelsPtr() + size.x * size.y * 4,
                    expected.getPixelsPtr());
}

void ReportMismatch(const sf::Image& actual,
                    const sf::Image& expected,
                    const std::filesystem::path& output,
                    const Rml::String& name) {
  const auto size = actual.getSize();
  unsigned changed = 0;
  int maximum = 0;
  for (unsigned y = 0; y < size.y; ++y) {
    for (unsigned x = 0; x < size.x; ++x) {
      const auto a = actual.getPixel({x, y});
      const auto b = expected.getPixel({x, y});
      if (a == b) {
        continue;
      }
      if (changed++ == 0) {
        std::cerr << "FAIL " << name << " first-pixel=" << x << "," << y
                  << " actual=" << int(a.r) << "," << int(a.g) << ","
                  << int(a.b) << "," << int(a.a) << " expected=" << int(b.r)
                  << "," << int(b.g) << "," << int(b.b) << "," << int(b.a)
                  << "\n";
      }
      for (const int difference : {std::abs(static_cast<int>(a.r) - b.r),
                                   std::abs(static_cast<int>(a.g) - b.g),
                                   std::abs(static_cast<int>(a.b) - b.b),
                                   std::abs(static_cast<int>(a.a) - b.a)}) {
        maximum = std::max(maximum, difference);
      }
    }
  }
  std::cerr << "FAIL " << name << " changed-pixels=" << changed
            << " max=" << maximum << "\n";
  assert(actual.saveToFile(output / (name + "-actual.png")));
  assert(expected.saveToFile(output / (name + "-expected.png")));
}

bool Compare(const sf::Image& actual,
             const sf::Image& expected,
             const Rml::String& name) {
  assert(actual.getSize() == expected.getSize());
  int maximum = 0;
  double total = 0;
  bool positive = false;
  for (unsigned y = 0; y < css_scenes::kHeight; ++y) {
    for (unsigned x = 0; x < css_scenes::kWidth; ++x) {
      const auto a = actual.getPixel({x, y});
      const auto b = expected.getPixel({x, y});
      positive |= a.r > 0 && a.g > 0;
      for (const int difference : {std::abs(static_cast<int>(a.r) - b.r),
                                   std::abs(static_cast<int>(a.g) - b.g),
                                   std::abs(static_cast<int>(a.b) - b.b)}) {
        maximum = std::max(maximum, difference);
        total += difference;
      }
    }
  }
  const double mean = total / (css_scenes::kWidth * css_scenes::kHeight * 3);
  const bool passed = positive && maximum <= 2 && mean <= 0.1;
  std::cout << (passed ? "PASS " : "FAIL ") << name << " max=" << maximum
            << " mean=" << mean << "\n";
  return passed;
}

sf::Image Render(sf::RenderWindow* window,
                 sfmlrmlui::RenderInterfaceSFML* renderer,
                 Rml::Context* context,
                 sf::Image* ui_capture = nullptr) {
  window->clear(sf::Color::Black);
  auto& manager = context->GetRenderManager();
  const auto saved = manager.GetState();
  renderer->BeginFrame();
  try {
    manager.ResetState();
    assert(context->Render());
    manager.SetState(saved);
    renderer->SetScissorRegion(Rml::Rectanglei::FromPositionSize(
        {}, {css_scenes::kWidth, css_scenes::kHeight}));
    const auto handle = renderer->SaveLayerAsTexture();
    assert(handle);
    const auto ui = reinterpret_cast<sf::Texture*>(handle)->copyToImage();
    renderer->ReleaseTexture(handle);
    if (ui_capture) {
      *ui_capture = ui;
    }
    assert(ui.getPixel({0, 0}) == sf::Color::Transparent);
    assert(ui.getPixel({css_scenes::kWidth - 1, css_scenes::kHeight - 1}) ==
           sf::Color::Transparent);
    for (unsigned y = 0; y < css_scenes::kHeight; ++y) {
      for (unsigned x = 0; x < css_scenes::kWidth; ++x) {
        const auto pixel = ui.getPixel({x, y});
        assert(pixel.r <= pixel.a && pixel.g <= pixel.a && pixel.b <= pixel.a);
      }
    }
    renderer->EndFrame();
  } catch (...) {
    renderer->RollbackFrame();
    throw;
  }
  return Capture(window);
}

}  // namespace

int main(int argc, char** argv) {
  assert(argc == 3 && std::filesystem::is_directory(argv[1]) &&
         std::filesystem::is_directory(argv[2]));
  sf::ContextSettings settings;
  settings.stencilBits = 8;
  sf::RenderWindow window(
      sf::VideoMode({css_scenes::kWidth, css_scenes::kHeight}),
      "Native CSS effect contracts",
      sf::Style::Default,
      sf::State::Windowed,
      settings);
  window.setVisible(false);
  sfmlrmlui::DataDiagnostics diagnostics;
  diagnostics.active = true;
  sfmlrmlui::RenderInterfaceSFML renderer(&diagnostics);
  renderer.SetWindow(&window);
  css_scenes::System system;
  Rml::SetSystemInterface(&system);
  Rml::SetRenderInterface(&renderer);
  assert(Rml::Initialise());
  auto* context =
      Rml::CreateContext("css", {css_scenes::kWidth, css_scenes::kHeight});
  assert(context);
  int failures = 0;
  std::map<Rml::String, sf::Image> captures;
  std::map<Rml::String, sf::Image> ui_captures;
  for (const auto& scene : css_scenes::kScenes) {
    auto* document = css_scenes::Load(context, scene);
    const auto post_draws = diagnostics.fullscreen_draws;
    sf::Image ui;
    const auto image = Render(&window, &renderer, context, &ui);
    for (unsigned frame = 0; frame < 8; ++frame) {
      sf::Image repeated_ui;
      const auto repeated = Render(&window, &renderer, context, &repeated_ui);
      if (!Identical(repeated, image)) {
        const auto name = Rml::String("css-") + scene.name + "-repeat-" +
                          std::to_string(frame);
        std::cerr << "FAIL " << name
                  << " ui-identical=" << Identical(repeated_ui, ui) << "\n";
        ReportMismatch(repeated, image, argv[2], name);
        if (!Identical(repeated_ui, ui)) {
          ReportMismatch(repeated_ui, ui, argv[2], name + "-ui");
        }
      }
      assert(Identical(repeated, image));
    }
    assert(system.errors == 0);
    assert((!scene.foreground && !scene.backdrop && !scene.mask) ||
           diagnostics.fullscreen_draws > post_draws);
    const auto name = Rml::String("css-") + scene.name + ".png";
    sf::Image reference;
    assert(reference.loadFromFile(std::filesystem::path(argv[1]) / name));
    if (!Compare(image, reference, name)) {
      ++failures;
    }
    assert(image.saveToFile(std::filesystem::path(argv[2]) / name));
    captures.emplace(scene.name, image);
    ui_captures.emplace(scene.name, std::move(ui));
    document->Close();
    assert(context->Update());
  }
  // Independently require every effect combination to change its unfiltered
  // counterpart. A successfully parsed but unavailable effect cannot pass by
  // matching an equally blank or unchanged reference scene.
  for (const auto& scene : css_scenes::kScenes) {
    if (scene.foreground || scene.backdrop || scene.mask) {
      const auto baseline =
          scene.transformed ? "transformed-baseline" : "baseline";
      assert(!Identical(captures.at(scene.name), captures.at(baseline)));
    }
  }
  for (const auto* name :
       {"foreground-backdrop", "foreground-mask", "backdrop-mask"}) {
    assert(
        !Identical(captures.at("foreground-backdrop-mask"), captures.at(name)));
  }
  std::cout << "PASS native-css-positive-effects-and-repeat-frames\n";
  for (auto it = css_scenes::kScenes.rbegin(); it != css_scenes::kScenes.rend();
       ++it) {
    auto* document = css_scenes::Load(context, *it);
    sf::Image ui;
    const auto image = Render(&window, &renderer, context, &ui);
    const auto& expected = captures.at(it->name);
    if (!Identical(image, expected)) {
      const auto name = Rml::String("css-") + it->name + "-reversed";
      const auto& expected_ui = ui_captures.at(it->name);
      std::cerr << "FAIL " << name
                << " ui-identical=" << Identical(ui, expected_ui) << "\n";
      ReportMismatch(image, expected, argv[2], name);
      if (!Identical(ui, expected_ui)) {
        ReportMismatch(ui, expected_ui, argv[2], name + "-ui");
      }
    }
    assert(Identical(image, expected));
    document->Close();
    assert(context->Update());
  }
  assert(system.errors == 0);
  std::cout << "PASS native-css-reversed-order-pooled-masks\n";
  Rml::Shutdown();
  return failures ? 1 : 0;
}
