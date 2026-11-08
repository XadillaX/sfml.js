// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"
#include "native/imgui-draw-callbacks.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(PushClipRect) {
  cimgui::ImVec2 clip_rect_min;
  if (!ReadImVec2(info, 0, &clip_rect_min)) return;
  cimgui::ImVec2 clip_rect_max;
  if (!ReadImVec2(info, 1, &clip_rect_max)) return;
  bool intersect_with_current_clip_rect = false;
  if (!ReadBool(info, 2, &intersect_with_current_clip_rect)) return;
  ::cimgui::ImGui_PushClipRect(
      clip_rect_min, clip_rect_max, intersect_with_current_clip_rect);
}

NAN_METHOD(PopClipRect) {
  ::cimgui::ImGui_PopClipRect();
}

NAN_METHOD(GetBackgroundDrawList) {
  auto result = ::cimgui::ImGui_GetBackgroundDrawList();
  ReturnStruct<cimgui::ImDrawList>(info, result);
}

NAN_METHOD(GetForegroundDrawList) {
  auto result = ::cimgui::ImGui_GetForegroundDrawList();
  ReturnStruct<cimgui::ImDrawList>(info, result);
}

NAN_METHOD(GetDrawListSharedData) {
  auto result = ::cimgui::ImGui_GetDrawListSharedData();
  ReturnStruct<cimgui::ImDrawListSharedData>(info, result);
}

NAN_METHOD(ImDrawCmdGetTexID) {
  cimgui::ImDrawCmd* command = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    command = ReadStruct<cimgui::ImDrawCmd>(info, 0);
    if (!command) return;
  }
  auto result = ::cimgui::ImDrawCmd_GetTexID(command);
  ReturnU64(info, result);
}

NAN_METHOD(ImDrawListSplitterClear) {
  cimgui::ImDrawListSplitter* splitter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    splitter = ReadStruct<cimgui::ImDrawListSplitter>(info, 0);
    if (!splitter) return;
  }
  ::cimgui::ImDrawListSplitter_Clear(splitter);
}

NAN_METHOD(ImDrawListSplitterClearFreeMemory) {
  cimgui::ImDrawListSplitter* splitter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    splitter = ReadStruct<cimgui::ImDrawListSplitter>(info, 0);
    if (!splitter) return;
  }
  ::cimgui::ImDrawListSplitter_ClearFreeMemory(splitter);
}

NAN_METHOD(ImDrawListSplitterSplit) {
  cimgui::ImDrawListSplitter* splitter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    splitter = ReadStruct<cimgui::ImDrawListSplitter>(info, 0);
    if (!splitter) return;
  }
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 1);
    if (!draw_list) return;
  }
  int count = {};
  if (!ReadScalar(info, 2, &count)) return;
  ::cimgui::ImDrawListSplitter_Split(splitter, draw_list, count);
}

NAN_METHOD(ImDrawListSplitterMerge) {
  cimgui::ImDrawListSplitter* splitter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    splitter = ReadStruct<cimgui::ImDrawListSplitter>(info, 0);
    if (!splitter) return;
  }
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 1);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawListSplitter_Merge(splitter, draw_list);
}

NAN_METHOD(ImDrawListSplitterSetCurrentChannel) {
  cimgui::ImDrawListSplitter* splitter = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    splitter = ReadStruct<cimgui::ImDrawListSplitter>(info, 0);
    if (!splitter) return;
  }
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 1);
    if (!draw_list) return;
  }
  int channel_index = {};
  if (!ReadScalar(info, 2, &channel_index)) return;
  ::cimgui::ImDrawListSplitter_SetCurrentChannel(
      splitter, draw_list, channel_index);
}

