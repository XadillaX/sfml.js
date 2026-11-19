// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/PropertiesIteratorView.h>

#include <string>
#include <utility>
#include <vector>

#include "native/animation/rmlui-animation-values.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-property.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

struct PropertyKey {
  Rml::PropertyId id{Rml::PropertyId::Invalid};
  Rml::String name;
  bool named{false};
};

bool ReadKey(v8::Local<v8::Value> input, PropertyKey* key) {
  if (input->IsString()) {
    Nan::Utf8String text(input);
    key->name.assign(*text, text.length());
    key->named = true;
    return true;
  }
  return ReadPropertyId(input, &key->id);
}

template <bool local>
NAN_METHOD(GetProperty) {
  PropertyKey key;
  VariantSelector selector;
  const bool convert = !info[2]->IsUndefined();
  if (!ReadKey(info[1], &key) ||
      (convert && !VariantSelectorFromJs(info[2], &selector))) {
    return;
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  const auto* borrowed = key.named
                             ? (local ? element->GetLocalProperty(key.name)
                                      : element->GetProperty(key.name))
                             : (local ? element->GetLocalProperty(key.id)
                                      : element->GetProperty(key.id));
  // The pointer can be invalidated by ANY following RmlUi call.
  const Rml::Property copy = borrowed ? *borrowed : Rml::Property{};
  if (convert) {
    v8::Local<v8::Value> converted;
    if (ConvertVariantToJs(borrowed ? &copy.value : nullptr, selector, true)
            .ToLocal(&converted)) {
      info.GetReturnValue().Set(converted);
    }
  } else if (borrowed) {
    info.GetReturnValue().Set(WrapProperty(copy));
  } else {
    info.GetReturnValue().SetNull();
  }
}

NAN_METHOD(GetLocalStyleProperties) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  const auto properties = element->GetLocalStyleProperties();
  auto entries = Nan::New<v8::Array>(properties.size());
  uint32_t index = 0;
  for (const auto& [id, property] : properties) {
    auto entry = Nan::New<v8::Array>(2);
    Nan::DefineOwnProperty(
        entry, Nan::New("0").ToLocalChecked(), Nan::New(static_cast<int>(id)))
        .FromJust();
    Nan::DefineOwnProperty(
        entry, Nan::New("1").ToLocalChecked(), WrapProperty(property))
        .FromJust();
    Nan::DefineOwnProperty(
        entries, Nan::New(std::to_string(index++)).ToLocalChecked(), entry)
        .FromJust();
  }
  info.GetReturnValue().Set(entries);
}

NAN_METHOD(IterateLocalProperties) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  Rml::Element* filter = nullptr;
  if (!info[1]->IsNull()) {
    filter = ElementOf(info[1]);
    if (!filter) {
      return;
    }
  }
  // Copy before wrapping: any later Core call may invalidate borrowed values.
  std::vector<std::pair<Rml::String, Rml::Property>> properties;
  for (auto it = element->IterateLocalProperties(filter); !it.AtEnd(); ++it) {
    const auto entry = *it;
    properties.emplace_back(entry.first, entry.second);
  }
  auto entries = Nan::New<v8::Array>(properties.size());
  uint32_t index = 0;
  for (const auto& [name, property] : properties) {
    auto entry = Nan::New<v8::Array>(2);
    entry
        ->CreateDataProperty(
            Nan::GetCurrentContext(), 0, Nan::New(name).ToLocalChecked())
        .FromJust();
    entry
        ->CreateDataProperty(
            Nan::GetCurrentContext(), 1, WrapProperty(property))
        .FromJust();
    entries->CreateDataProperty(Nan::GetCurrentContext(), index++, entry)
        .FromJust();
  }
  info.GetReturnValue().Set(entries);
}

NAN_METHOD(SetTypedProperty) {
  Rml::PropertyId id;
  Rml::Property property;
  if (!ReadPropertyId(info[1], &id) || !CopyProperty(info[2], &property) ||
      !ValidatePropertyStorage(property)) {
    return;
  }
  auto* element = ElementOf(info[0]);
  if (element) {
    RebindVariantTweens(&property.value, element);
    info.GetReturnValue().Set(element->SetProperty(id, property));
  }
}

NAN_METHOD(RemoveTypedProperty) {
  Rml::PropertyId id;
  if (!ReadPropertyId(info[1], &id)) {
    return;
  }
  if (auto* element = ElementOf(info[0])) {
    element->RemoveProperty(id);
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlElementProperty) {
  SetEffectMethod<GetProperty<false>>(target, "getProperty");
  SetEffectMethod<GetProperty<true>>(target, "getLocalProperty");
  SetEffectMethod<GetLocalStyleProperties>(target, "getLocalStyleProperties");
  SetEffectMethod<IterateLocalProperties>(target, "iterateLocalProperties");
  SetRuntimeMethod<SetTypedProperty, true>(target, "setTypedProperty");
  SetRuntimeMethod<RemoveTypedProperty, true>(target, "removeTypedProperty");
}

}  // namespace sfmlrmlui
