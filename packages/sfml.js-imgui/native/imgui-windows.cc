// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(Begin) {
  std::string name_utf8;
  const char* name = nullptr;
  if (!ReadUtf8(info, 0, &name_utf8, &name, true)) return;
  bool* open = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    open = ReadBoolArray(info, 1, 1);
    if (!open) return;
  }
  ImGuiWindowFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_Begin(name, open, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(End) {
  ::cimgui::ImGui_End();
}

NAN_METHOD(BeginChild) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  ImGuiChildFlags child_flags = {};
  if (!ReadScalar(info, 2, &child_flags)) return;
  ImGuiWindowFlags window_flags = {};
  if (!ReadScalar(info, 3, &window_flags)) return;
  auto result =
      ::cimgui::ImGui_BeginChild(string_id, size, child_flags, window_flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginChildID) {
  ImGuiID id = {};
  if (!ReadScalar(info, 0, &id)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  ImGuiChildFlags child_flags = {};
  if (!ReadScalar(info, 2, &child_flags)) return;
  ImGuiWindowFlags window_flags = {};
  if (!ReadScalar(info, 3, &window_flags)) return;
  auto result =
      ::cimgui::ImGui_BeginChildID(id, size, child_flags, window_flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndChild) {
  ::cimgui::ImGui_EndChild();
}

NAN_METHOD(IsWindowAppearing) {
  auto result = ::cimgui::ImGui_IsWindowAppearing();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsWindowCollapsed) {
  auto result = ::cimgui::ImGui_IsWindowCollapsed();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsWindowFocused) {
  ImGuiFocusedFlags flags = {};
  if (!ReadScalar(info, 0, &flags)) return;
  auto result = ::cimgui::ImGui_IsWindowFocused(flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsWindowHovered) {
  ImGuiHoveredFlags flags = {};
  if (!ReadScalar(info, 0, &flags)) return;
  auto result = ::cimgui::ImGui_IsWindowHovered(flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(GetWindowDrawList) {
  auto result = ::cimgui::ImGui_GetWindowDrawList();
  ReturnStruct<cimgui::ImDrawList>(info, result);
}

NAN_METHOD(GetWindowPos) {
  auto result = ::cimgui::ImGui_GetWindowPos();
  ReturnVec2(info, result);
}

NAN_METHOD(GetWindowSize) {
  auto result = ::cimgui::ImGui_GetWindowSize();
  ReturnVec2(info, result);
}

NAN_METHOD(GetWindowWidth) {
  auto result = ::cimgui::ImGui_GetWindowWidth();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetWindowHeight) {
  auto result = ::cimgui::ImGui_GetWindowHeight();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(SetNextWindowPos) {
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 0, &position)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 1, &condition)) return;
  ::cimgui::ImGui_SetNextWindowPos(position, condition);
}

NAN_METHOD(SetNextWindowPosEx) {
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 0, &position)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 1, &condition)) return;
  cimgui::ImVec2 pivot;
  if (!ReadImVec2(info, 2, &pivot)) return;
  ::cimgui::ImGui_SetNextWindowPosEx(position, condition, pivot);
}

NAN_METHOD(SetNextWindowSize) {
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 0, &size)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 1, &condition)) return;
  ::cimgui::ImGui_SetNextWindowSize(size, condition);
}

NAN_METHOD(SetNextWindowSizeConstraints) {
  cimgui::ImVec2 size_min;
  if (!ReadImVec2(info, 0, &size_min)) return;
  cimgui::ImVec2 size_max;
  if (!ReadImVec2(info, 1, &size_max)) return;
  if (!info[2]->IsUndefined() && !info[2]->IsNull()) {
    Nan::ThrowTypeError("Function callbacks are not supported");
    return;
  }
  void* custom_callback_data = nullptr;
  if (!ReadPointer(info, 3, &custom_callback_data)) return;
  ::cimgui::ImGui_SetNextWindowSizeConstraints(
      size_min, size_max, nullptr, custom_callback_data);
}

