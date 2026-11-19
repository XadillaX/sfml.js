// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/effects/rmlui-effect-values.h"

#include <RmlUi/Core/Decorator.h>
#include <RmlUi/Core/Filter.h>
#include <RmlUi/Core/FontEffect.h>
#include <RmlUi/Core/StyleSheetSpecification.h>
#include <RmlUi/Core/StyleSheetTypes.h>

#include <algorithm>
#include <memory>
#include <type_traits>
#include <utility>

#include "native/animation/rmlui-value-callbacks.h"
#include "native/fonts/rmlui-font-effect.h"
#include "native/runtime/rmlui-callback-owners.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-effect-instancers.h"
#include "native/style/effects/rmlui-filter.h"
#include "native/style/properties/rmlui-property.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {

struct EffectValueState {
  Rml::Variant value;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

namespace {

using EffectValueHandle = sfmljs::SharedHandle<EffectValueState>;

bool String(v8::Local<v8::Value> input, Rml::String* result) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected an effect string");
    return false;
  }
  Nan::Utf8String text(input);
  result->assign(*text, text.length());
  return true;
}

bool Read(v8::Local<v8::Value> input,
          const char* field,
          v8::Local<v8::Value>* result) {
  if (!input->IsObject() || input->IsArray()) {
    Nan::ThrowTypeError("Expected an effect declaration or property record");
    return false;
  }
  return Nan::Get(input.As<v8::Object>(), Nan::New(field).ToLocalChecked())
      .ToLocal(result);
}

void Own(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

const char* EffectTag(Rml::Variant::Type type) {
  switch (type) {
    case Rml::Variant::DECORATORSPTR:
      return "decorators";
    case Rml::Variant::FILTERSPTR:
      return "filters";
    case Rml::Variant::FONTEFFECTSPTR:
      return "fonteffects";
    default:
      return "";
  }
}

EffectValueState* EffectValueOf(v8::Local<v8::Value> handle) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* checked = EffectValueHandle::TryFrom(handle);
  if (!checked) {
    Nan::ThrowTypeError("Expected an owned effect list");
    return nullptr;
  }
  auto* state = checked->owner().get();
  if (state->generation != State().generation) {
    Nan::ThrowError("Effect list is no longer valid");
    return nullptr;
  }
  return state;
}

NAN_METHOD(ParseEffectList) {
  if (!info[0]->IsString() || !info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected effect type and value strings");
  }
  Nan::Utf8String tag(info[0]);
  const Rml::String type(*tag, tag.length());
  const char* name = nullptr;
  Rml::Variant empty;
  if (type == "decorators") {
    name = "decorator";
    empty = Rml::DecoratorsPtr{};
  } else if (type == "filters") {
    name = "filter";
    empty = Rml::FiltersPtr{};
  } else if (type == "fonteffects") {
    name = "font-effect";
    empty = Rml::FontEffectsPtr{};
  } else {
    return Nan::ThrowTypeError("Expected an effect list type");
  }
  Nan::Utf8String text(info[1]);
  Rml::Property property;
  const auto* definition = Rml::StyleSheetSpecification::GetProperty(name);
  if (!definition->ParseValue(property, Rml::String(*text, text.length()))) {
    return Nan::ThrowTypeError("Could not parse effect list");
  }
  // Font-effect 'none' is Variant NONE upstream; the explicit list constructor
  // instead represents a null FontEffectsPtr, without changing DOM parsing.
  const auto value =
      property.value.GetType() == Rml::Variant::NONE ? empty : property.value;
  info.GetReturnValue().Set(EffectValueToJs(value));
}

template <typename Declaration>
v8::Local<v8::Object> DeclarationToJs(const Declaration& declaration) {
  auto result = Nan::New<v8::Object>();
  Own(result, "type", Nan::New(declaration.type).ToLocalChecked());
  Own(result, "instancer", WrapEffectInstancer(declaration.instancer));
  auto properties = Nan::New<v8::Array>(
      static_cast<int>(declaration.properties.GetProperties().size()));
  uint32_t index = 0;
  for (const auto& [id, property] : declaration.properties.GetProperties()) {
    auto entry = Nan::New<v8::Object>();
    Own(entry, "id", Nan::New(static_cast<int>(id)));
    // PropertySpecification exposes names only through its serializer.
    // Serialize an empty singleton so user property text cannot affect the
    // separator or introduce a competing name.
    Rml::String name;
    if (declaration.instancer) {
      Rml::PropertyDictionary singleton;
      singleton.SetProperty(id, Rml::Property{});
      const auto text =
          declaration.instancer->GetPropertySpecification().PropertiesToString(
              singleton, true, ';');
      name = text.substr(0, text.find(':'));
    }
    Own(entry, "name", Nan::New(name).ToLocalChecked());
    Own(entry, "property", WrapProperty(property));
    properties->CreateDataProperty(Nan::GetCurrentContext(), index++, entry)
        .FromJust();
  }
  Own(result, "properties", properties);
  return result;
}

