// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>

#if !defined(_WIN32)
#include <dlfcn.h>
#endif

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

NAN_METHOD(PromoteNativeSymbols) {
#if !defined(_WIN32)
  // Node normally loads addons with RTLD_LOCAL on Linux. Promote the already
  // loaded image before a game module resolves its Core/Lua dependencies.
  // Retain one process-level reference; runtime restarts reuse the same image.
  static void* module = nullptr;
  if (!module) {
    Dl_info image{};
    if (!dladdr(reinterpret_cast<void*>(&PromoteNativeSymbols), &image) ||
        !image.dli_fname) {
      Nan::ThrowError("Could not locate the loaded RmlUi native module");
      return;
    }
    module = dlopen(image.dli_fname, RTLD_NOW | RTLD_GLOBAL);
    if (!module) {
      Nan::ThrowError(dlerror());
    }
  }
#endif
}

}  // namespace

bool ClaimOfficialApplication() {
  static uint64_t generation = 0;
  const auto current = State().generation;
  if (generation == current) {
    return false;
  }
  generation = current;
  return true;
}

NAN_MODULE_INIT(InitializeNativeModuleSymbols) {
  SetRuntimeMethod<PromoteNativeSymbols, false, false>(target,
                                                       "_promoteNativeSymbols");
}

}  // namespace sfmlrmlui
