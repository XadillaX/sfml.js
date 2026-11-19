// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_GRADIENT_PROGRAM_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_GRADIENT_PROGRAM_H_

#include <string>

#include "native/rendering/shaders/shader-record.h"

namespace sfmlrmlui {

// Validate resolved finite dictionaries before acquiring any GPU resource.
bool ReadGradientParameters(const Rml::String& name,
                            const Rml::Dictionary& parameters,
                            GradientParameters* gradient);

// Specialize the complete stop list into the fragment program. There is no
// fixed uniform-array limit or truncation; GPU compilation failure returns
// no handle. Equal positions become a deterministic right-continuous step.
std::string GradientFragmentProgram(const GradientParameters& gradient);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_SHADERS_GRADIENT_PROGRAM_H_
