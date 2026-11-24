// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Vertex.h>

#include <algorithm>
#include <array>
#include <iostream>
#include <stdexcept>
#include <string>

#include "native/rendering/render-interface-sfml.h"
#include "test/native/rendering/initialization/sfml-faults.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Window/VideoMode.hpp>

namespace {

using Renderer = sfmlrmlui::RenderInterfaceSFML;

constexpr unsigned kRequiredPrograms = 8;

void Require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

void ExpectView(const sf::View& actual, const sf::View& expected) {
  Require(actual.getCenter() == expected.getCenter() &&
              actual.getSize() == expected.getSize() &&
              actual.getRotation() == expected.getRotation() &&
              actual.getViewport() == expected.getViewport() &&
              actual.getScissor() == expected.getScissor(),
          "Renderer failed to preserve the complete host view");
}

Rml::Dictionary Creation() {
  Rml::Dictionary parameters;
  parameters["value"] = Rml::String("creation");
  parameters["dimensions"] = Rml::Vector2f{20.f, 10.f};
  return parameters;
}

void UninitializedShader() {
  Renderer renderer;
  const auto shader = renderer.CompileShader("shader", Creation());
  renderer.ReleaseShader(shader);
  Require(shader == 0, "Uninitialized renderer returned a shader handle");
}

void StartupFailure(sf::RenderWindow* window, unsigned stage) {
  Renderer renderer;
  faults::Reset();
  faults::unavailable_shaders = stage == 0;
  faults::shader_failure_call = stage;
  const auto host_view = window->getView();
  bool threw = false;
  try {
    renderer.SetWindow(window);
  } catch (const std::runtime_error&) {
    threw = true;
  }
  Require(threw, "Unavailable renderer did not reject window attachment");
  ExpectView(window->getView(), host_view);
  Require(!renderer.HasActiveFrame(), "Startup failure left an active frame");
  bool frame_rejected = false;
  try {
    renderer.BeginFrame();
  } catch (const std::runtime_error&) {
    frame_rejected = true;
  }
  Require(frame_rejected, "Failed startup still opened a render frame");
  Require(renderer.CompileShader("shader", Creation()) == 0,
          "Failed startup exposed a custom shader");
  Require(renderer.CompileFilter("blur", {}) == 0,
          "Failed startup exposed a filter");
  renderer.SetScissorRegion(
      Rml::Rectanglei::FromPositionSize({0, 0}, {20, 10}));
  Require(renderer.SaveLayerAsMaskImage() == 0,
          "Failed startup exposed a saved mask");

  // Retrying on the same renderer must replace every partially compiled
  // program and produce a real usable frame without changing the host view.
  faults::Reset();
  renderer.SetWindow(window);
  Require(faults::shader_calls == kRequiredPrograms,
          "Retry omitted a required program");
  renderer.BeginFrame();
  renderer.EndFrame();
  ExpectView(window->getView(), host_view);
  const auto shader = renderer.CompileShader("shader", Creation());
  Require(shader != 0, "Retry did not make custom shaders available");
  renderer.ReleaseShader(shader);
}

void FailedGpuUpload() {
  sfmlrmlui::DataDiagnostics diagnostics;
  diagnostics.active = true;
  Renderer renderer(&diagnostics);
  const std::array<Rml::byte, 4> bytes{100, 50, 25, 128};
  faults::fail_texture_resize = true;
  const auto failed =
      renderer.GenerateTexture({bytes.data(), bytes.size()}, {1, 1});
  faults::fail_texture_resize = false;
  Require(failed == 0, "Failed GPU resize returned a texture handle");
  Require(
      diagnostics.texture_uploads == 0 && diagnostics.texture_upload_bytes == 0,
      "Failed GPU resize recorded a successful upload");
  const auto handle =
      renderer.GenerateTexture({bytes.data(), bytes.size()}, {1, 1});
  Require(handle != 0, "Upload did not recover after GPU failure");
  const auto image = reinterpret_cast<sf::Texture*>(handle)->copyToImage();
  renderer.ReleaseTexture(handle);
  Require(image.getPixel({0, 0}) == sf::Color(100, 50, 25, 128),
          "Recovered GPU upload did not preserve pixel bytes");
  Require(
      diagnostics.texture_uploads == 1 && diagnostics.texture_upload_bytes == 4,
      "Recovered GPU upload recorded the wrong counters");
}

Rml::CompiledGeometryHandle Triangle(Renderer* renderer) {
  const Rml::ColourbPremultiplied red(128, 0, 0, 128);
  const std::array<Rml::Vertex, 3> vertices{{
      {{3.f, 3.f}, red, {}},
      {{30.f, 3.f}, red, {}},
      {{3.f, 30.f}, red, {}},
  }};
  const std::array<int, 3> indices{0, 1, 2};
  return renderer->CompileGeometry({vertices.data(), vertices.size()},
                                   {indices.data(), indices.size()});
}

sf::Image HostPixels(sf::RenderWindow* window) {
  Require(window->setActive(true), "Cannot activate host for capture");
  sf::Texture capture(window->getSize());
  capture.update(*window);
  return capture.copyToImage();
}

void ExpectIdentical(const sf::Image& actual, const sf::Image& expected) {
  const auto size = actual.getSize();
  Require(size == expected.getSize(), "Capture dimensions changed");
  Require(std::equal(actual.getPixelsPtr(),
                     actual.getPixelsPtr() + size.x * size.y * 4,
                     expected.getPixelsPtr()),
          "Failed frame changed host pixels");
}

void VertexFailure(sf::RenderWindow* window, bool clip) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto geometry = Triangle(&renderer);
  Require(geometry != 0, "Cannot compile triangle fixture");
  const auto view = window->getView();
  const auto host = HostPixels(window);
  renderer.BeginFrame();
  faults::vertex_failures = 1;
  bool threw = false;
  try {
    if (clip) {
      renderer.RenderToClipMask(Rml::ClipMaskOperation::Set, geometry, {});
    } else {
      renderer.RenderGeometry(geometry, {}, 0);
      renderer.FlushGeometry();
    }
  } catch (const std::runtime_error&) {
    threw = true;
  }
  renderer.RollbackFrame();
  renderer.ReleaseGeometry(geometry);
  ExpectView(window->getView(), view);
  ExpectIdentical(HostPixels(window), host);
  Require(threw, "Failed vertex allocation silently discarded geometry");
  Require(!renderer.HasActiveFrame(), "Failed frame remained active");

