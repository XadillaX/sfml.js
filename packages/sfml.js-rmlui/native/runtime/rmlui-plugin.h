// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_PLUGIN_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_PLUGIN_H_

namespace sfmlrmlui {

// Retired owners stay alive until the outer Native operation has returned
// from every upstream notification traversal.
void DrainPluginReleases();
void ReleasePluginBindings();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_PLUGIN_H_