v8::Local<v8::Object> EntryToJs(const Rml::DecoratorDeclaration& value) {
  auto result = DeclarationToJs(value);
  Own(result, "isNamed", Nan::New(value.instancer == nullptr));
  Own(result, "paintArea", Nan::New(static_cast<int>(value.paint_area)));
  return result;
}

v8::Local<v8::Object> EntryToJs(const Rml::FilterDeclaration& value) {
  return DeclarationToJs(value);
}

bool ReadProperties(v8::Local<v8::Value> input,
                    Rml::PropertyDictionary* result) {
  if (!input->IsArray()) {
    Nan::ThrowTypeError("Expected an effect properties array");
    return false;
  }
  auto array = input.As<v8::Array>();
  const auto count = array->Length();
  for (uint32_t index = 0; index < count; ++index) {
    v8::Local<v8::Value> entry;
    v8::Local<v8::Value> id;
    v8::Local<v8::Value> handle;
    Rml::PropertyId property_id;
    Rml::Property property;
    if (!Nan::Get(array, index).ToLocal(&entry) || !Read(entry, "id", &id) ||
        !Read(entry, "property", &handle) ||
        !ReadPropertyId(id, &property_id) || !CopyProperty(handle, &property)) {
      return false;
    }
    result->SetProperty(property_id, property);
  }
  return true;
}

template <typename Declaration>
bool ReadDeclaration(v8::Local<v8::Value> input, Declaration* result) {
  v8::Local<v8::Value> type;
  v8::Local<v8::Value> instancer;
  v8::Local<v8::Value> properties;
  if (!Read(input, "type", &type) || !Read(input, "instancer", &instancer) ||
      !Read(input, "properties", &properties) || !String(type, &result->type) ||
      !ReadProperties(properties, &result->properties) ||
      !ReadEffectInstancer(instancer, &result->instancer)) {
    return false;
  }
  if constexpr (std::is_same_v<Declaration, Rml::DecoratorDeclaration>) {
    v8::Local<v8::Value> area;
    if (!Read(input, "paintArea", &area)) {
      return false;
    }
    if (!area->IsInt32() || Nan::To<int>(area).FromJust() < 0 ||
        Nan::To<int>(area).FromJust() > static_cast<int>(Rml::BoxArea::Auto)) {
      Nan::ThrowRangeError("Expected a valid decorator paint area");
      return false;
    }
    result->paint_area =
        static_cast<Rml::BoxArea>(Nan::To<int>(area).FromJust());
  }
  return true;
}

template <typename Declaration>
bool ValidateDeclaration(const Declaration& value) {
  if (!value.instancer) {
    if constexpr (std::is_same_v<Declaration, Rml::FilterDeclaration>) {
      Nan::ThrowTypeError("A filter declaration requires an instancer");
      return false;
    }
    return true;  // Named @decorator resolves against the active stylesheet.
  }
  const auto& specification = value.instancer->GetPropertySpecification();
  for (const auto& [id, property] : value.properties.GetProperties()) {
    if (!specification.GetProperty(id)) {
      Nan::ThrowRangeError("Unknown instancer-local property ID");
      return false;
    }
    if (!ValidatePropertyStorage(property)) {
      return false;
    }
  }
  // Built-in instancers dereference required properties without null checks.
  // Keep dictionary fields exact; callers can copy a parsed declaration to
  // obtain defaults instead of silently adding them during construction.
  for (auto id : specification.GetRegisteredProperties()) {
    if (!value.properties.GetProperty(id)) {
      Nan::ThrowTypeError("Effect declaration is missing required properties");
      return false;
    }
  }
  return true;
}

