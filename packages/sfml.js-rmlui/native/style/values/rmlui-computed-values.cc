// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/values/rmlui-computed-values.h"

#include <RmlUi/Core/ComputedValues.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <cmath>
#include <memory>
#include <type_traits>

#include "native/animation/rmlui-animation-values.h"
#include "native/fonts/rmlui-font-custom.h"
#include "native/fonts/rmlui-font-handle.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/values/rmlui-style-values.h"
#include "native/style/values/rmlui-transform.h"
#include "native/values/rmlui-numeric-value.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

struct ComputedState {
  Rml::ObserverPtr<Rml::Element> element;
  uint64_t generation{0};
  uint64_t font_generation{0};
  // Absence means the const live value owned by the element.
  std::unique_ptr<Rml::ComputedValues> owned;
};

struct FontFaceToken {
  Rml::FontFaceHandle value{0};
  uint64_t generation{0};
};

using ComputedHandle = sfmljs::SharedHandle<ComputedState>;
using FontFaceHandle = sfmljs::SharedHandle<FontFaceToken>;

template <typename T>
struct StyleEnumLimit;

#include "native/generated/rmlui-style-enums.inc"

ComputedState* ComputedOf(v8::Local<v8::Value> value, bool write = false) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* handle = ComputedHandle::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a ComputedValues handle");
    return nullptr;
  }
  auto* state = handle->owner().get();
  if (state->generation != State().generation || !state->element) {
    Nan::ThrowError("ComputedValues associated element is no longer valid");
    return nullptr;
  }
  if (write && !state->owned) {
    Nan::ThrowTypeError("Element computed values are read-only");
    return nullptr;
  }
  return state;
}

const Rml::ComputedValues& ValueOf(const ComputedState& state) {
  return state.owned ? *state.owned : state.element->GetComputedValues();
}

template <bool owned>
NAN_METHOD(CreateComputed) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto state = std::make_shared<ComputedState>();
  state->element = element->GetObserverPtr();
  state->generation = State().generation;
  if constexpr (owned) {
    state->owned = std::make_unique<Rml::ComputedValues>(element);
  }
  info.GetReturnValue().Set(ComputedHandle::Create(state));
}

template <bool inherited>
NAN_METHOD(CopyComputed) {
  auto* target = ComputedOf(info[0], true);
  if (!target) {
    return;
  }
  if (auto* source = ComputedOf(info[1])) {
    if constexpr (inherited) {
      target->owned->CopyInherited(ValueOf(*source));
      target->font_generation =
          source->owned ? source->font_generation : State().font_generation;
    } else {
      target->owned->CopyNonInherited(ValueOf(*source));
    }
  }
}

template <typename T>
v8::Local<v8::Value> ToComputedJs(const T& value) {
  if constexpr (std::is_enum_v<T>) {
    return Nan::New(static_cast<int>(value));
  } else if constexpr (std::is_same_v<T, bool> || std::is_same_v<T, float>) {
    return Nan::New(value);
  } else if constexpr (std::is_same_v<T, Rml::String>) {
    return Nan::New(value).ToLocalChecked();
  } else {
    return StyleValueToJs(value);
  }
}

v8::Local<v8::Value> ToComputedJs(Rml::Colourb value) {
  return VariantToJs(Rml::Variant(value)).ToLocalChecked();
}

v8::Local<v8::Value> ToComputedJs(Rml::FontFaceHandle value) {
  if (!value) {
    return Nan::Null();
  }
  v8::Local<v8::Value> custom;
  if (CustomFontFaceToJs(value).ToLocal(&custom)) {
    return custom;
  }
  auto token = std::make_shared<FontFaceToken>();
  token->value = value;
  token->generation = State().font_generation;
  return FontFaceHandle::Create(token);
}

