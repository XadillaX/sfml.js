// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/ScrollTypes.h>
#include <nan.h>

#include <cmath>
#include <limits>
#include <type_traits>

#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

bool LayoutFloat(v8::Local<v8::Value> value, float* result) {
  if (value->IsNumber()) {
    const double number = Nan::To<double>(value).FromJust();
    if (std::isfinite(number) &&
        std::abs(number) <= std::numeric_limits<float>::max()) {
      *result = static_cast<float>(number);
      return true;
    }
  }
  Nan::ThrowTypeError("Expected a finite layout float");
  return false;
}

bool LayoutVector(v8::Local<v8::Value> value, Rml::Vector2f* result) {
  if (!value->IsObject()) {
    Nan::ThrowTypeError("Expected a finite layout vector");
    return false;
  }
  auto object = value.As<v8::Object>();
  v8::Local<v8::Value> x;
  v8::Local<v8::Value> y;
  return Nan::Get(object, Nan::New("x").ToLocalChecked()).ToLocal(&x) &&
         Nan::Get(object, Nan::New("y").ToLocalChecked()).ToLocal(&y) &&
         LayoutFloat(x, &result->x) && LayoutFloat(y, &result->y);
}

template <typename EnumType>
bool LayoutEnum(v8::Local<v8::Value> value,
                int maximum,
                EnumType* result,
                const char* message) {
  if (value->IsInt32()) {
    const int number = Nan::To<int>(value).FromJust();
    if (number >= 0 && number <= maximum) {
      *result = static_cast<EnumType>(number);
      return true;
    }
  }
  Nan::ThrowTypeError(message);
  return false;
}

template <typename EnumType>
bool ScrollOption(v8::Local<v8::Object> options,
                  const char* name,
                  int maximum,
                  EnumType* result,
                  const char* message) {
  v8::Local<v8::Value> value;
  if (!Nan::Get(options, Nan::New(name).ToLocalChecked()).ToLocal(&value)) {
    return false;
  }
  return value->IsUndefined() || LayoutEnum(value, maximum, result, message);
}

template <auto getter>
NAN_METHOD(LayoutGet) {
  if (auto* element = ElementOf(info[0])) {
    const auto value = (element->*getter)();
    if constexpr (std::is_enum_v<decltype(value)>) {
      info.GetReturnValue().Set(static_cast<int>(value));
    } else if constexpr (std::is_same_v<decltype(value), const Rml::Vector2f>) {
      v8::Local<v8::Value> result;
      if (VariantToJs(Rml::Variant(value)).ToLocal(&result)) {
        info.GetReturnValue().Set(result);
      }
    } else {
      info.GetReturnValue().Set(value);
    }
  }
}

template <auto setter>
NAN_METHOD(LayoutSetFloat) {
  float value;
  if (!LayoutFloat(info[1], &value)) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    (element->*setter)(value);
  }
}

template <auto getter>
NAN_METHOD(GetOffset) {
  Rml::BoxArea area;
  if (!LayoutEnum(info[1], 3, &area, "Invalid offset box area")) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    v8::Local<v8::Value> result;
    if (VariantToJs(Rml::Variant((element->*getter)(area))).ToLocal(&result)) {
      info.GetReturnValue().Set(result);
    }
  }
}

NAN_METHOD(GetOffsetParent) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(WrapNullableElement(element->GetOffsetParent()));
  }
}

NAN_METHOD(SetOffset) {
  Rml::Vector2f offset;
  if (!LayoutVector(info[1], &offset)) {
    return;
  }
  if (!info[3]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected offsetFixed boolean");
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  Rml::Element* offset_parent = nullptr;
  if (!info[2]->IsNull()) {
    offset_parent = ElementOf(info[2]);
    if (!offset_parent) {
      return;
    }
    // The native layout pointer must remain in the owning ancestor chain.
    // Detachment already clears outgoing links in ResetDetachedOffsets.
    auto* ancestor = element->GetParentNode();
    while (ancestor && ancestor != offset_parent) {
      ancestor = ancestor->GetParentNode();
    }
    if (!ancestor) {
      return Nan::ThrowError("Offset parent must be an ancestor or null");
    }
  }
  element->SetOffset(offset, offset_parent, info[3]->IsTrue());
}

NAN_METHOD(SetClipArea) {
  Rml::BoxArea area;
  if (!LayoutEnum(info[1], 4, &area, "Invalid clip box area")) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    element->SetClipArea(area);
  }
}

NAN_METHOD(IsVisible) {
  if (!info[1]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected includeAncestors boolean");
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(element->IsVisible(info[1]->IsTrue()));
  }
}

NAN_METHOD(IsPointWithinElement) {
  Rml::Vector2f point;
  if (!LayoutVector(info[1], &point)) {
    return;
  }
  // Accessors may destroy the receiver; resolve only after all conversions.
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(element->IsPointWithinElement(point));
  }
}

