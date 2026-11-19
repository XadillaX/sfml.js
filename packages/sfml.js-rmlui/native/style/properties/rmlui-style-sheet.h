// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_STYLE_SHEET_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_STYLE_SHEET_H_

#include <RmlUi/Core/StyleSheet.h>
#include <RmlUi/Core/StyleSheetContainer.h>
#include <nan.h>

#include <functional>
#include <memory>

namespace sfmlrmlui {

struct StyleSheetState;

v8::Local<v8::Object> WrapStyleSheetContainer(
    Rml::SharedPtr<Rml::StyleSheetContainer> value);
std::shared_ptr<StyleSheetState> ShareStyleSheet(v8::Local<v8::Value> input);
// A compiled view retains its container but expires when it is recompiled.
const Rml::StyleSheet* StyleSheetValue(const StyleSheetState& state);
void ReleaseStyleSheetBindings();
// Empty handles denote native roots. Nonempty handles receive private GC edges.
void VisitStyleSheetDecoratorOwners(
    const std::function<void(v8::Local<v8::Object>,
                             const Rml::DecoratorPtrList&)>& visitor);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_STYLE_SHEET_H_
