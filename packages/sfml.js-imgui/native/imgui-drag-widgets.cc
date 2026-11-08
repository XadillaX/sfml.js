// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(DragFloat) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 1);
  if (!value) return;
  auto result = ::cimgui::ImGui_DragFloat(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragFloatEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 1);
  if (!value) return;
  float speed = {};
  if (!ReadScalar(info, 2, &speed)) return;
  float minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_DragFloatEx(
      label, value, speed, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragFloat2) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 2);
  if (!value) return;
  auto result = ::cimgui::ImGui_DragFloat2(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragFloat2Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 2);
  if (!value) return;
  float speed = {};
  if (!ReadScalar(info, 2, &speed)) return;
  float minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_DragFloat2Ex(
      label, value, speed, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragFloat3) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 3);
  if (!value) return;
  auto result = ::cimgui::ImGui_DragFloat3(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragFloat3Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 3);
  if (!value) return;
  float speed = {};
  if (!ReadScalar(info, 2, &speed)) return;
  float minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_DragFloat3Ex(
      label, value, speed, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragFloat4) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 4);
  if (!value) return;
  auto result = ::cimgui::ImGui_DragFloat4(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragFloat4Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 4);
  if (!value) return;
  float speed = {};
  if (!ReadScalar(info, 2, &speed)) return;
  float minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_DragFloat4Ex(
      label, value, speed, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragFloatRange2) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* current_min = ReadFloat32Array(info, 1, 1);
  if (!current_min) return;
  float* current_max = ReadFloat32Array(info, 2, 1);
  if (!current_max) return;
  auto result =
      ::cimgui::ImGui_DragFloatRange2(label, current_min, current_max);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragFloatRange2Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* current_min = ReadFloat32Array(info, 1, 1);
  if (!current_min) return;
  float* current_max = ReadFloat32Array(info, 2, 1);
  if (!current_max) return;
  float speed = {};
  if (!ReadScalar(info, 3, &speed)) return;
  float minimum = {};
  if (!ReadScalar(info, 4, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 5, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 6, &format_utf8, &format, true)) return;
  std::string format_max_utf8;
  const char* format_max = nullptr;
  if (!ReadUtf8(info, 7, &format_max_utf8, &format_max, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 8, &flags)) return;
  auto result = ::cimgui::ImGui_DragFloatRange2Ex(label,
                                                  current_min,
                                                  current_max,
                                                  speed,
                                                  minimum,
                                                  maximum,
                                                  format,
                                                  format_max,
                                                  flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragInt) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 1);
  if (!value) return;
  auto result = ::cimgui::ImGui_DragInt(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragIntEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 1);
  if (!value) return;
  float speed = {};
  if (!ReadScalar(info, 2, &speed)) return;
  int minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_DragIntEx(
      label, value, speed, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragInt2) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 2);
  if (!value) return;
  auto result = ::cimgui::ImGui_DragInt2(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragInt2Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 2);
  if (!value) return;
  float speed = {};
  if (!ReadScalar(info, 2, &speed)) return;
  int minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_DragInt2Ex(
      label, value, speed, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragInt3) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 3);
  if (!value) return;
  auto result = ::cimgui::ImGui_DragInt3(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragInt3Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 3);
  if (!value) return;
  float speed = {};
  if (!ReadScalar(info, 2, &speed)) return;
  int minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_DragInt3Ex(
      label, value, speed, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragInt4) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 4);
  if (!value) return;
  auto result = ::cimgui::ImGui_DragInt4(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragInt4Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 4);
  if (!value) return;
  float speed = {};
  if (!ReadScalar(info, 2, &speed)) return;
  int minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_DragInt4Ex(
      label, value, speed, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragIntRange2) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* current_min = ReadInt32Array(info, 1, 1);
  if (!current_min) return;
  int* current_max = ReadInt32Array(info, 2, 1);
  if (!current_max) return;
  auto result = ::cimgui::ImGui_DragIntRange2(label, current_min, current_max);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragIntRange2Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* current_min = ReadInt32Array(info, 1, 1);
  if (!current_min) return;
  int* current_max = ReadInt32Array(info, 2, 1);
  if (!current_max) return;
  float speed = {};
  if (!ReadScalar(info, 3, &speed)) return;
  int minimum = {};
  if (!ReadScalar(info, 4, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 5, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 6, &format_utf8, &format, true)) return;
  std::string format_max_utf8;
  const char* format_max = nullptr;
  if (!ReadUtf8(info, 7, &format_max_utf8, &format_max, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 8, &flags)) return;
  auto result = ::cimgui::ImGui_DragIntRange2Ex(label,
                                                current_min,
                                                current_max,
                                                speed,
                                                minimum,
                                                maximum,
                                                format,
                                                format_max,
                                                flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragScalar) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  auto result = ::cimgui::ImGui_DragScalar(label, data_type, data);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragScalarEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  float speed = {};
  if (!ReadScalar(info, 3, &speed)) return;
  void* minimum = nullptr;
  if (!ReadPointer(info, 4, &minimum)) return;
  void* maximum = nullptr;
  if (!ReadPointer(info, 5, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 6, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 7, &flags)) return;
  auto result = ::cimgui::ImGui_DragScalarEx(
      label, data_type, data, speed, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragScalarN) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  int components = {};
  if (!ReadScalar(info, 3, &components)) return;
  auto result = ::cimgui::ImGui_DragScalarN(label, data_type, data, components);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(DragScalarNEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  int components = {};
  if (!ReadScalar(info, 3, &components)) return;
  float speed = {};
  if (!ReadScalar(info, 4, &speed)) return;
  void* minimum = nullptr;
  if (!ReadPointer(info, 5, &minimum)) return;
  void* maximum = nullptr;
  if (!ReadPointer(info, 6, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 7, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 8, &flags)) return;
  auto result = ::cimgui::ImGui_DragScalarNEx(label,
                                              data_type,
                                              data,
                                              components,
                                              speed,
                                              minimum,
                                              maximum,
                                              format,
                                              flags);
  info.GetReturnValue().Set(Nan::New(result));
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiDragWidgets) {
  sfmljs::SetMethod<DragFloat>(target, "DragFloat");
  sfmljs::SetMethod<DragFloatEx>(target, "DragFloatEx");
  sfmljs::SetMethod<DragFloat2>(target, "DragFloat2");
  sfmljs::SetMethod<DragFloat2Ex>(target, "DragFloat2Ex");
  sfmljs::SetMethod<DragFloat3>(target, "DragFloat3");
  sfmljs::SetMethod<DragFloat3Ex>(target, "DragFloat3Ex");
  sfmljs::SetMethod<DragFloat4>(target, "DragFloat4");
  sfmljs::SetMethod<DragFloat4Ex>(target, "DragFloat4Ex");
  sfmljs::SetMethod<DragFloatRange2>(target, "DragFloatRange2");
  sfmljs::SetMethod<DragFloatRange2Ex>(target, "DragFloatRange2Ex");
  sfmljs::SetMethod<DragInt>(target, "DragInt");
  sfmljs::SetMethod<DragIntEx>(target, "DragIntEx");
  sfmljs::SetMethod<DragInt2>(target, "DragInt2");
  sfmljs::SetMethod<DragInt2Ex>(target, "DragInt2Ex");
  sfmljs::SetMethod<DragInt3>(target, "DragInt3");
  sfmljs::SetMethod<DragInt3Ex>(target, "DragInt3Ex");
  sfmljs::SetMethod<DragInt4>(target, "DragInt4");
  sfmljs::SetMethod<DragInt4Ex>(target, "DragInt4Ex");
  sfmljs::SetMethod<DragIntRange2>(target, "DragIntRange2");
  sfmljs::SetMethod<DragIntRange2Ex>(target, "DragIntRange2Ex");
  sfmljs::SetMethod<DragScalar>(target, "DragScalar");
  sfmljs::SetMethod<DragScalarEx>(target, "DragScalarEx");
  sfmljs::SetMethod<DragScalarN>(target, "DragScalarN");
  sfmljs::SetMethod<DragScalarNEx>(target, "DragScalarNEx");
}

}  // namespace sfmlimgui
