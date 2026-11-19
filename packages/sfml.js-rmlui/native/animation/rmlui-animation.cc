// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/StyleSheetSpecification.h>

#include "native/animation/rmlui-tween.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-property.h"
#include "native/values/rmlui-numeric-value.h"

namespace sfmlrmlui {
namespace {

bool ReadAnimationId(v8::Local<v8::Value> value, Rml::PropertyId* id) {
  if (value->IsString()) {
    Nan::Utf8String text(value);
    *id = Rml::StyleSheetSpecification::GetPropertyId(
        Rml::String(*text, text.length()));
    return true;
  }
  return ReadPropertyId(value, id);
}

bool ReadDuration(v8::Local<v8::Value> value, float* duration) {
  if (!ReadFiniteNumericFloat(value, duration)) {
    return false;
  }
  if (*duration < 0) {
    Nan::ThrowRangeError("Animation duration must be nonnegative");
    return false;
  }
  return true;
}

template <bool append>
NAN_METHOD(Animate) {
  Rml::PropertyId id;
  Rml::Property target;
  Rml::Property start;
  Rml::Tween tween;
  float duration;
  float delay = 0;
  int iterations = 1;
  bool alternate = true;
  const bool has_start =
      !append && !info[8]->IsUndefined() && !info[8]->IsNull();
  if (!ReadAnimationId(info[1], &id) || !CopyProperty(info[2], &target) ||
      !ValidatePropertyStorage(target) || !ReadDuration(info[3], &duration) ||
      (!info[4]->IsUndefined() && !CopyTween(info[4], &tween))) {
    return;
  }
  if constexpr (!append) {
    if ((!info[5]->IsUndefined() &&
         !ReadPropertyInteger(info[5], &iterations)) ||
        (!info[7]->IsUndefined() && !ReadFiniteNumericFloat(info[7], &delay)) ||
        (has_start &&
         (!CopyProperty(info[8], &start) || !ValidatePropertyStorage(start)))) {
      return;
    }
    if (!info[6]->IsUndefined()) {
      if (!info[6]->IsBoolean()) {
        return Nan::ThrowTypeError("Expected an alternate-direction boolean");
      }
      alternate = info[6]->IsTrue();
    }
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  AttachTween(&tween, element);
  if constexpr (append) {
    info.GetReturnValue().Set(
        element->AddAnimationKey(id, target, duration, tween));
  } else {
    info.GetReturnValue().Set(element->Animate(id,
                                               target,
                                               duration,
                                               tween,
                                               iterations,
                                               alternate,
                                               delay,
                                               has_start ? &start : nullptr));
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlAnimation) {
  SetRuntimeMethod<Animate<false>, true>(target, "animate");
  SetRuntimeMethod<Animate<true>, true>(target, "addAnimationKey");
}

}  // namespace sfmlrmlui
