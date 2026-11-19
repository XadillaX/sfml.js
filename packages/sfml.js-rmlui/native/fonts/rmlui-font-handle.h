// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_HANDLE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_HANDLE_H_

#include <RmlUi/Core/Types.h>
#include <nan.h>

#include <cstdint>

namespace sfmlrmlui {

// Null is independent of the runtime; non-null tokens require its owner and
// generation. A standalone value never retains the font engine itself.
v8::MaybeLocal<v8::Value> WrapFontFace(Rml::FontFaceHandle value,
                                       uint64_t generation);
bool ReadFontFace(v8::Local<v8::Value> input,
                  Rml::FontFaceHandle* value,
                  uint64_t* generation = nullptr);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_HANDLE_H_
