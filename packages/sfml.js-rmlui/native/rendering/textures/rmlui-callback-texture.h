// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_CALLBACK_TEXTURE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_CALLBACK_TEXTURE_H_

namespace sfmlrmlui {

// Release callbacks and all uniquely owned textures before manager deletion.
void ReleaseCallbackTextureBindings(bool unused_only);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_CALLBACK_TEXTURE_H_
