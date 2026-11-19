// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/ElementDocument.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <string>
#include <utility>

#include "native/dom/documents/rmlui-document-header.h"
#include "native/io/rmlui-stream.h"
#include "native/runtime/rmlui-debugger.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

NAN_METHOD(LoadDocument) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  Rml::ElementDocument* document;
  if (info[1]->IsString()) {
    Nan::Utf8String path(info[1]);
    document = context->LoadDocument(std::string(*path, path.length()));
  } else {
    auto stream = ShareStream(info[1]);
    if (!stream) {
      return;
    }
    document = context->LoadDocument(stream->value.get());
  }
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (!document) {
    return Nan::ThrowError("Failed to load Rml document");
  }
  info.GetReturnValue().Set(WrapDocument(document));
}

NAN_METHOD(LoadDocumentFromMemory) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected (context, rml)");
  }
  if (!info[2]->IsUndefined() && !info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected a source URL string");
  }
  Nan::Utf8String rml(info[1]);
  Rml::ElementDocument* document = nullptr;
  if (info[2]->IsString()) {
    Nan::Utf8String source_url(info[2]);
    const std::string source(*source_url, source_url.length());
    if (source.find('\0') != std::string::npos) {
      return Nan::ThrowTypeError("Source URL cannot contain a null byte");
    }
    document = context->LoadDocumentFromMemory(std::string(*rml, rml.length()),
                                               source);
  } else {
    document = context->LoadDocumentFromMemory(std::string(*rml, rml.length()));
  }
  if (!document) {
    return Nan::ThrowError("Failed to parse Rml document");
  }
  info.GetReturnValue().Set(WrapDocument(document));
}

NAN_METHOD(UnloadDocument) {
  auto* document = DocumentOf(info[0]);
  if (!document || !CanUnloadDebuggerDocument(document)) {
    return;
  }
  auto* context = document->GetContext();
  if (context != nullptr) {
    context->UnloadDocument(document);
  }
}

template <typename Flag>
bool ReadFlag(v8::Local<v8::Value> value, Flag maximum, Flag* result) {
  if (value->IsInt32()) {
    const int flag = Nan::To<int>(value).FromJust();
    if (flag >= 0 && flag <= static_cast<int>(maximum)) {
      *result = static_cast<Flag>(flag);
      return true;
    }
  }
  Nan::ThrowTypeError("Invalid document display flag");
  return false;
}

NAN_METHOD(Show) {
  Rml::ModalFlag modal;
  Rml::FocusFlag focus;
  Rml::ScrollFlag scroll;
  if (info[1]->IsBoolean()) {
    modal = info[1]->IsTrue() ? Rml::ModalFlag::Modal : Rml::ModalFlag::None;
  } else if (!ReadFlag(info[1], Rml::ModalFlag::Keep, &modal)) {
    return;
  }
  if (!ReadFlag(info[2], Rml::FocusFlag::Auto, &focus) ||
      !ReadFlag(info[3], Rml::ScrollFlag::Auto, &scroll)) {
    return;
  }
  auto* document = DocumentOf(info[0]);
  if (!document) {
    return;
  }
  document->Show(modal, focus, scroll);
}

NAN_METHOD(GetDocumentContext) {
  if (auto* document = DocumentOf(info[0])) {
    auto* context = document->GetContext();
    info.GetReturnValue().Set(context
                                  ? v8::Local<v8::Value>(WrapContext(context))
                                  : v8::Local<v8::Value>(Nan::Null()));
  }
}

NAN_METHOD(IsModal) {
  if (auto* document = DocumentOf(info[0])) {
    info.GetReturnValue().Set(document->IsModal());
  }
}

template <auto method>
NAN_METHOD(ChangeDocument) {
  if (auto* document = DocumentOf(info[0])) {
    (document->*method)();
  }
}

