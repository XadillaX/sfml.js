// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>
#include <RmlUi/Core/Elements/ElementFormControlTextArea.h>
#include <RmlUi/Core/TextInputContext.h>
#include <locale.h>
#if defined(__APPLE__)
#include <xlocale.h>
#endif

#include <cassert>
#include <cstdint>
#include <cstdlib>
#include <cwchar>
#include <exception>
#include <functional>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>

#include "native/platform/ime/x11/preedit-buffer.h"
#if defined(SFML_RMLUI_XLIB_TESTS)
#include "native/platform/ime/x11/text-input-state.h"
#endif

namespace {

// The current production bodies operate on the real deferred queue/widget.
// Use real Xlib state/declarations where available; the fallback substitutes
// only declarations on macOS hosts without an Xlib SDK.
using sfmlrmlui::ime::LineMovement;
#if defined(SFML_RMLUI_XLIB_TESTS)
using sfmlrmlui::ime::x11::TextInputState;
constexpr auto kXimForwardChar = XIMForwardChar;
constexpr auto kXimBackwardChar = XIMBackwardChar;
constexpr auto kXimForwardWord = XIMForwardWord;
constexpr auto kXimBackwardWord = XIMBackwardWord;
constexpr auto kXimCaretUp = XIMCaretUp;
constexpr auto kXimCaretDown = XIMCaretDown;
constexpr auto kXimNextLine = XIMNextLine;
constexpr auto kXimPreviousLine = XIMPreviousLine;
constexpr auto kXimLineStart = XIMLineStart;
constexpr auto kXimLineEnd = XIMLineEnd;
constexpr auto kXimAbsolutePosition = XIMAbsolutePosition;
constexpr auto kXimDontChange = XIMDontChange;
constexpr auto kXimIsPrimary = XIMIsPrimary;
#else
using XIM = void*;
using XPointer = char*;
using XIMFeedback = uintptr_t;
struct XIMText {
  uint16_t length;
  XIMFeedback* feedback;
  int encoding_is_wchar;
  union {
    char* multi_byte;
    wchar_t* wide_char;
  } string;
};
enum XIMCaretDirection {
  kXimForwardChar,
  kXimBackwardChar,
  kXimForwardWord,
  kXimBackwardWord,
  kXimCaretUp,
  kXimCaretDown,
  kXimNextLine,
  kXimPreviousLine,
  kXimLineStart,
  kXimLineEnd,
  kXimAbsolutePosition,
  kXimDontChange
};
enum XIMCaretStyle { kXimIsInvisible, kXimIsPrimary, kXimIsSecondary };
struct XIMPreeditCaretCallbackStruct {
  int position;
  XIMCaretDirection direction;
  XIMCaretStyle style;
};
struct XIMPreeditDrawCallbackStruct {
  int caret;
  int chg_first;
  int chg_length;
  XIMText* text;
};
struct TextInputState {
  locale_t locale{nullptr};
  sfmlrmlui::ime::DeferredTextInput queue;
  sfmlrmlui::ime::x11::PreeditBuffer preedit;
  void (*flush)(sfmlrmlui::ime::DeferredTextInput*) = nullptr;
  bool (*can_continue)() = nullptr;
  bool accepting{false};
};
#endif

Rml::Vector2f displayed_caret;

void CaptureDisplayCaret(Rml::Element*, Rml::Vector2f position, float) {
  displayed_caret = position;
}

#define XIMForwardChar kXimForwardChar
#define XIMBackwardChar kXimBackwardChar
#define XIMForwardWord kXimForwardWord
#define XIMBackwardWord kXimBackwardWord
#define XIMCaretUp kXimCaretUp
#define XIMCaretDown kXimCaretDown
#define XIMNextLine kXimNextLine
#define XIMPreviousLine kXimPreviousLine
#define XIMLineStart kXimLineStart
#define XIMLineEnd kXimLineEnd
#define XIMAbsolutePosition kXimAbsolutePosition
#define XIMDontChange kXimDontChange
#include "x11-callback-body.inc"
#undef XIMDontChange
#undef XIMAbsolutePosition
#undef XIMLineEnd
#undef XIMLineStart
#undef XIMPreviousLine
#undef XIMNextLine
#undef XIMCaretDown
#undef XIMCaretUp
#undef XIMBackwardWord
#undef XIMForwardWord
#undef XIMBackwardChar
#undef XIMForwardChar

void DecodeContracts() {
  locale_t ascii = newlocale(LC_CTYPE_MASK, "C", nullptr);
  locale_t utf8 = newlocale(LC_CTYPE_MASK, "en_US.UTF-8", nullptr);
  assert(ascii && utf8);
  locale_t original = uselocale(ascii);
  assert(original);
  char bytes[8] = {'A', '\xf0', '\x9f', '\x98', '\x80', '\xe4', '\xb8', '\xad'};
  XIMText text{3, nullptr, false, {}};
  text.string.multi_byte = bytes;
  assert(Decode(text, utf8) == U"A😀中");
  assert(uselocale(nullptr) == ascii);
  std::cout << "PASS XIM decodes character-counted nonterminated UTF8\n";

  wchar_t wide[3] = {L'A', static_cast<wchar_t>(0x1f600), L'中'};
  text.encoding_is_wchar = true;
  text.string.wide_char = wide;
  assert(Decode(text, ascii) == U"A😀中");
  assert(uselocale(nullptr) == ascii);
  std::cout << "PASS XIM wide text bypasses unrelated ambient encoding\n";

  char invalid[1] = {'\xff'};
  text.length = 1;
  text.encoding_is_wchar = false;
  text.string.multi_byte = invalid;
  bool rejected = false;
  try {
    (void)Decode(text, utf8);
  } catch (const std::runtime_error&) {
    rejected = true;
  }
  assert(rejected && uselocale(nullptr) == ascii);
  assert(uselocale(original));
  freelocale(utf8);
  freelocale(ascii);
  std::cout << "PASS XIM decoding errors restore the caller thread locale\n";
}

void Move(TextInputState* state,
          XIMCaretDirection direction,
          int expected,
          int absolute = 0) {
  XIMPreeditCaretCallbackStruct caret{absolute, direction, kXimIsPrimary};
  Caret(nullptr,
        reinterpret_cast<XPointer>(state),
        reinterpret_cast<XPointer>(&caret));
  if (caret.position != expected) {
    std::cerr << "XIM direction " << direction << " returned " << caret.position
              << "; expected " << expected << '\n';
  }
  assert(caret.position == expected);
  assert(state->preedit.caret() == expected);
}

void DisplayLineContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input) {
  auto* document = context->LoadDocumentFromMemory(
      "<rml><head><style>textarea{width:120px;height:120px;"
      "font-family:LatoLatin;font-size:20px;}</style></head>"
      "<body><textarea id='lines'>旧</textarea></body></rml>");
  assert(document);
  document->Show();
  context->Update();
  auto* input = rmlui_dynamic_cast<Rml::ElementFormControlTextArea*>(
      document->GetElementById("lines"));
  assert(input && input->Focus() && active_input());
  auto session =
      std::make_shared<sfmlrmlui::ime::TextInputSession>(active_input(), input);
  session->SetSelection({0, 1});
  session->EnableLayoutCapture();
  TextInputState state;
  state.accepting = true;
  state.queue.Activate(session);
  state.preedit.Draw(&state.queue, 0, 0, U"WiWi\nWiiiiW\nWiWi", 2);
  state.queue.Drain([] { return true; });
  context->Update();
  assert(context->Render());
  session->Refresh();
  Move(&state, kXimLineEnd, 4);
  Move(&state, kXimLineStart, 0);
  Move(&state, kXimNextLine, 5);
  Move(&state, kXimPreviousLine, 0);
  state.queue.Drain([] { return true; });
  assert((session->selection() == sfmlrmlui::ime::CodePointRange{0, 0}));
  std::cout << "PASS XIM line callbacks use the current display line\n";

  state.preedit.Draw(&state.queue, 0, 16, U"WiWi\niiiiWW\nWiWi", 1);
  state.queue.Drain([] { return true; });
  context->Update();
  assert(context->Render());
  session->Refresh();
  // Use the native widget's own down-key behavior as the pixel-position oracle.
  context->ProcessKeyDown(Rml::Input::KI_DOWN, 0);
  int start = 0;
  int end = 0;
  active_input()->GetSelectionRange(start, end);
  assert(start == 9 && end == 9);
  active_input()->SetCursorPosition(1);
  Move(&state, kXimCaretDown, 9);
  Move(&state, kXimCaretDown, 13);
  Move(&state, kXimCaretUp, 9);
  Move(&state, kXimCaretUp, 1);
  state.queue.Drain([] { return true; });
  assert((session->selection() == sfmlrmlui::ime::CodePointRange{1, 1}));
  std::cout << "PASS XIM vertical movement follows proportional glyph widths\n";

  state.preedit.Draw(&state.queue, 0, 16, U"WiWi\ni\nWiWi", 1);
  state.queue.Drain([] { return true; });
  context->Update();
  assert(context->Render());
  session->Refresh();
  Move(&state, kXimCaretDown, 6);
  state.queue.Drain([] { return true; });
  const auto feedback_revision = active_input()->GetLayoutRevisionForBinding();
  assert(feedback_revision);
  state.preedit.Draw(&state.queue, 0, 11, {}, 6);
  state.queue.Drain([] { return true; });
  assert(active_input()->GetLayoutRevisionForBinding() == feedback_revision);
  assert(session->layout());
  Move(&state, kXimCaretDown, 8);
  Move(&state, kXimCaretUp, 6);
  Move(&state, kXimCaretUp, 1);
  state.queue.Drain([] { return true; });
  std::cout
      << "PASS XIM vertical movement retains its offset across short lines\n";
  std::cout
      << "PASS XIM feedback retains the vertical offset across short lines\n";

  assert(input->SetProperty("width", "50px"));
  state.preedit.Draw(&state.queue, 0, 11, U"WWWWWW", 1);
  state.queue.Drain([] { return true; });
  context->Update();
  auto previous = Rml::TextInputContext::CaretCallbackSlotForBinding();
  Rml::TextInputContext::SetCaretCallbackForBinding(CaptureDisplayCaret);
  assert(context->Render());
  session->Refresh();
  const float first_line = displayed_caret.y;
  Move(&state, kXimLineEnd, 2);
  state.queue.Drain([] { return true; });
  assert(context->Render());
  assert(displayed_caret.y == first_line);
  const auto wrap_feedback_revision =
      active_input()->GetLayoutRevisionForBinding();
  state.preedit.Draw(&state.queue, 0, 6, {}, 2);
  state.queue.Drain([] { return true; });
  assert(active_input()->GetLayoutRevisionForBinding() ==
         wrap_feedback_revision);
  assert(context->Render());
  assert(displayed_caret.y == first_line);
  session->Refresh();
  std::cout << "PASS XIM feedback retains the rendered soft-break affinity\n";
  Move(&state, kXimNextLine, 2);
  state.queue.Drain([] { return true; });
  assert(context->Render());
  assert(displayed_caret.y > first_line);
  Move(&state, kXimPreviousLine, 0);
  Move(&state, kXimLineEnd, 2);
  Move(&state, kXimLineStart, 0);
  state.queue.Drain([] { return true; });
  assert(context->Render());
  assert(displayed_caret.y == first_line);
  Rml::TextInputContext::SetCaretCallbackForBinding(previous);
  std::cout
      << "PASS XIM soft-break offsets preserve their rendered line affinity\n";

  state.preedit.Draw(&state.queue, 0, 6, U"changed", 3);
  XIMPreeditCaretCallbackStruct fresh{999, kXimCaretDown, kXimIsPrimary};
  Caret(nullptr,
        reinterpret_cast<XPointer>(&state),
        reinterpret_cast<XPointer>(&fresh));
  assert(fresh.position == 3 && state.preedit.caret() == 3);
  bool rejected = false;
  try {
    state.queue.Drain([] { return true; });
  } catch (const std::runtime_error& error) {
    rejected = std::string(error.what()).find("runtime layout snapshot") !=
               std::string::npos;
  }
  assert(rejected && input->GetValue() == "WWWWWW");
  state.queue.Drain([] { return true; });
  assert(input->GetValue() == "changed");
  std::cout << "PASS XIM stale layouts surface at runtime without a false "
               "caret reply\n";

  state.preedit.Reset(&state.queue);
  state.queue.Drain([] { return true; });
  input->SetValue("😀旧中");
  assert(input->SetProperty("width", "120px"));
  context->Update();
  session->Refresh();
  session->SetSelection({1, 2});
  state.preedit.Draw(&state.queue, 0, 0, U"AB\nWiWi", 5);
  state.queue.Drain([] { return true; });
  context->Update();
  assert(context->Render());
  session->Refresh();
  Move(&state, kXimLineStart, 3);
  Move(&state, kXimLineEnd, 7);
  Move(&state, kXimPreviousLine, 0);
  state.queue.Drain([] { return true; });
  assert((session->selection() == sfmlrmlui::ime::CodePointRange{1, 1}));
  assert(input->GetValue() == "😀AB\nWiWi中");
  std::cout
      << "PASS XIM display-line movement stays inside Unicode preedit bounds\n";
  state.queue.Deactivate(true);
  document->Close();
  context->Update();
}

