// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Elements/ElementProgress.h>
#include <RmlUi/Core/Elements/ElementTabSet.h>
#include <nan.h>

#include <utility>

#include "native/dom/elements/rmlui-element-access.h"
#include "native/runtime/rmlui-numbers.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

using Progress = Rml::ElementProgress;
using Tabs = Rml::ElementTabSet;

template <auto setter>
NAN_METHOD(SetProgressFloat) {
  float value = 0;
  if (ReadFiniteFloat(info[1], &value)) {
    if (auto* progress = ElementAs<Progress>(info[0])) {
      (progress->*setter)(value);
    }
  }
}

template <bool panel>
NAN_METHOD(SetTabRml) {
  if (!info[1]->IsInt32() || !info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected an int32 tab index and RML string");
  }
  Nan::Utf8String rml(info[2]);
  if (auto* tabs = ElementAs<Tabs>(info[0])) {
    const int index = Nan::To<int>(info[1]).FromJust();
    const Rml::String content(*rml, rml.length());
    if constexpr (panel) {
      tabs->SetPanel(index, content);
    } else {
      tabs->SetTab(index, content);
    }
    RefreshElementOwnership();
  }
}

template <bool panel>
NAN_METHOD(SetTabElement) {
  if (!info[1]->IsInt32()) {
    return Nan::ThrowTypeError("Expected an int32 tab index");
  }
  const size_t active_depth = State().active_elements.size();
  auto* tabs = ElementAs<Tabs>(info[0]);
  auto* element = tabs ? ElementOf(info[2]) : nullptr;
  if (!element || !CanInsertElement(tabs, element, active_depth)) {
    return;
  }
  const int index = Nan::To<int>(info[1]).FromJust();
  auto token = ShareElement(element);
  if constexpr (panel) {
    tabs->SetPanel(index, std::move(token->owned));
  } else {
    tabs->SetTab(index, std::move(token->owned));
  }
  RefreshElementOwnership();
}

NAN_METHOD(GetNumTabs) {
  if (auto* tabs = ElementAs<Tabs>(info[0])) {
    const int count = tabs->GetNumTabs();
    RefreshElementOwnership();
    info.GetReturnValue().Set(count);
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlPanels) {
  SetRuntimeMethod<ElementGet<Progress, &Progress::GetValue>, true>(
      target, "getProgressValue");
  SetRuntimeMethod<ElementGet<Progress, &Progress::GetMax>, true>(
      target, "getProgressMax");
  SetRuntimeMethod<SetProgressFloat<&Progress::SetValue>>(target,
                                                          "setProgressValue");
  SetRuntimeMethod<SetProgressFloat<&Progress::SetMax>>(target,
                                                        "setProgressMax");
  SetRuntimeMethod<SetTabRml<false>>(target, "setTabRml");
  SetRuntimeMethod<SetTabRml<true>>(target, "setPanelRml");
  SetRuntimeMethod<SetTabElement<false>>(target, "setTabElement");
  SetRuntimeMethod<SetTabElement<true>>(target, "setPanelElement");
  SetRuntimeMethod<ElementSetInt<Tabs, &Tabs::RemoveTab>>(target, "removeTab");
  // GetNumTabs creates the native tabs container if it does not yet exist.
  SetRuntimeMethod<GetNumTabs>(target, "getNumTabs");
  SetRuntimeMethod<ElementSetInt<Tabs, &Tabs::SetActiveTab>>(target,
                                                             "setActiveTab");
  SetRuntimeMethod<ElementGet<Tabs, &Tabs::GetActiveTab>, true>(target,
                                                                "getActiveTab");
}

}  // namespace sfmlrmlui
