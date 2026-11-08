// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(ImDrawListAddBezierCubic) {
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
  int segment_count = {};
  if (!ReadScalar(info, 7, &segment_count)) return;
  ::cimgui::ImDrawList_AddBezierCubic(
      draw_list, p1, p2, p3, p4, color, thickness, segment_count);
}

NAN_METHOD(ImDrawListAddBezierQuadratic) {
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
  int segment_count = {};
  if (!ReadScalar(info, 6, &segment_count)) return;
  ::cimgui::ImDrawList_AddBezierQuadratic(
      draw_list, p1, p2, p3, color, thickness, segment_count);
}

NAN_METHOD(ImDrawListAddPolyline) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2* points = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    points = reinterpret_cast<cimgui::ImVec2*>(ReadFloat32Array(info, 1, 2));
    if (!points) return;
  }
  int point_count = {};
  if (!ReadScalar(info, 2, &point_count)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ImDrawFlags flags = {};
  if (!ReadScalar(info, 4, &flags)) return;
  float thickness = {};
  if (!ReadScalar(info, 5, &thickness)) return;
  ::cimgui::ImDrawList_AddPolyline(
      draw_list, points, point_count, color, flags, thickness);
}

NAN_METHOD(ImDrawListAddConvexPolyFilled) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2* points = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    points = reinterpret_cast<cimgui::ImVec2*>(ReadFloat32Array(info, 1, 2));
    if (!points) return;
  }
  int point_count = {};
  if (!ReadScalar(info, 2, &point_count)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_AddConvexPolyFilled(
      draw_list, points, point_count, color);
}

NAN_METHOD(ImDrawListAddConcavePolyFilled) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2* points = nullptr;
  if (!info[1]->IsUndefined() && !info[1]->IsNull()) {
    points = reinterpret_cast<cimgui::ImVec2*>(ReadFloat32Array(info, 1, 2));
    if (!points) return;
  }
  int point_count = {};
  if (!ReadScalar(info, 2, &point_count)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_AddConcavePolyFilled(
      draw_list, points, point_count, color);
}

NAN_METHOD(ImDrawListPathClear) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList_PathClear(draw_list);
}

NAN_METHOD(ImDrawListPathLineTo) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 1, &position)) return;
  ::cimgui::ImDrawList_PathLineTo(draw_list, position);
}

NAN_METHOD(ImDrawListPathLineToMergeDuplicate) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 1, &position)) return;
  ::cimgui::ImDrawList_PathLineToMergeDuplicate(draw_list, position);
}

NAN_METHOD(ImDrawListPathFillConvex) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImU32 color = {};
  if (!ReadScalar(info, 1, &color)) return;
  ::cimgui::ImDrawList_PathFillConvex(draw_list, color);
}

NAN_METHOD(ImDrawListPathFillConcave) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImU32 color = {};
  if (!ReadScalar(info, 1, &color)) return;
  ::cimgui::ImDrawList_PathFillConcave(draw_list, color);
}

NAN_METHOD(ImDrawListPathStroke) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImU32 color = {};
  if (!ReadScalar(info, 1, &color)) return;
  ImDrawFlags flags = {};
  if (!ReadScalar(info, 2, &flags)) return;
  float thickness = {};
  if (!ReadScalar(info, 3, &thickness)) return;
  ::cimgui::ImDrawList_PathStroke(draw_list, color, flags, thickness);
}

NAN_METHOD(ImDrawListPathArcTo) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  float angle_min = {};
  if (!ReadScalar(info, 3, &angle_min)) return;
  float angle_max = {};
  if (!ReadScalar(info, 4, &angle_max)) return;
  int segment_count = {};
  if (!ReadScalar(info, 5, &segment_count)) return;
  ::cimgui::ImDrawList_PathArcTo(
      draw_list, center, radius, angle_min, angle_max, segment_count);
}

NAN_METHOD(ImDrawListPathArcToFast) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  int angle_min_of_12 = {};
  if (!ReadScalar(info, 3, &angle_min_of_12)) return;
  int angle_max_of_12 = {};
  if (!ReadScalar(info, 4, &angle_max_of_12)) return;
  ::cimgui::ImDrawList_PathArcToFast(
      draw_list, center, radius, angle_min_of_12, angle_max_of_12);
}

NAN_METHOD(ImDrawListPathEllipticalArcTo) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  cimgui::ImVec2 radius;
  if (!ReadImVec2(info, 2, &radius)) return;
  float rotation = {};
  if (!ReadScalar(info, 3, &rotation)) return;
  float angle_min = {};
  if (!ReadScalar(info, 4, &angle_min)) return;
  float angle_max = {};
  if (!ReadScalar(info, 5, &angle_max)) return;
  ::cimgui::ImDrawList_PathEllipticalArcTo(
      draw_list, center, radius, rotation, angle_min, angle_max);
}

NAN_METHOD(ImDrawListPathEllipticalArcToEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  cimgui::ImVec2 radius;
  if (!ReadImVec2(info, 2, &radius)) return;
  float rotation = {};
  if (!ReadScalar(info, 3, &rotation)) return;
  float angle_min = {};
  if (!ReadScalar(info, 4, &angle_min)) return;
  float angle_max = {};
  if (!ReadScalar(info, 5, &angle_max)) return;
  int segment_count = {};
  if (!ReadScalar(info, 6, &segment_count)) return;
  ::cimgui::ImDrawList_PathEllipticalArcToEx(
      draw_list, center, radius, rotation, angle_min, angle_max, segment_count);
}

