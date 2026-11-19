// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_PARSER_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_PARSER_H_

namespace sfmlrmlui {

// Registered parsers are borrowed by upstream definitions through shutdown.
// Reset callback roots and invalidate every surviving token afterwards.
void ReleasePropertyParsers();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_PARSER_H_
