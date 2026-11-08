// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cstddef>
#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(PushFont) {
  cimgui::ImFont* font = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    font = ReadStruct<cimgui::ImFont>(info, 0);
    if (!font) return;
  }
  ::cimgui::ImGui_PushFont(font);
}

NAN_METHOD(PopFont) {
  ::cimgui::ImGui_PopFont();
}

NAN_METHOD(GetFont) {
  auto result = ::cimgui::ImGui_GetFont();
  ReturnStruct<cimgui::ImFont>(info, result);
}

NAN_METHOD(GetFontSize) {
  auto result = ::cimgui::ImGui_GetFontSize();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetFontTexUvWhitePixel) {
  auto result = ::cimgui::ImGui_GetFontTexUvWhitePixel();
  ReturnVec2(info, result);
}

NAN_METHOD(ImFontGlyphRangesBuilderClear) {
  cimgui::ImFontGlyphRangesBuilder* ranges_builder = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    ranges_builder = ReadStruct<cimgui::ImFontGlyphRangesBuilder>(info, 0);
    if (!ranges_builder) return;
  }
  ::cimgui::ImFontGlyphRangesBuilder_Clear(ranges_builder);
}

NAN_METHOD(ImFontGlyphRangesBuilderGetBit) {
  cimgui::ImFontGlyphRangesBuilder* ranges_builder = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    ranges_builder = ReadStruct<cimgui::ImFontGlyphRangesBuilder>(info, 0);
    if (!ranges_builder) return;
  }
  size_t codepoint = 0;
  if (!ReadSize(info, 1, &codepoint)) return;
  auto result =
      ::cimgui::ImFontGlyphRangesBuilder_GetBit(ranges_builder, codepoint);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ImFontGlyphRangesBuilderSetBit) {
  cimgui::ImFontGlyphRangesBuilder* ranges_builder = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    ranges_builder = ReadStruct<cimgui::ImFontGlyphRangesBuilder>(info, 0);
    if (!ranges_builder) return;
  }
  size_t codepoint = 0;
  if (!ReadSize(info, 1, &codepoint)) return;
  ::cimgui::ImFontGlyphRangesBuilder_SetBit(ranges_builder, codepoint);
}

NAN_METHOD(ImFontGlyphRangesBuilderAddChar) {
  cimgui::ImFontGlyphRangesBuilder* ranges_builder = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    ranges_builder = ReadStruct<cimgui::ImFontGlyphRangesBuilder>(info, 0);
    if (!ranges_builder) return;
  }
  ImWchar character = {};
  if (!ReadScalar(info, 1, &character)) return;
  ::cimgui::ImFontGlyphRangesBuilder_AddChar(ranges_builder, character);
}

NAN_METHOD(ImFontGlyphRangesBuilderAddText) {
  cimgui::ImFontGlyphRangesBuilder* ranges_builder = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    ranges_builder = ReadStruct<cimgui::ImFontGlyphRangesBuilder>(info, 0);
    if (!ranges_builder) return;
  }
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 1, 2, &text_range)) return;
  ::cimgui::ImFontGlyphRangesBuilder_AddText(
      ranges_builder, text_range.begin, text_range.end);
}

NAN_METHOD(ImFontGlyphRangesBuilderAddRanges) {
  cimgui::ImFontGlyphRangesBuilder* ranges_builder = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    ranges_builder = ReadStruct<cimgui::ImFontGlyphRangesBuilder>(info, 0);
    if (!ranges_builder) return;
  }
  ImWchar* ranges = ReadUint16Array(info, 1, 1);
  if (!ranges) return;
  ::cimgui::ImFontGlyphRangesBuilder_AddRanges(ranges_builder, ranges);
}

NAN_METHOD(ImFontAtlasAddFont) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  cimgui::ImFontConfig* font_config = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    font_config = ReadStruct<cimgui::ImFontConfig>(info, 1);
    if (!font_config) return;
  }
  auto result = ::cimgui::ImFontAtlas_AddFont(atlas, font_config);
  ReturnStruct<cimgui::ImFont>(info, result);
}

NAN_METHOD(ImFontAtlasAddFontDefault) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  cimgui::ImFontConfig* font_config = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    font_config = ReadStruct<cimgui::ImFontConfig>(info, 1);
    if (!font_config) return;
  }
  auto result = ::cimgui::ImFontAtlas_AddFontDefault(atlas, font_config);
  ReturnStruct<cimgui::ImFont>(info, result);
}

