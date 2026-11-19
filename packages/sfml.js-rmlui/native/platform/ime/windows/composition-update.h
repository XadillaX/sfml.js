// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_WINDOWS_COMPOSITION_UPDATE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_WINDOWS_COMPOSITION_UPDATE_H_

#include <optional>
#include <string_view>

#include "native/platform/ime/deferred-text-input.h"

namespace sfmlrmlui::ime::windows {

// IMM32 can report a result and the next preedit in the same message. Presence
// is independent of length: an empty result still replaces selected text.
void ApplyComposition(DeferredTextInput* queue,
                      std::optional<std::u16string_view> result,
                      std::optional<std::u16string_view> preedit,
                      size_t cursor);

}  // namespace sfmlrmlui::ime::windows

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_WINDOWS_COMPOSITION_UPDATE_H_
