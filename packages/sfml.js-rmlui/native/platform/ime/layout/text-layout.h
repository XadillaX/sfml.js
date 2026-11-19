// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_LAYOUT_TEXT_LAYOUT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_LAYOUT_TEXT_LAYOUT_H_

#include <algorithm>
#include <optional>
#include <vector>

#include "native/platform/ime/unicode-ranges.h"

namespace sfmlrmlui::ime {

enum class LineMovement { kStart, kEnd, kUp, kDown, kPrevious, kNext };

struct LayoutCaret {
  int position;
  bool wrap_down;
  float horizontal;
};

// Copied native display lines, with a pixel position for each Unicode boundary.
// A soft break has two stops at the same offset, one belonging to each line.
// Queries never hold a widget, font engine or runtime callback.
class TextLayout final {
 public:
  void Add(int line, int position, float horizontal) {
    if (line >= static_cast<int>(lines_.size())) {
      lines_.resize(line + 1);
    }
    lines_[line].push_back({position, horizontal});
  }

  std::optional<LayoutCaret> Move(int position,
                                  bool wrap_down,
                                  CodePointRange range,
                                  LineMovement movement,
                                  std::optional<float> ideal) const {
    const auto current = Find(position, wrap_down);
    if (!current) {
      return {};
    }
    int line = current->first;
    const float horizontal =
        ideal.value_or(lines_[line][current->second].horizontal);
    switch (movement) {
      case LineMovement::kUp:
      case LineMovement::kPrevious:
        line = std::max(0, line - 1);
        break;
      case LineMovement::kDown:
      case LineMovement::kNext:
        line = std::min(static_cast<int>(lines_.size()) - 1, line + 1);
        break;
      default:
        break;
    }
    const auto& stops = lines_[line];
    if (stops.empty()) {
      return {};
    }
    size_t stop = 0;
    if (movement == LineMovement::kEnd) {
      stop = stops.size() - 1;
    } else if (movement == LineMovement::kUp ||
               movement == LineMovement::kDown) {
      // Match the widget's midpoint rule, including ties to the right.
      while (stop + 1 < stops.size()) {
        if (stops[stop + 1].horizontal > horizontal) {
          if (horizontal - stops[stop].horizontal >=
              stops[stop + 1].horizontal - horizontal) {
            ++stop;
          }
          break;
        }
        ++stop;
      }
    }
    const int selected =
        std::clamp(stops[stop].position, range.start, range.end);
    return LayoutCaret{selected, selected != stops.back().position, horizontal};
  }

 private:
  struct Stop {
    int position;
    float horizontal;
  };

  std::optional<std::pair<int, size_t>> Find(int position,
                                             bool wrap_down) const {
    std::optional<std::pair<int, size_t>> result;
    for (size_t line = 0; line < lines_.size(); ++line) {
      for (size_t stop = 0; stop < lines_[line].size(); ++stop) {
        if (lines_[line][stop].position == position) {
          result = {static_cast<int>(line), stop};
          if (!wrap_down) {
            return result;
          }
        }
      }
    }
    return result;
  }

  std::vector<std::vector<Stop>> lines_;
};

}  // namespace sfmlrmlui::ime

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_LAYOUT_TEXT_LAYOUT_H_
