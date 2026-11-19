// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/manager/rmlui-render-state.h"

#include <RmlUi/Core/Geometry.h>
#include <RmlUi/Core/Matrix4.h>

#include <cmath>
#include <cstring>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/dom/elements/rmlui-box.h"
#include "native/rendering/geometry/rmlui-geometry.h"
#include "native/rendering/manager/rmlui-render-layers.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-filter.h"
#include "native/values/rmlui-buffer.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {

// No shared manager leases here: that would create an ownership cycle.
struct RenderClipStorage {
  std::vector<Rml::Geometry> geometries;
  std::vector<Rml::Matrix4f> transforms;
};

namespace {

// A context owns borrowed managers independently of their JS wrappers. Keep
// submitted geometry alive until replacement or explicit manager release.
auto& ActiveClipManagers() {
  static std::unordered_map<Rml::RenderManager*,
                            std::shared_ptr<RenderManagerState>>
      managers;
  return managers;
}

void SetClipStorage(const std::shared_ptr<RenderManagerState>& manager,
                    std::shared_ptr<RenderClipStorage> storage) {
  manager->clip_storage = std::move(storage);
  if (manager->clip_storage && !manager->clip_storage->geometries.empty() &&
      !manager->owned) {
    ActiveClipManagers()[manager->value] = manager;
  } else {
    ActiveClipManagers().erase(manager->value);
  }
}

struct MaskInput {
  Rml::ClipMaskOperation operation;
  v8::Local<v8::Value> geometry;
  Rml::Vector2f offset;
  v8::Local<v8::Value> matrix_input;
  Rml::Matrix4f matrix;
};

void SetData(v8::Local<v8::Object> object,
             const char* name,
             v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

bool GetField(v8::Local<v8::Object> object,
              const char* name,
              v8::Local<v8::Value>* result) {
  return Nan::Get(object, Nan::New(name).ToLocalChecked()).ToLocal(result);
}

bool ReadMatrix(v8::Local<v8::Value> input, Rml::Matrix4f* result) {
  *result = Rml::Matrix4f::Identity();
  if (input->IsNull()) {
    return true;
  }
  if (!input->IsFloat32Array()) {
    Nan::ThrowTypeError(
        "Expected a Float32Array matrix with 16 values or null");
    return false;
  }
  const auto view = input.As<v8::Float32Array>();
  if (view->Length() != 16 || view->Buffer()->WasDetached()) {
    Nan::ThrowRangeError("Expected a matrix with 16 values");
    return false;
  }
  const auto store = view->Buffer()->GetBackingStore();
  if (!IsFixedUnsharedBuffer(store)) {
    Nan::ThrowTypeError("Expected a fixed unshared matrix buffer");
    return false;
  }
  std::memcpy(result->data(),
              static_cast<const char*>(store->Data()) + view->ByteOffset(),
              16 * sizeof(float));
  for (size_t i = 0; i < 16; ++i) {
    if (!std::isfinite(result->data()[i])) {
      Nan::ThrowRangeError("Expected finite matrix values");
      return false;
    }
  }
  return true;
}

v8::Local<v8::Value> WrapMatrix(const Rml::Matrix4f* matrix) {
  if (!matrix) {
    return Nan::Null();
  }
  auto buffer =
      v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), 16 * sizeof(float));
  std::memcpy(
      buffer->GetBackingStore()->Data(), matrix->data(), 16 * sizeof(float));
  return v8::Float32Array::New(buffer, 0, 16);
}

bool ReadIntegerVector(v8::Local<v8::Value> input, Rml::Vector2i* result) {
  if (!input->IsObject()) {
    Nan::ThrowTypeError("Expected an integer coordinate vector");
    return false;
  }
  v8::Local<v8::Value> x;
  v8::Local<v8::Value> y;
  if (!GetField(input.As<v8::Object>(), "x", &x) ||
      !GetField(input.As<v8::Object>(), "y", &y)) {
    return false;
  }
  if (!x->IsInt32() || !y->IsInt32()) {
    Nan::ThrowRangeError("Expected signed 32-bit integer coordinates");
    return false;
  }
  *result = {Nan::To<int32_t>(x).FromJust(), Nan::To<int32_t>(y).FromJust()};
  return true;
}

