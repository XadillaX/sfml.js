// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_ENGINE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_ENGINE_H_

#include "native/fonts/rmlui-font-backends.h"

namespace sfmlrmlui {

// Install a typed provider before Core takes ownership of its lifecycle.
void PrepareFontEngineInterface();
// Run after Core shuts down; retained values and numerical snapshots survive.
void ReleaseFontEngineBindings();

// Null before selection and after shutdown; runtime callers hold its lock.
const char* SelectedFontEngineName();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_ENGINE_H_