NAN_METHOD(ImFontAtlasAddFontFromFileTTF) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  std::string filename_utf8;
  const char* filename = nullptr;
  if (!ReadUtf8(info, 1, &filename_utf8, &filename, true)) return;
  float size_pixels = {};
  if (!ReadScalar(info, 2, &size_pixels)) return;
  cimgui::ImFontConfig* font_config = nullptr;
  if (!info[3]->IsUndefined() && !info[3]->IsNull()) {
    font_config = ReadStruct<cimgui::ImFontConfig>(info, 3);
    if (!font_config) return;
  }
  ImWchar* glyph_ranges = nullptr;
  if (!info[4]->IsUndefined() && !info[4]->IsNull()) {
    glyph_ranges = ReadUint16Array(info, 4, 1);
    if (!glyph_ranges) return;
  }
  auto result = ::cimgui::ImFontAtlas_AddFontFromFileTTF(
      atlas, filename, size_pixels, font_config, glyph_ranges);
  ReturnStruct<cimgui::ImFont>(info, result);
}

NAN_METHOD(ImFontAtlasAddFontFromMemoryTTF) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  void* font_data = nullptr;
  if (!ReadPointer(info, 1, &font_data)) return;
  int font_data_size = {};
  if (!ReadScalar(info, 2, &font_data_size)) return;
  float size_pixels = {};
  if (!ReadScalar(info, 3, &size_pixels)) return;
  cimgui::ImFontConfig* font_config = nullptr;
  if (!info[4]->IsUndefined() && !info[4]->IsNull()) {
    font_config = ReadStruct<cimgui::ImFontConfig>(info, 4);
    if (!font_config) return;
  }
  ImWchar* glyph_ranges = nullptr;
  if (!info[5]->IsUndefined() && !info[5]->IsNull()) {
    glyph_ranges = ReadUint16Array(info, 5, 1);
    if (!glyph_ranges) return;
  }
  auto result = ::cimgui::ImFontAtlas_AddFontFromMemoryTTF(
      atlas, font_data, font_data_size, size_pixels, font_config, glyph_ranges);
  ReturnStruct<cimgui::ImFont>(info, result);
}

NAN_METHOD(ImFontAtlasAddFontFromMemoryCompressedTTF) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  void* compressed_font_data = nullptr;
  if (!ReadPointer(info, 1, &compressed_font_data)) return;
  int compressed_font_data_size = {};
  if (!ReadScalar(info, 2, &compressed_font_data_size)) return;
  float size_pixels = {};
  if (!ReadScalar(info, 3, &size_pixels)) return;
  cimgui::ImFontConfig* font_config = nullptr;
  if (!info[4]->IsUndefined() && !info[4]->IsNull()) {
    font_config = ReadStruct<cimgui::ImFontConfig>(info, 4);
    if (!font_config) return;
  }
  ImWchar* glyph_ranges = nullptr;
  if (!info[5]->IsUndefined() && !info[5]->IsNull()) {
    glyph_ranges = ReadUint16Array(info, 5, 1);
    if (!glyph_ranges) return;
  }
  auto result = ::cimgui::ImFontAtlas_AddFontFromMemoryCompressedTTF(
      atlas,
      compressed_font_data,
      compressed_font_data_size,
      size_pixels,
      font_config,
      glyph_ranges);
  ReturnStruct<cimgui::ImFont>(info, result);
}

NAN_METHOD(ImFontAtlasAddFontFromMemoryCompressedBase85TTF) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  std::string compressed_font_data_base85_utf8;
  const char* compressed_font_data_base85 = nullptr;
  if (!ReadUtf8(info,
                1,
                &compressed_font_data_base85_utf8,
                &compressed_font_data_base85,
                true))
    return;
  float size_pixels = {};
  if (!ReadScalar(info, 2, &size_pixels)) return;
  cimgui::ImFontConfig* font_config = nullptr;
  if (!info[3]->IsUndefined() && !info[3]->IsNull()) {
    font_config = ReadStruct<cimgui::ImFontConfig>(info, 3);
    if (!font_config) return;
  }
  ImWchar* glyph_ranges = nullptr;
  if (!info[4]->IsUndefined() && !info[4]->IsNull()) {
    glyph_ranges = ReadUint16Array(info, 4, 1);
    if (!glyph_ranges) return;
  }
  auto result = ::cimgui::ImFontAtlas_AddFontFromMemoryCompressedBase85TTF(
      atlas,
      compressed_font_data_base85,
      size_pixels,
      font_config,
      glyph_ranges);
  ReturnStruct<cimgui::ImFont>(info, result);
}

