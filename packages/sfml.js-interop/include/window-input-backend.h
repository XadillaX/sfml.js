// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_BACKEND_H_
#define PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_BACKEND_H_

#include "window-input-callbacks.h"
#include <SFML/Window/Keyboard.hpp>

#if defined(_WIN32)
#include <windows.h>
#else
#include <dlfcn.h>
#endif

namespace sfmljs::interop::detail {

struct WindowEventSourceBackend {
  using Set = void (*)(const void*);
  using Take = void (*)(void*);
  using Attach = bool (*)(uintptr_t, const WindowInputCallbacks*);
  Set set{nullptr};
  Take take{nullptr};
  Attach attach{nullptr};
};

inline const WindowEventSourceBackend& EventSourceBackend() {
  static const WindowEventSourceBackend kBackend = [] {
    WindowEventSourceBackend result;
    // Resolve from the module that owns the imported SFML function. Never
    // load a second runtime or search modules by a guessed file name.
    const auto anchor = reinterpret_cast<void*>(&sf::Keyboard::localize);
#if defined(_WIN32)
    HMODULE library = nullptr;
    if (GetModuleHandleExW(GET_MODULE_HANDLE_EX_FLAG_FROM_ADDRESS |
                               GET_MODULE_HANDLE_EX_FLAG_UNCHANGED_REFCOUNT,
                           reinterpret_cast<LPCWSTR>(anchor),
                           &library)) {
      result.set = reinterpret_cast<WindowEventSourceBackend::Set>(
          GetProcAddress(library, "sfmljsSetEventSource"));
      result.take = reinterpret_cast<WindowEventSourceBackend::Take>(
          GetProcAddress(library, "sfmljsTakeEventSource"));
      result.attach = reinterpret_cast<WindowEventSourceBackend::Attach>(
          GetProcAddress(library, "sfmljsRegisterWindowInput"));
    }
#else
    Dl_info location{};
    if (dladdr(anchor, &location)) {
      if (void* library = dlopen(location.dli_fname, RTLD_LAZY | RTLD_NOLOAD)) {
        result.set = reinterpret_cast<WindowEventSourceBackend::Set>(
            dlsym(library, "sfmljsSetEventSource"));
        result.take = reinterpret_cast<WindowEventSourceBackend::Take>(
            dlsym(library, "sfmljsTakeEventSource"));
        result.attach = reinterpret_cast<WindowEventSourceBackend::Attach>(
            dlsym(library, "sfmljsRegisterWindowInput"));
        dlclose(library);
      }
    }
#endif
    return result;
  }();
  return kBackend;
}

inline bool RegisterWindowInput(uintptr_t handle,
                                const WindowInputCallbacks* callbacks) {
  const auto attach = EventSourceBackend().attach;
  return attach && attach(handle, callbacks);
}

}  // namespace sfmljs::interop::detail

#endif  // PACKAGES_SFML_JS_INTEROP_INCLUDE_WINDOW_INPUT_BACKEND_H_
