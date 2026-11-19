// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/render-interface-sfml.h"

#include <RmlUi/Core/Log.h>

#include <functional>
#include <stdexcept>

#include "native/rendering/effects/postprocess-shaders.h"
#include "native/rendering/shaders/geometry-program.h"
#include <SFML/Window/ContextSettings.hpp>

namespace sfmlrmlui {

void RenderInterfaceSFML::SetWindow(sf::RenderWindow* window) {
  if (HasActiveFrame() || !layer_stack_.empty()) {
    throw std::logic_error("Cannot replace a window during a render session");
  }
  FlushGeometry();
  if (!window) {
    window_ = nullptr;
    stencil_available_ = false;
    return;
  }
  if (!window->isOpen()) {
    throw std::runtime_error("RmlUi renderer requires an open host window");
  }
  if (shaders_ready_) {
    window_ = window;
    stencil_available_ = window->getSettings().stencilBits >= 8;
    return;
  }
  if (!sf::Shader::isAvailable()) {
    Rml::Log::Message(Rml::Log::LT_ERROR,
                      "SFML shaders unavailable; RmlUi cannot render.");
    throw std::runtime_error("SFML shaders are unavailable");
  }
  shaders_ready_ =
      geometry_color_shader_.loadFromMemory(kGeometryVertexShader,
                                            kGeometryColorFragmentShader) &&
      geometry_texture_shader_.loadFromMemory(kGeometryVertexShader,
                                              kGeometryTextureFragmentShader) &&
      blur_shader_.loadFromMemory(kBlurVertexShader, kBlurFragmentShader) &&
      drop_shadow_shader_.loadFromMemory(kPostprocessVertexShader,
                                         kDropShadowFragmentShader) &&
      mask_shader_.loadFromMemory(kPostprocessVertexShader,
                                  kMaskFragmentShader) &&
      color_filter_shader_.loadFromMemory(kPostprocessVertexShader,
                                          kColorFilterFragmentShader);
  if (!shaders_ready_) {
    throw std::runtime_error("Failed to compile required RmlUi shaders");
  }
  geometry_texture_shader_.setUniform("texture", sf::Shader::CurrentTexture);
  window_ = window;
  stencil_available_ = window->getSettings().stencilBits >= 8;
}

sf::RenderTarget* RenderInterfaceSFML::ActiveTarget() {
  if (layer_stack_.empty()) {
    if (HasActiveFrame()) {
      return base_target_.get();
    }
    return window_;
  }
  return layer_stack_.back()->target.get();
}

sf::Vector2u RenderInterfaceSFML::ActiveTargetSize() const {
  if (layer_stack_.empty()) {
    return HasActiveFrame() ? base_target_->getSize() : window_->getSize();
  }
  return layer_stack_.back()->target->getSize();
}

void RenderInterfaceSFML::ApplyView(sf::RenderTarget* target) {
  // RmlUi coordinates map 1:1 to top-left pixels. Scissor limits writes
  // through SFML's state cache without altering the viewport mapping.
  const auto size = target->getSize();
  sf::View view(sf::FloatRect(
      {0.f, 0.f}, {static_cast<float>(size.x), static_cast<float>(size.y)}));
  if (scissor_enabled_) {
    const auto position = scissor_region_.Position();
    const auto region = scissor_region_.Size();
    view.setScissor(sf::FloatRect({static_cast<float>(position.x) / size.x,
                                   static_cast<float>(position.y) / size.y},
                                  {static_cast<float>(region.x) / size.x,
                                   static_cast<float>(region.y) / size.y}));
  }
  target->setView(view);
}

void RenderInterfaceSFML::WithoutScissor(const std::function<void()>& draw) {
  const bool was_enabled = scissor_enabled_;
  scissor_enabled_ = false;
  try {
    draw();
  } catch (...) {
    scissor_enabled_ = was_enabled;
    throw;
  }
  scissor_enabled_ = was_enabled;
}

}  // namespace sfmlrmlui
