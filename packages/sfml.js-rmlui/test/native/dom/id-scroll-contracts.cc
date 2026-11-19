// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/FontEngineInterface.h>
#include <RmlUi/Core/ID.h>
#include <RmlUi/Core/RenderInterface.h>
#include <RmlUi/Core/ScrollTypes.h>
#include <RmlUi/Core/StreamMemory.h>
#include <RmlUi/Core/StyleSheet.h>
#include <RmlUi/Core/StyleSheetTypes.h>
#include <RmlUi/Core/SystemInterface.h>
#include <RmlUi/Core/URL.h>

#include <array>
#include <cassert>
#include <iostream>
#include <string_view>
#include <type_traits>

#include "third_party/rmlui/Source/Core/StyleSheetParser.h"

namespace sfmlrmlui {

// The standalone Core oracle has no JS/Lua runtime or registered data models.
// Its patched Context destructor still invokes these binding-only hooks.
void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {
  assert(false && "This oracle must not create data models");
}

void ReleaseLuaContextModels(Rml::Context*) {}

}  // namespace sfmlrmlui

namespace {

class BasicRenderer : public Rml::RenderInterface {
 public:
  Rml::CompiledGeometryHandle CompileGeometry(Rml::Span<const Rml::Vertex>,
                                              Rml::Span<const int>) override {
    return 1;
  }

  void RenderGeometry(Rml::CompiledGeometryHandle,
                      Rml::Vector2f,
                      Rml::TextureHandle) override {}

  void ReleaseGeometry(Rml::CompiledGeometryHandle) override {}

  Rml::TextureHandle LoadTexture(Rml::Vector2i&, const Rml::String&) override {
    return 0;
  }

  Rml::TextureHandle GenerateTexture(Rml::Span<const Rml::byte>,
                                     Rml::Vector2i) override {
    return 0;
  }

  void ReleaseTexture(Rml::TextureHandle) override {}
  void EnableScissorRegion(bool) override {}
  void SetScissorRegion(Rml::Rectanglei) override {}
};

class FixedClock : public Rml::SystemInterface {
 public:
  double GetElapsedTime() override { return elapsed; }

  double elapsed = 0;
};

struct FontCall {
  Rml::String source;
  int index;
  Rml::String family;
  Rml::Style::FontStyle style;
  Rml::Style::FontWeight weight;
  bool fallback;
};

class CaptureFonts : public Rml::FontEngineInterface {
 public:
  bool LoadFontFace(const Rml::String& source,
                    int index,
                    const Rml::String& family,
                    Rml::Style::FontStyle style,
                    Rml::Style::FontWeight weight,
                    bool fallback) override {
    calls.push_back({source, index, family, style, weight, fallback});
    return true;
  }

