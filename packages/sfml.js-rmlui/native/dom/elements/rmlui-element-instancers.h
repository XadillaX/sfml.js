// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_INSTANCERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_INSTANCERS_H_

namespace sfmlrmlui {

// Weak observers track native allocator provenance without retaining elements.
// Detached roots use visible V8 edges; native trees root their instancers.
void RefreshElementInstancerOwnership();
// V8 finalizers cannot invoke JS. Deliver copied notices at safe entry.
void DrainElementInstancerReleases();
// Owned pooled allocators must die after their nodes but before Rml::Shutdown
// destroys the global native pools used by their destructor leak checks.
void ReleaseTypedElementInstancers();
// Call only after all elements and the upstream Factory have been destroyed.
void ReleaseElementInstancers();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_INSTANCERS_H_
