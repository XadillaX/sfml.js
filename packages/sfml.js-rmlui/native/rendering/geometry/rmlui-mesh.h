// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_GEOMETRY_RMLUI_MESH_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_GEOMETRY_RMLUI_MESH_H_

#include <RmlUi/Core/Mesh.h>
#include <nan.h>

#include <cstddef>

namespace sfmlrmlui {

v8::Local<v8::Object> WrapMesh(Rml::Mesh value);
// Prepare an append without copying unless exported views retain old storage.
// Reserve both buffers before writes; counts include the existing prefix.
Rml::Mesh* PrepareMeshAppend(v8::Local<v8::Value> input,
                             size_t vertices,
                             size_t indices);
// Copy into immutable render storage, then replace the source allocation.
// Previously exported views retain the old allocation.
bool TakeMesh(v8::Local<v8::Value> input, Rml::Mesh* result);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_GEOMETRY_RMLUI_MESH_H_
