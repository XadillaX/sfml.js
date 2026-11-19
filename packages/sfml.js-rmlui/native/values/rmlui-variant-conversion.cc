// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/DecorationTypes.h>
#include <RmlUi/Core/StringUtilities.h>
#include <RmlUi/Core/StyleSheetTypes.h>

#include <cerrno>
#include <cstdlib>
#include <limits>
#include <unordered_set>
#include <utility>
#include <vector>

#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-owned-variant.h"
#include "native/values/rmlui-variant-objects.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

bool CheckStringLeaf(const Rml::Variant& value) {
  if (value.GetType() == Rml::Variant::VOIDPTR ||
      value.GetType() == Rml::Variant::SCRIPTINTERFACE) {
    Nan::ThrowTypeError("Pointer Variant requires a typed pointer adapter");
    return false;
  }
  return true;
}

template <typename List>
void AppendSerializedDeclarations(const Rml::SharedPtr<const List>& list,
                                  std::unordered_set<const void*>* visited,
                                  std::vector<Rml::Variant>* pending) {
  // Native conversion uses cached text first and serializes properties only
  // for declarations with an instancer. Defaults and custom properties are
  // not read by PropertySpecification::PropertiesToString.
  if (!list || !list->value.empty() || !visited->insert(list.get()).second) {
    return;
  }

  for (const auto& declaration : list->list) {
    if (declaration.instancer) {
      for (const auto& [id, property] :
           declaration.properties.GetProperties()) {
        pending->push_back(property.value);
      }
    }
  }
}

template <typename T>
bool ConvertStorage(const Rml::Variant* value,
                    const Rml::Variant& fallback,
                    bool zero_default,
                    Rml::Variant* result,
                    bool* converted) {
  // Read the exact storage directly: upstream byte has no pass-through
  // converter and Get<byte>() would silently discard the caller's fallback.
  T output = zero_default ? T{} : fallback.GetReference<T>();
  const bool success = value && value->GetInto(output);
  *result = std::move(output);
  if (converted) {
    *converted = success;
  }
  return true;
}

bool CheckIntegerVector(const Rml::Variant* value, size_t count) {
  if (!value || value->GetType() != Rml::Variant::STRING) {
    return true;
  }
  Rml::StringList components;
  Rml::StringUtilities::ExpandString(components,
                                     value->GetReference<Rml::String>());
  if (components.size() < count) {
    return true;
  }
  for (size_t i = 0; i < count; ++i) {
    errno = 0;
    char* end = nullptr;
    const char* start = components[i].c_str();
    const auto parsed = std::strtoll(start, &end, 10);
    if (errno == ERANGE || parsed < std::numeric_limits<int>::min() ||
        parsed > std::numeric_limits<int>::max()) {
      Nan::ThrowRangeError("Variant vector string exceeds the integer range");
      return false;
    }
    // Native stops at the first failed component. Later values are not read.
    if (end == start) {
      break;
    }
  }
  return true;
}

template <typename Vector, size_t count>
v8::MaybeLocal<v8::Value> ConvertIntegerVector(const Rml::Variant* value,
                                               const VariantSelector& selector,
                                               bool zero_default,
                                               bool* converted) {
  if (!CheckIntegerVector(value, count)) {
    return {};
  }
  Vector output{};
  if (!zero_default) {
    for (size_t i = 0; i < count; ++i) {
      output[static_cast<int>(i)] = selector.integers[i];
    }
  }
  const bool success = value && value->GetInto(output);
  if (converted) {
    *converted = success;
  }
  auto result = Nan::New<v8::Object>();
  const char* names[] = {"x", "y", "z", "w"};
  for (size_t i = 0; i < count; ++i) {
    if (!Nan::DefineOwnProperty(result,
                                Nan::New(names[i]).ToLocalChecked(),
                                Nan::New(output[static_cast<int>(i)]))
             .FromMaybe(false)) {
      return {};
    }
  }
  return result;
}

}  // namespace

