// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/values/rmlui-transform.h"

#include <sfml-js-interop.h>

#include <memory>
#include <utility>

#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-property.h"

namespace sfmlrmlui {
namespace {

using TransformHandle = sfmljs::SharedHandle<Rml::Transform>;

NAN_METHOD(CreateTransform) {
  Rml::Transform::PrimitiveList primitives;
  if (!info[0]->IsUndefined() && !PrimitiveListFromJs(info[0], &primitives)) {
    return;
  }
  info.GetReturnValue().Set(TransformHandle::Create(
      std::make_shared<Rml::Transform>(std::move(primitives))));
}

NAN_METHOD(TransformMakeProperty) {
  Rml::Transform::PrimitiveList primitives;
  if (PrimitiveListFromJs(info[0], &primitives) && RuntimeReady()) {
    info.GetReturnValue().Set(
        WrapProperty(Rml::Transform::MakeProperty(std::move(primitives))));
  }
}

NAN_METHOD(TransformGetPrimitives) {
  if (auto* handle = TransformHandle::From(info[0])) {
    info.GetReturnValue().Set(
        PrimitiveListToJs(handle->owner()->GetPrimitives()));
  }
}

NAN_METHOD(TransformSetPrimitives) {
  Rml::Transform::PrimitiveList primitives;
  if (!PrimitiveListFromJs(info[1], &primitives)) {
    return;
  }
  if (auto* handle = TransformHandle::From(info[0])) {
    handle->owner()->GetPrimitives() = std::move(primitives);
  }
}

NAN_METHOD(TransformGetPrimitive) {
  auto* handle = TransformHandle::From(info[0]);
  if (!handle) {
    return;
  }
  if (!info[1]->IsUint32() || Nan::To<uint32_t>(info[1]).FromJust() >=
                                  handle->owner()->GetPrimitives().size()) {
    return Nan::ThrowRangeError("Transform primitive index is out of range");
  }
  info.GetReturnValue().Set(PrimitiveToJs(
      handle->owner()->GetPrimitive(Nan::To<int>(info[1]).FromJust())));
}

NAN_METHOD(TransformGetNumPrimitives) {
  if (auto* handle = TransformHandle::From(info[0])) {
    info.GetReturnValue().Set(handle->owner()->GetNumPrimitives());
  }
}

NAN_METHOD(TransformClearPrimitives) {
  if (auto* handle = TransformHandle::From(info[0])) {
    handle->owner()->ClearPrimitives();
  }
}

NAN_METHOD(TransformAddPrimitive) {
  Rml::TransformPrimitive primitive(Rml::Transforms::ScaleX(1));
  if (!PrimitiveFromJs(info[1], &primitive)) {
    return;
  }
  if (auto* handle = TransformHandle::From(info[0])) {
    handle->owner()->AddPrimitive(primitive);
  }
}

NAN_METHOD(MakeTransformPrimitive) {
  Rml::TransformPrimitive primitive(Rml::Transforms::ScaleX(1));
  if (ConstructPrimitive(info[0], info[1], &primitive)) {
    info.GetReturnValue().Set(PrimitiveToJs(primitive));
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlTransform) {
  sfmljs::SetMethod<CreateTransform>(target, "createTransform");
  sfmljs::SetMethod<TransformGetPrimitives>(target, "transformGetPrimitives");
  sfmljs::SetMethod<TransformSetPrimitives>(target, "transformSetPrimitives");
  sfmljs::SetMethod<TransformGetPrimitive>(target, "transformGetPrimitive");
  sfmljs::SetMethod<TransformGetNumPrimitives>(target,
                                               "transformGetNumPrimitives");
  sfmljs::SetMethod<TransformClearPrimitives>(target,
                                              "transformClearPrimitives");
  sfmljs::SetMethod<TransformAddPrimitive>(target, "transformAddPrimitive");
  sfmljs::SetMethod<MakeTransformPrimitive>(target, "makeTransformPrimitive");
  SetRuntimeMethod<TransformMakeProperty, true>(target,
                                                "transformMakeProperty");
}

}  // namespace sfmlrmlui
