// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/ElementText.h>
#include <RmlUi/Core/Elements/ElementForm.h>
#include <RmlUi/Core/Elements/ElementFormControl.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>
#include <RmlUi/Core/Elements/ElementFormControlSelect.h>
#include <RmlUi/Core/Elements/ElementFormControlTextArea.h>
#include <RmlUi/Core/Elements/ElementProgress.h>
#include <RmlUi/Core/Elements/ElementTabSet.h>
#include <RmlUi/Lottie/ElementLottie.h>
#include <RmlUi/SVG/ElementSVG.h>
#include <nan.h>

#include "native/dom/elements/rmlui-element-access.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

NAN_METHOD(GetElementType) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  const char* type = "Element";
  if (rmlui_dynamic_cast<Rml::ElementDocument*>(element)) {
    type = "Document";
  } else if (rmlui_dynamic_cast<Rml::ElementFormControlInput*>(element)) {
    type = "ElementFormControlInput";
  } else if (rmlui_dynamic_cast<Rml::ElementFormControlTextArea*>(element)) {
    type = "ElementFormControlTextArea";
  } else if (rmlui_dynamic_cast<Rml::ElementFormControlSelect*>(element)) {
    type = "ElementFormControlSelect";
  } else if (rmlui_dynamic_cast<Rml::ElementFormControl*>(element)) {
    type = "ElementFormControl";
  } else if (rmlui_dynamic_cast<Rml::ElementForm*>(element)) {
    type = "ElementForm";
  } else if (rmlui_dynamic_cast<Rml::ElementText*>(element)) {
    type = "ElementText";
  } else if (rmlui_dynamic_cast<Rml::ElementProgress*>(element)) {
    type = "ElementProgress";
  } else if (rmlui_dynamic_cast<Rml::ElementTabSet*>(element)) {
    type = "ElementTabSet";
  } else if (rmlui_dynamic_cast<Rml::ElementSVG*>(element)) {
    type = "ElementSVG";
  } else if (rmlui_dynamic_cast<Rml::ElementLottie*>(element)) {
    type = "ElementLottie";
  }
  info.GetReturnValue().Set(Nan::New(type).ToLocalChecked());
}

NAN_METHOD(Submit) {
  if (!info[1]->IsString() || !info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected submit name and value strings");
  }
  Nan::Utf8String name(info[1]);
  Nan::Utf8String value(info[2]);
  if (auto* form = ElementAs<Rml::ElementForm>(info[0])) {
    form->Submit(Rml::String(*name, name.length()),
                 Rml::String(*value, value.length()));
  }
}

template <typename Control, bool composition>
NAN_METHOD(SetTextRange) {
  if (!info[1]->IsInt32() || !info[2]->IsInt32()) {
    return Nan::ThrowTypeError("Expected int32 range boundaries");
  }
  if (auto* control = ElementAs<Control>(info[0])) {
    const int start = Nan::To<int>(info[1]).FromJust();
    const int end = Nan::To<int>(info[2]).FromJust();
    if constexpr (composition) {
      control->SetCompositionRange(start, end);
    } else {
      control->SetSelectionRange(start, end);
    }
  }
}

