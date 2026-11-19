// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_LAYERS_STENCIL_ATTACHMENT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_LAYERS_STENCIL_ATTACHMENT_H_

namespace sf {
class RenderTexture;
}

namespace sfmlrmlui {

// Validate actual eight-bit stencil comparison through SFML draws/readback.
// Called once per new target; only one cropped color pixel reaches the CPU.
bool VerifyStencilAttachment(sf::RenderTexture* target);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_LAYERS_STENCIL_ATTACHMENT_H_
