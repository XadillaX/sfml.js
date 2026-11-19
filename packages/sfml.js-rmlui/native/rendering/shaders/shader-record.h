// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_SHADER_RECORD_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_SHADER_RECORD_H_

#include <RmlUi/Core/DecorationTypes.h>
#include <RmlUi/Core/Dictionary.h>

#include <utility>
#include <variant>

#include <SFML/Graphics/Shader.hpp>

namespace sfmlrmlui {

// Snapshot of resolved local-pixel gradient parameters. Colors are already
// premultiplied by Core; every stop participates in the compiled program.
struct GradientParameters {
  enum class Function { kLinear, kRadial, kConic };
  Function function{Function::kLinear};
  Rml::Vector2f origin;
  Rml::Vector2f vector;
  bool repeating{false};
  Rml::ColorStopList stops;
};

// Creation uses normalized local UVs and the SystemInterface clock.
struct CreationParameters {
  Rml::Vector2f dimensions;
};

// Preserve the explicit custom GLSL extension's SFML affine coordinates.
struct CustomShaderParameters {
  Rml::Dictionary uniforms;
};

using ShaderParameters = std::
    variant<GradientParameters, CreationParameters, CustomShaderParameters>;

// Parameters cannot change after compilation. Only the GPU uniforms change
// when submitting transforms or time; the handle owns its SFML program.
struct ShaderRecord {
  explicit ShaderRecord(ShaderParameters values)
      : parameters(std::move(values)) {}

  const ShaderParameters parameters;
  sf::Shader shader;
};

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_SHADER_RECORD_H_