NAN_METHOD(ImDrawListPathBezierCubicCurveTo) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 1, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 2, &p3)) return;
  cimgui::ImVec2 p4;
  if (!ReadImVec2(info, 3, &p4)) return;
  int segment_count = {};
  if (!ReadScalar(info, 4, &segment_count)) return;
  ::cimgui::ImDrawList_PathBezierCubicCurveTo(
      draw_list, p2, p3, p4, segment_count);
}

NAN_METHOD(ImDrawListPathBezierQuadraticCurveTo) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 p2;
  if (!ReadImVec2(info, 1, &p2)) return;
  cimgui::ImVec2 p3;
  if (!ReadImVec2(info, 2, &p3)) return;
  int segment_count = {};
  if (!ReadScalar(info, 3, &segment_count)) return;
  ::cimgui::ImDrawList_PathBezierQuadraticCurveTo(
      draw_list, p2, p3, segment_count);
}

NAN_METHOD(ImDrawListPathRect) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 rect_min;
  if (!ReadImVec2(info, 1, &rect_min)) return;
  cimgui::ImVec2 rect_max;
  if (!ReadImVec2(info, 2, &rect_max)) return;
  float rounding = {};
  if (!ReadScalar(info, 3, &rounding)) return;
  ImDrawFlags flags = {};
  if (!ReadScalar(info, 4, &flags)) return;
  ::cimgui::ImDrawList_PathRect(draw_list, rect_min, rect_max, rounding, flags);
}

NAN_METHOD(ImDrawListCalcCircleAutoSegmentCount) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  float radius = {};
  if (!ReadScalar(info, 1, &radius)) return;
  auto result =
      ::cimgui::ImDrawList__CalcCircleAutoSegmentCount(draw_list, radius);
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(ImDrawListPathArcToFastEx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  int angle_min_sample = {};
  if (!ReadScalar(info, 3, &angle_min_sample)) return;
  int angle_max_sample = {};
  if (!ReadScalar(info, 4, &angle_max_sample)) return;
  int angle_step = {};
  if (!ReadScalar(info, 5, &angle_step)) return;
  ::cimgui::ImDrawList__PathArcToFastEx(draw_list,
                                        center,
                                        radius,
                                        angle_min_sample,
                                        angle_max_sample,
                                        angle_step);
}

NAN_METHOD(ImDrawListPathArcToN) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 center;
  if (!ReadImVec2(info, 1, &center)) return;
  float radius = {};
  if (!ReadScalar(info, 2, &radius)) return;
  float angle_min = {};
  if (!ReadScalar(info, 3, &angle_min)) return;
  float angle_max = {};
  if (!ReadScalar(info, 4, &angle_max)) return;
  int segment_count = {};
  if (!ReadScalar(info, 5, &segment_count)) return;
  ::cimgui::ImDrawList__PathArcToN(
      draw_list, center, radius, angle_min, angle_max, segment_count);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiDrawPaths) {
  sfmljs::SetMethod<ImDrawListAddBezierCubic>(target,
                                              "ImDrawList_AddBezierCubic");
  sfmljs::SetMethod<ImDrawListAddBezierQuadratic>(
      target, "ImDrawList_AddBezierQuadratic");
  sfmljs::SetMethod<ImDrawListAddPolyline>(target, "ImDrawList_AddPolyline");
  sfmljs::SetMethod<ImDrawListAddConvexPolyFilled>(
      target, "ImDrawList_AddConvexPolyFilled");
  sfmljs::SetMethod<ImDrawListAddConcavePolyFilled>(
      target, "ImDrawList_AddConcavePolyFilled");
  sfmljs::SetMethod<ImDrawListPathClear>(target, "ImDrawList_PathClear");
  sfmljs::SetMethod<ImDrawListPathLineTo>(target, "ImDrawList_PathLineTo");
  sfmljs::SetMethod<ImDrawListPathLineToMergeDuplicate>(
      target, "ImDrawList_PathLineToMergeDuplicate");
  sfmljs::SetMethod<ImDrawListPathFillConvex>(target,
                                              "ImDrawList_PathFillConvex");
  sfmljs::SetMethod<ImDrawListPathFillConcave>(target,
                                               "ImDrawList_PathFillConcave");
  sfmljs::SetMethod<ImDrawListPathStroke>(target, "ImDrawList_PathStroke");
  sfmljs::SetMethod<ImDrawListPathArcTo>(target, "ImDrawList_PathArcTo");
  sfmljs::SetMethod<ImDrawListPathArcToFast>(target,
                                             "ImDrawList_PathArcToFast");
  sfmljs::SetMethod<ImDrawListPathEllipticalArcTo>(
      target, "ImDrawList_PathEllipticalArcTo");
  sfmljs::SetMethod<ImDrawListPathEllipticalArcToEx>(
      target, "ImDrawList_PathEllipticalArcToEx");
  sfmljs::SetMethod<ImDrawListPathBezierCubicCurveTo>(
      target, "ImDrawList_PathBezierCubicCurveTo");
  sfmljs::SetMethod<ImDrawListPathBezierQuadraticCurveTo>(
      target, "ImDrawList_PathBezierQuadraticCurveTo");
  sfmljs::SetMethod<ImDrawListPathRect>(target, "ImDrawList_PathRect");
  sfmljs::SetMethod<ImDrawListCalcCircleAutoSegmentCount>(
      target, "ImDrawList__CalcCircleAutoSegmentCount");
  sfmljs::SetMethod<ImDrawListPathArcToFastEx>(target,
                                               "ImDrawList__PathArcToFastEx");
  sfmljs::SetMethod<ImDrawListPathArcToN>(target, "ImDrawList__PathArcToN");
}

}  // namespace sfmlimgui
