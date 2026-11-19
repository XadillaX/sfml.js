// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/DecorationTypes.h>
#include <RmlUi/Core/SystemInterface.h>
#include <RmlUi/Core/Vertex.h>

#include <algorithm>
#include <array>
#include <cassert>
#include <cmath>
#include <iostream>
#include <limits>

#include "native/rendering/render-interface-sfml.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Window/VideoMode.hpp>

namespace {

using Renderer = sfmlrmlui::RenderInterfaceSFML;
constexpr float kPi = 3.14159265358979323846f;

class Clock final : public Rml::SystemInterface {
 public:
  double GetElapsedTime() override { return seconds; }
  double seconds{0.25};
};

Rml::CompiledGeometryHandle Quad(Renderer* renderer,
                                 bool normalized,
                                 unsigned char alpha = 255,
                                 float size = 80.f) {
  const Rml::ColourbPremultiplied white(alpha, alpha, alpha, alpha);
  const float uv = normalized ? 1.f : size;
  const std::array<Rml::Vertex, 4> vertices{{
      {{0.f, 0.f}, white, {0.f, 0.f}},
      {{size, 0.f}, white, {uv, 0.f}},
      {{size, size}, white, {uv, uv}},
      {{0.f, size}, white, {0.f, uv}},
  }};
  const std::array<int, 6> indices{0, 1, 2, 0, 2, 3};
  return renderer->CompileGeometry({vertices.data(), vertices.size()},
                                   {indices.data(), indices.size()});
}

sf::Image Capture(Renderer* renderer) {
  renderer->SetScissorRegion(
      Rml::Rectanglei::FromPositionSize({0, 0}, {160, 120}));
  const auto handle = renderer->SaveLayerAsTexture();
  assert(handle);
  const auto image = reinterpret_cast<sf::Texture*>(handle)->copyToImage();
  renderer->ReleaseTexture(handle);
  return image;
}

void Expect(const sf::Image& image,
            unsigned x,
            unsigned y,
            const std::array<float, 4>& channels) {
  const auto pixel = image.getPixel({x, y});
  const std::array<unsigned char, 4> actual{pixel.r, pixel.g, pixel.b, pixel.a};
  for (size_t i = 0; i < actual.size(); ++i) {
    const float expected = std::clamp(channels[i], 0.f, 1.f) * 255.f;
    if (std::abs(static_cast<float>(actual[i]) - expected) > 2.f) {
      std::cerr << "Pixel " << x << "," << y << " channel " << i << ": got "
                << static_cast<unsigned>(actual[i]) << ", expected " << expected
                << "\n";
      assert(false);
    }
  }
}

Rml::ColorStopList Stops(float begin = 0.f, float end = 1.f) {
  return {{{255, 0, 0, 255}, {begin, Rml::Unit::NUMBER}},
          {{0, 0, 255, 255}, {end, Rml::Unit::NUMBER}}};
}

void Gradients(sf::RenderWindow* window) {
  for (const auto* name :
       {"linear-gradient", "radial-gradient", "conic-gradient"}) {
    for (const bool repeating : {false, true}) {
      Renderer renderer;
      renderer.SetWindow(window);
      renderer.BeginFrame();
      const auto geometry = Quad(&renderer, false);
      Rml::Dictionary parameters;
      parameters["p0"] = Rml::Vector2f(0.f, 0.f);
      parameters["p1"] = Rml::Vector2f(80.f, 0.f);
      parameters["center"] = Rml::Vector2f(40.f, 40.f);
      parameters["radius"] = Rml::Vector2f(40.f, 20.f);
      parameters["angle"] = 0.3f;
      parameters["repeating"] = repeating;
      parameters["color_stop_list"] = Stops(0.2f, 0.7f);
      const auto shader = renderer.CompileShader(name, parameters);
      assert(shader);
      parameters["color_stop_list"] = Stops(2.f, 3.f);
      renderer.RenderShader(shader, geometry, {}, 0);
      const auto image = Capture(&renderer);

      for (const auto point : {sf::Vector2u{13, 23}, sf::Vector2u{61, 51}}) {
        const float x = static_cast<float>(point.x) + 0.5f;
        const float y = static_cast<float>(point.y) + 0.5f;
        float t = x / 80.f;
        if (Rml::String(name) == "radial-gradient") {
          t = std::hypot((x - 40.f) / 40.f, (y - 40.f) / 20.f);
        } else if (Rml::String(name) == "conic-gradient") {
          const float vx =
              std::cos(0.3f) * (x - 40.f) + std::sin(0.3f) * (y - 40.f);
          const float vy =
              -std::sin(0.3f) * (x - 40.f) + std::cos(0.3f) * (y - 40.f);
          t = 0.5f + std::atan2(-vx, vy) / (2.f * kPi);
        }
        if (repeating) {
          t -= 0.5f * std::floor((t - 0.2f) / 0.5f);
        }
        const float ratio = std::clamp((t - 0.2f) / 0.5f, 0.f, 1.f);
        const float blue = ratio * ratio * (3.f - 2.f * ratio);
        Expect(image, point.x, point.y, {1.f - blue, 0.f, blue, 1.f});
      }
      renderer.ReleaseShader(shader);
      renderer.ReleaseGeometry(geometry);
      renderer.RollbackFrame();
      std::cout << "PASS native-" << (repeating ? "repeating-" : "") << name
                << "-pixels-snapshot\n";
    }
  }
}

void StopsAndPerspective(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  renderer.BeginFrame();
  const auto geometry = Quad(&renderer, false, 128);
  Rml::ColorStopList stops;
  for (int i = 0; i < 21; ++i) {
    stops.push_back({i % 2 ? Rml::ColourbPremultiplied(0, 0, 128, 128)
                           : Rml::ColourbPremultiplied(128, 0, 0, 128),
                     {static_cast<float>(i) / 20.f, Rml::Unit::NUMBER}});
  }
  Rml::Dictionary parameters;
  parameters["p0"] = Rml::Vector2f(0.f);
  parameters["p1"] = Rml::Vector2f(80.f, 0.f);
  parameters["color_stop_list"] = stops;
  const auto shader = renderer.CompileShader("linear-gradient", parameters);
  assert(shader);
  auto matrix = Rml::Matrix4f::Identity();
  matrix.data()[3] = 0.004f;
  renderer.SetTransform(&matrix);
  renderer.RenderShader(shader, geometry, {7.f, 3.f}, 0);
  const auto image = Capture(&renderer);
  const float local_x = 58.5f / (1.f - 0.004f * 58.5f) - 7.f;
  const float index = local_x / 4.f;
  const int interval = static_cast<int>(std::floor(index));
  assert(interval >= 16 && interval < 20);
  const float ratio = index - static_cast<float>(interval);
  const float mix = ratio * ratio * (3.f - 2.f * ratio);
  const float blue = interval % 2 ? 1.f - mix : mix;
  const float alpha = (128.f / 255.f) * (128.f / 255.f);
  Expect(image, 58, 22, {alpha * (1.f - blue), 0.f, alpha * blue, alpha});
  Expect(image, 100, 22, {0.f, 0.f, 0.f, 0.f});
  renderer.RollbackFrame();
  renderer.BeginFrame();
  const auto mask = Quad(&renderer, false, 255, 15.f);
  renderer.EnableClipMask(true);
  renderer.RenderToClipMask(Rml::ClipMaskOperation::Set, mask, {50.f, 20.f});
  renderer.ReleaseGeometry(mask);
  renderer.EnableScissorRegion(true);
  renderer.SetScissorRegion(
      Rml::Rectanglei::FromPositionSize({55, 20}, {7, 10}));
  renderer.SetTransform(&matrix);
  renderer.RenderShader(shader, geometry, {7.f, 3.f}, 0);
  renderer.EnableScissorRegion(false);
  const auto clipped = Capture(&renderer);
  Expect(clipped, 58, 22, {alpha * (1.f - blue), 0.f, alpha * blue, alpha});
  Expect(clipped, 52, 22, {0.f, 0.f, 0.f, 0.f});
  Expect(clipped, 58, 36, {0.f, 0.f, 0.f, 0.f});
  renderer.ReleaseShader(shader);
  renderer.ReleaseGeometry(geometry);
  renderer.RollbackFrame();
  std::cout << "PASS native-gradient-all-21-stops-premultiplied-perspective\n";
}

void DegenerateStops(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  renderer.BeginFrame();
  const auto geometry = Quad(&renderer, false);
  Rml::Dictionary parameters;
  parameters["p1"] = Rml::Vector2f(80.f, 0.f);
  parameters["color_stop_list"] = Stops(0.5f, 0.5f);
  auto shader = renderer.CompileShader("linear-gradient", parameters);
  assert(shader);
  renderer.RenderShader(shader, geometry, {}, 0);
  auto image = Capture(&renderer);
  Expect(image, 20, 20, {1.f, 0.f, 0.f, 1.f});
  Expect(image, 60, 20, {0.f, 0.f, 1.f, 1.f});
  renderer.ReleaseShader(shader);
  parameters["repeating"] = true;
  shader = renderer.CompileShader("linear-gradient", parameters);
  assert(shader);
  renderer.RenderShader(shader, geometry, {}, 0);
  image = Capture(&renderer);
  Expect(image, 20, 20, {0.f, 0.f, 1.f, 1.f});
  renderer.ReleaseShader(shader);
  renderer.RollbackFrame();
  renderer.BeginFrame();
  parameters["color_stop_list"] =
      Rml::ColorStopList{{{0, 128, 0, 128}, {0.f, Rml::Unit::NUMBER}}};
  shader = renderer.CompileShader("linear-gradient", parameters);
  assert(shader);
  renderer.RenderShader(shader, geometry, {}, 0);
  image = Capture(&renderer);
  Expect(image, 20, 20, {0.f, 128.f / 255.f, 0.f, 128.f / 255.f});
  renderer.ReleaseShader(shader);
  renderer.ReleaseGeometry(geometry);
  renderer.RollbackFrame();
  std::cout << "PASS native-gradient-hard-stop-zero-repeat-period\n";

  parameters["color_stop_list"] = Rml::ColorStopList{};
  assert(renderer.CompileShader("linear-gradient", parameters) == 0);
  parameters["color_stop_list"] = Stops();
  parameters["p1"] = Rml::Vector2f(0.f);
  assert(renderer.CompileShader("linear-gradient", parameters) == 0);
  parameters["radius"] = Rml::Vector2f(0.f, 1.f);
  assert(renderer.CompileShader("radial-gradient", parameters) == 0);
  parameters["angle"] = std::numeric_limits<float>::infinity();
  assert(renderer.CompileShader("conic-gradient", parameters) == 0);
  parameters["color_stop_list"] = Stops(1.f, 0.f);
  parameters["p1"] = Rml::Vector2f(80.f, 0.f);
  assert(renderer.CompileShader("linear-gradient", parameters) == 0);
  assert(renderer.CompileShader("unknown", {}) == 0);
  Rml::Dictionary broken;
  broken["vertex_shader"] = Rml::String("void main() { syntax error }");
  broken["fragment_shader"] = Rml::String("void main() {}");
  assert(renderer.CompileShader("explicit-failure", broken) == 0);
  std::cout << "PASS native-gradient-invalid-parameters-no-handle\n";
}

void Creation(sf::RenderWindow* window, Clock* clock) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto geometry = Quad(&renderer, true, 128, 81.f);
  Rml::Dictionary parameters;
  parameters["value"] = Rml::String("creation");
  parameters["dimensions"] = Rml::Vector2f(81.f, 81.f);
  const auto shader = renderer.CompileShader("shader", parameters);
  assert(shader);
  parameters["dimensions"] = Rml::Vector2f(200.f, 1.f);

