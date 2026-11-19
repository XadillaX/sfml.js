// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_RESOURCE_PRELOAD_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_RESOURCE_PRELOAD_H_

#include <string>

namespace sfmlrmlui {

class RenderInterfaceSFML;
struct ResourcePreloadState;

// Owner-thread invalidation settles pending promises before releasing caches.
// Live renderer texture leases and registered font bytes remain independently
// owned until Core releases them.
void InvalidateResourcePreloads(RenderInterfaceSFML* renderer,
                                const std::string* source,
                                bool fonts);
void ShutdownResourcePreloads();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_RESOURCE_PRELOAD_H_
