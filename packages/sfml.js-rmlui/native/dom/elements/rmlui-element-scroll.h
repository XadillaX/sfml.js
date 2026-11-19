// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_SCROLL_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_SCROLL_H_

namespace sfmlrmlui {

// GC retires independently owned widgets until the outer native stack unwinds.
void DrainElementScrollReleases();
// Clear widgets and element leases before the native observer pool shuts down.
void ReleaseElementScrollBindings();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_SCROLL_H_
