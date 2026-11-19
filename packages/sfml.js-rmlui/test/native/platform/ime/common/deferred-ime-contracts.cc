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

#if __has_include("native/platform/ime/deferred-text-input.h")
#include "native/platform/ime/deferred-text-input.h"
#endif

// Removing deferred delivery, session invalidation, or queue-owned sources
// must break these real-widget contracts.
void DeferredImeContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input) {
#if __has_include("native/platform/ime/deferred-text-input.h")
  using sfmlrmlui::ime::DeferredTextInput;
  using sfmlrmlui::ime::TextInputSession;
  auto* document = context->LoadDocumentFromMemory(
      "<rml><body><input id='deferred' value='AB'/></body></rml>");
  document->Show();
  context->Update();
  auto* input = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
      document->GetElementById("deferred"));
  assert(input && input->Focus() && active_input());
  auto session = std::make_shared<TextInputSession>(active_input(), input);
  session->SetSelection({1, 1});
  DeferredTextInput queue;
  queue.Activate(session);
  queue.Mark("ni", {2, 2});
  queue.Commit("你");
  assert(input->GetValue() == "AB");
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你B");
  assert(!session->composition());
  std::cout << "PASS deferred native preedit and commit edit only at drain\n";

  queue.Mark("pending", {7, 7});
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你pendingB");
  queue.Cancel();
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你B");
  std::cout << "PASS deferred cancellation restores the widget selection\n";

  const sf::Event text = sf::Event::TextEntered{U'中'};
  auto source = queue.Event(text, false);
  const std::weak_ptr<void> watch = source;
  assert(!queue.Consume(context, text, source));
  queue.Drain([] { return false; });
  assert(input->GetValue() == "A你B");
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你中B");
  assert(queue.Consume(context, text, source));
  assert(!queue.Consume(context, text, {}));
  source.reset();
  assert(watch.expired());
  std::cout << "PASS deferred text sources have no retained event history\n";

  queue.Mark("ignored", {7, 7});
  queue.Deactivate(false);
  queue.Activate(session);
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你中B");
  queue.Event(text, true);
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你中B");
  std::cout << "PASS retired edits and IME-owned duplicate text are rejected\n";

  queue.Mark("late", {4, 4});
  queue.Close();
  assert(input->GetValue() == "A你中B");
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你中B");
  queue.Commit("ignored");
  queue.Drain([] { return true; });
  assert(input->GetValue() == "A你中B");
  std::cout << "PASS native close rejects pending and late work\n";
  document->Close();
  context->Update();
#else
  (void)context;
  (void)active_input;
  assert(false && "deferred native platform input is not implemented");
#endif
}
