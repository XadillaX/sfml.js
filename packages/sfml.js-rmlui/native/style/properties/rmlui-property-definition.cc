// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <type_traits>
#include <utility>

#include "native/animation/rmlui-animation-values.h"
#include "native/animation/rmlui-value-callbacks.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-property.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

NAN_METHOD(CreatePropertyDefinition) {
  Rml::PropertyId id;
  if (!ReadPropertyId(info[0], &id)) {
    return;
  }
  if (!info[1]->IsString() || !info[2]->IsBoolean() || !info[3]->IsBoolean()) {
    return Nan::ThrowTypeError(
        "Expected (property id, default string, inherited, forces layout)");
  }
  Nan::Utf8String text(info[1]);
  auto owned = std::make_unique<Rml::PropertyDefinition>(
      id,
      Rml::String(*text, text.length()),
      info[2]->IsTrue(),
      info[3]->IsTrue());
  auto result = WrapMutablePropertyDefinition(owned.get());
  State().property_definitions.at(owned.get())->owned = std::move(owned);
  info.GetReturnValue().Set(result);
}

Rml::PropertyDefinition* MutableDefinition(v8::Local<v8::Value> handle) {
  auto* state = PropertyDefinitionOf(handle);
  if (!state) {
    return nullptr;
  }
  if (!state->writable) {
    Nan::ThrowTypeError("Registered PropertyDefinition is read-only");
    return nullptr;
  }
  return state->writable;
}

NAN_METHOD(DefinitionAddParser) {
  if (!info[1]->IsString() || !info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected parser name and parameters");
  }
  auto* definition = MutableDefinition(info[0]);
  if (!definition) {
    return;
  }
  Nan::Utf8String name(info[1]);
  Nan::Utf8String parameters(info[2]);
  definition->AddParser(Rml::String(*name, name.length()),
                        Rml::String(*parameters, parameters.length()));
}

NAN_METHOD(DefinitionSetRelativeTarget) {
  int target;
  if (!ReadPropertyInteger(info[1], &target)) {
    return;
  }
  if (target < static_cast<int>(Rml::RelativeTarget::None) ||
      target > static_cast<int>(Rml::RelativeTarget::LineHeight)) {
    return Nan::ThrowRangeError("Expected a RelativeTarget");
  }
  if (auto* definition = MutableDefinition(info[0])) {
    definition->SetRelativeTarget(static_cast<Rml::RelativeTarget>(target));
  }
}

NAN_METHOD(DefinitionParseValue) {
  if (!info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected a property value string");
  }
  auto* definition = PropertyDefinitionOf(info[0]);
  auto* property = PropertyOf(info[1]);
  if (!definition || !property) {
    return;
  }
  Nan::Utf8String text(info[2]);
  const bool previous_callbacks =
      Rml::HasCallbackResourcesForBinding(property->value.value);
  const bool parsed = definition->definition->ParseValue(
      property->value, Rml::String(*text, text.length()));
  if (previous_callbacks ||
      Rml::HasCallbackResourcesForBinding(property->value.value)) {
    Rml::InvalidateCallbackResourcesForBinding();
  }
  RebindVariantTweens(&property->value.value);
  RetainVariantCallbacks(info[1].As<v8::Object>(), property->value.value);
  UpdatePropertyMetadata(property);
  info.GetReturnValue().Set(parsed);
}

NAN_METHOD(DefinitionGetValue) {
  Rml::Property property;
  if (!CopyProperty(info[1], &property) ||
      !CheckVariantStringConversion(property.value)) {
    return;
  }
  auto* definition = PropertyDefinitionOf(info[0]);
  if (!definition) {
    return;
  }
  Rml::String value;
  const bool success = definition->definition->GetValue(value, property);
  auto result = Nan::New<v8::Object>();
  Nan::DefineOwnProperty(
      result, Nan::New("success").ToLocalChecked(), Nan::New(success))
      .FromJust();
  Nan::DefineOwnProperty(result,
                         Nan::New("value").ToLocalChecked(),
                         Nan::New(value).ToLocalChecked())
      .FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(DefinitionDefaultValue) {
  if (auto* state = PropertyDefinitionOf(info[0])) {
    info.GetReturnValue().Set(
        WrapProperty(*state->definition->GetDefaultValue()));
  }
}

template <auto method>
NAN_METHOD(DefinitionField) {
  if (auto* state = PropertyDefinitionOf(info[0])) {
    const auto result = (state->definition->*method)();
    if constexpr (std::is_same_v<decltype(result), const bool>) {
      info.GetReturnValue().Set(result);
    } else {
      info.GetReturnValue().Set(static_cast<int>(result));
    }
  }
}

}  // namespace

PropertyDefinitionState* PropertyDefinitionOf(v8::Local<v8::Value> handle) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* checked = PropertyDefinitionHandle::From(handle);
  if (!checked) {
    return nullptr;
  }
  auto* state = checked->owner().get();
  if (state->generation != State().generation || !state->definition) {
    Nan::ThrowError("PropertyDefinition is no longer valid");
    return nullptr;
  }
  return state;
}

v8::Local<v8::Object> WrapPropertyDefinition(
    const Rml::PropertyDefinition* definition) {
  auto& state = State().property_definitions[definition];
  if (!state) {
    state = std::make_shared<PropertyDefinitionState>();
    state->definition = definition;
    state->generation = State().generation;
  }
  if (!state->handle.IsEmpty()) {
    return state->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = PropertyDefinitionHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  if (Rml::HasCallbackResourcesForBinding(
          definition->GetDefaultValue()->value)) {
    Rml::InvalidateCallbackResourcesForBinding();
  }
  return handle;
}

v8::Local<v8::Object> WrapMutablePropertyDefinition(
    Rml::PropertyDefinition* definition,
    std::shared_ptr<Rml::PropertySpecification> specification) {
  auto result = WrapPropertyDefinition(definition);
  auto& state = State().property_definitions.at(definition);
  state->writable = definition;
  state->specification = std::move(specification);
  return result;
}

NAN_MODULE_INIT(InitializeRmlPropertyDefinition) {
  using Definition = Rml::PropertyDefinition;
  SetRuntimeMethod<CreatePropertyDefinition, true>(target,
                                                   "createPropertyDefinition");
  SetRuntimeMethod<DefinitionAddParser, true>(target, "definitionAddParser");
  SetRuntimeMethod<DefinitionSetRelativeTarget, true>(
      target, "definitionSetRelativeTarget");
  SetRuntimeMethod<DefinitionParseValue, true>(target, "definitionParseValue");
  SetInstancerValueMethod<DefinitionGetValue>(target, "definitionGetValue");
  SetInstancerValueMethod<DefinitionDefaultValue>(target,
                                                  "definitionDefaultValue");
  SetInstancerValueMethod<DefinitionField<&Definition::IsInherited>>(
      target, "definitionIsInherited");
  SetInstancerValueMethod<DefinitionField<&Definition::IsLayoutForced>>(
      target, "definitionIsLayoutForced");
  SetInstancerValueMethod<DefinitionField<&Definition::GetId>>(
      target, "definitionGetId");
  SetInstancerValueMethod<DefinitionField<&Definition::GetRelativeTarget>>(
      target, "definitionGetRelativeTarget");
}

}  // namespace sfmlrmlui
