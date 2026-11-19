// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>
#include <nan.h>

#include <utility>

#include "native/animation/rmlui-animation-values.h"
#include "native/dom/elements/rmlui-element-access.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

bool ReadAttributeValue(v8::Local<v8::Value> value, Rml::Variant* result) {
  return VariantFromJs(value, result);
}

bool ReadAttributes(v8::Local<v8::Value> value,
                    Rml::ElementAttributes* attributes) {
  return DictionaryFromJs(value, attributes);
}

bool CanChangeAttributes(Rml::Element* element, bool changes_type) {
  const bool replaces_control =
      changes_type &&
      rmlui_dynamic_cast<Rml::ElementFormControlInput*>(element);
  return CanReplaceElementChildren(element, replaces_control);
}

NAN_METHOD(SetAttributes) {
  const auto active_depth = State().active_elements.size();
  Rml::ElementAttributes attributes;
  if (!ReadAttributes(info[1], &attributes)) {
    return;
  }
  // Guarded values no longer borrow their targets. Restore the outer native
  // stack before checking the receiver, so a self-reference is not mistaken
  // for an active recursive receiver from a different call.
  State().active_elements.resize(active_depth);
  // Read every accessor before borrowing the receiver or mutating any field.
  auto* element = ElementOf(info[0]);
  if (!element ||
      !CanChangeAttributes(element, attributes.count("type") != 0)) {
    return;
  }
  for (auto& [name, value] : attributes) {
    RebindVariantTweens(&value, element);
  }
  element->SetAttributes(attributes);
  RefreshElementOwnership();
}

NAN_METHOD(SetAttribute) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an attribute name");
  }
  Nan::Utf8String name(info[1]);
  const Rml::String attribute(*name, name.length());
  const auto active_depth = State().active_elements.size();
  Rml::Variant value;
  if (!ReadAttributeValue(info[2], &value)) {
    return;
  }
  State().active_elements.resize(active_depth);
  auto* element = ElementOf(info[0]);
  if (!element || !CanChangeAttributes(element, attribute == "type")) {
    return;
  }
  RebindVariantTweens(&value, element);
  element->SetAttribute(attribute, value);
  RefreshElementOwnership();
}

NAN_METHOD(RemoveAttribute) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an attribute name");
  }
  Nan::Utf8String name(info[1]);
  const Rml::String attribute(*name, name.length());
  auto* element = ElementOf(info[0]);
  if (!element || !CanChangeAttributes(element, attribute == "type")) {
    return;
  }
  element->RemoveAttribute(attribute);
  RefreshElementOwnership();
}

NAN_METHOD(GetAttribute) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an attribute name");
  }
  Nan::Utf8String name(info[1]);
  const Rml::String attribute(*name, name.length());
  VariantSelector fallback;
  const bool has_default = !info[2]->IsUndefined();
  if (has_default && !VariantSelectorFromJs(info[2], &fallback)) {
    return;
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (has_default) {
    v8::Local<v8::Value> converted;
    if (ConvertVariantToJs(element->GetAttribute(attribute), fallback)
            .ToLocal(&converted)) {
      info.GetReturnValue().Set(converted);
    }
    return;
  }
  Rml::Variant result;
  if (const auto* value = element->GetAttribute(attribute)) {
    // Preserve the original string-or-null API.
    if (value->GetType() == Rml::Variant::SCRIPTINTERFACE ||
        value->GetType() == Rml::Variant::VOIDPTR) {
      return Nan::ThrowTypeError("Pointer Variant requires a typed adapter");
    }
    result = value->Get<Rml::String>();
  }
  v8::Local<v8::Value> converted;
  if (VariantToJs(result).ToLocal(&converted)) {
    info.GetReturnValue().Set(converted);
  }
}

NAN_METHOD(GetElementAttribute) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an attribute name");
  }

  Rml::Element* fallback = nullptr;
  if (!info[2]->IsNull() && !info[2]->IsUndefined()) {
    fallback = ElementOf(info[2]);
    if (!fallback) {
      return;
    }
  }

  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }

  Nan::Utf8String name(info[1]);
  const auto* value = element->GetAttribute(Rml::String(*name, name.length()));
  if (!value || value->GetType() != Rml::Variant::SCRIPTINTERFACE) {
    info.GetReturnValue().Set(WrapNullableElement(fallback));
    return;
  }

  v8::Local<v8::Value> result;
  if (ElementVariantToJs(*value).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(GetAttributeValue) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an attribute name");
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  Nan::Utf8String name(info[1]);
  const auto* value = element->GetAttribute(Rml::String(*name, name.length()));
  if (!value) {
    info.GetReturnValue().SetNull();
    return;
  }
  v8::Local<v8::Value> converted;
  if (VariantToJs(*value).ToLocal(&converted)) {
    info.GetReturnValue().Set(converted);
  }
}

