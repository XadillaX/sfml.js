// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/values/rmlui-variant.h"

#include <array>
#include <cctype>
#include <cerrno>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <limits>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/animation/rmlui-animation-values.h"
#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-parent-observers.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-decoration-values.h"
#include "native/style/effects/rmlui-effect-values.h"
#include "native/style/values/rmlui-transform.h"
#include "native/values/rmlui-owned-variant.h"
#include "native/values/rmlui-variant-objects.h"
#include "native/values/rmlui-variant-pointers.h"

namespace sfmlrmlui {
namespace {

size_t& ElementVariantLifetimes() {
  static size_t count = 0;
  return count;
}

class VariantElementLifetime;

auto& ElementVariantSlots() {
  static std::unordered_map<Rml::ScriptInterface* const*,
                            std::weak_ptr<VariantElementLifetime>>
      slots;
  return slots;
}

// The aliased shared pointer owns this observer, never the element or its
// handle. Destruction only nulls the slot; V8 owner edges retain live targets.
class VariantElementLifetime final : public ElementOwnershipObserver {
 public:
  explicit VariantElementLifetime(Rml::Element* element) : pointer(element) {
    BindElementOwnershipObserver(element, this);
    ++ElementVariantLifetimes();
  }

  ~VariantElementLifetime() override {
    ElementVariantSlots().erase(&pointer);
    --ElementVariantLifetimes();
  }

  void OnOwnershipChange(bool destroying) override {
    if (destroying) {
      pointer = nullptr;
    }
  }

