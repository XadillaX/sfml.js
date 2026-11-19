// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_MANAGER_RMLUI_RENDER_LAYERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_MANAGER_RMLUI_RENDER_LAYERS_H_

#include "native/rendering/manager/rmlui-render-manager.h"

namespace sfmlrmlui {

void ClearRenderLayers(RenderManagerState* manager);
bool CanPrepareRender(Rml::RenderManager* manager);
// Allow the current manager's layer, rejecting another manager's active target.
bool CanRenderToManager(Rml::RenderManager* manager);
// Unwind layers opened in the current effect scope before native traversal
// resumes. Preserve an existing JS exception instead of replacing it.
void RestoreRenderCallbackLayers(bool exception_pending);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_MANAGER_RMLUI_RENDER_LAYERS_H_
