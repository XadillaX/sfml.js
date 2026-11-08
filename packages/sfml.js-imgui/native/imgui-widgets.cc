// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>
#include <vector>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(Button) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  auto result = ::cimgui::ImGui_Button(label);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ButtonEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  auto result = ::cimgui::ImGui_ButtonEx(label, size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SmallButton) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  auto result = ::cimgui::ImGui_SmallButton(label);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(InvisibleButton) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 1, &size)) return;
  ImGuiButtonFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_InvisibleButton(string_id, size, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ArrowButton) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImGuiDir direction = {};
  if (!ReadScalar(info, 1, &direction)) return;
  auto result = ::cimgui::ImGui_ArrowButton(string_id, direction);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(Checkbox) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  bool* value = ReadBoolArray(info, 1, 1);
  if (!value) return;
  auto result = ::cimgui::ImGui_Checkbox(label, value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(CheckboxFlagsIntPtr) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* flags = ReadInt32Array(info, 1, 1);
  if (!flags) return;
  int flags_value = {};
  if (!ReadScalar(info, 2, &flags_value)) return;
  auto result = ::cimgui::ImGui_CheckboxFlagsIntPtr(label, flags, flags_value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(CheckboxFlagsUintPtr) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  unsigned int* flags = ReadUint32Array(info, 1, 1);
  if (!flags) return;
  unsigned int flags_value = {};
  if (!ReadScalar(info, 2, &flags_value)) return;
  auto result = ::cimgui::ImGui_CheckboxFlagsUintPtr(label, flags, flags_value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(RadioButton) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  bool active = false;
  if (!ReadBool(info, 1, &active)) return;
  auto result = ::cimgui::ImGui_RadioButton(label, active);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(RadioButtonIntPtr) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* value = ReadInt32Array(info, 1, 1);
  if (!value) return;
  int button_value = {};
  if (!ReadScalar(info, 2, &button_value)) return;
  auto result = ::cimgui::ImGui_RadioButtonIntPtr(label, value, button_value);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ProgressBar) {
  float fraction = {};
  if (!ReadScalar(info, 0, &fraction)) return;
  cimgui::ImVec2 size_arg;
  if (!ReadImVec2(info, 1, &size_arg)) return;
  std::string overlay_utf8;
  const char* overlay = nullptr;
  if (!ReadUtf8(info, 2, &overlay_utf8, &overlay, true)) return;
  ::cimgui::ImGui_ProgressBar(fraction, size_arg, overlay);
}

NAN_METHOD(Bullet) {
  ::cimgui::ImGui_Bullet();
}

NAN_METHOD(TextLink) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  auto result = ::cimgui::ImGui_TextLink(label);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(TextLinkOpenURL) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  ::cimgui::ImGui_TextLinkOpenURL(label);
}

NAN_METHOD(TextLinkOpenURLEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  std::string url_utf8;
  const char* url = nullptr;
  if (!ReadUtf8(info, 1, &url_utf8, &url, true)) return;
  ::cimgui::ImGui_TextLinkOpenURLEx(label, url);
}

NAN_METHOD(Image) {
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 0, &user_texture_id)) return;
  cimgui::ImVec2 image_size;
  if (!ReadImVec2(info, 1, &image_size)) return;
  ::cimgui::ImGui_Image(user_texture_id, image_size);
}

NAN_METHOD(ImageEx) {
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 0, &user_texture_id)) return;
  cimgui::ImVec2 image_size;
  if (!ReadImVec2(info, 1, &image_size)) return;
  cimgui::ImVec2 uv0;
  if (!ReadImVec2(info, 2, &uv0)) return;
  cimgui::ImVec2 uv1;
  if (!ReadImVec2(info, 3, &uv1)) return;
  ::cimgui::ImGui_ImageEx(user_texture_id, image_size, uv0, uv1);
}

NAN_METHOD(ImageWithBg) {
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 0, &user_texture_id)) return;
  cimgui::ImVec2 image_size;
  if (!ReadImVec2(info, 1, &image_size)) return;
  ::cimgui::ImGui_ImageWithBg(user_texture_id, image_size);
}

