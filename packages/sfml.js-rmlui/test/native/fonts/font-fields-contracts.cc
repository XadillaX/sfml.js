// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/FontMetrics.h>
#include <RmlUi/Core/StringUtilities.h>
#include <RmlUi/Core/TextShapingContext.h>

#include <array>
#include <cassert>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <iterator>
#include <limits>
#include <string_view>
#include <type_traits>

#include "vendor/rmlui/Source/Core/FontEngineDefault/FontEngineInterfaceDefault.h"

namespace {

struct FaceReference {
  Rml::FontMetrics metrics;
  std::array<int, 27> widths{};
};

void CheckDefaults() {
  const Rml::String language = "ja";
  const Rml::TextShapingContext shaping{language};
  static_assert(std::is_same_v<decltype(shaping.language), const Rml::String&>);
  static_assert(std::is_same_v<decltype(Rml::FontMetrics::size), int>);
  static_assert(std::is_same_v<decltype(Rml::FontMetrics::has_ellipsis), bool>);

  assert(&shaping.language == &language);
  assert(shaping.text_direction == Rml::Style::Direction::Auto);
  assert(shaping.font_kerning == Rml::Style::FontKerning::Auto);
  assert(shaping.letter_spacing == 0);
}

FaceReference Measure(Rml::FontEngineInterfaceDefault* engine, int size) {
  const auto face = engine->GetFontFaceHandle("field-reference",
                                              Rml::Style::FontStyle::Normal,
                                              Rml::Style::FontWeight::Normal,
                                              size);
  assert(face);

  FaceReference reference{engine->GetFontMetrics(face)};
  assert(reference.metrics.size == size);
  assert(reference.metrics.ascent > 0);
  assert(reference.metrics.descent >= 0);
  assert(reference.metrics.line_spacing > 0);
  assert(reference.metrics.x_height > 0);
  assert(reference.metrics.underline_thickness > 0);

  const Rml::String language = "en";
  const Rml::String text = "AVATAR";
  size_t index = 0;
  for (int direction = 0; direction < 3; ++direction) {
    for (int kerning = 0; kerning < 3; ++kerning) {
      for (const float spacing : {0.f, 2.75f, -1.25f}) {
        const Rml::TextShapingContext shaping{
            language,
            static_cast<Rml::Style::Direction>(direction),
            static_cast<Rml::Style::FontKerning>(kerning),
            spacing};
        reference.widths[index++] =
            engine->GetStringWidth(face, text, shaping, Rml::Character(65));
      }
    }
  }
  assert(index == reference.widths.size());
  assert(reference.widths[1] == reference.widths[0] + 12);
  assert(reference.widths[2] == reference.widths[0] - 6);
  assert(reference.widths[0] == reference.widths[3]);
  assert(reference.widths[6] > reference.widths[0]);
  assert(reference.widths[0] == reference.widths[9]);
  assert(reference.widths[0] == reference.widths[18]);
  return reference;
}

void PrintReference(const std::array<FaceReference, 2>& references) {
  std::cout << std::setprecision(std::numeric_limits<float>::max_digits10);
  std::cout << "[";
  for (size_t i = 0; i < references.size(); ++i) {
    const auto& reference = references[i];
    const auto& metrics = reference.metrics;
    std::cout << (i ? ",{" : "{") << "\"size\":" << metrics.size
              << ",\"values\":[" << metrics.ascent << "," << metrics.descent
              << "," << metrics.line_spacing << "," << metrics.x_height << ","
              << metrics.underline_position << ","
              << metrics.underline_thickness << "],\"hasEllipsis\":"
              << (metrics.has_ellipsis ? "true" : "false") << ",\"widths\":[";
    for (size_t j = 0; j < reference.widths.size(); ++j) {
      std::cout << (j ? "," : "") << reference.widths[j];
    }
    std::cout << "]}";
  }
  std::cout << "]\n";
}

}  // namespace

int main(int argc, char** argv) {
  assert(argc == 2 || argc == 3);
  const bool json = argc == 3 && std::string_view(argv[2]) == "--json";
  CheckDefaults();

  std::ifstream stream(argv[1], std::ios::binary);
  assert(stream);
  const Rml::Vector<Rml::byte> bytes{std::istreambuf_iterator<char>(stream),
                                     {}};
  assert(!bytes.empty());

  Rml::FontEngineInterfaceDefault engine;
  engine.Initialize();
  assert(engine.LoadFontFace(
      Rml::Span<const Rml::byte>(bytes.data(), bytes.size()),
      0,
      "field-reference",
      Rml::Style::FontStyle::Normal,
      Rml::Style::FontWeight::Normal,
      false));
  const std::array<FaceReference, 2> references{Measure(&engine, 20),
                                                Measure(&engine, 31)};
  engine.Shutdown();

  if (json) {
    PrintReference(references);
  } else {
    std::cout << "PASS native-shaping-field-defaults\n"
              << "PASS native-font-all-metric-fields\n"
              << "PASS native-font-kerning-spacing-direction-widths\n";
  }
}
