// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(PushItemWidth) {
  float item_width = {};
  if (!ReadScalar(info, 0, &item_width)) return;
  ::cimgui::ImGui_PushItemWidth(item_width);
}

NAN_METHOD(PopItemWidth) {
  ::cimgui::ImGui_PopItemWidth();
}

NAN_METHOD(SetNextItemWidth) {
  float item_width = {};
  if (!ReadScalar(info, 0, &item_width)) return;
  ::cimgui::ImGui_SetNextItemWidth(item_width);
}

NAN_METHOD(CalcItemWidth) {
  auto result = ::cimgui::ImGui_CalcItemWidth();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(PushTextWrapPos) {
  float wrap_local_pos_x = {};
  if (!ReadScalar(info, 0, &wrap_local_pos_x)) return;
  ::cimgui::ImGui_PushTextWrapPos(wrap_local_pos_x);
}

NAN_METHOD(PopTextWrapPos) {
  ::cimgui::ImGui_PopTextWrapPos();
}

NAN_METHOD(GetCursorScreenPos) {
  auto result = ::cimgui::ImGui_GetCursorScreenPos();
  ReturnVec2(info, result);
}

NAN_METHOD(SetCursorScreenPos) {
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 0, &position)) return;
  ::cimgui::ImGui_SetCursorScreenPos(position);
}

NAN_METHOD(GetContentRegionAvail) {
  auto result = ::cimgui::ImGui_GetContentRegionAvail();
  ReturnVec2(info, result);
}

NAN_METHOD(GetCursorPos) {
  auto result = ::cimgui::ImGui_GetCursorPos();
  ReturnVec2(info, result);
}

NAN_METHOD(GetCursorPosX) {
  auto result = ::cimgui::ImGui_GetCursorPosX();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetCursorPosY) {
  auto result = ::cimgui::ImGui_GetCursorPosY();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(SetCursorPos) {
  cimgui::ImVec2 local_pos;
  if (!ReadImVec2(info, 0, &local_pos)) return;
  ::cimgui::ImGui_SetCursorPos(local_pos);
}

NAN_METHOD(SetCursorPosX) {
  float local_x = {};
  if (!ReadScalar(info, 0, &local_x)) return;
  ::cimgui::ImGui_SetCursorPosX(local_x);
}

NAN_METHOD(SetCursorPosY) {
  float local_y = {};
  if (!ReadScalar(info, 0, &local_y)) return;
  ::cimgui::ImGui_SetCursorPosY(local_y);
}

NAN_METHOD(GetCursorStartPos) {
  auto result = ::cimgui::ImGui_GetCursorStartPos();
  ReturnVec2(info, result);
}

NAN_METHOD(Separator) {
  ::cimgui::ImGui_Separator();
}

NAN_METHOD(SameLine) {
  ::cimgui::ImGui_SameLine();
}

NAN_METHOD(SameLineEx) {
  float offset_from_start_x = {};
  if (!ReadScalar(info, 0, &offset_from_start_x)) return;
  float spacing = {};
  if (!ReadScalar(info, 1, &spacing)) return;
  ::cimgui::ImGui_SameLineEx(offset_from_start_x, spacing);
}

NAN_METHOD(NewLine) {
  ::cimgui::ImGui_NewLine();
}

NAN_METHOD(Spacing) {
  ::cimgui::ImGui_Spacing();
}

NAN_METHOD(Dummy) {
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 0, &size)) return;
  ::cimgui::ImGui_Dummy(size);
}

NAN_METHOD(Indent) {
  ::cimgui::ImGui_Indent();
}

NAN_METHOD(IndentEx) {
  float indent_width = {};
  if (!ReadScalar(info, 0, &indent_width)) return;
  ::cimgui::ImGui_IndentEx(indent_width);
}

NAN_METHOD(Unindent) {
  ::cimgui::ImGui_Unindent();
}

NAN_METHOD(UnindentEx) {
  float indent_width = {};
  if (!ReadScalar(info, 0, &indent_width)) return;
  ::cimgui::ImGui_UnindentEx(indent_width);
}

NAN_METHOD(BeginGroup) {
  ::cimgui::ImGui_BeginGroup();
}

NAN_METHOD(EndGroup) {
  ::cimgui::ImGui_EndGroup();
}

NAN_METHOD(AlignTextToFramePadding) {
  ::cimgui::ImGui_AlignTextToFramePadding();
}

