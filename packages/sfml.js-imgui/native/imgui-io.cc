// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(GetIO) {
  auto result = ::cimgui::ImGui_GetIO();
  ReturnStruct<cimgui::ImGuiIO>(info, result);
}

NAN_METHOD(GetPlatformIO) {
  auto result = ::cimgui::ImGui_GetPlatformIO();
  ReturnStruct<cimgui::ImGuiPlatformIO>(info, result);
}

NAN_METHOD(IOAddKeyEvent) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ImGuiKey key = {};
  if (!ReadScalar(info, 1, &key)) return;
  bool down = false;
  if (!ReadBool(info, 2, &down)) return;
  ::cimgui::ImGuiIO_AddKeyEvent(io, key, down);
}

NAN_METHOD(IOAddKeyAnalogEvent) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ImGuiKey key = {};
  if (!ReadScalar(info, 1, &key)) return;
  bool down = false;
  if (!ReadBool(info, 2, &down)) return;
  float value = {};
  if (!ReadScalar(info, 3, &value)) return;
  ::cimgui::ImGuiIO_AddKeyAnalogEvent(io, key, down, value);
}

NAN_METHOD(IOAddMousePosEvent) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  float x = {};
  if (!ReadScalar(info, 1, &x)) return;
  float y = {};
  if (!ReadScalar(info, 2, &y)) return;
  ::cimgui::ImGuiIO_AddMousePosEvent(io, x, y);
}

NAN_METHOD(IOAddMouseButtonEvent) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  int button = {};
  if (!ReadScalar(info, 1, &button)) return;
  bool down = false;
  if (!ReadBool(info, 2, &down)) return;
  ::cimgui::ImGuiIO_AddMouseButtonEvent(io, button, down);
}

NAN_METHOD(IOAddMouseWheelEvent) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  float wheel_x = {};
  if (!ReadScalar(info, 1, &wheel_x)) return;
  float wheel_y = {};
  if (!ReadScalar(info, 2, &wheel_y)) return;
  ::cimgui::ImGuiIO_AddMouseWheelEvent(io, wheel_x, wheel_y);
}

NAN_METHOD(IOAddMouseSourceEvent) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ImGuiMouseSource source = {};
  if (!ReadScalar(info, 1, &source)) return;
  ::cimgui::ImGuiIO_AddMouseSourceEvent(io, source);
}

NAN_METHOD(IOAddFocusEvent) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  bool focused = false;
  if (!ReadBool(info, 1, &focused)) return;
  ::cimgui::ImGuiIO_AddFocusEvent(io, focused);
}

NAN_METHOD(IOAddInputCharacter) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  unsigned int character = {};
  if (!ReadScalar(info, 1, &character)) return;
  ::cimgui::ImGuiIO_AddInputCharacter(io, character);
}

NAN_METHOD(IOAddInputCharacterUTF16) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ImWchar16 character = {};
  if (!ReadScalar(info, 1, &character)) return;
  ::cimgui::ImGuiIO_AddInputCharacterUTF16(io, character);
}

NAN_METHOD(IOAddInputCharactersUTF8) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 1, &text_utf8, &text, true)) return;
  ::cimgui::ImGuiIO_AddInputCharactersUTF8(io, text);
}

NAN_METHOD(IOSetKeyEventNativeData) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ImGuiKey key = {};
  if (!ReadScalar(info, 1, &key)) return;
  int native_keycode = {};
  if (!ReadScalar(info, 2, &native_keycode)) return;
  int native_scancode = {};
  if (!ReadScalar(info, 3, &native_scancode)) return;
  ::cimgui::ImGuiIO_SetKeyEventNativeData(
      io, key, native_keycode, native_scancode);
}

NAN_METHOD(IOSetKeyEventNativeDataEx) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ImGuiKey key = {};
  if (!ReadScalar(info, 1, &key)) return;
  int native_keycode = {};
  if (!ReadScalar(info, 2, &native_keycode)) return;
  int native_scancode = {};
  if (!ReadScalar(info, 3, &native_scancode)) return;
  int native_legacy_index = {};
  if (!ReadScalar(info, 4, &native_legacy_index)) return;
  ::cimgui::ImGuiIO_SetKeyEventNativeDataEx(
      io, key, native_keycode, native_scancode, native_legacy_index);
}

NAN_METHOD(IOSetAppAcceptingEvents) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  bool accepting_events = false;
  if (!ReadBool(info, 1, &accepting_events)) return;
  ::cimgui::ImGuiIO_SetAppAcceptingEvents(io, accepting_events);
}

NAN_METHOD(IOClearEventsQueue) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ::cimgui::ImGuiIO_ClearEventsQueue(io);
}

NAN_METHOD(IOClearInputKeys) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ::cimgui::ImGuiIO_ClearInputKeys(io);
}

NAN_METHOD(IOClearInputMouse) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ::cimgui::ImGuiIO_ClearInputMouse(io);
}

NAN_METHOD(IOClearInputCharacters) {
  cimgui::ImGuiIO* io = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    io = ReadStruct<cimgui::ImGuiIO>(info, 0);
    if (!io) return;
  }
  ::cimgui::ImGuiIO_ClearInputCharacters(io);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiIO) {
  sfmljs::SetMethod<GetIO>(target, "GetIO");
  sfmljs::SetMethod<GetPlatformIO>(target, "GetPlatformIO");
  sfmljs::SetMethod<IOAddKeyEvent>(target, "IO_AddKeyEvent");
  sfmljs::SetMethod<IOAddKeyAnalogEvent>(target, "IO_AddKeyAnalogEvent");
  sfmljs::SetMethod<IOAddMousePosEvent>(target, "IO_AddMousePosEvent");
  sfmljs::SetMethod<IOAddMouseButtonEvent>(target, "IO_AddMouseButtonEvent");
  sfmljs::SetMethod<IOAddMouseWheelEvent>(target, "IO_AddMouseWheelEvent");
  sfmljs::SetMethod<IOAddMouseSourceEvent>(target, "IO_AddMouseSourceEvent");
  sfmljs::SetMethod<IOAddFocusEvent>(target, "IO_AddFocusEvent");
  sfmljs::SetMethod<IOAddInputCharacter>(target, "IO_AddInputCharacter");
  sfmljs::SetMethod<IOAddInputCharacterUTF16>(target,
                                              "IO_AddInputCharacterUTF16");
  sfmljs::SetMethod<IOAddInputCharactersUTF8>(target,
                                              "IO_AddInputCharactersUTF8");
  sfmljs::SetMethod<IOSetKeyEventNativeData>(target,
                                             "IO_SetKeyEventNativeData");
  sfmljs::SetMethod<IOSetKeyEventNativeDataEx>(target,
                                               "IO_SetKeyEventNativeDataEx");
  sfmljs::SetMethod<IOSetAppAcceptingEvents>(target,
                                             "IO_SetAppAcceptingEvents");
  sfmljs::SetMethod<IOClearEventsQueue>(target, "IO_ClearEventsQueue");
  sfmljs::SetMethod<IOClearInputKeys>(target, "IO_ClearInputKeys");
  sfmljs::SetMethod<IOClearInputMouse>(target, "IO_ClearInputMouse");
  sfmljs::SetMethod<IOClearInputCharacters>(target, "IO_ClearInputCharacters");
}

}  // namespace sfmlimgui
