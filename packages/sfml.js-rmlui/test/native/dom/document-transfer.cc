// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/RenderInterface.h>
#include <RmlUi/Core/SystemInterface.h>

#include <cassert>
#include <iostream>
#include <utility>

namespace sfmlrmlui {

// Existing vendor objects include these binding-only Lua cleanup hooks.
void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {
  assert(false && "This document oracle must not create data models");
}

void ReleaseLuaContextModels(Rml::Context*) {}

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

void CheckNestedDocument() {
  auto* context = Rml::CreateContext("nested-document", {320, 240});
  assert(context);
  auto* outer = context->LoadDocumentFromMemory(
      "<rml><head/><body><div id='sandbox_target'/></body></rml>");
  assert(outer);
  auto* sandbox = outer->GetElementById("sandbox_target");
  auto* iframe = context->CreateDocument();
  assert(iframe && context->GetNumDocuments() == 2);
  const auto observer = iframe->GetObserverPtr();
  auto* root = iframe->GetParentNode();
  assert(root == context->GetRootElement());

  // Exact original DemoWindow constructor: real document, root -> sandbox.
  auto owned = root->RemoveChild(iframe);
  assert(owned.get() == iframe && !iframe->GetParentNode());
  assert(iframe->GetContext() == context);
  assert(iframe->GetOwnerDocument() == iframe);
  assert(context->GetNumDocuments() == 1);
  assert(sandbox->AppendChild(std::move(owned)) == iframe);
  iframe->SetInnerRML("<div id='inside'/>");
  auto* inside = iframe->GetElementById("inside");
  assert(inside && inside->GetOwnerDocument() == iframe);
  assert(inside->GetContext() == context);
  iframe->UpdateDocument();
  context->Update();
  assert(iframe->GetParentNode() == sandbox);
  std::cout << "PASS native-original-demo-root-to-sandbox-document\n";

  iframe->Close();
  context->Update();
  assert(observer && iframe->GetParentNode() == sandbox);
  assert(context->GetNumDocuments() == 1);
  const auto inside_observer = inside->GetObserverPtr();
  outer->Close();
  context->Update();
  assert(!observer && !inside_observer);
  assert(context->GetNumDocuments() == 0);
  assert(Rml::RemoveContext("nested-document"));
  std::cout << "PASS native-nested-close-and-outer-close-destruction\n";
}

void CheckRootReattachment() {
  auto* context = Rml::CreateContext("document-reattachment", {320, 240});
  auto* document = context->CreateDocument();
  auto* root = context->GetRootElement();
  const auto observer = document->GetObserverPtr();
  auto owned = root->RemoveChild(document);
  document->Close();
  context->Update();
  assert(observer && owned.get() == document);
  assert(context->GetNumDocuments() == 0);
  assert(root->AppendChild(std::move(owned)) == document);
  assert(context->GetNumDocuments() == 1);
  assert(document->GetContext() == context);
  document->Close();
  context->Update();
  assert(!observer && context->GetNumDocuments() == 0);
  assert(Rml::RemoveContext("document-reattachment"));
  std::cout << "PASS native-detached-close-and-root-reattachment\n";
}

void CheckDetachedDestruction() {
  auto* context = Rml::CreateContext("document-destruction", {320, 240});
  auto* document = context->CreateDocument();
  auto owned = context->GetRootElement()->RemoveChild(document);
  const auto observer = document->GetObserverPtr();
  assert(document->GetContext() == context);
  // The document borrows context; native ownership must end before context.
  owned.reset();
  assert(!observer);
  assert(Rml::RemoveContext("document-destruction"));
  std::cout << "PASS native-detached-document-destruction-before-context\n";
}

}  // namespace

int main() {
  BasicRenderer renderer;
  Rml::SystemInterface system;
  Rml::SetRenderInterface(&renderer);
  Rml::SetSystemInterface(&system);
  assert(Rml::Initialise());
  CheckNestedDocument();
  CheckRootReattachment();
  CheckDetachedDestruction();
  Rml::Shutdown();
}
