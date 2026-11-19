// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Factory.h>
#include <nan.h>

#include <utility>

#include "native/animation/rmlui-animation-values.h"
#include "native/dom/documents/rmlui-document-ownership.h"
#include "native/io/rmlui-stream.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-style-sheet.h"
#include "native/values/rmlui-variant.h"
#include "third_party/rmlui/Source/Core/StreamFile.h"

namespace sfmlrmlui {
namespace {

bool ReadString(v8::Local<v8::Value> input, Rml::String* result) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a Factory string");
    return false;
  }
  Nan::Utf8String text(input);
  result->assign(*text, text.length());
  return true;
}

NAN_METHOD(InstanceElement) {
  Rml::String instancer;
  Rml::String tag;
  Rml::XMLAttributes attributes;
  if (!ReadString(info[1], &instancer) || !ReadString(info[2], &tag) ||
      !ReadElementAttributes(info[3], &attributes)) {
    return;
  }
  // Attribute getters may destroy or replace the parent and runtime.
  auto* parent = info[0]->IsNull() ? nullptr : ElementOf(info[0]);
  if ((!parent && !info[0]->IsNull()) || !RuntimeReady()) {
    return;
  }
  RefreshElementOwnership();
  auto element =
      Rml::Factory::InstanceElement(parent, instancer, tag, attributes);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (!element) {
    info.GetReturnValue().SetNull();
    return;
  }
  RebindClonedElementTweens(element.get());
  auto* pointer = element.get();
  auto handle = WrapOwnedElement(std::move(element));
  RefreshElementSubtreeOwnership(pointer);
  info.GetReturnValue().Set(handle);
}

Rml::Element* ParsingParent(v8::Local<v8::Value> input) {
  auto* parent = ElementOf(input);
  if (!parent) {
    return nullptr;
  }
  if (IsContextRoot(parent)) {
    Nan::ThrowError("Use document APIs to modify a context root");
    return nullptr;
  }
  return CanReplaceElementChildren(parent) ? parent : nullptr;
}

NAN_METHOD(InstanceElementText) {
  Rml::String text;
  if (!ReadString(info[1], &text)) {
    return;
  }
  auto* parent = ParsingParent(info[0]);
  if (!parent) {
    return;
  }
  const bool parsed = Rml::Factory::InstanceElementText(parent, text);
  RefreshElementOwnership();
  info.GetReturnValue().Set(parsed);
}

NAN_METHOD(InstanceElementStream) {
  auto stream = ShareStream(info[1]);
  auto* parent = stream ? ParsingParent(info[0]) : nullptr;
  if (!parent) {
    return;
  }
  // Stream callback guards preserve parent and stream across parser calls.
  const bool parsed =
      Rml::Factory::InstanceElementStream(parent, stream->value.get());
  RefreshElementOwnership();
  info.GetReturnValue().Set(parsed && !stream->value->HasReadError());
}

NAN_METHOD(InstanceDocumentStream) {
  Rml::String tag;
  if (!ReadString(info[2], &tag)) {
    return;
  }
  auto stream = ShareStream(info[1]);
  auto* context = stream ? ContextOf(info[0]) : nullptr;
  if (!context) {
    return;
  }
  auto document =
      Rml::Factory::InstanceDocumentStream(context, stream->value.get(), tag);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (!document || stream->value->HasReadError()) {
    info.GetReturnValue().SetNull();
    return;
  }
  auto token = ShareElement(document.get());
  RegisterContextDocumentOwner(context, token);
  info.GetReturnValue().Set(WrapOwnedElement(std::move(document)));
  RefreshElementOwnership();
}

void ReturnContainer(const Nan::FunctionCallbackInfo<v8::Value>& info,
                     Rml::SharedPtr<Rml::StyleSheetContainer> value) {
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  info.GetReturnValue().Set(
      value ? v8::Local<v8::Value>(WrapStyleSheetContainer(std::move(value)))
            : v8::Local<v8::Value>(Nan::Null()));
}

NAN_METHOD(InstanceStyleSheetString) {
  Rml::String text;
  if (ReadString(info[0], &text)) {
    ReturnContainer(info, Rml::Factory::InstanceStyleSheetString(text));
  }
}

NAN_METHOD(InstanceStyleSheetFile) {
  Rml::String filename;
  if (!ReadString(info[0], &filename)) {
    return;
  }
  if (filename.find('\0') != Rml::String::npos) {
    return Nan::ThrowTypeError("Factory filename contains a null character");
  }
  // Factory's upstream file helper ignores Open's result. Check first so a
  // missing file cannot become a successful empty stylesheet.
  Rml::StreamFile stream;
  if (!stream.Open(filename)) {
    info.GetReturnValue().SetNull();
    return;
  }
  ReturnContainer(info, Rml::Factory::InstanceStyleSheetStream(&stream));
}

NAN_METHOD(InstanceStyleSheetStream) {
  if (auto stream = ShareStream(info[0])) {
    auto result = Rml::Factory::InstanceStyleSheetStream(stream->value.get());
    ReturnContainer(
        info, stream->value->HasReadError() ? nullptr : std::move(result));
  }
}

template <auto operation>
NAN_METHOD(ClearCache) {
  operation();
}

NAN_METHOD(IsStructuralDataView) {
  Rml::String name;
  if (ReadString(info[0], &name)) {
    info.GetReturnValue().Set(Rml::Factory::IsStructuralDataView(name));
  }
}

NAN_METHOD(GetStructuralDataViewAttributeNames) {
  const auto& names = Rml::Factory::GetStructuralDataViewAttributeNames();
  auto result = Nan::New<v8::Array>(names.size());
  uint32_t index = 0;
  for (const auto& name : names) {
    result
        ->CreateDataProperty(
            Nan::GetCurrentContext(), index++, Nan::New(name).ToLocalChecked())
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlFactory) {
  SetRuntimeMethod<InstanceElement>(target, "factoryInstanceElement");
  SetRuntimeMethod<InstanceElementText>(target, "factoryInstanceElementText");
  SetRuntimeMethod<InstanceElementStream>(target,
                                          "factoryInstanceElementStream");
  SetRuntimeMethod<InstanceDocumentStream>(target,
                                           "factoryInstanceDocumentStream");
  SetRuntimeMethod<InstanceStyleSheetString>(target,
                                             "factoryInstanceStyleSheetString");
  SetRuntimeMethod<InstanceStyleSheetFile>(target,
                                           "factoryInstanceStyleSheetFile");
  SetRuntimeMethod<InstanceStyleSheetStream>(target,
                                             "factoryInstanceStyleSheetStream");
  SetRuntimeMethod<ClearCache<&Rml::Factory::ClearStyleSheetCache>>(
      target, "factoryClearStyleSheetCache");
  SetRuntimeMethod<ClearCache<&Rml::Factory::ClearTemplateCache>>(
      target, "factoryClearTemplateCache");
  SetInstancerValueMethod<IsStructuralDataView>(target,
                                                "factoryIsStructuralDataView");
  SetInstancerValueMethod<GetStructuralDataViewAttributeNames>(
      target, "factoryGetStructuralDataViewAttributeNames");
}

}  // namespace sfmlrmlui
