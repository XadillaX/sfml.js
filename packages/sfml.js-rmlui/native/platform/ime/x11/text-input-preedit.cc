// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cstdlib>
#include <cwchar>
#include <exception>
#include <optional>
#include <stdexcept>
#include <string>
#include <utility>

#include "native/platform/ime/x11/text-input-state.h"

namespace sfmlrmlui::ime::x11 {
namespace {

template <typename Action>
void Callback(TextInputState* state, Action action) {
  if (state->accepting) {
    try {
      if (state->can_continue && !state->can_continue()) {
        return;
      }
      action();
      if (state->flush) {
        state->flush(&state->queue);
      }
    } catch (...) {
      state->queue.Fail(std::current_exception());
    }
  }
}

class ThreadLocale final {
 public:
  explicit ThreadLocale(locale_t locale) : previous_(uselocale(locale)) {
    if (!previous_) {
      throw std::runtime_error("XIM character locale is unavailable");
    }
  }
  ~ThreadLocale() { uselocale(previous_); }
  ThreadLocale(const ThreadLocale&) = delete;
  ThreadLocale& operator=(const ThreadLocale&) = delete;

 private:
  locale_t previous_;
};

std::u32string Decode(const XIMText& text, locale_t locale) {
  static_assert(sizeof(wchar_t) == sizeof(char32_t));
  std::u32string result;
  result.reserve(text.length);
  if (text.encoding_is_wchar) {
    for (unsigned int index = 0; index < text.length; ++index) {
      result.push_back(static_cast<char32_t>(text.string.wide_char[index]));
    }
    return result;
  }
  // SFML restores the process locale after XOpenIM. Decode with the locale of
  // that actual XIM, on this thread only. length counts characters, not bytes;
  // incremental conversion also works without a trailing null terminator.
  ThreadLocale thread_locale(locale);
  const char* next = text.string.multi_byte;
  std::mbstate_t conversion{};
  for (unsigned int index = 0; index < text.length; ++index) {
    wchar_t character = 0;
    bool complete = false;
    for (size_t unit = 0; unit < static_cast<size_t>(MB_CUR_MAX); ++unit) {
      const size_t consumed = std::mbrtowc(&character, next++, 1, &conversion);
      if (consumed == static_cast<size_t>(-1)) {
        throw std::runtime_error("XIM preedit contains invalid multibyte text");
      }
      if (consumed != static_cast<size_t>(-2)) {
        complete = true;
        break;
      }
    }
    if (!complete) {
      throw std::runtime_error("XIM preedit contains incomplete text");
    }
    result.push_back(static_cast<char32_t>(character));
  }
  return result;
}

int Start(XIM, XPointer owner, XPointer) {
  auto* state = reinterpret_cast<TextInputState*>(owner);
  Callback(state, [&] { state->preedit.Reset(&state->queue); });
  // The XIM callback protocol requires an int result; -1 means no host limit.
  return -1;
}

void Done(XIM, XPointer owner, XPointer) {
  auto* state = reinterpret_cast<TextInputState*>(owner);
  // XIM can finish preedit before delivering its lookup result. Restoring the
  // original selection here lets the subsequent SFML text replace it once.
  Callback(state, [&] { state->preedit.Reset(&state->queue); });
}

void Draw(XIM, XPointer owner, XPointer payload) {
  auto* state = reinterpret_cast<TextInputState*>(owner);
  const auto* draw = reinterpret_cast<XIMPreeditDrawCallbackStruct*>(payload);
  if (!draw) {
    return;
  }
  Callback(state, [&] {
    std::u32string decoded;
    std::optional<std::u32string_view> replacement;
    if (!draw->text || draw->text->length == 0) {
      replacement = U"";
    } else if ((draw->text->encoding_is_wchar &&
                draw->text->string.wide_char) ||
               (!draw->text->encoding_is_wchar &&
                draw->text->string.multi_byte)) {
      decoded = Decode(*draw->text, state->locale);
      replacement = decoded;
    }
    state->preedit.Draw(&state->queue,
                        draw->chg_first,
                        draw->chg_length,
                        replacement,
                        draw->caret);
  });
}

void Caret(XIM, XPointer owner, XPointer payload) {
  auto* state = reinterpret_cast<TextInputState*>(owner);
  auto* caret = reinterpret_cast<XIMPreeditCaretCallbackStruct*>(payload);
  if (!caret) {
    return;
  }
  Callback(state, [&] {
    int position = state->preedit.caret();
    switch (caret->direction) {
      case XIMAbsolutePosition:
        position = caret->position;
        break;
      case XIMForwardChar:
        ++position;
        break;
      case XIMBackwardChar:
        --position;
        break;
      case XIMForwardWord:
        position = state->preedit.WordPosition(true);
        break;
      case XIMBackwardWord:
        position = state->preedit.WordPosition(false);
        break;
      case XIMLineStart:
        state->preedit.MoveLine(&state->queue, LineMovement::kStart);
        return;
      case XIMLineEnd:
        state->preedit.MoveLine(&state->queue, LineMovement::kEnd);
        return;
      case XIMCaretUp:
        state->preedit.MoveLine(&state->queue, LineMovement::kUp);
        return;
      case XIMCaretDown:
        state->preedit.MoveLine(&state->queue, LineMovement::kDown);
        return;
      case XIMPreviousLine:
        state->preedit.MoveLine(&state->queue, LineMovement::kPrevious);
        return;
      case XIMNextLine:
        state->preedit.MoveLine(&state->queue, LineMovement::kNext);
        return;
      default:
        return;
    }
    state->preedit.SetCaret(&state->queue, position);
  });
  // XIM synchronously consumes the returned position even after focus retires
  // the session. Reply from copied state without submitting a widget edit.
  caret->position = state->preedit.caret();
}

XIMStyle PreeditStyle(XIM method) {
  XIMStyles* styles = nullptr;
  if (XGetIMValues(method, XNQueryInputStyle, &styles, nullptr) || !styles) {
    return 0;
  }
  XIMStyle selected = 0;
  for (unsigned int index = 0; index < styles->count_styles; ++index) {
    const XIMStyle style = styles->supported_styles[index];
    if (style == (XIMPreeditCallbacks | XIMStatusNothing) ||
        style == (XIMPreeditCallbacks | XIMStatusNone)) {
      selected = style;
      break;
    }
  }
  XFree(styles);
  return selected;
}

}  // namespace

TextInputState::~TextInputState() {
  if (locale) {
    freelocale(locale);
  }
}

XIC CreateInputContext(TextInputState* state, Display* display, XIM method) {
  if (!display || !method || !state->window) {
    return nullptr;
  }
  const XIMStyle style = PreeditStyle(method);
  if (!style) {
    return nullptr;
  }
  locale_t locale = newlocale(LC_CTYPE_MASK, XLocaleOfIM(method), nullptr);
  if (!locale) {
    throw std::runtime_error("Cannot create the actual XIM character locale");
  }
  const XPointer owner = reinterpret_cast<XPointer>(state);
  state->start = {owner, reinterpret_cast<XIMProc>(Start)};
  state->done = {owner, Done};
  state->draw = {owner, Draw};
  state->caret = {owner, Caret};
  const auto preedit = XVaCreateNestedList(0,
                                           XNPreeditStartCallback,
                                           &state->start,
                                           XNPreeditDoneCallback,
                                           &state->done,
                                           XNPreeditDrawCallback,
                                           &state->draw,
                                           XNPreeditCaretCallback,
                                           &state->caret,
                                           nullptr);
  if (!preedit) {
    freelocale(locale);
    return nullptr;
  }
  XIC context = XCreateIC(method,
                          XNClientWindow,
                          state->window,
                          XNFocusWindow,
                          state->window,
                          XNInputStyle,
                          style,
                          XNPreeditAttributes,
                          preedit,
                          nullptr);
  XFree(preedit);
  if (!context) {
    freelocale(locale);
    return nullptr;
  }
  if (state->locale) {
    freelocale(state->locale);
  }
  state->locale = locale;
  state->context = context;
  state->display = display;
  return context;
}

void CancelComposition(TextInputState* state) {
  const bool accepting = state->accepting;
  state->accepting = false;
  if (state->context) {
    // The host owns this XIC and its display. Never open another connection,
    // destroy its context, or commit the reset result to a retired session.
    if (char* discarded = Xutf8ResetIC(state->context)) {
      XFree(discarded);
    }
  }
  state->preedit.Clear();
  state->accepting = accepting;
}

}  // namespace sfmlrmlui::ime::x11
