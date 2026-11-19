// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/ElementDocument.h>
#include <nan.h>

#include <utility>

#include "native/animation/rmlui-animation-values.h"
#include "native/dom/documents/rmlui-document-ownership.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

// Typed member routes share validation, never an unchecked pointer dispatcher.
template <auto getter>
NAN_METHOD(GetRelative) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(WrapNullableElement((element->*getter)()));
  }
}

template <auto query>
NAN_METHOD(QueryElements) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a selector string");
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  Nan::Utf8String selector(info[1]);
  Rml::ElementList elements;
  (element->*query)(elements, Rml::String(*selector, selector.length()));
  auto result = Nan::New<v8::Array>(elements.size());
  for (size_t i = 0; i < elements.size(); ++i) {
    result
        ->CreateDataProperty(
            Nan::GetCurrentContext(), i, WrapElement(elements[i]))
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(Closest) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a selector string");
  }
  if (auto* element = ElementOf(info[0])) {
    Nan::Utf8String selector(info[1]);
    info.GetReturnValue().Set(WrapNullableElement(
        element->Closest(Rml::String(*selector, selector.length()))));
  }
}

NAN_METHOD(GetNextSibling) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto* parent = element->GetParentNode();
  // RmlUi 6.3 subtracts (non-DOM count + 1) from size_t children.size().
  // With zero DOM children that underflows; do not enter its unbounded scan.
  auto* sibling = parent && parent->GetNumChildren() > 0
                      ? element->GetNextSibling()
                      : nullptr;
  info.GetReturnValue().Set(WrapNullableElement(sibling));
}

NAN_METHOD(Matches) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a selector string");
  }
  if (auto* element = ElementOf(info[0])) {
    Nan::Utf8String selector(info[1]);
    info.GetReturnValue().Set(
        element->Matches(Rml::String(*selector, selector.length())));
  }
}

NAN_METHOD(Contains) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto* other = info[1]->IsNull() ? nullptr : ElementOf(info[1]);
  if (other || info[1]->IsNull()) {
    info.GetReturnValue().Set(element->Contains(other));
  }
}

NAN_METHOD(GetChild) {
  if (!info[1]->IsInt32()) {
    return Nan::ThrowTypeError("Expected an int32 child index");
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(WrapNullableElement(
        element->GetChild(Nan::To<int>(info[1]).FromJust())));
  }
}

NAN_METHOD(GetNumChildren) {
  if (!info[1]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected includeNonDomElements boolean");
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(element->GetNumChildren(info[1]->IsTrue()));
  }
}

NAN_METHOD(HasChildNodes) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(element->HasChildNodes());
  }
}

NAN_METHOD(Clone) {
  if (auto* element = ElementOf(info[0])) {
    RefreshElementOwnership();
    auto clone = element->Clone();
    if (clone) {
      RebindClonedElementTweens(clone.get());
      auto* pointer = clone.get();
      auto handle = WrapOwnedElement(std::move(clone));
      RefreshElementSubtreeOwnership(pointer);
      info.GetReturnValue().Set(handle);
    } else {
      info.GetReturnValue().SetNull();
    }
  }
}

bool IsNonDomChild(Rml::Element* parent, Rml::Element* child) {
  for (int i = parent->GetNumChildren(); i < parent->GetNumChildren(true);
       ++i) {
    if (parent->GetChild(i) == child) {
      return true;
    }
  }
  return false;
}

void TrackInsertedChild(Rml::Element* parent, Rml::Element* child) {
  if (IsNonDomChild(parent, child)) {
    State().managed_non_dom[child] = child->GetObserverPtr();
  } else {
    State().managed_non_dom.erase(child);
  }
}

bool CanRemoveChild(Rml::Element* parent, Rml::Element* child) {
  if (IsNonDomChild(parent, child)) {
    const auto found = State().managed_non_dom.find(child);
    if (found == State().managed_non_dom.end() || !found->second) {
      Nan::ThrowError("Native internal non-DOM children cannot be transferred");
      return false;
    }
  }
  return true;
}

NAN_METHOD(AppendChild) {
  if (!info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected a domElement boolean");
  }
  const size_t active_depth = State().active_elements.size();
  auto* parent = ElementOf(info[0]);
  auto* child = parent ? ElementOf(info[1]) : nullptr;
  if (!child || !CanInsertElement(parent, child, active_depth)) {
    return;
  }
  if (IsContextRoot(parent) && !info[2]->IsTrue()) {
    return Nan::ThrowError("Context root documents must be DOM children");
  }
  auto token = ShareElement(child);
  auto* result =
      parent->AppendChild(std::move(token->owned), info[2]->IsTrue());
  TrackInsertedChild(parent, result);
  RefreshElementOwnership();
  info.GetReturnValue().Set(WrapNullableElement(result));
}

