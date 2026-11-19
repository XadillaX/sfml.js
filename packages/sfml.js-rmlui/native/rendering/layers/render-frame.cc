// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <stdexcept>
#include <utility>

#include "native/rendering/layers/stencil-attachment.h"
#include "native/rendering/render-interface-sfml.h"
#include <SFML/Graphics/Color.hpp>
#include <SFML/Window/ContextSettings.hpp>

namespace sfmlrmlui {

bool RenderInterfaceSFML::HasActiveFrame() const {
  return frame_state_ != nullptr;
}

void RenderInterfaceSFML::BeginFrame() {
  if (HasActiveFrame() || !layer_stack_.empty()) {
    throw std::logic_error("Render session requires a balanced layer stack");
  }
  if (!window_ || !window_->isOpen()) {
    throw std::runtime_error("Render session requires an open host window");
  }
  if (!shaders_ready_) {
    throw std::runtime_error("Render session requires initialized shaders");
  }
  FlushGeometry();
  const auto size = window_->getSize();
  if (!size.x || !size.y) {
    throw std::runtime_error("Render session requires nonzero dimensions");
  }
  if (!base_target_ || base_target_->getSize() != size) {
    sf::ContextSettings settings;
    settings.stencilBits = 8;
    auto target = std::make_unique<sf::RenderTexture>(size, settings);
    if (!VerifyStencilAttachment(target.get())) {
      throw std::runtime_error("RmlUi base layer requires an 8-bit stencil");
    }
    base_target_ = std::move(target);
    layer_pool_.clear();
    for (auto& target : post_targets_) {
      target.reset();
    }
    Diagnostics().Record(&DataDiagnostics::layer_allocations);
  }

  frame_state_ = std::make_unique<FrameState>(FrameState{
      window_->getView(),
      transform_,
      matrix_,
      transform_enabled_,
      scissor_enabled_,
      scissor_region_,
      clip_mask_enabled_,
      mask_reference_,
      clip_commands_,
  });
  mask_target_ = nullptr;
  try {
    WithoutScissor([&] {
      ApplyView(base_target_.get());
      base_target_->clear(sf::Color::Transparent);
      base_target_->clearStencil(sf::StencilValue(0));
    });
    BeginBatchRendering();
  } catch (...) {
    RollbackFrame();
    throw;
  }
}

void RenderInterfaceSFML::EndFrame() {
  if (!HasActiveFrame()) {
    throw std::logic_error("No active RmlUi render session");
  }
  if (!layer_stack_.empty()) {
    throw std::logic_error("Unbalanced RmlUi render session layer stack");
  }
  EndBatchRendering();
  base_target_->display();
  // Present the complete UI base after its own clipping has been applied.
  const sf::BlendMode blend(sf::BlendMode::Factor::One,
                            sf::BlendMode::Factor::OneMinusSrcAlpha);
  BlitFullscreen(base_target_->getTexture(), window_, blend, nullptr);
  RestoreFrameState();
}

void RenderInterfaceSFML::RollbackFrame() noexcept {
  if (!HasActiveFrame()) {
    return;
  }
  // Discard queued commands without drawing during exception unwinding.
  for (const auto& command : batch_commands_) {
    command.geometry->queued = false;
  }
  batch_commands_.clear();
  batch_vertices_ = 0;
  batch_texture_ = nullptr;
  batch_rendering_ = false;
  while (!layer_stack_.empty()) {
    auto layer = std::move(layer_stack_.back());
    layer_stack_.pop_back();
    RecycleLayer(std::move(layer));
  }
  RestoreFrameState();
}

void RenderInterfaceSFML::RestoreFrameState() noexcept {
  window_->setView(frame_state_->host_view);
  transform_ = frame_state_->transform;
  matrix_ = frame_state_->matrix;
  transform_enabled_ = frame_state_->transform_enabled;
  scissor_enabled_ = frame_state_->scissor_enabled;
  scissor_region_ = frame_state_->scissor_region;
  clip_mask_enabled_ = frame_state_->clip_mask_enabled;
  mask_reference_ = frame_state_->mask_reference;
  clip_commands_ = std::move(frame_state_->clip_commands);
  mask_target_ = nullptr;
  post_current_ = 0;
  frame_state_.reset();
}

}  // namespace sfmlrmlui