NAN_METHOD(SetNextWindowContentSize) {
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 0, &size)) return;
  ::cimgui::ImGui_SetNextWindowContentSize(size);
}

NAN_METHOD(SetNextWindowCollapsed) {
  bool collapsed = false;
  if (!ReadBool(info, 0, &collapsed)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 1, &condition)) return;
  ::cimgui::ImGui_SetNextWindowCollapsed(collapsed, condition);
}

NAN_METHOD(SetNextWindowFocus) {
  ::cimgui::ImGui_SetNextWindowFocus();
}

NAN_METHOD(SetNextWindowScroll) {
  cimgui::ImVec2 scroll;
  if (!ReadImVec2(info, 0, &scroll)) return;
  ::cimgui::ImGui_SetNextWindowScroll(scroll);
}

NAN_METHOD(SetNextWindowBgAlpha) {
  float alpha = {};
  if (!ReadScalar(info, 0, &alpha)) return;
  ::cimgui::ImGui_SetNextWindowBgAlpha(alpha);
}

NAN_METHOD(SetWindowPos) {
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 0, &position)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 1, &condition)) return;
  ::cimgui::ImGui_SetWindowPos(position, condition);
}

NAN_METHOD(SetWindowSize) {
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 0, &size)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 1, &condition)) return;
  ::cimgui::ImGui_SetWindowSize(size, condition);
}

NAN_METHOD(SetWindowCollapsed) {
  bool collapsed = false;
  if (!ReadBool(info, 0, &collapsed)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 1, &condition)) return;
  ::cimgui::ImGui_SetWindowCollapsed(collapsed, condition);
}

NAN_METHOD(SetWindowFocus) {
  ::cimgui::ImGui_SetWindowFocus();
}

NAN_METHOD(SetWindowFontScale) {
  float scale = {};
  if (!ReadScalar(info, 0, &scale)) return;
  ::cimgui::ImGui_SetWindowFontScale(scale);
}

NAN_METHOD(SetWindowPosStr) {
  std::string name_utf8;
  const char* name = nullptr;
  if (!ReadUtf8(info, 0, &name_utf8, &name, true)) return;
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 1, &position)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 2, &condition)) return;
  ::cimgui::ImGui_SetWindowPosStr(name, position, condition);
}

NAN_METHOD(SetWindowSizeStr) {
  std::string name_utf8;
  const char* name = nullptr;
  if (!ReadUtf8(info, 0, &name_utf8, &name, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 2, &condition)) return;
  ::cimgui::ImGui_SetWindowSizeStr(name, size, condition);
}

NAN_METHOD(SetWindowCollapsedStr) {
  std::string name_utf8;
  const char* name = nullptr;
  if (!ReadUtf8(info, 0, &name_utf8, &name, true)) return;
  bool collapsed = false;
  if (!ReadBool(info, 1, &collapsed)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 2, &condition)) return;
  ::cimgui::ImGui_SetWindowCollapsedStr(name, collapsed, condition);
}

NAN_METHOD(SetWindowFocusStr) {
  std::string name_utf8;
  const char* name = nullptr;
  if (!ReadUtf8(info, 0, &name_utf8, &name, true)) return;
  ::cimgui::ImGui_SetWindowFocusStr(name);
}

