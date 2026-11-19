// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_TEXTURE_SOURCE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_TEXTURE_SOURCE_H_

#include <RmlUi/Core/Texture.h>
#include <nan.h>

namespace sfmlrmlui {

// Copy source metadata, never the upstream cache of borrowed manager pointers.
v8::Local<v8::Object> WrapTextureSource(const Rml::TextureSource& source);
void ReleaseTextureSourceBindings(bool unused_only);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_TEXTURE_SOURCE_H_
