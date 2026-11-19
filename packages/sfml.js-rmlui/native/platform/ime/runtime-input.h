// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_RUNTIME_INPUT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_RUNTIME_INPUT_H_

#include <window-input-callbacks.h>

#include <functional>

#include "native/runtime/rmlui-exports.h"

namespace sfmlrmlui::ime {

class DeferredTextInput;

// Deferred native interpretation owns the same boundary as public RmlUi calls.
// Rejection keeps input pending; interruption yields immediately to its host.
SFML_RMLUI_API sfmljs::interop::WindowInputResult InterpretWindowInput(
    const std::function<void()>& action);

// Only called inside the permitted interpreter. Protect each encountered
// widget through font/event callbacks, including a synchronous focus switch.
void DrainRuntimeTextInput(DeferredTextInput* queue);

}  // namespace sfmlrmlui::ime

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_RUNTIME_INPUT_H_
