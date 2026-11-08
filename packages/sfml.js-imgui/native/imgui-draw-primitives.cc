// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"
#include "native/imgui-draw-callbacks.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(ImDrawListAddDrawCmd) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList_AddDrawCmd(draw_list);
}

NAN_METHOD(ImDrawListCloneOutput) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  auto result = ::cimgui::ImDrawList_CloneOutput(draw_list);
  if (!result) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  info.GetReturnValue().Set(sfmljs::SharedHandle<cimgui::ImDrawList>::Create(
      OwnImGuiDrawListClone(result)));
}

NAN_METHOD(ImDrawListChannelsSplit) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  int count = {};
  if (!ReadScalar(info, 1, &count)) return;
  ::cimgui::ImDrawList_ChannelsSplit(draw_list, count);
}

NAN_METHOD(ImDrawListChannelsMerge) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList_ChannelsMerge(draw_list);
}

NAN_METHOD(ImDrawListChannelsSetCurrent) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  int channel_index = {};
  if (!ReadScalar(info, 1, &channel_index)) return;
  ::cimgui::ImDrawList_ChannelsSetCurrent(draw_list, channel_index);
}

NAN_METHOD(ImDrawListPrimReserve) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  int index_count = {};
  if (!ReadScalar(info, 1, &index_count)) return;
  int vertex_count = {};
  if (!ReadScalar(info, 2, &vertex_count)) return;
  ::cimgui::ImDrawList_PrimReserve(draw_list, index_count, vertex_count);
}

NAN_METHOD(ImDrawListPrimUnreserve) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  int index_count = {};
  if (!ReadScalar(info, 1, &index_count)) return;
  int vertex_count = {};
  if (!ReadScalar(info, 2, &vertex_count)) return;
  ::cimgui::ImDrawList_PrimUnreserve(draw_list, index_count, vertex_count);
}

NAN_METHOD(ImDrawListPrimRect) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 point_a;
  if (!ReadImVec2(info, 1, &point_a)) return;
  cimgui::ImVec2 point_b;
  if (!ReadImVec2(info, 2, &point_b)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_PrimRect(draw_list, point_a, point_b, color);
}

NAN_METHOD(ImDrawListPrimRectUV) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 point_a;
  if (!ReadImVec2(info, 1, &point_a)) return;
  cimgui::ImVec2 point_b;
  if (!ReadImVec2(info, 2, &point_b)) return;
  cimgui::ImVec2 uv_a;
  if (!ReadImVec2(info, 3, &uv_a)) return;
  cimgui::ImVec2 uv_b;
  if (!ReadImVec2(info, 4, &uv_b)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 5, &color)) return;
  ::cimgui::ImDrawList_PrimRectUV(
      draw_list, point_a, point_b, uv_a, uv_b, color);
}

NAN_METHOD(ImDrawListPrimQuadUV) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 point_a;
  if (!ReadImVec2(info, 1, &point_a)) return;
  cimgui::ImVec2 point_b;
  if (!ReadImVec2(info, 2, &point_b)) return;
  cimgui::ImVec2 point_c;
  if (!ReadImVec2(info, 3, &point_c)) return;
  cimgui::ImVec2 point_d;
  if (!ReadImVec2(info, 4, &point_d)) return;
  cimgui::ImVec2 uv_a;
  if (!ReadImVec2(info, 5, &uv_a)) return;
  cimgui::ImVec2 uv_b;
  if (!ReadImVec2(info, 6, &uv_b)) return;
  cimgui::ImVec2 uv_c;
  if (!ReadImVec2(info, 7, &uv_c)) return;
  cimgui::ImVec2 uv_d;
  if (!ReadImVec2(info, 8, &uv_d)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 9, &color)) return;
  ::cimgui::ImDrawList_PrimQuadUV(draw_list,
                                  point_a,
                                  point_b,
                                  point_c,
                                  point_d,
                                  uv_a,
                                  uv_b,
                                  uv_c,
                                  uv_d,
                                  color);
}

NAN_METHOD(ImDrawListPrimWriteVtx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 1, &position)) return;
  cimgui::ImVec2 uv;
  if (!ReadImVec2(info, 2, &uv)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_PrimWriteVtx(draw_list, position, uv, color);
}

NAN_METHOD(ImDrawListPrimWriteIdx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImDrawIdx index = {};
  if (!ReadScalar(info, 1, &index)) return;
  ::cimgui::ImDrawList_PrimWriteIdx(draw_list, index);
}

