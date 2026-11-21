// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>

#include "native/rendering/geometry/rmlui-geometry.h"
#include "native/rendering/manager/rmlui-render-layers.h"
#include "native/runtime/rmlui-state.h"
#include "vendor/rmlui/Source/Core/ElementBackgroundBorder.h"

namespace sfmlrmlui {
namespace {

NAN_METHOD(GetElementBackgroundBorder) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(WrapElement(element));
  }
}

template <auto method>
NAN_METHOD(Dirty) {
  if (auto* element = ElementOf(info[0])) {
    (element->GetElementBackgroundBorder()->*method)();
  }
}

NAN_METHOD(Render) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  // Detached elements without a document have no manager. Match upstream's
  // no-op rendering without manufacturing a resource or renderer.
  auto* manager = element->GetRenderManager();
  if (manager && !CanRenderToManager(manager)) {
    return;
  }
  element->GetElementBackgroundBorder()->Render(element);
}

NAN_METHOD(GetClipGeometry) {
  if (!info[1]->IsInt32()) {
    return Nan::ThrowRangeError(
        "Expected a Border, Padding or Content clip area");
  }
  const int number = Nan::To<int>(info[1]).FromJust();
  if (number < static_cast<int>(Rml::BoxArea::Border) ||
      number > static_cast<int>(Rml::BoxArea::Content)) {
    return Nan::ThrowRangeError(
        "Expected a Border, Padding or Content clip area");
  }
  if (auto* element = ElementOf(info[0])) {
    auto* geometry = element->GetElementBackgroundBorder()->GetClipGeometry(
        element, static_cast<Rml::BoxArea>(number));
    // A borrowed component mesh can be released by its next Render. Clone
    // through the existing native geometry/resource ownership mechanism.
    info.GetReturnValue().Set(
        WrapGeometrySnapshot(*geometry, element->GetRenderManager()));
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlElementBackgroundBorder) {
  SetRuntimeMethod<GetElementBackgroundBorder, true>(
      target, "elementGetBackgroundBorder");
  SetRuntimeMethod<Render>(target, "backgroundBorderRender");
  SetRuntimeMethod<Dirty<&Rml::ElementBackgroundBorder::DirtyBackground>, true>(
      target, "backgroundBorderDirtyBackground");
  SetRuntimeMethod<Dirty<&Rml::ElementBackgroundBorder::DirtyBorder>, true>(
      target, "backgroundBorderDirtyBorder");
  SetRuntimeMethod<GetClipGeometry, true>(target,
                                          "backgroundBorderGetClipGeometry");
}

}  // namespace sfmlrmlui
