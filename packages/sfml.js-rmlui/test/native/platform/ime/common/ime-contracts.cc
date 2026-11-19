// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>
#include <RmlUi/Core/EventListener.h>
#include <RmlUi/Core/RenderInterface.h>
#include <RmlUi/Core/SystemInterface.h>
#include <RmlUi/Core/TextInputHandler.h>

#include <cassert>
#include <functional>
#include <iostream>
#include <memory>

#include "native/platform/ime/text-input-session.h"
#include "native/platform/ime/unicode-ranges.h"

void CaretContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input);

void DeferredImeContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input);

void WindowsImeContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input);

void X11ImeContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input);

void X11CallbackContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input);

#if defined(SFML_RMLUI_IME_COCOA_TESTS)
void CocoaImeContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input);
void PlatformFocusAllocationContracts(
    Rml::Context* context,
    const std::function<Rml::TextInputContext*()>& active_input);
#endif

namespace sfmlrmlui {

void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {
  assert(false && "IME fixture must not create a data model");
}

void ReleaseLuaContextModels(Rml::Context*) {}

}  // namespace sfmlrmlui

namespace {

class Renderer final : public Rml::RenderInterface {
 public:
  Rml::CompiledGeometryHandle CompileGeometry(Rml::Span<const Rml::Vertex>,
                                              Rml::Span<const int>) override {
    return 1;
  }

  void RenderGeometry(Rml::CompiledGeometryHandle,
                      Rml::Vector2f,
                      Rml::TextureHandle) override {}
  void ReleaseGeometry(Rml::CompiledGeometryHandle) override {}

  Rml::TextureHandle LoadTexture(Rml::Vector2i&, const Rml::String&) override {
    return 0;
  }

  Rml::TextureHandle GenerateTexture(Rml::Span<const Rml::byte>,
                                     Rml::Vector2i) override {
    return 0;
  }

  void ReleaseTexture(Rml::TextureHandle) override {}
  void EnableScissorRegion(bool) override {}
  void SetScissorRegion(Rml::Rectanglei) override {}
};

class Handler final : public Rml::TextInputHandler {
 public:
  void OnActivate(Rml::TextInputContext* input) override { active = input; }
  void OnDeactivate(Rml::TextInputContext*) override { active = nullptr; }
  void OnDestroy(Rml::TextInputContext*) override { active = nullptr; }

  Rml::TextInputContext* active{nullptr};
};

class ChangeListener final : public Rml::EventListener {
 public:
  void ProcessEvent(Rml::Event&) override { ++count; }

  int count{0};
};

void UnicodeRanges() {
  using sfmlrmlui::ime::CodePointRange;
  using sfmlrmlui::ime::FromUtf16;
  using sfmlrmlui::ime::ToUtf16;

  const std::u16string text = u"A😀中B";
  assert((FromUtf16(text, 1, 2) == CodePointRange{1, 2}));
  assert((FromUtf16(text, 2, 1) == CodePointRange{1, 2}));
  assert((FromUtf16(text, 0, 100) == CodePointRange{0, 4}));
  assert((FromUtf16(text, 100, 100) == CodePointRange{4, 4}));
  assert((ToUtf16(text, {1, 3}) == sfmlrmlui::ime::Utf16Range{1, 3}));
  assert((ToUtf16(text, {2, 2}) == sfmlrmlui::ime::Utf16Range{3, 0}));
  std::cout << "PASS UTF16 code-point ranges and surrogate boundaries\n";
}

void WidgetContracts(Rml::Context* context, Handler* handler) {
  using sfmlrmlui::ime::CodePointRange;
  using sfmlrmlui::ime::TextInputSession;

  auto* document = context->LoadDocumentFromMemory(
      "<rml><head><style>input{width:160px;height:30px;}</style></head>"
      "<body><input id='input' value='A😀中B'/></body></rml>");
  assert(document);
  document->Show();
  context->Update();

  auto* input = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
      document->GetElementById("input"));
  assert(input && input->Focus() && handler->active);
  TextInputSession session(handler->active, input);
  session.SetSelection({1, 3});
  assert((session.selection() == CodePointRange{1, 3}));

  session.Mark("ni", {2, 2});
  assert(input->GetValue() == "AniB");
  assert((session.composition() == CodePointRange{1, 3}));
  session.Mark("你", {1, 1});
  assert(input->GetValue() == "A你B");
  session.Insert("你好");
  assert(input->GetValue() == "A你好B");
  assert(!session.composition());
  assert((session.selection() == CodePointRange{3, 3}));
  std::cout << "PASS native preedit replacement and final commit\n";

