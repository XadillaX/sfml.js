// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Raw GL is confined to this pinned upstream reference driver. Production
// rendering and SFML acceptance probes use only SFML rendering/readback.
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Vertex.h>

#include <array>
#include <cassert>
#include <filesystem>
#include <iostream>
#include <vector>

#include "test/native/rendering/reference/software-scissor-region.h"
#include "vendor/rmlui/Backends/RmlUi_Include_GL3.h"
#include "vendor/rmlui/Backends/RmlUi_Renderer_GL3.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Window/VideoMode.hpp>
#include <SFML/Window/Window.hpp>

namespace {

constexpr int kWidth = 161;
constexpr int kHeight = 121;

sf::Image ReadFramebuffer(GLenum buffer) {
  std::vector<unsigned char> pixels(kWidth * kHeight * 4);
  glReadBuffer(buffer);
  glPixelStorei(GL_PACK_ALIGNMENT, 1);
  glReadPixels(0, 0, kWidth, kHeight, GL_RGBA, GL_UNSIGNED_BYTE, pixels.data());
  assert(glGetError() == GL_NO_ERROR);
  sf::Image image(sf::Vector2u{kWidth, kHeight}, pixels.data());
  image.flipVertically();
  return image;
}

Rml::CompiledGeometryHandle Geometry(RenderInterface_GL3* renderer) {
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

void CaptureFilter(RenderInterface_GL3* renderer,
                   const std::filesystem::path& output,
                   const char* name,
                   float sigma,
                   Rml::Vector2f offset,
                   bool bounded) {
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  glClearColor(0.f, 0.f, 0.f, 1.f);
  glClear(GL_COLOR_BUFFER_BIT);
  renderer->BeginFrame();
  const auto geometry = Geometry(renderer);
  const auto layer = renderer->PushLayer();
  renderer->RenderGeometry(geometry, {}, 0);
  renderer->EnableScissorRegion(true);
  renderer->SetScissorRegion(Rml::Rectanglei::FromPositionSize(
      bounded ? Rml::Vector2i{17, 11} : Rml::Vector2i{0, 0},
      bounded ? Rml::Vector2i{83, 67} : Rml::Vector2i{kWidth, kHeight}));
  Rml::Dictionary parameters;
  parameters["sigma"] = sigma;
  parameters["offset"] = offset;
  parameters["color"] = Rml::Colourb(0, 128, 255, 128);
  const auto filter = renderer->CompileFilter(name, parameters);
  assert(filter);
  const std::array<Rml::CompiledFilterHandle, 1> filters{filter};
  renderer->CompositeLayers(
      layer, 0, Rml::BlendMode::Replace, {filters.data(), filters.size()});
  renderer->PopLayer();
  renderer->ReleaseFilter(filter);
  renderer->ReleaseGeometry(geometry);
  GLint layer_framebuffer = 0;
  glGetIntegerv(GL_FRAMEBUFFER_BINDING, &layer_framebuffer);
  renderer->EndFrame();
  const auto image = ReadFramebuffer(GL_BACK);
  bool positive = false;
  for (unsigned y = 0; y < kHeight; ++y) {
    for (unsigned x = 0; x < kWidth; ++x) {
      const auto pixel = image.getPixel({x, y});
      const bool is_shadow = Rml::String(name) == "drop-shadow";
      positive |= is_shadow ? pixel.b > 0 : pixel.r > 0;
    }
  }
  if (!positive) {
    glBindFramebuffer(GL_FRAMEBUFFER, layer_framebuffer);
    const auto layer = ReadFramebuffer(GL_COLOR_ATTACHMENT0);
    const auto pixel = layer.getPixel({40, 30});
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    assert(image.saveToFile(output));
    std::cerr << "FAIL reference-" << output.filename().string()
              << " renderer=" << glGetString(GL_RENDERER)
              << " vendor=" << glGetString(GL_VENDOR)
              << " layer-center=" << unsigned(pixel.r) << ","
              << unsigned(pixel.g) << "," << unsigned(pixel.b) << ","
              << unsigned(pixel.a) << "\n";
  }
  assert(positive);
  assert(image.saveToFile(output));
  std::cout << "PASS reference-" << output.filename().string() << "\n";
}

}  // namespace

int main(int argc, char** argv) {
  assert(argc == 2 && std::filesystem::is_directory(argv[1]));
  sf::ContextSettings settings;
  settings.majorVersion = 4;
  settings.minorVersion = 1;
  settings.attributeFlags = sf::ContextSettings::Core;
  settings.stencilBits = 8;
  sf::Window window(sf::VideoMode({kWidth, kHeight}),
                    "Pinned GL3 reference",
                    sf::Style::Default,
                    sf::State::Windowed,
                    settings);
  window.setVisible(false);
  assert(window.setActive(true));
  Rml::String message;
  assert(RmlGL3::Initialize(&message));
  std::cout << message << "\n";
  {
    gl3_reference::SoftwareScissorRegion scissor_region;
    RenderInterface_GL3 renderer;
    assert(renderer);
    renderer.SetViewport(kWidth, kHeight);
    for (const auto* name : {"blur", "drop-shadow"}) {
      for (const int sigma : {0, 3, 8, 24}) {
        for (const bool bounded : {false, true}) {
          const auto filename = Rml::String(name) + "-" +
                                std::to_string(sigma) +
                                (bounded ? "-bounded.png" : "-full.png");
          CaptureFilter(&renderer,
                        std::filesystem::path(argv[1]) / filename,
                        name,
                        static_cast<float>(sigma),
                        {9.f, 15.f},
                        bounded);
        }
      }
    }
  }
  RmlGL3::Shutdown();
}
