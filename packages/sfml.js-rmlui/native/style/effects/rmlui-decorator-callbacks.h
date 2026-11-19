// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_DECORATOR_CALLBACKS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_DECORATOR_CALLBACKS_H_

#include <RmlUi/Core/Decorator.h>
#include <nan.h>

namespace sfmlrmlui {

Rml::SharedPtr<Rml::Decorator> CreateDecoratorCallbacks(
    v8::Local<v8::Array> functions);
void BindDecoratorCallbacks(v8::Local<v8::Object> handle,
                            const Rml::Decorator* value);
void RetainDecoratorCallbacks(const Rml::Decorator* value);
void BindDecoratorData(v8::Local<v8::Object> handle,
                       const Rml::Decorator* owner,
                       Rml::DecoratorDataHandle data);
bool DecoratorTextureOperation(const Rml::Decorator* value,
                               int operation,
                               int index,
                               Rml::Texture* texture,
                               int* result,
                               v8::Local<v8::Value>* texture_handle);
void RefreshDecoratorOwnership();
void DrainDecoratorReleases();
void ReleaseDecoratorCallbacks();
void ReleaseDecoratorElementEdges();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_DECORATOR_CALLBACKS_H_