  session.SetSelection({1, 3});
  session.Mark("pending", {7, 7});
  session.Cancel();
  assert(input->GetValue() == "A你好B");
  assert((session.selection() == CodePointRange{1, 3}));
  std::cout << "PASS cancel restores replaced text and selection\n";

  input->SetValue("");
  session.Refresh();
  session.Insert("😀", CodePointRange{0, 0});
  assert(input->GetValue() == "😀");
  session.SetSelection({0, 0});
  session.Mark("zhong", {5, 5});
  session.Insert("中");
  assert(input->GetValue() == "中😀");
  std::cout << "PASS insertion and composition at code-point zero\n";

  input->SetAttribute("maxlength", 3);
  input->SetValue("AB");
  session.Refresh();
  session.SetSelection({1, 1});
  session.Mark("unrestricted", {12, 12});
  assert(input->GetValue() == "AunrestrictedB");
  session.Insert("😀中");
  assert(input->GetValue() == "A😀B");
  assert((session.selection() == CodePointRange{2, 2}));
  std::cout << "PASS provisional text and maxlength-aware commit\n";

  input->SetValue("AB");
  session.Refresh();
  session.Mark("中", {1, 1}, CodePointRange{0, 1});
  session.Unmark();
  assert(input->GetValue() == "中B");
  assert(!session.composition());
  std::cout << "PASS explicit replacement and unmark commit\n";

  session.Mark("x", {1, 1});
  input->SetValue("external");
  session.Refresh();
  assert(!session.composition());
  session.Cancel();
  assert(input->GetValue() == "external");
  std::cout << "PASS external edits invalidate stale composition\n";

  input->RemoveAttribute("maxlength");
  input->SetValue("disabled");
  session.Refresh();
  session.SetSelection({0, 8});
  input->SetDisabled(true);
  session.Mark("pending", {7, 7});
  assert(input->GetValue() == "disabled");
  assert(!session.composition());
  session.Insert("ignored");
  assert(input->GetValue() == "disabled");
  input->SetDisabled(false);
  assert(input->Focus());
  std::cout << "PASS disabled native widget rejects preedit and commit\n";

  input->SetValue("AB");
  session.Refresh();
  session.SetSelection({0, 1});
  ChangeListener changes;
  input->AddEventListener("change", &changes);
  session.Mark("pending", {7, 7});
  assert(changes.count == 0);
  session.Insert("");
  assert(input->GetValue() == "B");
  assert(changes.count == 1);
  input->RemoveEventListener("change", &changes);
  std::cout << "PASS empty composition commit dispatches one native change\n";

  for (const bool maxlength_rejection : {false, true}) {
    if (maxlength_rejection) {
      input->SetAttribute("maxlength", 1);
    }
    // Programmatic SetValue may exceed maxlength; committing must preserve
    // the untouched character and reject additional inserted characters.
    input->SetValue("AB");
    session.Refresh();
    session.SetSelection({0, 1});
    changes.count = 0;
    input->AddEventListener("change", &changes);
    session.Mark("pending", {7, 7});
    session.Insert(maxlength_rejection ? "中" : "\n");
    assert(input->GetValue() == "B");
    assert(changes.count == 1);
    input->RemoveEventListener("change", &changes);
    input->RemoveAttribute("maxlength");
  }
  std::cout
      << "PASS sanitized and maxlength-rejected commits notify deletion\n";

  session.Mark("x", {1, 1});
  session.Invalidate();
  session.Insert("ignored");
  assert(!session.valid());
  document->Close();
  context->Update();
  session.Cancel();
  std::cout << "PASS invalidation rejects late native edits\n";
}

}  // namespace

int main() {
  UnicodeRanges();

  Renderer renderer;
  Rml::SystemInterface system;
  Handler handler;
  Rml::SetSystemInterface(&system);
  Rml::SetRenderInterface(&renderer);
  Rml::SetTextInputHandler(&handler);
  assert(Rml::Initialise());
  assert(Rml::LoadFontFace(
      "third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf"));
  auto* context = Rml::CreateContext("ime-contracts", {320, 200});
  assert(context);
  WidgetContracts(context, &handler);
  CaretContracts(context, [&handler] { return handler.active; });
  DeferredImeContracts(context, [&handler] { return handler.active; });
  WindowsImeContracts(context, [&handler] { return handler.active; });
  X11ImeContracts(context, [&handler] { return handler.active; });
  X11CallbackContracts(context, [&handler] { return handler.active; });
#if defined(SFML_RMLUI_IME_COCOA_TESTS)
  CocoaImeContracts(context, [&handler] { return handler.active; });
  PlatformFocusAllocationContracts(context,
                                   [&handler] { return handler.active; });
#endif
  Rml::Shutdown();
}