  Rml::ScriptInterface* pointer;
};

std::shared_ptr<Rml::ScriptInterface*> ElementVariantLifetime(
    Rml::Element* element) {
  const auto state = ShareElement(element);
  if (auto existing = state->variant_pointer.lock()) {
    return existing;
  }
  auto lifetime = std::make_shared<VariantElementLifetime>(element);
  ElementVariantSlots().emplace(&lifetime->pointer, lifetime);
  std::shared_ptr<Rml::ScriptInterface*> slot(lifetime, &lifetime->pointer);
  state->variant_pointer = slot;
  return slot;
}

v8::Local<v8::Object> Components(const char* const* names,
                                 const double* values,
                                 size_t count) {
  auto result = Nan::New<v8::Object>();
  for (size_t i = 0; i < count; ++i) {
    Nan::DefineOwnProperty(
        result, Nan::New(names[i]).ToLocalChecked(), Nan::New(values[i]))
        .FromJust();
  }
  return result;
}

template <typename Vector, size_t count>
v8::Local<v8::Value> VectorToJs(const Vector& vector) {
  const char* names[] = {"x", "y", "z", "w"};
  std::array<double, count> values{};
  for (size_t i = 0; i < count; ++i) {
    values[i] = vector[static_cast<int>(i)];
  }
  return Components(names, values.data(), count);
}

template <typename Colour>
v8::Local<v8::Value> ColourToJs(const Colour& colour, const char* type) {
  const char* names[] = {"red", "green", "blue", "alpha"};
  const double values[] = {static_cast<double>(colour.red),
                           static_cast<double>(colour.green),
                           static_cast<double>(colour.blue),
                           static_cast<double>(colour.alpha)};
  auto result = Components(names, values, 4);
  Nan::DefineOwnProperty(result,
                         Nan::New("type").ToLocalChecked(),
                         Nan::New(type).ToLocalChecked())
      .FromJust();
  return result;
}

bool ReadComponent(v8::Local<v8::Object> object,
                   const char* key,
                   double* result) {
  v8::Local<v8::Value> value;
  if (!Nan::Get(object, Nan::New(key).ToLocalChecked()).ToLocal(&value)) {
    return false;
  }
  if (!value->IsNumber()) {
    Nan::ThrowTypeError("Expected a numeric vector or colour Variant");
    return false;
  }
  *result = Nan::To<double>(value).FromJust();
  if (!std::isfinite(*result) ||
      std::abs(*result) > std::numeric_limits<float>::max()) {
    Nan::ThrowRangeError("Vector or colour Variant component exceeds float");
    return false;
  }
  return true;
}

bool ScalarFromJs(v8::Local<v8::Object> object,
                  const std::string& tag,
                  uint32_t key_count,
                  Rml::Variant* result) {
  if (key_count != 2) {
    Nan::ThrowTypeError("Scalar Variant requires only type and value");
    return false;
  }
  v8::Local<v8::Value> value;
  if (!Nan::Get(object, Nan::New("value").ToLocalChecked()).ToLocal(&value)) {
    return false;
  }
  if (tag == "int64" || tag == "uint64") {
    if (!value->IsBigInt()) {
      Nan::ThrowTypeError("64-bit scalar Variant requires a BigInt");
      return false;
    }
    bool lossless = false;
    if (tag == "int64") {
      *result = value.As<v8::BigInt>()->Int64Value(&lossless);
    } else {
      *result = value.As<v8::BigInt>()->Uint64Value(&lossless);
    }
    if (!lossless) {
      Nan::ThrowRangeError("Scalar Variant exceeds the native 64-bit range");
    }
    return lossless;
  }
  if (!value->IsNumber()) {
    Nan::ThrowTypeError("Numeric scalar Variant requires a number");
    return false;
  }
  const double number = Nan::To<double>(value).FromJust();
  double lower = -std::numeric_limits<double>::max();
  double upper = std::numeric_limits<double>::max();
  if (tag == "byte") {
    lower = 0;
    upper = std::numeric_limits<Rml::byte>::max();
  } else if (tag == "char") {
    lower = std::numeric_limits<char>::min();
    upper = std::numeric_limits<char>::max();
  } else if (tag == "int") {
    lower = std::numeric_limits<int>::min();
    upper = std::numeric_limits<int>::max();
  } else if (tag == "uint") {
    lower = 0;
    upper = std::numeric_limits<unsigned>::max();
  } else if (tag == "float") {
    lower = -std::numeric_limits<float>::max();
    upper = std::numeric_limits<float>::max();
  }
  const bool integer = tag != "float" && tag != "double";
  if (!std::isfinite(number) || number < lower || number > upper ||
      (integer && std::trunc(number) != number)) {
    Nan::ThrowRangeError("Scalar Variant requires a finite number in range");
    return false;
  }
  if (tag == "byte") {
    *result = static_cast<Rml::byte>(number);
  } else if (tag == "char") {
    *result = static_cast<char>(number);
  } else if (tag == "int") {
    *result = static_cast<int>(number);
  } else if (tag == "uint") {
    *result = static_cast<unsigned>(number);
  } else if (tag == "float") {
    *result = static_cast<float>(number);
  } else {
    *result = number;
  }
  return true;
}

bool ObjectFromJs(v8::Local<v8::Object> object, Rml::Variant* result) {
  if (IsScriptObjectVariant(object)) {
    return ScriptVariantFromHandle(object, result);
  }

  if (IsObjectVariant(object)) {
    return ObjectVariantFromJs(object, result);
  }

  if (OwnedVariantHandle::TryFrom(object)) {
    if (auto* state = OwnedVariantOf(object)) {
      *result = state->value;
      return true;
    }
    return false;
  }

  if (ElementHandle::TryFrom(object)) {
    auto* element = ElementOf(object);
    if (!element) {
      return false;
    }
    ElementVariantFromNative(element, result);
    return true;
  }

  if (ContextHandle::TryFrom(object) || EventHandle::TryFrom(object)) {
    return ScriptVariantFromHandle(object, result);
  }

  v8::Local<v8::Array> keys;
  v8::Local<v8::Value> type;
  if (!Nan::GetOwnPropertyNames(object).ToLocal(&keys) ||
      !Nan::Get(object, Nan::New("type").ToLocalChecked()).ToLocal(&type)) {
    return false;
  }

  if (type->IsString()) {
    Nan::Utf8String name(type);
    const std::string tag(*name, name.length());
    if (tag == "voidptr") {
      v8::Local<v8::Value> value;
      if (keys->Length() != 2 ||
          !Nan::Get(object, Nan::New("value").ToLocalChecked())
               .ToLocal(&value)) {
        Nan::ThrowTypeError("Opaque pointer Variant requires type and value");
        return false;
      }

      return ObjectVariantFromJs(value, result);
    }

    if (tag == "scriptinterface") {
      v8::Local<v8::Value> value;
      if (keys->Length() != 2 ||
          !Nan::Get(object, Nan::New("value").ToLocalChecked())
               .ToLocal(&value)) {
        Nan::ThrowTypeError(
            "ScriptInterface Variant requires only type and value");
        return false;
      }

      if (value->IsNull()) {
        *result = static_cast<Rml::ScriptInterface*>(nullptr);
        return true;
      }

      if (ElementHandle::TryFrom(value)) {
        auto* element = ElementOf(value);
        if (!element) {
          return false;
        }
        ElementVariantFromNative(element, result);
        return true;
      }

      return ScriptVariantFromHandle(value, result);
    }

    if (tag == "character") {
      v8::Local<v8::Value> value;
      if (keys->Length() != 2 ||
          !Nan::Get(object, Nan::New("value").ToLocalChecked())
               .ToLocal(&value)) {
        Nan::ThrowTypeError("Character Variant requires only type and value");
        return false;
      }
      if (!value->IsUint32()) {
        Nan::ThrowRangeError("Character Variant requires a uint32 integer");
        return false;
      }
      *result =
          static_cast<Rml::Character>(Nan::To<uint32_t>(value).FromJust());
      return true;
    }
    if (tag == "byte" || tag == "char" || tag == "float" || tag == "double" ||
        tag == "int" || tag == "uint" || tag == "int64" || tag == "uint64") {
      return ScalarFromJs(object, tag, keys->Length(), result);
    }
    if (tag == "decorators") {
      return EffectValueFromJs(object, Rml::Variant::DECORATORSPTR, result);
    }
    if (tag == "filters") {
      return EffectValueFromJs(object, Rml::Variant::FILTERSPTR, result);
    }
    if (tag == "fonteffects") {
      return EffectValueFromJs(object, Rml::Variant::FONTEFFECTSPTR, result);
    }
    if (tag == "transitionlist") {
      Rml::TransitionList value;
      if (!TransitionsFromJs(object, &value)) {
        return false;
      }
      *result = std::move(value);
      return true;
    }
    if (tag == "animationlist") {
      Rml::AnimationList value;
      if (!AnimationsFromJs(object, &value)) {
        return false;
      }
      *result = std::move(value);
      return true;
    }
    if (tag == "transform") {
      Rml::TransformPtr value;
      if (!TransformFromJs(object, &value)) {
        return false;
      }
      *result = std::move(value);
      return true;
    }
    if (tag == "colorstoplist") {
      Rml::ColorStopList values;
      if (!ColorStopsFromJs(object, &values)) {
        return false;
      }
      *result = std::move(values);
      return true;
    }
    if (tag == "boxshadowlist") {
      Rml::BoxShadowList values;
      if (!BoxShadowsFromJs(object, &values)) {
        return false;
      }
      *result = std::move(values);
      return true;
    }
    if ((tag != "colourb" && tag != "colourf") || keys->Length() != 5) {
      Nan::ThrowTypeError("Unsupported tagged Variant");
      return false;
    }
    const char* names[] = {"red", "green", "blue", "alpha"};
    std::array<double, 4> values{};
    for (size_t i = 0; i < values.size(); ++i) {
      if (!ReadComponent(object, names[i], &values[i])) {
        return false;
      }
      if (tag == "colourb" && (values[i] < 0 || values[i] > 255 ||
                               std::trunc(values[i]) != values[i])) {
        Nan::ThrowRangeError("Byte colour Variant requires integers 0..255");
        return false;
      }
    }
    if (tag == "colourb") {
      *result = Rml::Colourb(static_cast<Rml::byte>(values[0]),
                             static_cast<Rml::byte>(values[1]),
                             static_cast<Rml::byte>(values[2]),
                             static_cast<Rml::byte>(values[3]));
    } else {
      *result = Rml::Colourf(static_cast<float>(values[0]),
                             static_cast<float>(values[1]),
                             static_cast<float>(values[2]),
                             static_cast<float>(values[3]));
    }
    return true;
  }
  const auto count = keys->Length();
  if (!type->IsUndefined() || count < 2 || count > 4 || object->IsArray()) {
    Nan::ThrowTypeError("Unsupported object Variant");
    return false;
  }
  const char* names[] = {"x", "y", "z", "w"};
  float values[4]{};
  for (uint32_t i = 0; i < count; ++i) {
    double component;
    if (!ReadComponent(object, names[i], &component)) {
      return false;
    }
    values[i] = static_cast<float>(component);
  }
  if (count == 2) {
    *result = Rml::Vector2f(values[0], values[1]);
  } else if (count == 3) {
    *result = Rml::Vector3f(values[0], values[1], values[2]);
  } else {
    *result = Rml::Vector4f(values[0], values[1], values[2], values[3]);
  }
  return true;
}

bool CheckIntegerConversion(const Rml::Variant* value,
                            Rml::Variant::Type destination) {
  if (!value ||
      (destination != Rml::Variant::BYTE && destination != Rml::Variant::INT &&
       destination != Rml::Variant::UINT &&
       destination != Rml::Variant::INT64 &&
       destination != Rml::Variant::UINT64)) {
    return true;
  }
  const bool is_signed =
      destination == Rml::Variant::INT || destination == Rml::Variant::INT64;
  double lower = 0;
  double upper = 0;
  switch (destination) {
    case Rml::Variant::BYTE:
      upper = 0x1p8;
      break;
    case Rml::Variant::INT:
      lower = -0x1p31;
      upper = 0x1p31;
      break;
    case Rml::Variant::UINT:
      upper = 0x1p32;
      break;
    case Rml::Variant::INT64:
      lower = -0x1p63;
      upper = 0x1p63;
      break;
    case Rml::Variant::UINT64:
      upper = 0x1p64;
      break;
    default:
      return true;
  }
  if (value->GetType() == Rml::Variant::DOUBLE ||
      value->GetType() == Rml::Variant::FLOAT) {
    // Upstream has no floating-point-to-byte converter.
    if (destination == Rml::Variant::BYTE) {
      return true;
    }
    const double number = value->Get<double>();
    if (!std::isfinite(number) || number < lower || number >= upper) {
      Nan::ThrowRangeError("Variant number exceeds the integer range");
      return false;
    }
  } else if (value->GetType() == Rml::Variant::STRING) {
    // Preserve scanf's decimal prefix grammar, but guard overflow first.
    const auto text = value->Get<Rml::String>();
    errno = 0;
    bool outside = false;
    if (is_signed) {
      const auto parsed = std::strtoll(text.c_str(), nullptr, 10);
      outside = destination == Rml::Variant::INT &&
                (parsed < std::numeric_limits<int>::min() ||
                 parsed > std::numeric_limits<int>::max());
    } else {
      const auto parsed = std::strtoull(text.c_str(), nullptr, 10);
      const char* prefix = text.c_str();
      while (std::isspace(static_cast<unsigned char>(*prefix))) {
        ++prefix;
      }
      // scanf's unsigned grammar accepts a leading minus. Preserve in-range
      // negative magnitudes while guarding overflow before the narrow scan.
      const uint64_t magnitude = *prefix == '-' ? uint64_t{0} - parsed : parsed;
      outside = destination != Rml::Variant::UINT64 &&
                magnitude >= static_cast<uint64_t>(upper);
    }
    if (errno == ERANGE || outside) {
      Nan::ThrowRangeError("Variant string exceeds the integer range");
      return false;
    }
  }
  return true;
}

}  // namespace

void ElementVariantFromNative(Rml::Element* element, Rml::Variant* result) {
  result->SetScriptInterfaceForBinding(ElementVariantLifetime(element));
}

Rml::Element* GuardedElementVariantPointer(const Rml::Variant& value) {
  if (value.GetType() != Rml::Variant::SCRIPTINTERFACE ||
      !value.HasGuardedScriptInterfaceForBinding()) {
    return nullptr;
  }

  const auto& pointer = value.GetReference<Rml::ScriptInterface*>();
  const auto found = ElementVariantSlots().find(&pointer);
  const auto lifetime =
      found == ElementVariantSlots().end() ? nullptr : found->second.lock();
  if (!lifetime || !pointer || lifetime->pointer != pointer) {
    return nullptr;
  }

  return static_cast<Rml::Element*>(pointer);
}

v8::MaybeLocal<v8::Object> GuardedElementVariantOwner(
    const Rml::Variant& value) {
  if (auto* element = GuardedElementVariantPointer(value)) {
    return WrapElement(element);
  }

  return {};
}

v8::MaybeLocal<v8::Value> ElementVariantToJs(const Rml::Variant& value) {
  if (value.GetType() != Rml::Variant::SCRIPTINTERFACE ||
      !value.GetReference<Rml::ScriptInterface*>()) {
    return Nan::Null();
  }

  if (auto* element = GuardedElementVariantPointer(value)) {
    return WrapElement(element);
  }

  // Registered Context, Event and external script sources are valid values
  // but not elements. Unknown slots must fail before inspecting the pointee.
  v8::Local<v8::Object> owner;
  if (!ScriptVariantOwner(value).ToLocal(&owner)) {
    return {};
  }

  return Nan::Null();
}

bool HasElementVariantLifetimes() {
  return ElementVariantLifetimes() != 0;
}

bool CheckVariantIntegerConversion(const Rml::Variant* value,
                                   Rml::Variant::Type destination) {
  return CheckIntegerConversion(value, destination);
}

bool VariantWithDefault(const Rml::Variant* value,
                        const Rml::Variant& fallback,
                        Rml::Variant* result) {
  return ConvertVariantStorage(value, fallback, false, result);
}

v8::MaybeLocal<v8::Value> VariantToJs(const Rml::Variant& value) {
  RecordDiagnosticVariantToJs();
  switch (value.GetType()) {
    case Rml::Variant::NONE:
      return Nan::Null();
    case Rml::Variant::BOOL:
      return Nan::New(value.GetReference<bool>());
    case Rml::Variant::BYTE:
      return Nan::New(value.GetReference<Rml::byte>());
    case Rml::Variant::CHAR:
      return Nan::New(static_cast<int>(value.GetReference<char>()));
    case Rml::Variant::INT:
      return Nan::New(value.GetReference<int>());
    case Rml::Variant::UINT:
      return Nan::New(value.GetReference<unsigned>());
    case Rml::Variant::INT64:
      return v8::BigInt::New(v8::Isolate::GetCurrent(),
                             value.GetReference<int64_t>());
    case Rml::Variant::UINT64:
      return v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(),
                                         value.GetReference<uint64_t>());
    case Rml::Variant::FLOAT:
      return Nan::New(value.GetReference<float>());
    case Rml::Variant::DOUBLE:
      return Nan::New(value.GetReference<double>());
    case Rml::Variant::STRING:
      return Nan::New(value.GetReference<Rml::String>()).ToLocalChecked();
    case Rml::Variant::VECTOR2:
      return VectorToJs<Rml::Vector2f, 2>(value.GetReference<Rml::Vector2f>());
    case Rml::Variant::VECTOR3:
      return VectorToJs<Rml::Vector3f, 3>(value.GetReference<Rml::Vector3f>());
    case Rml::Variant::VECTOR4:
      return VectorToJs<Rml::Vector4f, 4>(value.GetReference<Rml::Vector4f>());
    case Rml::Variant::COLOURB:
      return ColourToJs(value.GetReference<Rml::Colourb>(), "colourb");
    case Rml::Variant::COLOURF:
      return ColourToJs(value.GetReference<Rml::Colourf>(), "colourf");
    case Rml::Variant::COLORSTOPLIST:
      return ColorStopsToJs(value.GetReference<Rml::ColorStopList>());
    case Rml::Variant::BOXSHADOWLIST:
      return BoxShadowsToJs(value.GetReference<Rml::BoxShadowList>());
    case Rml::Variant::TRANSFORMPTR:
      return TransformToJs(value.GetReference<Rml::TransformPtr>());
    case Rml::Variant::TRANSITIONLIST:
      return TransitionsToJs(value.GetReference<Rml::TransitionList>());
    case Rml::Variant::ANIMATIONLIST:
      return AnimationsToJs(value.GetReference<Rml::AnimationList>());
    case Rml::Variant::DECORATORSPTR:
    case Rml::Variant::FILTERSPTR:
    case Rml::Variant::FONTEFFECTSPTR:
      return EffectValueToJs(value);
    case Rml::Variant::SCRIPTINTERFACE:
      return ScriptVariantToJs(value);
    case Rml::Variant::VOIDPTR:
      return ObjectVariantToJs(value);
    default:
      break;
  }
  Nan::ThrowTypeError("Unsupported native Variant; a typed owner is required");
  return {};
}

