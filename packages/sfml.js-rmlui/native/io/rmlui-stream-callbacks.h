// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_IO_RMLUI_STREAM_CALLBACKS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_IO_RMLUI_STREAM_CALLBACKS_H_

#include <RmlUi/Core/Stream.h>
#include <nan.h>

#include <memory>

namespace sfmlrmlui {

// Snapshot methods before resolving runtime ownership; getters may run JS.
v8::MaybeLocal<v8::Array> ReadStreamCallbacks(v8::Local<v8::Value> input);
std::unique_ptr<Rml::Stream> MakeCallbackStream(v8::Local<v8::Array> callbacks,
                                                const Rml::URL& url,
                                                int mode);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_IO_RMLUI_STREAM_CALLBACKS_H_
