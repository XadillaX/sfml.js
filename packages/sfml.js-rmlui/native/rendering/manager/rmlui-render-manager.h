// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_MANAGER_RMLUI_RENDER_MANAGER_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_MANAGER_RMLUI_RENDER_MANAGER_H_

#include <RmlUi/Core/CompiledFilterShader.h>
#include <RmlUi/Core/RenderManager.h>
#include <nan.h>

#include <memory>
#include <vector>

namespace sfmlrmlui {

struct RenderClipStorage;

struct RenderManagerState {
  Rml::RenderManager* value{nullptr};
  Rml::RenderInterface* render_interface{nullptr};
  std::unique_ptr<Rml::RenderManager> owned;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
  // Copies referenced by cached native state; destroyed before owned manager.
  std::shared_ptr<RenderClipStorage> clip_storage;
};

std::shared_ptr<RenderManagerState> ShareRenderManager(
    Rml::RenderManager* manager);
std::shared_ptr<RenderManagerState> RenderManagerOf(v8::Local<v8::Value> input);
// Use only after all JS argument accessors; the returned reference is borrowed.
const Rml::CompiledShader* CompiledShaderOf(v8::Local<v8::Value> input,
                                            Rml::RenderManager* manager);
v8::Local<v8::Object> WrapRenderManager(Rml::RenderManager* manager);
v8::Local<v8::Object> WrapCompiledFilter(Rml::CompiledFilter value,
                                         Rml::RenderManager* manager);
bool TakeCompiledFilter(v8::Local<v8::Value> input,
                        Rml::RenderManager* manager,
                        Rml::CompiledFilter* result);
bool ReadFilterHandles(v8::Local<v8::Value> input,
                       Rml::RenderManager* manager,
                       std::vector<Rml::CompiledFilterHandle>* result);
// Invalidate borrowed unused managers before Rml::ReleaseRenderManagers.
// Shutdown also releases explicitly constructed, binding-owned managers.
void ReleaseRenderManagerBindings(bool unused_only);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_MANAGER_RMLUI_RENDER_MANAGER_H_
