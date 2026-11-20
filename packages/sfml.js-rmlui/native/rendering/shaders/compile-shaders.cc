// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Log.h>

#include <cmath>
#include <utility>
#include <vector>

#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/shaders/creation-program.h"
#include "native/rendering/shaders/geometry-program.h"
#include "native/rendering/shaders/gradient-program.h"

namespace sfmlrmlui {

Rml::CompiledShaderHandle RenderInterfaceSFML::CompileShader(
    const Rml::String& name, const Rml::Dictionary& parameters) {
  if (!shaders_ready_) {
    return 0;
  }
  ShaderParameters values;
  Rml::String vertex = kGeometryVertexShader;
  Rml::String fragment;
  bool valid = true;
  const bool explicit_sources =
      parameters.find("vertex_shader") != parameters.end() ||
      parameters.find("fragment_shader") != parameters.end();

  if (!explicit_sources &&
      (name == "linear-gradient" || name == "radial-gradient" ||
       name == "conic-gradient")) {
    GradientParameters gradient;
    valid = ReadGradientParameters(name, parameters, &gradient);
    if (valid) {
      fragment = GradientFragmentProgram(gradient);
      values = std::move(gradient);
    }
  } else if (!explicit_sources && name == "shader") {
    const auto effect = parameters.find("value");
    const auto dimensions = parameters.find("dimensions");
    valid = effect != parameters.end() &&
            effect->second.GetType() == Rml::Variant::STRING &&
            effect->second.Get<Rml::String>() == "creation" &&
            dimensions != parameters.end() &&
            dimensions->second.GetType() == Rml::Variant::VECTOR2;
    if (valid) {
      const auto size = dimensions->second.Get<Rml::Vector2f>();
      valid = std::isfinite(size.x) && std::isfinite(size.y) && size.x > 0.f &&
              size.y > 0.f && std::isfinite(size.x / size.y);
      values = CreationParameters{size};
      fragment = kCreationFragmentShader;
    }
  } else {
    const auto vertex_it = parameters.find("vertex_shader");
    const auto fragment_it = parameters.find("fragment_shader");
    valid = vertex_it != parameters.end() && fragment_it != parameters.end() &&
            vertex_it->second.GetType() == Rml::Variant::STRING &&
            fragment_it->second.GetType() == Rml::Variant::STRING;
    if (valid) {
      vertex = vertex_it->second.Get<Rml::String>();
      fragment = fragment_it->second.Get<Rml::String>();
      CustomShaderParameters custom;
      for (const auto& [key, value] : parameters) {
        if (key != "vertex_shader" && key != "fragment_shader") {
          custom.uniforms.emplace(key, value);
        }
      }
      values = std::move(custom);
    }
  }

  if (!valid) {
    Rml::Log::Message(Rml::Log::LT_WARNING,
                      "Invalid or unsupported RmlUi shader '%s'.",
                      name.c_str());
    return 0;
  }
  auto record = std::make_unique<ShaderRecord>(std::move(values));
  if (!record->shader.loadFromMemory(vertex, fragment)) {
    Rml::Log::Message(Rml::Log::LT_ERROR,
                      "Failed to compile complete RmlUi shader '%s'.",
                      name.c_str());
    return 0;
  }
  if (const auto* gradient =
          std::get_if<GradientParameters>(&record->parameters)) {
    const bool constant =
        gradient->stops.size() == 1 ||
        (gradient->repeating &&
         gradient->stops.front().position == gradient->stops.back().position);
    if (!constant) {
      std::vector<float> positions;
      positions.reserve(gradient->stops.size());
      for (const auto& stop : gradient->stops) {
        positions.push_back(stop.position.number);
      }
      // The handle's immutable stop snapshot only needs one uniform upload.
      record->shader.setUniformArray(
          "stopPositions", positions.data(), positions.size());
    }
  }
  shaders_.push_back(std::move(record));
  return reinterpret_cast<Rml::CompiledShaderHandle>(shaders_.back().get());
}

}  // namespace sfmlrmlui