template <typename Control>
NAN_METHOD(GetTextSelection) {
  if (auto* control = ElementAs<Control>(info[0])) {
    // Non-text input types leave their output arguments untouched.
    int start = 0;
    int end = 0;
    Rml::String text;
    control->GetSelection(&start, &end, &text);
    auto result = Nan::New<v8::Object>();
    const auto context = Nan::GetCurrentContext();
    result
        ->CreateDataProperty(
            context, Nan::New("start").ToLocalChecked(), Nan::New(start))
        .FromJust();
    result
        ->CreateDataProperty(
            context, Nan::New("end").ToLocalChecked(), Nan::New(end))
        .FromJust();
    result
        ->CreateDataProperty(context,
                             Nan::New("text").ToLocalChecked(),
                             Nan::New(text).ToLocalChecked())
        .FromJust();
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(Focus) {
  if (!info[1]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected focusVisible boolean");
  }
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(element->Focus(info[1]->IsTrue()));
  }
}

NAN_METHOD(GetIntrinsicDimensions) {
  if (auto* element = ElementOf(info[0])) {
    Rml::Vector2f dimensions(0, 0);
    float ratio = 0;
    const bool valid = element->GetIntrinsicDimensions(dimensions, ratio);
    auto result = Nan::New<v8::Object>();
    auto vector = Nan::New<v8::Object>();
    const auto context = Nan::GetCurrentContext();
    vector
        ->CreateDataProperty(
            context, Nan::New("x").ToLocalChecked(), Nan::New(dimensions.x))
        .FromJust();
    vector
        ->CreateDataProperty(
            context, Nan::New("y").ToLocalChecked(), Nan::New(dimensions.y))
        .FromJust();
    result
        ->CreateDataProperty(
            context, Nan::New("valid").ToLocalChecked(), Nan::New(valid))
        .FromJust();
    result
        ->CreateDataProperty(
            context, Nan::New("dimensions").ToLocalChecked(), vector)
        .FromJust();
    result
        ->CreateDataProperty(
            context, Nan::New("ratio").ToLocalChecked(), Nan::New(ratio))
        .FromJust();
    info.GetReturnValue().Set(result);
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlForms) {
  using Control = Rml::ElementFormControl;
  using Input = Rml::ElementFormControlInput;
  using Area = Rml::ElementFormControlTextArea;
  SetRuntimeMethod<GetElementType,
                   true,
                   true,
                   false,
                   true,
                   true,
                   false,
                   true,
                   true>(target, "getElementType");
  SetRuntimeMethod<Submit>(target, "submitForm");
  SetRuntimeMethod<ElementGet<Control, &Control::GetName>, true>(
      target, "getControlName");
  SetRuntimeMethod<ElementSetString<Control, &Control::SetName>>(
      target, "setControlName");
  SetRuntimeMethod<ElementGet<Control, &Control::GetValue>, true>(
      target, "getControlValue");
  SetRuntimeMethod<ElementSetString<Control, &Control::SetValue>>(
      target, "setControlValue");
  SetRuntimeMethod<ElementGet<Control, &Control::IsSubmitted>, true>(
      target, "isControlSubmitted");
  SetRuntimeMethod<ElementGet<Control, &Control::IsDisabled>, true>(
      target, "isControlDisabled");
  SetRuntimeMethod<ElementSetBool<Control, &Control::SetDisabled>>(
      target, "setControlDisabled");
  SetRuntimeMethod<ElementCall<Input, &Input::Select>>(target, "selectInput");
  SetRuntimeMethod<SetTextRange<Input, false>>(target, "setInputSelection");
  SetRuntimeMethod<GetTextSelection<Input>, true>(target, "getInputSelection");
  SetRuntimeMethod<SetTextRange<Input, true>>(target,
                                              "setInputCompositionRange");
  SetRuntimeMethod<ElementCall<Area, &Area::Select>>(target, "selectTextArea");
  SetRuntimeMethod<SetTextRange<Area, false>>(target, "setTextAreaSelection");
  SetRuntimeMethod<GetTextSelection<Area>, true>(target,
                                                 "getTextAreaSelection");
  SetRuntimeMethod<SetTextRange<Area, true>>(target,
                                             "setTextAreaCompositionRange");
  SetRuntimeMethod<ElementGet<Area, &Area::GetNumColumns>, true>(
      target, "getTextAreaNumColumns");
  SetRuntimeMethod<ElementSetInt<Area, &Area::SetNumColumns>>(
      target, "setTextAreaNumColumns");
  SetRuntimeMethod<ElementGet<Area, &Area::GetNumRows>, true>(
      target, "getTextAreaNumRows");
  SetRuntimeMethod<ElementSetInt<Area, &Area::SetNumRows>>(
      target, "setTextAreaNumRows");
  SetRuntimeMethod<ElementGet<Area, &Area::GetMaxLength>, true>(
      target, "getTextAreaMaxLength");
  SetRuntimeMethod<ElementSetInt<Area, &Area::SetMaxLength>>(
      target, "setTextAreaMaxLength");
  SetRuntimeMethod<ElementGet<Area, &Area::GetWordWrap>, true>(
      target, "getTextAreaWordWrap");
  SetRuntimeMethod<ElementSetBool<Area, &Area::SetWordWrap>>(
      target, "setTextAreaWordWrap");
  SetRuntimeMethod<Focus>(target, "focusElement");
  SetRuntimeMethod<ElementCall<Rml::Element, &Rml::Element::Blur>>(
      target, "blurElement");
  SetRuntimeMethod<GetIntrinsicDimensions>(target, "getIntrinsicDimensions");
}

}  // namespace sfmlrmlui
