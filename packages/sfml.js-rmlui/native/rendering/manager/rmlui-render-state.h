// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_MANAGER_RMLUI_RENDER_STATE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_MANAGER_RMLUI_RENDER_STATE_H_

#include <RmlUi/Core/RenderManager.h>
#include <nan.h>

#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {

v8::Local<v8::Array> WrapClipMaskList(const Rml::ClipMaskGeometryList& masks,
                                      Rml::RenderManager* manager);
void ClearRenderClipStorage(RenderManagerState* manager);

template <Nan::FunctionCallback callback, bool read_only>
void RenderStateBoundary(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (!read_only && State().callback_depth > State().effect_callback_depth) {
    return Nan::ThrowError(
        "Render state mutation is not allowed in a callback");
  }
  callback(info);
}

template <Nan::FunctionCallback callback, bool read_only = false>
void SetRenderStateMethod(v8::Local<v8::Object> target, const char* name) {
  SetRuntimeMethod<RenderStateBoundary<callback, read_only>,
                   true,
                   true,
                   false,
                   false,
                   true>(target, name);
}

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_MANAGER_RMLUI_RENDER_STATE_H_
