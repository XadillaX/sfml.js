// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_GLYPH_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_GLYPH_H_

#include <RmlUi/Core/FontGlyph.h>
#include <nan.h>

#include <cstddef>
#include <memory>

namespace sfmlrmlui {

// A validated RGBA view. The backing store remains alive for the native call.
// Resolve after every user accessor, before touching its bytes.
struct GlyphDestination {
  std::shared_ptr<v8::BackingStore> backing;
  Rml::byte* data{nullptr};
  Rml::Vector2i dimensions;
  int stride{0};
  size_t size{0};
};

bool ReadGlyphDestination(v8::Local<v8::Value> view,
                          v8::Local<v8::Value> dimensions,
                          v8::Local<v8::Value> stride,
                          GlyphDestination* result);

// Call after every JS accessor, with no subsequent JS calls before using data.
const Rml::FontGlyph* FontGlyphOf(v8::Local<v8::Value> handle,
                                  bool require_bitmap);
bool ReadGlyphVector(v8::Local<v8::Value> input, Rml::Vector2i* result);
bool ValidateGlyphDimensions(Rml::Vector2i dimensions);
v8::Local<v8::Object> GlyphVectorToJs(Rml::Vector2i value);
// Snapshot a validated JS glyph before callbacks can change its allocation.
bool SnapshotFontGlyph(v8::Local<v8::Value> handle, Rml::FontGlyph* result);
// Native engine glyphs own valid bitmap storage; the JS copy never borrows it.
v8::Local<v8::Object> WrapFontGlyphSnapshot(const Rml::FontGlyph& glyph);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_GLYPH_H_