  for (const double time : {0.25, 1.75}) {
    clock->seconds = time;
    renderer.BeginFrame();
    renderer.RenderShader(shader, geometry, {}, 0);
    const auto image = Capture(&renderer);
    std::array<float, 4> channels{0.f, 0.f, 0.f, 128.f / 255.f};
    const float x = 13.5f / 81.f;
    const float y = 23.5f / 81.f;
    const float px = x - 0.5f;
    const float py = y - 0.5f;
    const float length = std::hypot(px, py);
    for (int i = 0; i < 3; ++i) {
      const float z = static_cast<float>(time) + static_cast<float>(i) * 0.07f;
      const float amplitude =
          (std::sin(z) + 1.f) * std::abs(std::sin(length * 9.f - 2.f * z));
      const float ux = x + px / length * amplitude;
      const float uy = y + py / length * amplitude;
      channels[i] = 0.01f / (std::hypot(ux - std::floor(ux) - 0.5f,
                                        uy - std::floor(uy) - 0.5f) *
                             length);
    }
    Expect(image, 13, 23, channels);
    Expect(image, 40, 40, {1.f, 1.f, 1.f, 128.f / 255.f});
    renderer.RollbackFrame();
  }
  renderer.ReleaseShader(shader);
  renderer.ReleaseGeometry(geometry);
  parameters["dimensions"] = Rml::Vector2f(0.f);
  assert(renderer.CompileShader("shader", parameters) == 0);
  parameters["value"] = Rml::String("unsupported");
  assert(renderer.CompileShader("shader", parameters) == 0);
  std::cout << "PASS native-creation-fixed-clock-dimensions-center-alpha\n";
}

}  // namespace

int main() {
  Clock clock;
  Rml::SetSystemInterface(&clock);
  sf::ContextSettings settings;
  settings.stencilBits = 8;
  sf::RenderWindow window(sf::VideoMode({160, 120}),
                          "Native SFML shader contracts",
                          sf::Style::Default,
                          sf::State::Windowed,
                          settings);
  window.setVisible(false);
  Gradients(&window);
  StopsAndPerspective(&window);
  DegenerateStops(&window);
  Creation(&window, &clock);
  Rml::SetSystemInterface(nullptr);
}