template <typename List>
bool ReadDeclarations(v8::Local<v8::Value> input, List* result) {
  if (!input->IsArray()) {
    Nan::ThrowTypeError("Expected an effect declaration array");
    return false;
  }
  const auto generation = State().generation;
  auto array = input.As<v8::Array>();
  const auto count = array->Length();
  result->list.reserve(count);
  for (uint32_t index = 0; index < count; ++index) {
    v8::Local<v8::Value> entry;
    typename decltype(result->list)::value_type declaration{};
    if (!Nan::Get(array, index).ToLocal(&entry) ||
        !ReadDeclaration(entry, &declaration)) {
      return false;
    }
    result->list.push_back(std::move(declaration));
  }
  // An accessor in any later record can invalidate all earlier raw references.
  if (!RuntimeReady()) {
    return false;
  }
  if (generation != State().generation) {
    Nan::ThrowError("Effect declaration generation is no longer valid");
    return false;
  }
  for (const auto& declaration : result->list) {
    if (!ValidateDeclaration(declaration)) {
      return false;
    }
  }
  return true;
}

bool ReadDeclarations(v8::Local<v8::Value> input, Rml::FontEffects* result) {
  if (!input->IsArray()) {
    Nan::ThrowTypeError("Expected a font effect array");
    return false;
  }
  const auto generation = State().generation;
  auto array = input.As<v8::Array>();
  const auto count = array->Length();
  result->list.reserve(count);
  for (uint32_t index = 0; index < count; ++index) {
    v8::Local<v8::Value> handle;
    Rml::SharedPtr<const Rml::FontEffect> effect;
    if (!Nan::Get(array, index).ToLocal(&handle) ||
        !CopyFontEffect(handle, &effect)) {
      return false;
    }
    result->list.push_back(std::move(effect));
  }
  if (!RuntimeReady()) {
    return false;
  }
  if (generation != State().generation) {
    Nan::ThrowError("Font effect list generation is no longer valid");
    return false;
  }
  return true;
}

template <typename List>
void CreateList(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  auto result = std::make_shared<List>();
  if (String(info[2], &result->value) &&
      ReadDeclarations(info[1], result.get())) {
    info.GetReturnValue().Set(
        EffectValueToJs(Rml::Variant(Rml::SharedPtr<const List>(result))));
  }
}

NAN_METHOD(CreateEffectList) {
  Rml::String type;
  if (!String(info[0], &type)) {
    return;
  }
  if (type == "decorators") {
    CreateList<Rml::DecoratorDeclarationList>(info);
  } else if (type == "filters") {
    CreateList<Rml::FilterDeclarationList>(info);
  } else if (type == "fonteffects") {
    CreateList<Rml::FontEffects>(info);
  } else {
    Nan::ThrowTypeError("Expected an effect list type");
  }
}

template <typename List>
void WriteList(const Nan::FunctionCallbackInfo<v8::Value>& info,
               const Rml::String& field) {
  List input;
  if (field == "value" ? !String(info[2], &input.value)
                       : !ReadDeclarations(info[2], &input)) {
    return;
  }
  auto* state = EffectValueOf(info[0]);
  if (!state) {
    return;
  }
  const auto original = state->value.Get<Rml::SharedPtr<const List>>();
  // Never mutate the const list retained by DOM/property/draw snapshots.
  auto result =
      original ? std::make_shared<List>(*original) : std::make_shared<List>();
  if (field == "value") {
    result->value = std::move(input.value);
  } else {
    result->list = std::move(input.list);
    Rml::InvalidateCallbackResourcesForBinding();
  }
  state->value = Rml::SharedPtr<const List>(result);
  RetainVariantCallbacks(info[0].As<v8::Object>(), state->value);
}

NAN_METHOD(WriteEffectList) {
  Rml::String field;
  if (!String(info[1], &field)) {
    return;
  }
  if (field != "value" && field != "list") {
    return Nan::ThrowTypeError("Expected a writable effect field");
  }
  auto* state = EffectValueOf(info[0]);
  if (!state) {
    return;
  }
  switch (state->value.GetType()) {
    case Rml::Variant::DECORATORSPTR:
      WriteList<Rml::DecoratorDeclarationList>(info, field);
      break;
    case Rml::Variant::FILTERSPTR:
      WriteList<Rml::FilterDeclarationList>(info, field);
      break;
    case Rml::Variant::FONTEFFECTSPTR:
      WriteList<Rml::FontEffects>(info, field);
      break;
    default:
      Nan::ThrowTypeError("Expected an effect list type");
      break;
  }
}

v8::Local<v8::Object> EntryToJs(
    const Rml::SharedPtr<const Rml::FontEffect>& value) {
  return WrapFontEffect(value);
}

