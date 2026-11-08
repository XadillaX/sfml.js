// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(TextUnformatted) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_TextUnformatted(text);
}

NAN_METHOD(TextUnformattedEx) {
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 0, 1, &text_range)) return;
  ::cimgui::ImGui_TextUnformattedEx(text_range.begin, text_range.end);
}

NAN_METHOD(TextColoredUnformatted) {
  cimgui::ImVec4 color;
  if (!ReadImVec4(info, 0, &color)) return;
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 1, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_TextColoredUnformatted(color, text);
}

NAN_METHOD(TextDisabledUnformatted) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_TextDisabledUnformatted(text);
}

NAN_METHOD(TextWrappedUnformatted) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_TextWrappedUnformatted(text);
}

NAN_METHOD(LabelTextUnformatted) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 1, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_LabelTextUnformatted(label, text);
}

NAN_METHOD(BulletTextUnformatted) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_BulletTextUnformatted(text);
}

NAN_METHOD(SeparatorText) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ::cimgui::ImGui_SeparatorText(label);
}

NAN_METHOD(CalcTextSize) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  auto result = ::cimgui::ImGui_CalcTextSize(text);
  ReturnVec2(info, result);
}

NAN_METHOD(CalcTextSizeEx) {
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 0, 1, &text_range)) return;
  bool hide_text_after_double_hash = false;
  if (!ReadBool(info, 2, &hide_text_after_double_hash)) return;
  float wrap_width = {};
  if (!ReadScalar(info, 3, &wrap_width)) return;
  if (hide_text_after_double_hash && text_range.end) {
    // Upstream FindRenderedTextEnd looks one byte beyond a trailing '#'.
    const char* cursor = text_range.begin;
    while (cursor < text_range.end && *cursor != '\0') {
      if (text_range.end - cursor >= 2 && cursor[0] == '#' &&
          cursor[1] == '#') {
        break;
      }
      ++cursor;
    }
    text_range.end = cursor;
    hide_text_after_double_hash = false;
  }
  auto result = ::cimgui::ImGui_CalcTextSizeEx(text_range.begin,
                                               text_range.end,
                                               hide_text_after_double_hash,
                                               wrap_width);
  ReturnVec2(info, result);
}

NAN_METHOD(TextFilterDraw) {
  cimgui::ImGuiTextFilter* filter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    filter = ReadStruct<cimgui::ImGuiTextFilter>(info, 0);
    if (!filter) return;
  }
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 1, &label_utf8, &label, true)) return;
  float width = {};
  if (!ReadScalar(info, 2, &width)) return;
  auto result = ::cimgui::ImGuiTextFilter_Draw(filter, label, width);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TextFilterPassFilter) {
  cimgui::ImGuiTextFilter* filter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    filter = ReadStruct<cimgui::ImGuiTextFilter>(info, 0);
    if (!filter) return;
  }
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 1, 2, &text_range)) return;
  if (text_range.end) {
    // ImStristr bounds its outer scan but not a candidate's inner comparison.
    // A terminator at the selected end prevents matches and reads beyond it.
    text_range.storage.assign(text_range.begin, text_range.end);
    text_range.begin = text_range.storage.c_str();
    text_range.end = text_range.begin + text_range.storage.size();
  }
  auto result = ::cimgui::ImGuiTextFilter_PassFilter(
      filter, text_range.begin, text_range.end);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TextFilterBuild) {
  cimgui::ImGuiTextFilter* filter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    filter = ReadStruct<cimgui::ImGuiTextFilter>(info, 0);
    if (!filter) return;
  }
  ::cimgui::ImGuiTextFilter_Build(filter);
}

NAN_METHOD(TextFilterClear) {
  cimgui::ImGuiTextFilter* filter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    filter = ReadStruct<cimgui::ImGuiTextFilter>(info, 0);
    if (!filter) return;
  }
  ::cimgui::ImGuiTextFilter_Clear(filter);
}

NAN_METHOD(TextFilterIsActive) {
  cimgui::ImGuiTextFilter* filter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    filter = ReadStruct<cimgui::ImGuiTextFilter>(info, 0);
    if (!filter) return;
  }
  auto result = ::cimgui::ImGuiTextFilter_IsActive(filter);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TextBufferBegin) {
  cimgui::ImGuiTextBuffer* buffer = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
    if (!buffer) return;
  }
  auto result = ::cimgui::ImGuiTextBuffer_begin(buffer);
  ReturnString(info, result);
}