NAN_METHOD(Project) {
  Rml::Vector2f point;
  if (!LayoutVector(info[1], &point)) {
    return;
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  const bool success = element->Project(point);
  v8::Local<v8::Value> position;
  if (!VariantToJs(Rml::Variant(point)).ToLocal(&position)) {
    return;
  }
  auto result = Nan::New<v8::Object>();
  result
      ->CreateDataProperty(Nan::GetCurrentContext(),
                           Nan::New("success").ToLocalChecked(),
                           Nan::New(success))
      .FromJust();
  result
      ->CreateDataProperty(Nan::GetCurrentContext(),
                           Nan::New("point").ToLocalChecked(),
                           position)
      .FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SetScrollableOverflowRectangle) {
  Rml::Vector2f size;
  if (!LayoutVector(info[1], &size)) {
    return;
  }
  if (size.x < 0 || size.y < 0) {
    return Nan::ThrowRangeError("Overflow dimensions cannot be negative");
  }
  if (!info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected clampScrollOffset boolean");
  }
  if (auto* element = ElementOf(info[0])) {
    element->SetScrollableOverflowRectangle(size, info[2]->IsTrue());
  }
}

NAN_METHOD(ScrollTo) {
  Rml::Vector2f offset;
  Rml::ScrollBehavior behavior;
  if (!LayoutVector(info[1], &offset) ||
      !LayoutEnum(info[2], 2, &behavior, "Invalid scroll behavior")) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    element->ScrollTo(offset, behavior);
  }
}

NAN_METHOD(ScrollIntoView) {
  if (info[1]->IsBoolean()) {
    if (auto* element = ElementOf(info[0])) {
      element->ScrollIntoView(info[1]->IsTrue());
    }
    return;
  }
  if (!info[1]->IsObject()) {
    return Nan::ThrowTypeError("Expected scroll options or a boolean");
  }
  auto object = info[1].As<v8::Object>();
  Rml::ScrollIntoViewOptions options;
  if (!ScrollOption(object,
                    "vertical",
                    4,
                    &options.vertical,
                    "Invalid vertical scroll alignment") ||
      !ScrollOption(object,
                    "horizontal",
                    4,
                    &options.horizontal,
                    "Invalid horizontal scroll alignment") ||
      !ScrollOption(object,
                    "behavior",
                    2,
                    &options.behavior,
                    "Invalid scroll behavior") ||
      !ScrollOption(object,
                    "parentage",
                    1,
                    &options.parentage,
                    "Invalid scroll parentage")) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    element->ScrollIntoView(options);
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlLayout) {
  SetRuntimeMethod<GetOffset<&Rml::Element::GetRelativeOffset>, true>(
      target, "getRelativeOffset");
  SetRuntimeMethod<GetOffset<&Rml::Element::GetAbsoluteOffset>, true>(
      target, "getAbsoluteOffset");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetContainingBlock>, true>(
      target, "getContainingBlock");
  SetRuntimeMethod<GetOffsetParent, true>(target, "getOffsetParent");
  SetRuntimeMethod<SetOffset, true>(target, "setOffset");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetClipArea>, true>(target,
                                                                "getClipArea");
  SetRuntimeMethod<SetClipArea, true>(target, "setClipArea");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetBaseline>, true>(target,
                                                                "getBaseline");
  SetRuntimeMethod<LayoutGet<&Rml::Element::IsReplaced>, true>(target,
                                                               "isReplaced");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetZIndex>, true>(target,
                                                              "getZIndex");
  SetRuntimeMethod<IsVisible, true>(target, "isVisible");
  SetRuntimeMethod<IsPointWithinElement, true>(target, "isPointWithinElement");
  SetRuntimeMethod<Project, true>(target, "project");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetPosition>, true>(target,
                                                                "getPosition");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetFloat>, true>(target,
                                                             "getFloat");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetDisplay>, true>(target,
                                                               "getDisplay");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetLineHeight>, true>(
      target, "getLineHeight");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetAbsoluteLeft>, true>(
      target, "getAbsoluteLeft");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetAbsoluteTop>, true>(
      target, "getAbsoluteTop");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetClientLeft>, true>(
      target, "getClientLeft");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetClientTop>, true>(
      target, "getClientTop");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetClientWidth>, true>(
      target, "getClientWidth");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetClientHeight>, true>(
      target, "getClientHeight");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetOffsetLeft>, true>(
      target, "getOffsetLeft");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetOffsetTop>, true>(
      target, "getOffsetTop");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetOffsetWidth>, true>(
      target, "getOffsetWidth");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetOffsetHeight>, true>(
      target, "getOffsetHeight");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetScrollLeft>, true>(
      target, "getScrollLeft");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetScrollTop>, true>(
      target, "getScrollTop");
  SetRuntimeMethod<LayoutSetFloat<&Rml::Element::SetScrollLeft>, true>(
      target, "setScrollLeft");
  SetRuntimeMethod<LayoutSetFloat<&Rml::Element::SetScrollTop>, true>(
      target, "setScrollTop");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetScrollWidth>, true>(
      target, "getScrollWidth");
  SetRuntimeMethod<LayoutGet<&Rml::Element::GetScrollHeight>, true>(
      target, "getScrollHeight");
  SetRuntimeMethod<SetScrollableOverflowRectangle, true>(
      target, "setScrollableOverflowRectangle");
  SetRuntimeMethod<ScrollTo, true>(target, "scrollTo");
  SetRuntimeMethod<ScrollIntoView, true>(target, "scrollIntoView");
}

}  // namespace sfmlrmlui
