// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_VARIANT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_VARIANT_H_

#include <RmlUi/Core/Dictionary.h>
#include <RmlUi/Core/Variant.h>
#include <nan.h>

#include <array>

namespace sfmlrmlui {

// Share the same observer slot for native Lua and JS element sources.
void ElementVariantFromNative(Rml::Element* element, Rml::Variant* result);

// Resolve only a registered element slot. This does not inspect the pointee,
// allocate V8 handles, or invoke JS; foreign and expired slots return nullptr.
Rml::Element* GuardedElementVariantPointer(const Rml::Variant& value);

// Read a registered element, or null for other valid stored types. A non-null
// ScriptInterface must have its registered owner before it can be narrowed.
v8::MaybeLocal<v8::Value> ElementVariantToJs(const Rml::Variant& value);

// Resolve the registered element slot before inspecting a native pointer.
v8::MaybeLocal<v8::Object> GuardedElementVariantOwner(
    const Rml::Variant& value);

// Template destinations need not be Variant storage types. In particular,
// integer vectors cannot be Set(), while enum Character is stored as INT64.
struct VariantSelector {
  enum class Destination {
    kStored,
    kVector2i,
    kVector3i,
    kVector4i,
    kCharacter
  };
  Destination destination{Destination::kStored};
  Rml::Variant fallback;
  std::array<int, 4> integers{};
  Rml::Character character{Rml::Character::Null};
};

bool VariantSelectorFromJs(v8::Local<v8::Value> value, VariantSelector* result);
// A false GetInto result can still mutate a vector prefix. The optional
// success output reports the native boolean independently from that value.
v8::MaybeLocal<v8::Value> ConvertVariantToJs(const Rml::Variant* value,
                                             const VariantSelector& selector,
                                             bool zero_default = false,
                                             bool* converted = nullptr);
bool CheckVariantIntegerConversion(const Rml::Variant* value,
                                   Rml::Variant::Type destination);
// Reject pointer text before native string conversion. Nested effects visit
// only properties used by the serializer; scalar values require no traversal.
bool CheckVariantStringConversion(const Rml::Variant& value);
bool ConvertVariantStorage(const Rml::Variant* value,
                           const Rml::Variant& fallback,
                           bool zero_default,
                           Rml::Variant* result,
                           bool* converted = nullptr);

// Shared conversion boundary. Unsupported native owners fail explicitly;
// subsequent typed style bindings extend this switch without string fallbacks.
v8::MaybeLocal<v8::Value> VariantToJs(const Rml::Variant& value);
bool VariantFromJs(v8::Local<v8::Value> value, Rml::Variant* result);
// Constant-time check; numerical frames never enter pointer owner traversal.
bool HasElementVariantLifetimes();
// Uses the same GetInto/default semantics as Element::GetAttribute<T> and
// Event::GetParameter<T>, with guards before undefined native integer casts.
bool VariantWithDefault(const Rml::Variant* value,
                        const Rml::Variant& fallback,
                        Rml::Variant* result);
// Resolves element parameters only after every user accessor. Callers must
// likewise resolve their receiver after conversion and make no further JS calls
// before using the resulting borrowed native references.
bool DictionaryFromJs(v8::Local<v8::Value> value, Rml::Dictionary* result);
// Persistent attributes share guarded element lifetime slots.
bool ReadElementAttributes(v8::Local<v8::Value> value, Rml::Dictionary* result);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_VARIANT_H_
