// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-args.h"
#include "native/imgui-bindings.h"
#include "native/imgui-glyph-fields.h"

namespace sfmlimgui {
namespace {

NAN_METHOD(ViewImDrawCmd) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImDrawCmd>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result =
      sfmljs::NumericFields()
          .Add("ClipRectX", value.ClipRect.x, "f32")
          .Add("ClipRectY", value.ClipRect.y, "f32")
          .Add("ClipRectZ", value.ClipRect.z, "f32")
          .Add("ClipRectW", value.ClipRect.w, "f32")
          .Add("TextureId", value.TextureId, "u64")
          .Add("VtxOffset", value.VtxOffset, "u32")
          .Add("IdxOffset", value.IdxOffset, "u32")
          .Add("ElemCount", value.ElemCount, "u32")
          .Add("UserCallbackDataSize", value.UserCallbackDataSize, "i32")
          .Add("UserCallbackDataOffset", value.UserCallbackDataOffset, "i32")
          .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImDrawData) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImDrawData>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("Valid", value.Valid, "bool")
                    .Add("CmdListsCount", value.CmdListsCount, "i32")
                    .Add("TotalIdxCount", value.TotalIdxCount, "i32")
                    .Add("TotalVtxCount", value.TotalVtxCount, "i32")
                    .Add("DisplayPosX", value.DisplayPos.x, "f32")
                    .Add("DisplayPosY", value.DisplayPos.y, "f32")
                    .Add("DisplaySizeX", value.DisplaySize.x, "f32")
                    .Add("DisplaySizeY", value.DisplaySize.y, "f32")
                    .Add("FramebufferScaleX", value.FramebufferScale.x, "f32")
                    .Add("FramebufferScaleY", value.FramebufferScale.y, "f32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImDrawList) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImDrawList>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("Flags", value.Flags, "i32")
                    .Add("_VtxCurrentIdx", value._VtxCurrentIdx, "u32")
                    .Add("_FringeScale", value._FringeScale, "f32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImDrawListSplitter) {
  auto* handle =
      sfmljs::SharedHandle<cimgui::ImDrawListSplitter>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("_Current", value._Current, "i32")
                    .Add("_Count", value._Count, "i32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImFontAtlas) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImFontAtlas>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("Flags", value.Flags, "i32")
                    .Add("TexID", value.TexID, "u64")
                    .Add("TexDesiredWidth", value.TexDesiredWidth, "i32")
                    .Add("TexGlyphPadding", value.TexGlyphPadding, "i32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImFontAtlasCustomRect) {
  auto* handle =
      sfmljs::SharedHandle<cimgui::ImFontAtlasCustomRect>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("X", value.X, "u16")
                    .Add("Y", value.Y, "u16")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImFontConfig) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImFontConfig>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result =
      sfmljs::NumericFields()
          .Add("FontDataSize", value.FontDataSize, "i32")
          .Add("FontDataOwnedByAtlas", value.FontDataOwnedByAtlas, "bool")
          .Add("MergeMode", value.MergeMode, "bool")
          .Add("PixelSnapH", value.PixelSnapH, "bool")
          .Add("FontNo", value.FontNo, "i32")
          .Add("OversampleH", value.OversampleH, "i32")
          .Add("OversampleV", value.OversampleV, "i32")
          .Add("SizePixels", value.SizePixels, "f32")
          .Add("GlyphOffsetX", value.GlyphOffset.x, "f32")
          .Add("GlyphOffsetY", value.GlyphOffset.y, "f32")
          .Add("GlyphMinAdvanceX", value.GlyphMinAdvanceX, "f32")
          .Add("GlyphMaxAdvanceX", value.GlyphMaxAdvanceX, "f32")
          .Add("GlyphExtraAdvanceX", value.GlyphExtraAdvanceX, "f32")
          .Add("FontBuilderFlags", value.FontBuilderFlags, "u32")
          .Add("RasterizerMultiply", value.RasterizerMultiply, "f32")
          .Add("RasterizerDensity", value.RasterizerDensity, "f32")
          .Add("EllipsisChar", value.EllipsisChar, "u16")
          .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImFontGlyph) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImFontGlyph>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("AdvanceX", value.AdvanceX, "f32")
                    .Add("X0", value.X0, "f32")
                    .Add("Y0", value.Y0, "f32")
                    .Add("X1", value.X1, "f32")
                    .Add("Y1", value.Y1, "f32")
                    .Add("U0", value.U0, "f32")
                    .Add("V0", value.V0, "f32")
                    .Add("U1", value.U1, "f32")
                    .Add("V1", value.V1, "f32")
                    .Map(handle->owner());
  Nan::Set(result,
           Nan::New("bitfields").ToLocalChecked(),
           FontGlyphBitfields(info[0]))
      .FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiIO) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiIO>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result =
      sfmljs::NumericFields()
          .Add("ConfigFlags", value.ConfigFlags, "i32")
          .Add("BackendFlags", value.BackendFlags, "i32")
          .Add("DisplaySizeX", value.DisplaySize.x, "f32")
          .Add("DisplaySizeY", value.DisplaySize.y, "f32")
          .Add("DeltaTime", value.DeltaTime, "f32")
          .Add("IniSavingRate", value.IniSavingRate, "f32")
          .Add("FontGlobalScale", value.FontGlobalScale, "f32")
          .Add("FontAllowUserScaling", value.FontAllowUserScaling, "bool")
          .Add("DisplayFramebufferScaleX",
               value.DisplayFramebufferScale.x,
               "f32")
          .Add("DisplayFramebufferScaleY",
               value.DisplayFramebufferScale.y,
               "f32")
          .Add("ConfigNavSwapGamepadButtons",
               value.ConfigNavSwapGamepadButtons,
               "bool")
          .Add("ConfigNavMoveSetMousePos",
               value.ConfigNavMoveSetMousePos,
               "bool")
          .Add("ConfigNavCaptureKeyboard",
               value.ConfigNavCaptureKeyboard,
               "bool")
          .Add("ConfigNavEscapeClearFocusItem",
               value.ConfigNavEscapeClearFocusItem,
               "bool")
          .Add("ConfigNavEscapeClearFocusWindow",
               value.ConfigNavEscapeClearFocusWindow,
               "bool")
          .Add("ConfigNavCursorVisibleAuto",
               value.ConfigNavCursorVisibleAuto,
               "bool")
          .Add("ConfigNavCursorVisibleAlways",
               value.ConfigNavCursorVisibleAlways,
               "bool")
          .Add("MouseDrawCursor", value.MouseDrawCursor, "bool")
          .Add("ConfigMacOSXBehaviors", value.ConfigMacOSXBehaviors, "bool")
          .Add("ConfigInputTrickleEventQueue",
               value.ConfigInputTrickleEventQueue,
               "bool")
          .Add("ConfigInputTextCursorBlink",
               value.ConfigInputTextCursorBlink,
               "bool")
          .Add("ConfigInputTextEnterKeepActive",
               value.ConfigInputTextEnterKeepActive,
               "bool")
          .Add("ConfigDragClickToInputText",
               value.ConfigDragClickToInputText,
               "bool")
          .Add("ConfigWindowsResizeFromEdges",
               value.ConfigWindowsResizeFromEdges,
               "bool")
          .Add("ConfigWindowsMoveFromTitleBarOnly",
               value.ConfigWindowsMoveFromTitleBarOnly,
               "bool")
          .Add("ConfigWindowsCopyContentsWithCtrlC",
               value.ConfigWindowsCopyContentsWithCtrlC,
               "bool")
          .Add("ConfigScrollbarScrollByPage",
               value.ConfigScrollbarScrollByPage,
               "bool")
          .Add(
              "ConfigMemoryCompactTimer", value.ConfigMemoryCompactTimer, "f32")
          .Add("MouseDoubleClickTime", value.MouseDoubleClickTime, "f32")
          .Add("MouseDoubleClickMaxDist", value.MouseDoubleClickMaxDist, "f32")
          .Add("MouseDragThreshold", value.MouseDragThreshold, "f32")
          .Add("KeyRepeatDelay", value.KeyRepeatDelay, "f32")
          .Add("KeyRepeatRate", value.KeyRepeatRate, "f32")
          .Add("ConfigErrorRecovery", value.ConfigErrorRecovery, "bool")
          .Add("ConfigErrorRecoveryEnableAssert",
               value.ConfigErrorRecoveryEnableAssert,
               "bool")
          .Add("ConfigErrorRecoveryEnableDebugLog",
               value.ConfigErrorRecoveryEnableDebugLog,
               "bool")
          .Add("ConfigErrorRecoveryEnableTooltip",
               value.ConfigErrorRecoveryEnableTooltip,
               "bool")
          .Add("ConfigDebugIsDebuggerPresent",
               value.ConfigDebugIsDebuggerPresent,
               "bool")
          .Add("ConfigDebugHighlightIdConflicts",
               value.ConfigDebugHighlightIdConflicts,
               "bool")
          .Add("ConfigDebugHighlightIdConflictsShowItemPicker",
               value.ConfigDebugHighlightIdConflictsShowItemPicker,
               "bool")
          .Add("ConfigDebugBeginReturnValueOnce",
               value.ConfigDebugBeginReturnValueOnce,
               "bool")
          .Add("ConfigDebugBeginReturnValueLoop",
               value.ConfigDebugBeginReturnValueLoop,
               "bool")
          .Add("ConfigDebugIgnoreFocusLoss",
               value.ConfigDebugIgnoreFocusLoss,
               "bool")
          .Add("ConfigDebugIniSettings", value.ConfigDebugIniSettings, "bool")
          .Add("WantCaptureMouse", value.WantCaptureMouse, "bool")
          .Add("WantCaptureKeyboard", value.WantCaptureKeyboard, "bool")
          .Add("WantTextInput", value.WantTextInput, "bool")
          .Add("WantSetMousePos", value.WantSetMousePos, "bool")
          .Add("WantSaveIniSettings", value.WantSaveIniSettings, "bool")
          .Add("NavActive", value.NavActive, "bool")
          .Add("NavVisible", value.NavVisible, "bool")
          .Add("Framerate", value.Framerate, "f32")
          .Add("MetricsRenderVertices", value.MetricsRenderVertices, "i32")
          .Add("MetricsRenderIndices", value.MetricsRenderIndices, "i32")
          .Add("MetricsRenderWindows", value.MetricsRenderWindows, "i32")
          .Add("MetricsActiveWindows", value.MetricsActiveWindows, "i32")
          .Add("MouseDeltaX", value.MouseDelta.x, "f32")
          .Add("MouseDeltaY", value.MouseDelta.y, "f32")
          .Add("MousePosX", value.MousePos.x, "f32")
          .Add("MousePosY", value.MousePos.y, "f32")
          .Add("MouseDown0", value.MouseDown[0], "bool")
          .Add("MouseDown1", value.MouseDown[1], "bool")
          .Add("MouseDown2", value.MouseDown[2], "bool")
          .Add("MouseDown3", value.MouseDown[3], "bool")
          .Add("MouseDown4", value.MouseDown[4], "bool")
          .Add("MouseWheel", value.MouseWheel, "f32")
          .Add("MouseWheelH", value.MouseWheelH, "f32")
          .Add("MouseSource", value.MouseSource, "i32")
          .Add("KeyCtrl", value.KeyCtrl, "bool")
          .Add("KeyShift", value.KeyShift, "bool")
          .Add("KeyAlt", value.KeyAlt, "bool")
          .Add("KeySuper", value.KeySuper, "bool")
          .Add("KeyMods", value.KeyMods, "i32")
          .Add("WantCaptureMouseUnlessPopupClose",
               value.WantCaptureMouseUnlessPopupClose,
               "bool")
          .Add("MousePosPrevX", value.MousePosPrev.x, "f32")
          .Add("MousePosPrevY", value.MousePosPrev.y, "f32")
          .Add("MouseClickedTime0", value.MouseClickedTime[0], "f64")
          .Add("MouseClickedTime1", value.MouseClickedTime[1], "f64")
          .Add("MouseClickedTime2", value.MouseClickedTime[2], "f64")
          .Add("MouseClickedTime3", value.MouseClickedTime[3], "f64")
          .Add("MouseClickedTime4", value.MouseClickedTime[4], "f64")
          .Add("MouseClicked0", value.MouseClicked[0], "bool")
          .Add("MouseClicked1", value.MouseClicked[1], "bool")
          .Add("MouseClicked2", value.MouseClicked[2], "bool")
          .Add("MouseClicked3", value.MouseClicked[3], "bool")
          .Add("MouseClicked4", value.MouseClicked[4], "bool")
          .Add("MouseDoubleClicked0", value.MouseDoubleClicked[0], "bool")
          .Add("MouseDoubleClicked1", value.MouseDoubleClicked[1], "bool")
          .Add("MouseDoubleClicked2", value.MouseDoubleClicked[2], "bool")
          .Add("MouseDoubleClicked3", value.MouseDoubleClicked[3], "bool")
          .Add("MouseDoubleClicked4", value.MouseDoubleClicked[4], "bool")
          .Add("MouseClickedCount0", value.MouseClickedCount[0], "u16")
          .Add("MouseClickedCount1", value.MouseClickedCount[1], "u16")
          .Add("MouseClickedCount2", value.MouseClickedCount[2], "u16")
          .Add("MouseClickedCount3", value.MouseClickedCount[3], "u16")
          .Add("MouseClickedCount4", value.MouseClickedCount[4], "u16")
          .Add("MouseClickedLastCount0", value.MouseClickedLastCount[0], "u16")
          .Add("MouseClickedLastCount1", value.MouseClickedLastCount[1], "u16")
          .Add("MouseClickedLastCount2", value.MouseClickedLastCount[2], "u16")
          .Add("MouseClickedLastCount3", value.MouseClickedLastCount[3], "u16")
          .Add("MouseClickedLastCount4", value.MouseClickedLastCount[4], "u16")
          .Add("MouseReleased0", value.MouseReleased[0], "bool")
          .Add("MouseReleased1", value.MouseReleased[1], "bool")
          .Add("MouseReleased2", value.MouseReleased[2], "bool")
          .Add("MouseReleased3", value.MouseReleased[3], "bool")
          .Add("MouseReleased4", value.MouseReleased[4], "bool")
          .Add("MouseReleasedTime0", value.MouseReleasedTime[0], "f64")
          .Add("MouseReleasedTime1", value.MouseReleasedTime[1], "f64")
          .Add("MouseReleasedTime2", value.MouseReleasedTime[2], "f64")
          .Add("MouseReleasedTime3", value.MouseReleasedTime[3], "f64")
          .Add("MouseReleasedTime4", value.MouseReleasedTime[4], "f64")
          .Add("MouseDownOwned0", value.MouseDownOwned[0], "bool")
          .Add("MouseDownOwned1", value.MouseDownOwned[1], "bool")
          .Add("MouseDownOwned2", value.MouseDownOwned[2], "bool")
          .Add("MouseDownOwned3", value.MouseDownOwned[3], "bool")
          .Add("MouseDownOwned4", value.MouseDownOwned[4], "bool")
          .Add("MouseDownOwnedUnlessPopupClose0",
               value.MouseDownOwnedUnlessPopupClose[0],
               "bool")
          .Add("MouseDownOwnedUnlessPopupClose1",
               value.MouseDownOwnedUnlessPopupClose[1],
               "bool")
          .Add("MouseDownOwnedUnlessPopupClose2",
               value.MouseDownOwnedUnlessPopupClose[2],
               "bool")
          .Add("MouseDownOwnedUnlessPopupClose3",
               value.MouseDownOwnedUnlessPopupClose[3],
               "bool")
          .Add("MouseDownOwnedUnlessPopupClose4",
               value.MouseDownOwnedUnlessPopupClose[4],
               "bool")
          .Add("MouseWheelRequestAxisSwap",
               value.MouseWheelRequestAxisSwap,
               "bool")
          .Add("MouseCtrlLeftAsRightClick",
               value.MouseCtrlLeftAsRightClick,
               "bool")
          .Add("MouseDownDuration0", value.MouseDownDuration[0], "f32")
          .Add("MouseDownDuration1", value.MouseDownDuration[1], "f32")
          .Add("MouseDownDuration2", value.MouseDownDuration[2], "f32")
          .Add("MouseDownDuration3", value.MouseDownDuration[3], "f32")
          .Add("MouseDownDuration4", value.MouseDownDuration[4], "f32")
          .Add("MouseDownDurationPrev0", value.MouseDownDurationPrev[0], "f32")
          .Add("MouseDownDurationPrev1", value.MouseDownDurationPrev[1], "f32")
          .Add("MouseDownDurationPrev2", value.MouseDownDurationPrev[2], "f32")
          .Add("MouseDownDurationPrev3", value.MouseDownDurationPrev[3], "f32")
          .Add("MouseDownDurationPrev4", value.MouseDownDurationPrev[4], "f32")
          .Add("MouseDragMaxDistanceSqr0",
               value.MouseDragMaxDistanceSqr[0],
               "f32")
          .Add("MouseDragMaxDistanceSqr1",
               value.MouseDragMaxDistanceSqr[1],
               "f32")
          .Add("MouseDragMaxDistanceSqr2",
               value.MouseDragMaxDistanceSqr[2],
               "f32")
          .Add("MouseDragMaxDistanceSqr3",
               value.MouseDragMaxDistanceSqr[3],
               "f32")
          .Add("MouseDragMaxDistanceSqr4",
               value.MouseDragMaxDistanceSqr[4],
               "f32")
          .Add("PenPressure", value.PenPressure, "f32")
          .Add("AppFocusLost", value.AppFocusLost, "bool")
          .Add("AppAcceptingEvents", value.AppAcceptingEvents, "bool")
          .Add("InputQueueSurrogate", value.InputQueueSurrogate, "u16")
          .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiInputTextCallbackData) {
  auto* handle =
      sfmljs::SharedHandle<cimgui::ImGuiInputTextCallbackData>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("EventFlag", value.EventFlag, "i32")
                    .Add("Flags", value.Flags, "i32")
                    .Add("EventChar", value.EventChar, "u16")
                    .Add("EventKey", value.EventKey, "i32")
                    .Add("BufTextLen", value.BufTextLen, "i32")
                    .Add("BufSize", value.BufSize, "i32")
                    .Add("BufDirty", value.BufDirty, "bool")
                    .Add("CursorPos", value.CursorPos, "i32")
                    .Add("SelectionStart", value.SelectionStart, "i32")
                    .Add("SelectionEnd", value.SelectionEnd, "i32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiListClipper) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiListClipper>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("DisplayStart", value.DisplayStart, "i32")
                    .Add("DisplayEnd", value.DisplayEnd, "i32")
                    .Add("ItemsCount", value.ItemsCount, "i32")
                    .Add("ItemsHeight", value.ItemsHeight, "f32")
                    .Add("StartPosY", value.StartPosY, "f32")
                    .Add("StartSeekOffsetY", value.StartSeekOffsetY, "f64")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiMultiSelectIO) {
  auto* handle =
      sfmljs::SharedHandle<cimgui::ImGuiMultiSelectIO>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("RangeSrcItem", value.RangeSrcItem, "i64")
                    .Add("NavIdItem", value.NavIdItem, "i64")
                    .Add("NavIdSelected", value.NavIdSelected, "bool")
                    .Add("RangeSrcReset", value.RangeSrcReset, "bool")
                    .Add("ItemsCount", value.ItemsCount, "i32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiPayload) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiPayload>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("DataSize", value.DataSize, "i32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiPlatformIO) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiPlatformIO>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("Platform_LocaleDecimalPoint",
                         value.Platform_LocaleDecimalPoint,
                         "u16")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiSelectionBasicStorage) {
  auto* handle =
      sfmljs::SharedHandle<cimgui::ImGuiSelectionBasicStorage>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("Size", value.Size, "i32")
                    .Add("PreserveOrder", value.PreserveOrder, "bool")
                    .Add("_SelectionOrder", value._SelectionOrder, "i32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiStyle) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiStyle>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result =
      sfmljs::NumericFields()
          .Add("Alpha", value.Alpha, "f32")
          .Add("DisabledAlpha", value.DisabledAlpha, "f32")
          .Add("WindowPaddingX", value.WindowPadding.x, "f32")
          .Add("WindowPaddingY", value.WindowPadding.y, "f32")
          .Add("WindowRounding", value.WindowRounding, "f32")
          .Add("WindowBorderSize", value.WindowBorderSize, "f32")
          .Add(
              "WindowBorderHoverPadding", value.WindowBorderHoverPadding, "f32")
          .Add("WindowMinSizeX", value.WindowMinSize.x, "f32")
          .Add("WindowMinSizeY", value.WindowMinSize.y, "f32")
          .Add("WindowTitleAlignX", value.WindowTitleAlign.x, "f32")
          .Add("WindowTitleAlignY", value.WindowTitleAlign.y, "f32")
          .Add(
              "WindowMenuButtonPosition", value.WindowMenuButtonPosition, "i32")
          .Add("ChildRounding", value.ChildRounding, "f32")
          .Add("ChildBorderSize", value.ChildBorderSize, "f32")
          .Add("PopupRounding", value.PopupRounding, "f32")
          .Add("PopupBorderSize", value.PopupBorderSize, "f32")
          .Add("FramePaddingX", value.FramePadding.x, "f32")
          .Add("FramePaddingY", value.FramePadding.y, "f32")
          .Add("FrameRounding", value.FrameRounding, "f32")
          .Add("FrameBorderSize", value.FrameBorderSize, "f32")
          .Add("ItemSpacingX", value.ItemSpacing.x, "f32")
          .Add("ItemSpacingY", value.ItemSpacing.y, "f32")
          .Add("ItemInnerSpacingX", value.ItemInnerSpacing.x, "f32")
          .Add("ItemInnerSpacingY", value.ItemInnerSpacing.y, "f32")
          .Add("CellPaddingX", value.CellPadding.x, "f32")
          .Add("CellPaddingY", value.CellPadding.y, "f32")
          .Add("TouchExtraPaddingX", value.TouchExtraPadding.x, "f32")
          .Add("TouchExtraPaddingY", value.TouchExtraPadding.y, "f32")
          .Add("IndentSpacing", value.IndentSpacing, "f32")
          .Add("ColumnsMinSpacing", value.ColumnsMinSpacing, "f32")
          .Add("ScrollbarSize", value.ScrollbarSize, "f32")
          .Add("ScrollbarRounding", value.ScrollbarRounding, "f32")
          .Add("GrabMinSize", value.GrabMinSize, "f32")
          .Add("GrabRounding", value.GrabRounding, "f32")
          .Add("LogSliderDeadzone", value.LogSliderDeadzone, "f32")
          .Add("ImageBorderSize", value.ImageBorderSize, "f32")
          .Add("TabRounding", value.TabRounding, "f32")
          .Add("TabBorderSize", value.TabBorderSize, "f32")
          .Add("TabCloseButtonMinWidthSelected",
               value.TabCloseButtonMinWidthSelected,
               "f32")
          .Add("TabCloseButtonMinWidthUnselected",
               value.TabCloseButtonMinWidthUnselected,
               "f32")
          .Add("TabBarBorderSize", value.TabBarBorderSize, "f32")
          .Add("TabBarOverlineSize", value.TabBarOverlineSize, "f32")
          .Add("TableAngledHeadersAngle", value.TableAngledHeadersAngle, "f32")
          .Add("TableAngledHeadersTextAlignX",
               value.TableAngledHeadersTextAlign.x,
               "f32")
          .Add("TableAngledHeadersTextAlignY",
               value.TableAngledHeadersTextAlign.y,
               "f32")
          .Add("ColorButtonPosition", value.ColorButtonPosition, "i32")
          .Add("ButtonTextAlignX", value.ButtonTextAlign.x, "f32")
          .Add("ButtonTextAlignY", value.ButtonTextAlign.y, "f32")
          .Add("SelectableTextAlignX", value.SelectableTextAlign.x, "f32")
          .Add("SelectableTextAlignY", value.SelectableTextAlign.y, "f32")
          .Add("SeparatorTextBorderSize", value.SeparatorTextBorderSize, "f32")
          .Add("SeparatorTextAlignX", value.SeparatorTextAlign.x, "f32")
          .Add("SeparatorTextAlignY", value.SeparatorTextAlign.y, "f32")
          .Add("SeparatorTextPaddingX", value.SeparatorTextPadding.x, "f32")
          .Add("SeparatorTextPaddingY", value.SeparatorTextPadding.y, "f32")
          .Add("DisplayWindowPaddingX", value.DisplayWindowPadding.x, "f32")
          .Add("DisplayWindowPaddingY", value.DisplayWindowPadding.y, "f32")
          .Add("DisplaySafeAreaPaddingX", value.DisplaySafeAreaPadding.x, "f32")
          .Add("DisplaySafeAreaPaddingY", value.DisplaySafeAreaPadding.y, "f32")
          .Add("MouseCursorScale", value.MouseCursorScale, "f32")
          .Add("AntiAliasedLines", value.AntiAliasedLines, "bool")
          .Add("AntiAliasedLinesUseTex", value.AntiAliasedLinesUseTex, "bool")
          .Add("AntiAliasedFill", value.AntiAliasedFill, "bool")
          .Add("CurveTessellationTol", value.CurveTessellationTol, "f32")
          .Add("CircleTessellationMaxError",
               value.CircleTessellationMaxError,
               "f32")
          .Add("HoverStationaryDelay", value.HoverStationaryDelay, "f32")
          .Add("HoverDelayShort", value.HoverDelayShort, "f32")
          .Add("HoverDelayNormal", value.HoverDelayNormal, "f32")
          .Add("HoverFlagsForTooltipMouse",
               value.HoverFlagsForTooltipMouse,
               "i32")
          .Add("HoverFlagsForTooltipNav", value.HoverFlagsForTooltipNav, "i32")
          .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiTableSortSpecs) {
  auto* handle =
      sfmljs::SharedHandle<cimgui::ImGuiTableSortSpecs>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("SpecsCount", value.SpecsCount, "i32")
                    .Add("SpecsDirty", value.SpecsDirty, "bool")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiTextFilter) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiTextFilter>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("CountGrep", value.CountGrep, "i32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewImGuiViewport) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImGuiViewport>::From(info[0]);
  if (!handle) return;
  const auto& value = *handle->owner();
  auto result = sfmljs::NumericFields()
                    .Add("ID", value.ID, "u32")
                    .Add("Flags", value.Flags, "i32")
                    .Add("PosX", value.Pos.x, "f32")
                    .Add("PosY", value.Pos.y, "f32")
                    .Add("SizeX", value.Size.x, "f32")
                    .Add("SizeY", value.Size.y, "f32")
                    .Add("WorkPosX", value.WorkPos.x, "f32")
                    .Add("WorkPosY", value.WorkPos.y, "f32")
                    .Add("WorkSizeX", value.WorkSize.x, "f32")
                    .Add("WorkSizeY", value.WorkSize.y, "f32")
                    .Map(handle->owner());
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeImGuiStructViews) {
  sfmljs::SetMethod<ViewImDrawCmd>(target, "viewImDrawCmd");
  sfmljs::SetMethod<ViewImDrawData>(target, "viewImDrawData");
  sfmljs::SetMethod<ViewImDrawList>(target, "viewImDrawList");
  sfmljs::SetMethod<ViewImDrawListSplitter>(target, "viewImDrawListSplitter");
  sfmljs::SetMethod<ViewImFontAtlas>(target, "viewImFontAtlas");
  sfmljs::SetMethod<ViewImFontAtlasCustomRect>(target,
                                               "viewImFontAtlasCustomRect");
  sfmljs::SetMethod<ViewImFontConfig>(target, "viewImFontConfig");
  sfmljs::SetMethod<ViewImFontGlyph>(target, "viewImFontGlyph");
  sfmljs::SetMethod<ViewImGuiIO>(target, "viewImGuiIO");
  sfmljs::SetMethod<ViewImGuiInputTextCallbackData>(
      target, "viewImGuiInputTextCallbackData");
  sfmljs::SetMethod<ViewImGuiListClipper>(target, "viewImGuiListClipper");
  sfmljs::SetMethod<ViewImGuiMultiSelectIO>(target, "viewImGuiMultiSelectIO");
  sfmljs::SetMethod<ViewImGuiPayload>(target, "viewImGuiPayload");
  sfmljs::SetMethod<ViewImGuiPlatformIO>(target, "viewImGuiPlatformIO");
  sfmljs::SetMethod<ViewImGuiSelectionBasicStorage>(
      target, "viewImGuiSelectionBasicStorage");
  sfmljs::SetMethod<ViewImGuiStyle>(target, "viewImGuiStyle");
  sfmljs::SetMethod<ViewImGuiTableSortSpecs>(target, "viewImGuiTableSortSpecs");
  sfmljs::SetMethod<ViewImGuiTextFilter>(target, "viewImGuiTextFilter");
  sfmljs::SetMethod<ViewImGuiViewport>(target, "viewImGuiViewport");
}

}  // namespace sfmlimgui
