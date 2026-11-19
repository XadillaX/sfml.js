// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_GEOMETRY_RMLUI_GEOMETRY_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_GEOMETRY_RMLUI_GEOMETRY_H_

#include <RmlUi/Core/Geometry.h>
#include <RmlUi/Core/Texture.h>
#include <nan.h>

#include <functional>
#include <memory>

namespace sfmlrmlui {

// Resolve after all JS accessors. A nonnull manager enforces ownership.
Rml::Geometry* GeometryOf(v8::Local<v8::Value> input,
                          Rml::RenderManager* manager,
                          bool require_valid = true);
// Clone borrowed clipping geometry into an independently owned resource.
v8::Local<v8::Object> WrapGeometrySnapshot(const Rml::Geometry& geometry,
                                           Rml::RenderManager* manager);
v8::Local<v8::Object> WrapTexture(Rml::Texture value,
                                  Rml::RenderManager* manager,
                                  std::shared_ptr<void> owner = {},
                                  std::function<bool()> valid = {},
                                  v8::Local<v8::Value> edge = {});
bool ReadTexture(v8::Local<v8::Value> input,
                 Rml::RenderManager* manager,
                 Rml::Texture* result);
void ReleaseGeometryBindings(bool unused_only);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_GEOMETRY_RMLUI_GEOMETRY_H_
