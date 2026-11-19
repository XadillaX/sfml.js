// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_WINDOWS_COMPOSITION_DELIVERY_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_WINDOWS_COMPOSITION_DELIVERY_H_

#include <vector>

namespace sfmlrmlui::ime::windows {

// Tracks only the active Win32 call stack. Character values and prior events
// never participate: a separate WM_CHAR with the same value remains ordinary
// text. The actual WM_IME_CHAR default procedure owns its descendant WM_CHARs.
class CompositionDelivery final {
 public:
  enum class Kind { kOther, kKey, kImeCharacter, kCharacter };

  void Enter(const void* identity, Kind kind, bool ime_key = false) {
    const bool ime_character =
        kind == Kind::kImeCharacter ||
        (!frames_.empty() && frames_.back().ime_character);
    const bool handled = (kind == Kind::kKey && ime_key) ||
                         (kind == Kind::kCharacter && ime_character);
    frames_.push_back({identity, ime_character, handled});
  }

  void Leave(const void* identity) {
    // A failed allocation in native entry did not push a frame. Its leave
    // must not accidentally pop a still-live outer IME delivery.
    if (!frames_.empty() && frames_.back().identity == identity) {
      frames_.pop_back();
    }
  }

  bool handled() const { return !frames_.empty() && frames_.back().handled; }

 private:
  struct Frame {
    const void* identity;
    bool ime_character;
    bool handled;
  };
  std::vector<Frame> frames_;
};

}  // namespace sfmlrmlui::ime::windows

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_WINDOWS_COMPOSITION_DELIVERY_H_