NAN_METHOD(ImageWithBgEx) {
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 0, &user_texture_id)) return;
  cimgui::ImVec2 image_size;
  if (!ReadImVec2(info, 1, &image_size)) return;
  cimgui::ImVec2 uv0;
  if (!ReadImVec2(info, 2, &uv0)) return;
  cimgui::ImVec2 uv1;
  if (!ReadImVec2(info, 3, &uv1)) return;
  cimgui::ImVec4 background_color;
  if (!ReadImVec4(info, 4, &background_color)) return;
  cimgui::ImVec4 tint_color;
  if (!ReadImVec4(info, 5, &tint_color)) return;
  ::cimgui::ImGui_ImageWithBgEx(
      user_texture_id, image_size, uv0, uv1, background_color, tint_color);
}

NAN_METHOD(ImageButton) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 1, &user_texture_id)) return;
  cimgui::ImVec2 image_size;
  if (!ReadImVec2(info, 2, &image_size)) return;
  auto result =
      ::cimgui::ImGui_ImageButton(string_id, user_texture_id, image_size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ImageButtonEx) {
  std::string string_id_utf8;
  const char* string_id = nullptr;
  if (!ReadUtf8(info, 0, &string_id_utf8, &string_id, true)) return;
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 1, &user_texture_id)) return;
  cimgui::ImVec2 image_size;
  if (!ReadImVec2(info, 2, &image_size)) return;
  cimgui::ImVec2 uv0;
  if (!ReadImVec2(info, 3, &uv0)) return;
  cimgui::ImVec2 uv1;
  if (!ReadImVec2(info, 4, &uv1)) return;
  cimgui::ImVec4 background_color;
  if (!ReadImVec4(info, 5, &background_color)) return;
  cimgui::ImVec4 tint_color;
  if (!ReadImVec4(info, 6, &tint_color)) return;
  auto result = ::cimgui::ImGui_ImageButtonEx(string_id,
                                              user_texture_id,
                                              image_size,
                                              uv0,
                                              uv1,
                                              background_color,
                                              tint_color);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(BeginCombo) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  std::string preview_value_utf8;
  const char* preview_value = nullptr;
  if (!ReadUtf8(info, 1, &preview_value_utf8, &preview_value, true)) return;
  ImGuiComboFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_BeginCombo(label, preview_value, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndCombo) {
  ::cimgui::ImGui_EndCombo();
}

NAN_METHOD(ComboChar) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* current_item = ReadInt32Array(info, 1, 1);
  if (!current_item) return;
  std::vector<std::string> items_storage;
  std::vector<const char*> items_pointers;
  if (!ReadStringArray(info, 2, &items_storage, &items_pointers)) return;
  const char* const* items = items_pointers.data();
  int items_count = {};
  if (!ReadScalar(info, 3, &items_count)) return;
  auto result =
      ::cimgui::ImGui_ComboChar(label, current_item, items, items_count);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ComboCharEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* current_item = ReadInt32Array(info, 1, 1);
  if (!current_item) return;
  std::vector<std::string> items_storage;
  std::vector<const char*> items_pointers;
  if (!ReadStringArray(info, 2, &items_storage, &items_pointers)) return;
  const char* const* items = items_pointers.data();
  int items_count = {};
  if (!ReadScalar(info, 3, &items_count)) return;
  int popup_max_height_in_items = {};
  if (!ReadScalar(info, 4, &popup_max_height_in_items)) return;
  auto result = ::cimgui::ImGui_ComboCharEx(
      label, current_item, items, items_count, popup_max_height_in_items);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(Combo) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* current_item = ReadInt32Array(info, 1, 1);
  if (!current_item) return;
  std::string items_separated_by_zeros_utf8;
  const char* items_separated_by_zeros = nullptr;
  if (!ReadUtf8(info,
                2,
                &items_separated_by_zeros_utf8,
                &items_separated_by_zeros,
                true))
    return;
  auto result =
      ::cimgui::ImGui_Combo(label, current_item, items_separated_by_zeros);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ComboEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  int* current_item = ReadInt32Array(info, 1, 1);
  if (!current_item) return;
  std::string items_separated_by_zeros_utf8;
  const char* items_separated_by_zeros = nullptr;
  if (!ReadUtf8(info,
                2,
                &items_separated_by_zeros_utf8,
                &items_separated_by_zeros,
                true))
    return;
  int popup_max_height_in_items = {};
  if (!ReadScalar(info, 3, &popup_max_height_in_items)) return;
  auto result = ::cimgui::ImGui_ComboEx(
      label, current_item, items_separated_by_zeros, popup_max_height_in_items);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ColorEdit3) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* color = ReadFloat32Array(info, 1, 3);
  if (!color) return;
  ImGuiColorEditFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_ColorEdit3(label, color, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ColorEdit4) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* color = ReadFloat32Array(info, 1, 4);
  if (!color) return;
  ImGuiColorEditFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_ColorEdit4(label, color, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ColorPicker3) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* color = ReadFloat32Array(info, 1, 3);
  if (!color) return;
  ImGuiColorEditFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_ColorPicker3(label, color, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ColorPicker4) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* color = ReadFloat32Array(info, 1, 4);
  if (!color) return;
  ImGuiColorEditFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  float* reference_color = nullptr;
  if (!info[3]->IsUndefined() && !info[3]->IsNull()) {
    const size_t reference_components =
        (flags & ImGuiColorEditFlags_NoAlpha) ? 3 : 4;
    reference_color = ReadFloat32Array(info, 3, reference_components);
    if (!reference_color) return;
  }
  auto result =
      ::cimgui::ImGui_ColorPicker4(label, color, flags, reference_color);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ColorButton) {
  std::string description_id_utf8;
  const char* description_id = nullptr;
  if (!ReadUtf8(info, 0, &description_id_utf8, &description_id, true)) return;
  cimgui::ImVec4 color;
  if (!ReadImVec4(info, 1, &color)) return;
  ImGuiColorEditFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  auto result = ::cimgui::ImGui_ColorButton(description_id, color, flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ColorButtonEx) {
  std::string description_id_utf8;
  const char* description_id = nullptr;
  if (!ReadUtf8(info, 0, &description_id_utf8, &description_id, true)) return;
  cimgui::ImVec4 color;
  if (!ReadImVec4(info, 1, &color)) return;
  ImGuiColorEditFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 3, &size)) return;
  auto result =
      ::cimgui::ImGui_ColorButtonEx(description_id, color, flags, size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SetColorEditOptions) {
  ImGuiColorEditFlags flags = {};
  if (!ReadScalar(info, 0, &flags)) return;
  ::cimgui::ImGui_SetColorEditOptions(flags);
}

