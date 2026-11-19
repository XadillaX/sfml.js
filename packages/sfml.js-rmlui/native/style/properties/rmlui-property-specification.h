// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_SPECIFICATION_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_SPECIFICATION_H_

#include <RmlUi/Core/PropertySpecification.h>
#include <nan.h>

#include <cstdint>
#include <memory>

namespace sfmlrmlui {

struct PropertySpecificationState {
  const Rml::PropertySpecification* value{nullptr};
  v8::Global<v8::Object> handle;
  std::shared_ptr<Rml::PropertySpecification> owned;
  std::shared_ptr<void> lifetime;
  uint64_t generation{0};
  unsigned next_property_id{1};
  unsigned next_shorthand_id{1};
};

// Registered definitions keep their owning specification alive. The registry
// itself is weak; a specification without definitions can be collected early.
PropertySpecificationState* PropertySpecificationOf(
    v8::Local<v8::Value> handle);
v8::Local<v8::Object> WrapPropertySpecification(
    const Rml::PropertySpecification* value,
    std::shared_ptr<Rml::PropertySpecification> owned = {},
    std::shared_ptr<void> lifetime = {});
bool ValidatePropertyShorthand(const Rml::PropertySpecification& specification,
                               const Rml::String& names,
                               Rml::ShorthandType type);
v8::Local<v8::Array> WrapPropertyIdSet(const Rml::PropertyIdSet& ids);
v8::Local<v8::Value> WrapShorthandDefinition(
    const Rml::ShorthandDefinition* definition);
void ReleasePropertySpecifications();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_SPECIFICATION_H_
