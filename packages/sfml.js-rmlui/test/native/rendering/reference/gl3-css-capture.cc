// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Raw GL is restricted to this pinned upstream reference driver.
#include <cassert>
#include <filesystem>
#include <iostream>
#include <vector>

#include "test/native/rendering/css/effect-scenes.h"
#include "test/native/rendering/reference/software-geometry-completion.h"
#include "third_party/rmlui/Backends/RmlUi_Include_GL3.h"
#include "third_party/rmlui/Backends/RmlUi_Renderer_GL3.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Window/VideoMode.hpp>
#include <SFML/Window/Window.hpp>

namespace {

sf::Image Capture() {
  std::vector<unsigned char> pixels(css_scenes::kWidth * css_scenes::kHeight *
                                    4);
  glReadBuffer(GL_BACK);
  glPixelStorei(GL_PACK_ALIGNMENT, 1);
  glReadPixels(0,
               0,
               css_scenes::kWidth,
               css_scenes::kHeight,
               GL_RGBA,
               GL_UNSIGNED_BYTE,
               pixels.data());
  assert(glGetError() == GL_NO_ERROR);
  sf::Image image({css_scenes::kWidth, css_scenes::kHeight}, pixels.data());
  image.flipVertically();
  return image;
}

}  // namespace

int main(int argc, char** argv) {
  assert(argc == 2 && std::filesystem::is_directory(argv[1]));
  sf::ContextSettings settings;
  settings.majorVersion = 4;
  settings.minorVersion = 1;
  settings.attributeFlags = sf::ContextSettings::Core;
  settings.stencilBits = 8;
  sf::Window window(sf::VideoMode({css_scenes::kWidth, css_scenes::kHeight}),
                    "Pinned GL3 CSS reference",
                    sf::Style::Default,
                    sf::State::Windowed,
                    settings);
  window.setVisible(false);
  assert(window.setActive(true));
  Rml::String message;
  assert(RmlGL3::Initialize(&message));
  {
    gl3_reference::SoftwareGeometryCompletion geometry_completion;
    RenderInterface_GL3 renderer;
    assert(renderer);
    renderer.SetViewport(css_scenes::kWidth, css_scenes::kHeight);
    css_scenes::System system;
    Rml::SetSystemInterface(&system);
    Rml::SetRenderInterface(&renderer);
    assert(Rml::Initialise());
    auto* context =
        Rml::CreateContext("css", {css_scenes::kWidth, css_scenes::kHeight});
    assert(context);
    for (const auto& scene : css_scenes::kScenes) {
      auto* document = css_scenes::Load(context, scene);
      glBindFramebuffer(GL_FRAMEBUFFER, 0);
      glClearColor(0.f, 0.f, 0.f, 1.f);
      glClear(GL_COLOR_BUFFER_BIT);
      renderer.BeginFrame();
      assert(context->Render());
      renderer.EndFrame();
      const auto image = Capture();
      bool positive = false;
      for (unsigned y = 0; y < css_scenes::kHeight; ++y) {
        for (unsigned x = 0; x < css_scenes::kWidth; ++x) {
          const auto pixel = image.getPixel({x, y});
          positive |= pixel.r > 0 && pixel.g > 0;
        }
      }
      assert(positive && system.errors == 0);
      const auto name = Rml::String("css-") + scene.name + ".png";
      assert(image.saveToFile(std::filesystem::path(argv[1]) / name));
      std::cout << "PASS reference-" << name << "\n";
      document->Close();
      assert(context->Update());
    }
    Rml::Shutdown();
  }
  RmlGL3::Shutdown();
}
