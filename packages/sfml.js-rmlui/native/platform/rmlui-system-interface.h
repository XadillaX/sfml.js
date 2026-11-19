// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_RMLUI_SYSTEM_INTERFACE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_RMLUI_SYSTEM_INTERFACE_H_

#include <nan.h>

namespace sfmlrmlui {

// Installs a fallback only when no pre-initialization interface was selected.
void PrepareSystemInterface(v8::Local<v8::Object> window_handle);
// Core must stop borrowing the pointer before releasing these native owners.
void ReleaseSystemInterfaceBindings();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_RMLUI_SYSTEM_INTERFACE_H_
