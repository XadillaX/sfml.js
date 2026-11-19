// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/ElementUtilities.h>
#include <RmlUi/Core/Matrix4.h>
#include <nan.h>

#include "native/dom/elements/rmlui-box.h"
#include "native/rendering/geometry/rmlui-geometry.h"
#include "native/rendering/manager/rmlui-render-state.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-filter.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

void SetData(v8::Local<v8::Object> object,
             const char* name,
             v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

bool ReadContainingBlock(v8::Local<v8::Value> input, Rml::Vector2f* size) {
  if (!ReadBoxVector(input, size)) {
    return false;
  }
  if (size->x < 0 || size->y < 0) {
    Nan::ThrowRangeError("Containing block dimensions cannot be negative");
    return false;
  }
  return true;
}

NAN_METHOD(GetElementById) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an ID string");
  }
  Nan::Utf8String id(info[1]);
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(
        WrapNullableElement(Rml::ElementUtilities::GetElementById(
            element, Rml::String(*id, id.length()))));
  }
}

template <bool by_tag>
NAN_METHOD(GetElements) {
  if (!info[1]->IsString() || (by_tag && !info[2]->IsString())) {
    return Nan::ThrowTypeError("Expected query strings");
  }
  Nan::Utf8String query(info[1]);
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  Rml::ElementList elements;
  if constexpr (by_tag) {
    Nan::Utf8String stop_tag(info[2]);
    Rml::ElementUtilities::GetElementsByTagName(
        elements,
        element,
        Rml::String(*query, query.length()),
        Rml::String(*stop_tag, stop_tag.length()));
  } else {
    Rml::ElementUtilities::GetElementsByClassName(
        elements, element, Rml::String(*query, query.length()));
  }
  auto result = Nan::New<v8::Array>(elements.size());
  for (size_t i = 0; i < elements.size(); ++i) {
    result
        ->CreateDataProperty(
            Nan::GetCurrentContext(), i, WrapElement(elements[i]))
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetDensity) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(
        Rml::ElementUtilities::GetDensityIndependentPixelRatio(element));
  }
}

NAN_METHOD(GetStringWidth) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a text string");
  }
  if (!info[2]->IsUint32()) {
    return Nan::ThrowTypeError("Expected a Unicode character codepoint");
  }
  const uint32_t prior = Nan::To<uint32_t>(info[2]).FromJust();
  if (prior > 0x10ffff || (prior >= 0xd800 && prior <= 0xdfff)) {
    return Nan::ThrowRangeError("Expected a Unicode character codepoint");
  }
  Nan::Utf8String text(info[1]);
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(Rml::ElementUtilities::GetStringWidth(
        element,
        Rml::StringView(*text, *text + text.length()),
        static_cast<Rml::Character>(prior)));
  }
}

