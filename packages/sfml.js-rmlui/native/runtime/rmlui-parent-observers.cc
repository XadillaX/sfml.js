// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/runtime/rmlui-parent-observers.h"

#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

auto& Observers() {
  static std::unordered_map<Rml::Element*,
                            std::unordered_set<ElementOwnershipObserver*>>
      values;
  return values;
}

void NotifyElement(Rml::Element* element, bool destroying) {
  State().data_diagnostics.Record(
      &DataDiagnostics::callback_parent_node_visits);
  const auto found = Observers().find(element);
  if (found != Observers().end()) {
    for (auto* observer : found->second) {
      State().data_diagnostics.Record(
          &DataDiagnostics::callback_parent_notifications);
      observer->OnOwnershipChange(destroying);
    }
  }
}

void OwnershipChanged(Rml::Element* element, bool destroyed) {
  if (destroyed) {
    NotifyElementOwnershipDestroyed(element);
  } else {
    NotifyElementSubtreeOwnership(element);
  }
}

}  // namespace

ElementOwnershipObserver::~ElementOwnershipObserver() {
  UnbindElementOwnershipObserver(this);
}

void BindElementOwnershipObserver(Rml::Element* element,
                                  ElementOwnershipObserver* observer) {
  if (observer->indexed_element_ == element) {
    return;
  }
  UnbindElementOwnershipObserver(observer);
  observer->indexed_element_ = element;
  if (element) {
    Observers()[element].insert(observer);
  }
}

void UnbindElementOwnershipObserver(ElementOwnershipObserver* observer) {
  if (!observer->indexed_element_) {
    return;
  }
  const auto found = Observers().find(observer->indexed_element_);
  if (found != Observers().end()) {
    found->second.erase(observer);
    if (found->second.empty()) {
      Observers().erase(found);
    }
  }
  observer->indexed_element_ = nullptr;
}

void NotifyElementSubtreeOwnership(Rml::Element* element) {
  if (!element || Observers().empty()) {
    return;
  }
  std::vector<Rml::Element*> pending{element};
  while (!pending.empty()) {
    auto* current = pending.back();
    pending.pop_back();
    NotifyElement(current, false);
    for (int i = 0; i < current->GetNumChildren(true); ++i) {
      pending.push_back(current->GetChild(i));
    }
  }
}

void NotifyElementOwnershipDestroyed(Rml::Element* element) {
  NotifyElement(element, true);
  const auto found = Observers().find(element);
  if (found != Observers().end()) {
    for (auto* observer : found->second) {
      observer->indexed_element_ = nullptr;
    }
    Observers().erase(found);
  }
}

void InstallElementOwnershipNotifications() {
  Rml::Element::SetOwnershipCallbackForBinding(OwnershipChanged);
}

void RemoveElementOwnershipNotifications() {
  Rml::Element::SetOwnershipCallbackForBinding(nullptr);
}

}  // namespace sfmlrmlui
