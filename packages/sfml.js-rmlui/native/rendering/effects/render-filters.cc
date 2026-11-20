// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Log.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <utility>

#include "native/rendering/effects/postprocess-bounds.h"
#include "native/rendering/effects/postprocess-shaders.h"
#include "native/rendering/render-interface-sfml.h"
#include <SFML/Graphics/RenderStates.hpp>
#include <SFML/Graphics/Sprite.hpp>

namespace sfmlrmlui {
namespace {

const sf::BlendMode kPremultipliedBlend(
    sf::BlendMode::Factor::One, sf::BlendMode::Factor::OneMinusSrcAlpha);

}  // namespace

sf::RenderTexture* RenderInterfaceSFML::PostTarget(int index) {
  return post_targets_[index].get();
}

void RenderInterfaceSFML::EnsurePostTargets(sf::Vector2u size) {
  for (auto& target : post_targets_) {
    if (!target || target->getSize() != size) {
      sf::ContextSettings settings;
      settings.stencilBits = 8;
      target = std::make_unique<sf::RenderTexture>(size, settings);
      // Restore nearest sampling between passes. Copies and the blur kernel
      // temporarily select their required interpolation through a scoped guard.
      target->setSmooth(false);
      Diagnostics().Record(&DataDiagnostics::post_target_allocations);
    }
  }
}

void RenderInterfaceSFML::BlitFullscreen(const sf::Texture& source,
                                         sf::RenderTarget* destination,
                                         const sf::BlendMode& blend,
                                         const sf::Shader* shader) {
  // Scratch passes read/write the complete target in pixel coordinates.
  WithoutScissor([&] {
    ApplyView(destination);
    sf::Sprite sprite(source);
    sf::RenderStates states;
    states.blendMode = blend;
    states.shader = shader;
    destination->draw(sprite, states);
    Diagnostics().Record(&DataDiagnostics::fullscreen_draws);
  });
}

void RenderInterfaceSFML::ApplyFilters(
    Rml::Span<const Rml::CompiledFilterHandle> filter_handles,
    const sf::Texture* source,
    sf::Vector2u size) {
  const auto full = Rml::Rectanglei::FromPositionSize(
      {}, {static_cast<int>(size.x), static_cast<int>(size.y)});
  const auto bounds = scissor_enabled_ ? scissor_region_.Intersect(full) : full;
  if (!bounds.Valid() || bounds.Size().x == 0 || bounds.Size().y == 0) {
    EnsurePostTargets(size);
    WithoutScissor([&] {
      ApplyView(PostTarget(0));
      PostTarget(0)->clear(sf::Color::Transparent);
      PostTarget(0)->display();
    });
    post_current_ = 0;
    return;
  }
  WithoutScissor([&] {
    EnsurePostTargets(size);

    ApplyView(PostTarget(0));
    PostTarget(0)->clear(sf::Color::Transparent);
    BlitPostRegion(*source, PostTarget(0), full, full, bounds);
    PostTarget(0)->display();
    post_current_ = 0;

    for (const Rml::CompiledFilterHandle handle : filter_handles) {
      auto* filter = reinterpret_cast<FilterRecord*>(handle);
      if (filter == nullptr) {
        continue;
      }
      if (filter->kind == FilterRecord::Kind::kMask) {
        if (filter->mask_texture) {
          const auto origin = filter->mask_bounds.Position();
          const auto dimensions = filter->mask_bounds.Size();
          mask_shader_.setUniform("texture", sf::Shader::CurrentTexture);
          mask_shader_.setUniform("maskTexture", *filter->mask_texture);
          mask_shader_.setUniform("targetSize",
                                  sf::Vector2f{static_cast<float>(size.x),
                                               static_cast<float>(size.y)});
          mask_shader_.setUniform("maskOrigin",
                                  sf::Vector2f{static_cast<float>(origin.x),
                                               static_cast<float>(origin.y)});
          mask_shader_.setUniform(
              "maskSize",
              sf::Vector2f{static_cast<float>(dimensions.x),
                           static_cast<float>(dimensions.y)});
          const int destination = (post_current_ + 1) % 3;
          PostTarget(destination)->clear(sf::Color::Transparent);
          BlitPostRegion(PostTarget(post_current_)->getTexture(),
                         PostTarget(destination),
                         full,
                         full,
                         bounds,
                         sf::BlendNone,
                         &mask_shader_);
          PostTarget(destination)->display();
          post_current_ = destination;
        }
        continue;
      }
      if (filter->kind == FilterRecord::Kind::kBlur) {
        BlurCurrent(filter->sigma, size, bounds, (post_current_ + 1) % 3);
        continue;
      }
      if (filter->kind == FilterRecord::Kind::kColor) {
        // Color matrices read one stored texel per output pixel.
        color_filter_shader_.setUniform("texture", sf::Shader::CurrentTexture);
        color_filter_shader_.setUniform(
            "colorMatrix", sf::Glsl::Mat4(filter->color_filter.matrix.data()));
        color_filter_shader_.setUniform("opacity",
                                        filter->color_filter.opacity);
        const int destination = (post_current_ + 1) % 3;
        PostTarget(destination)->clear(sf::Color::Transparent);
        BlitPostRegion(PostTarget(post_current_)->getTexture(),
                       PostTarget(destination),
                       full,
                       full,
                       bounds,
                       sf::BlendNone,
                       &color_filter_shader_);
        PostTarget(destination)->display();
        post_current_ = destination;
        continue;
      }

      // Shift and tint alpha before blur so the sampling window constrains the
      // shifted source. The third target keeps the original source untouched.
      const int original = post_current_;
      drop_shadow_shader_.setUniform("texture", sf::Shader::CurrentTexture);
      drop_shadow_shader_.setUniform("offset", filter->offset);
      drop_shadow_shader_.setUniform("shadowColor",
                                     sf::Glsl::Vec4(filter->color));
      SetPostSampleBounds(&drop_shadow_shader_, bounds, size);
      const int destination = (original + 1) % 3;
      ApplyView(PostTarget(destination));
      PostTarget(destination)->clear(sf::Color::Transparent);
      BlitPostRegion(PostTarget(original)->getTexture(),
                     PostTarget(destination),
                     full,
                     full,
                     bounds,
                     sf::BlendNone,
                     &drop_shadow_shader_);
      PostTarget(destination)->display();
      post_current_ = destination;
      if (filter->sigma >= 0.5f) {
        BlurCurrent(filter->sigma, size, bounds, 3 - original - destination);
      }
      BlitPostRegion(PostTarget(original)->getTexture(),
                     PostTarget(post_current_),
                     full,
                     full,
                     bounds,
                     kPremultipliedBlend);
      PostTarget(post_current_)->display();
    }
  });
}

Rml::CompiledFilterHandle RenderInterfaceSFML::CompileFilter(
    const Rml::String& name, const Rml::Dictionary& parameters) {
  if (!shaders_ready_) {
    Rml::Log::Message(Rml::Log::LT_ERROR,
                      "Cannot compile filter '%s': SFML effect shaders "
                      "are unavailable.",
                      name.c_str());
    return 0;
  }
  auto filter = std::make_unique<FilterRecord>();
  if (auto color = CompileColorFilter(name, parameters)) {
    filter->kind = FilterRecord::Kind::kColor;
    filter->color_filter = *color;
  } else if (name == "blur") {
    filter->kind = FilterRecord::Kind::kBlur;
    filter->sigma = Rml::Get(parameters, "sigma", 1.f);
  } else if (name == "drop-shadow") {
    filter->kind = FilterRecord::Kind::kDropShadow;
    filter->sigma = Rml::Get(parameters, "sigma", 0.f);
    const auto offset = Rml::Get(parameters, "offset", Rml::Vector2f(0.f));
    filter->offset = sf::Vector2f{offset.x, offset.y};
    const auto color = Rml::Get(parameters, "color", Rml::Colourb());
    filter->color = sf::Color{color[0], color[1], color[2], color[3]};
  } else {
    Rml::Log::Message(
        Rml::Log::LT_WARNING, "Unsupported RmlUi filter '%s'.", name.c_str());
    return 0;
  }
  if (!std::isfinite(filter->sigma) || filter->sigma < 0.f ||
      !std::isfinite(filter->offset.x) || !std::isfinite(filter->offset.y)) {
    Rml::Log::Message(Rml::Log::LT_WARNING,
                      "Invalid nonfinite or negative filter parameters.");
    return 0;
  }
  filters_.push_back(std::move(filter));
  return reinterpret_cast<Rml::CompiledFilterHandle>(filters_.back().get());
}

void RenderInterfaceSFML::ReleaseFilter(Rml::CompiledFilterHandle filter) {
  FlushGeometry();
  auto* record = reinterpret_cast<FilterRecord*>(filter);
  filters_.erase(std::remove_if(filters_.begin(),
                                filters_.end(),
                                [record](const auto& item) {
                                  return item.get() == record;
                                }),
                 filters_.end());
}

}  // namespace sfmlrmlui
