// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(IsKeyDown) {
  ImGuiKey key = {};
  if (!ReadScalar(info, 0, &key)) return;
  auto result = ::cimgui::ImGui_IsKeyDown(key);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsKeyPressed) {
  ImGuiKey key = {};
  if (!ReadScalar(info, 0, &key)) return;
  auto result = ::cimgui::ImGui_IsKeyPressed(key);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsKeyPressedEx) {
  ImGuiKey key = {};
  if (!ReadScalar(info, 0, &key)) return;
  bool repeat = false;
  if (!ReadBool(info, 1, &repeat)) return;
  auto result = ::cimgui::ImGui_IsKeyPressedEx(key, repeat);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsKeyReleased) {
  ImGuiKey key = {};
  if (!ReadScalar(info, 0, &key)) return;
  auto result = ::cimgui::ImGui_IsKeyReleased(key);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsKeyChordPressed) {
  ImGuiKeyChord key_chord = {};
  if (!ReadScalar(info, 0, &key_chord)) return;
  auto result = ::cimgui::ImGui_IsKeyChordPressed(key_chord);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(GetKeyPressedAmount) {
  ImGuiKey key = {};
  if (!ReadScalar(info, 0, &key)) return;
  float repeat_delay = {};
  if (!ReadScalar(info, 1, &repeat_delay)) return;
  float rate = {};
  if (!ReadScalar(info, 2, &rate)) return;
  auto result = ::cimgui::ImGui_GetKeyPressedAmount(key, repeat_delay, rate);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetKeyName) {
  ImGuiKey key = {};
  if (!ReadScalar(info, 0, &key)) return;
  auto result = ::cimgui::ImGui_GetKeyName(key);
  ReturnString(info, result);
}

NAN_METHOD(SetNextFrameWantCaptureKeyboard) {
  bool want_capture_keyboard = false;
  if (!ReadBool(info, 0, &want_capture_keyboard)) return;
  ::cimgui::ImGui_SetNextFrameWantCaptureKeyboard(want_capture_keyboard);
}

NAN_METHOD(Shortcut) {
  ImGuiKeyChord key_chord = {};
  if (!ReadScalar(info, 0, &key_chord)) return;
  ImGuiInputFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  auto result = ::cimgui::ImGui_Shortcut(key_chord, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SetNextItemShortcut) {
  ImGuiKeyChord key_chord = {};
  if (!ReadScalar(info, 0, &key_chord)) return;
  ImGuiInputFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  ::cimgui::ImGui_SetNextItemShortcut(key_chord, flags);
}

NAN_METHOD(SetItemKeyOwner) {
  ImGuiKey key = {};
  if (!ReadScalar(info, 0, &key)) return;
  ::cimgui::ImGui_SetItemKeyOwner(key);
}

NAN_METHOD(IsMouseDown) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  auto result = ::cimgui::ImGui_IsMouseDown(button);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsMouseClicked) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  auto result = ::cimgui::ImGui_IsMouseClicked(button);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsMouseClickedEx) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  bool repeat = false;
  if (!ReadBool(info, 1, &repeat)) return;
  auto result = ::cimgui::ImGui_IsMouseClickedEx(button, repeat);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsMouseReleased) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  auto result = ::cimgui::ImGui_IsMouseReleased(button);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsMouseDoubleClicked) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  auto result = ::cimgui::ImGui_IsMouseDoubleClicked(button);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsMouseReleasedWithDelay) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  float delay = {};
  if (!ReadScalar(info, 1, &delay)) return;
  auto result = ::cimgui::ImGui_IsMouseReleasedWithDelay(button, delay);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(GetMouseClickedCount) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  auto result = ::cimgui::ImGui_GetMouseClickedCount(button);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(IsMouseHoveringRect) {
  cimgui::ImVec2 r_min;
  if (!ReadImVec2(info, 0, &r_min)) return;
  cimgui::ImVec2 r_max;
  if (!ReadImVec2(info, 1, &r_max)) return;
  auto result = ::cimgui::ImGui_IsMouseHoveringRect(r_min, r_max);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsMouseHoveringRectEx) {
  cimgui::ImVec2 r_min;
  if (!ReadImVec2(info, 0, &r_min)) return;
  cimgui::ImVec2 r_max;
  if (!ReadImVec2(info, 1, &r_max)) return;
  bool clip = false;
  if (!ReadBool(info, 2, &clip)) return;
  auto result = ::cimgui::ImGui_IsMouseHoveringRectEx(r_min, r_max, clip);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsMousePosValid) {
  cimgui::ImVec2* mouse_pos = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    mouse_pos = reinterpret_cast<cimgui::ImVec2*>(ReadFloat32Array(info, 0, 2));
    if (!mouse_pos) return;
  }
  auto result = ::cimgui::ImGui_IsMousePosValid(mouse_pos);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsAnyMouseDown) {
  auto result = ::cimgui::ImGui_IsAnyMouseDown();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(GetMousePos) {
  auto result = ::cimgui::ImGui_GetMousePos();
  ReturnVec2(info, result);
}

NAN_METHOD(GetMousePosOnOpeningCurrentPopup) {
  auto result = ::cimgui::ImGui_GetMousePosOnOpeningCurrentPopup();
  ReturnVec2(info, result);
}

NAN_METHOD(IsMouseDragging) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  float lock_threshold = {};
  if (!ReadScalar(info, 1, &lock_threshold)) return;
  auto result = ::cimgui::ImGui_IsMouseDragging(button, lock_threshold);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(GetMouseDragDelta) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  float lock_threshold = {};
  if (!ReadScalar(info, 1, &lock_threshold)) return;
  auto result = ::cimgui::ImGui_GetMouseDragDelta(button, lock_threshold);
  ReturnVec2(info, result);
}

