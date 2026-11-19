// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_DOCUMENTS_RMLUI_DOCUMENT_OWNERSHIP_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_DOCUMENTS_RMLUI_DOCUMENT_OWNERSHIP_H_

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Element.h>

#include <memory>

namespace sfmlrmlui {

struct ElementState;

// Root child mutations are limited to documents belonging to that same root.
bool CanModifyDocumentParent(Rml::Element* parent, Rml::Element* child);
// Check every nested document's borrowed context before transferring its tree.
bool CanInsertDocumentTree(Rml::Element* parent, Rml::Element* child);
// Register the outgoing owned tree before native removal can release ownership.
bool PrepareDocumentTreeRemoval(Rml::Element* element);
// Reuse the context's weak ownership list without retaining detached JS cycles.
void RegisterContextDocumentOwner(Rml::Context* context,
                                  const std::shared_ptr<ElementState>& token);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_DOCUMENTS_RMLUI_DOCUMENT_OWNERSHIP_H_
