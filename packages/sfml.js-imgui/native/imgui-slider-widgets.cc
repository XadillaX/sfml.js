// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(SliderFloat) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 1);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  auto result = ::cimgui::ImGui_SliderFloat(label, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderFloatEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 1);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_SliderFloatEx(
      label, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderFloat2) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 2);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  auto result = ::cimgui::ImGui_SliderFloat2(label, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderFloat2Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 2);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_SliderFloat2Ex(
      label, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderFloat3) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 3);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  auto result = ::cimgui::ImGui_SliderFloat3(label, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderFloat3Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 3);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_SliderFloat3Ex(
      label, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderFloat4) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 4);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  auto result = ::cimgui::ImGui_SliderFloat4(label, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderFloat4Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* value = ReadFloat32Array(info, 1, 4);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_SliderFloat4Ex(
      label, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderAngle) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* radians = ReadFloat32Array(info, 1, 1);
  if (!radians) return;
  auto result = ::cimgui::ImGui_SliderAngle(label, radians);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderAngleEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* radians = ReadFloat32Array(info, 1, 1);
  if (!radians) return;
  float degrees_min = {};
  if (!ReadScalar(info, 2, &degrees_min)) return;
  float degrees_max = {};
  if (!ReadScalar(info, 3, &degrees_max)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_SliderAngleEx(
      label, radians, degrees_min, degrees_max, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderInt) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 1);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  auto result = ::cimgui::ImGui_SliderInt(label, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderIntEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 1);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_SliderIntEx(
      label, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderInt2) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 2);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  auto result = ::cimgui::ImGui_SliderInt2(label, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderInt2Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 2);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_SliderInt2Ex(
      label, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderInt3) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 3);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  auto result = ::cimgui::ImGui_SliderInt3(label, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderInt3Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 3);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_SliderInt3Ex(
      label, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderInt4) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 4);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  auto result = ::cimgui::ImGui_SliderInt4(label, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderInt4Ex) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 4);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 2, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 3, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 4, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  auto result = ::cimgui::ImGui_SliderInt4Ex(
      label, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderScalar) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  void* minimum = nullptr;
  if (!ReadRequiredPointer(info, 3, &minimum)) return;
  void* maximum = nullptr;
  if (!ReadRequiredPointer(info, 4, &maximum)) return;
  auto result =
      ::cimgui::ImGui_SliderScalar(label, data_type, data, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderScalarEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  void* minimum = nullptr;
  if (!ReadRequiredPointer(info, 3, &minimum)) return;
  void* maximum = nullptr;
  if (!ReadRequiredPointer(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_SliderScalarEx(
      label, data_type, data, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderScalarN) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  int components = {};
  if (!ReadScalar(info, 3, &components)) return;
  void* minimum = nullptr;
  if (!ReadRequiredPointer(info, 4, &minimum)) return;
  void* maximum = nullptr;
  if (!ReadRequiredPointer(info, 5, &maximum)) return;
  auto result = ::cimgui::ImGui_SliderScalarN(
      label, data_type, data, components, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SliderScalarNEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 1, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 2, &data)) return;
  int components = {};
  if (!ReadScalar(info, 3, &components)) return;
  void* minimum = nullptr;
  if (!ReadRequiredPointer(info, 4, &minimum)) return;
  void* maximum = nullptr;
  if (!ReadRequiredPointer(info, 5, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 6, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 7, &flags)) return;
  auto result = ::cimgui::ImGui_SliderScalarNEx(
      label, data_type, data, components, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(VSliderFloat) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  float* value = ReadFloat32Array(info, 2, 1);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  auto result =
      ::cimgui::ImGui_VSliderFloat(label, size, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(VSliderFloatEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  float* value = ReadFloat32Array(info, 2, 1);
  if (!value) return;
  float minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  float maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_VSliderFloatEx(
      label, size, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(VSliderInt) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  int* value = ReadInt32Array(info, 2, 1);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  auto result =
      ::cimgui::ImGui_VSliderInt(label, size, value, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(VSliderIntEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  int* value = ReadInt32Array(info, 2, 1);
  if (!value) return;
  int minimum = {};
  if (!ReadScalar(info, 3, &minimum)) return;
  int maximum = {};
  if (!ReadScalar(info, 4, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 5, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 6, &flags)) return;
  auto result = ::cimgui::ImGui_VSliderIntEx(
      label, size, value, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(VSliderScalar) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 2, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 3, &data)) return;
  void* minimum = nullptr;
  if (!ReadRequiredPointer(info, 4, &minimum)) return;
  void* maximum = nullptr;
  if (!ReadRequiredPointer(info, 5, &maximum)) return;
  auto result = ::cimgui::ImGui_VSliderScalar(
      label, size, data_type, data, minimum, maximum);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(VSliderScalarEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  ImGuiDataType data_type = {};
  if (!ReadScalar(info, 2, &data_type)) return;
  void* data = nullptr;
  if (!ReadRequiredPointer(info, 3, &data)) return;
  void* minimum = nullptr;
  if (!ReadRequiredPointer(info, 4, &minimum)) return;
  void* maximum = nullptr;
  if (!ReadRequiredPointer(info, 5, &maximum)) return;
  std::string format_utf8;
  const char* format = nullptr;
  if (!ReadUtf8(info, 6, &format_utf8, &format, true)) return;
  ImGuiSliderFlags flags = {};
  if (!ReadScalar(info, 7, &flags)) return;
  auto result = ::cimgui::ImGui_VSliderScalarEx(
      label, size, data_type, data, minimum, maximum, format, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiSliderWidgets) {
  sfmljs::SetMethod<SliderFloat>(target, "SliderFloat");
  sfmljs::SetMethod<SliderFloatEx>(target, "SliderFloatEx");
  sfmljs::SetMethod<SliderFloat2>(target, "SliderFloat2");
  sfmljs::SetMethod<SliderFloat2Ex>(target, "SliderFloat2Ex");
  sfmljs::SetMethod<SliderFloat3>(target, "SliderFloat3");
  sfmljs::SetMethod<SliderFloat3Ex>(target, "SliderFloat3Ex");
  sfmljs::SetMethod<SliderFloat4>(target, "SliderFloat4");
  sfmljs::SetMethod<SliderFloat4Ex>(target, "SliderFloat4Ex");
  sfmljs::SetMethod<SliderAngle>(target, "SliderAngle");
  sfmljs::SetMethod<SliderAngleEx>(target, "SliderAngleEx");
  sfmljs::SetMethod<SliderInt>(target, "SliderInt");
  sfmljs::SetMethod<SliderIntEx>(target, "SliderIntEx");
  sfmljs::SetMethod<SliderInt2>(target, "SliderInt2");
  sfmljs::SetMethod<SliderInt2Ex>(target, "SliderInt2Ex");
  sfmljs::SetMethod<SliderInt3>(target, "SliderInt3");
  sfmljs::SetMethod<SliderInt3Ex>(target, "SliderInt3Ex");
  sfmljs::SetMethod<SliderInt4>(target, "SliderInt4");
  sfmljs::SetMethod<SliderInt4Ex>(target, "SliderInt4Ex");
  sfmljs::SetMethod<SliderScalar>(target, "SliderScalar");
  sfmljs::SetMethod<SliderScalarEx>(target, "SliderScalarEx");
  sfmljs::SetMethod<SliderScalarN>(target, "SliderScalarN");
  sfmljs::SetMethod<SliderScalarNEx>(target, "SliderScalarNEx");
  sfmljs::SetMethod<VSliderFloat>(target, "VSliderFloat");
  sfmljs::SetMethod<VSliderFloatEx>(target, "VSliderFloatEx");
  sfmljs::SetMethod<VSliderInt>(target, "VSliderInt");
  sfmljs::SetMethod<VSliderIntEx>(target, "VSliderIntEx");
  sfmljs::SetMethod<VSliderScalar>(target, "VSliderScalar");
  sfmljs::SetMethod<VSliderScalarEx>(target, "VSliderScalarEx");
}

}  // namespace sfmlimgui