NAN_METHOD(ImFontAtlasClearInputData) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  ::cimgui::ImFontAtlas_ClearInputData(atlas);
}

NAN_METHOD(ImFontAtlasClearFonts) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  ::cimgui::ImFontAtlas_ClearFonts(atlas);
}

NAN_METHOD(ImFontAtlasClearTexData) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  ::cimgui::ImFontAtlas_ClearTexData(atlas);
}

NAN_METHOD(ImFontAtlasClear) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  ::cimgui::ImFontAtlas_Clear(atlas);
}

NAN_METHOD(ImFontAtlasBuild) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  auto result = ::cimgui::ImFontAtlas_Build(atlas);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ImFontAtlasIsBuilt) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  auto result = ::cimgui::ImFontAtlas_IsBuilt(atlas);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ImFontAtlasSetTexID) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  ImTextureID id = 0;
  if (!ReadTextureId(info, 1, &id)) return;
  ::cimgui::ImFontAtlas_SetTexID(atlas, id);
}

NAN_METHOD(ImFontAtlasAddCustomRectRegular) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  int width = {};
  if (!ReadScalar(info, 1, &width)) return;
  int height = {};
  if (!ReadScalar(info, 2, &height)) return;
  auto result =
      ::cimgui::ImFontAtlas_AddCustomRectRegular(atlas, width, height);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(ImFontAtlasAddCustomRectFontGlyph) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  cimgui::ImFont* font = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    font = ReadStruct<cimgui::ImFont>(info, 1);
    if (!font) return;
  }
  ImWchar id = {};
  if (!ReadScalar(info, 2, &id)) return;
  int width = {};
  if (!ReadScalar(info, 3, &width)) return;
  int height = {};
  if (!ReadScalar(info, 4, &height)) return;
  float advance_x = {};
  if (!ReadScalar(info, 5, &advance_x)) return;
  cimgui::ImVec2 offset;
  if (!ReadImVec2(info, 6, &offset)) return;
  auto result = ::cimgui::ImFontAtlas_AddCustomRectFontGlyph(
      atlas, font, id, width, height, advance_x, offset);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(ImFontAtlasGetCustomRectByIndex) {
  cimgui::ImFontAtlas* atlas = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);
    if (!atlas) return;
  }
  int index = {};
  if (!ReadScalar(info, 1, &index)) return;
  auto result = ::cimgui::ImFontAtlas_GetCustomRectByIndex(atlas, index);
  ReturnStruct<cimgui::ImFontAtlasCustomRect>(info, result);
}

NAN_METHOD(ImFontFindGlyph) {
  cimgui::ImFont* font = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    font = ReadStruct<cimgui::ImFont>(info, 0);
    if (!font) return;
  }
  ImWchar character = {};
  if (!ReadScalar(info, 1, &character)) return;
  auto result = ::cimgui::ImFont_FindGlyph(font, character);
  ReturnStruct<cimgui::ImFontGlyph>(info, result);
}

NAN_METHOD(ImFontFindGlyphNoFallback) {
  cimgui::ImFont* font = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    font = ReadStruct<cimgui::ImFont>(info, 0);
    if (!font) return;
  }
  ImWchar character = {};
  if (!ReadScalar(info, 1, &character)) return;
  auto result = ::cimgui::ImFont_FindGlyphNoFallback(font, character);
  ReturnStruct<cimgui::ImFontGlyph>(info, result);
}

