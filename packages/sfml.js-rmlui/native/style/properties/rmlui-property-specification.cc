// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/properties/rmlui-property-specification.h"

#include <RmlUi/Core/StyleSheetSpecification.h>

#include <algorithm>
#include <unordered_map>
#include <utility>

#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-property-dictionary.h"
#include "native/style/properties/rmlui-property.h"
#include "native/values/rmlui-variant.h"
#include "vendor/rmlui/Source/Core/PropertyShorthandDefinition.h"

namespace sfmlrmlui {
namespace {

using SpecificationHandle = sfmljs::SharedHandle<PropertySpecificationState>;

template <typename Id>
bool ReadId(v8::Local<v8::Value> input, Id* result) {
  if (!input->IsUint32() || Nan::To<uint32_t>(input).FromJust() >=
                                static_cast<unsigned>(Id::MaxNumIds)) {
    Nan::ThrowRangeError("Expected a property or shorthand id in range");
    return false;
  }
  *result = static_cast<Id>(Nan::To<uint32_t>(input).FromJust());
  return true;
}

bool ReadString(v8::Local<v8::Value> input, Rml::String* result) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a string");
    return false;
  }
  Nan::Utf8String text(input);
  result->assign(*text, text.length());
  return true;
}

bool ReadName(v8::Local<v8::Value> input, Rml::String* result) {
  if (!ReadString(input, result)) {
    return false;
  }
  if (result->empty() || *result == "invalid") {
    Nan::ThrowRangeError("Property name is empty or reserved");
    return false;
  }
  return true;
}

PropertySpecificationState* MutableSpecification(v8::Local<v8::Value> handle) {
  auto* state = PropertySpecificationOf(handle);
  if (state && !state->owned) {
    Nan::ThrowTypeError("Borrowed PropertySpecification is read-only");
    return nullptr;
  }
  return state;
}

NAN_METHOD(CreateSpecification) {
  Rml::PropertyId properties;
  Rml::ShorthandId shorthands;
  if (!info[0]->IsUint32() || !info[1]->IsUint32() ||
      Nan::To<uint32_t>(info[0]).FromJust() >=
          static_cast<unsigned>(Rml::PropertyId::MaxNumIds) ||
      Nan::To<uint32_t>(info[1]).FromJust() >=
          static_cast<unsigned>(Rml::ShorthandId::MaxNumIds)) {
    return Nan::ThrowRangeError("Invalid property or shorthand reserve count");
  }
  ReadId(info[0], &properties);
  ReadId(info[1], &shorthands);
  auto owned = std::make_shared<Rml::PropertySpecification>(
      static_cast<size_t>(properties), static_cast<size_t>(shorthands));
  info.GetReturnValue().Set(WrapPropertySpecification(owned.get(), owned));
}

NAN_METHOD(RegisterProperty) {
  Rml::String name;
  Rml::String default_value;
  Rml::PropertyId id;
  if (!ReadName(info[1], &name) || !ReadString(info[2], &default_value) ||
      !ReadId(info[5], &id)) {
    return;
  }
  if (!info[3]->IsBoolean() || !info[4]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected inherited and forces-layout booleans");
  }
  auto* state = MutableSpecification(info[0]);
  if (!state) {
    return;
  }
  if (const auto* existing = state->value->GetProperty(name)) {
    if (id != Rml::PropertyId::Invalid && existing->GetId() != id) {
      return Nan::ThrowRangeError("Property name already has a different id");
    }
    info.GetReturnValue().Set(WrapPropertyDefinition(existing));
    return;
  }
  if (id == Rml::PropertyId::Invalid) {
    if (state->next_property_id >=
        static_cast<unsigned>(Rml::PropertyId::MaxNumIds)) {
      return Nan::ThrowRangeError("Maximum property capacity reached");
    }
    id = static_cast<Rml::PropertyId>(state->next_property_id);
  }
  if (state->value->GetProperty(id)) {
    return Nan::ThrowRangeError("Property id already registered");
  }
  // Explicit insertion also supports sparse ids without triggering the
  // upstream GetOrCreateId assertion about contiguous predefined ids.
  auto& definition = state->owned->RegisterProperty(
      name, default_value, info[3]->IsTrue(), info[4]->IsTrue(), id);
  state->next_property_id =
      std::max(state->next_property_id, static_cast<unsigned>(id) + 1);
  info.GetReturnValue().Set(
      WrapMutablePropertyDefinition(&definition, state->owned));
}

