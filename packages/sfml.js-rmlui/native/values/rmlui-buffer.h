// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_BUFFER_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_BUFFER_H_

#include <nan.h>

#include <memory>

namespace sfmlrmlui {

// Native views require stable, unshared storage. Node 18 predates the public
// resizable backing-store API; Node 20 exposes it on BackingStore.
inline bool IsFixedUnsharedBuffer(
    const std::shared_ptr<v8::BackingStore>& storage) {
  if (storage->IsShared()) {
    return false;
  }

#if V8_MAJOR_VERSION >= 11
  if (storage->IsResizableByUserJavaScript()) {
    return false;
  }
#endif

  return true;
}

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_BUFFER_H_
