// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/properties/rmlui-property.h"

#include <RmlUi/Core/DecorationTypes.h>

#include <algorithm>
#include <cmath>
#include <limits>
#include <utility>

#include "native/animation/rmlui-animation-values.h"
#include "native/animation/rmlui-value-callbacks.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-numeric-value.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

void Own(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

bool CheckValue(const Rml::Property& value) {
  Rml::Unit unit;
  if (!ReadUnit(Nan::New(static_cast<int>(value.unit)), &unit)) {
    return false;
  }
  if (value.value.GetType() == Rml::Variant::DOUBLE ||
      value.value.GetType() == Rml::Variant::FLOAT) {
    const double number = value.value.Get<double>();
    if (!std::isfinite(number) ||
        (Rml::Any(unit & Rml::Unit::NUMERIC) &&
         std::abs(number) > std::numeric_limits<float>::max())) {
      Nan::ThrowRangeError("Property requires a finite float-range number");
      return false;
    }
    if (unit == Rml::Unit::KEYWORD &&
        (std::trunc(number) != number ||
         number < std::numeric_limits<int>::min() ||
         number > std::numeric_limits<int>::max())) {
      Nan::ThrowRangeError("Property keyword requires a native integer");
      return false;
    }
  }
  if (unit == Rml::Unit::KEYWORD) {
    // GetValue converts keywords to int. Guard string/BigInt conversions too,
    // before scanf or a native narrowing conversion can exceed that range.
    const double number = value.value.Get<double>();
    if (!std::isfinite(number) || number < std::numeric_limits<int>::min() ||
        number > std::numeric_limits<int>::max()) {
      Nan::ThrowRangeError("Property keyword requires a native integer");
      return false;
    }
  }
  return true;
}

bool ReadOwnedValue(v8::Local<v8::Value> value, Rml::Variant* result) {
  return VariantFromJs(value, result);
}

NAN_METHOD(CreateProperty) {
  Rml::Property value;
  if (!info[0]->IsUndefined() && !ReadOwnedValue(info[0], &value.value)) {
    return;
  }
  if (info[1]->IsUndefined() && info[0]->IsNumber()) {
    if (!info[0]->IsInt32()) {
      return Nan::ThrowRangeError("Property keyword requires an integer");
    }
    value.value = Nan::To<int>(info[0]).FromJust();
    value.unit = Rml::Unit::KEYWORD;
  } else if (!info[1]->IsUndefined() && !ReadUnit(info[1], &value.unit)) {
    return;
  }
  if ((!info[2]->IsUndefined() &&
       !ReadPropertyInteger(info[2], &value.specificity)) ||
      !RuntimeReady() || !CheckValue(value)) {
    return;
  }
  info.GetReturnValue().Set(WrapProperty(std::move(value)));
}

NAN_METHOD(CloneProperty) {
  Rml::Property value;
  if (CopyProperty(info[0], &value)) {
    info.GetReturnValue().Set(WrapProperty(std::move(value)));
  }
}

template <bool negate>
NAN_METHOD(PropertyCompare) {
  Rml::Property value;
  Rml::Property other;
  if (CopyProperty(info[0], &value) && CopyProperty(info[1], &other)) {
    info.GetReturnValue().Set(negate ? value != other : value == other);
  }
}

NAN_METHOD(PropertyToString) {
  Rml::Property value;
  if (CopyProperty(info[0], &value) &&
      CheckVariantStringConversion(value.value)) {
    info.GetReturnValue().Set(Nan::New(value.ToString()).ToLocalChecked());
  }
}

NAN_METHOD(PropertyGetElementValue) {
  Rml::Property value;
  if (CopyProperty(info[0], &value)) {
    v8::Local<v8::Value> element;
    if (ElementVariantToJs(value.value).ToLocal(&element)) {
      info.GetReturnValue().Set(element);
    }
  }
}

NAN_METHOD(PropertyGetNumericValue) {
  Rml::Property value;
  if (!CopyProperty(info[0], &value)) {
    return;
  }
  const auto numeric = value.GetNumericValue();
  if (!std::isfinite(numeric.number)) {
    return Nan::ThrowRangeError("Property numeric conversion overflow");
  }
  info.GetReturnValue().Set(WrapNumericValue(numeric));
}

NAN_METHOD(PropertyGet) {
  // Convert user accessors before resolving the generation-checked receiver.
  VariantSelector selector;
  if (!VariantSelectorFromJs(info[1], &selector)) {
    return;
  }
  Rml::Property value;
  v8::Local<v8::Value> js_result;
  if (CopyProperty(info[0], &value) &&
      ConvertVariantToJs(&value.value, selector, true).ToLocal(&js_result)) {
    info.GetReturnValue().Set(js_result);
  }
}

NAN_METHOD(PropertyGetValue) {
  Rml::Property value;
  v8::Local<v8::Value> result;
  if (CopyProperty(info[0], &value) &&
      VariantToJs(value.value).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(PropertySetValue) {
  Rml::Variant value;
  if (!ReadOwnedValue(info[1], &value)) {
    return;
  }
  auto* state = PropertyOf(info[0]);
  if (!state) {
    return;
  }
  auto copy = state->value;
  copy.value = std::move(value);
  if (CheckValue(copy)) {
    if (Rml::HasCallbackResourcesForBinding(state->value.value) ||
        Rml::HasCallbackResourcesForBinding(copy.value)) {
      Rml::InvalidateCallbackResourcesForBinding();
    }
    RebindVariantTweens(&copy.value);
    RetainVariantCallbacks(info[0].As<v8::Object>(), copy.value);
    state->value = std::move(copy);
  }
}

NAN_METHOD(PropertyGetDefinition) {
  auto* state = PropertyOf(info[0]);
  if (!state) {
    return;
  }
  if (state->value.definition) {
    info.GetReturnValue().Set(WrapPropertyDefinition(state->value.definition));
  } else {
    info.GetReturnValue().SetNull();
  }
}

NAN_METHOD(PropertySetDefinition) {
  const Rml::PropertyDefinition* definition = nullptr;
  if (!info[1]->IsNull()) {
    auto* state = PropertyDefinitionOf(info[1]);
    if (!state) {
      return;
    }
    definition = state->definition;
  }
  if (auto* state = PropertyOf(info[0])) {
    const auto carries_callbacks = [](const auto* definition) {
      return definition && Rml::HasCallbackResourcesForBinding(
                               definition->GetDefaultValue()->value);
    };
    if (carries_callbacks(state->value.definition) ||
        carries_callbacks(definition)) {
      Rml::InvalidateCallbackResourcesForBinding();
    }
    state->value.definition = definition;
  }
}

NAN_METHOD(PropertyGetSource) {
  auto* state = PropertyOf(info[0]);
  if (!state) {
    return;
  }
  const auto source = state->value.source;
  if (!source) {
    return info.GetReturnValue().SetNull();
  }
  auto result = Nan::New<v8::Object>();
  Own(result, "path", Nan::New(source->path).ToLocalChecked());
  Own(result, "lineNumber", Nan::New(source->line_number));
  Own(result, "ruleName", Nan::New(source->rule_name).ToLocalChecked());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(PropertySetSource) {
  Rml::SharedPtr<const Rml::PropertySource> source;
  if (!ReadPropertySource(info[1], &source)) {
    return;
  }
  if (auto* state = PropertyOf(info[0])) {
    state->value.source = std::move(source);
  }
}

}  // namespace

bool ReadPropertySource(v8::Local<v8::Value> value,
                        Rml::SharedPtr<const Rml::PropertySource>* result) {
  if (!value->IsNull()) {
    if (!value->IsObject()) {
      Nan::ThrowTypeError("Expected a PropertySource or null");
      return false;
    }
    auto input = value.As<v8::Object>();
    v8::Local<v8::Value> path;
    v8::Local<v8::Value> line;
    v8::Local<v8::Value> rule;
    int line_number;
    if (!Nan::Get(input, Nan::New("path").ToLocalChecked()).ToLocal(&path) ||
        !Nan::Get(input, Nan::New("lineNumber").ToLocalChecked())
             .ToLocal(&line) ||
        !Nan::Get(input, Nan::New("ruleName").ToLocalChecked())
             .ToLocal(&rule)) {
      return false;
    }
    if (!path->IsString() || !rule->IsString()) {
      Nan::ThrowTypeError("PropertySource path/ruleName must be strings");
      return false;
    }
    if (!ReadPropertyInteger(line, &line_number)) {
      return false;
    }
    Nan::Utf8String path_text(path);
    Nan::Utf8String rule_text(rule);
    *result = std::make_shared<Rml::PropertySource>(
        Rml::String(*path_text, path_text.length()),
        line_number,
        Rml::String(*rule_text, rule_text.length()));
  } else {
    result->reset();
  }
  return true;
}

bool ReadPropertyInteger(v8::Local<v8::Value> value, int* result) {
  if (!value->IsInt32()) {
    Nan::ThrowRangeError("Expected a native 32-bit integer");
    return false;
  }
  *result = Nan::To<int>(value).FromJust();
  return true;
}

bool ReadPropertyId(v8::Local<v8::Value> value, Rml::PropertyId* result) {
  if (!value->IsUint32() ||
      Nan::To<uint32_t>(value).FromJust() >=
          static_cast<unsigned>(Rml::PropertyId::MaxNumIds)) {
    Nan::ThrowRangeError("Expected a property id below PropertyId.MaxNumIds");
    return false;
  }
  *result = static_cast<Rml::PropertyId>(Nan::To<uint32_t>(value).FromJust());
  return true;
}

PropertyState* PropertyOf(v8::Local<v8::Value> handle) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* checked = PropertyHandle::From(handle);
  if (!checked) {
    return nullptr;
  }
  auto* state = checked->owner().get();
  if (state->generation != State().generation) {
    Nan::ThrowError("Property is no longer valid");
    return nullptr;
  }
  state->value.unit = state->metadata->unit;
  state->value.specificity = state->metadata->specificity;
  state->value.parser_index = state->metadata->parser_index;
  return state;
}

void UpdatePropertyMetadata(PropertyState* state) {
  state->metadata->unit = state->value.unit;
  state->metadata->specificity = state->value.specificity;
  state->metadata->parser_index = state->value.parser_index;
}

bool CopyProperty(v8::Local<v8::Value> handle, Rml::Property* result) {
  auto* state = PropertyOf(handle);
  if (!state || !CheckValue(state->value)) {
    return false;
  }
  *result = state->value;
  return true;
}

bool ValidatePropertyStorage(const Rml::Property& property) {
  const unsigned bits = static_cast<unsigned>(property.unit);
  if (bits && (bits & (bits - 1))) {
    Nan::ThrowTypeError("A styled Property requires a single unit");
    return false;
  }
  // ComputedValues::animation/transition use GetReference, which requires
  // exact storage types. Apply the same contract to all typed style owners.
  const std::pair<Rml::Unit, Rml::Variant::Type> typed_units[] = {
      {Rml::Unit::TRANSFORM, Rml::Variant::TRANSFORMPTR},
      {Rml::Unit::TRANSITION, Rml::Variant::TRANSITIONLIST},
      {Rml::Unit::ANIMATION, Rml::Variant::ANIMATIONLIST},
      {Rml::Unit::DECORATOR, Rml::Variant::DECORATORSPTR},
      {Rml::Unit::FILTER, Rml::Variant::FILTERSPTR},
      {Rml::Unit::FONTEFFECT, Rml::Variant::FONTEFFECTSPTR},
      {Rml::Unit::COLORSTOPLIST, Rml::Variant::COLORSTOPLIST},
      {Rml::Unit::BOXSHADOWLIST, Rml::Variant::BOXSHADOWLIST}};
  for (const auto& [unit, type] : typed_units) {
    if (property.unit == unit && property.value.GetType() != type) {
      Nan::ThrowTypeError(
          "Property unit requires matching typed native storage");
      return false;
    }
  }
  if (property.value.GetType() == Rml::Variant::TRANSITIONLIST) {
    const auto& list = property.value.GetReference<Rml::TransitionList>();
    if (!list.none && list.all && list.transitions.empty()) {
      Nan::ThrowTypeError("An all-transition style requires a first entry");
      return false;
    }
  }
  if (Rml::Any(property.unit & Rml::Unit::NUMERIC) &&
      !std::isfinite(property.GetNumericValue().number)) {
    Nan::ThrowRangeError("Property numeric conversion overflow");
    return false;
  }
  return true;
}

v8::Local<v8::Object> WrapProperty(Rml::Property value) {
  auto owner = std::make_shared<PropertyState>();
  RebindVariantTweens(&value.value);
  owner->value = std::move(value);
  owner->metadata = std::make_shared<PropertyMetadata>();
  UpdatePropertyMetadata(owner.get());
  owner->generation = State().generation;
  auto& properties = State().properties;
  auto& metadata = State().property_metadata;
  if (metadata.size() >= State().property_sweep_threshold) {
    std::erase_if(properties, [](const auto& weak) { return weak.expired(); });
    std::erase_if(metadata, [](const auto& weak) { return weak.expired(); });
    State().property_sweep_threshold =
        std::max(size_t{64}, metadata.size() * 2);
  }
  properties.emplace_back(owner);
  metadata.emplace_back(owner->metadata);
  auto result = Nan::New<v8::Object>();
  auto handle = PropertyHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  if (owner->value.definition &&
      Rml::HasCallbackResourcesForBinding(
          owner->value.definition->GetDefaultValue()->value)) {
    Rml::InvalidateCallbackResourcesForBinding();
  }
  RetainVariantCallbacks(handle, owner->value.value);
  Own(result, "handle", handle);
  const auto map = [&](const char* name, auto* field) {
    static_assert(sizeof(*field) == sizeof(int32_t));
    const auto buffer = sfmljs::MapShared(
        v8::Isolate::GetCurrent(), owner->metadata, field, sizeof(*field));
    Own(result, name, v8::Int32Array::New(buffer, 0, 1));
  };
  map("unitView", &owner->metadata->unit);
  map("specificityView", &owner->metadata->specificity);
  map("parserIndexView", &owner->metadata->parser_index);
  return result;
}

void ReleasePropertyStates() {
  auto& state = State();
  for (auto& weak : state.properties) {
    if (auto property = weak.lock()) {
      property->value = Rml::Property{};
      if (!property->handle.IsEmpty()) {
        RetainVariantCallbacks(property->handle.Get(v8::Isolate::GetCurrent()),
                               property->value.value);
      }
      property->generation = 0;
    }
  }
  state.properties.clear();
  for (auto& weak : state.property_metadata) {
    if (auto metadata = weak.lock()) {
      *metadata = PropertyMetadata{};
    }
  }
  state.property_metadata.clear();
  state.property_sweep_threshold = 64;
  for (auto& [pointer, definition] : state.property_definitions) {
    definition->definition = nullptr;
    definition->writable = nullptr;
    definition->owned.reset();
    definition->specification.reset();
    definition->lifetime.reset();
    definition->callback_specification = nullptr;
    definition->handle.Reset();
    definition->generation = 0;
  }
  state.property_definitions.clear();
}

NAN_MODULE_INIT(InitializeRmlProperty) {
  SetInstancerValueMethod<CreateProperty, true>(target, "createProperty");
  SetInstancerValueMethod<CloneProperty, true>(target, "cloneProperty");
  SetInstancerValueMethod<PropertyCompare<false>, true>(target,
                                                        "propertyEquals");
  SetInstancerValueMethod<PropertyCompare<true>, true>(target,
                                                       "propertyNotEquals");
  SetInstancerValueMethod<PropertyToString, true>(target, "propertyToString");
  SetInstancerValueMethod<PropertyGetNumericValue, true>(
      target, "propertyGetNumericValue");
  SetInstancerValueMethod<PropertyGet, true>(target, "propertyGet");
  SetInstancerValueMethod<PropertyGetValue, true>(target, "propertyGetValue");
  SetInstancerValueMethod<PropertyGetElementValue, true>(
      target, "propertyGetElementValue");
  SetInstancerValueMethod<PropertySetValue, true>(target, "propertySetValue");
  SetInstancerValueMethod<PropertyGetDefinition, true>(target,
                                                       "propertyGetDefinition");
  SetInstancerValueMethod<PropertySetDefinition, true>(target,
                                                       "propertySetDefinition");
  SetInstancerValueMethod<PropertyGetSource, true>(target, "propertyGetSource");
  SetInstancerValueMethod<PropertySetSource, true>(target, "propertySetSource");
}

}  // namespace sfmlrmlui
