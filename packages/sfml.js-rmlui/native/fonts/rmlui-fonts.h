// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONTS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONTS_H_

#include <nan.h>

namespace sfmlrmlui {

// Shared overload parser; engine methods place their owner before arguments.
void LoadFontSource(const Nan::FunctionCallbackInfo<v8::Value>& info,
                    int offset = 0);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONTS_H_