NAN_METHOD(ImDrawListPushClipRect) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 clip_rect_min;
  if (!ReadImVec2(info, 1, &clip_rect_min)) return;
  cimgui::ImVec2 clip_rect_max;
  if (!ReadImVec2(info, 2, &clip_rect_max)) return;
  bool intersect_with_current_clip_rect = false;
  if (!ReadBool(info, 3, &intersect_with_current_clip_rect)) return;
  ::cimgui::ImDrawList_PushClipRect(draw_list,
                                    clip_rect_min,
                                    clip_rect_max,
                                    intersect_with_current_clip_rect);
}

NAN_METHOD(ImDrawListPushClipRectFullScreen) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList_PushClipRectFullScreen(draw_list);
}

NAN_METHOD(ImDrawListPopClipRect) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList_PopClipRect(draw_list);
}

NAN_METHOD(ImDrawListPushTextureID) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImTextureID texture_id = 0;
  if (!ReadU64(info, 1, &texture_id)) return;
  ::cimgui::ImDrawList_PushTextureID(draw_list, texture_id);
}

NAN_METHOD(ImDrawListPopTextureID) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList_PopTextureID(draw_list);
}

NAN_METHOD(ImDrawListGetClipRectMin) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  auto result = ::cimgui::ImDrawList_GetClipRectMin(draw_list);
  ReturnVec2(info, result);
}

NAN_METHOD(ImDrawListGetClipRectMax) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  auto result = ::cimgui::ImDrawList_GetClipRectMax(draw_list);
  ReturnVec2(info, result);
}

NAN_METHOD(ImDrawListAddLine) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 1, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 2, &p2)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_AddLine(draw_list, p1, p2, color);
}

NAN_METHOD(ImDrawListAddLineEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 1, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 2, &p2)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  float thickness = {};
  if (!ReadScalar(info, 4, &thickness)) return;
  ::cimgui::ImDrawList_AddLineEx(draw_list, p1, p2, color, thickness);
}

NAN_METHOD(ImDrawListAddRect) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 minimum;
  if (!ReadImVec2(info, 1, &minimum)) return;
  cimgui::ImVec2 maximum;
  if (!ReadImVec2(info, 2, &maximum)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_AddRect(draw_list, minimum, maximum, color);
}

NAN_METHOD(ImDrawListAddRectEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 minimum;
  if (!ReadImVec2(info, 1, &minimum)) return;
  cimgui::ImVec2 maximum;
  if (!ReadImVec2(info, 2, &maximum)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  float rounding = {};
  if (!ReadScalar(info, 4, &rounding)) return;
  ImDrawFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  float thickness = {};
  if (!ReadScalar(info, 6, &thickness)) return;
  ::cimgui::ImDrawList_AddRectEx(
      draw_list, minimum, maximum, color, rounding, flags, thickness);
}

NAN_METHOD(ImDrawListAddRectFilled) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 minimum;
  if (!ReadImVec2(info, 1, &minimum)) return;
  cimgui::ImVec2 maximum;
  if (!ReadImVec2(info, 2, &maximum)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_AddRectFilled(draw_list, minimum, maximum, color);
}

NAN_METHOD(ImDrawListAddRectFilledEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 minimum;
  if (!ReadImVec2(info, 1, &minimum)) return;
  cimgui::ImVec2 maximum;
  if (!ReadImVec2(info, 2, &maximum)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  float rounding = {};
  if (!ReadScalar(info, 4, &rounding)) return;
  ImDrawFlags flags = {};
  if (!ReadScalar(info, 5, &flags)) return;
  ::cimgui::ImDrawList_AddRectFilledEx(
      draw_list, minimum, maximum, color, rounding, flags);
}

NAN_METHOD(ImDrawListAddRectFilledMultiColor) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 minimum;
  if (!ReadImVec2(info, 1, &minimum)) return;
  cimgui::ImVec2 maximum;
  if (!ReadImVec2(info, 2, &maximum)) return;
  ImU32 color_top_left = {};
  if (!ReadScalar(info, 3, &color_top_left)) return;
  ImU32 color_top_right = {};
  if (!ReadScalar(info, 4, &color_top_right)) return;
  ImU32 color_bottom_right = {};
  if (!ReadScalar(info, 5, &color_bottom_right)) return;
  ImU32 color_bottom_left = {};
  if (!ReadScalar(info, 6, &color_bottom_left)) return;
  ::cimgui::ImDrawList_AddRectFilledMultiColor(draw_list,
                                               minimum,
                                               maximum,
                                               color_top_left,
                                               color_top_right,
                                               color_bottom_right,
                                               color_bottom_left);
}

NAN_METHOD(ImDrawListAddQuad) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 1, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 2, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 3, &p3)) return;
  cimgui::ImVec2 p4;
  if (!ReadImVec2(info, 4, &p4)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 5, &color)) return;
  ::cimgui::ImDrawList_AddQuad(draw_list, p1, p2, p3, p4, color);
}

