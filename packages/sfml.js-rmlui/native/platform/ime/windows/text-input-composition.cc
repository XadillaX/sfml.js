// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <optional>
#include <stdexcept>
#include <string>

#include "native/platform/ime/windows/composition-update.h"
#include "native/platform/ime/windows/text-input-state.h"

namespace sfmlrmlui::ime::windows {
namespace {

std::u16string ReadText(HIMC context, DWORD kind) {
  static_assert(sizeof(wchar_t) == sizeof(char16_t));
  const LONG bytes = ImmGetCompositionStringW(context, kind, nullptr, 0);
  if (bytes < 0 || bytes % sizeof(char16_t) != 0) {
    throw std::runtime_error("IMM32 composition text is unavailable");
  }
  std::u16string text(static_cast<size_t>(bytes) / sizeof(char16_t), u'\0');
  if (bytes != 0 &&
      ImmGetCompositionStringW(context, kind, text.data(), bytes) != bytes) {
    throw std::runtime_error("IMM32 composition changed while copying");
  }
  return text;
}

}  // namespace

InputContext::InputContext(HWND window)
    : window_(window), context_(window ? ImmGetContext(window) : nullptr) {}

InputContext::~InputContext() {
  if (context_) {
    ImmReleaseContext(window_, context_);
  }
}

void ReadComposition(TextInputState* state, LPARAM flags) {
  InputContext context(state->window);
  if (!context.get()) {
    return;
  }
  std::optional<std::u16string> result;
  std::optional<std::u16string> preedit;
  size_t cursor = 0;
  if (flags & GCS_RESULTSTR) {
    result = ReadText(context.get(), GCS_RESULTSTR);
  }
  // A cursor-only notification still requires the full native text snapshot.
  if (flags & (GCS_COMPSTR | GCS_CURSORPOS)) {
    preedit = ReadText(context.get(), GCS_COMPSTR);
    const LONG position =
        ImmGetCompositionStringW(context.get(), GCS_CURSORPOS, nullptr, 0);
    if (position < 0) {
      throw std::runtime_error("IMM32 composition cursor is unavailable");
    }
    cursor = static_cast<size_t>(position);
  }
  ApplyComposition(
      &state->queue,
      result ? std::optional<std::u16string_view>(*result) : std::nullopt,
      preedit ? std::optional<std::u16string_view>(*preedit) : std::nullopt,
      cursor);
  if (result) {
    state->composing = false;
  }
  if (preedit) {
    state->composing = true;
  }
}

void CancelComposition(TextInputState* state) {
  const bool accepting = state->accepting;
  state->accepting = false;
  InputContext context(state->window);
  if (context.get()) {
    // Synchronous end/result callbacks cannot commit the retired widget.
    ImmNotifyIME(context.get(), NI_COMPOSITIONSTR, CPS_CANCEL, 0);
  }
  state->composing = false;
  state->accepting = accepting;
}

}  // namespace sfmlrmlui::ime::windows
