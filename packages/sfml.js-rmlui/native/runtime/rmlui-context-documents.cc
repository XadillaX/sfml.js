// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <nan.h>

#include <cmath>
#include <limits>

#include "native/runtime/rmlui-debugger.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

NAN_METHOD(CreateDocument) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a document instancer name");
  }
  if (auto* context = ContextOf(info[0])) {
    Nan::Utf8String name(info[1]);
    info.GetReturnValue().Set(WrapNullableElement(
        context->CreateDocument(Rml::String(*name, name.length()))));
  }
}

NAN_METHOD(GetDocument) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  Rml::ElementDocument* document = nullptr;
  if (info[1]->IsString()) {
    Nan::Utf8String id(info[1]);
    document = context->GetDocument(Rml::String(*id, id.length()));
  } else if (info[1]->IsInt32()) {
    document = context->GetDocument(Nan::To<int>(info[1]).FromJust());
  } else {
    return Nan::ThrowTypeError("Expected a document id or int32 index");
  }
  info.GetReturnValue().Set(WrapNullableElement(document));
}

NAN_METHOD(GetNumDocuments) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(context->GetNumDocuments());
  }
}

template <auto method>
NAN_METHOD(ChangeDocument) {
  auto* context = ContextOf(info[0]);
  auto* document = context ? DocumentOf(info[1]) : nullptr;
  if (!document) {
    return;
  }
  if (document->GetContext() != context) {
    return Nan::ThrowError("Document does not belong to this context");
  }
  if constexpr (method == &Rml::Context::UnloadDocument) {
    if (!CanUnloadDebuggerDocument(document)) {
      return;
    }
  }

  (context->*method)(document);
}

NAN_METHOD(UnloadAllDocuments) {
  if (auto* context = ContextOf(info[0])) {
    ReleaseDebuggerForContext(context);
    context->UnloadAllDocuments();
  }
}

template <auto getter>
NAN_METHOD(GetStateElement) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(WrapNullableElement((context->*getter)()));
  }
}

bool ReadPoint(v8::Local<v8::Value> value, Rml::Vector2f* point) {
  if (!value->IsObject()) {
    Nan::ThrowTypeError("Expected a point with numeric x and y");
    return false;
  }
  auto object = value.As<v8::Object>();
  v8::Local<v8::Value> x;
  v8::Local<v8::Value> y;
  if (!Nan::Get(object, Nan::New("x").ToLocalChecked()).ToLocal(&x) ||
      !Nan::Get(object, Nan::New("y").ToLocalChecked()).ToLocal(&y)) {
    return false;
  }
  if (!x->IsNumber() || !y->IsNumber()) {
    Nan::ThrowTypeError("Expected a point with numeric x and y");
    return false;
  }
  const double coordinate_x = Nan::To<double>(x).FromJust();
  const double coordinate_y = Nan::To<double>(y).FromJust();
  for (double coordinate : {coordinate_x, coordinate_y}) {
    if (!std::isfinite(coordinate) ||
        coordinate < std::numeric_limits<int>::min() ||
        coordinate > std::numeric_limits<int>::max()) {
      Nan::ThrowRangeError("Point exceeds native screen coordinate range");
      return false;
    }
  }
  *point = {static_cast<float>(coordinate_x), static_cast<float>(coordinate_y)};
  // Native clipping tests convert coordinates to int, including after float
  // rounding. Reject nonrepresentable screen points before that conversion.
  for (float coordinate : {point->x, point->y}) {
    if (!std::isfinite(coordinate) ||
        static_cast<double>(coordinate) < std::numeric_limits<int>::min() ||
        static_cast<double>(coordinate) > std::numeric_limits<int>::max()) {
      Nan::ThrowRangeError("Point exceeds native screen coordinate range");
      return false;
    }
  }
  return true;
}

