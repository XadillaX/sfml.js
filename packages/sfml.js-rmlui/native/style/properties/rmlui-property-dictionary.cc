// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/properties/rmlui-property-dictionary.h"

#include <algorithm>
#include <limits>
#include <memory>
#include <type_traits>
#include <utility>

#include "native/animation/rmlui-animation-values.h"
#include "native/animation/rmlui-value-callbacks.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-property.h"

namespace sfmlrmlui {
namespace {

using DictionaryHandle = sfmljs::SharedHandle<PropertyDictionaryState>;

template <typename Key>
bool ReadKey(v8::Local<v8::Value> input, Key* key) {
  if constexpr (std::is_same_v<Key, Rml::String>) {
    if (!input->IsString()) {
      Nan::ThrowTypeError("Expected a custom property name");
      return false;
    }
    Nan::Utf8String text(input);
    key->assign(*text, text.length());
  } else {
    if (!input->IsUint32() || Nan::To<uint32_t>(input).FromJust() == 0 ||
        Nan::To<uint32_t>(input).FromJust() >=
            static_cast<unsigned>(Key::MaxNumIds)) {
      Nan::ThrowRangeError("Expected a nonzero property or shorthand id");
      return false;
    }
    *key = static_cast<Key>(Nan::To<uint32_t>(input).FromJust());
  }
  return true;
}

NAN_METHOD(CreateDictionary) {
  info.GetReturnValue().Set(WrapPropertyDictionary({}));
}

template <typename Key>
NAN_METHOD(SetProperty) {
  Key key;
  Rml::Property value;
  if (!ReadKey(info[1], &key) || !CopyProperty(info[2], &value)) {
    return;
  }
  if constexpr (std::is_same_v<Key, Rml::ShorthandId>) {
    if (value.unit != Rml::Unit::VAR_EXPRESSION ||
        value.value.GetType() != Rml::Variant::STRING) {
      return Nan::ThrowTypeError(
          "A var shorthand requires a VAR_EXPRESSION string Property");
    }
  }
  auto* state = PropertyDictionaryOf(info[0]);
  if (!state) {
    return;
  }
  if constexpr (std::is_same_v<Key, Rml::PropertyId>) {
    state->value.SetProperty(key, value);
  } else if constexpr (std::is_same_v<Key, Rml::String>) {
    state->value.SetCustomProperty(key, std::move(value));
  } else {
    state->value.SetVarShorthand(key, std::move(value));
  }
  RefreshPropertyDictionary(info[0].As<v8::Object>(), state);
}

template <typename Key>
NAN_METHOD(GetProperty) {
  Key key;
  if (!ReadKey(info[1], &key)) {
    return;
  }
  auto* state = PropertyDictionaryOf(info[0]);
  if (!state) {
    return;
  }
  const Rml::Property* value = nullptr;
  if constexpr (std::is_same_v<Key, Rml::PropertyId>) {
    value = state->value.GetProperty(key);
  } else if constexpr (std::is_same_v<Key, Rml::String>) {
    value = state->value.GetCustomProperty(key);
  } else {
    value = state->value.GetVarShorthand(key);
  }
  if (value) {
    info.GetReturnValue().Set(WrapProperty(*value));
  } else {
    info.GetReturnValue().SetNull();
  }
}

template <typename Key>
NAN_METHOD(RemoveProperty) {
  Key key;
  if (!ReadKey(info[1], &key)) {
    return;
  }
  auto* state = PropertyDictionaryOf(info[0]);
  if (!state) {
    return;
  }
  if constexpr (std::is_same_v<Key, Rml::PropertyId>) {
    state->value.RemoveProperty(key);
  } else if constexpr (std::is_same_v<Key, Rml::String>) {
    info.GetReturnValue().Set(state->value.RemoveCustomProperty(key));
  } else {
    info.GetReturnValue().Set(state->value.RemoveVarShorthand(key));
  }
  RefreshPropertyDictionary(info[0].As<v8::Object>(), state);
}

template <auto method>
NAN_METHOD(ReadMap) {
  auto* state = PropertyDictionaryOf(info[0]);
  if (!state) {
    return;
  }
  auto result = Nan::New<v8::Array>();
  for (const auto& [key, property] : (state->value.*method)()) {
    auto entry = Nan::New<v8::Array>(2);
    v8::Local<v8::Value> id;
    if constexpr (std::is_same_v<decltype(key), const Rml::String>) {
      id = Nan::New(key).ToLocalChecked();
    } else {
      id = Nan::New(static_cast<int>(key));
    }
    entry->CreateDataProperty(Nan::GetCurrentContext(), 0, id).FromJust();
    entry
        ->CreateDataProperty(
            Nan::GetCurrentContext(), 1, WrapProperty(property))
        .FromJust();
    result
        ->CreateDataProperty(Nan::GetCurrentContext(), result->Length(), entry)
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(Empty) {
  if (auto* state = PropertyDictionaryOf(info[0])) {
    info.GetReturnValue().Set(state->value.Empty());
  }
}

NAN_METHOD(GetNumProperties) {
  if (auto* state = PropertyDictionaryOf(info[0])) {
    info.GetReturnValue().Set(state->value.GetNumProperties());
  }
}

NAN_METHOD(Clear) {
  if (auto* state = PropertyDictionaryOf(info[0])) {
    state->value.Clear();
    RefreshPropertyDictionary(info[0].As<v8::Object>(), state);
  }
}

template <typename Map>
bool CheckSpecificityOffset(const Map& properties, int offset) {
  for (const auto& [key, value] : properties) {
    const int64_t sum = int64_t{value.specificity} + offset;
    if (sum < std::numeric_limits<int>::min() ||
        sum > std::numeric_limits<int>::max()) {
      Nan::ThrowRangeError("Property specificity overflow");
      return false;
    }
  }
  return true;
}

template <bool merge>
NAN_METHOD(Combine) {
  int specificity;
  if (!ReadPropertyInteger(info[2], &specificity)) {
    return;
  }
  auto* source = PropertyDictionaryOf(info[1]);
  if (!source) {
    return;
  }
  auto* target = PropertyDictionaryOf(info[0]);
  if (!target) {
    return;
  }
  // Snapshot also makes self-import/merge independent of iteration mutation.
  const auto copy = source->value;
  if constexpr (merge) {
    if (!CheckSpecificityOffset(copy.GetProperties(), specificity) ||
        !CheckSpecificityOffset(copy.GetCustomProperties(), specificity) ||
        !CheckSpecificityOffset(copy.GetVarShorthands(), specificity)) {
      return;
    }
    target->value.Merge(copy, specificity);
  } else {
    target->value.Import(copy, specificity);
  }
  RefreshPropertyDictionary(info[0].As<v8::Object>(), target);
}

NAN_METHOD(SetSource) {
  Rml::SharedPtr<const Rml::PropertySource> source;
  if (!ReadPropertySource(info[1], &source)) {
    return;
  }
  // Metadata getters may shut down and restart the runtime.
  if (auto* state = PropertyDictionaryOf(info[0])) {
    state->value.SetSourceOfAllProperties(source);
  }
}

}  // namespace

v8::Local<v8::Object> WrapPropertyDictionary(
    const Rml::PropertyDictionary& value) {
  auto state = std::make_shared<PropertyDictionaryState>();
  state->value = value;
  state->generation = State().generation;
  auto handle = DictionaryHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  auto& dictionaries = State().property_dictionaries;
  if (dictionaries.size() >= State().dictionary_sweep_threshold) {
    std::erase_if(dictionaries,
                  [](const auto& weak) { return weak.expired(); });
    State().dictionary_sweep_threshold =
        std::max(size_t{64}, dictionaries.size() * 2);
  }
  dictionaries.emplace_back(state);
  RefreshPropertyDictionary(handle, state.get());
  return handle;
}

PropertyDictionaryState* PropertyDictionaryOf(v8::Local<v8::Value> handle) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* checked = DictionaryHandle::TryFrom(handle);
  if (!checked) {
    Nan::ThrowTypeError("Expected a PropertyDictionary");
    return nullptr;
  }
  auto* state = checked->owner().get();
  if (state->generation != State().generation) {
    Nan::ThrowError("PropertyDictionary is no longer valid");
    return nullptr;
  }
  return state;
}

void RefreshPropertyDictionary(v8::Local<v8::Object> handle,
                               PropertyDictionaryState* state) {
  auto retained = Nan::New<v8::Array>();
  const auto refresh = [&](const auto& values, auto setter) {
    for (const auto& [key, source] : values) {
      auto property = source;
      RebindVariantTweens(&property.value);
      auto owner = Nan::New<v8::Object>();
      RetainVariantCallbacks(owner, property.value);
      retained
          ->CreateDataProperty(
              Nan::GetCurrentContext(), retained->Length(), owner)
          .FromJust();
      (state->value.*setter)(key, std::move(property));
    }
  };
  using Dictionary = Rml::PropertyDictionary;
  refresh(
      state->value.GetProperties(),
      static_cast<void (Dictionary::*)(Rml::PropertyId, const Rml::Property&)>(
          &Dictionary::SetProperty));
  refresh(state->value.GetCustomProperties(),
          static_cast<void (Dictionary::*)(Rml::String, Rml::Property)>(
              &Dictionary::SetCustomProperty));
  refresh(state->value.GetVarShorthands(),
          static_cast<void (Dictionary::*)(Rml::ShorthandId, Rml::Property)>(
              &Dictionary::SetVarShorthand));
  Nan::SetPrivate(
      handle, Nan::New("rml.dictionary.callbacks").ToLocalChecked(), retained)
      .FromJust();
}

void ReleasePropertyDictionaries() {
  auto& state = State();
  for (auto& weak : state.property_dictionaries) {
    if (auto dictionary = weak.lock()) {
      dictionary->value.Clear();
      dictionary->generation = 0;
      if (!dictionary->handle.IsEmpty()) {
        RefreshPropertyDictionary(
            dictionary->handle.Get(v8::Isolate::GetCurrent()),
            dictionary.get());
      }
    }
  }
  state.property_dictionaries.clear();
  state.dictionary_sweep_threshold = 64;
}

NAN_MODULE_INIT(InitializeRmlPropertyDictionary) {
  using Dictionary = Rml::PropertyDictionary;
  SetInstancerValueMethod<CreateDictionary>(target, "createPropertyDictionary");
  SetInstancerValueMethod<SetProperty<Rml::PropertyId>>(
      target, "dictionarySetProperty");
  SetInstancerValueMethod<SetProperty<Rml::String>>(
      target, "dictionarySetCustomProperty");
  SetInstancerValueMethod<SetProperty<Rml::ShorthandId>>(
      target, "dictionarySetVarShorthand");
  SetInstancerValueMethod<GetProperty<Rml::PropertyId>>(
      target, "dictionaryGetProperty");
  SetInstancerValueMethod<GetProperty<Rml::String>>(
      target, "dictionaryGetCustomProperty");
  SetInstancerValueMethod<GetProperty<Rml::ShorthandId>>(
      target, "dictionaryGetVarShorthand");
  SetInstancerValueMethod<RemoveProperty<Rml::PropertyId>>(
      target, "dictionaryRemoveProperty");
  SetInstancerValueMethod<RemoveProperty<Rml::String>>(
      target, "dictionaryRemoveCustomProperty");
  SetInstancerValueMethod<RemoveProperty<Rml::ShorthandId>>(
      target, "dictionaryRemoveVarShorthand");
  SetInstancerValueMethod<ReadMap<&Dictionary::GetProperties>>(
      target, "dictionaryGetProperties");
  SetInstancerValueMethod<ReadMap<&Dictionary::GetCustomProperties>>(
      target, "dictionaryGetCustomProperties");
  SetInstancerValueMethod<ReadMap<&Dictionary::GetVarShorthands>>(
      target, "dictionaryGetVarShorthands");
  SetInstancerValueMethod<Empty>(target, "dictionaryEmpty");
  SetInstancerValueMethod<GetNumProperties>(target,
                                            "dictionaryGetNumProperties");
  SetInstancerValueMethod<Clear>(target, "dictionaryClear");
  SetInstancerValueMethod<Combine<false>>(target, "dictionaryImport");
  SetInstancerValueMethod<Combine<true>>(target, "dictionaryMerge");
  SetInstancerValueMethod<SetSource>(target, "dictionarySetSource");
}

}  // namespace sfmlrmlui