NAN_METHOD(GetTextLineHeight) {
  auto result = ::cimgui::ImGui_GetTextLineHeight();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetTextLineHeightWithSpacing) {
  auto result = ::cimgui::ImGui_GetTextLineHeightWithSpacing();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetFrameHeight) {
  auto result = ::cimgui::ImGui_GetFrameHeight();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetFrameHeightWithSpacing) {
  auto result = ::cimgui::ImGui_GetFrameHeightWithSpacing();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(IsRectVisibleBySize) {
  cimgui::ImVec2 size;
  if (!ReadImVec2(info, 0, &size)) return;
  auto result = ::cimgui::ImGui_IsRectVisibleBySize(size);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(IsRectVisible) {
  cimgui::ImVec2 rect_min;
  if (!ReadImVec2(info, 0, &rect_min)) return;
  cimgui::ImVec2 rect_max;
  if (!ReadImVec2(info, 1, &rect_max)) return;
  auto result = ::cimgui::ImGui_IsRectVisible(rect_min, rect_max);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ListClipperBegin) {
  cimgui::ImGuiListClipper* clipper = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    clipper = ReadStruct<cimgui::ImGuiListClipper>(info, 0);
    if (!clipper) return;
  }
  int items_count = {};
  if (!ReadScalar(info, 1, &items_count)) return;
  float items_height = {};
  if (!ReadScalar(info, 2, &items_height)) return;
  ::cimgui::ImGuiListClipper_Begin(clipper, items_count, items_height);
}

NAN_METHOD(ListClipperEnd) {
  cimgui::ImGuiListClipper* clipper = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    clipper = ReadStruct<cimgui::ImGuiListClipper>(info, 0);
    if (!clipper) return;
  }
  ::cimgui::ImGuiListClipper_End(clipper);
}

NAN_METHOD(ListClipperStep) {
  cimgui::ImGuiListClipper* clipper = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    clipper = ReadStruct<cimgui::ImGuiListClipper>(info, 0);
    if (!clipper) return;
  }
  auto result = ::cimgui::ImGuiListClipper_Step(clipper);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(ListClipperIncludeItemByIndex) {
  cimgui::ImGuiListClipper* clipper = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    clipper = ReadStruct<cimgui::ImGuiListClipper>(info, 0);
    if (!clipper) return;
  }
  int item_index = {};
  if (!ReadScalar(info, 1, &item_index)) return;
  ::cimgui::ImGuiListClipper_IncludeItemByIndex(clipper, item_index);
}

NAN_METHOD(ListClipperIncludeItemsByIndex) {
  cimgui::ImGuiListClipper* clipper = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    clipper = ReadStruct<cimgui::ImGuiListClipper>(info, 0);
    if (!clipper) return;
  }
  int item_begin = {};
  if (!ReadScalar(info, 1, &item_begin)) return;
  int item_end = {};
  if (!ReadScalar(info, 2, &item_end)) return;
  ::cimgui::ImGuiListClipper_IncludeItemsByIndex(clipper, item_begin, item_end);
}

NAN_METHOD(ListClipperSeekCursorForItem) {
  cimgui::ImGuiListClipper* clipper = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    clipper = ReadStruct<cimgui::ImGuiListClipper>(info, 0);
    if (!clipper) return;
  }
  int item_index = {};
  if (!ReadScalar(info, 1, &item_index)) return;
  ::cimgui::ImGuiListClipper_SeekCursorForItem(clipper, item_index);
}

NAN_METHOD(ListClipperIncludeRangeByIndices) {
  cimgui::ImGuiListClipper* clipper = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    clipper = ReadStruct<cimgui::ImGuiListClipper>(info, 0);
    if (!clipper) return;
  }
  int item_begin = {};
  if (!ReadScalar(info, 1, &item_begin)) return;
  int item_end = {};
  if (!ReadScalar(info, 2, &item_end)) return;
  ::cimgui::ImGuiListClipper_IncludeRangeByIndices(
      clipper, item_begin, item_end);
}

NAN_METHOD(ListClipperForceDisplayRangeByIndices) {
  cimgui::ImGuiListClipper* clipper = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    clipper = ReadStruct<cimgui::ImGuiListClipper>(info, 0);
    if (!clipper) return;
  }
  int item_begin = {};
  if (!ReadScalar(info, 1, &item_begin)) return;
  int item_end = {};
  if (!ReadScalar(info, 2, &item_end)) return;
  ::cimgui::ImGuiListClipper_ForceDisplayRangeByIndices(
      clipper, item_begin, item_end);
}