NAN_METHOD(GetProperty) {
  auto* state = PropertySpecificationOf(info[0]);
  if (!state) {
    return;
  }
  const Rml::PropertyDefinition* result = nullptr;
  if (info[1]->IsString()) {
    Rml::String name;
    if (!ReadString(info[1], &name)) {
      return;
    }
    result = state->value->GetProperty(name);
  } else {
    Rml::PropertyId id;
    if (!ReadId(info[1], &id)) {
      return;
    }
    result = state->value->GetProperty(id);
  }
  if (result) {
    info.GetReturnValue().Set(WrapPropertyDefinition(result));
  } else {
    info.GetReturnValue().SetNull();
  }
}

template <auto method>
NAN_METHOD(GetRegisteredProperties) {
  if (auto* state = PropertySpecificationOf(info[0])) {
    info.GetReturnValue().Set(WrapPropertyIdSet((state->value->*method)()));
  }
}

bool ValidateShorthand(const Rml::PropertySpecification& specification,
                       const Rml::String& names,
                       Rml::ShorthandType type) {
  Rml::StringList list;
  Rml::StringUtilities::ExpandString(list,
                                     Rml::StringUtilities::ToLower(names));
  if (type == Rml::ShorthandType::Box && list.size() != 4) {
    Nan::ThrowRangeError("Box shorthand requires four properties");
    return false;
  }
  if (type == Rml::ShorthandType::Flex && list.size() != 3) {
    Nan::ThrowRangeError("Flex shorthand requires three properties");
    return false;
  }
  if (list.empty()) {
    return false;
  }
  const bool recursive = type == Rml::ShorthandType::RecursiveRepeat ||
                         type == Rml::ShorthandType::RecursiveCommaSeparated;
  for (auto name : list) {
    if (!name.empty() && (name.back() == '?' || name.back() == '#')) {
      name.pop_back();
    }
    if (!specification.GetProperty(name) &&
        !(recursive && specification.GetShorthand(name))) {
      return false;
    }
  }
  return true;
}

NAN_METHOD(RegisterShorthand) {
  Rml::String name;
  Rml::String properties;
  Rml::ShorthandId id;
  if (!ReadName(info[1], &name) || !ReadString(info[2], &properties) ||
      !ReadId(info[4], &id)) {
    return;
  }
  if (!info[3]->IsUint32() ||
      Nan::To<uint32_t>(info[3]).FromJust() >
          static_cast<unsigned>(Rml::ShorthandType::Flex)) {
    return Nan::ThrowRangeError("Expected a ShorthandType");
  }
  const auto type =
      static_cast<Rml::ShorthandType>(Nan::To<uint32_t>(info[3]).FromJust());
  auto* state = MutableSpecification(info[0]);
  if (!state) {
    return;
  }
  if (const auto* existing = state->value->GetShorthand(name)) {
    if (id != Rml::ShorthandId::Invalid && existing->id != id) {
      return Nan::ThrowRangeError("Shorthand name already has a different id");
    }
    info.GetReturnValue().Set(0);
    return;
  }
  if (id == Rml::ShorthandId::Invalid) {
    if (state->next_shorthand_id >=
        static_cast<unsigned>(Rml::ShorthandId::MaxNumIds)) {
      return Nan::ThrowRangeError("Maximum shorthand capacity reached");
    }
    id = static_cast<Rml::ShorthandId>(state->next_shorthand_id);
  }
  if (state->value->GetShorthand(id)) {
    return Nan::ThrowRangeError("Shorthand id already registered");
  }
  // Validate before modifying upstream id maps. Invalid references cannot
  // reserve dangling names, and Box/Flex cannot index beyond their items.
  if (!ValidateShorthand(*state->value, properties, type)) {
    info.GetReturnValue().Set(0);
    return;
  }
  const auto result =
      state->owned->RegisterShorthand(name, properties, type, id);
  state->next_shorthand_id =
      std::max(state->next_shorthand_id, static_cast<unsigned>(id) + 1);
  info.GetReturnValue().Set(static_cast<unsigned>(result));
}