NAN_METHOD(GetElementAtPoint) {
  Rml::Vector2f point;
  if (!ReadPoint(info[1], &point)) {
    return;
  }
  // Point getters can destroy contexts and argument elements. Resolve every
  // native reference only after reading both coordinates.
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  auto* ignore = info[2]->IsNull() ? nullptr : ElementOf(info[2]);
  if (!ignore && !info[2]->IsNull()) {
    return;
  }
  auto* element = info[3]->IsNull() ? nullptr : ElementOf(info[3]);
  if (!element && !info[3]->IsNull()) {
    return;
  }
  auto* root = context->GetRootElement();
  if ((ignore && ignore != root && ignore->GetContext() != context) ||
      (element && element != root && element->GetContext() != context)) {
    return Nan::ThrowError("Hit-test elements must belong to this context");
  }
  info.GetReturnValue().Set(
      WrapNullableElement(context->GetElementAtPoint(point, ignore, element)));
}

NAN_METHOD(SetDocumentsBaseTag) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a document base tag");
  }
  if (auto* context = ContextOf(info[0])) {
    Nan::Utf8String tag(info[1]);
    context->SetDocumentsBaseTag(Rml::String(*tag, tag.length()));
  }
}

NAN_METHOD(GetDocumentsBaseTag) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(
        Nan::New(context->GetDocumentsBaseTag()).ToLocalChecked());
  }
}

NAN_METHOD(SetDefaultScrollBehavior) {
  if (!info[1]->IsInt32() || Nan::To<int>(info[1]).FromJust() < 0 ||
      Nan::To<int>(info[1]).FromJust() >
          static_cast<int>(Rml::ScrollBehavior::Instant)) {
    return Nan::ThrowTypeError("Invalid scroll behavior");
  }
  if (!info[2]->IsNumber()) {
    return Nan::ThrowTypeError("Expected a positive scroll speed");
  }
  const double speed = Nan::To<double>(info[2]).FromJust();
  if (!std::isfinite(speed) || speed > std::numeric_limits<float>::max() ||
      !(static_cast<float>(speed) > 0)) {
    return Nan::ThrowRangeError("Scroll speed must be a positive finite float");
  }
  if (auto* context = ContextOf(info[0])) {
    context->SetDefaultScrollBehavior(
        static_cast<Rml::ScrollBehavior>(Nan::To<int>(info[1]).FromJust()),
        static_cast<float>(speed));
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlContextDocuments) {
  SetRuntimeMethod<CreateDocument>(target, "createDocument");
  SetRuntimeMethod<GetDocument, true>(target, "getDocument");
  SetRuntimeMethod<GetNumDocuments, true>(target, "getNumDocuments");
  SetRuntimeMethod<ChangeDocument<&Rml::Context::UnloadDocument>>(
      target, "unloadDocument");
  SetRuntimeMethod<UnloadAllDocuments>(target, "unloadAllDocuments");
  SetRuntimeMethod<ChangeDocument<&Rml::Context::PullDocumentToFront>>(
      target, "pullDocumentToFront");
  SetRuntimeMethod<ChangeDocument<&Rml::Context::PushDocumentToBack>>(
      target, "pushDocumentToBack");
  SetRuntimeMethod<ChangeDocument<&Rml::Context::UnfocusDocument>>(
      target, "unfocusDocument");
  SetRuntimeMethod<GetStateElement<&Rml::Context::GetHoverElement>, true>(
      target, "getHoverElement");
  SetRuntimeMethod<GetStateElement<&Rml::Context::GetFocusElement>, true>(
      target, "getFocusElement");
  SetRuntimeMethod<GetElementAtPoint, true>(target, "getElementAtPoint");
  SetRuntimeMethod<SetDocumentsBaseTag>(target, "setDocumentsBaseTag");
  SetRuntimeMethod<GetDocumentsBaseTag, true>(target, "getDocumentsBaseTag");
  SetRuntimeMethod<SetDefaultScrollBehavior>(target,
                                             "setDefaultScrollBehavior");
}

}  // namespace sfmlrmlui
