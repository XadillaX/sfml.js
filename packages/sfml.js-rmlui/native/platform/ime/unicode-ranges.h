// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_UNICODE_RANGES_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_UNICODE_RANGES_H_

#include <cstddef>
#include <string_view>

namespace sfmlrmlui::ime {

struct CodePointRange {
  int start{0};
  int end{0};
  bool operator==(const CodePointRange&) const = default;
};

struct Utf16Range {
  size_t location{0};
  size_t length{0};
  bool operator==(const Utf16Range&) const = default;
};

// Cocoa uses UTF16 units. Expand partial surrogate ranges to whole characters.
CodePointRange FromUtf16(std::u16string_view text,
                         size_t location,
                         size_t length);
Utf16Range ToUtf16(std::u16string_view text, CodePointRange range);

}  // namespace sfmlrmlui::ime

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_UNICODE_RANGES_H_
