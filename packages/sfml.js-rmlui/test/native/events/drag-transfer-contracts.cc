// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/Event.h>
#include <RmlUi/Core/EventListener.h>
#include <RmlUi/Core/RenderInterface.h>
#include <RmlUi/Core/SystemInterface.h>

#include <cassert>
#include <functional>
#include <iostream>
#include <string>
#include <utility>

namespace sfmlrmlui {

// Vendor Context objects reference Lua lifecycle hooks, but this independent
// oracle creates no Lua states, data models, or binding-owned objects.
void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {
  assert(false && "Drag oracle must not create data models");
}

void ReleaseLuaContextModels(Rml::Context*) {}
void ReleaseLuaModel(Rml::Context*, Rml::DataModel*) {}

}  // namespace sfmlrmlui

namespace {

class BasicRenderer : public Rml::RenderInterface {
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

class Listener : public Rml::EventListener {
 public:
  explicit Listener(std::function<void(Rml::Event&)> action)
      : action_(std::move(action)) {}

  void ProcessEvent(Rml::Event& event) override { action_(event); }

 private:
  std::function<void(Rml::Event&)> action_;
};

void Observe(const std::string& name, bool detach, bool insert) {
  auto* context = Rml::CreateContext(name, {600, 300});
  assert(context);
  auto* document = context->LoadDocumentFromMemory(
      "<rml><head><style>"
      "body { width: 600px; height: 300px; margin: 0; }"
      "section { position: absolute; width: 200px; height: 150px; }"
      "#source { left: 0; top: 0; }"
      "#destination { left: 300px; top: 0; }"
      "#dragged { display: block; width: 80px; height: 80px; drag: clone; }"
      "</style></head><body>"
      "<section id=\"source\"><div id=\"dragged\"/></section>"
      "<section id=\"destination\"/></body></rml>");
  assert(document);
  document->Show();
  context->Update();
  auto* source = document->GetElementById("source");
  auto* destination = document->GetElementById("destination");
  auto* dragged = source->GetFirstChild();
  Rml::ElementPtr owned;
  int drops = 0;
  int ends = 0;
  int later = 0;

  Listener drop([&](Rml::Event& event) {
    assert(event.GetTargetElement() == destination);
    assert(event.GetParameter<void*>("drag_element", nullptr) == dragged);
    ++drops;
    if (detach) {
      owned = source->RemoveChild(dragged);
      assert(owned.get() == dragged);
      if (insert) {
        destination->AppendChild(std::move(owned));
      }
    }
  });
  Listener after([&](Rml::Event& event) {
    assert(event.GetParameter<void*>("drag_element", nullptr) == dragged);
    assert(dragged->GetId() == "dragged");
    ++later;
  });
  Listener end([&](Rml::Event& event) {
    assert(event.GetTargetElement() == dragged);
    ++ends;
  });
  destination->AddEventListener("dragdrop", &drop);
  destination->AddEventListener("dragdrop", &after);
  dragged->AddEventListener("dragend", &end);

  context->ProcessMouseMove(40, 40, 0);
  context->ProcessMouseButtonDown(0, 0);
  context->ProcessMouseMove(55, 45, 0);
  context->ProcessMouseMove(350, 45, 0);
  context->ProcessMouseButtonUp(0, 0);
  assert(drops == 1 && later == 1);
  assert(ends == (detach ? 0 : 1));
  assert(dragged->GetParentNode() ==
         (insert ? destination : (detach ? nullptr : source)));

  destination->RemoveEventListener("dragdrop", &drop);
  destination->RemoveEventListener("dragdrop", &after);
  dragged->RemoveEventListener("dragend", &end);
  owned.reset();
  assert(Rml::RemoveContext(name));
  std::cout << "PASS native-drag-" << name << "\n";
}

}  // namespace

int main() {
  BasicRenderer renderer;
  Rml::SystemInterface system;
  Rml::SetRenderInterface(&renderer);
  Rml::SetSystemInterface(&system);
  assert(Rml::Initialise());
  Observe("unmodified", false, false);
  Observe("transfer", true, true);
  Observe("detached", true, false);
  Rml::Shutdown();
}
