// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/dom/elements/rmlui-element-style.h"

#include <RmlUi/Core/PropertyDefinition.h>
#include <RmlUi/Core/StyleSheetSpecification.h>
#include <nan.h>

#include <algorithm>
#include <cmath>
#include <memory>
#include <optional>
#include <type_traits>
#include <utility>
#include <vector>

#include "native/animation/rmlui-animation-values.h"
#include "native/animation/rmlui-value-callbacks.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-property-dictionary.h"
#include "native/style/properties/rmlui-property-specification.h"
#include "native/style/properties/rmlui-property.h"
#include "native/style/values/rmlui-computed-values.h"
#include "native/values/rmlui-numeric-value.h"
#include "vendor/rmlui/Source/Core/ElementStyle.h"
#include "vendor/rmlui/Source/Core/PropertiesIterator.h"

namespace sfmlrmlui {
namespace {

struct ResolverState {
  v8::Global<v8::Object> handle;
  std::optional<Rml::PropertyDictionary> cache;
  Rml::SmallUnorderedSet<Rml::String> dependencies;
  Rml::Property storage;
  uint64_t generation{0};
};

using ResolverHandle = sfmljs::SharedHandle<ResolverState>;
std::vector<std::weak_ptr<ResolverState>> resolvers;
size_t resolver_sweep_threshold = 64;

ResolverState* ResolverOf(v8::Local<v8::Value> value) {
  auto* handle = ResolverHandle::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a KeyFramePropertyResolver");
    return nullptr;
  }
  auto* state = handle->owner().get();
  if (state->generation != State().generation) {
    Nan::ThrowError("KeyFramePropertyResolver is no longer valid");
    return nullptr;
  }
  return state;
}

bool ReadText(v8::Local<v8::Value> input, Rml::String* result) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a style name string");
    return false;
  }
  Nan::Utf8String text(input);
  result->assign(*text, text.length());
  return true;
}

template <typename Key>
bool ReadStyleKey(v8::Local<v8::Value> input, Key* result) {
  if constexpr (std::is_same_v<Key, Rml::String>) {
    if (!ReadText(input, result)) {
      return false;
    }
    if (result->size() <= 2 || result->substr(0, 2) != "--") {
      Nan::ThrowTypeError("Expected a custom property name beginning with --");
      return false;
    }
  } else if constexpr (std::is_same_v<Key, Rml::PropertyId>) {
    return ReadPropertyId(input, result);
  } else {
    if (!input->IsUint32() || !Nan::To<uint32_t>(input).FromJust() ||
        Nan::To<uint32_t>(input).FromJust() >=
            static_cast<unsigned>(Rml::ShorthandId::MaxNumIds) ||
        !Rml::StyleSheetSpecification::GetShorthand(
            static_cast<Rml::ShorthandId>(
                Nan::To<uint32_t>(input).FromJust()))) {
      Nan::ThrowRangeError("Expected a registered shorthand id");
      return false;
    }
    *result =
        static_cast<Rml::ShorthandId>(Nan::To<uint32_t>(input).FromJust());
  }
  return true;
}

NAN_METHOD(GetStyle) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(WrapElement(element));
  }
}

template <auto method>
NAN_METHOD(NoArguments) {
  if (auto* element = ElementOf(info[0])) {
    using Result = decltype((element->GetStyle()->*method)());
    if constexpr (std::is_void_v<Result>) {
      (element->GetStyle()->*method)();
    } else if constexpr (std::is_same_v<Result, Rml::String>) {
      info.GetReturnValue().Set(
          Nan::New((element->GetStyle()->*method)()).ToLocalChecked());
    } else {
      info.GetReturnValue().Set((element->GetStyle()->*method)());
    }
  }
}

template <bool pseudo>
NAN_METHOD(SetClass) {
  Rml::String name;
  if (!ReadText(info[1], &name)) {
    return;
  }
  if (!info[2]->IsBoolean() || (pseudo && !info[3]->IsBoolean())) {
    return Nan::ThrowTypeError("Expected boolean style activation flags");
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(
        pseudo ? element->GetStyle()->SetPseudoClass(
                     name, info[2]->IsTrue(), info[3]->IsTrue())
               : element->GetStyle()->SetClass(name, info[2]->IsTrue()));
  }
}

template <auto method>
NAN_METHOD(ClassText) {
  Rml::String text;
  if (!ReadText(info[1], &text)) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    if constexpr (std::is_void_v<decltype((element->GetStyle()->*method)(
                      text))>) {
      (element->GetStyle()->*method)(text);
    } else {
      info.GetReturnValue().Set((element->GetStyle()->*method)(text));
    }
  }
}

