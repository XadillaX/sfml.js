// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/SystemInterface.h>

#include <algorithm>

#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/shaders/geometry-program.h"

namespace sfmlrmlui {

namespace {

void BindCustomUniforms(sf::Shader* shader, const Rml::Dictionary& uniforms) {
  for (const auto& [name, value] : uniforms) {
    switch (value.GetType()) {
      case Rml::Variant::FLOAT:
      case Rml::Variant::DOUBLE:
        shader->setUniform(name, value.Get<float>());
        break;
      case Rml::Variant::INT:
      case Rml::Variant::UINT:
        shader->setUniform(name, value.Get<int>());
        break;
      case Rml::Variant::VECTOR2: {
        const auto vector = value.Get<Rml::Vector2f>();
        shader->setUniform(name, sf::Vector2f{vector.x, vector.y});
        break;
      }
      default:
        break;
    }
  }
}

}  // namespace

void RenderInterfaceSFML::RenderShader(
    Rml::CompiledShaderHandle shader_handle,
    Rml::CompiledGeometryHandle geometry_handle,
    Rml::Vector2f translation,
    Rml::TextureHandle texture) {
  FlushGeometry();
  auto* record = reinterpret_cast<ShaderRecord*>(shader_handle);
  auto* geometry = reinterpret_cast<CompiledGeometryRecord*>(geometry_handle);
  if (!record || !geometry || !window_) {
    return;
  }

  const auto& values = record->parameters;
  const auto* custom = std::get_if<CustomShaderParameters>(&values);
  if (custom) {
    BindCustomUniforms(&record->shader, custom->uniforms);
  } else {
    BindGeometryTransform(
        &record->shader, matrix_, translation, ActiveTargetSize());
    if (const auto* gradient = std::get_if<GradientParameters>(&values)) {
      const bool constant =
          gradient->stops.size() == 1 ||
          (gradient->repeating &&
           gradient->stops.front().position == gradient->stops.back().position);
      if (!constant) {
        record->shader.setUniform(
            "origin", sf::Vector2f{gradient->origin.x, gradient->origin.y});
        record->shader.setUniform(
            "vector", sf::Vector2f{gradient->vector.x, gradient->vector.y});
      }
    } else if (const auto* creation =
                   std::get_if<CreationParameters>(&values)) {
      auto* system = Rml::GetSystemInterface();
      record->shader.setUniform(
          "elapsed",
          system ? static_cast<float>(system->GetElapsedTime()) : 0.f);
      record->shader.setUniform(
          "dimensions",
          sf::Vector2f{creation->dimensions.x, creation->dimensions.y});
    }
  }
  const auto* sfml_texture =
      custom && texture ? reinterpret_cast<sf::Texture*>(texture) : nullptr;
  DrawGeometry(geometry, translation, sfml_texture, &record->shader, !custom);
}

void RenderInterfaceSFML::ReleaseShader(Rml::CompiledShaderHandle shader) {
  FlushGeometry();
  auto* record = reinterpret_cast<ShaderRecord*>(shader);
  shaders_.erase(std::remove_if(shaders_.begin(),
                                shaders_.end(),
                                [record](const auto& item) {
                                  return item.get() == record;
                                }),
                 shaders_.end());
}

}  // namespace sfmlrmlui