bool CheckVariantStringConversion(const Rml::Variant& value) {
  if (!CheckStringLeaf(value)) {
    return false;
  }
  if (value.GetType() != Rml::Variant::DECORATORSPTR &&
      value.GetType() != Rml::Variant::FILTERSPTR) {
    return true;
  }

  std::vector<Rml::Variant> pending{value};
  std::unordered_set<const void*> visited;
  while (!pending.empty()) {
    auto current = std::move(pending.back());
    pending.pop_back();
    if (!CheckStringLeaf(current)) {
      return false;
    }

    if (current.GetType() == Rml::Variant::DECORATORSPTR) {
      AppendSerializedDeclarations(
          current.GetReference<Rml::DecoratorsPtr>(), &visited, &pending);
    } else if (current.GetType() == Rml::Variant::FILTERSPTR) {
      AppendSerializedDeclarations(
          current.GetReference<Rml::FiltersPtr>(), &visited, &pending);
    }
  }
  return true;
}

bool VariantSelectorFromJs(v8::Local<v8::Value> value,
                           VariantSelector* result) {
  if (ElementHandle::TryFrom(value) || ContextHandle::TryFrom(value) ||
      EventHandle::TryFrom(value) || OwnedVariantHandle::TryFrom(value) ||
      IsObjectVariant(value)) {
    Nan::ThrowTypeError("Variant default requires an explicit type selector");
    return false;
  }

  if (!value->IsObject()) {
    return VariantFromJs(value, &result->fallback);
  }
  auto object = value.As<v8::Object>();
  v8::Local<v8::Value> type;
  if (!Nan::Get(object, Nan::New("type").ToLocalChecked()).ToLocal(&type)) {
    return false;
  }
  if (!type->IsString()) {
    return VariantFromJs(value, &result->fallback);
  }
  Nan::Utf8String name(type);
  const Rml::String tag(*name, name.length());
  if (tag == "character") {
    v8::Local<v8::Array> keys;
    v8::Local<v8::Value> number;
    if (!Nan::GetOwnPropertyNames(object).ToLocal(&keys) ||
        !Nan::Get(object, Nan::New("value").ToLocalChecked())
             .ToLocal(&number)) {
      return false;
    }
    if (keys->Length() != 2 || !number->IsUint32()) {
      Nan::ThrowRangeError("Character selector requires a uint32 integer");
      return false;
    }
    result->destination = VariantSelector::Destination::kCharacter;
    result->character =
        static_cast<Rml::Character>(Nan::To<uint32_t>(number).FromJust());
    return true;
  }
  size_t count = 0;
  if (tag == "vector2i") {
    count = 2;
    result->destination = VariantSelector::Destination::kVector2i;
  } else if (tag == "vector3i") {
    count = 3;
    result->destination = VariantSelector::Destination::kVector3i;
  } else if (tag == "vector4i") {
    count = 4;
    result->destination = VariantSelector::Destination::kVector4i;
  } else {
    return VariantFromJs(value, &result->fallback);
  }
  v8::Local<v8::Array> keys;
  if (object->IsArray()) {
    Nan::ThrowTypeError("Integer vector selector cannot be an array");
    return false;
  }
  if (!Nan::GetOwnPropertyNames(object).ToLocal(&keys)) {
    return false;
  }
  if (keys->Length() != count + 1) {
    Nan::ThrowTypeError("Integer vector selector requires exact components");
    return false;
  }
  const char* names[] = {"x", "y", "z", "w"};
  for (size_t i = 0; i < count; ++i) {
    v8::Local<v8::Value> component;
    if (!Nan::Get(object, Nan::New(names[i]).ToLocalChecked())
             .ToLocal(&component)) {
      return false;
    }
    if (!component->IsInt32()) {
      Nan::ThrowRangeError("Integer vector selector requires int32 components");
      return false;
    }
    result->integers[i] = Nan::To<int32_t>(component).FromJust();
  }
  return true;
}

