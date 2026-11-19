// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_PARENT_OBSERVERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_PARENT_OBSERVERS_H_

#include <RmlUi/Core/Element.h>

namespace sfmlrmlui {

// Native ownership notices enqueue affected leases and may promote existing
// weak handles. They must not allocate V8 objects, invoke JS, destroy elements,
// or change observer registrations.
class ElementOwnershipObserver {
 public:
  virtual ~ElementOwnershipObserver();
  virtual void OnOwnershipChange(bool destroying) = 0;

 private:
  friend void BindElementOwnershipObserver(Rml::Element*,
                                           ElementOwnershipObserver*);
  friend void UnbindElementOwnershipObserver(ElementOwnershipObserver*);
  friend void NotifyElementOwnershipDestroyed(Rml::Element*);
  Rml::Element* indexed_element_{nullptr};
};

void BindElementOwnershipObserver(Rml::Element* element,
                                  ElementOwnershipObserver* observer);
void UnbindElementOwnershipObserver(ElementOwnershipObserver* observer);
void NotifyElementSubtreeOwnership(Rml::Element* element);
void NotifyElementOwnershipDestroyed(Rml::Element* element);
void InstallElementOwnershipNotifications();
void RemoveElementOwnershipNotifications();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_PARENT_OBSERVERS_H_