NAN_METHOD(GetAttributes) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto result = Nan::New<v8::Object>();
  for (const auto& [name, value] : element->GetAttributes()) {
    v8::Local<v8::Value> converted;
    if (!VariantToJs(value).ToLocal(&converted) ||
        !result
             ->CreateDataProperty(Nan::GetCurrentContext(),
                                  Nan::New(name).ToLocalChecked(),
                                  converted)
             .FromMaybe(false)) {
      return;
    }
  }
  info.GetReturnValue().Set(result);
}

template <auto getter>
NAN_METHOD(GetNamedState) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a state name");
  }
  if (auto* element = ElementOf(info[0])) {
    Nan::Utf8String name(info[1]);
    info.GetReturnValue().Set(
        (element->*getter)(Rml::String(*name, name.length())));
  }
}

NAN_METHOD(SetPseudoClass) {
  if (!info[1]->IsString() || !info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected a pseudo-class name and boolean");
  }
  if (auto* element = ElementOf(info[0])) {
    Nan::Utf8String name(info[1]);
    element->SetPseudoClass(Rml::String(*name, name.length()),
                            info[2]->IsTrue());
  }
}

NAN_METHOD(ArePseudoClassesSet) {
  if (!info[1]->IsArray()) {
    return Nan::ThrowTypeError("Expected a pseudo-class name array");
  }
  const auto array = info[1].As<v8::Array>();
  const uint32_t count = array->Length();
  Rml::StringList names;
  names.reserve(count);
  for (uint32_t i = 0; i < count; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(array, i).ToLocal(&value)) {
      return;
    }
    if (!value->IsString()) {
      return Nan::ThrowTypeError("Expected a pseudo-class name");
    }
    Nan::Utf8String text(value);
    names.emplace_back(*text, text.length());
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(element->ArePseudoClassesSet(names));
  }
}

NAN_METHOD(GetActivePseudoClasses) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  const auto names = element->GetActivePseudoClasses();
  auto result = Nan::New<v8::Array>(names.size());
  for (size_t i = 0; i < names.size(); ++i) {
    result
        ->CreateDataProperty(
            Nan::GetCurrentContext(), i, Nan::New(names[i]).ToLocalChecked())
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetAddress) {
  if (!info[1]->IsBoolean() || !info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected pseudo-class and parent booleans");
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(
        Nan::New(element->GetAddress(info[1]->IsTrue(), info[2]->IsTrue()))
            .ToLocalChecked());
  }
}

NAN_METHOD(GetElementContext) {
  if (auto* element = ElementOf(info[0])) {
    auto* context = element->GetContext();
    info.GetReturnValue().Set(context
                                  ? v8::Local<v8::Value>(WrapContext(context))
                                  : v8::Local<v8::Value>(Nan::Null()));
  }
}

NAN_METHOD(GetFocusLeafNode) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(WrapNullableElement(element->GetFocusLeafNode()));
  }
}

}  // namespace

bool ReadElementAttributes(v8::Local<v8::Value> value,
                           Rml::Dictionary* result) {
  return ReadAttributes(value, result);
}

NAN_MODULE_INIT(InitializeRmlElementState) {
  SetRuntimeMethod<SetAttribute, true>(target, "setAttribute");
  SetRuntimeMethod<RemoveAttribute, true>(target, "removeAttribute");
  SetRuntimeMethod<SetAttributes, true>(target, "setAttributes");
  SetPluginReadMethod<GetAttribute>(target, "getAttribute");
  SetPluginReadMethod<GetAttributeValue>(target, "getAttributeValue");
  SetPluginReadMethod<GetElementAttribute>(target, "getElementAttribute");
  SetPluginReadMethod<GetAttributes>(target, "getAttributes");
  SetRuntimeMethod<GetNamedState<&Rml::Element::HasAttribute>, true>(
      target, "hasAttribute");
  SetRuntimeMethod<ElementGet<Rml::Element, &Rml::Element::GetNumAttributes>,
                   true>(target, "getNumAttributes");
  SetRuntimeMethod<ElementGet<Rml::Element, &Rml::Element::GetClassNames>,
                   true>(target, "getClassNames");
  SetRuntimeMethod<ElementSetString<Rml::Element, &Rml::Element::SetClassNames>,
                   true>(target, "setClassNames");
  SetRuntimeMethod<SetPseudoClass, true>(target, "setPseudoClass");
  SetRuntimeMethod<GetNamedState<&Rml::Element::IsPseudoClassSet>, true>(
      target, "isPseudoClassSet");
  SetRuntimeMethod<ArePseudoClassesSet, true>(target, "arePseudoClassesSet");
  SetRuntimeMethod<GetActivePseudoClasses, true>(target,
                                                 "getActivePseudoClasses");
  SetRuntimeMethod<GetAddress, true>(target, "getAddress");
  SetInstancerValueMethod<GetElementContext>(target, "getElementContext");
  SetRuntimeMethod<GetFocusLeafNode, true>(target, "getFocusLeafNode");
}

}  // namespace sfmlrmlui