NAN_METHOD(PlotLines) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* values = ReadFloat32Array(info, 1, 1);
  if (!values) return;
  int values_count = {};
  if (!ReadScalar(info, 2, &values_count)) return;
  ::cimgui::ImGui_PlotLines(label, values, values_count);
}

NAN_METHOD(PlotLinesEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* values = ReadFloat32Array(info, 1, 1);
  if (!values) return;
  int values_count = {};
  if (!ReadScalar(info, 2, &values_count)) return;
  int values_offset = {};
  if (!ReadScalar(info, 3, &values_offset)) return;
  std::string overlay_text_utf8;
  const char* overlay_text = nullptr;
  if (!ReadUtf8(info, 4, &overlay_text_utf8, &overlay_text, true)) return;
  float scale_min = {};
  if (!ReadScalar(info, 5, &scale_min)) return;
  float scale_max = {};
  if (!ReadScalar(info, 6, &scale_max)) return;
  cimgui::ImVec2 graph_size;
  if (!ReadImVec2(info, 7, &graph_size)) return;
  int stride = {};
  if (!ReadScalar(info, 8, &stride)) return;
  ::cimgui::ImGui_PlotLinesEx(label,
                              values,
                              values_count,
                              values_offset,
                              overlay_text,
                              scale_min,
                              scale_max,
                              graph_size,
                              stride);
}

NAN_METHOD(PlotHistogram) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* values = ReadFloat32Array(info, 1, 1);
  if (!values) return;
  int values_count = {};
  if (!ReadScalar(info, 2, &values_count)) return;
  ::cimgui::ImGui_PlotHistogram(label, values, values_count);
}

NAN_METHOD(PlotHistogramEx) {
  std::string label_utf8;
  const char* label = nullptr;
  if (!ReadUtf8(info, 0, &label_utf8, &label, true)) return;
  float* values = ReadFloat32Array(info, 1, 1);
  if (!values) return;
  int values_count = {};
  if (!ReadScalar(info, 2, &values_count)) return;
  int values_offset = {};
  if (!ReadScalar(info, 3, &values_offset)) return;
  std::string overlay_text_utf8;
  const char* overlay_text = nullptr;
  if (!ReadUtf8(info, 4, &overlay_text_utf8, &overlay_text, true)) return;
  float scale_min = {};
  if (!ReadScalar(info, 5, &scale_min)) return;
  float scale_max = {};
  if (!ReadScalar(info, 6, &scale_max)) return;
  cimgui::ImVec2 graph_size;
  if (!ReadImVec2(info, 7, &graph_size)) return;
  int stride = {};
  if (!ReadScalar(info, 8, &stride)) return;
  ::cimgui::ImGui_PlotHistogramEx(label,
                                  values,
                                  values_count,
                                  values_offset,
                                  overlay_text,
                                  scale_min,
                                  scale_max,
                                  graph_size,
                                  stride);
}

