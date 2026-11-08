// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"
#include "native/imgui-draw-callbacks.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(NewFrame) {
  ::cimgui::ImGui_NewFrame();
}

NAN_METHOD(EndFrame) {
  ::cimgui::ImGui_EndFrame();
}

NAN_METHOD(Render) {
  ::cimgui::ImGui_Render();
}

NAN_METHOD(GetDrawData) {
  auto result = ::cimgui::ImGui_GetDrawData();
  TrackImGuiDrawData(result);
  ReturnStruct<cimgui::ImDrawData>(info, result);
}

NAN_METHOD(GetVersion) {
  auto result = ::cimgui::ImGui_GetVersion();
  ReturnString(info, result);
}

NAN_METHOD(GetTime) {
  auto result = ::cimgui::ImGui_GetTime();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

NAN_METHOD(GetFrameCount) {
  auto result = ::cimgui::ImGui_GetFrameCount();
  info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiFrame) {
  sfmljs::SetMethod<NewFrame>(target, "NewFrame");
  sfmljs::SetMethod<EndFrame>(target, "EndFrame");
  sfmljs::SetMethod<Render>(target, "Render");
  sfmljs::SetMethod<GetDrawData>(target, "GetDrawData");
  sfmljs::SetMethod<GetVersion>(target, "GetVersion");
  sfmljs::SetMethod<GetTime>(target, "GetTime");
  sfmljs::SetMethod<GetFrameCount>(target, "GetFrameCount");
}

}  // namespace sfmlimgui
