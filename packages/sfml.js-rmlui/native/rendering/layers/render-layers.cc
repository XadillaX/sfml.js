// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <algorithm>
#include <array>
#include <stdexcept>
#include <utility>

#include "native/rendering/layers/stencil-attachment.h"
#include "native/rendering/render-interface-sfml.h"
#include <SFML/Graphics/Color.hpp>
#include <SFML/Graphics/RenderStates.hpp>
#include <SFML/Graphics/Sprite.hpp>
#include <SFML/Window/ContextSettings.hpp>

namespace sfmlrmlui {
namespace {

constexpr size_t kLayerPoolSlots = 8;
constexpr uint64_t kLayerPoolBytes = 32 * 1024 * 1024;

const sf::BlendMode kPremultipliedBlend(
    sf::BlendMode::Factor::One, sf::BlendMode::Factor::OneMinusSrcAlpha);

}  // namespace

uint64_t RenderInterfaceSFML::GetLayerSerial(Rml::LayerHandle handle) const {
  for (const auto& layer : layer_stack_) {
    if (reinterpret_cast<Rml::LayerHandle>(layer.get()) == handle) {
      return layer->serial;
    }
  }
  return 0;
}

Rml::LayerHandle RenderInterfaceSFML::GetActiveLayer() const {
  return layer_stack_.empty()
             ? 0
             : reinterpret_cast<Rml::LayerHandle>(layer_stack_.back().get());
}

sf::RenderTexture* RenderInterfaceSFML::LayerTarget(Rml::LayerHandle handle) {
  if (!handle) {
    return HasActiveFrame() ? base_target_.get() : nullptr;
  }
  for (const auto& layer : layer_stack_) {
    if (reinterpret_cast<Rml::LayerHandle>(layer.get()) == handle) {
      return layer->target.get();
    }
  }
  throw std::logic_error("Render layer is no longer active");
}

std::unique_ptr<LayerResource> RenderInterfaceSFML::AcquireLayer(
    sf::Vector2u size) {
  std::erase_if(layer_pool_, [size](const auto& layer) {
    return layer->target->getSize() != size;
  });
  if (!layer_pool_.empty()) {
    auto layer = std::move(layer_pool_.back());
    layer_pool_.pop_back();
    return layer;
  }

  sf::ContextSettings settings;
  settings.stencilBits = 8;
  auto layer = std::make_unique<LayerResource>();
  layer->target = std::make_unique<sf::RenderTexture>(size, settings);
  if (!VerifyStencilAttachment(layer->target.get())) {
    throw std::runtime_error("RmlUi layer requires an 8-bit stencil");
  }
  Diagnostics().Record(&DataDiagnostics::layer_allocations);
  return layer;
}

void RenderInterfaceSFML::RecycleLayer(
    std::unique_ptr<LayerResource> layer) noexcept {
  const auto size = layer->target->getSize();
  // Include an upper bound for both color and stencil storage in the pool
  // budget. Active nesting remains unrestricted; only spare targets are bound.
  const uint64_t bytes = uint64_t{size.x} * size.y * 8;
  if (layer_pool_.size() >= kLayerPoolSlots ||
      bytes > kLayerPoolBytes / (layer_pool_.size() + 1) || !window_ ||
      size != window_->getSize()) {
    return;
  }
  try {
    layer_pool_.push_back(std::move(layer));
  } catch (...) {
    // Pooling is optional, and rollback must never throw from its destructor.
  }
}

Rml::LayerHandle RenderInterfaceSFML::PushLayer() {
  FlushGeometry();
  auto layer = AcquireLayer(ActiveTargetSize());
  WithoutScissor([&] {
    ApplyView(layer->target.get());
    layer->target->clear(sf::Color::Transparent);
    layer->target->clearStencil(sf::StencilValue(0));
  });
  mask_target_ = nullptr;
  layer->serial = ++layer_serial_;
  const auto handle = reinterpret_cast<Rml::LayerHandle>(layer.get());
  layer_stack_.push_back(std::move(layer));
  return handle;
}

void RenderInterfaceSFML::PopLayer() {
  FlushGeometry();
  if (layer_stack_.empty()) {
    return;
  }
  auto layer = std::move(layer_stack_.back());
  layer_stack_.pop_back();
  RecycleLayer(std::move(layer));
  mask_target_ = nullptr;
  post_current_ = 0;
}

void RenderInterfaceSFML::CompositeLayers(
    Rml::LayerHandle source,
    Rml::LayerHandle destination,
    Rml::BlendMode blend_mode,
    Rml::Span<const Rml::CompiledFilterHandle> filters) {
  FlushGeometry();
  auto* source_target = LayerTarget(source);
  const auto size =
      source_target ? source_target->getSize() : window_->getSize();
  std::unique_ptr<sf::Texture> host_snapshot;
  const sf::Texture* final_texture = nullptr;
  if (source_target) {
    source_target->display();
    final_texture = &source_target->getTexture();
  } else {
    // Direct manager operations outside Context::Render keep their host-window
    // behavior. A frame session reads only the transparent native UI base.
    host_snapshot = std::make_unique<sf::Texture>(size);
    // Texture::update takes const Window&, whose activation does not restore
    // RenderWindow's framebuffer after an offscreen target has been active.
    if (!window_->setActive(true)) {
      throw std::runtime_error("Cannot activate host window for layer capture");
    }
    host_snapshot->update(*window_);
    final_texture = host_snapshot.get();
  }

  if ((!filters.empty() && shaders_ready_) || source == destination) {
    ApplyFilters(filters, final_texture, size);
    final_texture = &PostTarget(post_current_)->getTexture();
  }

  auto* destination_layer = LayerTarget(destination);
  sf::RenderTarget* target = window_;
  if (destination_layer) {
    target = destination_layer;
  }
  ApplyView(target);
  sf::RenderStates states;
  states.blendMode = blend_mode == Rml::BlendMode::Replace
                         ? sf::BlendNone
                         : kPremultipliedBlend;
  states.stencilMode = ApplyClipMask(target);
  DrawLayerComposite(*final_texture, target, states);
  Diagnostics().Record(&DataDiagnostics::composite_draws);
}

void RenderInterfaceSFML::DrawLayerComposite(const sf::Texture& source,
                                              sf::RenderTarget* target,
                                              sf::RenderStates states) {
  if (!scissor_enabled_) {
    target->draw(sf::Sprite(source), states);
    return;
  }
  const auto size = target->getSize();
  const auto source_size = source.getSize();
  const auto full = Rml::Rectanglei::FromPositionSize(
      {}, {static_cast<int>(size.x), static_cast<int>(size.y)});
  if (scissor_region_ == full) {
    target->draw(sf::Sprite(source), states);
    return;
  }
  const auto source_bounds = Rml::Rectanglei::FromPositionSize(
      {}, {static_cast<int>(source_size.x), static_cast<int>(source_size.y)});
  const auto bounds = full.Intersect(source_bounds).Intersect(scissor_region_);
  if (!bounds.Valid() || bounds.Size().x <= 0 || bounds.Size().y <= 0) {
    return;
  }

  // Apple's software renderer can drop a triangle when scissoring a
  // fullscreen sprite. Bound the draw with the viewport instead: exact clip
  // endpoints stay inside it, and texture coordinates still select the same
  // source pixels. Keep the destination stencil test set by ApplyClipMask.
  const auto previous = target->getView();
  sf::View view = previous;
  view.setScissor(sf::FloatRect({0.f, 0.f}, {1.f, 1.f}));
  view.setViewport(sf::FloatRect(
      {static_cast<float>(bounds.p0.x) / size.x,
       static_cast<float>(bounds.p0.y) / size.y},
      {static_cast<float>(bounds.Size().x) / size.x,
       static_cast<float>(bounds.Size().y) / size.y}));
  target->setView(view);

  const float left = static_cast<float>(bounds.p0.x);
  const float top = static_cast<float>(bounds.p0.y);
  const float right = static_cast<float>(bounds.p1.x);
  const float bottom = static_cast<float>(bounds.p1.y);
  const std::array<sf::Vertex, 6> vertices{{
      {{-1.f, -1.f}, sf::Color::White, {left, bottom}},
      {{-1.f, 1.f}, sf::Color::White, {left, top}},
      {{1.f, -1.f}, sf::Color::White, {right, bottom}},
      {{1.f, -1.f}, sf::Color::White, {right, bottom}},
      {{-1.f, 1.f}, sf::Color::White, {left, top}},
      {{1.f, 1.f}, sf::Color::White, {right, top}},
  }};
  states.coordinateType = sf::CoordinateType::Pixels;
  states.texture = &source;
  states.shader = &layer_composite_shader_;
  target->draw(
      vertices.data(), vertices.size(), sf::PrimitiveType::Triangles, states);
  target->setView(previous);
}

Rml::TextureHandle RenderInterfaceSFML::CaptureLayerRegion(
    const Rml::Rectanglei& bounds) {
  FlushGeometry();
  const auto position = bounds.Position();
  const auto size = bounds.Size();
  if (size.x <= 0 || size.y <= 0) {
    return 0;
  }
  const sf::Vector2u region_size{
      static_cast<unsigned int>(size.x),
      static_cast<unsigned int>(size.y),
  };

  std::unique_ptr<sf::Texture> host_snapshot;
  const sf::Texture* source = nullptr;
  if (auto* layer = LayerTarget(GetActiveLayer())) {
    layer->display();
    source = &layer->getTexture();
  } else {
    if (!window_ || !window_->isOpen()) {
      return 0;
    }
    host_snapshot = std::make_unique<sf::Texture>(window_->getSize());
    if (!window_->setActive(true)) {
      throw std::runtime_error("Cannot activate host window for layer capture");
    }
    host_snapshot->update(*window_);
    source = host_snapshot.get();
  }

  sf::RenderTexture capture(region_size);
  sf::Sprite sprite(*source);
  sprite.setTextureRect(sf::IntRect{
      sf::Vector2i{position.x, position.y},
      sf::Vector2i{size.x, size.y},
  });
  capture.clear(sf::Color::Transparent);
  capture.draw(sprite, sf::RenderStates(sf::BlendNone));
  capture.display();
  Diagnostics().Record(&DataDiagnostics::capture_draws);

  auto texture = std::make_unique<sf::Texture>(region_size);
  texture->update(capture.getTexture());
  return reinterpret_cast<Rml::TextureHandle>(texture.release());
}

Rml::TextureHandle RenderInterfaceSFML::SaveLayerAsTexture() {
  const auto handle =
      scissor_region_.Valid() ? CaptureLayerRegion(scissor_region_) : 0;
  if (auto* texture = reinterpret_cast<sf::Texture*>(handle)) {
    // Ordinary GL3 textures use linear repeat addressing, including snapshots.
    // Saved alpha masks retain their separately bounded sampling contract.
    texture->setSmooth(true);
    texture->setRepeated(true);
  }
  return handle;
}

Rml::CompiledFilterHandle RenderInterfaceSFML::SaveLayerAsMaskImage() {
  if (!shaders_ready_ || !scissor_region_.Valid()) {
    return 0;
  }
  std::unique_ptr<sf::Texture> texture(
      reinterpret_cast<sf::Texture*>(CaptureLayerRegion(scissor_region_)));
  if (!texture) {
    return 0;
  }
  auto filter = std::make_unique<FilterRecord>();
  filter->kind = FilterRecord::Kind::kMask;
  filter->mask_texture = std::move(texture);
  filter->mask_bounds = scissor_region_;
  const auto handle = reinterpret_cast<Rml::CompiledFilterHandle>(filter.get());
  filters_.push_back(std::move(filter));
  return handle;
}

}  // namespace sfmlrmlui
