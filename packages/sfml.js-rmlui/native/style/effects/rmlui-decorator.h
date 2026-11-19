// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_DECORATOR_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_DECORATOR_H_

#include <RmlUi/Core/Decorator.h>
#include <nan.h>

#include <memory>

namespace sfmlrmlui {

struct DecoratorInterfaceState;

// A stylesheet and property source are borrowed only for this invocation.
// Escaped JS wrappers retain the invalidated token, never the native reference.
class DecoratorInterfaceScope final {
 public:
  explicit DecoratorInterfaceScope(
      const Rml::DecoratorInstancerInterface& value);
  ~DecoratorInterfaceScope();
  v8::Local<v8::Object> Wrap() const;

 private:
  std::shared_ptr<DecoratorInterfaceState> state_;
};

const Rml::DecoratorInstancerInterface* DecoratorInterfaceOf(
    v8::Local<v8::Value> input);
v8::Local<v8::Object> WrapDecorator(Rml::SharedPtr<const Rml::Decorator> value,
                                    Rml::RenderManager* manager);
bool CopyDecorator(v8::Local<v8::Value> input,
                   Rml::RenderManager* manager,
                   Rml::SharedPtr<Rml::Decorator>* result);
void ReleaseDecoratorBindings(bool unused_only);
// Invoke manual cleanup before the manager and its geometry become invalid.
void ReleaseDecoratorManagerData(Rml::RenderManager* manager);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_EFFECTS_RMLUI_DECORATOR_H_
