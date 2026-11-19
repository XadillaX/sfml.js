// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>
#include <RmlUi/Core/TextInputContext.h>

#include <cassert>
#include <functional>
#include <iostream>
#include <memory>

#include "native/platform/ime/deferred-text-input.h"

#if __has_include("native/platform/ime/x11/preedit-buffer.h")
#include "native/platform/ime/x11/preedit-buffer.h"
#endif

// Treating XIM character offsets as byte/UTF16 offsets, losing feedback-only
// text, or canceling after the result must fail these widget contracts.
void X11ImeContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input) {
#if __has_include("native/platform/ime/x11/preedit-buffer.h")
  using sfmlrmlui::ime::CodePointRange;
  using sfmlrmlui::ime::DeferredTextInput;
  using sfmlrmlui::ime::TextInputSession;
  using sfmlrmlui::ime::x11::PreeditBuffer;
  auto* document = context->LoadDocumentFromMemory(
      "<rml><body><input id='x11' value='A旧B'/></body></rml>");
  document->Show();
  context->Update();
  auto* input = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
      document->GetElementById("x11"));
  assert(input && input->Focus() && active_input());
  auto session = std::make_shared<TextInputSession>(active_input(), input);
  session->SetSelection({1, 2});
  DeferredTextInput queue;
  queue.Activate(session);
  PreeditBuffer buffer;
  buffer.Draw(&queue, 0, 0, U"😀ni", 3);
  buffer.Draw(&queue, 1, 2, U"中", 1);
  assert(input->GetValue() == "A旧B");
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A😀中B");
  assert((session->selection() == CodePointRange{2, 2}));
  std::cout << "PASS X11 preedit replacements count characters before drain\n";

  buffer.Draw(&queue, 0, 2, {}, 2);
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A😀中B");
  assert((session->selection() == CodePointRange{3, 3}));
  buffer.SetCaret(&queue, 1);
  queue.Drain([] { return true; });
  assert((session->selection() == CodePointRange{2, 2}));
  std::cout << "PASS X11 feedback-only and caret callbacks preserve preedit\n";

  buffer.Draw(&queue, 0, 1, U"", 1);
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A中B");
  buffer.Reset(&queue);
  const sf::Event commit = sf::Event::TextEntered{U'你'};
  auto source = queue.Event(commit, false);
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你B");
  assert(queue.Consume(context, commit, source));
  assert(!session->composition());
  std::cout << "PASS X11 done before lookup preserves selected replacement\n";

  session->SetSelection({1, 2});
  buffer.Draw(&queue, 0, 0, U"pending", 7);
  buffer.Reset(&queue);
  buffer.SetCaret(&queue, 3);
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你B");
  assert((session->selection() == CodePointRange{1, 2}));
  assert(!session->composition());
  std::cout << "PASS X11 late caret cannot revive canceled preedit\n";
  queue.Deactivate(true);
  document->Close();
  context->Update();
#else
  (void)context;
  (void)active_input;
  assert(false && "X11 preedit callback delivery is missing");
#endif
}