NAN_METHOD(ImFontGetCharAdvance) {
  cimgui::ImFont* font = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    font = ReadStruct<cimgui::ImFont>(info, 0);
    if (!font) return;
  }
  ImWchar character = {};
  if (!ReadScalar(info, 1, &character)) return;
  auto result = ::cimgui::ImFont_GetCharAdvance(font, character);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(ImFontIsLoaded) {
  cimgui::ImFont* font = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    font = ReadStruct<cimgui::ImFont>(info, 0);
    if (!font) return;
  }
  auto result = ::cimgui::ImFont_IsLoaded(font);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ImFontGetDebugName) {
  cimgui::ImFont* font = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    font = ReadStruct<cimgui::ImFont>(info, 0);
    if (!font) return;
  }
  auto result = ::cimgui::ImFont_GetDebugName(font);
  ReturnString(info, result);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiFont) {
  sfmljs::SetMethod<PushFont>(target, "PushFont");
  sfmljs::SetMethod<PopFont>(target, "PopFont");
  sfmljs::SetMethod<GetFont>(target, "GetFont");
  sfmljs::SetMethod<GetFontSize>(target, "GetFontSize");
  sfmljs::SetMethod<GetFontTexUvWhitePixel>(target, "GetFontTexUvWhitePixel");
  sfmljs::SetMethod<ImFontGlyphRangesBuilderClear>(
      target, "ImFontGlyphRangesBuilder_Clear");
  sfmljs::SetMethod<ImFontGlyphRangesBuilderGetBit>(
      target, "ImFontGlyphRangesBuilder_GetBit");
  sfmljs::SetMethod<ImFontGlyphRangesBuilderSetBit>(
      target, "ImFontGlyphRangesBuilder_SetBit");
  sfmljs::SetMethod<ImFontGlyphRangesBuilderAddChar>(
      target, "ImFontGlyphRangesBuilder_AddChar");
  sfmljs::SetMethod<ImFontGlyphRangesBuilderAddText>(
      target, "ImFontGlyphRangesBuilder_AddText");
  sfmljs::SetMethod<ImFontGlyphRangesBuilderAddRanges>(
      target, "ImFontGlyphRangesBuilder_AddRanges");
  sfmljs::SetMethod<ImFontAtlasAddFont>(target, "ImFontAtlas_AddFont");
  sfmljs::SetMethod<ImFontAtlasAddFontDefault>(target,
                                               "ImFontAtlas_AddFontDefault");
  sfmljs::SetMethod<ImFontAtlasAddFontFromFileTTF>(
      target, "ImFontAtlas_AddFontFromFileTTF");
  sfmljs::SetMethod<ImFontAtlasAddFontFromMemoryTTF>(
      target, "ImFontAtlas_AddFontFromMemoryTTF");
  sfmljs::SetMethod<ImFontAtlasAddFontFromMemoryCompressedTTF>(
      target, "ImFontAtlas_AddFontFromMemoryCompressedTTF");
  sfmljs::SetMethod<ImFontAtlasAddFontFromMemoryCompressedBase85TTF>(
      target, "ImFontAtlas_AddFontFromMemoryCompressedBase85TTF");
  sfmljs::SetMethod<ImFontAtlasClearInputData>(target,
                                               "ImFontAtlas_ClearInputData");
  sfmljs::SetMethod<ImFontAtlasClearFonts>(target, "ImFontAtlas_ClearFonts");
  sfmljs::SetMethod<ImFontAtlasClearTexData>(target,
                                             "ImFontAtlas_ClearTexData");
  sfmljs::SetMethod<ImFontAtlasClear>(target, "ImFontAtlas_Clear");
  sfmljs::SetMethod<ImFontAtlasBuild>(target, "ImFontAtlas_Build");
  sfmljs::SetMethod<ImFontAtlasIsBuilt>(target, "ImFontAtlas_IsBuilt");
  sfmljs::SetMethod<ImFontAtlasSetTexID>(target, "ImFontAtlas_SetTexID");
  sfmljs::SetMethod<ImFontAtlasAddCustomRectRegular>(
      target, "ImFontAtlas_AddCustomRectRegular");
  sfmljs::SetMethod<ImFontAtlasAddCustomRectFontGlyph>(
      target, "ImFontAtlas_AddCustomRectFontGlyph");
  sfmljs::SetMethod<ImFontAtlasGetCustomRectByIndex>(
      target, "ImFontAtlas_GetCustomRectByIndex");
  sfmljs::SetMethod<ImFontFindGlyph>(target, "ImFont_FindGlyph");
  sfmljs::SetMethod<ImFontFindGlyphNoFallback>(target,
                                               "ImFont_FindGlyphNoFallback");
  sfmljs::SetMethod<ImFontGetCharAdvance>(target, "ImFont_GetCharAdvance");
  sfmljs::SetMethod<ImFontIsLoaded>(target, "ImFont_IsLoaded");
  sfmljs::SetMethod<ImFontGetDebugName>(target, "ImFont_GetDebugName");
}

}  // namespace sfmlimgui
