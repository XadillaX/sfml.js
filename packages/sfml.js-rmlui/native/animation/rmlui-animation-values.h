// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_ANIMATION_RMLUI_ANIMATION_VALUES_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_ANIMATION_RMLUI_ANIMATION_VALUES_H_

#include <RmlUi/Core/Animation.h>
#include <RmlUi/Core/Variant.h>
#include <nan.h>

namespace Rml {
class Element;
}

namespace sfmlrmlui {

bool TransitionsFromJs(v8::Local<v8::Object> input, Rml::TransitionList* value);
bool AnimationsFromJs(v8::Local<v8::Object> input, Rml::AnimationList* value);
v8::Local<v8::Object> TransitionsToJs(const Rml::TransitionList& value);
v8::Local<v8::Object> AnimationsToJs(const Rml::AnimationList& value);
// Rebind only the copied lists. A null element creates standalone leases.
void RebindVariantTweens(Rml::Variant* value, Rml::Element* element = nullptr);
// Keep parser-created closures alive while native defaults/styles own them.
// Converting to standalone JS values/dictionaries removes this native lease.
void RetainNativeVariantTweens(Rml::Variant* value);
// JS-visible edges keep standalone property cycles collectable.
void RetainVariantTweens(v8::Local<v8::Object> owner,
                         const Rml::Variant& value);
void RebindClonedElementTweens(Rml::Element* element);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_ANIMATION_RMLUI_ANIMATION_VALUES_H_