template <typename Pointer>
v8::Local<v8::Value> ReadField(const Pointer& pointer,
                               const Rml::String& field) {
  if (field == "value") {
    return Nan::New(pointer ? pointer->value : Rml::String{}).ToLocalChecked();
  }
  if (field == "isNull") {
    return Nan::New(!pointer);
  }
  auto list =
      Nan::New<v8::Array>(pointer ? static_cast<int>(pointer->list.size()) : 0);
  if (pointer) {
    uint32_t index = 0;
    for (const auto& entry : pointer->list) {
      list->CreateDataProperty(
              Nan::GetCurrentContext(), index++, EntryToJs(entry))
          .FromJust();
    }
  }
  return list;
}

NAN_METHOD(ReadEffectList) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an effect list field");
  }
  Nan::Utf8String name(info[1]);
  const Rml::String field(*name, name.length());
  if (field != "value" && field != "isNull" && field != "list") {
    return Nan::ThrowTypeError("Expected an effect list field");
  }
  auto* state = EffectValueOf(info[0]);
  if (!state) {
    return;
  }
  switch (state->value.GetType()) {
    case Rml::Variant::DECORATORSPTR:
      info.GetReturnValue().Set(
          ReadField(state->value.Get<Rml::DecoratorsPtr>(), field));
      break;
    case Rml::Variant::FILTERSPTR:
      info.GetReturnValue().Set(
          ReadField(state->value.Get<Rml::FiltersPtr>(), field));
      break;
    case Rml::Variant::FONTEFFECTSPTR:
      info.GetReturnValue().Set(
          ReadField(state->value.Get<Rml::FontEffectsPtr>(), field));
      break;
    default:
      Nan::ThrowTypeError("Expected an effect list type");
      break;
  }
}

}  // namespace

void AppendEffectValueCallbackOwners(CallbackOwnerSnapshots* snapshots) {
  for (const auto& weak : State().effect_values) {
    if (const auto state = weak.lock(); state && !state->handle.IsEmpty()) {
      auto& snapshot = snapshots->emplace_back();
      snapshot.handle = state->handle.Get(v8::Isolate::GetCurrent());
      snapshot.values.push_back(state->value);
    }
  }
}

v8::Local<v8::Object> EffectValueToJs(const Rml::Variant& value) {
  auto owner = std::make_shared<EffectValueState>();
  owner->value = value;
  owner->generation = State().generation;
  auto& values = State().effect_values;
  if (values.size() >= State().effect_sweep_threshold) {
    std::erase_if(values, [](const auto& weak) { return weak.expired(); });
    State().effect_sweep_threshold = std::max(size_t{64}, values.size() * 2);
  }
  values.emplace_back(owner);
  auto result = Nan::New<v8::Object>();
  Own(result, "type", Nan::New(EffectTag(value.GetType())).ToLocalChecked());
  auto handle = EffectValueHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  RetainVariantCallbacks(handle, owner->value);
  Own(result, "effectHandle", handle);
  return result;
}

bool EffectValueFromJs(v8::Local<v8::Object> object,
                       Rml::Variant::Type type,
                       Rml::Variant* result) {
  v8::Local<v8::Value> handle;
  if (!Nan::Get(object, Nan::New("effectHandle").ToLocalChecked())
           .ToLocal(&handle)) {
    return false;
  }
  // The accessor above may shut down the runtime; resolve only afterwards.
  auto* state = EffectValueOf(handle);
  if (!state) {
    return false;
  }
  if (state->value.GetType() != type) {
    Nan::ThrowTypeError("Effect list tag does not match its native type");
    return false;
  }
  *result = state->value;
  return true;
}

void ReleaseEffectValues() {
  for (auto& weak : State().effect_values) {
    if (auto value = weak.lock()) {
      value->value.Clear();
      value->generation = 0;
      if (!value->handle.IsEmpty()) {
        RetainVariantCallbacks(value->handle.Get(v8::Isolate::GetCurrent()),
                               value->value);
        value->handle.Reset();
      }
    }
  }
  State().effect_values.clear();
  State().effect_sweep_threshold = 64;
  ReleaseFontEffects();
  ReleaseFilters();
}

NAN_MODULE_INIT(InitializeRmlEffectValues) {
  SetInstancerValueMethod<CreateEffectList, true>(target, "createEffectList");
  SetInstancerValueMethod<WriteEffectList, true>(target, "writeEffectList");
  SetRuntimeMethod<ParseEffectList, true>(target, "parseEffectList");
  SetInstancerValueMethod<ReadEffectList, true>(target, "readEffectList");
}

}  // namespace sfmlrmlui