NAN_METHOD(GetContentRegionMax) {
  auto result = ::cimgui::ImGui_GetContentRegionMax();
  ReturnVec2(info, result);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiLayout) {
  sfmljs::SetMethod<PushItemWidth>(target, "PushItemWidth");
  sfmljs::SetMethod<PopItemWidth>(target, "PopItemWidth");
  sfmljs::SetMethod<SetNextItemWidth>(target, "SetNextItemWidth");
  sfmljs::SetMethod<CalcItemWidth>(target, "CalcItemWidth");
  sfmljs::SetMethod<PushTextWrapPos>(target, "PushTextWrapPos");
  sfmljs::SetMethod<PopTextWrapPos>(target, "PopTextWrapPos");
  sfmljs::SetMethod<GetCursorScreenPos>(target, "GetCursorScreenPos");
  sfmljs::SetMethod<SetCursorScreenPos>(target, "SetCursorScreenPos");
  sfmljs::SetMethod<GetContentRegionAvail>(target, "GetContentRegionAvail");
  sfmljs::SetMethod<GetCursorPos>(target, "GetCursorPos");
  sfmljs::SetMethod<GetCursorPosX>(target, "GetCursorPosX");
  sfmljs::SetMethod<GetCursorPosY>(target, "GetCursorPosY");
  sfmljs::SetMethod<SetCursorPos>(target, "SetCursorPos");
  sfmljs::SetMethod<SetCursorPosX>(target, "SetCursorPosX");
  sfmljs::SetMethod<SetCursorPosY>(target, "SetCursorPosY");
  sfmljs::SetMethod<GetCursorStartPos>(target, "GetCursorStartPos");
  sfmljs::SetMethod<Separator>(target, "Separator");
  sfmljs::SetMethod<SameLine>(target, "SameLine");
  sfmljs::SetMethod<SameLineEx>(target, "SameLineEx");
  sfmljs::SetMethod<NewLine>(target, "NewLine");
  sfmljs::SetMethod<Spacing>(target, "Spacing");
  sfmljs::SetMethod<Dummy>(target, "Dummy");
  sfmljs::SetMethod<Indent>(target, "Indent");
  sfmljs::SetMethod<IndentEx>(target, "IndentEx");
  sfmljs::SetMethod<Unindent>(target, "Unindent");
  sfmljs::SetMethod<UnindentEx>(target, "UnindentEx");
  sfmljs::SetMethod<BeginGroup>(target, "BeginGroup");
  sfmljs::SetMethod<EndGroup>(target, "EndGroup");
  sfmljs::SetMethod<AlignTextToFramePadding>(target, "AlignTextToFramePadding");
  sfmljs::SetMethod<GetTextLineHeight>(target, "GetTextLineHeight");
  sfmljs::SetMethod<GetTextLineHeightWithSpacing>(
      target, "GetTextLineHeightWithSpacing");
  sfmljs::SetMethod<GetFrameHeight>(target, "GetFrameHeight");
  sfmljs::SetMethod<GetFrameHeightWithSpacing>(target,
                                               "GetFrameHeightWithSpacing");
  sfmljs::SetMethod<IsRectVisibleBySize>(target, "IsRectVisibleBySize");
  sfmljs::SetMethod<IsRectVisible>(target, "IsRectVisible");
  sfmljs::SetMethod<ListClipperBegin>(target, "ListClipper_Begin");
  sfmljs::SetMethod<ListClipperEnd>(target, "ListClipper_End");
  sfmljs::SetMethod<ListClipperStep>(target, "ListClipper_Step");
  sfmljs::SetMethod<ListClipperIncludeItemByIndex>(
      target, "ListClipper_IncludeItemByIndex");
  sfmljs::SetMethod<ListClipperIncludeItemsByIndex>(
      target, "ListClipper_IncludeItemsByIndex");
  sfmljs::SetMethod<ListClipperSeekCursorForItem>(
      target, "ListClipper_SeekCursorForItem");
  sfmljs::SetMethod<ListClipperIncludeRangeByIndices>(
      target, "ListClipper_IncludeRangeByIndices");
  sfmljs::SetMethod<ListClipperForceDisplayRangeByIndices>(
      target, "ListClipper_ForceDisplayRangeByIndices");
  sfmljs::SetMethod<GetContentRegionMax>(target, "GetContentRegionMax");
}

}  // namespace sfmlimgui
