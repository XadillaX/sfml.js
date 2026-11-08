// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cstddef>
#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(InputText) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  char* buffer = nullptr;
  if (!ReadBytes(info, 1, &buffer)) return;
  size_t buffer_size = 0;
  if (!ReadSize(info, 2, &buffer_size)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 3, &flags)) return;
  auto result = ::cimgui::ImGui_InputText(label, buffer, buffer_size, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputTextMultiline) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  char* buffer = nullptr;
  if (!ReadBytes(info, 1, &buffer)) return;
  size_t buffer_size = 0;
  if (!ReadSize(info, 2, &buffer_size)) return;
  auto result = ::cimgui::ImGui_InputTextMultiline(label, buffer, buffer_size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputTextWithHint) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  std::string hint_utf8;
  const char* hint = nullptr;
  if (!ReadUtf8(info, 1, &hint_utf8, &hint, true)) return;
  char* buffer = nullptr;
  if (!ReadBytes(info, 2, &buffer)) return;
  size_t buffer_size = 0;
  if (!ReadSize(info, 3, &buffer_size)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 4, &flags)) return;
  auto result = ::cimgui::ImGui_InputTextWithHint(
      label, hint, buffer, buffer_size, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputTextWithHintEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  std::string hint_utf8;
  const char* hint = nullptr;
  if (!ReadUtf8(info, 1, &hint_utf8, &hint, true)) return;
  char* buffer = nullptr;
  if (!ReadBytes(info, 2, &buffer)) return;
  size_t buffer_size = 0;
  if (!ReadSize(info, 3, &buffer_size)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 4, &flags)) return;
  if (!info[5]->IsUndefined() && !info[5]->IsNull()) {
    Nan::ThrowTypeError("Function callbacks are not supported");
    return;
  }
  void* user_data = nullptr;
  if (!ReadPointer(info, 6, &user_data)) return;
  auto result = ::cimgui::ImGui_InputTextWithHintEx(
      label, hint, buffer, buffer_size, flags, nullptr, user_data);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputFloat) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 1);
  if (!value) return;
  auto result = ::cimgui::ImGui_InputFloat(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputFloatEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 1);
  if (!value) return;
  float step = {};
  if (!ReadScalar(info, 2, &step)) return;
  float step_fast = {};
  if (!ReadScalar(info, 3, &step_fast)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_InputFloatEx(
      label, value, step, step_fast, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputFloat2) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 2);
  if (!value) return;
  auto result = ::cimgui::ImGui_InputFloat2(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputFloat2Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 2);
  if (!value) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 2, &format_utf8, &format, true)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 3, &flags)) return;
  auto result = ::cimgui::ImGui_InputFloat2Ex(label, value, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputFloat3) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 3);
  if (!value) return;
  auto result = ::cimgui::ImGui_InputFloat3(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputFloat3Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 3);
  if (!value) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 2, &format_utf8, &format, true)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 3, &flags)) return;
  auto result = ::cimgui::ImGui_InputFloat3Ex(label, value, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputFloat4) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 4);
  if (!value) return;
  auto result = ::cimgui::ImGui_InputFloat4(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputFloat4Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 4);
  if (!value) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 2, &format_utf8, &format, true)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 3, &flags)) return;
  auto result = ::cimgui::ImGui_InputFloat4Ex(label, value, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputInt) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 1);
  if (!value) return;
  auto result = ::cimgui::ImGui_InputInt(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputIntEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 1);
  if (!value) return;
  int step = {};
  if (!ReadScalar(info, 2, &step)) return;
  int step_fast = {};
  if (!ReadScalar(info, 3, &step_fast)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 4, &flags)) return;
  auto result =
      ::cimgui::ImGui_InputIntEx(label, value, step, step_fast, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputInt2) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 2);
  if (!value) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_InputInt2(label, value, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputInt3) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 3);
  if (!value) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_InputInt3(label, value, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputInt4) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 4);
  if (!value) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_InputInt4(label, value, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputDouble) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  double* value = ReadFloat64Array(info, 1, 1);
  if (!value) return;
  auto result = ::cimgui::ImGui_InputDouble(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputDoubleEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  double* value = ReadFloat64Array(info, 1, 1);
  if (!value) return;
  double step = {};
  if (!ReadScalar(info, 2, &step)) return;
  double step_fast = {};
  if (!ReadScalar(info, 3, &step_fast)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_InputDoubleEx(
      label, value, step, step_fast, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputScalar) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  auto result = ::cimgui::ImGui_InputScalar(label, data_type, data);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputScalarEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  void* step = nullptr;
  if (!ReadPointer(info, 3, &step)) return;
  void* step_fast = nullptr;
  if (!ReadPointer(info, 4, &step_fast)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_InputScalarEx(
      label, data_type, data, step, step_fast, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputScalarN) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  int components = {};
  if (!ReadScalar(info, 3, &components)) return;
  auto result =
      ::cimgui::ImGui_InputScalarN(label, data_type, data, components);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputScalarNEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  int components = {};
  if (!ReadScalar(info, 3, &components)) return;
  void* step = nullptr;
  if (!ReadPointer(info, 4, &step)) return;
  void* step_fast = nullptr;
  if (!ReadPointer(info, 5, &step_fast)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 6, &format_utf8, &format, true)) return;
  ImGuiInputTextFlags flags = {};
  if (!ReadScalar(info, 7, &flags)) return;
  auto result = ::cimgui::ImGui_InputScalarNEx(
      label, data_type, data, components, step, step_fast, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InputTextCallbackDataDeleteChars) {
  cimgui::ImGuiInputTextCallbackData* callback_data = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    callback_data = ReadStruct<cimgui::ImGuiInputTextCallbackData>(info, 0);
    if (!callback_data) return;
  }
  int position = {};
  if (!ReadScalar(info, 1, &position)) return;
  int bytes_count = {};
  if (!ReadScalar(info, 2, &bytes_count)) return;
  ::cimgui::ImGuiInputTextCallbackData_DeleteChars(
      callback_data, position, bytes_count);
}

NAN_METHOD(InputTextCallbackDataInsertChars) {
  cimgui::ImGuiInputTextCallbackData* callback_data = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    callback_data = ReadStruct<cimgui::ImGuiInputTextCallbackData>(info, 0);
    if (!callback_data) return;
  }
  int position = {};
  if (!ReadScalar(info, 1, &position)) return;
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 2, 3, &text_range)) return;
  ::cimgui::ImGuiInputTextCallbackData_InsertChars(
      callback_data, position, text_range.begin, text_range.end);
}

