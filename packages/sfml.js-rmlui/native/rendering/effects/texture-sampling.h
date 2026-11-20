// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_TEXTURE_SAMPLING_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_TEXTURE_SAMPLING_H_

#include <SFML/Graphics/RenderTexture.hpp>

namespace sfmlrmlui {

// Restore a scratch texture's sampling mode even when a blur draw throws.
class ScopedTextureSampling {
 public:
  ScopedTextureSampling(sf::RenderTexture* target, bool smooth)
      : target_(target), smooth_(target->isSmooth()) {
    target_->setSmooth(smooth);
  }

  ~ScopedTextureSampling() { target_->setSmooth(smooth_); }

  ScopedTextureSampling(const ScopedTextureSampling&) = delete;
  ScopedTextureSampling& operator=(const ScopedTextureSampling&) = delete;

 private:
  sf::RenderTexture* target_;
  bool smooth_;
};

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_TEXTURE_SAMPLING_H_
