// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/ime/x11/preedit-buffer.h"

#include <algorithm>
#include <limits>
#include <stdexcept>
#include <utility>

#include <SFML/System/String.hpp>

namespace sfmlrmlui::ime::x11 {
namespace {

int Length(std::u32string_view text) {
  return static_cast<int>(
      std::min(text.size(), size_t(std::numeric_limits<int>::max())));
}

Rml::String Text(std::u32string_view text) {
  const auto utf8 = sf::String::fromUtf32(text.begin(), text.end()).toUtf8();
  return {utf8.begin(), utf8.end()};
}

enum class CharacterClass { kWord, kPunctuation, kNewline, kWhitespace };

CharacterClass Classify(char32_t character) {
  // Preserve RmlUi's native word grouping, with whole Unicode code points.
  if ((character >= U'a' && character <= U'z') ||
      (character >= U'A' && character <= U'Z') ||
      (character >= U'0' && character <= U'9') || character == U'_' ||
      character >= 128) {
    return CharacterClass::kWord;
  }
  if ((character >= U'!' && character <= U'/') ||
      (character >= U':' && character <= U'@') ||
      (character >= U'[' && character <= U'`') ||
      (character >= U'{' && character <= U'~')) {
    return CharacterClass::kPunctuation;
  }
  return character == U'\n' ? CharacterClass::kNewline
                            : CharacterClass::kWhitespace;
}

}  // namespace

void PreeditBuffer::Draw(DeferredTextInput* queue,
                         int start,
                         int length,
                         std::optional<std::u32string_view> replacement,
                         int caret) {
  if (!replacement && active_) {
    caret = std::clamp(caret, 0, Length(text_));
    if (caret != caret_) {
      SetCaret(queue, caret);
    } else {
      // Feedback changes no text. Keep the display-line side and the ideal
      // horizontal position until an actual caret or text change.
      queue->SetCompositionCaret(caret_, wrap_down_);
    }
    return;
  }
  auto next = text_;
  if (replacement) {
    start = std::clamp(start, 0, Length(next));
    length = std::clamp(length, 0, Length(next) - start);
    next.replace(start, length, *replacement);
  }
  caret = std::clamp(caret, 0, Length(next));
  queue->Mark(Text(next), {caret, caret});
  text_ = std::move(next);
  caret_ = caret;
  active_ = true;
  wrap_down_ = true;
  ideal_horizontal_.reset();
}

void PreeditBuffer::SetCaret(DeferredTextInput* queue, int position) {
  if (!active_) {
    return;
  }
  position = std::clamp(position, 0, Length(text_));
  queue->SetCompositionCaret(position, true);
  caret_ = position;
  wrap_down_ = true;
  ideal_horizontal_.reset();
}

void PreeditBuffer::MoveLine(DeferredTextInput* queue, LineMovement movement) {
  if (!active_) {
    return;
  }
  const bool vertical =
      movement == LineMovement::kUp || movement == LineMovement::kDown;
  const auto next =
      queue->MoveCompositionCaret(Text(text_),
                                  caret_,
                                  wrap_down_,
                                  movement,
                                  vertical ? ideal_horizontal_ : std::nullopt);
  if (!next) {
    throw std::runtime_error(
        "XIM display-line caret requires a current runtime layout snapshot");
  }
  queue->SetCompositionCaret(next->position, next->wrap_down);
  caret_ = next->position;
  wrap_down_ = next->wrap_down;
  ideal_horizontal_ =
      vertical ? std::optional<float>(next->horizontal) : std::nullopt;
}

int PreeditBuffer::WordPosition(bool forward) const {
  int position = caret_;
  const int end = Length(text_);
  if (forward) {
    if (position >= end) {
      return end;
    }
    auto group = Classify(text_[position]);
    while (position < end) {
      const auto next = Classify(text_[position]);
      if (next != group) {
        if (next != CharacterClass::kWhitespace) {
          break;
        }
        group = next;
      }
      ++position;
    }
  } else {
    auto group = CharacterClass::kWhitespace;
    while (position > 0) {
      const auto next = Classify(text_[position - 1]);
      if (next != group) {
        if (group != CharacterClass::kWhitespace) {
          break;
        }
        group = next;
      }
      --position;
    }
  }
  return position;
}

void PreeditBuffer::Reset(DeferredTextInput* queue) {
  queue->Cancel();
  Clear();
}

void PreeditBuffer::Clear() {
  text_.clear();
  caret_ = 0;
  active_ = false;
  wrap_down_ = true;
  ideal_horizontal_.reset();
}

}  // namespace sfmlrmlui::ime::x11
