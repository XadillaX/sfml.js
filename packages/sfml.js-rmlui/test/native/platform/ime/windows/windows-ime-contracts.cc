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

#if __has_include("native/platform/ime/windows/composition-update.h")
#include "native/platform/ime/windows/composition-update.h"
#endif

// Dropping a result, reversing result/preedit order, using UTF16 cursor units
// as code points, or treating an empty result as absence breaks real widgets.
void WindowsImeContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input) {
#if __has_include("native/platform/ime/windows/composition-update.h")
  using sfmlrmlui::ime::CodePointRange;
  using sfmlrmlui::ime::DeferredTextInput;
  using sfmlrmlui::ime::TextInputSession;
  using sfmlrmlui::ime::windows::ApplyComposition;
  auto* document = context->LoadDocumentFromMemory(
      "<rml><body><input id='windows' value='A旧B'/></body></rml>");
  document->Show();
  context->Update();
  auto* input = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
      document->GetElementById("windows"));
  assert(input && input->Focus() && active_input());
  auto session = std::make_shared<TextInputSession>(active_input(), input);
  session->SetSelection({1, 2});
  DeferredTextInput queue;
  queue.Activate(session);
  ApplyComposition(&queue, {}, u"ni", 2);
  queue.Drain([] { return true; });
  assert(input->GetValue() == "AniB");
  ApplyComposition(&queue, u"你", u"hao", 3);
  assert(input->GetValue() == "AniB");
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你haoB");
  queue.Cancel();
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你B");
  std::cout << "PASS Windows result precedes new preedit in one delivery\n";

  session->SetSelection({1, 2});
  ApplyComposition(&queue, {}, u"😀中", 2);
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A😀中B");
  assert((session->selection() == CodePointRange{2, 2}));
  ApplyComposition(&queue, {}, u"😀中", 3);
  queue.Drain([] { return true; });
  assert((session->selection() == CodePointRange{3, 3}));
  queue.Cancel();
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你B");
  assert((session->selection() == CodePointRange{1, 2}));
  std::cout << "PASS Windows cursor-only updates use UTF16 boundaries\n";

  ApplyComposition(&queue, {}, u"x", 1);
  ApplyComposition(&queue, u"", {}, 0);
  queue.Drain([] { return true; });
  assert(input->GetValue() == "AB");
  assert(!session->composition());
  std::cout << "PASS Windows empty result deletes the committed selection\n";

  session->SetSelection({1, 1});
  ApplyComposition(&queue, {}, u"emoji", 5);
  ApplyComposition(&queue, u"😀", {}, 0);
  const sf::Event high = sf::Event::TextEntered{U'😀'};
  auto owned = queue.Event(high, true);
  auto ordinary = queue.Event(high, false);
  queue.Cancel();
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A😀😀B");
  assert(queue.Consume(context, high, owned));
  assert(queue.Consume(context, high, ordinary));
  assert(!session->composition());
  std::cout << "PASS Windows duplicate ownership preserves ordinary repeats\n";
  queue.Deactivate(true);
  document->Close();
  context->Update();
#else
  (void)context;
  (void)active_input;
  assert(false && "Windows composition snapshot delivery is missing");
#endif
}