v8::Local<v8::Object> WrapIntegerVector(Rml::Vector2i value) {
  auto result = Nan::New<v8::Object>();
  SetData(result, "x", Nan::New(value.x));
  SetData(result, "y", Nan::New(value.y));
  return result;
}

bool ReadScissor(v8::Local<v8::Value> input, Rml::Rectanglei* result) {
  *result = Rml::Rectanglei::MakeInvalid();
  if (input->IsNull()) {
    return true;
  }
  if (!input->IsObject()) {
    Nan::ThrowTypeError("Expected a scissor rectangle or null");
    return false;
  }
  v8::Local<v8::Value> p0;
  v8::Local<v8::Value> p1;
  if (!GetField(input.As<v8::Object>(), "p0", &p0) ||
      !GetField(input.As<v8::Object>(), "p1", &p1) ||
      !ReadIntegerVector(p0, &result->p0) ||
      !ReadIntegerVector(p1, &result->p1)) {
    return false;
  }
  return true;
}

v8::Local<v8::Value> WrapScissor(const Rml::Rectanglei& rectangle) {
  if (!rectangle.Valid()) {
    return Nan::Null();
  }
  auto result = Nan::New<v8::Object>();
  SetData(result, "p0", WrapIntegerVector(rectangle.p0));
  SetData(result, "p1", WrapIntegerVector(rectangle.p1));
  return result;
}

bool ReadMask(v8::Local<v8::Value> input, MaskInput* result) {
  if (!input->IsObject()) {
    Nan::ThrowTypeError("Expected a clip mask entry");
    return false;
  }
  const auto object = input.As<v8::Object>();
  v8::Local<v8::Value> operation;
  v8::Local<v8::Value> offset;
  if (!GetField(object, "operation", &operation) ||
      !GetField(object, "geometry", &result->geometry) ||
      !GetField(object, "absoluteOffset", &offset) ||
      !GetField(object, "transform", &result->matrix_input)) {
    return false;
  }
  if (!operation->IsUint32() || Nan::To<uint32_t>(operation).FromJust() > 2) {
    Nan::ThrowRangeError("Expected a clip mask operation");
    return false;
  }
  result->operation = static_cast<Rml::ClipMaskOperation>(
      Nan::To<uint32_t>(operation).FromJust());
  return ReadBoxVector(offset, &result->offset) &&
         ReadMatrix(result->matrix_input, &result->matrix);
}

bool ReadMaskList(v8::Local<v8::Value> input, std::vector<MaskInput>* result) {
  if (!input->IsArray()) {
    Nan::ThrowTypeError("Expected a clip mask list");
    return false;
  }
  const auto array = input.As<v8::Array>();
  const uint32_t size = array->Length();
  result->resize(size);
  for (uint32_t i = 0; i < size; ++i) {
    v8::Local<v8::Value> item;
    if (!Nan::Get(array, i).ToLocal(&item) || !ReadMask(item, &(*result)[i])) {
      return false;
    }
  }
  return true;
}

std::shared_ptr<RenderClipStorage> CopyMasks(
    const std::vector<MaskInput>& inputs,
    Rml::RenderManager* manager,
    Rml::ClipMaskGeometryList* masks) {
  auto storage = std::make_shared<RenderClipStorage>();
  storage->geometries.reserve(inputs.size());
  storage->transforms.reserve(inputs.size());
  masks->reserve(inputs.size());
  // All JS accessors have finished. Validate everything before submission.
  for (const auto& input : inputs) {
    auto* geometry = GeometryOf(input.geometry, manager);
    if (!geometry) {
      return {};
    }
    storage->geometries.push_back(
        manager->MakeGeometry(Rml::Mesh(geometry->GetMesh())));
    storage->transforms.push_back(input.matrix);
    masks->push_back({
        input.operation,
        &storage->geometries.back(),
        input.offset,
        input.matrix_input->IsNull() ? nullptr : &storage->transforms.back(),
    });
  }
  return storage;
}

