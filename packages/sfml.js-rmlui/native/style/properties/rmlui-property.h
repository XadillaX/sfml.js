// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_H_

#include <RmlUi/Core/Property.h>
#include <RmlUi/Core/PropertyDefinition.h>
#include <RmlUi/Core/PropertySpecification.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <cstdint>
#include <memory>

namespace sfmlrmlui {

// Backing-store deleters may run away from the runtime thread. Views must
// retain only these plain fields, never Variant resources or definitions.
struct PropertyMetadata {
  Rml::Unit unit{Rml::Unit::UNKNOWN};
  int specificity{-1};
  int parser_index{-1};
};

struct PropertyState {
  Rml::Property value;
  v8::Global<v8::Object> handle;
  std::shared_ptr<PropertyMetadata> metadata;
  uint64_t generation{0};
};

struct PropertyDefinitionState {
  const Rml::PropertyDefinition* definition{nullptr};
  v8::Global<v8::Object> handle;
  std::unique_ptr<Rml::PropertyDefinition> owned;
  Rml::PropertyDefinition* writable{nullptr};
  std::shared_ptr<Rml::PropertySpecification> specification;
  // Instancer-owned definitions can outlive their originating JS wrapper.
  std::shared_ptr<void> lifetime;
  const Rml::PropertySpecification* callback_specification{nullptr};
  uint64_t generation{0};
};

using PropertyHandle = sfmljs::SharedHandle<PropertyState>;
using PropertyDefinitionHandle = sfmljs::SharedHandle<PropertyDefinitionState>;

// All operations require an owning RuntimeScope. Never retain upstream
// property pointers across another RmlUi call; copy at the call site.
PropertyState* PropertyOf(v8::Local<v8::Value> handle);
bool CopyProperty(v8::Local<v8::Value> handle, Rml::Property* result);
bool ReadPropertySource(v8::Local<v8::Value> input,
                        Rml::SharedPtr<const Rml::PropertySource>* result);
bool ValidatePropertyStorage(const Rml::Property& property);
void UpdatePropertyMetadata(PropertyState* state);
v8::Local<v8::Object> WrapProperty(Rml::Property value);
PropertyDefinitionState* PropertyDefinitionOf(v8::Local<v8::Value> handle);
v8::Local<v8::Object> WrapPropertyDefinition(
    const Rml::PropertyDefinition* definition);
v8::Local<v8::Object> WrapMutablePropertyDefinition(
    Rml::PropertyDefinition* definition,
    std::shared_ptr<Rml::PropertySpecification> specification = {});
void ReleasePropertyStates();
bool ReadPropertyId(v8::Local<v8::Value> value, Rml::PropertyId* result);
bool ReadPropertyInteger(v8::Local<v8::Value> value, int* result);
}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_STYLE_PROPERTIES_RMLUI_PROPERTY_H_