NAN_METHOD(GetScrollX) {
  auto result = ::cimgui::ImGui_GetScrollX();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetScrollY) {
  auto result = ::cimgui::ImGui_GetScrollY();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(SetScrollX) {
  float scroll_x = {};
  if (!ReadScalar(info, 0, &scroll_x)) return;
  ::cimgui::ImGui_SetScrollX(scroll_x);
}

NAN_METHOD(SetScrollY) {
  float scroll_y = {};
  if (!ReadScalar(info, 0, &scroll_y)) return;
  ::cimgui::ImGui_SetScrollY(scroll_y);
}

NAN_METHOD(GetScrollMaxX) {
  auto result = ::cimgui::ImGui_GetScrollMaxX();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetScrollMaxY) {
  auto result = ::cimgui::ImGui_GetScrollMaxY();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(SetScrollHereX) {
  float center_x_ratio = {};
  if (!ReadScalar(info, 0, &center_x_ratio)) return;
  ::cimgui::ImGui_SetScrollHereX(center_x_ratio);
}

NAN_METHOD(SetScrollHereY) {
  float center_y_ratio = {};
  if (!ReadScalar(info, 0, &center_y_ratio)) return;
  ::cimgui::ImGui_SetScrollHereY(center_y_ratio);
}

NAN_METHOD(SetScrollFromPosX) {
  float local_x = {};
  if (!ReadScalar(info, 0, &local_x)) return;
  float center_x_ratio = {};
  if (!ReadScalar(info, 1, &center_x_ratio)) return;
  ::cimgui::ImGui_SetScrollFromPosX(local_x, center_x_ratio);
}

NAN_METHOD(SetScrollFromPosY) {
  float local_y = {};
  if (!ReadScalar(info, 0, &local_y)) return;
  float center_y_ratio = {};
  if (!ReadScalar(info, 1, &center_y_ratio)) return;
  ::cimgui::ImGui_SetScrollFromPosY(local_y, center_y_ratio);
}

NAN_METHOD(GetMainViewport) {
  auto result = ::cimgui::ImGui_GetMainViewport();
  ReturnStruct<cimgui::ImGuiViewport>(info, result);
}

NAN_METHOD(ViewportGetCenter) {
  cimgui::ImGuiViewport* viewport = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    viewport = ReadStruct<cimgui::ImGuiViewport>(info, 0);
    if (!viewport) return;
  }
  auto result = ::cimgui::ImGuiViewport_GetCenter(viewport);
  ReturnVec2(info, result);
}

NAN_METHOD(ViewportGetWorkCenter) {
  cimgui::ImGuiViewport* viewport = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    viewport = ReadStruct<cimgui::ImGuiViewport>(info, 0);
    if (!viewport) return;
  }
  auto result = ::cimgui::ImGuiViewport_GetWorkCenter(viewport);
  ReturnVec2(info, result);
}

NAN_METHOD(GetWindowContentRegionMin) {
  auto result = ::cimgui::ImGui_GetWindowContentRegionMin();
  ReturnVec2(info, result);
}

NAN_METHOD(GetWindowContentRegionMax) {
  auto result = ::cimgui::ImGui_GetWindowContentRegionMax();
  ReturnVec2(info, result);
}

