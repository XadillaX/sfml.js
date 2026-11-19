// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Raw GL appears only in this independent pinned upstream renderer driver.
#include <RmlUi/Debugger.h>

#include <cassert>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <vector>

#include "test/native/visual/reference/actions.h"
#include "test/native/visual/reference/environment.h"
#include "test/native/visual/reference/metadata.h"
#include "third_party/rmlui/Backends/RmlUi_Include_GL3.h"
#include "third_party/rmlui/Backends/RmlUi_Renderer_GL3.h"
#include "third_party/rmlui/Tests/Source/VisualTests/XmlNodeHandlers.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Window/VideoMode.hpp>
#include <SFML/Window/Window.hpp>

namespace {

sf::Image Capture() {
  using visual_reference::kHeight;
  using visual_reference::kWidth;
  std::vector<unsigned char> pixels(kWidth * kHeight * 4);
  glReadBuffer(GL_BACK);
  glPixelStorei(GL_PACK_ALIGNMENT, 1);
  glReadPixels(0, 0, kWidth, kHeight, GL_RGBA, GL_UNSIGNED_BYTE, pixels.data());
  assert(glGetError() == GL_NO_ERROR);
  sf::Image image({kWidth, kHeight}, pixels.data());
  image.flipVertically();
  return image;
}

}  // namespace

int main(int argc, char** argv) {
  using visual_reference::Elements;
  using visual_reference::Files;
  using visual_reference::kHeight;
  using visual_reference::kWidth;
  using visual_reference::String;
  using visual_reference::Strings;
  using visual_reference::System;
  assert((argc == 3 || argc == 4) && std::filesystem::is_directory(argv[1]));
  const bool interacting = argc == 4;
  const auto actions = interacting ? visual_reference::LoadActions(argv[3])
                                   : visual_reference::ActionMap{};
  const std::filesystem::path output(argv[1]);
  std::ifstream manifest(argv[2]);
  assert(manifest);
  sf::ContextSettings settings;
  settings.majorVersion = 4;
  settings.minorVersion = 1;
  settings.attributeFlags = sf::ContextSettings::Core;
  settings.stencilBits = 8;
  sf::Window window(sf::VideoMode({kWidth, kHeight}),
                    "Pinned GL3 VisualTests reference",
                    sf::Style::Default,
                    sf::State::Windowed,
                    settings);
  window.setVisible(false);
  assert(window.setActive(true));
  Rml::String message;
  assert(RmlGL3::Initialize(&message));
  {
    RenderInterface_GL3 renderer;
    assert(renderer);
    renderer.SetViewport(kWidth, kHeight);
    const auto samples =
        std::filesystem::current_path() / "third_party/rmlui/Samples";
    Files files(samples);
    System system;
    Rml::SetFileInterface(&files);
    Rml::SetSystemInterface(&system);
    Rml::SetRenderInterface(&renderer);
    assert(Rml::Initialise());
    Rml::XMLParser::RegisterNodeHandler("meta",
                                        Rml::MakeShared<XMLNodeHandlerMeta>());
    Rml::XMLParser::RegisterNodeHandler("link",
                                        Rml::MakeShared<XMLNodeHandlerLink>());
    for (const char* face : {"LatoLatin-Regular",
                             "LatoLatin-Italic",
                             "LatoLatin-Bold",
                             "LatoLatin-BoldItalic",
                             "NotoEmoji-Regular",
                             "RobotoMono-Regular",
                             "RobotoMono-Italic",
                             "RobotoMono-Bold",
                             "RobotoMono-BoldItalic"}) {
      const auto filename = samples / "assets" / (Rml::String(face) + ".ttf");
      assert(Rml::LoadFontFace(filename.string(),
                               Rml::String(face) == "NotoEmoji-Regular"));
    }
    auto* context = Rml::CreateContext("visual", {kWidth, kHeight});
    assert(context);
    assert(Rml::Debugger::Initialise(context));
    Rml::String line;
    while (std::getline(manifest, line)) {
      const auto separator = line.find('\t');
      assert(separator != Rml::String::npos);
      const auto name = line.substr(0, separator);
      system.warnings.clear();
      system.errors.clear();
      system.seconds = 0;
      if (interacting) {
        context->SetDimensions({kWidth, kHeight});
        context->SetDensityIndependentPixelRatio(1);
        context->ProcessMouseMove(-1, -1, 0);
      }
      auto* document = context->LoadDocument(line.substr(separator + 1));
      assert(document);
      document->Show(Rml::ModalFlag::None, Rml::FocusFlag::None);
      assert(context->Update());
      system.seconds = 1;
      assert(context->Update());
      const auto capture_frame = [&](const Rml::String& frame,
                                     Rml::Vector2i pointer) {
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        glClearColor(0.f, 0.f, 0.f, 1.f);
        glClear(GL_COLOR_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
        renderer.BeginFrame();
        assert(context->Render());
        renderer.EndFrame();
        assert(Capture().saveToFile(output / (frame + ".png")));
        std::ofstream metadata(output / (frame + ".json"));
        metadata << "{\"title\":";
        String(metadata, document->GetTitle());
        metadata << ",\"scrollPosition\":[" << document->GetScrollLeft() << ','
                 << document->GetScrollTop() << "],\"elements\":[";
        bool first = true;
        Elements(metadata, document, "0", &first, interacting);
        metadata << "],\"warnings\":";
        Strings(metadata, system.warnings);
        metadata << ",\"errors\":";
        Strings(metadata, system.errors);
        if (interacting) {
          metadata << ",\"pointer\":[" << pointer.x << ',' << pointer.y
                   << "],\"dimensions\":[" << context->GetDimensions().x << ','
                   << context->GetDimensions().y << "],\"density\":"
                   << context->GetDensityIndependentPixelRatio()
                   << ",\"time\":" << system.seconds << ",\"focus\":";
          const auto* focus = context->GetFocusElement();
          String(metadata, focus ? focus->GetAddress(false, true) : "");
          metadata << ",\"hover\":";
          const auto* hover = context->GetHoverElement();
          String(metadata, hover ? hover->GetAddress(false, true) : "");
        }
        metadata << "}\n";
        std::cout << "CAPTURE GL3 " << frame
                  << " warnings=" << system.warnings.size()
                  << " errors=" << system.errors.size() << "\n";
      };
      if (interacting) {
        capture_frame(name, {-1, -1});
        visual_reference::RunActions(
            context,
            document,
            &system,
            actions.at(name),
            [&](const Rml::String& checkpoint, Rml::Vector2i pointer) {
              capture_frame(name + "--" + checkpoint, pointer);
            });
        document->Close();
        assert(context->Update());
        continue;
      }
      const float max_x = std::max(
          0.f, document->GetScrollWidth() - document->GetClientWidth());
      const float max_y = std::max(
          0.f, document->GetScrollHeight() - document->GetClientHeight());
      int row = 0;
      for (float y = 0;; y = std::min(y + 600.f, max_y), ++row) {
        int column = 0;
        for (float x = 0;; x = std::min(x + 600.f, max_x), ++column) {
          document->SetScrollLeft(x);
          document->SetScrollTop(y);
          assert(context->Update());
          const auto frame = row == 0 && column == 0
                                 ? name
                                 : name + "--scroll-" + std::to_string(column) +
                                       "-" + std::to_string(row);
          capture_frame(frame, {-1, -1});
          if (x == max_x) break;
        }
        if (y == max_y) break;
      }
      document->Close();
      assert(context->Update());
    }
    Rml::Shutdown();
  }
  RmlGL3::Shutdown();
}
