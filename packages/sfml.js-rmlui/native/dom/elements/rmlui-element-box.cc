// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <limits>

#include "native/dom/elements/rmlui-box.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

bool BoxIndex(v8::Local<v8::Value> value, int* result) {
  if (value->IsInt32()) {
    *result = Nan::To<int>(value).FromJust();
    // Upstream subtracts one before its bounds check.
    if (*result != std::numeric_limits<int>::min()) {
      return true;
    }
  }
  Nan::ThrowRangeError("Expected a box index from -2147483647 to 2147483647");
  return false;
}

NAN_METHOD(GetBox) {
  int index = 0;
  const bool indexed = !info[1]->IsUndefined();
  if (indexed && !BoxIndex(info[1], &index)) {
    return;
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!indexed) {
    info.GetReturnValue().Set(WrapBox(element->GetBox()));
    return;
  }
  Rml::Vector2f offset;
  auto box = WrapBox(element->GetBox(index, offset));
  v8::Local<v8::Value> position;
  if (!VariantToJs(Rml::Variant(offset)).ToLocal(&position)) {
    return;
  }
  auto result = Nan::New<v8::Object>();
  result
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New("box").ToLocalChecked(), box)
      .FromJust();
  result
      ->CreateDataProperty(Nan::GetCurrentContext(),
                           Nan::New("offset").ToLocalChecked(),
                           position)
      .FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SetBox) {
  Rml::Box box;
  if (!CopyBox(info[1], &box)) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    element->SetBox(box);
  }
}

NAN_METHOD(AddBox) {
  Rml::Box box;
  Rml::Vector2f offset;
  // JS accessors can mutate box views or destroy the element. Read them first,
  // then take an owned finite copy and borrow the checked receiver.
  if (!ReadBoxVector(info[2], &offset) || !CopyBox(info[1], &box)) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    element->AddBox(box, offset);
  }
}

NAN_METHOD(GetRenderBox) {
  if (!info[1]->IsInt32()) {
    return Nan::ThrowRangeError("Invalid render box area");
  }
  const int area = Nan::To<int>(info[1]).FromJust();
  if (area < 1 || area > 3) {
    return Nan::ThrowRangeError("Invalid render box area");
  }
  int index;
  if (!BoxIndex(info[2], &index)) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(WrapRenderBox(
        element->GetRenderBox(static_cast<Rml::BoxArea>(area), index)));
  }
}

NAN_METHOD(GetNumBoxes) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(element->GetNumBoxes());
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlElementBox) {
  SetEffectMethod<GetBox>(target, "getBox");
  SetRuntimeMethod<SetBox, true>(target, "setBox");
  SetRuntimeMethod<AddBox, true>(target, "addBox");
  SetEffectMethod<GetRenderBox>(target, "getRenderBox");
  SetEffectMethod<GetNumBoxes>(target, "getNumBoxes");
}

}  // namespace sfmlrmlui
