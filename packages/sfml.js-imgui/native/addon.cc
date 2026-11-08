// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <imgui.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include "native/imgui-bindings.h"

NAN_MODULE_INIT(InitializeImGuiContext);
NAN_MODULE_INIT(InitializeImGuiIntegration);

namespace sfmlimgui {
NAN_MODULE_INIT(InitializeImGuiFormatted);
NAN_MODULE_INIT(InitializeImGuiFontRanges);
NAN_MODULE_INIT(InitializeImGuiCallbacks);
NAN_MODULE_INIT(InitializeImGuiDrawCallbacks);
NAN_MODULE_INIT(InitializeImGuiReferences);
NAN_MODULE_INIT(InitializeImGuiValues);
}  // namespace sfmlimgui

namespace {

NAN_MODULE_INIT(InitializeModule) {
  sfmljs::InitializeErrors(target);
  InitializeImGuiContext(target);
  InitializeImGuiIntegration(target);
  sfmlimgui::InitializeImGuiFormatted(target);
  sfmlimgui::InitializeImGuiFontRanges(target);
  sfmlimgui::InitializeImGuiCallbacks(target);
  sfmlimgui::InitializeImGuiDrawCallbacks(target);
  sfmlimgui::InitializeImGuiReferences(target);
  sfmlimgui::InitializeImGuiValues(target);
  sfmlimgui::InitializeImGuiFrame(target);
  sfmlimgui::InitializeImGuiDebug(target);
  sfmlimgui::InitializeImGuiWindows(target);
  sfmlimgui::InitializeImGuiStyle(target);
  sfmlimgui::InitializeImGuiLayout(target);
  sfmlimgui::InitializeImGuiItems(target);
  sfmlimgui::InitializeImGuiText(target);
  sfmlimgui::InitializeImGuiWidgets(target);
  sfmlimgui::InitializeImGuiDragWidgets(target);
  sfmlimgui::InitializeImGuiSliderWidgets(target);
  sfmlimgui::InitializeImGuiInputWidgets(target);
  sfmlimgui::InitializeImGuiSelection(target);
  sfmlimgui::InitializeImGuiPopups(target);
  sfmlimgui::InitializeImGuiTables(target);
  sfmlimgui::InitializeImGuiDragDrop(target);
  sfmlimgui::InitializeImGuiInput(target);
  sfmlimgui::InitializeImGuiIO(target);
  sfmlimgui::InitializeImGuiStorage(target);
  sfmlimgui::InitializeImGuiUtilities(target);
  sfmlimgui::InitializeImGuiDrawing(target);
  sfmlimgui::InitializeImGuiDrawPaths(target);
  sfmlimgui::InitializeImGuiDrawPrimitives(target);
  sfmlimgui::InitializeImGuiFont(target);
  sfmlimgui::InitializeImGuiStructViews(target);
}

NAN_MODULE_INIT(Initialize) {
  sfmljs::GuardExceptions(
      [&] { InitializeModule(target); },
      [](const char* message) { sfmljs::ThrowError(message); });
}

}  // namespace

NAN_MODULE_WORKER_ENABLED(imgui, Initialize)