NAN_METHOD(ImDrawListPrimVtx) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  cimgui::ImVec2 position;
  if (!ReadImVec2(info, 1, &position)) return;
  cimgui::ImVec2 uv;
  if (!ReadImVec2(info, 2, &uv)) return;
  ImU32 color = {};
  if (!ReadScalar(info, 3, &color)) return;
  ::cimgui::ImDrawList_PrimVtx(draw_list, position, uv, color);
}

NAN_METHOD(ImDrawListResetForNewFrame) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList__ResetForNewFrame(draw_list);
  ClearImGuiDrawListCallbacks(draw_list);
}

NAN_METHOD(ImDrawListClearFreeMemory) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList__ClearFreeMemory(draw_list);
  ClearImGuiDrawListCallbacks(draw_list);
}

NAN_METHOD(ImDrawListPopUnusedDrawCmd) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList__PopUnusedDrawCmd(draw_list);
}

NAN_METHOD(ImDrawListTryMergeDrawCmds) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList__TryMergeDrawCmds(draw_list);
}

NAN_METHOD(ImDrawListOnChangedClipRect) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList__OnChangedClipRect(draw_list);
}

NAN_METHOD(ImDrawListOnChangedTextureID) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList__OnChangedTextureID(draw_list);
}

NAN_METHOD(ImDrawListOnChangedVtxOffset) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ::cimgui::ImDrawList__OnChangedVtxOffset(draw_list);
}

NAN_METHOD(ImDrawListSetTextureID) {
  cimgui::ImDrawList* draw_list = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    draw_list = ReadStruct<cimgui::ImDrawList>(info, 0);
    if (!draw_list) return;
  }
  ImTextureID texture_id = 0;
  if (!ReadU64(info, 1, &texture_id)) return;
  ::cimgui::ImDrawList__SetTextureID(draw_list, texture_id);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiDrawPrimitives) {
  sfmljs::SetMethod<ImDrawListAddDrawCmd>(target, "ImDrawList_AddDrawCmd");
  sfmljs::SetMethod<ImDrawListCloneOutput>(target, "ImDrawList_CloneOutput");
  sfmljs::SetMethod<ImDrawListChannelsSplit>(target,
                                             "ImDrawList_ChannelsSplit");
  sfmljs::SetMethod<ImDrawListChannelsMerge>(target,
                                             "ImDrawList_ChannelsMerge");
  sfmljs::SetMethod<ImDrawListChannelsSetCurrent>(
      target, "ImDrawList_ChannelsSetCurrent");
  sfmljs::SetMethod<ImDrawListPrimReserve>(target, "ImDrawList_PrimReserve");
  sfmljs::SetMethod<ImDrawListPrimUnreserve>(target,
                                             "ImDrawList_PrimUnreserve");
  sfmljs::SetMethod<ImDrawListPrimRect>(target, "ImDrawList_PrimRect");
  sfmljs::SetMethod<ImDrawListPrimRectUV>(target, "ImDrawList_PrimRectUV");
  sfmljs::SetMethod<ImDrawListPrimQuadUV>(target, "ImDrawList_PrimQuadUV");
  sfmljs::SetMethod<ImDrawListPrimWriteVtx>(target, "ImDrawList_PrimWriteVtx");
  sfmljs::SetMethod<ImDrawListPrimWriteIdx>(target, "ImDrawList_PrimWriteIdx");
  sfmljs::SetMethod<ImDrawListPrimVtx>(target, "ImDrawList_PrimVtx");
  sfmljs::SetMethod<ImDrawListResetForNewFrame>(target,
                                                "ImDrawList__ResetForNewFrame");
  sfmljs::SetMethod<ImDrawListClearFreeMemory>(target,
                                               "ImDrawList__ClearFreeMemory");
  sfmljs::SetMethod<ImDrawListPopUnusedDrawCmd>(target,
                                                "ImDrawList__PopUnusedDrawCmd");
  sfmljs::SetMethod<ImDrawListTryMergeDrawCmds>(target,
                                                "ImDrawList__TryMergeDrawCmds");
  sfmljs::SetMethod<ImDrawListOnChangedClipRect>(
      target, "ImDrawList__OnChangedClipRect");
  sfmljs::SetMethod<ImDrawListOnChangedTextureID>(
      target, "ImDrawList__OnChangedTextureID");
  sfmljs::SetMethod<ImDrawListOnChangedVtxOffset>(
      target, "ImDrawList__OnChangedVtxOffset");
  sfmljs::SetMethod<ImDrawListSetTextureID>(target, "ImDrawList__SetTextureID");
}

}  // namespace sfmlimgui
