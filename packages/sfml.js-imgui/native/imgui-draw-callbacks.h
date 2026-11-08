// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#pragma once

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
