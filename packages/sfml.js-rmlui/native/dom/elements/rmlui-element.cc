// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/ElementDocument.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <string>

#include "native/data/rmlui-data.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

NAN_METHOD(GetElementById) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected (element, id)");
  }
  Nan::Utf8String id(info[1]);
  auto* found = element->GetElementById(std::string(*id, id.length()));
  if (found == nullptr) {
    info.GetReturnValue().SetNull();
    return;
  }
  info.GetReturnValue().Set(WrapElement(found));
}

NAN_METHOD(QuerySelector) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected (element, selector)");
  }
  Nan::Utf8String selector(info[1]);
  auto* found =
      element->QuerySelector(std::string(*selector, selector.length()));
  if (found == nullptr) {
    info.GetReturnValue().SetNull();
    return;
  }
  info.GetReturnValue().Set(WrapElement(found));
}

NAN_METHOD(SetClass) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!info[1]->IsString() || !info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected (element, className, activate)");
  }
  Nan::Utf8String name(info[1]);
  element->SetClass(std::string(*name, name.length()), info[2]->IsTrue());
}

NAN_METHOD(IsClassSet) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected (element, className)");
  }
  Nan::Utf8String name(info[1]);
  info.GetReturnValue().Set(
      element->IsClassSet(std::string(*name, name.length())));
}

NAN_METHOD(SetProperty) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!info[1]->IsString() || !info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected (element, name, value)");
  }
  Nan::Utf8String name(info[1]);
  Nan::Utf8String value(info[2]);
  info.GetReturnValue().Set(element->SetProperty(
      std::string(*name, name.length()), std::string(*value, value.length())));
}

NAN_METHOD(GetInnerRML) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  info.GetReturnValue().Set(Nan::New(element->GetInnerRML()).ToLocalChecked());
}

NAN_METHOD(RemoveProperty) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected (element, name)");
  }
  Nan::Utf8String name(info[1]);
  element->RemoveProperty(std::string(*name, name.length()));
}

NAN_METHOD(SetInnerRML) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (IsContextRoot(element)) {
    return Nan::ThrowError(
        "Use context document APIs to modify a context root");
  }
  if (!CanReplaceElementChildren(element)) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected (element, rml)");
  }
  Nan::Utf8String rml(info[1]);
  element->SetInnerRML(std::string(*rml, rml.length()));
  RefreshElementOwnership();
}

NAN_METHOD(GetTagName) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  info.GetReturnValue().Set(Nan::New(element->GetTagName()).ToLocalChecked());
}

NAN_METHOD(IsDocument) {
  auto* element = ElementOf(info[0]);
  if (element) {
    info.GetReturnValue().Set(
        rmlui_dynamic_cast<Rml::ElementDocument*>(element) != nullptr);
  }
}

NAN_METHOD(GetElementId) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  info.GetReturnValue().Set(Nan::New(element->GetId()).ToLocalChecked());
}

NAN_METHOD(SetElementId) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected (element, id)");
  }
  Nan::Utf8String id(info[1]);
  element->SetId(std::string(*id, id.length()));
}

NAN_METHOD(GetOwnerDocument) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto* document = element->GetOwnerDocument();
  if (document == nullptr) {
    info.GetReturnValue().SetNull();
    return;
  }
  info.GetReturnValue().Set(WrapDocument(document));
}

NAN_METHOD(GetEventDispatcherSummary) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  info.GetReturnValue().Set(
      Nan::New(element->GetEventDispatcherSummary()).ToLocalChecked());
}

NAN_METHOD(GetClosestScrollableContainer) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto* container = element->GetClosestScrollableContainer();
  if (!container) {
    info.GetReturnValue().SetNull();
    return;
  }
  info.GetReturnValue().Set(WrapElement(container));
}

NAN_METHOD(GetElementDataModel) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto* model = element->GetDataModel();
  if (!model) {
    info.GetReturnValue().SetNull();
    return;
  }
  const auto owner = DataModelFromPointer(model);
  if (owner) {
    info.GetReturnValue().Set(WrapDataModel(owner));
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlElement) {
  SetRuntimeMethod<GetElementById, true>(target, "getElementById");
  SetRuntimeMethod<QuerySelector, true>(target, "querySelector");
  SetRuntimeMethod<SetClass, true>(target, "setClass");
  SetRuntimeMethod<IsClassSet, true>(target, "isClassSet");
  SetRuntimeMethod<SetProperty, true>(target, "setProperty");
  SetRuntimeMethod<RemoveProperty, true>(target, "removeProperty");
  SetRuntimeMethod<GetInnerRML, true>(target, "getInnerRML");
  SetRuntimeMethod<SetInnerRML, true>(target, "setInnerRML");
  SetInstancerValueMethod<GetTagName, false, true>(target, "getTagName");
  SetRuntimeMethod<IsDocument, true>(target, "isDocument");
  SetInstancerValueMethod<GetElementId, false, true>(target, "getElementId");
  SetRuntimeMethod<SetElementId, true>(target, "setElementId");
  SetRuntimeMethod<GetOwnerDocument, true>(target, "getOwnerDocument");
  SetRuntimeMethod<GetEventDispatcherSummary, true>(
      target, "getEventDispatcherSummary");
  SetRuntimeMethod<GetClosestScrollableContainer, true>(
      target, "getClosestScrollableContainer");
  SetRuntimeMethod<GetElementDataModel, true>(target, "getElementDataModel");
}

}  // namespace sfmlrmlui