NAN_METHOD(GetShorthand) {
  auto* state = PropertySpecificationOf(info[0]);
  if (!state) {
    return;
  }
  const Rml::ShorthandDefinition* result = nullptr;
  if (info[1]->IsString()) {
    Rml::String name;
    if (!ReadString(info[1], &name)) {
      return;
    }
    result = state->value->GetShorthand(name);
  } else {
    Rml::ShorthandId id;
    if (!ReadId(info[1], &id)) {
      return;
    }
    result = state->value->GetShorthand(id);
  }
  info.GetReturnValue().Set(WrapShorthandDefinition(result));
}

template <bool shorthand>
NAN_METHOD(ParseDeclaration) {
  Rml::String text;
  if (!ReadString(info[3], &text)) {
    return;
  }
  auto* state = PropertySpecificationOf(info[0]);
  auto* dictionary = PropertyDictionaryOf(info[1]);
  if (!state || !dictionary) {
    return;
  }
  bool result = false;
  if constexpr (shorthand) {
    Rml::ShorthandId id;
    if (!ReadId(info[2], &id)) {
      return;
    }
    result =
        state->value->ParseShorthandDeclaration(dictionary->value, id, text);
  } else if (info[2]->IsString()) {
    Rml::String name;
    if (!ReadString(info[2], &name)) {
      return;
    }
    result =
        state->value->ParsePropertyDeclaration(dictionary->value, name, text);
  } else {
    Rml::PropertyId id;
    if (!ReadId(info[2], &id)) {
      return;
    }
    result =
        state->value->ParsePropertyDeclaration(dictionary->value, id, text);
  }
  RefreshPropertyDictionary(info[1].As<v8::Object>(), dictionary);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SetDefaults) {
  auto* state = PropertySpecificationOf(info[0]);
  auto* dictionary = PropertyDictionaryOf(info[1]);
  if (!state || !dictionary) {
    return;
  }
  state->value->SetPropertyDefaults(dictionary->value);
  RefreshPropertyDictionary(info[1].As<v8::Object>(), dictionary);
}

NAN_METHOD(PropertiesToString) {
  Rml::String delimiter;
  if (!ReadString(info[3], &delimiter)) {
    return;
  }
  if (delimiter.size() != 1) {
    return Nan::ThrowRangeError("Delimiter must contain one UTF-8 byte");
  }
  if (!info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected an include-name boolean");
  }
  auto* state = PropertySpecificationOf(info[0]);
  auto* dictionary = PropertyDictionaryOf(info[1]);
  if (!state || !dictionary) {
    return;
  }
  for (const auto& [id, property] : dictionary->value.GetProperties()) {
    if (!CheckVariantStringConversion(property.value)) {
      return;
    }
  }
  info.GetReturnValue().Set(
      Nan::New(state->value->PropertiesToString(
                   dictionary->value, info[2]->IsTrue(), delimiter[0]))
          .ToLocalChecked());
}

NAN_METHOD(GetGlobalSpecification) {
  info.GetReturnValue().Set(WrapPropertySpecification(
      &Rml::StyleSheetSpecification::GetPropertySpecification()));
}

