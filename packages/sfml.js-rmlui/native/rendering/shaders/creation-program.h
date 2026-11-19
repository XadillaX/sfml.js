// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_CREATION_PROGRAM_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_CREATION_PROGRAM_H_

namespace sfmlrmlui {

// The pinned GL3 creation equation uses normalized UVs, aspect ratio, elapsed
// seconds and vertex alpha. Regularize its center and reciprocal singularity
// to 1e-6, producing a finite white center without changing ordinary pixels.
inline constexpr const char* kCreationFragmentShader = R"(
uniform float elapsed;
uniform vec2 dimensions;
void main()
{
    vec3 color;
    vec2 p = gl_TexCoord[1].xy - 0.5;
    p.x *= dimensions.x / dimensions.y;
    float distance = max(length(p), 0.000001);
    for (int i = 0; i < 3; ++i)
    {
        vec2 uv = gl_TexCoord[1].xy;
        float z = elapsed + float(i) * 0.07;
        uv += p / distance * (sin(z) + 1.0) *
              abs(sin(distance * 9.0 - z - z));
        color[i] = 0.01 / max(length(mod(uv, 1.0) - 0.5), 0.000001);
    }
    gl_FragColor = vec4(color / distance, gl_Color.a);
}
)";

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_CREATION_PROGRAM_H_
