// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_BOX_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_BOX_H_

#include <RmlUi/Core/Box.h>
#include <RmlUi/Core/RenderBox.h>
#include <nan.h>

namespace sfmlrmlui {

// Owned value snapshots have no runtime or element references.
v8::Local<v8::Object> WrapBox(const Rml::Box& box);
v8::Local<v8::Object> WrapRenderBox(const Rml::RenderBox& box);
bool CopyBox(v8::Local<v8::Value> handle, Rml::Box* result);
bool ReadBoxVector(v8::Local<v8::Value> value, Rml::Vector2f* result);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_BOX_H_