NAN_METHOD(GetClippingRegion) {
  if (!info[1]->IsBoolean() || !info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected clipping option booleans");
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  const bool include_mask = info[1]->IsTrue();
  auto* context = element->GetContext();
  if (include_mask && !context) {
    return Nan::ThrowError("Clip mask geometry requires an attached context");
  }
  Rml::Rectanglei region;
  Rml::ClipMaskGeometryList masks;
  const bool has_region = Rml::ElementUtilities::GetClippingRegion(
      element, region, include_mask ? &masks : nullptr, info[2]->IsTrue());
  auto result = Nan::New<v8::Object>();
  SetData(result,
          "region",
          has_region ? v8::Local<v8::Value>(
                           WrapFilterRectangle(Rml::Rectanglef(region)))
                     : v8::Local<v8::Value>(Nan::Null()));
  SetData(result,
          "clipMask",
          WrapClipMaskList(masks,
                           context ? &context->GetRenderManager() : nullptr));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SetClippingRegion) {
  if (!info[1]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected forceClipSelf boolean");
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(
        Rml::ElementUtilities::SetClippingRegion(element, info[1]->IsTrue()));
  }
}

NAN_METHOD(GetBoundingBox) {
  if (!info[1]->IsUint32() || Nan::To<uint32_t>(info[1]).FromJust() > 4) {
    return Nan::ThrowTypeError("Expected a bounding box area");
  }
  if (auto* element = ElementOf(info[0])) {
    Rml::Rectanglef rectangle;
    const bool success = Rml::ElementUtilities::GetBoundingBox(
        rectangle,
        element,
        static_cast<Rml::BoxArea>(Nan::To<uint32_t>(info[1]).FromJust()));
    info.GetReturnValue().Set(
        success ? v8::Local<v8::Value>(WrapFilterRectangle(rectangle))
                : v8::Local<v8::Value>(Nan::Null()));
  }
}

NAN_METHOD(FormatElement) {
  Rml::Vector2f size;
  if (!ReadContainingBlock(info[1], &size)) {
    return;
  }
  if (auto* element = ElementOf(info[0]);
      element && CanReplaceElementChildren(element, true)) {
    Rml::ElementUtilities::FormatElement(element, size);
  }
}

NAN_METHOD(BuildBox) {
  Rml::Vector2f size;
  if (!ReadContainingBlock(info[0], &size)) {
    return;
  }
  if (!info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected inlineElement boolean");
  }
  if (auto* element = ElementOf(info[1])) {
    Rml::Box box;
    Rml::ElementUtilities::BuildBox(box, size, element, info[2]->IsTrue());
    info.GetReturnValue().Set(WrapBox(box));
  }
}

NAN_METHOD(PositionElement) {
  Rml::Vector2f offset;
  if (!ReadBoxVector(info[1], &offset)) {
    return;
  }
  if (!info[2]->IsUint32()) {
    return Nan::ThrowTypeError("Expected a position anchor");
  }
  const uint32_t anchor = Nan::To<uint32_t>(info[2]).FromJust();
  switch (anchor) {
    case 1:
    case 2:
    case 4:
    case 8:
    case 5:
    case 9:
    case 6:
    case 10:
      break;
    default:
      return Nan::ThrowRangeError("Expected a position anchor");
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(Rml::ElementUtilities::PositionElement(
        element,
        offset,
        static_cast<Rml::ElementUtilities::PositionAnchor>(anchor)));
  }
}

NAN_METHOD(ApplyTransform) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(Rml::ElementUtilities::ApplyTransform(*element));
  }
}

NAN_METHOD(ApplyDataViewsControllers) {
  if (auto* element = ElementOf(info[0]);
      element && CanReplaceElementChildren(element, true)) {
    info.GetReturnValue().Set(
        Rml::ElementUtilities::ApplyDataViewsControllers(element));
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlElementUtilities) {
  SetRuntimeMethod<GetElementById, true>(target, "utilitiesGetElementById");
  SetRuntimeMethod<GetElements<true>, true>(target,
                                            "utilitiesGetElementsByTagName");
  SetRuntimeMethod<GetElements<false>, true>(target,
                                             "utilitiesGetElementsByClassName");
  SetRuntimeMethod<GetDensity, true>(
      target, "utilitiesGetDensityIndependentPixelRatio");
  SetRuntimeMethod<GetStringWidth, true>(target, "utilitiesGetStringWidth");
  SetRuntimeMethod<GetClippingRegion, true>(target,
                                            "utilitiesGetClippingRegion");
  SetRuntimeMethod<SetClippingRegion>(target, "utilitiesSetClippingRegion");
  SetRuntimeMethod<GetBoundingBox, true>(target, "utilitiesGetBoundingBox");
  SetRuntimeMethod<FormatElement>(target, "utilitiesFormatElement");
  SetRuntimeMethod<BuildBox, true>(target, "utilitiesBuildBox");
  SetRuntimeMethod<PositionElement>(target, "utilitiesPositionElement");
  SetRuntimeMethod<ApplyTransform>(target, "utilitiesApplyTransform");
  SetRuntimeMethod<ApplyDataViewsControllers>(
      target, "utilitiesApplyDataViewsControllers");
}

}  // namespace sfmlrmlui
