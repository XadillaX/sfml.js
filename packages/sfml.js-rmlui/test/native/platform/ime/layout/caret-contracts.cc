// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>
#include <RmlUi/Core/TextInputContext.h>

#include <cassert>
#include <cmath>
#include <functional>
#include <iostream>

#include "native/platform/ime/caret-bounds.h"

namespace {

struct CaretSnapshot {
  Rml::Element* element{nullptr};
  Rml::Vector2f position;
  float height{0.f};
  int calls{0};
  Rml::Rectanglef bounds;
};

CaretSnapshot* current_snapshot = nullptr;

void CaptureCaret(Rml::Element* element, Rml::Vector2f position, float height) {
  assert(current_snapshot);
  auto& snapshot = *current_snapshot;
  snapshot.element = element;
  snapshot.position = position;
  snapshot.height = height;
  ++snapshot.calls;
  snapshot.bounds = sfmlrmlui::ime::CaretBounds(element, position, height);
}

void Near(float actual, float expected) {
  assert(std::abs(actual - expected) < 0.001f);
}

}  // namespace

void CaretContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input) {
  auto* document = context->LoadDocumentFromMemory(
      "<rml><head><style>body{margin:0;}div{position:absolute;left:0;top:0;"
      "transform-origin:0px 0px;}#outer{transform:translate(20px,30px) "
      "scale(2,1.5);}#inner{transform:translate(13px,17px);}"
      "input{width:100px;height:30px;transform-origin:0px 0px;}"
      "</style></head><body><div id='outer'><div id='inner'>"
      "<input id='caret' value='ABC'/></div></div></body></rml>");
  assert(document);
  document->Show();
  context->Update();
  auto* input = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
      document->GetElementById("caret"));
  assert(input);

  CaretSnapshot snapshot;
  current_snapshot = &snapshot;
  Rml::TextInputContext::SetCaretCallbackForBinding(CaptureCaret);
  assert(input->Focus() && active_input());
  assert(context->Render());
  active_input()->SetCursorPosition(1);
  assert(snapshot.element == input && snapshot.calls > 0);
  assert(snapshot.bounds.Valid());
  Near(snapshot.bounds.Left(), 46.f + 2.f * snapshot.position.x);
  Near(snapshot.bounds.Top(), 55.5f + 1.5f * snapshot.position.y);
  Near(snapshot.bounds.Width(), 2.f);
  Near(snapshot.bounds.Height(), 1.5f * snapshot.height);
  std::cout << "PASS actual widget caret follows nested ancestor transforms\n";

  const int previous_calls = snapshot.calls;
  assert(input->SetProperty("transform", "rotate(90deg)"));
  context->Update();
  assert(context->Render());
  assert(snapshot.calls > previous_calls);
  Near(snapshot.bounds.Left(),
       46.f - 2.f * (snapshot.position.y + snapshot.height));
  Near(snapshot.bounds.Top(), 55.5f + 1.5f * snapshot.position.x);
  Near(snapshot.bounds.Width(), 2.f * snapshot.height);
  Near(snapshot.bounds.Height(), 1.5f);
  std::cout << "PASS render refreshes the rotated caret without a key event\n";

  input->RemoveProperty("transform");
  auto* outer = document->GetElementById("outer");
  auto* inner = document->GetElementById("inner");
  assert(outer && inner);
  assert(outer->SetProperty("transform", "none"));
  assert(outer->SetProperty("perspective", "100px"));
  assert(outer->SetProperty("perspective-origin", "0px 0px"));
  assert(inner->SetProperty("transform", "translateZ(50px)"));
  context->Update();
  assert(context->Render());
  Near(snapshot.bounds.Left(), 2.f * snapshot.position.x);
  Near(snapshot.bounds.Top(), 2.f * snapshot.position.y);
  Near(snapshot.bounds.Width(), 2.f);
  Near(snapshot.bounds.Height(), 2.f * snapshot.height);
  std::cout << "PASS candidate caret uses homogeneous perspective division\n";

  assert(inner->SetProperty("transform", "translateZ(150px)"));
  context->Update();
  assert(context->Render());
  assert(!snapshot.bounds.Valid());
  std::cout << "PASS behind-camera caret has no candidate rectangle\n";

  Rml::TextInputContext::SetCaretCallbackForBinding(nullptr);
  current_snapshot = nullptr;
  document->Close();
  context->Update();
}