bool VariantFromJs(v8::Local<v8::Value> value, Rml::Variant* result) {
  if (value->IsNull()) {
    result->Clear();
  } else if (value->IsBoolean()) {
    *result = value->IsTrue();
  } else if (value->IsNumber()) {
    *result = Nan::To<double>(value).FromJust();
  } else if (value->IsBigInt()) {
    auto bigint = value.As<v8::BigInt>();
    bool lossless = false;
    const auto signed_value = bigint->Int64Value(&lossless);
    if (lossless) {
      *result = signed_value;
      return true;
    }
    const auto unsigned_value = bigint->Uint64Value(&lossless);
    if (!lossless) {
      Nan::ThrowRangeError("Variant BigInt exceeds the native 64-bit range");
      return false;
    }
    *result = unsigned_value;
  } else if (value->IsString()) {
    Nan::Utf8String text(value);
    *result = Rml::String(*text, text.length());
  } else if (value->IsObject()) {
    return ObjectFromJs(value.As<v8::Object>(), result);
  } else {
    Nan::ThrowTypeError("Unsupported JavaScript Variant");
    return false;
  }
  return true;
}

bool DictionaryFromJs(v8::Local<v8::Value> value, Rml::Dictionary* result) {
  if (!value->IsObject() || value->IsArray()) {
    Nan::ThrowTypeError("Expected a Variant dictionary");
    return false;
  }
  const auto object = value.As<v8::Object>();
  std::vector<std::pair<Rml::String, v8::Local<v8::Value>>> elements;
  v8::Local<v8::Array> keys;
  if (!Nan::GetOwnPropertyNames(object).ToLocal(&keys)) {
    return false;
  }
  for (uint32_t i = 0; i < keys->Length(); ++i) {
    v8::Local<v8::Value> key;
    v8::Local<v8::Value> entry;
    if (!Nan::Get(keys, i).ToLocal(&key) ||
        !Nan::Get(object, key).ToLocal(&entry)) {
      return false;
    }
    Nan::Utf8String name(key);
    Rml::String parameter_name(*name, name.length());
    if (ElementHandle::TryFrom(entry) || ContextHandle::TryFrom(entry) ||
        EventHandle::TryFrom(entry)) {
      elements.emplace_back(std::move(parameter_name), entry);
      continue;
    }
    Rml::Variant converted;
    if (!VariantFromJs(entry, &converted)) {
      return false;
    }
    result->emplace(std::move(parameter_name), std::move(converted));
  }
  // Resolve element references after all dictionary/vector/colour accessors.
  // Before this point a getter may destroy any referenced document or context.
  // V8 locals keep the handles reachable without retaining native elements.
  for (const auto& [name, handle] : elements) {
    Rml::Variant converted;
    if (!VariantFromJs(handle, &converted)) {
      return false;
    }
    result->emplace(name, std::move(converted));
  }
  return true;
}

}  // namespace sfmlrmlui
