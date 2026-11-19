// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/values/rmlui-style-values.h"

#include <RmlUi/Core/ComputedValues.h>
#include <sfml-js-interop.h>

#include <cmath>
#include <memory>
#include <type_traits>

#include "native/values/rmlui-numeric-value.h"

namespace sfmlrmlui {
namespace {

template <typename T>
using StyleHandle = sfmljs::SharedHandle<T>;

void Own(v8::Local<v8::Object> object,
         const char* name,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

bool EnumNumber(v8::Local<v8::Value> input, int maximum, int* value) {
  if (input->IsInt32()) {
    *value = Nan::To<int>(input).FromJust();
    if (*value >= 0 && *value <= maximum) {
      return true;
    }
  }
  Nan::ThrowRangeError("Style enum is outside its valid range");
  return false;
}

template <typename T>
v8::Local<v8::Object> MapValue(T value, const char* kind) {
  auto owner = std::make_shared<T>(value);
  auto result = Nan::New<v8::Object>();
  Own(result, "handle", StyleHandle<T>::Create(owner));
  Own(result, "kind", Nan::New(kind).ToLocalChecked());
  auto number = sfmljs::MapShared(
      v8::Isolate::GetCurrent(), owner, &owner->value, sizeof(float));
  Own(result, "valueView", v8::Float32Array::New(number, 0, 1));
  auto* type = [&] {
    if constexpr (std::is_same_v<T, Rml::Style::LineHeight>) {
      return &owner->inherit_type;
    } else {
      return &owner->type;
    }
  }();
  static_assert(sizeof(*type) == 1);
  auto type_buffer =
      sfmljs::MapShared(v8::Isolate::GetCurrent(), owner, type, sizeof(*type));
  Own(result, "typeView", v8::Uint8Array::New(type_buffer, 0, 1));
  if constexpr (std::is_same_v<T, Rml::Style::LineHeight>) {
    auto inherit = sfmljs::MapShared(
        v8::Isolate::GetCurrent(), owner, &owner->inherit_value, sizeof(float));
    Own(result, "inheritValueView", v8::Float32Array::New(inherit, 0, 1));
  }
  return result;
}

template <typename T, int maximum>
bool CopyValue(v8::Local<v8::Value> input, T* result) {
  auto* handle = StyleHandle<T>::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a matching native style value handle");
    return false;
  }
  const auto& value = *handle->owner();
  const int type = [&] {
    if constexpr (std::is_same_v<T, Rml::Style::LineHeight>) {
      return static_cast<int>(value.inherit_type);
    } else {
      return static_cast<int>(value.type);
    }
  }();
  if (type > maximum) {
    Nan::ThrowRangeError("Style enum is outside its valid range");
    return false;
  }
  bool finite = std::isfinite(value.value);
  if constexpr (std::is_same_v<T, Rml::Style::LineHeight>) {
    finite &= std::isfinite(value.inherit_value);
  }
  if (!finite) {
    Nan::ThrowTypeError("Shared style values must be finite");
    return false;
  }
  *result = value;
  return true;
}

template <typename T, int maximum>
NAN_METHOD(CreateScalar) {
  int type;
  float value;
  if (EnumNumber(info[0], maximum, &type) &&
      ReadFiniteNumericFloat(info[1], &value)) {
    info.GetReturnValue().Set(
        StyleValueToJs(T(static_cast<typename T::Type>(type), value)));
  }
}

NAN_METHOD(CreateLineHeight) {
  float value;
  float inherit;
  int type;
  if (ReadFiniteNumericFloat(info[0], &value) &&
      EnumNumber(info[1], 1, &type) &&
      ReadFiniteNumericFloat(info[2], &inherit)) {
    info.GetReturnValue().Set(StyleValueToJs(Rml::Style::LineHeight(
        value,
        static_cast<Rml::Style::LineHeight::InheritType>(type),
        inherit)));
  }
}

NAN_METHOD(CreateClip) {
  int type;
  if (!EnumNumber(info[0], 3, &type)) {
    return;
  }
  if (!info[1]->IsInt32()) {
    return Nan::ThrowRangeError("Clip number must be in int8 range");
  }
  const int number = Nan::To<int>(info[1]).FromJust();
  if (number < -128 || number > 127) {
    return Nan::ThrowRangeError("Clip number must be in int8 range");
  }
  info.GetReturnValue().Set(StyleValueToJs(Rml::Style::Clip(
      static_cast<Rml::Style::Clip::Type>(type), static_cast<int8_t>(number))));
}

template <typename T, bool use_default>
NAN_METHOD(ResolveStyleValue) {
  T value;
  float base;
  float fallback = 0;
  if (ReadStyleValue(info[0], &value) &&
      ReadFiniteNumericFloat(info[1], &base) &&
      (!use_default || ReadFiniteNumericFloat(info[2], &fallback))) {
    info.GetReturnValue().Set(use_default
                                  ? Rml::ResolveValueOr(value, base, fallback)
                                  : Rml::ResolveValue(value, base));
  }
}

}  // namespace

#define SFMLRMLUI_STYLE_SCALAR(Type, Maximum)                                  \
  v8::Local<v8::Object> StyleValueToJs(Rml::Style::Type value) {               \
    return MapValue(value, #Type);                                             \
  }                                                                            \
  bool ReadStyleValue(v8::Local<v8::Value> handle, Rml::Style::Type* value) {  \
    return CopyValue<Rml::Style::Type, Maximum>(handle, value);                \
  }

SFMLRMLUI_STYLE_SCALAR(LengthPercentageAuto, 2)
SFMLRMLUI_STYLE_SCALAR(LengthPercentage, 1)
SFMLRMLUI_STYLE_SCALAR(NumberAuto, 1)
SFMLRMLUI_STYLE_SCALAR(VerticalAlign, 9)
SFMLRMLUI_STYLE_SCALAR(LineHeight, 1)

#undef SFMLRMLUI_STYLE_SCALAR

v8::Local<v8::Object> StyleValueToJs(Rml::Style::Clip value) {
  auto result = Nan::New<v8::Object>();
  Own(result,
      "handle",
      StyleHandle<Rml::Style::Clip>::Create(
          std::make_shared<Rml::Style::Clip>(value)));
  Own(result, "kind", Nan::New("Clip").ToLocalChecked());
  Own(result, "type", Nan::New(static_cast<int>(value.GetType())));
  Own(result, "number", Nan::New(value.GetNumber()));
  return result;
}

bool ReadStyleValue(v8::Local<v8::Value> input, Rml::Style::Clip* result) {
  auto* handle = StyleHandle<Rml::Style::Clip>::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a native Clip handle");
    return false;
  }
  *result = *handle->owner();
  return true;
}

NAN_MODULE_INIT(InitializeRmlStyleValues) {
  sfmljs::SetMethod<CreateScalar<Rml::Style::LengthPercentageAuto, 2>>(
      target, "createLengthPercentageAuto");
  sfmljs::SetMethod<CreateScalar<Rml::Style::LengthPercentage, 1>>(
      target, "createLengthPercentage");
  sfmljs::SetMethod<CreateScalar<Rml::Style::NumberAuto, 1>>(
      target, "createNumberAuto");
  sfmljs::SetMethod<CreateScalar<Rml::Style::VerticalAlign, 9>>(
      target, "createVerticalAlign");
  sfmljs::SetMethod<CreateLineHeight>(target, "createLineHeight");
  sfmljs::SetMethod<CreateClip>(target, "createClip");
  sfmljs::SetMethod<ResolveStyleValue<Rml::Style::LengthPercentage, false>>(
      target, "resolveLengthPercentage");
  sfmljs::SetMethod<ResolveStyleValue<Rml::Style::LengthPercentageAuto, false>>(
      target, "resolveLengthPercentageAuto");
  sfmljs::SetMethod<ResolveStyleValue<Rml::Style::LengthPercentage, true>>(
      target, "resolveLengthPercentageOr");
  sfmljs::SetMethod<ResolveStyleValue<Rml::Style::LengthPercentageAuto, true>>(
      target, "resolveLengthPercentageAutoOr");
}

}  // namespace sfmlrmlui
