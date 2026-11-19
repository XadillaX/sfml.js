// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_BACKENDS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_BACKENDS_H_

#include <RmlUi/Core/FontEngineInterface.h>

#include <memory>

namespace sfmlrmlui {

enum class FontEngineKind { kFreeType, kHarfBuzz, kBitmap, kCustom };

// Compile-time support describes the actual upstream implementation, including
// its intentionally limited bitmap matching and ignored shaping parameters.
struct FontBackendFeatures {
  bool compiled;
  bool memory_loading;
  bool effects;
  bool shaping;
  bool kerning_control;
  bool prior_character;
  bool letter_spacing;
  bool scalable;
  bool strict_family_matching;
};

const char* FontEngineName(FontEngineKind kind);
FontBackendFeatures FontBackendSupport(FontEngineKind kind);

// Providers are constructed without initializing their shared FreeType state.
std::unique_ptr<Rml::FontEngineInterface> CreateBuiltinFontEngine(
    FontEngineKind kind);

// Caller validates the engine kind, lifecycle and BCP47/ISO15924 inputs.
void RegisterFontLanguage(Rml::FontEngineInterface* engine,
                          const Rml::String& language,
                          const Rml::String& script,
                          bool right_to_left);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_BACKENDS_H_