NAN_METHOD(ImDrawListAddQuadEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 1, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 2, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 3, &p3)) return;
  cimgui::ImVec2 p4;
  if (!ReadImVec2(info, 4, &p4)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 5, &color)) return;
  float thickness = {};
  if (!ReadScalar(info, 6, &thickness)) return;
  ::cimgui::ImDrawList_AddQuadEx(draw_list, p1, p2, p3, p4, color, thickness);
}

NAN_METHOD(ImDrawListAddQuadFilled) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 1, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 2, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 3, &p3)) return;
  cimgui::ImVec2 p4;
  if (!ReadImVec2(info, 4, &p4)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 5, &color)) return;
  ::cimgui::ImDrawList_AddQuadFilled(draw_list, p1, p2, p3, p4, color);
}

NAN_METHOD(ImDrawListAddTriangle) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 1, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 2, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 3, &p3)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 4, &color)) return;
  ::cimgui::ImDrawList_AddTriangle(draw_list, p1, p2, p3, color);
}

NAN_METHOD(ImDrawListAddTriangleEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 1, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 2, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 3, &p3)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 4, &color)) return;
  float thickness = {};
  if (!ReadScalar(info, 5, &thickness)) return;
  ::cimgui::ImDrawList_AddTriangleEx(draw_list, p1, p2, p3, color, thickness);
}

NAN_METHOD(ImDrawListAddTriangleFilled) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 1, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 2, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 3, &p3)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 4, &color)) return;
  ::cimgui::ImDrawList_AddTriangleFilled(draw_list, p1, p2, p3, color);
}

NAN_METHOD(ImDrawListAddCircle) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_AddCircle(draw_list, center, radius, color);
}

NAN_METHOD(ImDrawListAddCircleEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  int segment_count = {};
  if (!ReadScalar(info, 4, &segment_count)) return;
  float thickness = {};
  if (!ReadScalar(info, 5, &thickness)) return;
  ::cimgui::ImDrawList_AddCircleEx(
      draw_list, center, radius, color, segment_count, thickness);
}

NAN_METHOD(ImDrawListAddCircleFilled) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  int segment_count = {};
  if (!ReadScalar(info, 4, &segment_count)) return;
  ::cimgui::ImDrawList_AddCircleFilled(
      draw_list, center, radius, color, segment_count);
}

NAN_METHOD(ImDrawListAddNgon) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  int segment_count = {};
  if (!ReadScalar(info, 4, &segment_count)) return;
  ::cimgui::ImDrawList_AddNgon(draw_list, center, radius, color, segment_count);
}

NAN_METHOD(ImDrawListAddNgonEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  int segment_count = {};
  if (!ReadScalar(info, 4, &segment_count)) return;
  float thickness = {};
  if (!ReadScalar(info, 5, &thickness)) return;
  ::cimgui::ImDrawList_AddNgonEx(
      draw_list, center, radius, color, segment_count, thickness);
}

NAN_METHOD(ImDrawListAddNgonFilled) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  int segment_count = {};
  if (!ReadScalar(info, 4, &segment_count)) return;
  ::cimgui::ImDrawList_AddNgonFilled(
      draw_list, center, radius, color, segment_count);
}

