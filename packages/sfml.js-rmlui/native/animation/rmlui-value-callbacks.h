// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_ANIMATION_RMLUI_VALUE_CALLBACKS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_ANIMATION_RMLUI_VALUE_CALLBACKS_H_

#include <RmlUi/Core/Variant.h>
#include <nan.h>

#include <functional>

namespace sfmlrmlui {

// Visit immutable value snapshots, including nested declaration dictionaries.
// Shared lists are traversed once; nesting never consumes the C++ call stack.
void VisitCallbackValues(
    const Rml::Variant& value,
    const std::function<void(const Rml::Variant&)>& visitor);

// Replace the owner's private JS edges without changing native list identity.
// Edges, rather than persistent roots, allow callback/owner cycles to collect.
void RetainVariantCallbacks(v8::Local<v8::Object> owner,
                            const Rml::Variant& value);
// Update pointer edges only after a native resource/topology mutation.
void RefreshVariantElementOwnership();
void ReleaseVariantElementOwnership();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_ANIMATION_RMLUI_VALUE_CALLBACKS_H_
