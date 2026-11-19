// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_GEOMETRY_PROGRAM_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_GEOMETRY_PROGRAM_H_

#include <RmlUi/Core/Matrix4.h>

#include <SFML/Graphics/Shader.hpp>

namespace sfmlrmlui {

// Apply translation before the full RmlUi transform. SFML owns texture
// orientation; decorator programs use the unmodified local UV coordinates.
inline constexpr const char* kGeometryVertexShader = R"(
uniform mat4 projection;
uniform mat4 transform;
uniform vec2 translation;
void main()
{
    vec2 local = gl_Vertex.xy + translation;
    gl_Position = projection * transform * vec4(local, 0.0, 1.0);
    gl_FrontColor = gl_Color;
    gl_TexCoord[0] = gl_TextureMatrix[0] * gl_MultiTexCoord0;
    gl_TexCoord[1] = gl_MultiTexCoord0;
}
)";

inline constexpr const char* kGeometryColorFragmentShader = R"(
void main()
{
    gl_FragColor = gl_Color;
}
)";

inline constexpr const char* kGeometryTextureFragmentShader = R"(
uniform sampler2D texture;
void main()
{
    gl_FragColor = gl_Color * texture2D(texture, gl_TexCoord[0].xy);
}
)";

// RmlUi Matrix4f and SFML Glsl::Mat4 both consume column-major elements.
// Match the official GL3 top-left projection and its ±10000 Z clip planes.
inline void BindGeometryTransform(sf::Shader* shader,
                                  const Rml::Matrix4f& transform,
                                  Rml::Vector2f translation,
                                  sf::Vector2u size) {
  const auto projection =
      Rml::Matrix4f::ProjectOrtho(0.f,
                                  static_cast<float>(size.x),
                                  static_cast<float>(size.y),
                                  0.f,
                                  -10000.f,
                                  10000.f);
  shader->setUniform("projection", sf::Glsl::Mat4(projection.data()));
  shader->setUniform("transform", sf::Glsl::Mat4(transform.data()));
  shader->setUniform("translation", sf::Vector2f{translation.x, translation.y});
}

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_GEOMETRY_PROGRAM_H_
