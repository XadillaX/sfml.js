// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <imgui.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <memory>

#include "native/imgui-args.h"

namespace {

bool RequireContext() {
  if (ImGui::GetCurrentContext()) return true;
  Nan::ThrowError("ImGui context is not initialized");
  return false;
}

NAN_METHOD(GetIO) {
  if (!RequireContext()) return;
  auto* io = &ImGui::GetIO();
  // Aliasing shared_ptr: keeps the mapping alive without owning ImGui state.
  auto owner = std::shared_ptr<ImGuiIO>(io, [](ImGuiIO*) {});
  auto result = sfmljs::NumericFields()
                    .Add("configFlags", io->ConfigFlags)
                    .Add("backendFlags", io->BackendFlags)
                    .Add("displayWidth", io->DisplaySize.x, "f32")
                    .Add("displayHeight", io->DisplaySize.y, "f32")
                    .Add("deltaTime", io->DeltaTime)
                    .Add("iniSavingRate", io->IniSavingRate)
                    .Add("fontGlobalScale", io->FontGlobalScale)
                    .Add("wantCaptureMouse", io->WantCaptureMouse)
                    .Add("wantCaptureKeyboard", io->WantCaptureKeyboard)
                    .Add("wantTextInput", io->WantTextInput)
                    .Add("wantSetMousePos", io->WantSetMousePos)
                    .Add("mouseDrawCursor", io->MouseDrawCursor)
                    .Add("keyCtrl", io->KeyCtrl)
                    .Add("keyShift", io->KeyShift)
                    .Add("keyAlt", io->KeyAlt)
                    .Add("keySuper", io->KeySuper)
                    .Add("mousePosX", io->MousePos.x, "f32")
                    .Add("mousePosY", io->MousePos.y, "f32")
                    .Add("mouseDeltaX", io->MouseDelta.x, "f32")
                    .Add("mouseDeltaY", io->MouseDelta.y, "f32")
                    .Add("framerate", io->Framerate)
                    .Add("metricsRenderVertices", io->MetricsRenderVertices)
                    .Add("metricsRenderIndices", io->MetricsRenderIndices)
                    .Add("metricsRenderWindows", io->MetricsRenderWindows)
                    .Add("metricsActiveWindows", io->MetricsActiveWindows)
                    .Map(owner);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetStyle) {
  if (!RequireContext()) return;
  auto* style = &ImGui::GetStyle();
  auto owner = std::shared_ptr<ImGuiStyle>(style, [](ImGuiStyle*) {});
  auto result =
      sfmljs::NumericFields()
          .Add("alpha", style->Alpha)
          .Add("disabledAlpha", style->DisabledAlpha)
          .Add("windowPaddingX", style->WindowPadding.x, "f32")
          .Add("windowPaddingY", style->WindowPadding.y, "f32")
          .Add("windowRounding", style->WindowRounding)
          .Add("windowBorderSize", style->WindowBorderSize)
          .Add("childRounding", style->ChildRounding)
          .Add("childBorderSize", style->ChildBorderSize)
          .Add("popupRounding", style->PopupRounding)
          .Add("popupBorderSize", style->PopupBorderSize)
          .Add("framePaddingX", style->FramePadding.x, "f32")
          .Add("framePaddingY", style->FramePadding.y, "f32")
          .Add("frameRounding", style->FrameRounding)
          .Add("frameBorderSize", style->FrameBorderSize)
          .Add("itemSpacingX", style->ItemSpacing.x, "f32")
          .Add("itemSpacingY", style->ItemSpacing.y, "f32")
          .Add("itemInnerSpacingX", style->ItemInnerSpacing.x, "f32")
          .Add("itemInnerSpacingY", style->ItemInnerSpacing.y, "f32")
          .Add("cellPaddingX", style->CellPadding.x, "f32")
          .Add("cellPaddingY", style->CellPadding.y, "f32")
          .Add("scrollbarSize", style->ScrollbarSize)
          .Add("scrollbarRounding", style->ScrollbarRounding)
          .Add("grabMinSize", style->GrabMinSize)
          .Add("grabRounding", style->GrabRounding)
          .Add("tabRounding", style->TabRounding)
          .Add("buttonTextAlignX", style->ButtonTextAlign.x, "f32")
          .Add("buttonTextAlignY", style->ButtonTextAlign.y, "f32")
          .Add("selectableTextAlignX", style->SelectableTextAlign.x, "f32")
          .Add("selectableTextAlignY", style->SelectableTextAlign.y, "f32")
          .Add("antiAliasedLines", style->AntiAliasedLines)
          .Add("antiAliasedFill", style->AntiAliasedFill)
          .Map(owner);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(IOFonts) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiIO>::From(info[0]);
  if (!handle) return;
  sfmlimgui::ReturnStruct<cimgui::ImFontAtlas>(info, handle->owner()->Fonts);
}

NAN_METHOD(StyleColors) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiStyle>::From(info[0]);
  if (!handle) return;
  auto owner = handle->owner();
  info.GetReturnValue().Set(sfmljs::MapShared(
      info.GetIsolate(), owner, owner->Colors, sizeof(owner->Colors)));
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiContext) {
  sfmljs::SetMethod<GetIO>(target, "getIO");
  sfmljs::SetMethod<GetStyle>(target, "getStyle");
  sfmljs::SetMethod<IOFonts>(target, "ioFonts");
  sfmljs::SetMethod<StyleColors>(target, "styleColors");
}