NAN_METHOD(BeginChildFrame) {
  ImGuiID id = {};
  if (!ReadScalar(info, 0, &id)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  auto result = ::cimgui::ImGui_BeginChildFrame(id, size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginChildFrameEx) {
  ImGuiID id = {};
  if (!ReadScalar(info, 0, &id)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  ImGuiWindowFlags window_flags = {};
  if (!ReadScalar(info, 2, &window_flags)) return;
  auto result = ::cimgui::ImGui_BeginChildFrameEx(id, size, window_flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndChildFrame) {
  ::cimgui::ImGui_EndChildFrame();
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiWindows) {
  sfmljs::SetMethod<Begin>(target, "Begin");
  sfmljs::SetMethod<End>(target, "End");
  sfmljs::SetMethod<BeginChild>(target, "BeginChild");
  sfmljs::SetMethod<BeginChildID>(target, "BeginChildID");
  sfmljs::SetMethod<EndChild>(target, "EndChild");
  sfmljs::SetMethod<IsWindowAppearing>(target, "IsWindowAppearing");
  sfmljs::SetMethod<IsWindowCollapsed>(target, "IsWindowCollapsed");
  sfmljs::SetMethod<IsWindowFocused>(target, "IsWindowFocused");
  sfmljs::SetMethod<IsWindowHovered>(target, "IsWindowHovered");
  sfmljs::SetMethod<GetWindowDrawList>(target, "GetWindowDrawList");
  sfmljs::SetMethod<GetWindowPos>(target, "GetWindowPos");
  sfmljs::SetMethod<GetWindowSize>(target, "GetWindowSize");
  sfmljs::SetMethod<GetWindowWidth>(target, "GetWindowWidth");
  sfmljs::SetMethod<GetWindowHeight>(target, "GetWindowHeight");
  sfmljs::SetMethod<SetNextWindowPos>(target, "SetNextWindowPos");
  sfmljs::SetMethod<SetNextWindowPosEx>(target, "SetNextWindowPosEx");
  sfmljs::SetMethod<SetNextWindowSize>(target, "SetNextWindowSize");
  sfmljs::SetMethod<SetNextWindowSizeConstraints>(
      target, "SetNextWindowSizeConstraints");
  sfmljs::SetMethod<SetNextWindowContentSize>(target,
                                              "SetNextWindowContentSize");
  sfmljs::SetMethod<SetNextWindowCollapsed>(target, "SetNextWindowCollapsed");
  sfmljs::SetMethod<SetNextWindowFocus>(target, "SetNextWindowFocus");
  sfmljs::SetMethod<SetNextWindowScroll>(target, "SetNextWindowScroll");
  sfmljs::SetMethod<SetNextWindowBgAlpha>(target, "SetNextWindowBgAlpha");
  sfmljs::SetMethod<SetWindowPos>(target, "SetWindowPos");
  sfmljs::SetMethod<SetWindowSize>(target, "SetWindowSize");
  sfmljs::SetMethod<SetWindowCollapsed>(target, "SetWindowCollapsed");
  sfmljs::SetMethod<SetWindowFocus>(target, "SetWindowFocus");
  sfmljs::SetMethod<SetWindowFontScale>(target, "SetWindowFontScale");
  sfmljs::SetMethod<SetWindowPosStr>(target, "SetWindowPosStr");
  sfmljs::SetMethod<SetWindowSizeStr>(target, "SetWindowSizeStr");
  sfmljs::SetMethod<SetWindowCollapsedStr>(target, "SetWindowCollapsedStr");
  sfmljs::SetMethod<SetWindowFocusStr>(target, "SetWindowFocusStr");
  sfmljs::SetMethod<GetScrollX>(target, "GetScrollX");
  sfmljs::SetMethod<GetScrollY>(target, "GetScrollY");
  sfmljs::SetMethod<SetScrollX>(target, "SetScrollX");
  sfmljs::SetMethod<SetScrollY>(target, "SetScrollY");
  sfmljs::SetMethod<GetScrollMaxX>(target, "GetScrollMaxX");
  sfmljs::SetMethod<GetScrollMaxY>(target, "GetScrollMaxY");
  sfmljs::SetMethod<SetScrollHereX>(target, "SetScrollHereX");
  sfmljs::SetMethod<SetScrollHereY>(target, "SetScrollHereY");
  sfmljs::SetMethod<SetScrollFromPosX>(target, "SetScrollFromPosX");
  sfmljs::SetMethod<SetScrollFromPosY>(target, "SetScrollFromPosY");
  sfmljs::SetMethod<GetMainViewport>(target, "GetMainViewport");
  sfmljs::SetMethod<ViewportGetCenter>(target, "Viewport_GetCenter");
  sfmljs::SetMethod<ViewportGetWorkCenter>(target, "Viewport_GetWorkCenter");
  sfmljs::SetMethod<GetWindowContentRegionMin>(target,
                                               "GetWindowContentRegionMin");
  sfmljs::SetMethod<GetWindowContentRegionMax>(target,
                                               "GetWindowContentRegionMax");
  sfmljs::SetMethod<BeginChildFrame>(target, "BeginChildFrame");
  sfmljs::SetMethod<BeginChildFrameEx>(target, "BeginChildFrameEx");
  sfmljs::SetMethod<EndChildFrame>(target, "EndChildFrame");
}

}  // namespace sfmlimgui