template <bool prepare>
NAN_METHOD(SetViewport) {
  Rml::Vector2i size;
  if (!ReadIntegerVector(info[1], &size)) {
    return;
  }
  if (size.x < 0 || size.y < 0) {
    return Nan::ThrowRangeError("Viewport dimensions cannot be negative");
  }
  if (auto manager = RenderManagerOf(info[0])) {
    if constexpr (prepare) {
      if (!CanPrepareRender(manager->value)) {
        return;
      }
      manager->value->PrepareRender(size);
    } else {
      manager->value->SetViewport(size);
    }
  }
}

NAN_METHOD(GetViewport) {
  if (auto manager = RenderManagerOf(info[0])) {
    info.GetReturnValue().Set(WrapIntegerVector(manager->value->GetViewport()));
  }
}

NAN_METHOD(SetScissor) {
  Rml::Rectanglei rectangle;
  if (!ReadScissor(info[1], &rectangle)) {
    return;
  }
  if (auto manager = RenderManagerOf(info[0])) {
    manager->value->SetScissorRegion(rectangle);
  }
}

NAN_METHOD(GetScissor) {
  if (auto manager = RenderManagerOf(info[0])) {
    info.GetReturnValue().Set(WrapScissor(manager->value->GetScissorRegion()));
  }
}

NAN_METHOD(DisableScissor) {
  if (auto manager = RenderManagerOf(info[0])) {
    manager->value->DisableScissorRegion();
  }
}

template <bool single>
NAN_METHOD(SetClipMask) {
  std::vector<MaskInput> inputs;
  if (!ReadMaskList(info[1], &inputs)) {
    return;
  }
  if constexpr (single) {
    if (inputs.size() != 1) {
      return Nan::ThrowTypeError("Expected exactly one clip mask");
    }
  }
  auto manager = RenderManagerOf(info[0]);
  if (!manager) {
    return;
  }
  Rml::ClipMaskGeometryList masks;
  auto storage = CopyMasks(inputs, manager->value, &masks);
  if (!storage) {
    return;
  }
  if constexpr (single) {
    const auto& mask = masks.front();
    manager->value->SetClipMask(
        mask.operation, mask.geometry, mask.absolute_offset);
  } else {
    manager->value->SetClipMask(std::move(masks));
  }
  SetClipStorage(manager, std::move(storage));
}

NAN_METHOD(DisableClipMask) {
  if (auto manager = RenderManagerOf(info[0])) {
    manager->value->DisableClipMask();
    SetClipStorage(manager, {});
  }
}

NAN_METHOD(SetTransform) {
  Rml::Matrix4f matrix;
  if (!ReadMatrix(info[1], &matrix)) {
    return;
  }
  if (auto manager = RenderManagerOf(info[0])) {
    manager->value->SetTransform(info[1]->IsNull() ? nullptr : &matrix);
  }
}

NAN_METHOD(GetState) {
  auto manager = RenderManagerOf(info[0]);
  if (!manager) {
    return;
  }
  const auto& state = manager->value->GetState();
  auto result = Nan::New<v8::Object>();
  SetData(result, "scissorRegion", WrapScissor(state.scissor_region));
  SetData(result,
          "clipMaskList",
          WrapClipMaskList(state.clip_mask_list, manager->value));
  SetData(result, "transform", WrapMatrix(&state.transform));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SetState) {
  if (!info[1]->IsObject()) {
    return Nan::ThrowTypeError("Expected a render state");
  }
  const auto object = info[1].As<v8::Object>();
  v8::Local<v8::Value> scissor;
  v8::Local<v8::Value> masks_input;
  v8::Local<v8::Value> matrix;
  Rml::RenderState state;
  std::vector<MaskInput> masks;
  if (!GetField(object, "scissorRegion", &scissor) ||
      !GetField(object, "clipMaskList", &masks_input) ||
      !GetField(object, "transform", &matrix) ||
      !ReadScissor(scissor, &state.scissor_region) ||
      !ReadMaskList(masks_input, &masks) ||
      !ReadMatrix(matrix, &state.transform)) {
    return;
  }
  auto manager = RenderManagerOf(info[0]);
  if (!manager) {
    return;
  }
  auto storage = CopyMasks(masks, manager->value, &state.clip_mask_list);
  if (!storage) {
    return;
  }
  manager->value->SetState(state);
  SetClipStorage(manager, std::move(storage));
}

