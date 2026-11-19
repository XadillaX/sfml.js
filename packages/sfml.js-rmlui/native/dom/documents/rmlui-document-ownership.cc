// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/dom/documents/rmlui-document-ownership.h"

#include <RmlUi/Core/ElementDocument.h>

#include <algorithm>
#include <vector>

#include "native/runtime/rmlui-debugger.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

Rml::Context* DestinationContext(Rml::Element* parent) {
  for (const auto& [context, token] : State().contexts) {
    if (context->GetRootElement() == parent) {
      return context;
    }
  }
  return parent->GetContext();
}

template <typename Visitor>
bool VisitDocuments(Rml::Element* root, Visitor visitor) {
  std::vector<Rml::Element*> pending{root};
  while (!pending.empty()) {
    auto* element = pending.back();
    pending.pop_back();
    if (auto* document = rmlui_dynamic_cast<Rml::ElementDocument*>(element);
        document && !visitor(document)) {
      return false;
    }
    for (int index = 0; index < element->GetNumChildren(true); ++index) {
      pending.push_back(element->GetChild(index));
    }
  }
  return true;
}

}  // namespace

void RegisterContextDocumentOwner(Rml::Context* context,
                                  const std::shared_ptr<ElementState>& token) {
  auto& documents = State().contexts.at(context)->owned_documents;
  bool registered = false;
  documents.erase(std::remove_if(documents.begin(),
                                 documents.end(),
                                 [&](const std::weak_ptr<ElementState>& weak) {
                                   const auto existing = weak.lock();
                                   registered |= existing == token;
                                   return !existing || !existing->element;
                                 }),
                  documents.end());
  if (!registered) {
    documents.push_back(token);
  }
}

bool CanModifyDocumentParent(Rml::Element* parent, Rml::Element* child) {
  if (!IsContextRoot(parent)) {
    return true;
  }
  auto* document = rmlui_dynamic_cast<Rml::ElementDocument*>(child);
  if (!document || !document->GetContext() ||
      document->GetContext()->GetRootElement() != parent) {
    Nan::ThrowError("A context root accepts only its own documents");
    return false;
  }
  return true;
}

bool CanInsertDocumentTree(Rml::Element* parent, Rml::Element* child) {
  auto* destination = DestinationContext(parent);
  auto* owner = DetachedOwnerOf(parent);
  return VisitDocuments(child, [&](Rml::ElementDocument* document) {
    auto* context = document->GetContext();
    if (!context || !State().contexts.contains(context) ||
        context != destination) {
      Nan::ThrowError("Documents can move only within their live context");
      return false;
    }
    if (!CanUnloadDebuggerDocument(document)) {
      return false;
    }
    // Insertion into an independently owned document tree changes which token
    // must release the nested borrowed context before that context disappears.
    if (owner) {
      RegisterContextDocumentOwner(context, ShareElement(owner));
    }
    return true;
  });
}

bool PrepareDocumentTreeRemoval(Rml::Element* element) {
  std::shared_ptr<ElementState> token;
  return VisitDocuments(element, [&](Rml::ElementDocument* document) {
    auto* context = document->GetContext();
    if (!context || !State().contexts.contains(context)) {
      Nan::ThrowError("Cannot detach a document without a live context");
      return false;
    }
    if (!CanUnloadDebuggerDocument(document)) {
      return false;
    }
    if (!token) {
      token = ShareElement(element);
    }
    RegisterContextDocumentOwner(context, token);
    return true;
  });
}

}  // namespace sfmlrmlui
