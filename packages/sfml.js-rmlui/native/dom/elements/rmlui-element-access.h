// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_ACCESS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_ACCESS_H_

#include <RmlUi/Core/Element.h>
#include <nan.h>

#include <type_traits>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {

// Resolve only after argument conversion. Native RTTI also accepts subclasses
// registered by later factory adapters, without relying on the element's tag.
template <typename ElementType>
ElementType* ElementAs(v8::Local<v8::Value> handle) {
  auto* element = ElementOf(handle);
  if (!element) {
    return nullptr;
  }
  auto* typed = rmlui_dynamic_cast<ElementType*>(element);
  if (!typed) {
    Nan::ThrowTypeError("Incorrect native element type");
  }
  return typed;
}

// Every instantiation has a compile-time receiver and member signature.
template <typename ElementType, auto getter>
NAN_METHOD(ElementGet) {
  if (auto* element = ElementAs<ElementType>(info[0])) {
    const auto value = (element->*getter)();
    if constexpr (std::is_same_v<decltype(value), const Rml::String>) {
      info.GetReturnValue().Set(Nan::New(value).ToLocalChecked());
    } else {
      info.GetReturnValue().Set(value);
    }
  }
}

template <typename ElementType, auto method>
NAN_METHOD(ElementCall) {
  if (auto* element = ElementAs<ElementType>(info[0])) {
    (element->*method)();
    RefreshElementOwnership();
  }
}

template <typename ElementType, auto setter>
NAN_METHOD(ElementSetString) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a string");
  }
  Nan::Utf8String value(info[1]);
  if (auto* element = ElementAs<ElementType>(info[0])) {
    (element->*setter)(Rml::String(*value, value.length()));
    RefreshElementOwnership();
  }
}

template <typename ElementType, auto setter>
NAN_METHOD(ElementSetInt) {
  if (!info[1]->IsInt32()) {
    return Nan::ThrowTypeError("Expected an int32");
  }
  if (auto* element = ElementAs<ElementType>(info[0])) {
    (element->*setter)(Nan::To<int>(info[1]).FromJust());
    RefreshElementOwnership();
  }
}

template <typename ElementType, auto setter>
NAN_METHOD(ElementSetBool) {
  if (!info[1]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected a boolean");
  }
  if (auto* element = ElementAs<ElementType>(info[0])) {
    (element->*setter)(info[1]->IsTrue());
    RefreshElementOwnership();
  }
}

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_ELEMENTS_RMLUI_ELEMENT_ACCESS_H_
