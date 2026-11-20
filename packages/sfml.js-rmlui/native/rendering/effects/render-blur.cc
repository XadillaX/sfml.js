// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <algorithm>
#include <array>
#include <optional>
#include <stdexcept>

#include "native/rendering/effects/blur-kernel.h"
#include "native/rendering/effects/postprocess-bounds.h"
#include "native/rendering/effects/texture-sampling.h"
#include "native/rendering/render-interface-sfml.h"
#include <SFML/Graphics/RenderStates.hpp>

namespace sfmlrmlui {

void RenderInterfaceSFML::BlitPostRegion(const sf::Texture& source,
                                         sf::RenderTexture* destination,
                                         Rml::Rectanglei source_bounds,
                                         Rml::Rectanglei destination_bounds,
                                         Rml::Rectanglei write_bounds,
                                         const sf::BlendMode& blend,
                                         const sf::Shader* shader) {
  const auto dimensions = source_bounds.Size();
  const auto output_size = destination_bounds.Size();
  if (dimensions.x <= 0 || dimensions.y <= 0 || output_size.x <= 0 ||
      output_size.y <= 0) {
    return;
  }
  const auto size = destination->getSize();
  std::optional<ScopedTextureSampling> sampling;
  if (!shader) {
    write_bounds = write_bounds.Intersect(destination_bounds);
    const auto source_size = source.getSize();
    post_copy_shader_.setUniform("texture", sf::Shader::CurrentTexture);
    // Both render textures use bottom-left storage, while RmlUi rectangles
    // use top-left coordinates. Keep the arithmetic order of the GL3 blit.
    post_copy_shader_.setUniform(
        "sourceOrigin",
        sf::Vector2f{static_cast<float>(source_bounds.p0.x),
                     static_cast<float>(source_size.y) - source_bounds.p1.y});
    post_copy_shader_.setUniform(
        "sourceSize",
        sf::Vector2f{static_cast<float>(dimensions.x),
                     static_cast<float>(dimensions.y)});
    post_copy_shader_.setUniform(
        "destinationOrigin",
        sf::Vector2f{static_cast<float>(destination_bounds.p0.x),
                     static_cast<float>(size.y) - destination_bounds.p1.y});
    post_copy_shader_.setUniform(
        "destinationSize",
        sf::Vector2f{static_cast<float>(output_size.x),
                     static_cast<float>(output_size.y)});
    post_copy_shader_.setUniform("targetSize", sf::Vector2f(source_size));
    shader = &post_copy_shader_;
  } else if (shader == &blur_shader_) {
    for (const auto& target : post_targets_) {
      if (target && &target->getTexture() == &source) {
        sampling.emplace(target.get(), true);
        break;
      }
    }
  }
  sf::View view(sf::FloatRect(
      {}, {static_cast<float>(size.x), static_cast<float>(size.y)}));
  const auto full_view = view;
  const bool clipped = write_bounds != Rml::Rectanglei::FromPositionSize(
      {}, {static_cast<int>(size.x), static_cast<int>(size.y)});
  if (clipped) {
    destination->setView(full_view);
    destination->clearStencil(sf::StencilValue(0));
  }
  view.setScissor(
      sf::FloatRect({static_cast<float>(write_bounds.p0.x) / size.x,
                     static_cast<float>(write_bounds.p0.y) / size.y},
                    {static_cast<float>(write_bounds.Size().x) / size.x,
                     static_cast<float>(write_bounds.Size().y) / size.y}));
  destination->setView(view);
  if (clipped) {
    // Apple's software polygon clipper can round an intersection beyond the
    // scissor edge and then reject the entire triangle. Stencil clears retain
    // the exact integer write window without clipping interpolated geometry.
    destination->clearStencil(sf::StencilValue(1));
    destination->setView(full_view);
  }
  sf::RenderStates states(blend);
  states.shader = shader;
  if (clipped) {
    states.stencilMode = sf::StencilMode{
        sf::StencilComparison::Equal,
        sf::StencilUpdateOperation::Keep,
        sf::StencilValue(1),
        sf::StencilValue(255),
        false,
    };
  }
  // Preserve the pinned fullscreen triangle diagonal and winding. Exact
  // endpoints also keep other postprocess programs inside the clip volume.
  if (!blur_geometry_ready_) {
    const std::array<sf::Vertex, 6> vertices{{
        {{-1.f, -1.f}, sf::Color::White, {}},
        {{-1.f, 1.f}, sf::Color::White, {}},
        {{1.f, -1.f}, sf::Color::White, {}},
        {{1.f, -1.f}, sf::Color::White, {}},
        {{-1.f, 1.f}, sf::Color::White, {}},
        {{1.f, 1.f}, sf::Color::White, {}},
    }};
    if (!blur_geometry_.create(vertices.size()) ||
        !blur_geometry_.update(vertices.data())) {
      throw std::runtime_error("Failed to upload RmlUi postprocess geometry");
    }
    blur_geometry_ready_ = true;
  }
  states.texture = &source;
  destination->draw(blur_geometry_, states);
  Diagnostics().Record(&DataDiagnostics::fullscreen_draws);
}

void RenderInterfaceSFML::BlurCurrent(float sigma,
                                      sf::Vector2u size,
                                      Rml::Rectanglei bounds,
                                      int temporary) {
  const BlurKernel kernel(sigma);
  const int source = post_current_;
  const auto full = Rml::Rectanglei::FromPositionSize(
      {}, {static_cast<int>(size.x), static_cast<int>(size.y)});
  auto flipped = FlipPostBounds(bounds, size.y);
  int input = source;

  // GL3 keeps full-sized scratch textures and repeatedly maps their lower-left
  // half viewport. Odd dimensions exclude the final row/column from sampling.
  const Rml::Rectanglei sample = Rml::Rectanglei::FromPositionSize(
      {0, static_cast<int>(size.y % 2)},
      {static_cast<int>(size.x - size.x % 2),
       static_cast<int>(size.y - size.y % 2)});
  const Rml::Rectanglei half = Rml::Rectanglei::FromPositionSize(
      {0, static_cast<int>(size.y - size.y / 2)},
      {static_cast<int>(size.x / 2), static_cast<int>(size.y / 2)});
  for (int level = 0; level < kernel.levels; ++level) {
    flipped.p0 = (flipped.p0 + Rml::Vector2i(1)) / 2;
    flipped.p1 = Rml::Math::Max(flipped.p1 / 2, flipped.p0);
    const int output = input == source ? temporary : source;
    BlitPostRegion(PostTarget(input)->getTexture(),
                   PostTarget(output),
                   sample,
                   half,
                   FlipPostBounds(flipped, size.y));
    PostTarget(output)->display();
    input = output;
  }

  const auto reduced = FlipPostBounds(flipped, size.y);
  if (reduced.Size().x == 0 || reduced.Size().y == 0) {
    // A very large sigma may collapse a small filter window during reduction.
    // There are then no samples; discard stale full-resolution source pixels.
    ApplyView(PostTarget(source));
    PostTarget(source)->clear(sf::Color::Transparent);
    PostTarget(source)->display();
    return;
  }
  if (input != temporary) {
    BlitPostRegion(PostTarget(input)->getTexture(),
                   PostTarget(temporary),
                   full,
                   full,
                   reduced);
    PostTarget(temporary)->display();
  }
  blur_shader_.setUniform("texture", sf::Shader::CurrentTexture);
  blur_shader_.setUniformArray(
      "weights", kernel.weights.data(), kernel.weights.size());
  SetPostSampleBounds(&blur_shader_, reduced, size, true);

  // Vertical then horizontal, with byte storage between passes, matches GL3.
  blur_shader_.setUniform("direction", sf::Vector2f{0.f, 1.f / size.y});
  BlitPostRegion(PostTarget(temporary)->getTexture(),
                 PostTarget(source),
                 full,
                 full,
                 reduced,
                 sf::BlendNone,
                 &blur_shader_);
  PostTarget(source)->display();

  // Clear the entire temporary target to include the transparent 1px border
  // and eliminate stale texels from previous filters or frames.
  ApplyView(PostTarget(temporary));
  PostTarget(temporary)->clear(sf::Color::Transparent);
  blur_shader_.setUniform("direction", sf::Vector2f{1.f / size.x, 0.f});
  BlitPostRegion(PostTarget(source)->getTexture(),
                 PostTarget(temporary),
                 full,
                 full,
                 reduced,
                 sf::BlendNone,
                 &blur_shader_);
  PostTarget(temporary)->display();

  BlitPostRegion(PostTarget(temporary)->getTexture(),
                 PostTarget(source),
                 reduced,
                 bounds,
                 bounds);
  const int scale = 1 << kernel.levels;
  const auto exact = FlipPostBounds(
      Rml::Rectanglei::FromCorners(flipped.p0 * scale, flipped.p1 * scale),
      size.y);
  if (exact != bounds) {
    BlitPostRegion(PostTarget(temporary)->getTexture(),
                   PostTarget(source),
                   reduced,
                   exact,
                   bounds);
  }
  PostTarget(source)->display();
}

}  // namespace sfmlrmlui
