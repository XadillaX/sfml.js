// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <stdexcept>

#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/shaders/geometry-program.h"
#include <SFML/Graphics/RectangleShape.hpp>
#include <SFML/Graphics/RenderStates.hpp>

namespace sfmlrmlui {

void RenderInterfaceSFML::EnableScissorRegion(bool enable) {
  FlushGeometry();
  if (scissor_enabled_ != enable) {
    mask_target_ = nullptr;
  }
  scissor_enabled_ = enable;
}

void RenderInterfaceSFML::SetScissorRegion(Rml::Rectanglei region) {
  FlushGeometry();
  if (scissor_region_ != region) {
    mask_target_ = nullptr;
  }
  scissor_region_ = region;
}

void RenderInterfaceSFML::EnableClipMask(bool enable) {
  FlushGeometry();
  clip_mask_enabled_ = enable;
}

void RenderInterfaceSFML::RenderToClipMask(Rml::ClipMaskOperation operation,
                                           Rml::CompiledGeometryHandle geometry,
                                           Rml::Vector2f translation) {
  FlushGeometry();
  if (!stencil_available_ && !HasActiveFrame() && layer_stack_.empty()) {
    throw std::runtime_error(
        "Clip mask requested but the window has no stencil buffer; "
        "create it with ContextSettings.stencilBits >= 8.");
  }
  if (geometry == 0) {
    return;
  }
  auto* record = reinterpret_cast<CompiledGeometryRecord*>(geometry);
  if (!EnsureSoloBuffer(record)) {
    throw std::runtime_error("Cannot upload RmlUi clip-mask vertex buffer");
  }
  if (operation != Rml::ClipMaskOperation::Intersect) {
    clip_commands_.clear();
  }
  clip_commands_.push_back({operation,
                            record->buffer,
                            matrix_,
                            translation,
                            scissor_enabled_,
                            scissor_region_});
  mask_target_ = nullptr;
}

sf::StencilMode RenderInterfaceSFML::ApplyClipMask(sf::RenderTarget* target) {
  if (!clip_mask_enabled_ || clip_commands_.empty() ||
      (!stencil_available_ && !HasActiveFrame() && layer_stack_.empty())) {
    return {};
  }
  if (mask_target_ != target) {
    const bool saved_scissor_enabled = scissor_enabled_;
    const auto saved_scissor_region = scissor_region_;
    mask_reference_ = 0;
    try {
      for (const auto& command : clip_commands_) {
        const bool intersect =
            command.operation == Rml::ClipMaskOperation::Intersect;
        const bool inverse =
            command.operation == Rml::ClipMaskOperation::SetInverse;
        if (!intersect) {
          WithoutScissor([&] {
            ApplyView(target);
            target->clearStencil(sf::StencilValue(inverse ? 1 : 0));
          });
          mask_reference_ = 1;
        } else if (mask_reference_ == 254) {
          NormalizeClipMask(target);
        }

        scissor_enabled_ = command.scissor_enabled;
        scissor_region_ = command.scissor_region;
        ApplyView(target);
        BindGeometryTransform(&geometry_color_shader_,
                              command.transform,
                              command.translation,
                              target->getSize());
        sf::RenderStates states;
        states.shader = &geometry_color_shader_;
        // Compare against the previous value before incrementing. Duplicate
        // fragments fail their second comparison and cannot advance twice.
        const unsigned int reference =
            intersect ? mask_reference_ : static_cast<unsigned>(!inverse);
        states.stencilMode = sf::StencilMode{
            intersect ? sf::StencilComparison::Equal
                      : sf::StencilComparison::Always,
            intersect ? sf::StencilUpdateOperation::Increment
                      : sf::StencilUpdateOperation::Replace,
            sf::StencilValue(reference),
            sf::StencilValue(255),
            true,
        };
        target->draw(*command.buffer, states);
        if (intersect) {
          ++mask_reference_;
        }
        Diagnostics().Record(&DataDiagnostics::mask_draws);
      }
    } catch (...) {
      scissor_enabled_ = saved_scissor_enabled;
      scissor_region_ = saved_scissor_region;
      throw;
    }
    scissor_enabled_ = saved_scissor_enabled;
    scissor_region_ = saved_scissor_region;
    ApplyView(target);
    mask_target_ = target;
  }
  return sf::StencilMode{
      sf::StencilComparison::Equal,
      sf::StencilUpdateOperation::Keep,
      sf::StencilValue(mask_reference_),
      sf::StencilValue(255),
      false,
  };
}

void RenderInterfaceSFML::NormalizeClipMask(sf::RenderTarget* target) {
  // Erase stale values before turning 254 into 1 by inverting its eight
  // bits. Two bounded SFML-only passes preserve the exact boolean coverage.
  WithoutScissor([&] {
    ApplyView(target);
    const auto size = target->getSize();
    sf::RectangleShape rectangle(
        {static_cast<float>(size.x), static_cast<float>(size.y)});
    sf::RenderStates states;
    states.stencilMode = sf::StencilMode{
        sf::StencilComparison::NotEqual,
        sf::StencilUpdateOperation::Zero,
        sf::StencilValue(254),
        sf::StencilValue(255),
        true,
    };
    target->draw(rectangle, states);
    states.stencilMode.stencilComparison = sf::StencilComparison::Equal;
    states.stencilMode.stencilUpdateOperation =
        sf::StencilUpdateOperation::Invert;
    target->draw(rectangle, states);
    Diagnostics().Record(&DataDiagnostics::mask_draws, 2);
  });
  mask_reference_ = 1;
}

}  // namespace sfmlrmlui
