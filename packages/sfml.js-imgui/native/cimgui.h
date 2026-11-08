// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#pragma once

// dcimgui mirrors ImGui types in the global namespace; wrapping the C API
// here keeps them from colliding with the C++ headers used elsewhere.
#include <imgui.h>

namespace cimgui {
#include <dcimgui.h>
}
