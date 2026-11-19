// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_SPRITESHEET_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_SPRITESHEET_H_

#include <RmlUi/Core/Spritesheet.h>
#include <nan.h>

namespace sfmlrmlui {

// A complete metadata snapshot with a separately owned TextureSource.
// Upstream Sprite pointers are invalidated by subsequent sprite insertion.
v8::Local<v8::Value> WrapSprite(const Rml::Sprite* sprite);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_SPRITESHEET_H_
