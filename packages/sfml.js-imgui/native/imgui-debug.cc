// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cstddef>
#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(ShowDemoWindow) {
  bool* open = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    open = ReadBoolArray(info, 0, 1);
    if (!open) return;
  }
  ::cimgui::ImGui_ShowDemoWindow(open);
}

NAN_METHOD(ShowMetricsWindow) {
  bool* open = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    open = ReadBoolArray(info, 0, 1);
    if (!open) return;
  }
  ::cimgui::ImGui_ShowMetricsWindow(open);
}

NAN_METHOD(ShowDebugLogWindow) {
  bool* open = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    open = ReadBoolArray(info, 0, 1);
    if (!open) return;
  }
  ::cimgui::ImGui_ShowDebugLogWindow(open);
}

NAN_METHOD(ShowIDStackToolWindow) {
  ::cimgui::ImGui_ShowIDStackToolWindow();
}

NAN_METHOD(ShowIDStackToolWindowEx) {
  bool* open = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    open = ReadBoolArray(info, 0, 1);
    if (!open) return;
  }
  ::cimgui::ImGui_ShowIDStackToolWindowEx(open);
}

NAN_METHOD(ShowAboutWindow) {
  bool* open = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    open = ReadBoolArray(info, 0, 1);
    if (!open) return;
  }
  ::cimgui::ImGui_ShowAboutWindow(open);
}

NAN_METHOD(ShowStyleEditor) {
  cimgui::ImGuiStyle* reference = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    reference = ReadStruct<cimgui::ImGuiStyle>(info, 0);
    if (!reference) return;
  }
  ::cimgui::ImGui_ShowStyleEditor(reference);
}

NAN_METHOD(ShowStyleSelector) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  auto result = ::cimgui::ImGui_ShowStyleSelector(label);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ShowFontSelector) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ::cimgui::ImGui_ShowFontSelector(label);
}

NAN_METHOD(ShowUserGuide) {
  ::cimgui::ImGui_ShowUserGuide();
}

NAN_METHOD(DebugTextEncoding) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_DebugTextEncoding(text);
}

NAN_METHOD(DebugFlashStyleColor) {
  ImGuiCol index = {};
  if (!ReadScalar(info, 0, &index)) return;
  ::cimgui::ImGui_DebugFlashStyleColor(index);
}

NAN_METHOD(DebugStartItemPicker) {
  ::cimgui::ImGui_DebugStartItemPicker();
}

NAN_METHOD(DebugCheckVersionAndDataLayout) {
  std::string version_utf8;
  const char* version = nullptr;
  if (!ReadUtf8(info, 0, &version_utf8, &version, true)) return;
  size_t io_size = 0;
  if (!ReadSize(info, 1, &io_size)) return;
  size_t style_size = 0;
  if (!ReadSize(info, 2, &style_size)) return;
  size_t vec2_size = 0;
  if (!ReadSize(info, 3, &vec2_size)) return;
  size_t vec4_size = 0;
  if (!ReadSize(info, 4, &vec4_size)) return;
  size_t draw_vertex_size = 0;
  if (!ReadSize(info, 5, &draw_vertex_size)) return;
  size_t draw_index_size = 0;
  if (!ReadSize(info, 6, &draw_index_size)) return;
  auto result = ::cimgui::ImGui_DebugCheckVersionAndDataLayout(version,
                                                               io_size,
                                                               style_size,
                                                               vec2_size,
                                                               vec4_size,
                                                               draw_vertex_size,
                                                               draw_index_size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DebugLogUnformatted) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_DebugLogUnformatted(text);
}

NAN_METHOD(ShowStackToolWindow) {
  bool* open = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    open = ReadBoolArray(info, 0, 1);
    if (!open) return;
  }
  ::cimgui::ImGui_ShowStackToolWindow(open);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiDebug) {
  sfmljs::SetMethod<ShowDemoWindow>(target, "ShowDemoWindow");
  sfmljs::SetMethod<ShowMetricsWindow>(target, "ShowMetricsWindow");
  sfmljs::SetMethod<ShowDebugLogWindow>(target, "ShowDebugLogWindow");
  sfmljs::SetMethod<ShowIDStackToolWindow>(target, "ShowIDStackToolWindow");
  sfmljs::SetMethod<ShowIDStackToolWindowEx>(target, "ShowIDStackToolWindowEx");
  sfmljs::SetMethod<ShowAboutWindow>(target, "ShowAboutWindow");
  sfmljs::SetMethod<ShowStyleEditor>(target, "ShowStyleEditor");
  sfmljs::SetMethod<ShowStyleSelector>(target, "ShowStyleSelector");
  sfmljs::SetMethod<ShowFontSelector>(target, "ShowFontSelector");
  sfmljs::SetMethod<ShowUserGuide>(target, "ShowUserGuide");
  sfmljs::SetMethod<DebugTextEncoding>(target, "DebugTextEncoding");
  sfmljs::SetMethod<DebugFlashStyleColor>(target, "DebugFlashStyleColor");
  sfmljs::SetMethod<DebugStartItemPicker>(target, "DebugStartItemPicker");
  sfmljs::SetMethod<DebugCheckVersionAndDataLayout>(
      target, "DebugCheckVersionAndDataLayout");
  sfmljs::SetMethod<DebugLogUnformatted>(target, "DebugLogUnformatted");
  sfmljs::SetMethod<ShowStackToolWindow>(target, "ShowStackToolWindow");
}

}  // namespace sfmlimgui