  faults::Reset();
  renderer.BeginFrame();
  const auto recovered = Triangle(&renderer);
  renderer.RenderGeometry(recovered, {}, 0);
  renderer.ReleaseGeometry(recovered);
  renderer.EndFrame();
  ExpectView(window->getView(), view);
}

void MergedAllocationFallback(sf::RenderWindow* window) {
  sfmlrmlui::DataDiagnostics diagnostics;
  diagnostics.active = true;
  Renderer renderer(&diagnostics);
  renderer.SetWindow(window);
  const auto geometry = Triangle(&renderer);
  renderer.BeginFrame();
  renderer.RenderGeometry(geometry, {}, 0);
  renderer.RenderGeometry(geometry, {30.f, 0.f}, 0);
  faults::vertex_failures = 1;
  renderer.FlushGeometry();
  Require(diagnostics.geometry_draws == 2,
          "Failed merged allocation lost the original draw sequence");
  Require(diagnostics.geometry_uploads == 1,
          "Fallback duplicated the immutable solo upload");
  renderer.SetScissorRegion(
      Rml::Rectanglei::FromPositionSize({0, 0}, {80, 60}));
  const auto handle = renderer.SaveLayerAsTexture();
  Require(handle != 0, "Cannot read fallback geometry");
  const auto image = reinterpret_cast<sf::Texture*>(handle)->copyToImage();
  renderer.ReleaseTexture(handle);
  Require(image.getPixel({10, 10}) == sf::Color(128, 0, 0, 128) &&
              image.getPixel({40, 10}) == sf::Color(128, 0, 0, 128),
          "Fallback changed submitted positions or premultiplied pixels");
  renderer.ReleaseGeometry(geometry);
  renderer.RollbackFrame();
}

