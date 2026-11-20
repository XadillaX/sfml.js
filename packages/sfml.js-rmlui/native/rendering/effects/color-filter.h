// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_COLOR_FILTER_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_COLOR_FILTER_H_

#include <RmlUi/Core/Dictionary.h>
#include <RmlUi/Core/Matrix4.h>

#include <optional>

namespace sfmlrmlui {

// RGB matrices operate directly on premultiplied pixels. Their constant
// column multiplies source alpha, preserving transparent boundaries.
struct ColorFilterData {
  Rml::Matrix4f matrix{Rml::Matrix4f::Identity()};
  float opacity{1.f};
};

bool IsColorFilterName(const Rml::String& name);

// Preserve the parameter names, defaults and coefficients of RmlUi 6.3's
// native renderer. Hue rotation is in radians. Unsupported names return null.
std::optional<ColorFilterData> CompileColorFilter(
    const Rml::String& name, const Rml::Dictionary& parameters);

inline constexpr const char* kColorFilterFragmentShader = R"(
uniform sampler2D texture;
uniform mat4 colorMatrix;
uniform float opacity;
void main()
{
    // Recover the stored bytes before arithmetic. Normalized software samples
    // can differ by one ULP and otherwise move half-byte opacity across a tie.
    vec4 sampled = floor(texture2D(texture, gl_TexCoord[0].xy) * 255.0 + 0.5);
    vec3 transformed = (colorMatrix * sampled).rgb;
    // Preserve GL3's matrix output. The RGBA8 attachment clamps channel range;
    // source alpha is not an additional upper bound on transformed RGB.
    vec4 result = vec4(transformed, sampled.a) * opacity;
    gl_FragColor = floor(result + 0.5) / 255.0;
}
)";

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_COLOR_FILTER_H_
