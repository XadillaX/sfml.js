// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(PushItemFlag) {
  ImGuiItemFlags option = {};
  if (!ReadScalar(info, 0, &option)) return;
  bool enabled = false;
  if (!ReadBool(info, 1, &enabled)) return;
  ::cimgui::ImGui_PushItemFlag(option, enabled);
}

NAN_METHOD(PopItemFlag) {
  ::cimgui::ImGui_PopItemFlag();
}

NAN_METHOD(PushID) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ::cimgui::ImGui_PushID(string_id);
}

NAN_METHOD(PushIDStr) {
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 0, 1, &text_range)) return;
  // ImGui treats a zero hash length as NUL-terminated input.
  if (text_range.end && text_range.begin == text_range.end) {
    ::cimgui::ImGui_PushID("");
    return;
  }
  ::cimgui::ImGui_PushIDStr(text_range.begin, text_range.end);
}

NAN_METHOD(PushIDPtr) {
  void* pointer_id = nullptr;
  if (!ReadPointer(info, 0, &pointer_id)) return;
  ::cimgui::ImGui_PushIDPtr(pointer_id);
}

NAN_METHOD(PushIDInt) {
  int int_id = {};
  if (!ReadScalar(info, 0, &int_id)) return;
  ::cimgui::ImGui_PushIDInt(int_id);
}

NAN_METHOD(PopID) {
  ::cimgui::ImGui_PopID();
}

