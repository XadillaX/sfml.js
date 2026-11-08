// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(BeginMenuBar) {
  auto result = ::cimgui::ImGui_BeginMenuBar();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndMenuBar) {
  ::cimgui::ImGui_EndMenuBar();
}

NAN_METHOD(BeginMainMenuBar) {
  auto result = ::cimgui::ImGui_BeginMainMenuBar();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndMainMenuBar) {
  ::cimgui::ImGui_EndMainMenuBar();
}

NAN_METHOD(BeginMenu) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  auto result = ::cimgui::ImGui_BeginMenu(label);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginMenuEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  bool enabled = false;
  if (!ReadBool(info, 1, &enabled)) return;
  auto result = ::cimgui::ImGui_BeginMenuEx(label, enabled);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndMenu) {
  ::cimgui::ImGui_EndMenu();
}

NAN_METHOD(MenuItem) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  auto result = ::cimgui::ImGui_MenuItem(label);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(MenuItemEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  std::string shortcut_utf8;
  const char* shortcut = nullptr;
  if (!ReadUtf8(info, 1, &shortcut_utf8, &shortcut, true)) return;
  bool selected = false;
  if (!ReadBool(info, 2, &selected)) return;
  bool enabled = false;
  if (!ReadBool(info, 3, &enabled)) return;
  auto result = ::cimgui::ImGui_MenuItemEx(label, shortcut, selected, enabled);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(MenuItemBoolPtr) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  std::string shortcut_utf8;
  const char* shortcut = nullptr;
  if (!ReadUtf8(info, 1, &shortcut_utf8, &shortcut, true)) return;
  bool* selected = ReadBoolArray(info, 2, 1);
  if (!selected) return;
  bool enabled = false;
  if (!ReadBool(info, 3, &enabled)) return;
  auto result =
      ::cimgui::ImGui_MenuItemBoolPtr(label, shortcut, selected, enabled);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginTooltip) {
  auto result = ::cimgui::ImGui_BeginTooltip();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndTooltip) {
  ::cimgui::ImGui_EndTooltip();
}

NAN_METHOD(SetTooltipUnformatted) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_SetTooltipUnformatted(text);
}

NAN_METHOD(BeginItemTooltip) {
  auto result = ::cimgui::ImGui_BeginItemTooltip();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SetItemTooltipUnformatted) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_SetItemTooltipUnformatted(text);
}

NAN_METHOD(BeginPopup) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiWindowFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  auto result = ::cimgui::ImGui_BeginPopup(string_id, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginPopupModal) {
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
  auto result = ::cimgui::ImGui_BeginPopupModal(name, open, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndPopup) {
  ::cimgui::ImGui_EndPopup();
}

NAN_METHOD(OpenPopup) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiPopupFlags popup_flags = {};
  if (!ReadScalar(info, 1, &popup_flags)) return;
  ::cimgui::ImGui_OpenPopup(string_id, popup_flags);
}

NAN_METHOD(OpenPopupID) {
  ImGuiID id = {};
  if (!ReadScalar(info, 0, &id)) return;
  ImGuiPopupFlags popup_flags = {};
  if (!ReadScalar(info, 1, &popup_flags)) return;
  ::cimgui::ImGui_OpenPopupID(id, popup_flags);
}

NAN_METHOD(OpenPopupOnItemClick) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiPopupFlags popup_flags = {};
  if (!ReadScalar(info, 1, &popup_flags)) return;
  ::cimgui::ImGui_OpenPopupOnItemClick(string_id, popup_flags);
}

NAN_METHOD(CloseCurrentPopup) {
  ::cimgui::ImGui_CloseCurrentPopup();
}

NAN_METHOD(BeginPopupContextItem) {
  auto result = ::cimgui::ImGui_BeginPopupContextItem();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginPopupContextItemEx) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiPopupFlags popup_flags = {};
  if (!ReadScalar(info, 1, &popup_flags)) return;
  auto result = ::cimgui::ImGui_BeginPopupContextItemEx(string_id, popup_flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginPopupContextWindow) {
  auto result = ::cimgui::ImGui_BeginPopupContextWindow();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginPopupContextWindowEx) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiPopupFlags popup_flags = {};
  if (!ReadScalar(info, 1, &popup_flags)) return;
  auto result =
      ::cimgui::ImGui_BeginPopupContextWindowEx(string_id, popup_flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginPopupContextVoid) {
  auto result = ::cimgui::ImGui_BeginPopupContextVoid();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginPopupContextVoidEx) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiPopupFlags popup_flags = {};
  if (!ReadScalar(info, 1, &popup_flags)) return;
  auto result = ::cimgui::ImGui_BeginPopupContextVoidEx(string_id, popup_flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsPopupOpen) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiPopupFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  auto result = ::cimgui::ImGui_IsPopupOpen(string_id, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginTabBar) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiTabBarFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  auto result = ::cimgui::ImGui_BeginTabBar(string_id, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndTabBar) {
  ::cimgui::ImGui_EndTabBar();
}