template <typename State>
void SameDeliveryLayout(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input) {
  auto* document = context->LoadDocumentFromMemory(
      "<rml><head><style>textarea{width:120px;height:120px;"
      "font-family:LatoLatin;font-size:20px;}</style></head>"
      "<body><textarea id='fresh'>旧</textarea></body></rml>");
  document->Show();
  context->Update();
  auto* input = rmlui_dynamic_cast<Rml::ElementFormControlTextArea*>(
      document->GetElementById("fresh"));
  assert(input && input->Focus() && active_input());
  auto session =
      std::make_shared<sfmlrmlui::ime::TextInputSession>(active_input(), input);
  session->SetSelection({0, 1});
  session->EnableLayoutCapture();
  State state;
  state.accepting = true;
  state.queue.Activate(session);
  if constexpr (requires { state.flush; }) {
    state.flush = [](auto* queue) { queue->Drain([] { return true; }); };
  }
  wchar_t value[] = L"WiWi\niiiiWW\nWiWi";
  XIMText text{16, nullptr, true, {}};
  text.string.wide_char = value;
  XIMPreeditDrawCallbackStruct draw{1, 0, 0, &text};
  Draw(nullptr,
       reinterpret_cast<XPointer>(&state),
       reinterpret_cast<XPointer>(&draw));
  // No Update, Render or separately scheduled drain may separate this draw
  // from the caret reply synchronously consumed by the input method.
  Move(&state, kXimLineEnd, 4);
  Move(&state, kXimLineStart, 0);
  Move(&state, kXimCaretDown, 5);
  assert(input->GetValue() == "WiWi\niiiiWW\nWiWi");
  assert((session->selection() == sfmlrmlui::ime::CodePointRange{5, 5}));
  state.queue.Deactivate(true);
  document->Close();
  context->Update();
  std::cout << "PASS same-delivery XIM draw formats before its line reply\n";
}

}  // namespace