  Rml::Vector<FontCall> calls;
};

template <typename Enum, size_t count>
void PrintEnum(const std::array<std::pair<const char*, Enum>, count>& values) {
  std::cout << "{";
  for (size_t i = 0; i < values.size(); ++i) {
    std::cout << (i ? "," : "") << "\"" << values[i].first
              << "\":" << static_cast<int>(values[i].second);
  }
  std::cout << "}";
}

void PrintEnums() {
  using Media = Rml::MediaQueryId;
  using Font = Rml::FontFaceId;
  const std::array<std::pair<const char*, Media>, 16> media{{
      {"Invalid", Media::Invalid},
      {"Width", Media::Width},
      {"MinWidth", Media::MinWidth},
      {"MaxWidth", Media::MaxWidth},
      {"Height", Media::Height},
      {"MinHeight", Media::MinHeight},
      {"MaxHeight", Media::MaxHeight},
      {"AspectRatio", Media::AspectRatio},
      {"MinAspectRatio", Media::MinAspectRatio},
      {"MaxAspectRatio", Media::MaxAspectRatio},
      {"Resolution", Media::Resolution},
      {"MinResolution", Media::MinResolution},
      {"MaxResolution", Media::MaxResolution},
      {"Orientation", Media::Orientation},
      {"Theme", Media::Theme},
      {"NumDefinedIds", Media::NumDefinedIds},
  }};
  const std::array<std::pair<const char*, Font>, 8> fonts{{
      {"Invalid", Font::Invalid},
      {"FontFamily", Font::FontFamily},
      {"FontWeight", Font::FontWeight},
      {"FontStyle", Font::FontStyle},
      {"Src", Font::Src},
      {"FallbackFace", Font::FallbackFace},
      {"FaceIndex", Font::FaceIndex},
      {"NumDefinedIds", Font::NumDefinedIds},
  }};
  static_assert(std::is_same_v<std::underlying_type_t<Media>, uint8_t>);
  static_assert(std::is_same_v<std::underlying_type_t<Font>, uint8_t>);

  std::cout << "{\"MediaQueryId\":";
  PrintEnum(media);
  std::cout << ",\"FontFaceId\":";
  PrintEnum(fonts);
  std::cout << ",\"ScrollBehavior\":";
  PrintEnum(std::array<std::pair<const char*, Rml::ScrollBehavior>, 3>{{
      {"Auto", Rml::ScrollBehavior::Auto},
      {"Smooth", Rml::ScrollBehavior::Smooth},
      {"Instant", Rml::ScrollBehavior::Instant},
  }});
  std::cout << ",\"ScrollAlignment\":";
  PrintEnum(std::array<std::pair<const char*, Rml::ScrollAlignment>, 5>{{
      {"Start", Rml::ScrollAlignment::Start},
      {"Center", Rml::ScrollAlignment::Center},
      {"End", Rml::ScrollAlignment::End},
      {"Nearest", Rml::ScrollAlignment::Nearest},
      {"Adaptive", Rml::ScrollAlignment::Adaptive},
  }});
  std::cout << ",\"ScrollParentage\":";
  PrintEnum(std::array<std::pair<const char*, Rml::ScrollParentage>, 2>{{
      {"All", Rml::ScrollParentage::All},
      {"Closest", Rml::ScrollParentage::Closest},
  }});
}

void CheckLocalParsers(CaptureFonts* fonts) {
  const Rml::String source =
      "@media (width:320px) and (min-width:320px) and (max-width:320px)"
      " and (height:240px) and (min-height:240px) and (max-height:240px)"
      " and (aspect-ratio:4/3) and (min-aspect-ratio:4/3)"
      " and (max-aspect-ratio:4/3) and (resolution:2x)"
      " and (min-resolution:2x) and (max-resolution:2x)"
      " and (orientation:landscape) and (theme:night) {div{width:1px;}}"
      "@font-face{font-family:default-family;src:first.ttf;}"
      "@font-face{font-family:explicit-family;font-style:italic;"
      "font-weight:650;src:second.ttf,third.ttf;"
      "-rmlui-fallback-face:true;-rmlui-face-index:2;}";
  Rml::StreamMemory stream(reinterpret_cast<const Rml::byte*>(source.data()),
                           source.size());
  stream.SetSourceURL("local-specification.rcss");
  Rml::MediaBlockList blocks;
  Rml::StyleSheetParser parser;
  assert(parser.Parse(blocks, &stream, 1));

  const Rml::MediaBlock* media = nullptr;
  for (const auto& block : blocks) {
    if (!block.properties.Empty()) {
      assert(!media);
      media = &block;
    }
  }
  assert(media && media->properties.GetNumProperties() == 14);
  for (int id = 1; id < static_cast<int>(Rml::MediaQueryId::NumDefinedIds);
       ++id) {
    assert(media->properties.GetProperty(static_cast<Rml::PropertyId>(id)));
  }
  const auto* theme = media->properties.GetProperty(
      static_cast<Rml::PropertyId>(Rml::MediaQueryId::Theme));
  assert(theme->Get<Rml::String>() == "night");

  assert(fonts->calls.size() == 3);
  const auto& first = fonts->calls[0];
  assert(first.source == "first.ttf" && first.index == 0);
  assert(first.family == "default-family");
  assert(first.style == Rml::Style::FontStyle::Normal);
  assert(first.weight == Rml::Style::FontWeight::Auto && !first.fallback);
  for (size_t i = 1; i < fonts->calls.size(); ++i) {
    const auto& call = fonts->calls[i];
    assert(call.source == (i == 1 ? "second.ttf" : "third.ttf"));
    assert(call.index == 2 && call.family == "explicit-family");
    assert(call.style == Rml::Style::FontStyle::Italic);
    assert(static_cast<int>(call.weight) == 650 && call.fallback);
  }
}

std::array<Rml::Vector2f, 5> CheckScroll(FixedClock* clock) {
  const Rml::ScrollIntoViewOptions defaults;
  assert(defaults.vertical == Rml::ScrollAlignment::Start);
  assert(defaults.horizontal == Rml::ScrollAlignment::Nearest);
  assert(defaults.behavior == Rml::ScrollBehavior::Instant);
  assert(defaults.parentage == Rml::ScrollParentage::All);

  const Rml::ScrollIntoViewOptions explicit_options{
      Rml::ScrollAlignment::End,
      Rml::ScrollAlignment::Center,
      Rml::ScrollBehavior::Smooth,
      Rml::ScrollParentage::Closest};
  assert(explicit_options.vertical == Rml::ScrollAlignment::End);
  assert(explicit_options.horizontal == Rml::ScrollAlignment::Center);
  assert(explicit_options.behavior == Rml::ScrollBehavior::Smooth);
  assert(explicit_options.parentage == Rml::ScrollParentage::Closest);

  auto* context = Rml::CreateContext("scroll-reference", {320, 240});
  assert(context);
  auto* document = context->LoadDocumentFromMemory(
      "<rml><head><style>"
      "body{width:320px;height:240px;margin:0;}"
      "div{display:block;}"
      "#scroller{width:100px;height:100px;overflow:auto;}"
      "#content{position:relative;width:300px;height:400px;}"
      "#item{position:absolute;left:200px;top:200px;width:20px;height:20px;}"
      "scrollbarvertical{width:10px;}scrollbarhorizontal{height:10px;}"
      "</style></head><body><div id='scroller'><div id='content'>"
      "<div id='item'/></div></div></body></rml>");
  assert(document);
  document->Show();
  context->Update();
  auto* scroller = document->GetElementById("scroller");
  auto* item = document->GetElementById("item");
  assert(scroller && item);

  std::array<Rml::Vector2f, 5> positions{};
  for (int alignment = 0; alignment < 5; ++alignment) {
    scroller->ScrollTo({0, 0}, Rml::ScrollBehavior::Instant);
    const auto mode = static_cast<Rml::ScrollAlignment>(alignment);
    item->ScrollIntoView({mode, mode});
    positions[alignment] = {scroller->GetScrollLeft(),
                            scroller->GetScrollTop()};
    assert(positions[alignment].x > 0 && positions[alignment].y > 0);
  }

  scroller->ScrollTo({0, 0}, Rml::ScrollBehavior::Instant);
  scroller->ScrollTo({50, 150}, Rml::ScrollBehavior::Smooth);
  assert(scroller->GetScrollTop() == 0);
  for (int frame = 0; frame < 120 && scroller->GetScrollTop() != 150; ++frame) {
    clock->elapsed += 1.0 / 60;
    context->Update();
  }
  assert(scroller->GetScrollLeft() == 50 && scroller->GetScrollTop() == 150);
  context->SetDefaultScrollBehavior(Rml::ScrollBehavior::Instant, 1);
  scroller->ScrollTo({20, 40}, Rml::ScrollBehavior::Auto);
  assert(scroller->GetScrollLeft() == 20 && scroller->GetScrollTop() == 40);

  document->Close();
  context->Update();
  assert(Rml::RemoveContext("scroll-reference"));
  return positions;
}

}  // namespace