bool ConvertVariantStorage(const Rml::Variant* value,
                           const Rml::Variant& fallback,
                           bool zero_default,
                           Rml::Variant* result,
                           bool* converted) {
  if (value && fallback.GetType() == Rml::Variant::STRING &&
      !CheckVariantStringConversion(*value)) {
    return false;
  }

  if (!CheckVariantIntegerConversion(value, fallback.GetType())) {
    return false;
  }

  switch (fallback.GetType()) {
    case Rml::Variant::VOIDPTR: {
      void* output = zero_default ? nullptr : fallback.GetReference<void*>();
      const bool success = value && value->GetInto(output);
      if (success) {
        *result = *value;
      } else if (zero_default) {
        *result = static_cast<void*>(nullptr);
      } else {
        *result = fallback;
      }

      if (converted) {
        *converted = success;
      }
      return true;
    }

    case Rml::Variant::SCRIPTINTERFACE: {
      auto* output = zero_default
                         ? nullptr
                         : fallback.GetReference<Rml::ScriptInterface*>();
      const bool success = value && value->GetInto(output);
      if (success) {
        // Copy storage, not the raw destination, to retain its shared guard.
        *result = *value;
      } else if (zero_default) {
        *result = static_cast<Rml::ScriptInterface*>(nullptr);
      } else {
        *result = fallback;
      }

      if (converted) {
        *converted = success;
      }
      return true;
    }

    case Rml::Variant::BYTE:
      return ConvertStorage<Rml::byte>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::CHAR:
      return ConvertStorage<char>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::FLOAT:
      return ConvertStorage<float>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::INT:
      return ConvertStorage<int>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::UINT:
      return ConvertStorage<unsigned>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::BOOL:
      return ConvertStorage<bool>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::DOUBLE:
      return ConvertStorage<double>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::INT64:
      return ConvertStorage<int64_t>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::UINT64:
      return ConvertStorage<uint64_t>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::STRING:
      return ConvertStorage<Rml::String>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::VECTOR2:
      return ConvertStorage<Rml::Vector2f>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::VECTOR3:
      return ConvertStorage<Rml::Vector3f>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::VECTOR4:
      return ConvertStorage<Rml::Vector4f>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::COLOURB:
      return ConvertStorage<Rml::Colourb>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::COLOURF:
      return ConvertStorage<Rml::Colourf>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::COLORSTOPLIST:
      return ConvertStorage<Rml::ColorStopList>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::BOXSHADOWLIST:
      return ConvertStorage<Rml::BoxShadowList>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::TRANSFORMPTR:
      return ConvertStorage<Rml::TransformPtr>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::TRANSITIONLIST:
      return ConvertStorage<Rml::TransitionList>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::ANIMATIONLIST:
      return ConvertStorage<Rml::AnimationList>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::DECORATORSPTR:
      return ConvertStorage<Rml::DecoratorsPtr>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::FILTERSPTR:
      return ConvertStorage<Rml::FiltersPtr>(
          value, fallback, zero_default, result, converted);
    case Rml::Variant::FONTEFFECTSPTR:
      return ConvertStorage<Rml::FontEffectsPtr>(
          value, fallback, zero_default, result, converted);
    default:
      Nan::ThrowTypeError("Expected a non-null owned Variant default value");
      return false;
  }
}

v8::MaybeLocal<v8::Value> ConvertVariantToJs(const Rml::Variant* value,
                                             const VariantSelector& selector,
                                             bool zero_default,
                                             bool* converted) {
  switch (selector.destination) {
    case VariantSelector::Destination::kVector2i:
      return ConvertIntegerVector<Rml::Vector2i, 2>(
          value, selector, zero_default, converted);
    case VariantSelector::Destination::kVector3i:
      return ConvertIntegerVector<Rml::Vector3i, 3>(
          value, selector, zero_default, converted);
    case VariantSelector::Destination::kVector4i:
      return ConvertIntegerVector<Rml::Vector4i, 4>(
          value, selector, zero_default, converted);
    case VariantSelector::Destination::kCharacter: {
      if (!CheckVariantIntegerConversion(value, Rml::Variant::INT64)) {
        return {};
      }
      auto output = zero_default ? Rml::Character::Null : selector.character;
      const bool success = value && value->GetInto(output);
      if (converted) {
        *converted = success;
      }
      return Nan::New(static_cast<uint32_t>(output));
    }
    case VariantSelector::Destination::kStored: {
      Rml::Variant output;
      if (!ConvertVariantStorage(
              value, selector.fallback, zero_default, &output, converted)) {
        return {};
      }
      return VariantToJs(output);
    }
  }
  return {};
}

}  // namespace sfmlrmlui
