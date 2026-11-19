// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_ANIMATION_RMLUI_TWEEN_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_ANIMATION_RMLUI_TWEEN_H_

#include <RmlUi/Core/Tween.h>
#include <nan.h>

namespace Rml {
class Element;
}

namespace sfmlrmlui {

// Copy before native evaluation, since JS may reverse the original wrapper.
bool CopyTween(v8::Local<v8::Value> handle, Rml::Tween* result);
bool CheckTween(const Rml::Tween& tween);
v8::Local<v8::Object> WrapTween(Rml::Tween value);
// A standalone value must not keep a native element's rooting lease alive.
void DetachTween(Rml::Tween* tween);
void AttachTween(Rml::Tween* tween, Rml::Element* element);
// Parser outputs can be owned by native defaults or stylesheets, without a
// specific element. Their copied lease roots the callback until released.
void RetainNativeTween(Rml::Tween* tween);
void RefreshTweenOwnership();
void ReleaseTweenCallbacks();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_ANIMATION_RMLUI_TWEEN_H_
