// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_X11_PREEDIT_BUFFER_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_X11_PREEDIT_BUFFER_H_

#include <optional>
#include <string>
#include <string_view>

#include "native/platform/ime/deferred-text-input.h"

namespace sfmlrmlui::ime::x11 {

// XIM offsets and lengths count characters, including in multibyte mode.
// Keep code points independently of the widget until the runtime drains.
class PreeditBuffer final {
 public:
  void Draw(DeferredTextInput* queue,
            int start,
            int length,
            std::optional<std::u32string_view> replacement,
            int caret);
  void SetCaret(DeferredTextInput* queue, int position);
  void MoveLine(DeferredTextInput* queue, LineMovement movement);
  int WordPosition(bool forward) const;
  void Reset(DeferredTextInput* queue);
  void Clear();
  std::u32string_view text() const { return text_; }
  int caret() const { return caret_; }

 private:
  std::u32string text_;
  int caret_{0};
  bool active_{false};
  bool wrap_down_{true};
  std::optional<float> ideal_horizontal_;
};

}  // namespace sfmlrmlui::ime::x11

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_X11_PREEDIT_BUFFER_H_