v8::Local<v8::Value> ToComputedJs(const Rml::CornerSizes& values) {
  auto array = Nan::New<v8::Array>(4);
  for (uint32_t i = 0; i < 4; ++i) {
    array->CreateDataProperty(Nan::GetCurrentContext(), i, Nan::New(values[i]))
        .FromJust();
  }
  return array;
}

v8::Local<v8::Value> ToComputedJs(const Rml::TransformPtr& value) {
  return value ? v8::Local<v8::Value>(TransformToJs(value))
               : v8::Local<v8::Value>(Nan::Null());
}

v8::Local<v8::Value> ToComputedJs(const Rml::AnimationList* value) {
  return value ? v8::Local<v8::Value>(AnimationsToJs(*value))
               : v8::Local<v8::Value>(Nan::Null());
}

v8::Local<v8::Value> ToComputedJs(const Rml::TransitionList* value) {
  return value ? v8::Local<v8::Value>(TransitionsToJs(*value))
               : v8::Local<v8::Value>(Nan::Null());
}

template <typename T>
bool ReadComputed(v8::Local<v8::Value> value, T* result) {
  if constexpr (std::is_enum_v<T>) {
    if (value->IsInt32()) {
      const int number = Nan::To<int>(value).FromJust();
      if (number >= 0 && number <= StyleEnumLimit<T>::kMaximum) {
        *result = static_cast<T>(number);
        return true;
      }
    }
    Nan::ThrowRangeError("Computed style enum is outside its valid range");
    return false;
  } else {
    return ReadStyleValue(value, result);
  }
}

bool ReadComputed(v8::Local<v8::Value> value, float* result) {
  return ReadFiniteNumericFloat(value, result);
}

bool ReadComputed(v8::Local<v8::Value> value, int16_t* result) {
  if (value->IsInt32()) {
    const int number = Nan::To<int>(value).FromJust();
    if (number >= -32768 && number <= 32767) {
      *result = static_cast<int16_t>(number);
      return true;
    }
  }
  Nan::ThrowRangeError("Computed border width must be in int16 range");
  return false;
}

bool ReadComputed(v8::Local<v8::Value> value, bool* result) {
  if (!value->IsBoolean()) {
    Nan::ThrowTypeError("Expected a computed boolean");
    return false;
  }
  *result = value->IsTrue();
  return true;
}

bool ReadComputed(v8::Local<v8::Value> value, Rml::String* result) {
  if (!value->IsString()) {
    Nan::ThrowTypeError("Expected a computed string");
    return false;
  }
  Nan::Utf8String text(value);
  result->assign(*text, text.length());
  return true;
}

bool ReadComputed(v8::Local<v8::Value> value, Rml::Colourb* result) {
  Rml::Variant converted;
  if (!VariantFromJs(value, &converted)) {
    return false;
  }
  if (converted.GetType() != Rml::Variant::COLOURB) {
    Nan::ThrowTypeError("Expected a colourb value");
    return false;
  }
  *result = converted.Get<Rml::Colourb>();
  return true;
}

bool ReadComputed(v8::Local<v8::Value> value, Rml::FontFaceHandle* result) {
  return ReadFontFace(value, result);
}

template <auto getter>
NAN_METHOD(ComputedGet) {
  if (auto* state = ComputedOf(info[0])) {
    const auto& value = (ValueOf(*state).*getter)();
    if constexpr (std::is_same_v<std::decay_t<decltype(value)>,
                                 Rml::FontFaceHandle>) {
      v8::Local<v8::Value> result;
      const auto generation =
          state->owned ? state->font_generation : State().font_generation;
      if (WrapFontFace(value, generation).ToLocal(&result)) {
        info.GetReturnValue().Set(result);
      }
    } else {
      info.GetReturnValue().Set(ToComputedJs(value));
    }
  }
}