NAN_METHOD(FindNextTabElement) {
  if (!info[2]->IsBoolean() || !info[3]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected forward and wrapAround booleans");
  }
  auto* document = DocumentOf(info[0]);
  auto* current = document ? ElementOf(info[1]) : nullptr;
  if (!current) {
    return;
  }
  // The upstream walker dereferences ancestors up to the owning document.
  // A detached starting node has no such ancestor and would dereference null.
  if (current->GetOwnerDocument() != document) {
    return Nan::ThrowError("Tab search element must belong to this document");
  }
  info.GetReturnValue().Set(WrapNullableElement(document->FindNextTabElement(
      current, info[2]->IsTrue(), info[3]->IsTrue())));
}

NAN_METHOD(Hide) {
  auto* document = DocumentOf(info[0]);
  if (!document) {
    return;
  }
  document->Hide();
}

NAN_METHOD(Close) {
  auto* document = DocumentOf(info[0]);
  if (!document || !CanUnloadDebuggerDocument(document)) {
    return;
  }
  document->Close();
}

NAN_METHOD(GetTitle) {
  auto* document = DocumentOf(info[0]);
  if (!document) {
    return;
  }
  info.GetReturnValue().Set(Nan::New(document->GetTitle()).ToLocalChecked());
}

NAN_METHOD(ProcessHeader) {
  Rml::DocumentHeader header;
  if (!CopyDocumentHeader(info[1], &header)) {
    return;
  }
  if (auto* document = DocumentOf(info[0])) {
    document->ProcessHeader(&header);
  }
}

NAN_METHOD(SetTitle) {
  auto* document = DocumentOf(info[0]);
  if (!document) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected (document, title)");
  }
  Nan::Utf8String title(info[1]);
  document->SetTitle(std::string(*title, title.length()));
}

NAN_METHOD(GetSourceURL) {
  auto* document = DocumentOf(info[0]);
  if (!document) {
    return;
  }
  info.GetReturnValue().Set(
      Nan::New(document->GetSourceURL()).ToLocalChecked());
}

template <auto factory>
NAN_METHOD(CreateNode) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a node name or text string");
  }
  auto* document = DocumentOf(info[0]);
  if (!document) {
    return;
  }
  Nan::Utf8String value(info[1]);
  auto element = (document->*factory)(Rml::String(*value, value.length()));
  if (element) {
    info.GetReturnValue().Set(WrapOwnedElement(std::move(element)));
  } else {
    info.GetReturnValue().SetNull();
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlDocument) {
  SetRuntimeMethod<ProcessHeader>(target, "processDocumentHeader");
  SetRuntimeMethod<LoadDocument>(target, "loadDocument");
  SetRuntimeMethod<LoadDocumentFromMemory>(target, "loadDocumentFromMemory");
  SetRuntimeMethod<UnloadDocument>(target, "unloadDocumentHandle");
  SetRuntimeMethod<Show>(target, "showDocument");
  SetRuntimeMethod<GetDocumentContext, true>(target, "getDocumentContext");
  SetRuntimeMethod<IsModal, true>(target, "isDocumentModal");
  SetRuntimeMethod<ChangeDocument<&Rml::ElementDocument::PullToFront>>(
      target, "pullToFront");
  SetRuntimeMethod<ChangeDocument<&Rml::ElementDocument::PushToBack>>(
      target, "pushToBack");
  SetRuntimeMethod<ChangeDocument<&Rml::ElementDocument::UpdateDocument>>(
      target, "updateDocument");
  SetRuntimeMethod<FindNextTabElement, true>(target, "findNextTabElement");
  SetRuntimeMethod<Hide>(target, "hideDocument");
  SetRuntimeMethod<Close>(target, "closeDocument");
  SetPluginReadMethod<GetTitle>(target, "getDocumentTitle");
  SetRuntimeMethod<SetTitle, true>(target, "setDocumentTitle");
  SetPluginReadMethod<GetSourceURL>(target, "getDocumentSourceURL");
  SetRuntimeMethod<CreateNode<&Rml::ElementDocument::CreateElement>, true>(
      target, "createElement");
  SetRuntimeMethod<CreateNode<&Rml::ElementDocument::CreateTextNode>, true>(
      target, "createTextNode");
}

}  // namespace sfmlrmlui