template <bool pseudo>
NAN_METHOD(ClassList) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto result = Nan::New<v8::Array>();
  if constexpr (pseudo) {
    const auto copy = element->GetStyle()->GetActivePseudoClasses();
    for (const auto& [name, state] : copy) {
      auto entry = Nan::New<v8::Array>(2);
      Nan::Set(entry, 0, Nan::New(name).ToLocalChecked());
      Nan::Set(entry, 1, Nan::New(static_cast<int>(state)));
      Nan::Set(result, result->Length(), entry);
    }
  } else {
    const auto copy = element->GetStyle()->GetClassNameList();
    for (const auto& name : copy) {
      Nan::Set(result, result->Length(), Nan::New(name).ToLocalChecked());
    }
  }
  info.GetReturnValue().Set(result);
}

template <typename Key>
NAN_METHOD(SetProperty) {
  Key key;
  Rml::Property property;
  if (!ReadStyleKey(info[1], &key) || !CopyProperty(info[2], &property) ||
      !ValidatePropertyStorage(property)) {
    return;
  }
  if constexpr (std::is_same_v<Key, Rml::ShorthandId>) {
    if (property.unit != Rml::Unit::VAR_EXPRESSION ||
        property.value.GetType() != Rml::Variant::STRING) {
      return Nan::ThrowTypeError(
          "A var shorthand requires a VAR_EXPRESSION string Property");
    }
  }
  if (auto* element = ElementOf(info[0])) {
    RebindVariantTweens(&property.value, element);
    if constexpr (std::is_same_v<Key, Rml::PropertyId>) {
      info.GetReturnValue().Set(
          element->GetStyle()->SetProperty(key, property));
    } else if constexpr (std::is_same_v<Key, Rml::String>) {
      element->GetStyle()->SetCustomProperty(key, property);
    } else {
      element->GetStyle()->SetVarShorthand(key, property);
    }
  }
}

template <typename Key, auto method>
NAN_METHOD(PropertyOperation) {
  Key key;
  if (!ReadStyleKey(info[1], &key)) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    if constexpr (std::is_void_v<decltype((element->GetStyle()->*method)(
                      key))>) {
      (element->GetStyle()->*method)(key);
    } else {
      const auto* borrowed = (element->GetStyle()->*method)(key);
      // Upstream variable substitution shares scratch storage across styles.
      const std::optional<Rml::Property> copy =
          borrowed ? std::optional<Rml::Property>(*borrowed) : std::nullopt;
      info.GetReturnValue().Set(copy ? v8::Local<v8::Value>(WrapProperty(*copy))
                                     : v8::Local<v8::Value>(Nan::Null()));
    }
  }
}

NAN_METHOD(LocalDictionary) {
  if (auto* element = ElementOf(info[0])) {
    const auto copy = element->GetStyle()->GetLocalStyleProperties();
    info.GetReturnValue().Set(WrapPropertyDictionary(copy));
  }
}

NAN_METHOD(DirtyProperty) {
  Rml::PropertyId id;
  if (!ReadPropertyId(info[1], &id)) {
    return;
  }
  if (id == Rml::PropertyId::Invalid ||
      !Rml::StyleSheetSpecification::GetProperty(id)) {
    return Nan::ThrowRangeError("Expected a registered property id");
  }
  if (auto* element = ElementOf(info[0])) {
    element->GetStyle()->DirtyProperty(id);
  }
}

template <bool recursive>
NAN_METHOD(DirtyUnits) {
  Rml::Unit units;
  if (!ReadUnit(info[1], &units)) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    if constexpr (recursive) {
      element->GetStyle()->DirtyPropertiesWithUnitsRecursive(units);
    } else {
      element->GetStyle()->DirtyPropertiesWithUnits(units);
    }
  }
}

template <bool relative>
NAN_METHOD(ResolveNumeric) {
  Rml::NumericValue value;
  float base = 0;
  if (!CopyNumericValue(info[1], &value) ||
      (!relative && !ReadFiniteNumericFloat(info[2], &base))) {
    return;
  }
  const unsigned bits = static_cast<unsigned>(value.unit);
  if (Rml::Any(value.unit & Rml::Unit::NUMERIC) && (bits & (bits - 1))) {
    return Nan::ThrowRangeError("Numeric resolution requires a single unit");
  }
  if (relative &&
      (!info[2]->IsUint32() || Nan::To<uint32_t>(info[2]).FromJust() > 5)) {
    return Nan::ThrowRangeError("Expected a valid RelativeTarget");
  }
  if (auto* element = ElementOf(info[0])) {
    const float result =
        relative ? element->GetStyle()->ResolveRelativeLength(
                       value,
                       static_cast<Rml::RelativeTarget>(
                           Nan::To<uint32_t>(info[2]).FromJust()))
                 : element->GetStyle()->ResolveNumericValue(value, base);
    if (!std::isfinite(result)) {
      return Nan::ThrowRangeError("Numeric resolution overflow");
    }
    info.GetReturnValue().Set(result);
  }
}