NAN_METHOD(InsertBefore) {
  const size_t active_depth = State().active_elements.size();
  auto* parent = ElementOf(info[0]);
  auto* child = parent ? ElementOf(info[1]) : nullptr;
  if (!child || !CanInsertElement(parent, child, active_depth)) {
    return;
  }
  auto* adjacent = info[2]->IsNull() ? nullptr : ElementOf(info[2]);
  if (!adjacent && !info[2]->IsNull()) {
    return;
  }
  auto token = ShareElement(child);
  auto* result = parent->InsertBefore(std::move(token->owned), adjacent);
  TrackInsertedChild(parent, result);
  RefreshElementOwnership();
  info.GetReturnValue().Set(WrapNullableElement(result));
}

NAN_METHOD(ReplaceChild) {
  const size_t active_depth = State().active_elements.size();
  auto* parent = ElementOf(info[0]);
  auto* child = parent ? ElementOf(info[1]) : nullptr;
  if (!child || !CanInsertElement(parent, child, active_depth)) {
    return;
  }
  auto* replaced = info[2]->IsNull() ? nullptr : ElementOf(info[2]);
  if ((!replaced && !info[2]->IsNull()) ||
      (replaced && (!CanTransferElement(replaced, active_depth) ||
                    !CanRemoveChild(parent, replaced) ||
                    (replaced->GetParentNode() == parent &&
                     !PrepareDocumentTreeRemoval(replaced))))) {
    return;
  }
  auto token = ShareElement(child);
  auto removed = parent->ReplaceChild(std::move(token->owned), replaced);
  TrackInsertedChild(parent, child);
  if (removed) {
    State().managed_non_dom.erase(removed.get());
    info.GetReturnValue().Set(WrapOwnedElement(std::move(removed)));
  } else {
    info.GetReturnValue().SetNull();
  }
  RefreshElementOwnership();
}

NAN_METHOD(RemoveChild) {
  const size_t active_depth = State().active_elements.size();
  auto* parent = ElementOf(info[0]);
  auto* child = parent ? ElementOf(info[1]) : nullptr;
  if (!child || !CanModifyDocumentParent(parent, child)) {
    return;
  }
  if (child->GetParentNode() != parent) {
    info.GetReturnValue().SetNull();
    return;
  }
  if (!CanTransferElement(child, active_depth) ||
      !CanRemoveChild(parent, child) || !PrepareDocumentTreeRemoval(child)) {
    return;
  }
  auto removed = parent->RemoveChild(child);
  if (removed) {
    State().managed_non_dom.erase(removed.get());
    info.GetReturnValue().Set(WrapOwnedElement(std::move(removed)));
  } else {
    info.GetReturnValue().SetNull();
  }
  RefreshElementOwnership();
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlDom) {
  SetRuntimeMethod<GetRelative<&Rml::Element::GetParentNode>, true>(
      target, "getParentNode");
  SetRuntimeMethod<GetNextSibling, true>(target, "getNextSibling");
  SetRuntimeMethod<GetRelative<&Rml::Element::GetPreviousSibling>, true>(
      target, "getPreviousSibling");
  SetRuntimeMethod<GetRelative<&Rml::Element::GetFirstChild>, true>(
      target, "getFirstChild");
  SetRuntimeMethod<GetRelative<&Rml::Element::GetLastChild>, true>(
      target, "getLastChild");
  SetRuntimeMethod<QueryElements<&Rml::Element::QuerySelectorAll>, true>(
      target, "querySelectorAll");
  SetRuntimeMethod<QueryElements<&Rml::Element::GetElementsByTagName>, true>(
      target, "getElementsByTagName");
  SetRuntimeMethod<QueryElements<&Rml::Element::GetElementsByClassName>, true>(
      target, "getElementsByClassName");
  SetRuntimeMethod<Closest, true>(target, "closest");
  SetRuntimeMethod<Matches, true>(target, "matches");
  SetRuntimeMethod<Contains, true>(target, "contains");
  SetRuntimeMethod<GetChild, true>(target, "getChild");
  SetRuntimeMethod<GetNumChildren, true, true, false, true>(target,
                                                            "getNumChildren");
  SetRuntimeMethod<HasChildNodes, true>(target, "hasChildNodes");
  SetRuntimeMethod<Clone, true>(target, "cloneElement");
  SetRuntimeMethod<AppendChild, true>(target, "appendChild");
  SetRuntimeMethod<InsertBefore, true>(target, "insertBefore");
  SetRuntimeMethod<ReplaceChild, true>(target, "replaceChild");
  SetRuntimeMethod<RemoveChild, true>(target, "removeChild");
}

}  // namespace sfmlrmlui
