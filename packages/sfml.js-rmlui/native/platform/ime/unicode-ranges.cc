// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/ime/unicode-ranges.h"

#include <algorithm>
#include <limits>

namespace sfmlrmlui::ime {
namespace {

size_t Next(std::u16string_view text, size_t offset) {
  const auto first = text[offset++];
  if (first >= 0xd800 && first <= 0xdbff && offset < text.size() &&
      text[offset] >= 0xdc00 && text[offset] <= 0xdfff) {
    ++offset;
  }
  return offset;
}

}  // namespace

CodePointRange FromUtf16(std::u16string_view text,
                         size_t location,
                         size_t length) {
  location = std::min(location, text.size());
  const size_t end = location + std::min(length, text.size() - location);
  CodePointRange result;
  int character = 0;
  for (size_t offset = 0; offset < text.size();) {
    const size_t next = Next(text, offset);
    if (next <= location) {
      ++result.start;
    }
    if (offset < end) {
      ++result.end;
    }
    if (++character == std::numeric_limits<int>::max()) {
      break;
    }
    offset = next;
  }
  if (length == 0) {
    result.end = result.start;
  }
  return result;
}

Utf16Range ToUtf16(std::u16string_view text, CodePointRange range) {
  range.start = std::max(range.start, 0);
  range.end = std::max(range.end, range.start);
  Utf16Range result{text.size(), 0};
  size_t end = text.size();
  int character = 0;
  for (size_t offset = 0; offset < text.size(); ++character) {
    if (character == range.start) {
      result.location = offset;
    }
    if (character == range.end) {
      end = offset;
      break;
    }
    offset = Next(text, offset);
  }
  result.length = end - result.location;
  return result;
}

}  // namespace sfmlrmlui::ime