void BlurAllocationRecovery(sf::RenderWindow* window) {
  Renderer renderer;
  renderer.SetWindow(window);
  const auto view = window->getView();
  const auto host = HostPixels(window);
  const auto geometry = Triangle(&renderer);
  Rml::Dictionary parameters;
  parameters["sigma"] = 3.f;
  const auto filter = renderer.CompileFilter("blur", parameters);
  Require(filter != 0, "Cannot compile blur fixture");
  const std::array<Rml::CompiledFilterHandle, 1> filters{filter};

  for (const bool fail : {true, false}) {
    renderer.BeginFrame();
    const auto layer = renderer.PushLayer();
    renderer.RenderGeometry(geometry, {}, 0);
    renderer.FlushGeometry();
    faults::vertex_failures = fail ? 1 : 0;
    bool threw = false;
    try {
      renderer.CompositeLayers(
          layer, 0, Rml::BlendMode::Replace, {filters.data(), filters.size()});
    } catch (const std::runtime_error&) {
      threw = true;
    }
    Require(threw == fail, "Blur geometry allocation did not recover");
    if (!fail) {
      renderer.PopLayer();
      renderer.SetScissorRegion(
          Rml::Rectanglei::FromPositionSize({0, 0}, {80, 60}));
      const auto texture = renderer.SaveLayerAsTexture();
      Require(texture != 0, "Cannot capture recovered blur");
      const auto image =
          reinterpret_cast<const sf::Texture*>(texture)->copyToImage();
      renderer.ReleaseTexture(texture);
      Require(image.getPixel({10, 10}).a > 0,
              "Recovered blur discarded submitted pixels");
    }
    renderer.RollbackFrame();
    ExpectView(window->getView(), view);
    ExpectIdentical(HostPixels(window), host);
  }
  renderer.ReleaseFilter(filter);
  renderer.ReleaseGeometry(geometry);
}

}  // namespace

int main() {
  sf::ContextSettings settings;
  settings.stencilBits = 8;
  sf::RenderWindow window(sf::VideoMode({80, 60}),
                          "Native startup contracts",
                          sf::Style::Default,
                          sf::State::Windowed,
                          settings);
  window.setVisible(false);
  sf::View host_view(sf::FloatRect({3.f, 7.f}, {61.f, 43.f}));
  host_view.setRotation(sf::degrees(17.f));
  host_view.setViewport(sf::FloatRect({0.1f, 0.2f}, {0.7f, 0.6f}));
  host_view.setScissor(sf::FloatRect({0.2f, 0.3f}, {0.5f, 0.4f}));
  window.setView(host_view);
  int failures = 0;
  const auto run = [&failures](const std::string& name, auto test) {
    faults::Reset();
    try {
      test();
      std::cout << "PASS native-startup-" << name << "\n";
    } catch (const std::exception& error) {
      std::cout << "FAIL native-startup-" << name << ": " << error.what()
                << "\n";
      ++failures;
    }
    faults::Reset();
  };
  run("uninitialized-shader", UninitializedShader);
  for (unsigned stage = 0; stage <= kRequiredPrograms; ++stage) {
    run("required-program-" + std::to_string(stage),
        [&] { StartupFailure(&window, stage); });
  }
  run("gpu-texture-failure-recovery", FailedGpuUpload);
  run("vertex-failure-host-rollback", [&] { VertexFailure(&window, false); });
  run("clip-vertex-failure-host-rollback",
      [&] { VertexFailure(&window, true); });
  run("merged-allocation-solo-fallback",
      [&] { MergedAllocationFallback(&window); });
  run("blur-allocation-recovery", [&] { BlurAllocationRecovery(&window); });
  return failures ? 1 : 0;
}