int main(int argc, char** argv) {
  const bool json = argc == 2 && std::string_view(argv[1]) == "--json";
  BasicRenderer renderer;
  FixedClock clock;
  CaptureFonts fonts;
  Rml::SetRenderInterface(&renderer);
  Rml::SetSystemInterface(&clock);
  Rml::SetFontEngineInterface(&fonts);
  assert(Rml::Initialise());

  CheckLocalParsers(&fonts);
  const auto positions = CheckScroll(&clock);
  Rml::Shutdown();

  if (json) {
    PrintEnums();
    const Rml::ScrollIntoViewOptions defaults;
    std::cout << ",\"scrollDefaults\":[" << static_cast<int>(defaults.vertical)
              << "," << static_cast<int>(defaults.horizontal) << ","
              << static_cast<int>(defaults.behavior) << ","
              << static_cast<int>(defaults.parentage)
              << "],\"scrollPositions\":[";
    for (size_t i = 0; i < positions.size(); ++i) {
      std::cout << (i ? "," : "") << "[" << positions[i].x << ","
                << positions[i].y << "]";
    }
    std::cout << "]}\n";
  } else {
    std::cout << "PASS native-local-media-parser-all-fourteen-ids\n"
              << "PASS native-local-font-defaults-fields-and-source-order\n"
              << "PASS native-scroll-defaults-alignments-smooth-and-auto\n";
  }
}