template <typename T, auto setter, bool narrow = false>
NAN_METHOD(ComputedSet) {
  T value;
  if (!ReadComputed(info[1], &value)) {
    return;
  }
  if constexpr (narrow) {
    if (std::trunc(value) < -32768 || std::trunc(value) > 32767) {
      return Nan::ThrowRangeError("Computed radius must be in int16 range");
    }
  }
  // ReadComputed may run user colour accessors; only now resolve the receiver.
  if (auto* state = ComputedOf(info[0], true)) {
    (state->owned.get()->*setter)(value);
    if constexpr (std::is_same_v<T, Rml::FontFaceHandle>) {
      state->font_generation = State().font_generation;
    }
  }
}

NAN_METHOD(GetFontFace) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(ToComputedJs(element->GetFontFaceHandle()));
  }
}

}  // namespace

const Rml::ComputedValues* ReadComputedValues(v8::Local<v8::Value> handle) {
  if (handle->IsNull()) {
    return nullptr;
  }
  auto* state = ComputedOf(handle);
  if (state && state->owned && state->owned->font_face_handle() &&
      state->font_generation != State().font_generation) {
    Nan::ThrowError("ComputedValues contains an expired font face handle");
    return nullptr;
  }
  return state ? &ValueOf(*state) : nullptr;
}

Rml::ComputedValues* WriteComputedValues(v8::Local<v8::Value> handle,
                                         Rml::Element* element) {
  auto* state = ComputedOf(handle, true);
  if (!state) {
    return nullptr;
  }
  if (state->element.get() != element) {
    Nan::ThrowTypeError("ComputedValues must be associated with this element");
    return nullptr;
  }
  if (state->owned->font_face_handle() &&
      state->font_generation != State().font_generation) {
    Nan::ThrowError("Clear the expired ComputedValues font face handle first");
    return nullptr;
  }
  return state->owned.get();
}

void MarkComputedFontGeneration(v8::Local<v8::Value> handle) {
  if (auto* state = ComputedOf(handle, true)) {
    state->font_generation = State().font_generation;
  }
}

v8::MaybeLocal<v8::Value> WrapFontFace(Rml::FontFaceHandle value,
                                       uint64_t generation) {
  if (!value) {
    return Nan::Null();
  }
  RuntimeScope scope(true, true);
  if (!scope) {
    return {};
  }
  if (generation != State().font_generation) {
    Nan::ThrowError("Font face handle is no longer valid");
    return {};
  }
  return ToComputedJs(value);
}

bool ReadFontFace(v8::Local<v8::Value> input,
                  Rml::FontFaceHandle* value,
                  uint64_t* generation) {
  if (input->IsNull()) {
    *value = 0;
    if (generation) {
      *generation = 0;
    }
    return true;
  }
  if (IsCustomFontFace(input)) {
    RuntimeScope scope(true, true);
    return scope && ReadCustomFontFace(input, value, generation);
  }
  auto* handle = FontFaceHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an opaque font face handle or null");
    return false;
  }
  RuntimeScope scope(true, true);
  if (!scope) {
    return false;
  }
  if (handle->owner()->generation != State().font_generation) {
    Nan::ThrowError("Font face handle is no longer valid");
    return false;
  }
  *value = handle->owner()->value;
  if (generation) {
    *generation = handle->owner()->generation;
  }
  return true;
}

NAN_MODULE_INIT(InitializeRmlComputedValues) {
  SetRuntimeMethod<CreateComputed<true>, true>(target, "createComputedValues");
  SetRuntimeMethod<CreateComputed<false>, true>(target, "getComputedValues");
  SetRuntimeMethod<CopyComputed<true>, true>(target, "computedCopyInherited");
  SetRuntimeMethod<CopyComputed<false>, true>(target,
                                              "computedCopyNonInherited");
  SetRuntimeMethod<GetFontFace, true>(target, "getFontFaceHandle");
  SetRuntimeMethod<ComputedSet<bool, &Rml::ComputedValues::has_letter_spacing>,
                   true>(target, "computedSetHasLetterSpacing");
#include "native/generated/rmlui-computed-fields.inc"
}

}  // namespace sfmlrmlui