NAN_METHOD(InputTextCallbackDataSelectAll) {
  cimgui::ImGuiInputTextCallbackData* callback_data = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    callback_data = ReadStruct<cimgui::ImGuiInputTextCallbackData>(info, 0);
    if (!callback_data) return;
  }
  ::cimgui::ImGuiInputTextCallbackData_SelectAll(callback_data);
}

NAN_METHOD(InputTextCallbackDataClearSelection) {
  cimgui::ImGuiInputTextCallbackData* callback_data = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    callback_data = ReadStruct<cimgui::ImGuiInputTextCallbackData>(info, 0);
    if (!callback_data) return;
  }
  ::cimgui::ImGuiInputTextCallbackData_ClearSelection(callback_data);
}

NAN_METHOD(InputTextCallbackDataHasSelection) {
  cimgui::ImGuiInputTextCallbackData* callback_data = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    callback_data = ReadStruct<cimgui::ImGuiInputTextCallbackData>(info, 0);
    if (!callback_data) return;
  }
  auto result =
      ::cimgui::ImGuiInputTextCallbackData_HasSelection(callback_data);
  info.GetReturnValue().Set(Nan::New(result));
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiInputWidgets) {
  sfmljs::SetMethod<InputText>(target, "InputText");
  sfmljs::SetMethod<InputTextMultiline>(target, "InputTextMultiline");
  sfmljs::SetMethod<InputTextWithHint>(target, "InputTextWithHint");
  sfmljs::SetMethod<InputTextWithHintEx>(target, "InputTextWithHintEx");
  sfmljs::SetMethod<InputFloat>(target, "InputFloat");
  sfmljs::SetMethod<InputFloatEx>(target, "InputFloatEx");
  sfmljs::SetMethod<InputFloat2>(target, "InputFloat2");
  sfmljs::SetMethod<InputFloat2Ex>(target, "InputFloat2Ex");
  sfmljs::SetMethod<InputFloat3>(target, "InputFloat3");
  sfmljs::SetMethod<InputFloat3Ex>(target, "InputFloat3Ex");
  sfmljs::SetMethod<InputFloat4>(target, "InputFloat4");
  sfmljs::SetMethod<InputFloat4Ex>(target, "InputFloat4Ex");
  sfmljs::SetMethod<InputInt>(target, "InputInt");
  sfmljs::SetMethod<InputIntEx>(target, "InputIntEx");
  sfmljs::SetMethod<InputInt2>(target, "InputInt2");
  sfmljs::SetMethod<InputInt3>(target, "InputInt3");
  sfmljs::SetMethod<InputInt4>(target, "InputInt4");
  sfmljs::SetMethod<InputDouble>(target, "InputDouble");
  sfmljs::SetMethod<InputDoubleEx>(target, "InputDoubleEx");
  sfmljs::SetMethod<InputScalar>(target, "InputScalar");
  sfmljs::SetMethod<InputScalarEx>(target, "InputScalarEx");
  sfmljs::SetMethod<InputScalarN>(target, "InputScalarN");
  sfmljs::SetMethod<InputScalarNEx>(target, "InputScalarNEx");
  sfmljs::SetMethod<InputTextCallbackDataDeleteChars>(
      target, "InputTextCallbackData_DeleteChars");
  sfmljs::SetMethod<InputTextCallbackDataInsertChars>(
      target, "InputTextCallbackData_InsertChars");
  sfmljs::SetMethod<InputTextCallbackDataSelectAll>(
      target, "InputTextCallbackData_SelectAll");
  sfmljs::SetMethod<InputTextCallbackDataClearSelection>(
      target, "InputTextCallbackData_ClearSelection");
  sfmljs::SetMethod<InputTextCallbackDataHasSelection>(
      target, "InputTextCallbackData_HasSelection");
}

}  // namespace sfmlimgui
