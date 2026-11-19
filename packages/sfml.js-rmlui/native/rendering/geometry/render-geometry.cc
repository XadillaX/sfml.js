// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <stdexcept>
#include <utility>

#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/shaders/geometry-program.h"
#include <SFML/Graphics/RenderStates.hpp>

namespace sfmlrmlui {
namespace {

constexpr size_t kBatchVertices = 65535;
const sf::BlendMode kPremultipliedBlend(
    sf::BlendMode::Factor::One, sf::BlendMode::Factor::OneMinusSrcAlpha);

}  // namespace

void RenderInterfaceSFML::DrawGeometry(CompiledGeometryRecord* record,
                                       Rml::Vector2f translation,
                                       const sf::Texture* texture,
                                       const sf::Shader* shader,
                                       bool homogeneous) {
  if (!EnsureSoloBuffer(record)) {
    throw std::runtime_error("Cannot upload RmlUi geometry vertex buffer");
  }
  DrawBuffer(*record->buffer,
             record->vertex_count,
             translation,
             texture,
             shader,
             homogeneous);
}

void RenderInterfaceSFML::DrawBuffer(const sf::VertexBuffer& buffer,
                                     size_t count,
                                     Rml::Vector2f translation,
                                     const sf::Texture* texture,
                                     const sf::Shader* shader,
                                     bool homogeneous) {
  auto* target = ActiveTarget();
  ApplyView(target);
  sf::RenderStates states;
  states.blendMode = kPremultipliedBlend;
  states.coordinateType = sf::CoordinateType::Normalized;
  states.texture = texture;
  states.stencilMode = ApplyClipMask(target);

  if (shader) {
    // Preserve the existing explicit custom-vertex-program extension.
    states.shader = shader;
    if (!homogeneous) {
      states.transform = transform_;
      states.transform.translate({translation.x, translation.y});
    }
  } else {
    auto* program =
        texture ? &geometry_texture_shader_ : &geometry_color_shader_;
    BindGeometryTransform(program, matrix_, translation, target->getSize());
    states.shader = program;
  }
  target->draw(buffer, 0, count, states);
  Diagnostics().Record(&DataDiagnostics::geometry_draws);
}

Rml::CompiledGeometryHandle RenderInterfaceSFML::CompileGeometry(
    Rml::Span<const Rml::Vertex> vertices, Rml::Span<const int> indices) {
  if (vertices.data() == nullptr || indices.data() == nullptr ||
      indices.empty()) {
    return 0;
  }
  auto record = std::make_unique<CompiledGeometryRecord>();
  record->vertices.reserve(indices.size());
  // Expand once with explicit field conversion; no binary-layout alias.
  for (const int index : indices) {
    if (index < 0 || static_cast<size_t>(index) >= vertices.size()) {
      return 0;
    }
    const auto& vertex = vertices[index];
    record->vertices.push_back({
        {vertex.position.x, vertex.position.y},
        {vertex.colour[0],
         vertex.colour[1],
         vertex.colour[2],
         vertex.colour[3]},
        {vertex.tex_coord.x, vertex.tex_coord.y},
    });
  }
  record->vertex_count = record->vertices.size();
  record->serial = ++geometry_serial_;
  auto& counts = Diagnostics();
  counts.Record(&DataDiagnostics::geometry_compiles);
  counts.Record(&DataDiagnostics::geometry_expansion_bytes,
                record->vertex_count * sizeof(sf::Vertex));
  return reinterpret_cast<Rml::CompiledGeometryHandle>(record.release());
}

void RenderInterfaceSFML::RenderGeometry(Rml::CompiledGeometryHandle geometry,
                                         Rml::Vector2f translation,
                                         Rml::TextureHandle texture) {
  if (geometry == 0 || window_ == nullptr || !shaders_ready_) {
    return;
  }
  auto* record = reinterpret_cast<CompiledGeometryRecord*>(geometry);
  const auto* sfml_texture =
      texture == 0 ? nullptr : reinterpret_cast<sf::Texture*>(texture);
  if (!batch_rendering_ || InCallback() ||
      record->vertex_count > kBatchVertices) {
    FlushGeometry();
    DrawGeometry(record, translation, sfml_texture, nullptr);
    return;
  }
  if (sfml_texture != batch_texture_ ||
      batch_vertices_ + record->vertex_count > kBatchVertices) {
    FlushGeometry();
  }
  batch_texture_ = sfml_texture;
  batch_vertices_ += record->vertex_count;
  record->queued = true;
  batch_commands_.push_back(
      {record,
       {record->serial, {translation.x, translation.y}, record->vertex_count}});
}

void RenderInterfaceSFML::ReleaseGeometry(
    Rml::CompiledGeometryHandle geometry) {
  if (geometry != 0) {
    auto* record = reinterpret_cast<CompiledGeometryRecord*>(geometry);
    // Releasing queued geometry submits the run before retiring its lease.
    if (record->queued) {
      FlushGeometry();
    }
    delete record;
  }
}

void RenderInterfaceSFML::SetTransform(const Rml::Matrix4f* transform) {
  FlushGeometry();
  transform_enabled_ = transform != nullptr;
  matrix_ = transform ? *transform : Rml::Matrix4f::Identity();
  const float* m = matrix_.data();
  // Only the custom legacy vertex-program extension consumes sf::Transform.
  transform_ =
      sf::Transform(m[0], m[4], m[12], m[1], m[5], m[13], 0.f, 0.f, 1.f);
}

}  // namespace sfmlrmlui