NAN_METHOD(GetID) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  auto result = ::cimgui::ImGui_GetID(string_id);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetIDStr) {
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 0, 1, &text_range)) return;
  // Empty explicit ranges must not enter ImGui's NUL-terminated hash path.
  auto result =
      (text_range.end && text_range.begin == text_range.end)
          ? ::cimgui::ImGui_GetID("")
          : ::cimgui::ImGui_GetIDStr(text_range.begin, text_range.end);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetIDPtr) {
  void* pointer_id = nullptr;
  if (!ReadPointer(info, 0, &pointer_id)) return;
  auto result = ::cimgui::ImGui_GetIDPtr(pointer_id);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetIDInt) {
  int int_id = {};
  if (!ReadScalar(info, 0, &int_id)) return;
  auto result = ::cimgui::ImGui_GetIDInt(int_id);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(SetItemDefaultFocus) {
  ::cimgui::ImGui_SetItemDefaultFocus();
}

NAN_METHOD(SetKeyboardFocusHere) {
  ::cimgui::ImGui_SetKeyboardFocusHere();
}

NAN_METHOD(SetKeyboardFocusHereEx) {
  int offset = {};
  if (!ReadScalar(info, 0, &offset)) return;
  ::cimgui::ImGui_SetKeyboardFocusHereEx(offset);
}

NAN_METHOD(SetNavCursorVisible) {
  bool visible = false;
  if (!ReadBool(info, 0, &visible)) return;
  ::cimgui::ImGui_SetNavCursorVisible(visible);
}

NAN_METHOD(SetNextItemAllowOverlap) {
  ::cimgui::ImGui_SetNextItemAllowOverlap();
}

NAN_METHOD(IsItemHovered) {
  ImGuiHoveredFlags flags = {};
  if (!ReadScalar(info, 0, &flags)) return;
  auto result = ::cimgui::ImGui_IsItemHovered(flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemActive) {
  auto result = ::cimgui::ImGui_IsItemActive();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemFocused) {
  auto result = ::cimgui::ImGui_IsItemFocused();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemClicked) {
  auto result = ::cimgui::ImGui_IsItemClicked();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemClickedEx) {
  ImGuiMouseButton mouse_button = {};
  if (!ReadScalar(info, 0, &mouse_button)) return;
  auto result = ::cimgui::ImGui_IsItemClickedEx(mouse_button);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemVisible) {
  auto result = ::cimgui::ImGui_IsItemVisible();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemEdited) {
  auto result = ::cimgui::ImGui_IsItemEdited();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemActivated) {
  auto result = ::cimgui::ImGui_IsItemActivated();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemDeactivated) {
  auto result = ::cimgui::ImGui_IsItemDeactivated();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemDeactivatedAfterEdit) {
  auto result = ::cimgui::ImGui_IsItemDeactivatedAfterEdit();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsItemToggledOpen) {
  auto result = ::cimgui::ImGui_IsItemToggledOpen();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsAnyItemHovered) {
  auto result = ::cimgui::ImGui_IsAnyItemHovered();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsAnyItemActive) {
  auto result = ::cimgui::ImGui_IsAnyItemActive();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsAnyItemFocused) {
  auto result = ::cimgui::ImGui_IsAnyItemFocused();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(GetItemID) {
  auto result = ::cimgui::ImGui_GetItemID();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetItemRectMin) {
  auto result = ::cimgui::ImGui_GetItemRectMin();
  ReturnVec2(info, result);
}

NAN_METHOD(GetItemRectMax) {
  auto result = ::cimgui::ImGui_GetItemRectMax();
  ReturnVec2(info, result);
}

NAN_METHOD(GetItemRectSize) {
  auto result = ::cimgui::ImGui_GetItemRectSize();
  ReturnVec2(info, result);
}

NAN_METHOD(PushButtonRepeat) {
  bool repeat = false;
  if (!ReadBool(info, 0, &repeat)) return;
  ::cimgui::ImGui_PushButtonRepeat(repeat);
}

NAN_METHOD(PopButtonRepeat) {
  ::cimgui::ImGui_PopButtonRepeat();
}

NAN_METHOD(PushTabStop) {
  bool tab_stop = false;
  if (!ReadBool(info, 0, &tab_stop)) return;
  ::cimgui::ImGui_PushTabStop(tab_stop);
}

NAN_METHOD(PopTabStop) {
  ::cimgui::ImGui_PopTabStop();
}

NAN_METHOD(SetItemAllowOverlap) {
  ::cimgui::ImGui_SetItemAllowOverlap();
}

NAN_METHOD(PushAllowKeyboardFocus) {
  bool tab_stop = false;
  if (!ReadBool(info, 0, &tab_stop)) return;
  ::cimgui::ImGui_PushAllowKeyboardFocus(tab_stop);
}

NAN_METHOD(PopAllowKeyboardFocus) {
  ::cimgui::ImGui_PopAllowKeyboardFocus();
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiItems) {
  sfmljs::SetMethod<PushItemFlag>(target, "PushItemFlag");
  sfmljs::SetMethod<PopItemFlag>(target, "PopItemFlag");
  sfmljs::SetMethod<PushID>(target, "PushID");
  sfmljs::SetMethod<PushIDStr>(target, "PushIDStr");
  sfmljs::SetMethod<PushIDPtr>(target, "PushIDPtr");
  sfmljs::SetMethod<PushIDInt>(target, "PushIDInt");
  sfmljs::SetMethod<PopID>(target, "PopID");
  sfmljs::SetMethod<GetID>(target, "GetID");
  sfmljs::SetMethod<GetIDStr>(target, "GetIDStr");
  sfmljs::SetMethod<GetIDPtr>(target, "GetIDPtr");
  sfmljs::SetMethod<GetIDInt>(target, "GetIDInt");
  sfmljs::SetMethod<SetItemDefaultFocus>(target, "SetItemDefaultFocus");
  sfmljs::SetMethod<SetKeyboardFocusHere>(target, "SetKeyboardFocusHere");
  sfmljs::SetMethod<SetKeyboardFocusHereEx>(target, "SetKeyboardFocusHereEx");
  sfmljs::SetMethod<SetNavCursorVisible>(target, "SetNavCursorVisible");
  sfmljs::SetMethod<SetNextItemAllowOverlap>(target, "SetNextItemAllowOverlap");
  sfmljs::SetMethod<IsItemHovered>(target, "IsItemHovered");
  sfmljs::SetMethod<IsItemActive>(target, "IsItemActive");
  sfmljs::SetMethod<IsItemFocused>(target, "IsItemFocused");
  sfmljs::SetMethod<IsItemClicked>(target, "IsItemClicked");
  sfmljs::SetMethod<IsItemClickedEx>(target, "IsItemClickedEx");
  sfmljs::SetMethod<IsItemVisible>(target, "IsItemVisible");
  sfmljs::SetMethod<IsItemEdited>(target, "IsItemEdited");
  sfmljs::SetMethod<IsItemActivated>(target, "IsItemActivated");
  sfmljs::SetMethod<IsItemDeactivated>(target, "IsItemDeactivated");
  sfmljs::SetMethod<IsItemDeactivatedAfterEdit>(target,
                                                "IsItemDeactivatedAfterEdit");
  sfmljs::SetMethod<IsItemToggledOpen>(target, "IsItemToggledOpen");
  sfmljs::SetMethod<IsAnyItemHovered>(target, "IsAnyItemHovered");
  sfmljs::SetMethod<IsAnyItemActive>(target, "IsAnyItemActive");
  sfmljs::SetMethod<IsAnyItemFocused>(target, "IsAnyItemFocused");
  sfmljs::SetMethod<GetItemID>(target, "GetItemID");
  sfmljs::SetMethod<GetItemRectMin>(target, "GetItemRectMin");
  sfmljs::SetMethod<GetItemRectMax>(target, "GetItemRectMax");
  sfmljs::SetMethod<GetItemRectSize>(target, "GetItemRectSize");
  sfmljs::SetMethod<PushButtonRepeat>(target, "PushButtonRepeat");
  sfmljs::SetMethod<PopButtonRepeat>(target, "PopButtonRepeat");
  sfmljs::SetMethod<PushTabStop>(target, "PushTabStop");
  sfmljs::SetMethod<PopTabStop>(target, "PopTabStop");
  sfmljs::SetMethod<SetItemAllowOverlap>(target, "SetItemAllowOverlap");
  sfmljs::SetMethod<PushAllowKeyboardFocus>(target, "PushAllowKeyboardFocus");
  sfmljs::SetMethod<PopAllowKeyboardFocus>(target, "PopAllowKeyboardFocus");
}

}  // namespace sfmlimgui
