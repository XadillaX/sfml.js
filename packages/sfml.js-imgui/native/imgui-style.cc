// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(GetStyle) {
  auto result = ::cimgui::ImGui_GetStyle();
  ReturnStruct<cimgui::ImGuiStyle>(info, result);
}

NAN_METHOD(StyleColorsDark) {
  cimgui::ImGuiStyle* destination = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    destination = ReadStruct<cimgui::ImGuiStyle>(info, 0);
    if (!destination) return;
  }
  ::cimgui::ImGui_StyleColorsDark(destination);
}

NAN_METHOD(StyleColorsLight) {
  cimgui::ImGuiStyle* destination = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    destination = ReadStruct<cimgui::ImGuiStyle>(info, 0);
    if (!destination) return;
  }
  ::cimgui::ImGui_StyleColorsLight(destination);
}

NAN_METHOD(StyleColorsClassic) {
  cimgui::ImGuiStyle* destination = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    destination = ReadStruct<cimgui::ImGuiStyle>(info, 0);
    if (!destination) return;
  }
  ::cimgui::ImGui_StyleColorsClassic(destination);
}

NAN_METHOD(PushStyleColor) {
  ImGuiCol index = {};
  if (!ReadScalar(info, 0, &index)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 1, &color)) return;
  ::cimgui::ImGui_PushStyleColor(index, color);
}

NAN_METHOD(PushStyleColorImVec4) {
  ImGuiCol index = {};
  if (!ReadScalar(info, 0, &index)) return;
  cimgui::ImVec4 color;
  if (!ReadImVec4(info, 1, &color)) return;
  ::cimgui::ImGui_PushStyleColorImVec4(index, color);
}

NAN_METHOD(PopStyleColor) {
  ::cimgui::ImGui_PopStyleColor();
}

NAN_METHOD(PopStyleColorEx) {
  int count = {};
  if (!ReadScalar(info, 0, &count)) return;
  ::cimgui::ImGui_PopStyleColorEx(count);
}

NAN_METHOD(PushStyleVar) {
  ImGuiStyleVar index = {};
  if (!ReadScalar(info, 0, &index)) return;
  float value = {};
  if (!ReadScalar(info, 1, &value)) return;
  ::cimgui::ImGui_PushStyleVar(index, value);
}

NAN_METHOD(PushStyleVarImVec2) {
  ImGuiStyleVar index = {};
  if (!ReadScalar(info, 0, &index)) return;
  cimgui::ImVec2 value;
  if (!ReadImVec2(info, 1, &value)) return;
  ::cimgui::ImGui_PushStyleVarImVec2(index, value);
}

NAN_METHOD(PushStyleVarX) {
  ImGuiStyleVar index = {};
  if (!ReadScalar(info, 0, &index)) return;
  float value_x = {};
  if (!ReadScalar(info, 1, &value_x)) return;
  ::cimgui::ImGui_PushStyleVarX(index, value_x);
}

NAN_METHOD(PushStyleVarY) {
  ImGuiStyleVar index = {};
  if (!ReadScalar(info, 0, &index)) return;
  float value_y = {};
  if (!ReadScalar(info, 1, &value_y)) return;
  ::cimgui::ImGui_PushStyleVarY(index, value_y);
}

NAN_METHOD(PopStyleVar) {
  ::cimgui::ImGui_PopStyleVar();
}

NAN_METHOD(PopStyleVarEx) {
  int count = {};
  if (!ReadScalar(info, 0, &count)) return;
  ::cimgui::ImGui_PopStyleVarEx(count);
}

NAN_METHOD(GetColorU32) {
  ImGuiCol index = {};
  if (!ReadScalar(info, 0, &index)) return;
  auto result = ::cimgui::ImGui_GetColorU32(index);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetColorU32Ex) {
  ImGuiCol index = {};
  if (!ReadScalar(info, 0, &index)) return;
  float alpha_multiplier = {};
  if (!ReadScalar(info, 1, &alpha_multiplier)) return;
  auto result = ::cimgui::ImGui_GetColorU32Ex(index, alpha_multiplier);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetColorU32ImVec4) {
  cimgui::ImVec4 color;
  if (!ReadImVec4(info, 0, &color)) return;
  auto result = ::cimgui::ImGui_GetColorU32ImVec4(color);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetColorU32ImU32) {
  ImU32 color = {};
  if (!ReadScalar(info, 0, &color)) return;
  auto result = ::cimgui::ImGui_GetColorU32ImU32(color);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetColorU32ImU32Ex) {
  ImU32 color = {};
  if (!ReadScalar(info, 0, &color)) return;
  float alpha_multiplier = {};
  if (!ReadScalar(info, 1, &alpha_multiplier)) return;
  auto result = ::cimgui::ImGui_GetColorU32ImU32Ex(color, alpha_multiplier);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetStyleColorVec4) {
  ImGuiCol index = {};
  if (!ReadScalar(info, 0, &index)) return;
  auto result = ::cimgui::ImGui_GetStyleColorVec4(index);
  if (result) {
    ReturnVec4(info, *result);
  } else {
    info.GetReturnValue().Set(Nan::Null());
  }
}

NAN_METHOD(BeginDisabled) {
  bool disabled = false;
  if (!ReadBool(info, 0, &disabled)) return;
  ::cimgui::ImGui_BeginDisabled(disabled);
}

NAN_METHOD(EndDisabled) {
  ::cimgui::ImGui_EndDisabled();
}

NAN_METHOD(GetStyleColorName) {
  ImGuiCol index = {};
  if (!ReadScalar(info, 0, &index)) return;
  auto result = ::cimgui::ImGui_GetStyleColorName(index);
  ReturnString(info, result);
}

