// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cmath>

#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-numeric-value.h"

namespace sfmlrmlui {
namespace {

template <bool length_only>
NAN_METHOD(ResolveNumeric) {
  Rml::NumericValue value;
  float base_value = 0;
  if (!CopyNumericValue(info[1], &value) ||
      (!length_only && !ReadFiniteNumericFloat(info[2], &base_value))) {
    return;
  }
  // RmlUi accepts unit sets as values, but its length/angle arithmetic expects
  // exactly one unit. Reject sets that would reach an upstream assertion.
  const auto applicable = length_only ? Rml::Unit::LENGTH : Rml::Unit::NUMERIC;
  const int bits = static_cast<int>(value.unit);
  if (Rml::Any(value.unit & applicable) && (bits & (bits - 1)) != 0) {
    return Nan::ThrowRangeError("Numeric resolution requires a single unit");
  }
  if (auto* element = ElementOf(info[0])) {
    const float result = length_only
                             ? element->ResolveLength(value)
                             : element->ResolveNumericValue(value, base_value);
    if (!std::isfinite(result)) {
      return Nan::ThrowRangeError("Numeric resolution overflow");
    }
    info.GetReturnValue().Set(result);
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlElementNumeric) {
  SetEffectMethod<ResolveNumeric<true>>(target, "resolveLength");
  SetEffectMethod<ResolveNumeric<false>>(target, "resolveNumericValue");
}

}  // namespace sfmlrmlui