NAN_METHOD(RegisterGlobalProperty) {
  Rml::String name;
  Rml::String default_value;
  if (!ReadName(info[0], &name) || !ReadString(info[1], &default_value)) {
    return;
  }
  if (!info[2]->IsBoolean() || !info[3]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected inherited and forces-layout booleans");
  }
  using Style = Rml::StyleSheetSpecification;
  if (const auto* existing = Style::GetProperty(name)) {
    if (existing->GetId() < Rml::PropertyId::FirstCustomId) {
      return Nan::ThrowRangeError("Built-in property names are reserved");
    }
    info.GetReturnValue().Set(WrapPropertyDefinition(existing));
    return;
  }
  if (Style::GetShorthand(name)) {
    return Nan::ThrowRangeError("Property name matches a shorthand");
  }
  // Global ids are contiguous. Guard upstream's fixed-size PropertyIdSet
  // before GetOrCreateId can insert a value at or beyond MaxNumIds.
  if (Style::GetRegisteredProperties().Size() + 1 >=
      static_cast<unsigned>(Rml::PropertyId::MaxNumIds)) {
    return Nan::ThrowRangeError("Maximum property capacity reached");
  }
  auto& definition = Style::RegisterProperty(
      name, default_value, info[2]->IsTrue(), info[3]->IsTrue());
  info.GetReturnValue().Set(WrapMutablePropertyDefinition(&definition));
}

NAN_METHOD(RegisterGlobalShorthand) {
  Rml::String name;
  Rml::String properties;
  if (!ReadName(info[0], &name) || !ReadString(info[1], &properties)) {
    return;
  }
  if (!info[2]->IsUint32() ||
      Nan::To<uint32_t>(info[2]).FromJust() >
          static_cast<unsigned>(Rml::ShorthandType::Flex)) {
    return Nan::ThrowRangeError("Expected a ShorthandType");
  }
  using Style = Rml::StyleSheetSpecification;
  if (Style::GetProperty(name)) {
    return Nan::ThrowRangeError("Shorthand name matches a property");
  }
  if (Style::GetShorthand(name)) {
    info.GetReturnValue().Set(0);
    return;
  }
  unsigned next = static_cast<unsigned>(Rml::ShorthandId::FirstCustomId);
  while (next < static_cast<unsigned>(Rml::ShorthandId::MaxNumIds) &&
         Style::GetShorthand(static_cast<Rml::ShorthandId>(next))) {
    ++next;
  }
  if (next >= static_cast<unsigned>(Rml::ShorthandId::MaxNumIds)) {
    return Nan::ThrowRangeError("Maximum shorthand capacity reached");
  }
  const auto type =
      static_cast<Rml::ShorthandType>(Nan::To<uint32_t>(info[2]).FromJust());
  if (!ValidateShorthand(Style::GetPropertySpecification(), properties, type)) {
    info.GetReturnValue().Set(0);
    return;
  }
  info.GetReturnValue().Set(
      static_cast<unsigned>(Style::RegisterShorthand(name, properties, type)));
}

template <auto method>
NAN_METHOD(GetGlobalId) {
  Rml::String name;
  if (ReadString(info[0], &name)) {
    info.GetReturnValue().Set(static_cast<unsigned>(method(name)));
  }
}

template <typename Id, auto method>
NAN_METHOD(GetGlobalName) {
  Id id;
  if (ReadId(info[0], &id)) {
    info.GetReturnValue().Set(Nan::New(method(id)).ToLocalChecked());
  }
}

NAN_METHOD(GetUnderlyingProperties) {
  Rml::ShorthandId id;
  if (ReadId(info[0], &id)) {
    info.GetReturnValue().Set(WrapPropertyIdSet(
        Rml::StyleSheetSpecification::GetShorthandUnderlyingProperties(id)));
  }
}

using ShorthandSnapshots =
    std::unordered_map<const Rml::ShorthandDefinition*, v8::Local<v8::Object>>;