NAN_METHOD(ColorConvertU32ToFloat4) {
  ImU32 input = {};
  if (!ReadScalar(info, 0, &input)) return;
  auto result = ::cimgui::ImGui_ColorConvertU32ToFloat4(input);
  ReturnVec4(info, result);
}

NAN_METHOD(ColorConvertFloat4ToU32) {
  cimgui::ImVec4 input;
  if (!ReadImVec4(info, 0, &input)) return;
  auto result = ::cimgui::ImGui_ColorConvertFloat4ToU32(input);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(ColorConvertRGBtoHSV) {
  float red = {};
  if (!ReadScalar(info, 0, &red)) return;
  float green = {};
  if (!ReadScalar(info, 1, &green)) return;
  float blue = {};
  if (!ReadScalar(info, 2, &blue)) return;
  float* out_hue = ReadFloat32Array(info, 3, 1);
  if (!out_hue) return;
  float* out_saturation = ReadFloat32Array(info, 4, 1);
  if (!out_saturation) return;
  float* out_value = ReadFloat32Array(info, 5, 1);
  if (!out_value) return;
  ::cimgui::ImGui_ColorConvertRGBtoHSV(
      red, green, blue, out_hue, out_saturation, out_value);
}

NAN_METHOD(ColorConvertHSVtoRGB) {
  float hue = {};
  if (!ReadScalar(info, 0, &hue)) return;
  float saturation = {};
  if (!ReadScalar(info, 1, &saturation)) return;
  float value = {};
  if (!ReadScalar(info, 2, &value)) return;
  float* out_red = ReadFloat32Array(info, 3, 1);
  if (!out_red) return;
  float* out_green = ReadFloat32Array(info, 4, 1);
  if (!out_green) return;
  float* out_blue = ReadFloat32Array(info, 5, 1);
  if (!out_blue) return;
  ::cimgui::ImGui_ColorConvertHSVtoRGB(
      hue, saturation, value, out_red, out_green, out_blue);
}

NAN_METHOD(StyleScaleAllSizes) {
  cimgui::ImGuiStyle* style = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    style = ReadStruct<cimgui::ImGuiStyle>(info, 0);
    if (!style) return;
  }
  float scale_factor = {};
  if (!ReadScalar(info, 1, &scale_factor)) return;
  ::cimgui::ImGuiStyle_ScaleAllSizes(style, scale_factor);
}

NAN_METHOD(ImColorHSV) {
  float hue = {};
  if (!ReadScalar(info, 0, &hue)) return;
  float saturation = {};
  if (!ReadScalar(info, 1, &saturation)) return;
  float value = {};
  if (!ReadScalar(info, 2, &value)) return;
  float alpha = {};
  if (!ReadScalar(info, 3, &alpha)) return;
  auto result = ::cimgui::ImColor_HSV(hue, saturation, value, alpha);
  ReturnVec4(info, result.Value);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiStyle) {
  sfmljs::SetMethod<GetStyle>(target, "GetStyle");
  sfmljs::SetMethod<StyleColorsDark>(target, "StyleColorsDark");
  sfmljs::SetMethod<StyleColorsLight>(target, "StyleColorsLight");
  sfmljs::SetMethod<StyleColorsClassic>(target, "StyleColorsClassic");
  sfmljs::SetMethod<PushStyleColor>(target, "PushStyleColor");
  sfmljs::SetMethod<PushStyleColorImVec4>(target, "PushStyleColorImVec4");
  sfmljs::SetMethod<PopStyleColor>(target, "PopStyleColor");
  sfmljs::SetMethod<PopStyleColorEx>(target, "PopStyleColorEx");
  sfmljs::SetMethod<PushStyleVar>(target, "PushStyleVar");
  sfmljs::SetMethod<PushStyleVarImVec2>(target, "PushStyleVarImVec2");
  sfmljs::SetMethod<PushStyleVarX>(target, "PushStyleVarX");
  sfmljs::SetMethod<PushStyleVarY>(target, "PushStyleVarY");
  sfmljs::SetMethod<PopStyleVar>(target, "PopStyleVar");
  sfmljs::SetMethod<PopStyleVarEx>(target, "PopStyleVarEx");
  sfmljs::SetMethod<GetColorU32>(target, "GetColorU32");
  sfmljs::SetMethod<GetColorU32Ex>(target, "GetColorU32Ex");
  sfmljs::SetMethod<GetColorU32ImVec4>(target, "GetColorU32ImVec4");
  sfmljs::SetMethod<GetColorU32ImU32>(target, "GetColorU32ImU32");
  sfmljs::SetMethod<GetColorU32ImU32Ex>(target, "GetColorU32ImU32Ex");
  sfmljs::SetMethod<GetStyleColorVec4>(target, "GetStyleColorVec4");
  sfmljs::SetMethod<BeginDisabled>(target, "BeginDisabled");
  sfmljs::SetMethod<EndDisabled>(target, "EndDisabled");
  sfmljs::SetMethod<GetStyleColorName>(target, "GetStyleColorName");
  sfmljs::SetMethod<ColorConvertU32ToFloat4>(target, "ColorConvertU32ToFloat4");
  sfmljs::SetMethod<ColorConvertFloat4ToU32>(target, "ColorConvertFloat4ToU32");
  sfmljs::SetMethod<ColorConvertRGBtoHSV>(target, "ColorConvertRGBtoHSV");
  sfmljs::SetMethod<ColorConvertHSVtoRGB>(target, "ColorConvertHSVtoRGB");
  sfmljs::SetMethod<StyleScaleAllSizes>(target, "Style_ScaleAllSizes");
  sfmljs::SetMethod<ImColorHSV>(target, "ImColor_HSV");
}

}  // namespace sfmlimgui