NAN_METHOD(ImageImVec4) {
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 0, &user_texture_id)) return;
  cimgui::ImVec2 image_size;
  if (!ReadImVec2(info, 1, &image_size)) return;
  cimgui::ImVec2 uv0;
  if (!ReadImVec2(info, 2, &uv0)) return;
  cimgui::ImVec2 uv1;
  if (!ReadImVec2(info, 3, &uv1)) return;
  cimgui::ImVec4 tint_color;
  if (!ReadImVec4(info, 4, &tint_color)) return;
  cimgui::ImVec4 border_color;
  if (!ReadImVec4(info, 5, &border_color)) return;
  ::cimgui::ImGui_ImageImVec4(
      user_texture_id, image_size, uv0, uv1, tint_color, border_color);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiWidgets) {
  sfmljs::SetMethod<Button>(target, "Button");
  sfmljs::SetMethod<ButtonEx>(target, "ButtonEx");
  sfmljs::SetMethod<SmallButton>(target, "SmallButton");
  sfmljs::SetMethod<InvisibleButton>(target, "InvisibleButton");
  sfmljs::SetMethod<ArrowButton>(target, "ArrowButton");
  sfmljs::SetMethod<Checkbox>(target, "Checkbox");
  sfmljs::SetMethod<CheckboxFlagsIntPtr>(target, "CheckboxFlagsIntPtr");
  sfmljs::SetMethod<CheckboxFlagsUintPtr>(target, "CheckboxFlagsUintPtr");
  sfmljs::SetMethod<RadioButton>(target, "RadioButton");
  sfmljs::SetMethod<RadioButtonIntPtr>(target, "RadioButtonIntPtr");
  sfmljs::SetMethod<ProgressBar>(target, "ProgressBar");
  sfmljs::SetMethod<Bullet>(target, "Bullet");
  sfmljs::SetMethod<TextLink>(target, "TextLink");
  sfmljs::SetMethod<TextLinkOpenURL>(target, "TextLinkOpenURL");
  sfmljs::SetMethod<TextLinkOpenURLEx>(target, "TextLinkOpenURLEx");
  sfmljs::SetMethod<Image>(target, "Image");
  sfmljs::SetMethod<ImageEx>(target, "ImageEx");
  sfmljs::SetMethod<ImageWithBg>(target, "ImageWithBg");
  sfmljs::SetMethod<ImageWithBgEx>(target, "ImageWithBgEx");
  sfmljs::SetMethod<ImageButton>(target, "ImageButton");
  sfmljs::SetMethod<ImageButtonEx>(target, "ImageButtonEx");
  sfmljs::SetMethod<BeginCombo>(target, "BeginCombo");
  sfmljs::SetMethod<EndCombo>(target, "EndCombo");
  sfmljs::SetMethod<ComboChar>(target, "ComboChar");
  sfmljs::SetMethod<ComboCharEx>(target, "ComboCharEx");
  sfmljs::SetMethod<Combo>(target, "Combo");
  sfmljs::SetMethod<ComboEx>(target, "ComboEx");
  sfmljs::SetMethod<ColorEdit3>(target, "ColorEdit3");
  sfmljs::SetMethod<ColorEdit4>(target, "ColorEdit4");
  sfmljs::SetMethod<ColorPicker3>(target, "ColorPicker3");
  sfmljs::SetMethod<ColorPicker4>(target, "ColorPicker4");
  sfmljs::SetMethod<ColorButton>(target, "ColorButton");
  sfmljs::SetMethod<ColorButtonEx>(target, "ColorButtonEx");
  sfmljs::SetMethod<SetColorEditOptions>(target, "SetColorEditOptions");
  sfmljs::SetMethod<PlotLines>(target, "PlotLines");
  sfmljs::SetMethod<PlotLinesEx>(target, "PlotLinesEx");
  sfmljs::SetMethod<PlotHistogram>(target, "PlotHistogram");
  sfmljs::SetMethod<PlotHistogramEx>(target, "PlotHistogramEx");
  sfmljs::SetMethod<ImageImVec4>(target, "ImageImVec4");
}

}  // namespace sfmlimgui
