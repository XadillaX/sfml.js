// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/dom/elements/rmlui-box.h"

#include <numeric-fields.h>
#include <sfml-js-interop.h>

#include <cmath>
#include <limits>
#include <memory>

// MemberAccess injects its friend into sfmljs; tags must live there too.
// Access the actual upstream members, not a replica of their object layout.
namespace sfmljs {

using BoxEdges = float[Rml::Box::num_areas][Rml::Box::num_edges];
SFMLJS_MEMBER(BoxContent, Rml::Box, Rml::Vector2f, content);
SFMLJS_MEMBER(BoxAreaEdges, Rml::Box, BoxEdges, area_edges);
SFMLJS_MEMBER(RenderFillSize, Rml::RenderBox, Rml::Vector2f, fill_size);
SFMLJS_MEMBER(RenderBorderOffset, Rml::RenderBox, Rml::Vector2f, border_offset);
SFMLJS_MEMBER(RenderBorderWidths,
              Rml::RenderBox,
              Rml::EdgeSizes,
              border_widths);
SFMLJS_MEMBER(RenderBorderRadius,
              Rml::RenderBox,
              Rml::CornerSizes,
              border_radius);

}  // namespace sfmljs

namespace sfmlrmlui {
namespace {

using BoxHandle = sfmljs::SharedHandle<Rml::Box>;
using RenderBoxHandle = sfmljs::SharedHandle<Rml::RenderBox>;

void Own(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

template <typename Value>
void MapFloats(v8::Local<v8::Object> result,
               const char* key,
               const std::shared_ptr<Value>& owner,
               float* data,
               size_t count) {
  auto buffer = sfmljs::MapShared(
      v8::Isolate::GetCurrent(), owner, data, count * sizeof(float));
  Own(result, key, v8::Float32Array::New(buffer, 0, count));
}

v8::Local<v8::Object> VectorResult(Rml::Vector2f value) {
  auto result = Nan::New<v8::Object>();
  Own(result, "x", Nan::New(value.x));
  Own(result, "y", Nan::New(value.y));
  return result;
}

v8::Local<v8::Array> ArrayResult(const Rml::EdgeSizes& values) {
  auto result = Nan::New<v8::Array>(4);
  for (uint32_t i = 0; i < 4; ++i) {
    result->CreateDataProperty(Nan::GetCurrentContext(), i, Nan::New(values[i]))
        .FromJust();
  }
  return result;
}

bool FiniteFloat(v8::Local<v8::Value> value, float* result) {
  if (value->IsNumber()) {
    const double number = Nan::To<double>(value).FromJust();
    if (std::isfinite(number) &&
        std::abs(number) <= std::numeric_limits<float>::max()) {
      *result = static_cast<float>(number);
      return true;
    }
  }
  Nan::ThrowTypeError("Expected a finite box float");
  return false;
}

bool FourFloats(v8::Local<v8::Value> value, Rml::EdgeSizes* result) {
  if (!value->IsArray() || value.As<v8::Array>()->Length() != 4) {
    Nan::ThrowTypeError("Expected an array of four finite floats");
    return false;
  }
  for (uint32_t i = 0; i < 4; ++i) {
    v8::Local<v8::Value> item;
    if (!Nan::Get(value.As<v8::Array>(), i).ToLocal(&item) ||
        !FiniteFloat(item, &(*result)[i])) {
      return false;
    }
  }
  return true;
}

template <typename Enum>
bool EnumValue(v8::Local<v8::Value> value,
               int maximum,
               Enum* result,
               const char* message) {
  if (value->IsInt32()) {
    const int number = Nan::To<int>(value).FromJust();
    if (number >= 0 && number <= maximum) {
      *result = static_cast<Enum>(number);
      return true;
    }
  }
  Nan::ThrowRangeError(message);
  return false;
}

bool Area(v8::Local<v8::Value> value, Rml::BoxArea* result, int maximum = 3) {
  return EnumValue(value, maximum, result, "Invalid box area");
}

bool Edge(v8::Local<v8::Value> value, Rml::BoxEdge* result) {
  return EnumValue(value, 3, result, "Invalid box edge");
}

bool FiniteVector(Rml::Vector2f value) {
  return std::isfinite(value.x) && std::isfinite(value.y);
}

bool FiniteBox(const Rml::Box& box) {
  bool valid = FiniteVector(box.GetSize());
  for (int area = 0; area < Rml::Box::num_areas; ++area) {
    for (int edge = 0; edge < Rml::Box::num_edges; ++edge) {
      valid &= std::isfinite(box.GetEdge(static_cast<Rml::BoxArea>(area),
                                         static_cast<Rml::BoxEdge>(edge)));
    }
  }
  if (!valid) {
    Nan::ThrowTypeError("Box shared fields must be finite");
  }
  return valid;
}

Rml::Box* BoxOf(v8::Local<v8::Value> value) {
  auto* handle = BoxHandle::From(value);
  return handle && FiniteBox(*handle->owner()) ? handle->owner().get()
                                               : nullptr;
}

Rml::RenderBox* RenderBoxOf(v8::Local<v8::Value> value) {
  auto* handle = RenderBoxHandle::From(value);
  if (!handle) {
    return nullptr;
  }
  auto* box = handle->owner().get();
  bool valid =
      FiniteVector(box->GetFillSize()) && FiniteVector(box->GetBorderOffset());
  for (float item : box->GetBorderWidths()) {
    valid &= std::isfinite(item);
  }
  for (float item : box->GetBorderRadius()) {
    valid &= std::isfinite(item);
  }
  if (!valid) {
    Nan::ThrowTypeError("RenderBox shared fields must be finite");
    return nullptr;
  }
  return box;
}

NAN_METHOD(CreateBox) {
  if (info[0]->IsUndefined()) {
    info.GetReturnValue().Set(WrapBox(Rml::Box()));
  } else {
    Rml::Vector2f content;
    if (ReadBoxVector(info[0], &content)) {
      info.GetReturnValue().Set(WrapBox(Rml::Box(content)));
    }
  }
}

NAN_METHOD(CloneBox) {
  if (auto* box = BoxOf(info[0])) {
    info.GetReturnValue().Set(WrapBox(*box));
  }
}

NAN_METHOD(BoxGetSize) {
  Rml::BoxArea area;
  if (!info[1]->IsUndefined() && !Area(info[1], &area)) {
    return;
  }
  if (auto* box = BoxOf(info[0])) {
    info.GetReturnValue().Set(VectorResult(
        info[1]->IsUndefined() ? box->GetSize() : box->GetSize(area)));
  }
}

template <auto getter>
NAN_METHOD(BoxAreaVector) {
  Rml::BoxArea area;
  if (!Area(info[1], &area)) {
    return;
  }
  if (auto* box = BoxOf(info[0])) {
    info.GetReturnValue().Set(VectorResult((box->*getter)(area)));
  }
}

NAN_METHOD(BoxSetContent) {
  Rml::Vector2f content;
  if (!ReadBoxVector(info[1], &content)) {
    return;
  }
  // Permit repairing a non-finite view through its public setter.
  if (auto* handle = BoxHandle::From(info[0])) {
    handle->owner()->SetContent(content);
  }
}

NAN_METHOD(BoxSetEdge) {
  Rml::BoxArea area;
  Rml::BoxEdge edge;
  float size;
  if (!Area(info[1], &area, 2) || !Edge(info[2], &edge) ||
      !FiniteFloat(info[3], &size)) {
    return;
  }
  if (auto* handle = BoxHandle::From(info[0])) {
    handle->owner()->SetEdge(area, edge, size);
  }
}

template <auto getter, int maximum_area>
NAN_METHOD(BoxEdgeValue) {
  Rml::BoxArea area;
  Rml::BoxEdge edge;
  if (!Area(info[1], &area, maximum_area) || !Edge(info[2], &edge)) {
    return;
  }
  if (auto* box = BoxOf(info[0])) {
    info.GetReturnValue().Set((box->*getter)(area, edge));
  }
}

NAN_METHOD(BoxGetSizeAcross) {
  Rml::BoxDirection direction;
  Rml::BoxArea area;
  Rml::BoxArea area_end;
  if (!EnumValue(info[1], 1, &direction, "Invalid box direction") ||
      !Area(info[2], &area) || !Area(info[3], &area_end)) {
    return;
  }
  if (area > area_end) {
    return Nan::ThrowRangeError("Outer box area must precede inner area");
  }
  if (auto* box = BoxOf(info[0])) {
    info.GetReturnValue().Set(box->GetSizeAcross(direction, area, area_end));
  }
}

template <bool unequal>
NAN_METHOD(BoxCompare) {
  auto* left = BoxOf(info[0]);
  if (!left) {
    return;
  }
  if (auto* right = BoxOf(info[1])) {
    info.GetReturnValue().Set(unequal ? *left != *right : *left == *right);
  }
}

NAN_METHOD(CreateRenderBox) {
  Rml::Vector2f fill_size;
  Rml::Vector2f border_offset;
  Rml::EdgeSizes border_widths;
  Rml::CornerSizes border_radius;
  if (ReadBoxVector(info[0], &fill_size) &&
      ReadBoxVector(info[1], &border_offset) &&
      FourFloats(info[2], &border_widths) &&
      FourFloats(info[3], &border_radius)) {
    info.GetReturnValue().Set(WrapRenderBox(Rml::RenderBox(
        fill_size, border_offset, border_widths, border_radius)));
  }
}

NAN_METHOD(CloneRenderBox) {
  if (auto* box = RenderBoxOf(info[0])) {
    info.GetReturnValue().Set(WrapRenderBox(*box));
  }
}

template <auto getter>
NAN_METHOD(RenderVector) {
  if (auto* box = RenderBoxOf(info[0])) {
    info.GetReturnValue().Set(VectorResult((box->*getter)()));
  }
}

template <auto getter>
NAN_METHOD(RenderArray) {
  if (auto* box = RenderBoxOf(info[0])) {
    info.GetReturnValue().Set(ArrayResult((box->*getter)()));
  }
}

template <auto setter>
NAN_METHOD(RenderSetVector) {
  Rml::Vector2f value;
  if (!ReadBoxVector(info[1], &value)) {
    return;
  }
  if (auto* handle = RenderBoxHandle::From(info[0])) {
    (handle->owner().get()->*setter)(value);
  }
}

template <auto setter>
NAN_METHOD(RenderSetArray) {
  Rml::EdgeSizes value;
  if (!FourFloats(info[1], &value)) {
    return;
  }
  if (auto* handle = RenderBoxHandle::From(info[0])) {
    (handle->owner().get()->*setter)(value);
  }
}

template <bool unequal>
NAN_METHOD(RenderCompare) {
  auto* left = RenderBoxOf(info[0]);
  if (!left) {
    return;
  }
  if (auto* right = RenderBoxOf(info[1])) {
    info.GetReturnValue().Set(unequal ? *left != *right : *left == *right);
  }
}

}  // namespace

bool ReadBoxVector(v8::Local<v8::Value> value, Rml::Vector2f* result) {
  if (!value->IsObject()) {
    Nan::ThrowTypeError("Expected a finite box vector");
    return false;
  }
  v8::Local<v8::Value> x;
  v8::Local<v8::Value> y;
  return Nan::Get(value.As<v8::Object>(), Nan::New("x").ToLocalChecked())
             .ToLocal(&x) &&
         Nan::Get(value.As<v8::Object>(), Nan::New("y").ToLocalChecked())
             .ToLocal(&y) &&
         FiniteFloat(x, &result->x) && FiniteFloat(y, &result->y);
}

bool CopyBox(v8::Local<v8::Value> handle, Rml::Box* result) {
  if (auto* box = BoxOf(handle)) {
    *result = *box;
    return true;
  }
  return false;
}

v8::Local<v8::Object> WrapBox(const Rml::Box& box) {
  auto owner = std::make_shared<Rml::Box>(box);
  auto result = Nan::New<v8::Object>();
  Own(result, "handle", BoxHandle::Create(owner));
  MapFloats(result,
            "content",
            owner,
            &sfmljs::Field<sfmljs::BoxContent>(*owner).x,
            2);
  MapFloats(result,
            "edges",
            owner,
            &sfmljs::Field<sfmljs::BoxAreaEdges>(*owner)[0][0],
            Rml::Box::num_areas * Rml::Box::num_edges);
  return result;
}

v8::Local<v8::Object> WrapRenderBox(const Rml::RenderBox& box) {
  auto owner = std::make_shared<Rml::RenderBox>(box);
  auto result = Nan::New<v8::Object>();
  Own(result, "handle", RenderBoxHandle::Create(owner));
  MapFloats(result,
            "fillSize",
            owner,
            &sfmljs::Field<sfmljs::RenderFillSize>(*owner).x,
            2);
  MapFloats(result,
            "borderOffset",
            owner,
            &sfmljs::Field<sfmljs::RenderBorderOffset>(*owner).x,
            2);
  MapFloats(result,
            "borderWidths",
            owner,
            sfmljs::Field<sfmljs::RenderBorderWidths>(*owner).data(),
            4);
  MapFloats(result,
            "borderRadius",
            owner,
            sfmljs::Field<sfmljs::RenderBorderRadius>(*owner).data(),
            4);
  return result;
}

NAN_MODULE_INIT(InitializeRmlBox) {
  // Value objects do not depend on the process-wide RmlUi runtime.
  Own(target, "boxNumAreas", Nan::New(Rml::Box::num_areas));
  Own(target, "boxNumEdges", Nan::New(Rml::Box::num_edges));
  sfmljs::SetMethod<CreateBox>(target, "createBox");
  sfmljs::SetMethod<CloneBox>(target, "cloneBox");
  sfmljs::SetMethod<BoxGetSize>(target, "boxGetSize");
  sfmljs::SetMethod<BoxAreaVector<&Rml::Box::GetPosition>>(target,
                                                           "boxGetPosition");
  sfmljs::SetMethod<BoxAreaVector<&Rml::Box::GetFrameSize>>(target,
                                                            "boxGetFrameSize");
  sfmljs::SetMethod<BoxSetContent>(target, "boxSetContent");
  sfmljs::SetMethod<BoxSetEdge>(target, "boxSetEdge");
  sfmljs::SetMethod<BoxEdgeValue<&Rml::Box::GetEdge, 2>>(target, "boxGetEdge");
  sfmljs::SetMethod<BoxEdgeValue<&Rml::Box::GetCumulativeEdge, 3>>(
      target, "boxGetCumulativeEdge");
  sfmljs::SetMethod<BoxGetSizeAcross>(target, "boxGetSizeAcross");
  sfmljs::SetMethod<BoxCompare<false>>(target, "boxEquals");
  sfmljs::SetMethod<BoxCompare<true>>(target, "boxNotEquals");
  sfmljs::SetMethod<CreateRenderBox>(target, "createRenderBox");
  sfmljs::SetMethod<CloneRenderBox>(target, "cloneRenderBox");
  sfmljs::SetMethod<RenderVector<&Rml::RenderBox::GetFillSize>>(
      target, "renderBoxGetFillSize");
  sfmljs::SetMethod<RenderVector<&Rml::RenderBox::GetFillOffset>>(
      target, "renderBoxGetFillOffset");
  sfmljs::SetMethod<RenderVector<&Rml::RenderBox::GetBorderOffset>>(
      target, "renderBoxGetBorderOffset");
  sfmljs::SetMethod<RenderArray<&Rml::RenderBox::GetBorderWidths>>(
      target, "renderBoxGetBorderWidths");
  sfmljs::SetMethod<RenderArray<&Rml::RenderBox::GetBorderRadius>>(
      target, "renderBoxGetBorderRadius");
  sfmljs::SetMethod<RenderSetVector<&Rml::RenderBox::SetFillSize>>(
      target, "renderBoxSetFillSize");
  sfmljs::SetMethod<RenderSetVector<&Rml::RenderBox::SetBorderOffset>>(
      target, "renderBoxSetBorderOffset");
  sfmljs::SetMethod<RenderSetArray<&Rml::RenderBox::SetBorderWidths>>(
      target, "renderBoxSetBorderWidths");
  sfmljs::SetMethod<RenderSetArray<&Rml::RenderBox::SetBorderRadius>>(
      target, "renderBoxSetBorderRadius");
  sfmljs::SetMethod<RenderCompare<false>>(target, "renderBoxEquals");
  sfmljs::SetMethod<RenderCompare<true>>(target, "renderBoxNotEquals");
}

}  // namespace sfmlrmlui