NAN_METHOD(ImDrawListAddEllipse) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  cimgui::ImVec2 radius;
  if (!ReadImVec2(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_AddEllipse(draw_list, center, radius, color);
}

NAN_METHOD(ImDrawListAddEllipseEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  cimgui::ImVec2 radius;
  if (!ReadImVec2(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  float rotation = {};
  if (!ReadScalar(info, 4, &rotation)) return;
  int segment_count = {};
  if (!ReadScalar(info, 5, &segment_count)) return;
  float thickness = {};
  if (!ReadScalar(info, 6, &thickness)) return;
  ::cimgui::ImDrawList_AddEllipseEx(
      draw_list, center, radius, color, rotation, segment_count, thickness);
}

NAN_METHOD(ImDrawListAddEllipseFilled) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  cimgui::ImVec2 radius;
  if (!ReadImVec2(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_AddEllipseFilled(draw_list, center, radius, color);
}

NAN_METHOD(ImDrawListAddEllipseFilledEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  cimgui::ImVec2 radius;
  if (!ReadImVec2(info, 2, &radius)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  float rotation = {};
  if (!ReadScalar(info, 4, &rotation)) return;
  int segment_count = {};
  if (!ReadScalar(info, 5, &segment_count)) return;
  ::cimgui::ImDrawList_AddEllipseFilledEx(
      draw_list, center, radius, color, rotation, segment_count);
}

NAN_METHOD(ImDrawListAddText) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 1, &position)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 2, &color)) return;
  std::string text_begin_utf8;
  const char* text_begin = nullptr;
  if (!ReadUtf8(info, 3, &text_begin_utf8, &text_begin, true)) return;
  ::cimgui::ImDrawList_AddText(draw_list, position, color, text_begin);
}

NAN_METHOD(ImDrawListAddTextEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 1, &position)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 2, &color)) return;
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 3, 4, &text_range)) return;
  ::cimgui::ImDrawList_AddTextEx(
      draw_list, position, color, text_range.begin, text_range.end);
}

NAN_METHOD(ImDrawListAddTextImFontPtr) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImFont* font = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    font = ReadStruct<cimgui::ImFont>(info, 1);
    if (!font) return;
  }
  float font_size = {};
  if (!ReadScalar(info, 2, &font_size)) return;
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 3, &position)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 4, &color)) return;
  std::string text_begin_utf8;
  const char* text_begin = nullptr;
  if (!ReadUtf8(info, 5, &text_begin_utf8, &text_begin, true)) return;
  ::cimgui::ImDrawList_AddTextImFontPtr(
      draw_list, font, font_size, position, color, text_begin);
}

NAN_METHOD(ImDrawListAddTextImFontPtrEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImFont* font = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    font = ReadStruct<cimgui::ImFont>(info, 1);
    if (!font) return;
  }
  float font_size = {};
  if (!ReadScalar(info, 2, &font_size)) return;
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 3, &position)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 4, &color)) return;
  Utf8Range text_range;
  if (!ReadUtf8Range(info, 5, 6, &text_range)) return;
  float wrap_width = {};
  if (!ReadScalar(info, 7, &wrap_width)) return;
  cimgui::ImVec4* cpu_fine_clip_rect = nullptr;
  if (!info[8]->IsUndefined() && !info[8]->IsNull()) {
    cpu_fine_clip_rect =
        reinterpret_cast<cimgui::ImVec4*>(ReadFloat32Array(info, 8, 4));
    if (!cpu_fine_clip_rect) return;
  }
  ::cimgui::ImDrawList_AddTextImFontPtrEx(draw_list,
                                          font,
                                          font_size,
                                          position,
                                          color,
                                          text_range.begin,
                                          text_range.end,
                                          wrap_width,
                                          cpu_fine_clip_rect);
}

