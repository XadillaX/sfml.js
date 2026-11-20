// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_POSTPROCESS_SHADERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_POSTPROCESS_SHADERS_H_

namespace sfmlrmlui {

// SFML 3 accepts legacy GLSL entry points and injects the compatibility
// defines, so the postprocess shaders stay independent of the GL version.

// Exact fullscreen endpoints avoid rounded pixel-to-view projections. These
// texture coordinates address the bottom-left storage of a render texture.
inline constexpr const char* kPostprocessVertexShader = R"(
void main()
{
    gl_Position = vec4(gl_Vertex.xy, 0.0, 1.0);
    gl_TexCoord[0] = vec4((gl_Vertex.xy + vec2(1.0)) * 0.5, 0.0, 1.0);
}
)";

// Read four stored texels and interpolate explicitly. The source uses nearest
// sampling so software OpenGL cannot perturb its texel-center conversions.
inline constexpr const char* kBilinearSampling = R"(
vec4 sampleBilinearBytes(sampler2D source, vec2 position, vec2 size)
{
    vec2 origin = floor(position - 0.5);
    vec2 part = position - origin - 0.5;
    vec4 a = texture2D(source, (origin + vec2(0.5, 0.5)) / size);
    vec4 b = texture2D(source, (origin + vec2(1.5, 0.5)) / size);
    vec4 c = texture2D(source, (origin + vec2(0.5, 1.5)) / size);
    vec4 d = texture2D(source, (origin + vec2(1.5, 1.5)) / size);
    a = floor(a * 255.0 + 0.5);
    b = floor(b * 255.0 + 0.5);
    c = floor(c * 255.0 + 0.5);
    d = floor(d * 255.0 + 0.5);
    return mix(mix(a, b, part.x), mix(c, d, part.x), part.y);
}
)";

// Exact clip-space endpoints avoid software polygon clipping after a rounded
// pixel-to-view projection. The fragment shader maps the two pixel rectangles.
inline constexpr const char* kPostCopyFragmentShader = R"(
uniform sampler2D texture;
uniform vec2 sourceOrigin;
uniform vec2 sourceSize;
uniform vec2 destinationOrigin;
uniform vec2 destinationSize;
uniform vec2 targetSize;
void main()
{
    vec2 position = sourceOrigin +
        (gl_FragCoord.xy - destinationOrigin) * sourceSize / destinationSize;
    vec4 sampled = sampleBilinearBytes(texture, position, targetSize);
    gl_FragColor = floor(sampled + 0.5) / 255.0;
}
)";

// Hardware filtering uses the same normalized interpolation as GL3 blits.
// Keep a separate program so Apple's software compiler retains its proven
// explicit-byte path without a runtime branch around texture reads.
inline constexpr const char* kPostLinearCopyFragmentShader = R"(
uniform sampler2D texture;
uniform vec2 sourceOrigin;
uniform vec2 sourceSize;
uniform vec2 destinationOrigin;
uniform vec2 destinationSize;
uniform vec2 targetSize;
void main()
{
    vec2 position = sourceOrigin +
        (gl_FragCoord.xy - destinationOrigin) * sourceSize / destinationSize;
    gl_FragColor = texture2D(texture, position / targetSize);
}
)";

// Match GL3's exact fullscreen endpoints and per-vertex tap interpolation.
// The native SFML draw supplies clip-space vertices for this program.
inline constexpr const char* kBlurVertexShader = R"(
uniform vec2 direction;
varying vec2 blurCoordinates[7];
void main()
{
    vec2 uv = (gl_Vertex.xy + vec2(1.0)) * 0.5;
    for (int i = 0; i < 7; ++i)
        blurCoordinates[i] = uv - float(i - 3) * direction;
    gl_Position = vec4(gl_Vertex.xy, 0.0, 1.0);
}
)";

// Pinned GL3 seven-point kernel. Half-texel limits make samples outside the
// current filter window transparent, including during reduced-resolution work.
inline constexpr const char* kBlurFragmentShader = R"(
uniform sampler2D texture;
uniform vec2 texCoordMin;
uniform vec2 texCoordMax;
uniform float weights[4];
varying vec2 blurCoordinates[7];
void main()
{
    vec4 sum = vec4(0.0);
    for (int i = 0; i < 7; ++i)
    {
        vec2 position = blurCoordinates[i];
        vec2 inside = step(texCoordMin, position) *
                      step(position, texCoordMax);
        int index = i - 3;
        sum += texture2D(texture, position) *
               inside.x * inside.y * weights[index < 0 ? -index : index];
    }
    gl_FragColor = sum;
}
)";

// Build only the tinted shadow. The unblurred source is composited separately.
inline constexpr const char* kDropShadowFragmentShader = R"(
uniform sampler2D texture;
uniform vec2 offset;
uniform vec4 shadowColor;
uniform vec2 sampleMin;
uniform vec2 sampleMax;
uniform vec2 targetSize;
void main()
{
    vec2 position = gl_FragCoord.xy - vec2(offset.x, -offset.y);
    vec2 inside = step(sampleMin, position) *
                  step(position, sampleMax);
    vec4 sampled = sampleBilinearBytes(texture, position, targetSize) *
                   inside.x * inside.y;
    vec4 shadow = vec4(shadowColor.rgb * sampled.a, sampled.a) *
                  shadowColor.a;
    gl_FragColor = floor(shadow + 0.5) / 255.0;
}
)";

// Captured mask bounds are in top-left pixel coordinates. SFML's texture
// matrix flips a RenderTexture vertically; a captured sf::Texture is not
// flipped, so use pixel coordinates to map the two textures consistently.
inline constexpr const char* kMaskFragmentShader = R"(
uniform sampler2D texture;
uniform sampler2D maskTexture;
uniform vec2 targetSize;
uniform vec2 maskOrigin;
uniform vec2 maskSize;
void main()
{
    vec2 uv = gl_TexCoord[0].xy;
    vec2 position = vec2(uv.x, 1.0 - uv.y) * targetSize;
    vec2 maskUv = (position - maskOrigin) / maskSize;
    float alpha = 0.0;
    if (all(greaterThanEqual(maskUv, vec2(0.0))) &&
        all(lessThan(maskUv, vec2(1.0))))
        alpha = texture2D(maskTexture, maskUv).a;
    gl_FragColor = texture2D(texture, uv) * alpha;
}
)";

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_POSTPROCESS_SHADERS_H_
