// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_IMGUI_NATIVE_IMGUI_DRAW_CALLBACKS_H_
#define PACKAGES_SFML_JS_IMGUI_NATIVE_IMGUI_DRAW_CALLBACKS_H_

#include <nan.h>

#include <memory>

#include "native/cimgui.h"

namespace sfmlimgui {

NAN_MODULE_INIT(InitializeImGuiDrawCallbacks);
std::shared_ptr<cimgui::ImDrawList> OwnImGuiDrawListClone(
    cimgui::ImDrawList* clone);
void ClearImGuiDrawListCallbacks(cimgui::ImDrawList* list);
void TrackImGuiDrawData(cimgui::ImDrawData* data);
void RetainImGuiDrawList(cimgui::ImDrawData* data,
                         const std::shared_ptr<cimgui::ImDrawList>& list);
void ClearImGuiDrawDataOwners(cimgui::ImDrawData* data);
void ThrowPendingImGuiDrawCallbackException(
    const Nan::FunctionCallbackInfo<v8::Value>& info);

}  // namespace sfmlimgui

#endif  // PACKAGES_SFML_JS_IMGUI_NATIVE_IMGUI_DRAW_CALLBACKS_H_