NAN_METHOD(ImDrawListAddImage) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 1, &user_texture_id)) return;
  cimgui::ImVec2 minimum;
  if (!ReadImVec2(info, 2, &minimum)) return;
  cimgui::ImVec2 maximum;
  if (!ReadImVec2(info, 3, &maximum)) return;
  ::cimgui::ImDrawList_AddImage(draw_list, user_texture_id, minimum, maximum);
}

NAN_METHOD(ImDrawListAddImageEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 1, &user_texture_id)) return;
  cimgui::ImVec2 minimum;
  if (!ReadImVec2(info, 2, &minimum)) return;
  cimgui::ImVec2 maximum;
  if (!ReadImVec2(info, 3, &maximum)) return;
  cimgui::ImVec2 uv_min;
  if (!ReadImVec2(info, 4, &uv_min)) return;
  cimgui::ImVec2 uv_max;
  if (!ReadImVec2(info, 5, &uv_max)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 6, &color)) return;
  ::cimgui::ImDrawList_AddImageEx(
      draw_list, user_texture_id, minimum, maximum, uv_min, uv_max, color);
}

NAN_METHOD(ImDrawListAddImageQuad) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 1, &user_texture_id)) return;
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 2, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 3, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 4, &p3)) return;
  cimgui::ImVec2 p4;
  if (!ReadImVec2(info, 5, &p4)) return;
  ::cimgui::ImDrawList_AddImageQuad(draw_list, user_texture_id, p1, p2, p3, p4);
}

NAN_METHOD(ImDrawListAddImageQuadEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 1, &user_texture_id)) return;
  cimgui::ImVec2 p1;
  if (!ReadImVec2(info, 2, &p1)) return;
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 3, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 4, &p3)) return;
  cimgui::ImVec2 p4;
  if (!ReadImVec2(info, 5, &p4)) return;
  cimgui::ImVec2 uv1;
  if (!ReadImVec2(info, 6, &uv1)) return;
  cimgui::ImVec2 uv2;
  if (!ReadImVec2(info, 7, &uv2)) return;
  cimgui::ImVec2 uv3;
  if (!ReadImVec2(info, 8, &uv3)) return;
  cimgui::ImVec2 uv4;
  if (!ReadImVec2(info, 9, &uv4)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 10, &color)) return;
  ::cimgui::ImDrawList_AddImageQuadEx(
      draw_list, user_texture_id, p1, p2, p3, p4, uv1, uv2, uv3, uv4, color);
}

NAN_METHOD(ImDrawListAddImageRounded) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImTextureID user_texture_id = 0;
  if (!ReadU64(info, 1, &user_texture_id)) return;
  cimgui::ImVec2 minimum;
  if (!ReadImVec2(info, 2, &minimum)) return;
  cimgui::ImVec2 maximum;
  if (!ReadImVec2(info, 3, &maximum)) return;
  cimgui::ImVec2 uv_min;
  if (!ReadImVec2(info, 4, &uv_min)) return;
  cimgui::ImVec2 uv_max;
  if (!ReadImVec2(info, 5, &uv_max)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 6, &color)) return;
  float rounding = {};
  if (!ReadScalar(info, 7, &rounding)) return;
  ImDrawFlags flags = {};
  if (!ReadScalar(info, 8, &flags)) return;
  ::cimgui::ImDrawList_AddImageRounded(draw_list,
                                       user_texture_id,
                                       minimum,
                                       maximum,
                                       uv_min,
                                       uv_max,
                                       color,
                                       rounding,
                                       flags);
}

NAN_METHOD(ImDrawDataClear) {
  cimgui::ImDrawData* draw_data = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_data = ReadStruct<cimgui::ImDrawData>(info, 0);
    if (!draw_data) return;
  }
  ::cimgui::ImDrawData_Clear(draw_data);
  ClearImGuiDrawDataOwners(draw_data);
}