void SetField(v8::Local<v8::Object> result,
              const char* name,
              v8::Local<v8::Value> value) {
  Nan::DefineOwnProperty(result, Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

v8::Local<v8::Object> SnapshotShorthand(
    const Rml::ShorthandDefinition* definition, ShorthandSnapshots* snapshots) {
  if (auto it = snapshots->find(definition); it != snapshots->end()) {
    return it->second;
  }
  auto result = Nan::New<v8::Object>();
  snapshots->emplace(definition, result);
  SetField(result, "id", Nan::New(static_cast<unsigned>(definition->id)));
  SetField(result, "type", Nan::New(static_cast<unsigned>(definition->type)));
  SetField(result, "inherited", Nan::New(definition->inherited));
  auto items = Nan::New<v8::Array>(definition->items.size());
  for (size_t i = 0; i < definition->items.size(); ++i) {
    const auto& item = definition->items[i];
    auto entry = Nan::New<v8::Object>();
    SetField(entry, "optional", Nan::New(item.optional));
    SetField(entry, "repeats", Nan::New(item.repeats));
    if (item.type == Rml::ShorthandItemType::Property) {
      SetField(entry, "type", Nan::New("property").ToLocalChecked());
      SetField(entry,
               "propertyId",
               Nan::New(static_cast<unsigned>(item.property_id)));
      SetField(entry,
               "definition",
               WrapPropertyDefinition(item.property_definition));
    } else {
      SetField(entry, "type", Nan::New("shorthand").ToLocalChecked());
      SetField(entry,
               "shorthandId",
               Nan::New(static_cast<unsigned>(item.shorthand_id)));
      SetField(entry,
               "definition",
               SnapshotShorthand(item.shorthand_definition, snapshots));
    }
    items->CreateDataProperty(Nan::GetCurrentContext(), i, entry).FromJust();
  }
  SetField(result, "items", items);
  return result;
}

}  // namespace

PropertySpecificationState* PropertySpecificationOf(
    v8::Local<v8::Value> handle) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* checked = SpecificationHandle::From(handle);
  if (!checked) {
    return nullptr;
  }
  auto* state = checked->owner().get();
  if (!state->value || state->generation != State().generation) {
    Nan::ThrowError("PropertySpecification is no longer valid");
    return nullptr;
  }
  return state;
}

v8::Local<v8::Object> WrapPropertySpecification(
    const Rml::PropertySpecification* value,
    std::shared_ptr<Rml::PropertySpecification> owned,
    std::shared_ptr<void> lifetime) {
  auto state = std::make_shared<PropertySpecificationState>();
  state->value = value;
  state->owned = std::move(owned);
  state->lifetime = lifetime;
  // Definitions are independently retainable through values and shorthands.
  // Retain their instancer even if the specification wrapper is collected.
  if (lifetime) {
    for (auto id : value->GetRegisteredProperties()) {
      const auto* definition = value->GetProperty(id);
      WrapPropertyDefinition(definition);
      State().property_definitions.at(definition)->lifetime = lifetime;
      State().property_definitions.at(definition)->callback_specification =
          value;
    }
  }
  state->generation = State().generation;
  auto& specifications = State().property_specifications;
  if (specifications.size() >= State().specification_sweep_threshold) {
    std::erase_if(specifications,
                  [](const auto& weak) { return weak.expired(); });
    State().specification_sweep_threshold =
        std::max(size_t{64}, specifications.size() * 2);
  }
  specifications.emplace_back(state);
  auto handle = SpecificationHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  for (auto id : value->GetRegisteredProperties()) {
    if (Rml::HasCallbackResourcesForBinding(
            value->GetProperty(id)->GetDefaultValue()->value)) {
      Rml::InvalidateCallbackResourcesForBinding();
      break;
    }
  }
  return handle;
}