void X11CallbackContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input) {
  DecodeContracts();
  using sfmlrmlui::ime::CodePointRange;
  using sfmlrmlui::ime::TextInputSession;
  auto* document = context->LoadDocumentFromMemory(
      "<rml><head><style>input{width:200px;height:30px;"
      "font-family:LatoLatin;font-size:20px;}"
      "</style></head><body><input id='words' value='A旧B'/></body></rml>");
  document->Show();
  context->Update();
  auto* input = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
      document->GetElementById("words"));
  assert(input && input->Focus() && active_input());
  auto session = std::make_shared<TextInputSession>(active_input(), input);
  session->SetSelection({1, 2});
  session->EnableLayoutCapture();
  TextInputState state;
  state.accepting = true;
  state.queue.Activate(session);
  state.preedit.Draw(&state.queue, 0, 0, U"你好  world", 0);
  Move(&state, kXimForwardWord, 4);
  assert(input->GetValue() == "A旧B");
  state.queue.Drain([] { return true; });
  assert(input->GetValue() == "A你好  worldB");
  assert((session->selection() == CodePointRange{5, 5}));
  context->Update();
  assert(context->Render());
  session->Refresh();
  Move(&state, kXimLineEnd, 9);
  Move(&state, kXimBackwardWord, 4);
  Move(&state, kXimBackwardWord, 0);
  state.queue.Drain([] { return true; });
  assert((session->selection() == CodePointRange{1, 1}));
  std::cout
      << "PASS XIM word callbacks preserve code points and queued edits\n";

  state.preedit.Draw(&state.queue, 0, 9, U"😀..  ok", 0);
  Move(&state, kXimForwardWord, 1);
  Move(&state, kXimForwardWord, 5);
  Move(&state, kXimBackwardWord, 1);
  Move(&state, kXimBackwardWord, 0);
  Move(&state, kXimAbsolutePosition, 7, 999);
  Move(&state, kXimDontChange, 7);
  state.queue.Drain([] { return true; });
  assert(input->GetValue() == "A😀..  okB");
  assert((session->selection() == CodePointRange{8, 8}));
  std::cout << "PASS XIM word boundaries separate punctuation and clamp ends\n";

  state.preedit.Reset(&state.queue);
  state.accepting = false;
  XIMPreeditCaretCallbackStruct retired{999, kXimForwardChar, kXimIsPrimary};
  Caret(nullptr,
        reinterpret_cast<XPointer>(&state),
        reinterpret_cast<XPointer>(&retired));
  assert(retired.position == 0);
  state.queue.Drain([] { return true; });
  assert(input->GetValue() == "A旧B");
  assert((session->selection() == CodePointRange{1, 2}));
  std::cout
      << "PASS retired XIM callbacks return the current caret without edits\n";
  state.queue.Deactivate(true);
  document->Close();
  context->Update();
  DisplayLineContracts(context, active_input);
  SameDeliveryLayout<TextInputState>(context, active_input);
}
