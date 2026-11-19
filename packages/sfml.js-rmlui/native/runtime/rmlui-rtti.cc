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
#include <RmlUi/Core/ScriptInterface.h>
#include <RmlUi/Lottie/ElementLottie.h>
#include <RmlUi/SVG/ElementSVG.h>
#include <nan.h>

#include <algorithm>
#include <cstdint>
#include <limits>
#include <stdexcept>
#include <string_view>

#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/rmlui-script-object.h"

namespace sfmlrmlui {
namespace {

// Return an opaque registry index, never the native pointer or its bits.
uint32_t ClassIndex(Rml::ClassId identifier) {
  auto& identifiers = State().class_identifiers;
  const auto found =
      std::find(identifiers.begin(), identifiers.end(), identifier);
  if (found != identifiers.end()) {
    return static_cast<uint32_t>(found - identifiers.begin());
  }
  if (identifiers.size() >= std::numeric_limits<uint32_t>::max()) {
    throw std::overflow_error("RmlUi class identifier registry is full");
  }
  identifiers.push_back(identifier);
  return static_cast<uint32_t>(identifiers.size() - 1);
}

NAN_METHOD(GetStaticClassIdentifier) {
  if (!info[0]->IsString()) {
    return Nan::ThrowTypeError("Expected a registered native class name");
  }
  const Nan::Utf8String text(info[0]);
  const std::string_view name(*text, text.length());
  struct ClassEntry {
    std::string_view name;
    Rml::ClassId (*identifier)();
  };
  static const ClassEntry kClasses[] = {
      {"ScriptInterface", Rml::ScriptInterface::GetStaticClassIdentifier},
      {"Context", Rml::Context::GetStaticClassIdentifier},
      {"Element", Rml::Element::GetStaticClassIdentifier},
      {"Document", Rml::ElementDocument::GetStaticClassIdentifier},
      {"ElementForm", Rml::ElementForm::GetStaticClassIdentifier},
      {"ElementFormControl", Rml::ElementFormControl::GetStaticClassIdentifier},
      {"ElementFormControlInput",
       Rml::ElementFormControlInput::GetStaticClassIdentifier},
      {"ElementFormControlSelect",
       Rml::ElementFormControlSelect::GetStaticClassIdentifier},
      {"ElementFormControlTextArea",
       Rml::ElementFormControlTextArea::GetStaticClassIdentifier},
      {"ElementText", Rml::ElementText::GetStaticClassIdentifier},
      {"ElementProgress", Rml::ElementProgress::GetStaticClassIdentifier},
      {"ElementTabSet", Rml::ElementTabSet::GetStaticClassIdentifier},
      {"ElementSVG", Rml::ElementSVG::GetStaticClassIdentifier},
      {"ElementLottie", Rml::ElementLottie::GetStaticClassIdentifier},
  };
  for (const auto& entry : kClasses) {
    if (entry.name == name) {
      info.GetReturnValue().Set(ClassIndex(entry.identifier()));
      return;
    }
  }
  Nan::ThrowTypeError("Unknown native scriptable class");
}

Rml::ScriptInterface* ScriptOf(v8::Local<v8::Value> value) {
  if (EventHandle::TryFrom(value)) {
    return EventOf(value);
  }
  if (ContextHandle::TryFrom(value)) {
    return ContextOf(value);
  }
  return ElementOf(value);
}

NAN_METHOD(GetClassIdentifier) {
  if (auto* script = ScriptOf(info[0])) {
    info.GetReturnValue().Set(ClassIndex(script->GetClassIdentifier()));
  }
}

NAN_METHOD(IsClass) {
  const auto& identifiers = State().class_identifiers;
  if (!info[1]->IsUint32() ||
      Nan::To<uint32_t>(info[1]).FromJust() >= identifiers.size()) {
    return Nan::ThrowTypeError("Expected a registered class identifier");
  }
  const auto identifier = identifiers[Nan::To<uint32_t>(info[1]).FromJust()];
  if (auto* script = ScriptOf(info[0])) {
    info.GetReturnValue().Set(script->IsClass(identifier));
  }
}

void ReturnScriptObject(Rml::ScriptInterface* script,
                        const Nan::FunctionCallbackInfo<v8::Value>& info) {
  if (!script) {
    return;
  }
  v8::Local<v8::Value> value;
  if (ReadScriptObject(script).ToLocal(&value)) {
    info.GetReturnValue().Set(value);
  }
}

NAN_METHOD(GetElementScriptObject) {
  ReturnScriptObject(ElementOf(info[0]), info);
}

NAN_METHOD(GetEventScriptObject) {
  ReturnScriptObject(EventOf(info[0]), info);
}

NAN_METHOD(GetContextScriptObject) {
  ReturnScriptObject(ContextOf(info[0]), info);
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlRtti) {
  SetRuntimeMethod<GetStaticClassIdentifier, true, false>(
      target, "getStaticClassIdentifier");
  SetRuntimeMethod<GetClassIdentifier, true, false>(target,
                                                    "getClassIdentifier");
  SetRuntimeMethod<IsClass, true, false>(target, "isClass");
  SetRuntimeMethod<GetElementScriptObject, true>(target,
                                                 "getElementScriptObject");
  SetRuntimeMethod<GetEventScriptObject, true, false>(target,
                                                      "getEventScriptObject");
  SetInstancerValueMethod<GetContextScriptObject>(target,
                                                  "getContextScriptObject");
}

}  // namespace sfmlrmlui
