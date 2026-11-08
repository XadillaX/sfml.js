// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cstddef>
#include <string>

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(BeginDragDropSource) {
  ImGuiDragDropFlags flags = {};
  if (!ReadScalar(info, 0, &flags)) return;
  auto result = ::cimgui::ImGui_BeginDragDropSource(flags);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(SetDragDropPayload) {
  std::string type_utf8;
  const char* type = nullptr;
  if (!ReadUtf8(info, 0, &type_utf8, &type, true)) return;
  void* data = nullptr;
  if (!ReadPointer(info, 1, &data)) return;
  size_t size = 0;
  if (!ReadSize(info, 2, &size)) return;
  ImGuiCond condition = {};
  if (!ReadScalar(info, 3, &condition)) return;
  auto result = ::cimgui::ImGui_SetDragDropPayload(type, data, size, condition);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(EndDragDropSource) {
  ::cimgui::ImGui_EndDragDropSource();
}

NAN_METHOD(BeginDragDropTarget) {
  auto result = ::cimgui::ImGui_BeginDragDropTarget();
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(AcceptDragDropPayload) {
  std::string type_utf8;
  const char* type = nullptr;
  if (!ReadUtf8(info, 0, &type_utf8, &type, true)) return;
  ImGuiDragDropFlags flags = {};
  if (!ReadScalar(info, 1, &flags)) return;
  auto result = ::cimgui::ImGui_AcceptDragDropPayload(type, flags);
  ReturnStruct<cimgui::ImGuiPayload>(info, result);
}

NAN_METHOD(EndDragDropTarget) {
  ::cimgui::ImGui_EndDragDropTarget();
}

NAN_METHOD(GetDragDropPayload) {
  auto result = ::cimgui::ImGui_GetDragDropPayload();
  ReturnStruct<cimgui::ImGuiPayload>(info, result);
}

NAN_METHOD(PayloadClear) {
  cimgui::ImGuiPayload* payload = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    payload = ReadStruct<cimgui::ImGuiPayload>(info, 0);
    if (!payload) return;
  }
  ::cimgui::ImGuiPayload_Clear(payload);
}

NAN_METHOD(PayloadIsDataType) {
  cimgui::ImGuiPayload* payload = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    payload = ReadStruct<cimgui::ImGuiPayload>(info, 0);
    if (!payload) return;
  }
  std::string type_utf8;
  const char* type = nullptr;
  if (!ReadUtf8(info, 1, &type_utf8, &type, true)) return;
  auto result = ::cimgui::ImGuiPayload_IsDataType(payload, type);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(PayloadIsPreview) {
  cimgui::ImGuiPayload* payload = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    payload = ReadStruct<cimgui::ImGuiPayload>(info, 0);
    if (!payload) return;
  }
  auto result = ::cimgui::ImGuiPayload_IsPreview(payload);
  info.GetReturnValue().Set(Nan::New(result));
}

NAN_METHOD(PayloadIsDelivery) {
  cimgui::ImGuiPayload* payload = nullptr;
  if (!info[0]->IsUndefined() && !info[0]->IsNull()) {
    payload = ReadStruct<cimgui::ImGuiPayload>(info, 0);
    if (!payload) return;
  }
  auto result = ::cimgui::ImGuiPayload_IsDelivery(payload);
  info.GetReturnValue().Set(Nan::New(result));
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiDragDrop) {
  sfmljs::SetMethod<BeginDragDropSource>(target, "BeginDragDropSource");
  sfmljs::SetMethod<SetDragDropPayload>(target, "SetDragDropPayload");
  sfmljs::SetMethod<EndDragDropSource>(target, "EndDragDropSource");
  sfmljs::SetMethod<BeginDragDropTarget>(target, "BeginDragDropTarget");
  sfmljs::SetMethod<AcceptDragDropPayload>(target, "AcceptDragDropPayload");
  sfmljs::SetMethod<EndDragDropTarget>(target, "EndDragDropTarget");
  sfmljs::SetMethod<GetDragDropPayload>(target, "GetDragDropPayload");
  sfmljs::SetMethod<PayloadClear>(target, "Payload_Clear");
  sfmljs::SetMethod<PayloadIsDataType>(target, "Payload_IsDataType");
  sfmljs::SetMethod<PayloadIsPreview>(target, "Payload_IsPreview");
  sfmljs::SetMethod<PayloadIsDelivery>(target, "Payload_IsDelivery");
}

}  // namespace sfmlimgui
