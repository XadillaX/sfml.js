// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_IMGUI_NATIVE_CIMGUI_H_
#define PACKAGES_SFML_JS_IMGUI_NATIVE_CIMGUI_H_

// dcimgui mirrors ImGui types in the global namespace; wrapping the C API
// here keeps them from colliding with the C++ headers used elsewhere.
#include <imgui.h>

namespace cimgui {
#include <dcimgui.h>
}

#endif  // PACKAGES_SFML_JS_IMGUI_NATIVE_CIMGUI_H_
