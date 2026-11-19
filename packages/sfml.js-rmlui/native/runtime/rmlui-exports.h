// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_EXPORTS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_EXPORTS_H_

// Package-internal game modules link to the same runtime as the JS binding.
// This is not a separately versioned native ABI.
#if defined(_WIN32)
#if defined(SFML_RMLUI_EXPORTS)
#define SFML_RMLUI_API __declspec(dllexport)
#else
#define SFML_RMLUI_API __declspec(dllimport)
#endif
#else
#define SFML_RMLUI_API
#endif

namespace sfmlrmlui {

// Called inside RuntimeScope. Closing a game does not release this slot:
// original process-level instancers remain registered until runtime shutdown.
SFML_RMLUI_API bool ClaimOfficialApplication();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_EXPORTS_H_
