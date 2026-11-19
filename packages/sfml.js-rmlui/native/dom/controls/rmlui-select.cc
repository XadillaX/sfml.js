// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Elements/ElementFormControlSelect.h>
#include <nan.h>

#include <utility>

#include "native/dom/elements/rmlui-element-access.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

using Select = Rml::ElementFormControlSelect;

NAN_METHOD(GetOption) {
  if (!info[1]->IsInt32()) {
    return Nan::ThrowTypeError("Expected an int32 option index");
  }
  if (auto* select = ElementAs<Select>(info[0])) {
    auto* option = select->GetOption(Nan::To<int>(info[1]).FromJust());
    RefreshElementOwnership();
    info.GetReturnValue().Set(WrapNullableElement(option));
  }
}

NAN_METHOD(GetNumOptions) {
  if (auto* select = ElementAs<Select>(info[0])) {
    const int count = select->GetNumOptions();
    RefreshElementOwnership();
    info.GetReturnValue().Set(count);
  }
}

NAN_METHOD(AddOptionRml) {
  if (!info[1]->IsString() || !info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected option RML and value strings");
  }
  if (!info[3]->IsInt32()) {
    return Nan::ThrowTypeError("Expected an int32 option index");
  }
  if (!info[4]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected selectable boolean");
  }
  Nan::Utf8String rml(info[1]);
  Nan::Utf8String value(info[2]);
  if (auto* select = ElementAs<Select>(info[0])) {
    const int index = select->Add(Rml::String(*rml, rml.length()),
                                  Rml::String(*value, value.length()),
                                  Nan::To<int>(info[3]).FromJust(),
                                  info[4]->IsTrue());
    RefreshElementOwnership();
    info.GetReturnValue().Set(index);
  }
}

NAN_METHOD(AddOptionElement) {
  if (!info[2]->IsInt32()) {
    return Nan::ThrowTypeError("Expected an int32 option index");
  }
  const size_t active_depth = State().active_elements.size();
  auto* select = ElementAs<Select>(info[0]);
  auto* option = select ? ElementOf(info[1]) : nullptr;
  if (!option || !CanInsertElement(select, option, active_depth)) {
    return;
  }
  if (option->GetTagName() != "option") {
    return Nan::ThrowTypeError("Expected an option element");
  }
  auto token = ShareElement(option);
  const int index =
      select->Add(std::move(token->owned), Nan::To<int>(info[2]).FromJust());
  RefreshElementOwnership();
  info.GetReturnValue().Set(index);
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlSelect) {
  SetRuntimeMethod<ElementSetInt<Select, &Select::SetSelection>>(
      target, "setSelectSelection");
  SetRuntimeMethod<ElementGet<Select, &Select::GetSelection>, true>(
      target, "getSelectSelection");
  // Both native queries call MoveChildren and can destroy non-option children.
  SetRuntimeMethod<GetOption>(target, "getSelectOption");
  SetRuntimeMethod<GetNumOptions>(target, "getSelectNumOptions");
  SetRuntimeMethod<AddOptionRml>(target, "addSelectOptionRml");
  SetRuntimeMethod<AddOptionElement>(target, "addSelectOptionElement");
  SetRuntimeMethod<ElementSetInt<Select, &Select::Remove>>(
      target, "removeSelectOption");
  SetRuntimeMethod<ElementCall<Select, &Select::RemoveAll>>(
      target, "removeAllSelectOptions");
  SetRuntimeMethod<ElementCall<Select, &Select::ShowSelectBox>>(
      target, "showSelectBox");
  SetRuntimeMethod<ElementCall<Select, &Select::HideSelectBox>>(
      target, "hideSelectBox");
  // Escape cancellation changes visibility/value but retains the widget and
  // all native event targets, matching the original DemoEventListener.
  SetRuntimeMethod<ElementCall<Select, &Select::CancelSelectBox>, true>(
      target, "cancelSelectBox");
  SetRuntimeMethod<ElementGet<Select, &Select::IsSelectBoxVisible>, true>(
      target, "isSelectBoxVisible");
}

}  // namespace sfmlrmlui