bool ValidatePropertyShorthand(const Rml::PropertySpecification& specification,
                               const Rml::String& names,
                               Rml::ShorthandType type) {
  return ValidateShorthand(specification, names, type);
}

v8::Local<v8::Array> WrapPropertyIdSet(const Rml::PropertyIdSet& ids) {
  auto result = Nan::New<v8::Array>();
  uint32_t index = 0;
  for (auto id : ids) {
    result
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             index++,
                             Nan::New(static_cast<unsigned>(id)))
        .FromJust();
  }
  return result;
}

v8::Local<v8::Value> WrapShorthandDefinition(
    const Rml::ShorthandDefinition* definition) {
  if (!definition) {
    return Nan::Null();
  }
  ShorthandSnapshots snapshots;
  return SnapshotShorthand(definition, &snapshots);
}

void ReleasePropertySpecifications() {
  for (auto& weak : State().property_specifications) {
    if (auto state = weak.lock()) {
      state->value = nullptr;
      state->owned.reset();
      state->lifetime.reset();
      state->handle.Reset();
      state->generation = 0;
    }
  }
  State().property_specifications.clear();
  State().specification_sweep_threshold = 64;
}

NAN_MODULE_INIT(InitializeRmlPropertySpecification) {
  using Specification = Rml::PropertySpecification;
  using Style = Rml::StyleSheetSpecification;
  SetRuntimeMethod<GetGlobalSpecification, true>(
      target, "styleGetPropertySpecification");
  SetRuntimeMethod<RegisterGlobalProperty, true>(target,
                                                 "styleRegisterProperty");
  SetRuntimeMethod<RegisterGlobalShorthand, true>(target,
                                                  "styleRegisterShorthand");
  SetRuntimeMethod<GetGlobalId<&Style::GetPropertyId>, true>(
      target, "styleGetPropertyId");
  SetRuntimeMethod<GetGlobalId<&Style::GetShorthandId>, true>(
      target, "styleGetShorthandId");
  SetRuntimeMethod<GetGlobalName<Rml::PropertyId, &Style::GetPropertyName>,
                   true>(target, "styleGetPropertyName");
  SetRuntimeMethod<GetGlobalName<Rml::ShorthandId, &Style::GetShorthandName>,
                   true>(target, "styleGetShorthandName");
  SetRuntimeMethod<GetUnderlyingProperties, true>(
      target, "styleGetShorthandUnderlyingProperties");
  SetRuntimeMethod<CreateSpecification, true>(target,
                                              "createPropertySpecification");
  SetRuntimeMethod<RegisterProperty, true>(target,
                                           "specificationRegisterProperty");
  SetRuntimeMethod<GetProperty, true>(target, "specificationGetProperty");
  SetRuntimeMethod<
      GetRegisteredProperties<&Specification::GetRegisteredProperties>,
      true>(target, "specificationGetRegisteredProperties");
  SetRuntimeMethod<
      GetRegisteredProperties<&Specification::GetRegisteredInheritedProperties>,
      true>(target, "specificationGetRegisteredInheritedProperties");
  SetRuntimeMethod<GetRegisteredProperties<
                       &Specification::GetRegisteredPropertiesForcingLayout>,
                   true>(target,
                         "specificationGetRegisteredPropertiesForcingLayout");
  SetRuntimeMethod<RegisterShorthand, true>(target,
                                            "specificationRegisterShorthand");
  SetRuntimeMethod<GetShorthand, true>(target, "specificationGetShorthand");
  SetRuntimeMethod<ParseDeclaration<false>, true>(
      target, "specificationParsePropertyDeclaration");
  SetRuntimeMethod<ParseDeclaration<true>, true>(
      target, "specificationParseShorthandDeclaration");
  SetInstancerValueMethod<SetDefaults>(target, "specificationSetDefaults");
  SetRuntimeMethod<PropertiesToString, true>(target,
                                             "specificationPropertiesToString");
}

}  // namespace sfmlrmlui