template <bool all>
NAN_METHOD(Iterate) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  std::vector<std::pair<Rml::String, Rml::Property>> named;
  std::vector<std::pair<Rml::PropertyId, Rml::Property>> plain;
  if constexpr (all) {
    auto* filter = info[1]->IsNull() ? nullptr : ElementOf(info[1]);
    if (!info[1]->IsNull() && !filter) {
      return;
    }
    for (auto it = element->GetStyle()->IterateAll(filter); !it->AtEnd();
         ++(*it)) {
      const auto entry = **it;
      named.emplace_back(entry.first, entry.second);
    }
  } else {
    for (auto it = element->GetStyle()->Iterate(); !it.AtEnd(); ++it) {
      const auto entry = *it;
      plain.emplace_back(entry.first, entry.second);
    }
  }
  // Copy the complete iteration before V8 allocation or callback rebinding.
  auto result = Nan::New<v8::Array>();
  const auto append = [&](const auto& values) {
    for (const auto& [key, property] : values) {
      auto entry = Nan::New<v8::Array>(2);
      if constexpr (std::is_same_v<std::decay_t<decltype(key)>, Rml::String>) {
        Nan::Set(entry, 0, Nan::New(key).ToLocalChecked());
      } else {
        Nan::Set(entry, 0, Nan::New(static_cast<int>(key)));
      }
      Nan::Set(entry, 1, WrapProperty(property));
      Nan::Set(result, result->Length(), entry);
    }
  };
  if constexpr (all) {
    append(named);
  } else {
    append(plain);
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ComputeValues) {
  float dp_ratio;
  Rml::Vector2f viewport;
  if (!info[4]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected valuesAreDefaultInitialized boolean");
  }
  if (!ReadFiniteNumericFloat(info[5], &dp_ratio)) {
    return;
  }
  if (dp_ratio <= 0) {
    return Nan::ThrowRangeError("Expected a positive dpRatio");
  }
  if (!info[6]->IsObject()) {
    return Nan::ThrowTypeError("Expected viewport dimensions");
  }
  v8::Local<v8::Value> x, y;
  if (!Nan::Get(info[6].As<v8::Object>(), Nan::New("x").ToLocalChecked())
           .ToLocal(&x) ||
      !Nan::Get(info[6].As<v8::Object>(), Nan::New("y").ToLocalChecked())
           .ToLocal(&y) ||
      !ReadFiniteNumericFloat(x, &viewport.x) ||
      !ReadFiniteNumericFloat(y, &viewport.y)) {
    return;
  }
  // Viewport accessors may destroy any of these receivers or restart runtime.
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto* values = WriteComputedValues(info[1], element);
  if (!values) {
    return;
  }
  const auto* parent = ReadComputedValues(info[2]);
  if (!info[2]->IsNull() && !parent) {
    return;
  }
  const auto* document = ReadComputedValues(info[3]);
  if (!info[3]->IsNull() && !document) {
    return;
  }
  const bool dirty = element->GetStyle()->AnyPropertiesDirty();
  const auto ids = element->GetStyle()->ComputeValues(
      *values, parent, document, info[4]->IsTrue(), dp_ratio, viewport);
  if (dirty) {
    MarkComputedFontGeneration(info[1]);
  }
  info.GetReturnValue().Set(WrapPropertyIdSet(ids));
}

NAN_METHOD(CreateResolver) {
  auto state = std::make_shared<ResolverState>();
  state->generation = State().generation;
  if (resolvers.size() >= resolver_sweep_threshold) {
    std::erase_if(resolvers, [](const auto& weak) { return weak.expired(); });
    resolver_sweep_threshold = std::max(size_t{64}, resolvers.size() * 2);
  }
  resolvers.emplace_back(state);
  auto handle = ResolverHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  info.GetReturnValue().Set(handle);
}

void ClearResolverEdges(v8::Local<v8::Object> handle) {
  Nan::DeletePrivate(handle, Nan::New("rml.keyframe.cache").ToLocalChecked());
  Nan::DeletePrivate(handle, Nan::New("rml.keyframe.storage").ToLocalChecked());
}