NAN_METHOD(ResetState) {
  if (auto manager = RenderManagerOf(info[0])) {
    manager->value->ResetState();
    SetClipStorage(manager, {});
  }
}

NAN_METHOD(MaskEquals) {
  MaskInput left;
  MaskInput right;
  if (!ReadMask(info[0], &left) || !ReadMask(info[1], &right)) {
    return;
  }
  auto* left_geometry = GeometryOf(left.geometry, nullptr, false);
  auto* right_geometry = GeometryOf(right.geometry, nullptr, false);
  if (!left_geometry || !right_geometry) {
    return;
  }
  // Matrix references, rather than matrix contents, are compared upstream.
  const Rml::ClipMaskGeometry a{
      left.operation, left_geometry, left.offset, &left.matrix};
  const Rml::ClipMaskGeometry b{
      right.operation,
      right_geometry,
      right.offset,
      left.matrix_input->StrictEquals(right.matrix_input) ? &left.matrix
                                                          : &right.matrix,
  };
  info.GetReturnValue().Set(a == b);
}

}  // namespace

v8::Local<v8::Array> WrapClipMaskList(const Rml::ClipMaskGeometryList& masks,
                                      Rml::RenderManager* manager) {
  auto result = Nan::New<v8::Array>(masks.size());
  for (size_t i = 0; i < masks.size(); ++i) {
    const auto& mask = masks[i];
    auto entry = Nan::New<v8::Object>();
    SetData(entry, "operation", Nan::New(static_cast<int>(mask.operation)));
    SetData(entry, "geometry", WrapGeometrySnapshot(*mask.geometry, manager));
    SetData(entry,
            "absoluteOffset",
            VariantToJs(Rml::Variant(mask.absolute_offset)).ToLocalChecked());
    SetData(entry, "transform", WrapMatrix(mask.transform));
    result->CreateDataProperty(Nan::GetCurrentContext(), i, entry).FromJust();
  }
  return result;
}

void ClearRenderClipStorage(RenderManagerState* manager) {
  if (manager->clip_storage) {
    manager->value->DisableClipMask();
    manager->clip_storage.reset();
  }
  ActiveClipManagers().erase(manager->value);
}

NAN_MODULE_INIT(InitializeRmlRenderState) {
  SetRuntimeMethod<SetViewport<true>>(target, "renderManagerPrepareRender");
  SetRuntimeMethod<SetViewport<false>>(target, "renderManagerSetViewport");
  SetInstancerValueMethod<GetViewport>(target, "renderManagerGetViewport");
  SetRenderStateMethod<SetScissor>(target, "renderManagerSetScissorRegion");
  SetRenderStateMethod<GetScissor, true>(target,
                                         "renderManagerGetScissorRegion");
  SetRenderStateMethod<DisableScissor>(target,
                                       "renderManagerDisableScissorRegion");
  SetRenderStateMethod<SetClipMask<false>>(target, "renderManagerSetClipMask");
  SetRenderStateMethod<SetClipMask<true>>(target,
                                          "renderManagerSetSingleClipMask");
  SetRenderStateMethod<DisableClipMask>(target, "renderManagerDisableClipMask");
  SetRenderStateMethod<SetTransform>(target, "renderManagerSetTransform");
  SetRenderStateMethod<GetState, true>(target, "renderManagerGetState");
  SetRenderStateMethod<SetState>(target, "renderManagerSetState");
  SetRenderStateMethod<ResetState>(target, "renderManagerResetState");
  SetInstancerValueMethod<MaskEquals>(target, "clipMaskGeometryEquals");
}

}  // namespace sfmlrmlui
