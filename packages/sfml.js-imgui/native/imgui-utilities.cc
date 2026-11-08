// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cstddef>
#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(LogToTTY) {
  int auto_open_depth = {};
  if (!ReadScalar(info, 0, &auto_open_depth)) return;
  ::cimgui::ImGui_LogToTTY(auto_open_depth);
}

NAN_METHOD(LogToFile) {
  int auto_open_depth = {};
  if (!ReadScalar(info, 0, &auto_open_depth)) return;
  std::string filename_utf8;
  const char* filename = nullptr;
  if (!ReadUtf8(info, 1, &filename_utf8, &filename, true)) return;
  ::cimgui::ImGui_LogToFile(auto_open_depth, filename);
}

NAN_METHOD(LogToClipboard) {
  int auto_open_depth = {};
  if (!ReadScalar(info, 0, &auto_open_depth)) return;
  ::cimgui::ImGui_LogToClipboard(auto_open_depth);
}

NAN_METHOD(LogFinish) {
  ::cimgui::ImGui_LogFinish();
}

NAN_METHOD(LogButtons) {
  ::cimgui::ImGui_LogButtons();
}

NAN_METHOD(LogTextUnformatted) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_LogTextUnformatted(text);
}

NAN_METHOD(GetClipboardText) {
  auto result = ::cimgui::ImGui_GetClipboardText();
  ReturnString(info, result);
}

NAN_METHOD(SetClipboardText) {
  std::string text_utf8;
  const char* text = nullptr;
  if (!ReadUtf8(info, 0, &text_utf8, &text, true)) return;
  ::cimgui::ImGui_SetClipboardText(text);
}

NAN_METHOD(LoadIniSettingsFromDisk) {
  std::string ini_filename_utf8;
  const char* ini_filename = nullptr;
  if (!ReadUtf8(info, 0, &ini_filename_utf8, &ini_filename, true)) return;
  ::cimgui::ImGui_LoadIniSettingsFromDisk(ini_filename);
}

NAN_METHOD(LoadIniSettingsFromMemory) {
  std::string ini_data_utf8;
  const char* ini_data = nullptr;
  if (!ReadUtf8(info, 0, &ini_data_utf8, &ini_data, true)) return;
  size_t ini_size = 0;
  if (!ReadSize(info, 1, &ini_size)) return;
  ::cimgui::ImGui_LoadIniSettingsFromMemory(ini_data, ini_size);
}

NAN_METHOD(SaveIniSettingsToDisk) {
  std::string ini_filename_utf8;
  const char* ini_filename = nullptr;
  if (!ReadUtf8(info, 0, &ini_filename_utf8, &ini_filename, true)) return;
  ::cimgui::ImGui_SaveIniSettingsToDisk(ini_filename);
}

NAN_METHOD(SaveIniSettingsToMemory) {
  size_t* out_ini_size = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    out_ini_size = ReadSizeArray(info, 0);
    if (!out_ini_size) return;
  }
  auto result = ::cimgui::ImGui_SaveIniSettingsToMemory(out_ini_size);
  ReturnString(info, result);
}

NAN_METHOD(MemAlloc) {
  size_t size = 0;
  if (!ReadSize(info, 0, &size)) return;
  auto result = ::cimgui::ImGui_MemAlloc(size);
  ReturnPointer(info, result);
}

NAN_METHOD(MemFree) {
  void* pointer = nullptr;
  if (!ReadPointer(info, 0, &pointer)) return;
  ::cimgui::ImGui_MemFree(pointer);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiUtilities) {
  sfmljs::SetMethod<LogToTTY>(target, "LogToTTY");
  sfmljs::SetMethod<LogToFile>(target, "LogToFile");
  sfmljs::SetMethod<LogToClipboard>(target, "LogToClipboard");
  sfmljs::SetMethod<LogFinish>(target, "LogFinish");
  sfmljs::SetMethod<LogButtons>(target, "LogButtons");
  sfmljs::SetMethod<LogTextUnformatted>(target, "LogTextUnformatted");
  sfmljs::SetMethod<GetClipboardText>(target, "GetClipboardText");
  sfmljs::SetMethod<SetClipboardText>(target, "SetClipboardText");
  sfmljs::SetMethod<LoadIniSettingsFromDisk>(target, "LoadIniSettingsFromDisk");
  sfmljs::SetMethod<LoadIniSettingsFromMemory>(target,
                                               "LoadIniSettingsFromMemory");
  sfmljs::SetMethod<SaveIniSettingsToDisk>(target, "SaveIniSettingsToDisk");
  sfmljs::SetMethod<SaveIniSettingsToMemory>(target, "SaveIniSettingsToMemory");
  sfmljs::SetMethod<MemAlloc>(target, "MemAlloc");
  sfmljs::SetMethod<MemFree>(target, "MemFree");
}

}  // namespace sfmlimgui