NAN_METHOD(ResetResolver) {
  if (auto* state = ResolverOf(info[0])) {
    state->cache.reset();
    state->dependencies.clear();
    state->storage = {};
    ClearResolverEdges(info[0].As<v8::Object>());
  }
}

template <bool cache>
NAN_METHOD(ResolverQuery) {
  if (auto* state = ResolverOf(info[0])) {
    if constexpr (cache) {
      info.GetReturnValue().Set(state->cache.has_value());
    } else {
      const auto copy = state->dependencies;
      auto result = Nan::New<v8::Array>();
      for (const auto& name : copy) {
        Nan::Set(result, result->Length(), Nan::New(name).ToLocalChecked());
      }
      info.GetReturnValue().Set(result);
    }
  }
}

NAN_METHOD(ResolveKeyFrame) {
  Rml::PropertyId id;
  Rml::Property input;
  if (!ReadPropertyId(info[1], &id) ||
      (!info[2]->IsNull() &&
       (!CopyProperty(info[2], &input) || !ValidatePropertyStorage(input)))) {
    return;
  }
  auto* block = PropertyDictionaryOf(info[3]);
  auto* state = ResolverOf(info[4]);
  auto* element = ElementOf(info[0]);
  if (!block || !state || !element) {
    return;
  }
  const bool had_cache = state->cache.has_value();
  if (!had_cache && !info[2]->IsNull() &&
      input.unit == Rml::Unit::SHORTHAND_PLACEHOLDER) {
    for (const auto& [key, value] : block->value.GetVarShorthands()) {
      if (!Rml::StyleSheetSpecification::GetShorthand(key) ||
          value.unit != Rml::Unit::VAR_EXPRESSION ||
          value.value.GetType() != Rml::Variant::STRING) {
        return Nan::ThrowTypeError(
            "Keyframe block requires registered VAR_EXPRESSION shorthands");
      }
    }
  }
  const auto* borrowed = element->GetStyle()->ResolveKeyFrameProperty(
      id,
      info[2]->IsNull() ? nullptr : &input,
      block->value,
      state->cache,
      state->dependencies,
      state->storage);
  const std::optional<Rml::Property> copy =
      borrowed ? std::optional<Rml::Property>(*borrowed) : std::nullopt;
  auto owner = info[4].As<v8::Object>();
  if (!had_cache && state->cache) {
    // Reuse existing dictionary callback ownership, once per lazy expansion.
    auto cache = WrapPropertyDictionary(*state->cache);
    state->cache = PropertyDictionaryOf(cache)->value;
    Nan::SetPrivate(
        owner, Nan::New("rml.keyframe.cache").ToLocalChecked(), cache);
  }
  RebindVariantTweens(&state->storage.value);
  auto storage_owner = Nan::New<v8::Object>();
  RetainVariantCallbacks(storage_owner, state->storage.value);
  Nan::SetPrivate(
      owner, Nan::New("rml.keyframe.storage").ToLocalChecked(), storage_owner);
  info.GetReturnValue().Set(copy ? v8::Local<v8::Value>(WrapProperty(*copy))
                                 : v8::Local<v8::Value>(Nan::Null()));
}

}  // namespace

void ReleaseKeyFrameResolvers() {
  for (const auto& weak : resolvers) {
    if (auto state = weak.lock()) {
      state->cache.reset();
      state->storage = {};
      state->dependencies.clear();
      state->generation = 0;
      if (!state->handle.IsEmpty()) {
        ClearResolverEdges(state->handle.Get(v8::Isolate::GetCurrent()));
      }
    }
  }
  resolvers.clear();
  resolver_sweep_threshold = 64;
}