NAN_METHOD(TextBufferEnd) {
  cimgui::ImGuiTextBuffer* buffer = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
    if (!buffer) return;
  }
  auto result = ::cimgui::ImGuiTextBuffer_end(buffer);
  ReturnString(info, result);
}

NAN_METHOD(TextBufferSize) {
  cimgui::ImGuiTextBuffer* buffer = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
    if (!buffer) return;
  }
  auto result = ::cimgui::ImGuiTextBuffer_size(buffer);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(TextBufferEmpty) {
  cimgui::ImGuiTextBuffer* buffer = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
    if (!buffer) return;
  }
  auto result = ::cimgui::ImGuiTextBuffer_empty(buffer);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TextBufferClear) {
  cimgui::ImGuiTextBuffer* buffer = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
    if (!buffer) return;
  }
  ::cimgui::ImGuiTextBuffer_clear(buffer);
}

NAN_METHOD(TextBufferResize) {
  cimgui::ImGuiTextBuffer* buffer = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
    if (!buffer) return;
  }
  int size = {};
  if (!ReadScalar(info, 1, &size)) return;
  ::cimgui::ImGuiTextBuffer_resize(buffer, size);
}

NAN_METHOD(TextBufferReserve) {
  cimgui::ImGuiTextBuffer* buffer = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
    if (!buffer) return;
  }
  int capacity = {};
  if (!ReadScalar(info, 1, &capacity)) return;
  ::cimgui::ImGuiTextBuffer_reserve(buffer, capacity);
}

NAN_METHOD(TextBufferCStr) {
  cimgui::ImGuiTextBuffer* buffer = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
    if (!buffer) return;
  }
  auto result = ::cimgui::ImGuiTextBuffer_c_str(buffer);
  ReturnString(info, result);
}

NAN_METHOD(TextBufferAppend) {
  cimgui::ImGuiTextBuffer* buffer = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    buffer = ReadStruct<cimgui::ImGuiTextBuffer>(info, 0);
    if (!buffer) return;
  }
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 1, 2, &text_range)) return;
  ::cimgui::ImGuiTextBuffer_append(buffer, text_range.begin, text_range.end);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiText) {
  sfmljs::SetMethod<TextUnformatted>(target, "TextUnformatted");
  sfmljs::SetMethod<TextUnformattedEx>(target, "TextUnformattedEx");
  sfmljs::SetMethod<TextColoredUnformatted>(target, "TextColoredUnformatted");
  sfmljs::SetMethod<TextDisabledUnformatted>(target, "TextDisabledUnformatted");
  sfmljs::SetMethod<TextWrappedUnformatted>(target, "TextWrappedUnformatted");
  sfmljs::SetMethod<LabelTextUnformatted>(target, "LabelTextUnformatted");
  sfmljs::SetMethod<BulletTextUnformatted>(target, "BulletTextUnformatted");
  sfmljs::SetMethod<SeparatorText>(target, "SeparatorText");
  sfmljs::SetMethod<CalcTextSize>(target, "CalcTextSize");
  sfmljs::SetMethod<CalcTextSizeEx>(target, "CalcTextSizeEx");
  sfmljs::SetMethod<TextFilterDraw>(target, "TextFilter_Draw");
  sfmljs::SetMethod<TextFilterPassFilter>(target, "TextFilter_PassFilter");
  sfmljs::SetMethod<TextFilterBuild>(target, "TextFilter_Build");
  sfmljs::SetMethod<TextFilterClear>(target, "TextFilter_Clear");
  sfmljs::SetMethod<TextFilterIsActive>(target, "TextFilter_IsActive");
  sfmljs::SetMethod<TextBufferBegin>(target, "TextBuffer_begin");
  sfmljs::SetMethod<TextBufferEnd>(target, "TextBuffer_end");
  sfmljs::SetMethod<TextBufferSize>(target, "TextBuffer_size");
  sfmljs::SetMethod<TextBufferEmpty>(target, "TextBuffer_empty");
  sfmljs::SetMethod<TextBufferClear>(target, "TextBuffer_clear");
  sfmljs::SetMethod<TextBufferResize>(target, "TextBuffer_resize");
  sfmljs::SetMethod<TextBufferReserve>(target, "TextBuffer_reserve");
  sfmljs::SetMethod<TextBufferCStr>(target, "TextBuffer_c_str");
  sfmljs::SetMethod<TextBufferAppend>(target, "TextBuffer_append");
}

}  // namespace sfmlimgui
