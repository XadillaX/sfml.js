// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_INTEROP_INCLUDE_PLATFORM_X11_UTF8_LOOKUP_H_
#define PACKAGES_SFML_JS_INTEROP_INCLUDE_PLATFORM_X11_UTF8_LOOKUP_H_

#include <array>
#include <stdexcept>
#include <string>
#include <string_view>

namespace sfmljs::interop::detail {

struct Utf8LookupResult {
  int length;
  bool overflow;
  bool characters;
};

// Retry the same XKeyEvent with the byte count returned by Xutf8LookupString.
// Consume bytes synchronously while the stack/expanded buffer remains alive.
// Typical input needs no allocation; only an actual overflow grows storage.
template <typename Lookup, typename Consume>
void LookupUtf8(Lookup lookup, Consume consume) {
  std::array<char, 64> initial{};
  std::string expanded;
  char* buffer = initial.data();
  int capacity = static_cast<int>(initial.size());
  for (;;) {
    const Utf8LookupResult result = lookup(buffer, capacity);
    if (result.overflow) {
      if (result.length <= capacity) {
        throw std::runtime_error("XIM returned an invalid overflow length");
      }
      expanded.resize(result.length);
      buffer = expanded.data();
      capacity = result.length;
      continue;
    }
    if (!result.characters) {
      return;
    }
    if (result.length < 0 || result.length > capacity) {
      throw std::runtime_error("XIM returned an invalid UTF8 length");
    }
    consume(std::string_view(buffer, static_cast<size_t>(result.length)));
    return;
  }
}

}  // namespace sfmljs::interop::detail

#endif  // PACKAGES_SFML_JS_INTEROP_INCLUDE_PLATFORM_X11_UTF8_LOOKUP_H_