NAN_MODULE_INIT(InitializeRmlElementStyle) {
  using Style = Rml::ElementStyle;
  SetRuntimeMethod<GetStyle, true>(target, "elementGetStyle");
  SetRuntimeMethod<NoArguments<&Style::UpdateDefinition>, true>(
      target, "styleUpdateDefinition");
  SetRuntimeMethod<SetClass<false>, true>(target, "styleSetClass");
  SetRuntimeMethod<SetClass<true>, true>(target, "styleSetPseudoClass");
  SetRuntimeMethod<ClassText<&Style::IsClassSet>, true>(target,
                                                        "styleIsClassSet");
  SetRuntimeMethod<ClassText<&Style::IsPseudoClassSet>, true>(
      target, "styleIsPseudoClassSet");
  SetRuntimeMethod<ClassText<&Style::SetClassNames>, true>(
      target, "styleSetClassNames");
  SetRuntimeMethod<NoArguments<&Style::GetClassNames>, true>(
      target, "styleGetClassNames");
  SetRuntimeMethod<ClassList<false>, true>(target, "styleGetClassNameList");
  SetRuntimeMethod<ClassList<true>, true>(target,
                                          "styleGetActivePseudoClasses");
  SetRuntimeMethod<SetProperty<Rml::PropertyId>, true>(target,
                                                       "styleSetProperty");
  SetRuntimeMethod<SetProperty<Rml::String>, true>(target,
                                                   "styleSetCustomProperty");
  SetRuntimeMethod<SetProperty<Rml::ShorthandId>, true>(target,
                                                        "styleSetVarShorthand");
#define SFML_STYLE_PROPERTY(key, method)                                       \
  SetRuntimeMethod<PropertyOperation<Rml::key, &Style::method>, true>(         \
      target, "style" #method)
  SFML_STYLE_PROPERTY(PropertyId, RemoveProperty);
  SFML_STYLE_PROPERTY(String, RemoveCustomProperty);
  SFML_STYLE_PROPERTY(ShorthandId, RemoveVarShorthand);
  SFML_STYLE_PROPERTY(PropertyId, GetProperty);
  SFML_STYLE_PROPERTY(String, GetCustomProperty);
  SFML_STYLE_PROPERTY(PropertyId, GetLocalPropertyWithResolvedVariables);
#undef SFML_STYLE_PROPERTY
#define SFML_STYLE_CONST_GETTER(key, arg, method)                              \
  SetRuntimeMethod<                                                            \
      PropertyOperation<Rml::key,                                              \
                        static_cast<const Rml::Property* (Style::*)(arg)       \
                                        const>(&Style::method)>,               \
      true>(target, "style" #method)
  SFML_STYLE_CONST_GETTER(PropertyId, Rml::PropertyId, GetLocalProperty);
  SFML_STYLE_CONST_GETTER(String, const Rml::String&, GetLocalCustomProperty);
  SFML_STYLE_CONST_GETTER(ShorthandId, Rml::ShorthandId, GetLocalShorthand);
#undef SFML_STYLE_CONST_GETTER
#define SFML_STYLE_SPECIFIED(key, arg, method)                                 \
  SetRuntimeMethod<PropertyOperation<Rml::key,                                 \
                                     static_cast<const Rml::Property* (        \
                                         Style::*)(arg)>(&Style::method)>,     \
                   true>(target, "style" #method)
  SFML_STYLE_SPECIFIED(PropertyId, Rml::PropertyId, GetSpecifiedProperty);
  SFML_STYLE_SPECIFIED(String, const Rml::String&, GetSpecifiedCustomProperty);
  SFML_STYLE_SPECIFIED(ShorthandId, Rml::ShorthandId, GetSpecifiedShorthand);
#undef SFML_STYLE_SPECIFIED
  SetRuntimeMethod<DirtyProperty, true>(target, "styleDirtyProperty");
  SetRuntimeMethod<LocalDictionary, true>(target,
                                          "styleGetLocalStyleProperties");
  SetRuntimeMethod<NoArguments<&Style::DirtyInheritedProperties>, true>(
      target, "styleDirtyInheritedProperties");
  SetRuntimeMethod<NoArguments<&Style::AnyPropertiesDirty>, true>(
      target, "styleAnyPropertiesDirty");
  SetRuntimeMethod<DirtyUnits<false>, true>(target,
                                            "styleDirtyPropertiesWithUnits");
  SetRuntimeMethod<DirtyUnits<true>, true>(
      target, "styleDirtyPropertiesWithUnitsRecursive");
  SetRuntimeMethod<ResolveNumeric<false>, true>(target,
                                                "styleResolveNumericValue");
  SetRuntimeMethod<ResolveNumeric<true>, true>(target,
                                               "styleResolveRelativeLength");
  SetRuntimeMethod<Iterate<false>, true>(target, "styleIterate");
  SetRuntimeMethod<Iterate<true>, true>(target, "styleIterateAll");
  SetRuntimeMethod<ComputeValues>(target, "styleComputeValues");
  SetRuntimeMethod<CreateResolver, true>(target, "createKeyFrameResolver");
  SetRuntimeMethod<ResetResolver, true>(target, "resetKeyFrameResolver");
  SetRuntimeMethod<ResolverQuery<true>, true>(target,
                                              "keyFrameResolverHasCache");
  SetRuntimeMethod<ResolverQuery<false>, true>(target,
                                               "keyFrameResolverDependencies");
  SetRuntimeMethod<ResolveKeyFrame>(target, "styleResolveKeyFrameProperty");
}

}  // namespace sfmlrmlui