NAN_METHOD(BeginTabItem) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  bool* open = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    open = ReadBoolArray(info, 1, 1);
    if (!open) return;
  }
  ImGuiTabItemFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_BeginTabItem(label, open, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndTabItem) {
  ::cimgui::ImGui_EndTabItem();
}

NAN_METHOD(TabItemButton) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiTabItemFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  auto result = ::cimgui::ImGui_TabItemButton(label, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SetTabItemClosed) {
  std::string tab_or_docked_window_label_utf8;
  const char* tab_or_docked_window_label = nullptr;
  if (!ReadUtf8(info,
                0,
                &tab_or_docked_window_label_utf8,
                &tab_or_docked_window_label,
                true))
    return;
  ::cimgui::ImGui_SetTabItemClosed(tab_or_docked_window_label);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiPopups) {
  sfmljs::SetMethod<BeginMenuBar>(target, "BeginMenuBar");
  sfmljs::SetMethod<EndMenuBar>(target, "EndMenuBar");
  sfmljs::SetMethod<BeginMainMenuBar>(target, "BeginMainMenuBar");
  sfmljs::SetMethod<EndMainMenuBar>(target, "EndMainMenuBar");
  sfmljs::SetMethod<BeginMenu>(target, "BeginMenu");
  sfmljs::SetMethod<BeginMenuEx>(target, "BeginMenuEx");
  sfmljs::SetMethod<EndMenu>(target, "EndMenu");
  sfmljs::SetMethod<MenuItem>(target, "MenuItem");
  sfmljs::SetMethod<MenuItemEx>(target, "MenuItemEx");
  sfmljs::SetMethod<MenuItemBoolPtr>(target, "MenuItemBoolPtr");
  sfmljs::SetMethod<BeginTooltip>(target, "BeginTooltip");
  sfmljs::SetMethod<EndTooltip>(target, "EndTooltip");
  sfmljs::SetMethod<SetTooltipUnformatted>(target, "SetTooltipUnformatted");
  sfmljs::SetMethod<BeginItemTooltip>(target, "BeginItemTooltip");
  sfmljs::SetMethod<SetItemTooltipUnformatted>(target,
                                               "SetItemTooltipUnformatted");
  sfmljs::SetMethod<BeginPopup>(target, "BeginPopup");
  sfmljs::SetMethod<BeginPopupModal>(target, "BeginPopupModal");
  sfmljs::SetMethod<EndPopup>(target, "EndPopup");
  sfmljs::SetMethod<OpenPopup>(target, "OpenPopup");
  sfmljs::SetMethod<OpenPopupID>(target, "OpenPopupID");
  sfmljs::SetMethod<OpenPopupOnItemClick>(target, "OpenPopupOnItemClick");
  sfmljs::SetMethod<CloseCurrentPopup>(target, "CloseCurrentPopup");
  sfmljs::SetMethod<BeginPopupContextItem>(target, "BeginPopupContextItem");
  sfmljs::SetMethod<BeginPopupContextItemEx>(target, "BeginPopupContextItemEx");
  sfmljs::SetMethod<BeginPopupContextWindow>(target, "BeginPopupContextWindow");
  sfmljs::SetMethod<BeginPopupContextWindowEx>(target,
                                               "BeginPopupContextWindowEx");
  sfmljs::SetMethod<BeginPopupContextVoid>(target, "BeginPopupContextVoid");
  sfmljs::SetMethod<BeginPopupContextVoidEx>(target, "BeginPopupContextVoidEx");
  sfmljs::SetMethod<IsPopupOpen>(target, "IsPopupOpen");
  sfmljs::SetMethod<BeginTabBar>(target, "BeginTabBar");
  sfmljs::SetMethod<EndTabBar>(target, "EndTabBar");
  sfmljs::SetMethod<BeginTabItem>(target, "BeginTabItem");
  sfmljs::SetMethod<EndTabItem>(target, "EndTabItem");
  sfmljs::SetMethod<TabItemButton>(target, "TabItemButton");
  sfmljs::SetMethod<SetTabItemClosed>(target, "SetTabItemClosed");
}

}  // namespace sfmlimgui