NAN_METHOD(ImDrawDataAddDrawList) {
  cimgui::ImDrawData* draw_data = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_data = ReadStruct<cimgui::ImDrawData>(info, 0);
    if (!draw_data) return;
  }
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 1);
    if (!draw_list) return;
  }
  const int previous_count = draw_data->CmdListsCount;
  ::cimgui::ImDrawData_AddDrawList(draw_data, draw_list);
  if (draw_data->CmdListsCount > previous_count) {
    auto* handle = sfmljs::SharedHandle<cimgui::ImDrawList>::From(info[1]);
    RetainImGuiDrawList(draw_data, handle->owner());
  }
}

NAN_METHOD(ImDrawDataDeIndexAllBuffers) {
  cimgui::ImDrawData* draw_data = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_data = ReadStruct<cimgui::ImDrawData>(info, 0);
    if (!draw_data) return;
  }
  ::cimgui::ImDrawData_DeIndexAllBuffers(draw_data);
}

NAN_METHOD(ImDrawDataScaleClipRects) {
  cimgui::ImDrawData* draw_data = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_data = ReadStruct<cimgui::ImDrawData>(info, 0);
    if (!draw_data) return;
  }
  cimgui::ImVec2 framebuffer_scale;
  if (!ReadImVec2(info, 1, &framebuffer_scale)) return;
  ::cimgui::ImDrawData_ScaleClipRects(draw_data, framebuffer_scale);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiDrawing) {
  sfmljs::SetMethod<PushClipRect>(target, "PushClipRect");
  sfmljs::SetMethod<PopClipRect>(target, "PopClipRect");
  sfmljs::SetMethod<GetBackgroundDrawList>(target, "GetBackgroundDrawList");
  sfmljs::SetMethod<GetForegroundDrawList>(target, "GetForegroundDrawList");
  sfmljs::SetMethod<GetDrawListSharedData>(target, "GetDrawListSharedData");
  sfmljs::SetMethod<ImDrawCmdGetTexID>(target, "ImDrawCmd_GetTexID");
  sfmljs::SetMethod<ImDrawListSplitterClear>(target,
                                             "ImDrawListSplitter_Clear");
  sfmljs::SetMethod<ImDrawListSplitterClearFreeMemory>(
      target, "ImDrawListSplitter_ClearFreeMemory");
  sfmljs::SetMethod<ImDrawListSplitterSplit>(target,
                                             "ImDrawListSplitter_Split");
  sfmljs::SetMethod<ImDrawListSplitterMerge>(target,
                                             "ImDrawListSplitter_Merge");
  sfmljs::SetMethod<ImDrawListSplitterSetCurrentChannel>(
      target, "ImDrawListSplitter_SetCurrentChannel");
  sfmljs::SetMethod<ImDrawListPushClipRect>(target, "ImDrawList_PushClipRect");
  sfmljs::SetMethod<ImDrawListPushClipRectFullScreen>(
      target, "ImDrawList_PushClipRectFullScreen");
  sfmljs::SetMethod<ImDrawListPopClipRect>(target, "ImDrawList_PopClipRect");
  sfmljs::SetMethod<ImDrawListPushTextureID>(target,
                                             "ImDrawList_PushTextureID");
  sfmljs::SetMethod<ImDrawListPopTextureID>(target, "ImDrawList_PopTextureID");
  sfmljs::SetMethod<ImDrawListGetClipRectMin>(target,
                                              "ImDrawList_GetClipRectMin");
  sfmljs::SetMethod<ImDrawListGetClipRectMax>(target,
                                              "ImDrawList_GetClipRectMax");
  sfmljs::SetMethod<ImDrawListAddLine>(target, "ImDrawList_AddLine");
  sfmljs::SetMethod<ImDrawListAddLineEx>(target, "ImDrawList_AddLineEx");
  sfmljs::SetMethod<ImDrawListAddRect>(target, "ImDrawList_AddRect");
  sfmljs::SetMethod<ImDrawListAddRectEx>(target, "ImDrawList_AddRectEx");
  sfmljs::SetMethod<ImDrawListAddRectFilled>(target,
                                             "ImDrawList_AddRectFilled");
  sfmljs::SetMethod<ImDrawListAddRectFilledEx>(target,
                                               "ImDrawList_AddRectFilledEx");
  sfmljs::SetMethod<ImDrawListAddRectFilledMultiColor>(
      target, "ImDrawList_AddRectFilledMultiColor");
  sfmljs::SetMethod<ImDrawListAddQuad>(target, "ImDrawList_AddQuad");
  sfmljs::SetMethod<ImDrawListAddQuadEx>(target, "ImDrawList_AddQuadEx");
  sfmljs::SetMethod<ImDrawListAddQuadFilled>(target,
                                             "ImDrawList_AddQuadFilled");
  sfmljs::SetMethod<ImDrawListAddTriangle>(target, "ImDrawList_AddTriangle");
  sfmljs::SetMethod<ImDrawListAddTriangleEx>(target,
                                             "ImDrawList_AddTriangleEx");
  sfmljs::SetMethod<ImDrawListAddTriangleFilled>(
      target, "ImDrawList_AddTriangleFilled");
  sfmljs::SetMethod<ImDrawListAddCircle>(target, "ImDrawList_AddCircle");
  sfmljs::SetMethod<ImDrawListAddCircleEx>(target, "ImDrawList_AddCircleEx");
  sfmljs::SetMethod<ImDrawListAddCircleFilled>(target,
                                               "ImDrawList_AddCircleFilled");
  sfmljs::SetMethod<ImDrawListAddNgon>(target, "ImDrawList_AddNgon");
  sfmljs::SetMethod<ImDrawListAddNgonEx>(target, "ImDrawList_AddNgonEx");
  sfmljs::SetMethod<ImDrawListAddNgonFilled>(target,
                                             "ImDrawList_AddNgonFilled");
  sfmljs::SetMethod<ImDrawListAddEllipse>(target, "ImDrawList_AddEllipse");
  sfmljs::SetMethod<ImDrawListAddEllipseEx>(target, "ImDrawList_AddEllipseEx");
  sfmljs::SetMethod<ImDrawListAddEllipseFilled>(target,
                                                "ImDrawList_AddEllipseFilled");
  sfmljs::SetMethod<ImDrawListAddEllipseFilledEx>(
      target, "ImDrawList_AddEllipseFilledEx");
  sfmljs::SetMethod<ImDrawListAddText>(target, "ImDrawList_AddText");
  sfmljs::SetMethod<ImDrawListAddTextEx>(target, "ImDrawList_AddTextEx");
  sfmljs::SetMethod<ImDrawListAddTextImFontPtr>(target,
                                                "ImDrawList_AddTextImFontPtr");
  sfmljs::SetMethod<ImDrawListAddTextImFontPtrEx>(
      target, "ImDrawList_AddTextImFontPtrEx");
  sfmljs::SetMethod<ImDrawListAddImage>(target, "ImDrawList_AddImage");
  sfmljs::SetMethod<ImDrawListAddImageEx>(target, "ImDrawList_AddImageEx");
  sfmljs::SetMethod<ImDrawListAddImageQuad>(target, "ImDrawList_AddImageQuad");
  sfmljs::SetMethod<ImDrawListAddImageQuadEx>(target,
                                              "ImDrawList_AddImageQuadEx");
  sfmljs::SetMethod<ImDrawListAddImageRounded>(target,
                                               "ImDrawList_AddImageRounded");
  sfmljs::SetMethod<ImDrawDataClear>(target, "ImDrawData_Clear");
  sfmljs::SetMethod<ImDrawDataAddDrawList>(target, "ImDrawData_AddDrawList");
  sfmljs::SetMethod<ImDrawDataDeIndexAllBuffers>(
      target, "ImDrawData_DeIndexAllBuffers");
  sfmljs::SetMethod<ImDrawDataScaleClipRects>(target,
                                              "ImDrawData_ScaleClipRects");
}

}  // namespace sfmlimgui
