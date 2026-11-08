// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>
#include <sfml-js-interop.h>

#include <cstddef>
#include <cstdint>
#include <cstring>

#include "native/imgui-args.h"

namespace sfmlimgui {
namespace {

// ImGui owns these static arrays; the copy keeps JS free of dangling pointers.

void ReturnGlyphRanges(const CallbackInfo& info, const std::uint16_t* ranges) {
  std::size_t count = 0;
  while (ranges && ranges[count]) ++count;
  auto buffer =
      v8::ArrayBuffer::New(info.GetIsolate(), count * sizeof(std::uint16_t));
  if (count) {
    auto* data = static_cast<std::uint16_t*>(buffer->GetBackingStore()->Data());
    std::memcpy(data, ranges, count * sizeof(std::uint16_t));
  }
  info.GetReturnValue().Set(v8::Uint16Array::New(buffer, 0, count));
}

#define GLYPH_RANGES_METHOD(NAME, C_FUNCTION)                                  \
  NAN_METHOD(NAME) {                                                           \
    auto* atlas = ReadStruct<cimgui::ImFontAtlas>(info, 0);                    \
    if (!atlas) return;                                                        \
    ReturnGlyphRanges(info, C_FUNCTION(atlas));                                \
  }

GLYPH_RANGES_METHOD(GetGlyphRangesDefault,
                    cimgui::ImFontAtlas_GetGlyphRangesDefault)
GLYPH_RANGES_METHOD(GetGlyphRangesGreek,
                    cimgui::ImFontAtlas_GetGlyphRangesGreek)
GLYPH_RANGES_METHOD(GetGlyphRangesKorean,
                    cimgui::ImFontAtlas_GetGlyphRangesKorean)
GLYPH_RANGES_METHOD(GetGlyphRangesJapanese,
                    cimgui::ImFontAtlas_GetGlyphRangesJapanese)
GLYPH_RANGES_METHOD(GetGlyphRangesChineseFull,
                    cimgui::ImFontAtlas_GetGlyphRangesChineseFull)
GLYPH_RANGES_METHOD(GetGlyphRangesChineseSimplifiedCommon,
                    cimgui::ImFontAtlas_GetGlyphRangesChineseSimplifiedCommon)
GLYPH_RANGES_METHOD(GetGlyphRangesCyrillic,
                    cimgui::ImFontAtlas_GetGlyphRangesCyrillic)
GLYPH_RANGES_METHOD(GetGlyphRangesThai, cimgui::ImFontAtlas_GetGlyphRangesThai)
GLYPH_RANGES_METHOD(GetGlyphRangesVietnamese,
                    cimgui::ImFontAtlas_GetGlyphRangesVietnamese)

#undef GLYPH_RANGES_METHOD

}  // namespace

NAN_MODULE_INIT(InitializeImGuiFontRanges) {
  sfmljs::SetMethod<GetGlyphRangesDefault>(target, "getGlyphRangesDefault");
  sfmljs::SetMethod<GetGlyphRangesGreek>(target, "getGlyphRangesGreek");
  sfmljs::SetMethod<GetGlyphRangesKorean>(target, "getGlyphRangesKorean");
  sfmljs::SetMethod<GetGlyphRangesJapanese>(target, "getGlyphRangesJapanese");
  sfmljs::SetMethod<GetGlyphRangesChineseFull>(target,
                                               "getGlyphRangesChineseFull");
  sfmljs::SetMethod<GetGlyphRangesChineseSimplifiedCommon>(
      target, "getGlyphRangesChineseSimplifiedCommon");
  sfmljs::SetMethod<GetGlyphRangesCyrillic>(target, "getGlyphRangesCyrillic");
  sfmljs::SetMethod<GetGlyphRangesThai>(target, "getGlyphRangesThai");
  sfmljs::SetMethod<GetGlyphRangesVietnamese>(target,
                                              "getGlyphRangesVietnamese");
}
}  // namespace sfmlimgui
