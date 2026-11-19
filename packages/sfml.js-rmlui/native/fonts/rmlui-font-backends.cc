// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/fonts/rmlui-font-backends.h"

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/FileInterface.h>

#include <memory>
#include <utility>
#include <vector>

#include "third_party/rmlui/Source/Core/FontEngineDefault/FontEngineInterfaceDefault.h"

#if SFML_RMLUI_HARFBUZZ
#include "third_party/rmlui/Samples/basic/harfbuzz/src/FontEngineInterfaceHarfBuzz.h"
#endif

#if SFML_RMLUI_BITMAP_FONT
#include "third_party/rmlui/Samples/basic/bitmap_font/src/FontEngineInterfaceBitmap.h"
#endif

namespace sfmlrmlui {
namespace {

#if SFML_RMLUI_HARFBUZZ
// The upstream sample lacks the named-file virtual. This adapter routes that
// overload through the active file interface and retains bytes through Core's
// shutdown, including a partially successful font collection load.
class HarfBuzzFontEngine final : public FontEngineInterfaceHarfBuzz {
 public:
  using FontEngineInterfaceHarfBuzz::LoadFontFace;

  bool LoadFontFace(const Rml::String& path,
                    int face_index,
                    const Rml::String& family,
                    Rml::Style::FontStyle style,
                    Rml::Style::FontWeight weight,
                    bool fallback) override {
    auto* interface = Rml::GetFileInterface();
    const auto handle = interface->Open(path);
    if (!handle) {
      return false;
    }
    struct FileLease {
      Rml::FileInterface* interface;
      Rml::FileHandle handle;
      ~FileLease() { interface->Close(handle); }
    } lease{interface, handle};

    const size_t length = interface->Length(handle);
    if (!length) {
      return false;
    }
    std::vector<Rml::byte> data(length);
    if (interface->Read(data.data(), length, handle) != length) {
      return false;
    }
    auto& stored = file_data_.emplace_back(std::move(data));
    return FontEngineInterfaceHarfBuzz::LoadFontFace(
        {stored.data(), stored.size()},
        face_index,
        family,
        style,
        weight,
        fallback);
  }

  void Shutdown() override {
    FontEngineInterfaceHarfBuzz::Shutdown();
    file_data_.clear();
  }

 private:
  std::vector<std::vector<Rml::byte>> file_data_;
};
#endif

}  // namespace

const char* FontEngineName(FontEngineKind kind) {
  switch (kind) {
    case FontEngineKind::kFreeType:
      return "freetype";
    case FontEngineKind::kHarfBuzz:
      return "harfbuzz";
    case FontEngineKind::kBitmap:
      return "bitmap";
    case FontEngineKind::kCustom:
      return "custom";
  }
  return nullptr;
}

FontBackendFeatures FontBackendSupport(FontEngineKind kind) {
  switch (kind) {
    case FontEngineKind::kFreeType:
      return {.compiled = true,
              .memory_loading = true,
              .effects = true,
              .shaping = false,
              .kerning_control = true,
              .prior_character = true,
              .letter_spacing = true,
              .scalable = true,
              .strict_family_matching = true};
    case FontEngineKind::kHarfBuzz:
      return {.compiled = SFML_RMLUI_HARFBUZZ != 0,
              .memory_loading = true,
              .effects = true,
              .shaping = true,
              .kerning_control = true,
              .prior_character = false,
              .letter_spacing = true,
              .scalable = true,
              .strict_family_matching = true};
    case FontEngineKind::kBitmap:
      return {.compiled = SFML_RMLUI_BITMAP_FONT != 0,
              .memory_loading = false,
              .effects = false,
              .shaping = false,
              .kerning_control = false,
              .prior_character = true,
              .letter_spacing = false,
              .scalable = false,
              .strict_family_matching = false};
    case FontEngineKind::kCustom:
      return {};
  }
  return {};
}

std::unique_ptr<Rml::FontEngineInterface> CreateBuiltinFontEngine(
    FontEngineKind kind) {
  switch (kind) {
    case FontEngineKind::kFreeType:
      return std::make_unique<Rml::FontEngineInterfaceDefault>();
    case FontEngineKind::kHarfBuzz:
#if SFML_RMLUI_HARFBUZZ
      return std::make_unique<HarfBuzzFontEngine>();
#else
      return {};
#endif
    case FontEngineKind::kBitmap:
#if SFML_RMLUI_BITMAP_FONT
      return std::make_unique<FontEngineInterfaceBitmap>();
#else
      return {};
#endif
    case FontEngineKind::kCustom:
      return {};
  }
  return {};
}

void RegisterFontLanguage(Rml::FontEngineInterface* engine,
                          const Rml::String& language,
                          const Rml::String& script,
                          bool right_to_left) {
#if SFML_RMLUI_HARFBUZZ
  static_cast<FontEngineInterfaceHarfBuzz*>(engine)->RegisterLanguage(
      language,
      script,
      right_to_left ? TextFlowDirection::RightToLeft
                    : TextFlowDirection::LeftToRight);
#else
  static_cast<void>(engine);
  static_cast<void>(language);
  static_cast<void>(script);
  static_cast<void>(right_to_left);
#endif
}

}  // namespace sfmlrmlui
