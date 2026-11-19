// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/ime/windows/composition-update.h"

#include "native/platform/ime/unicode-ranges.h"
#include <SFML/System/String.hpp>

namespace sfmlrmlui::ime::windows {
namespace {

Rml::String Text(std::u16string_view text) {
  const auto utf8 = sf::String::fromUtf16(text.begin(), text.end()).toUtf8();
  return {utf8.begin(), utf8.end()};
}

}  // namespace

void ApplyComposition(DeferredTextInput* queue,
                      std::optional<std::u16string_view> result,
                      std::optional<std::u16string_view> preedit,
                      size_t cursor) {
  // Prepare both conversions before submitting work. Conversion failure must
  // not queue half of a native result/preedit snapshot.
  const auto committed = result ? std::optional(Text(*result)) : std::nullopt;
  const auto marked = preedit ? std::optional(Text(*preedit)) : std::nullopt;
  if (committed) {
    queue->Commit(*committed);
  }
  if (marked) {
    queue->Mark(*marked, FromUtf16(*preedit, cursor, 0));
  }
}

}  // namespace sfmlrmlui::ime::windows
