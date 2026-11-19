// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/values/rmlui-numeric-value.h"

#include <sfml-js-interop.h>

#include <cmath>
#include <cstdint>
#include <limits>
#include <memory>
#include <type_traits>

namespace sfmlrmlui {
namespace {

using NumericHandle = sfmljs::SharedHandle<Rml::NumericValue>;
constexpr int kAllUnitBits =
    (static_cast<int>(Rml::Unit::SHORTHAND_PLACEHOLDER) << 1) - 1;
static_assert(std::is_same_v<std::underlying_type_t<Rml::Unit>, int>);
static_assert(sizeof(int) == sizeof(int32_t));

void Own(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

bool ValidUnit(int unit) {
  if (unit < 0 || (unit & ~kAllUnitBits) != 0) {
    Nan::ThrowRangeError("Expected RmlUi unit bits from Unit");
    return false;
  }
  return true;
}

NAN_METHOD(CreateNumericValue) {
  Rml::NumericValue value;
  if ((!info[0]->IsUndefined() &&
       !ReadFiniteNumericFloat(info[0], &value.number)) ||
      (!info[1]->IsUndefined() && !ReadUnit(info[1], &value.unit))) {
    return;
  }
  info.GetReturnValue().Set(WrapNumericValue(value));
}

NAN_METHOD(CloneNumericValue) {
  Rml::NumericValue value;
  if (CopyNumericValue(info[0], &value)) {
    info.GetReturnValue().Set(WrapNumericValue(value));
  }
}

template <bool negate>
NAN_METHOD(NumericValueCompare) {
  Rml::NumericValue value;
  Rml::NumericValue other;
  if (CopyNumericValue(info[0], &value) && CopyNumericValue(info[1], &other)) {
    info.GetReturnValue().Set(negate ? value != other : value == other);
  }
}

}  // namespace

bool ReadFiniteNumericFloat(v8::Local<v8::Value> value, float* result) {
  if (value->IsNumber()) {
    const double number = Nan::To<double>(value).FromJust();
    if (std::isfinite(number) &&
        std::abs(number) <= std::numeric_limits<float>::max()) {
      *result = static_cast<float>(number);
      return true;
    }
  }
  Nan::ThrowTypeError("Expected a finite NumericValue float");
  return false;
}

bool ReadUnit(v8::Local<v8::Value> value, Rml::Unit* result) {
  if (!value->IsInt32()) {
    Nan::ThrowRangeError("Expected RmlUi unit bits from Unit");
    return false;
  }
  const int unit = Nan::To<int>(value).FromJust();
  if (!ValidUnit(unit)) {
    return false;
  }
  *result = static_cast<Rml::Unit>(unit);
  return true;
}

bool CopyNumericValue(v8::Local<v8::Value> handle, Rml::NumericValue* result) {
  auto* checked = NumericHandle::From(handle);
  if (!checked) {
    return false;
  }
  const auto value = *checked->owner();
  if (!std::isfinite(value.number)) {
    Nan::ThrowTypeError("NumericValue shared number must be finite");
    return false;
  }
  if (!ValidUnit(static_cast<int>(value.unit))) {
    return false;
  }
  *result = value;
  return true;
}

v8::Local<v8::Object> WrapNumericValue(Rml::NumericValue value) {
  const auto owner = std::make_shared<Rml::NumericValue>(value);
  auto* isolate = v8::Isolate::GetCurrent();
  const auto number_buffer =
      sfmljs::MapShared(isolate, owner, &owner->number, sizeof(owner->number));
  const auto unit_buffer =
      sfmljs::MapShared(isolate, owner, &owner->unit, sizeof(owner->unit));
  auto result = Nan::New<v8::Object>();
  Own(result, "handle", NumericHandle::Create(owner));
  Own(result, "numberView", v8::Float32Array::New(number_buffer, 0, 1));
  Own(result, "unitView", v8::Int32Array::New(unit_buffer, 0, 1));
  return result;
}

NAN_MODULE_INIT(InitializeRmlNumericValue) {
  sfmljs::SetMethod<CreateNumericValue>(target, "createNumericValue");
  sfmljs::SetMethod<CloneNumericValue>(target, "cloneNumericValue");
  sfmljs::SetMethod<NumericValueCompare<false>>(target, "numericValueEquals");
  sfmljs::SetMethod<NumericValueCompare<true>>(target, "numericValueNotEquals");
}

}  // namespace sfmlrmlui