NAN_METHOD(ResetMouseDragDelta) {
  ::cimgui::ImGui_ResetMouseDragDelta();
}

NAN_METHOD(ResetMouseDragDeltaEx) {
  ImGuiMouseButton button = {};
  if (!ReadScalar(info, 0, &button)) return;
  ::cimgui::ImGui_ResetMouseDragDeltaEx(button);
}

NAN_METHOD(GetMouseCursor) {
  auto result = ::cimgui::ImGui_GetMouseCursor();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(SetMouseCursor) {
  ImGuiMouseCursor cursor_type = {};
  if (!ReadScalar(info, 0, &cursor_type)) return;
  ::cimgui::ImGui_SetMouseCursor(cursor_type);
}

NAN_METHOD(SetNextFrameWantCaptureMouse) {
  bool want_capture_mouse = false;
  if (!ReadBool(info, 0, &want_capture_mouse)) return;
  ::cimgui::ImGui_SetNextFrameWantCaptureMouse(want_capture_mouse);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiInput) {
  sfmljs::SetMethod<IsKeyDown>(target, "IsKeyDown");
  sfmljs::SetMethod<IsKeyPressed>(target, "IsKeyPressed");
  sfmljs::SetMethod<IsKeyPressedEx>(target, "IsKeyPressedEx");
  sfmljs::SetMethod<IsKeyReleased>(target, "IsKeyReleased");
  sfmljs::SetMethod<IsKeyChordPressed>(target, "IsKeyChordPressed");
  sfmljs::SetMethod<GetKeyPressedAmount>(target, "GetKeyPressedAmount");
  sfmljs::SetMethod<GetKeyName>(target, "GetKeyName");
  sfmljs::SetMethod<SetNextFrameWantCaptureKeyboard>(
      target, "SetNextFrameWantCaptureKeyboard");
  sfmljs::SetMethod<Shortcut>(target, "Shortcut");
  sfmljs::SetMethod<SetNextItemShortcut>(target, "SetNextItemShortcut");
  sfmljs::SetMethod<SetItemKeyOwner>(target, "SetItemKeyOwner");
  sfmljs::SetMethod<IsMouseDown>(target, "IsMouseDown");
  sfmljs::SetMethod<IsMouseClicked>(target, "IsMouseClicked");
  sfmljs::SetMethod<IsMouseClickedEx>(target, "IsMouseClickedEx");
  sfmljs::SetMethod<IsMouseReleased>(target, "IsMouseReleased");
  sfmljs::SetMethod<IsMouseDoubleClicked>(target, "IsMouseDoubleClicked");
  sfmljs::SetMethod<IsMouseReleasedWithDelay>(target,
                                              "IsMouseReleasedWithDelay");
  sfmljs::SetMethod<GetMouseClickedCount>(target, "GetMouseClickedCount");
  sfmljs::SetMethod<IsMouseHoveringRect>(target, "IsMouseHoveringRect");
  sfmljs::SetMethod<IsMouseHoveringRectEx>(target, "IsMouseHoveringRectEx");
  sfmljs::SetMethod<IsMousePosValid>(target, "IsMousePosValid");
  sfmljs::SetMethod<IsAnyMouseDown>(target, "IsAnyMouseDown");
  sfmljs::SetMethod<GetMousePos>(target, "GetMousePos");
  sfmljs::SetMethod<GetMousePosOnOpeningCurrentPopup>(
      target, "GetMousePosOnOpeningCurrentPopup");
  sfmljs::SetMethod<IsMouseDragging>(target, "IsMouseDragging");
  sfmljs::SetMethod<GetMouseDragDelta>(target, "GetMouseDragDelta");
  sfmljs::SetMethod<ResetMouseDragDelta>(target, "ResetMouseDragDelta");
  sfmljs::SetMethod<ResetMouseDragDeltaEx>(target, "ResetMouseDragDeltaEx");
  sfmljs::SetMethod<GetMouseCursor>(target, "GetMouseCursor");
  sfmljs::SetMethod<SetMouseCursor>(target, "SetMouseCursor");
  sfmljs::SetMethod<SetNextFrameWantCaptureMouse>(
      target, "SetNextFrameWantCaptureMouse");
}

}  // namespace sfmlimgui
