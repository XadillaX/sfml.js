// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/Matrix4.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <cstring>
#include <memory>
#include <vector>

#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-buffer.h"
#include "third_party/rmlui/Source/Core/TransformState.h"

namespace sfmlrmlui {
namespace {

struct TransformStateToken {
  std::unique_ptr<Rml::TransformState> owned;
  Rml::ObserverPtr<Rml::Element> element;
  uint64_t generation{0};
};

// Buffer leases retain numerical storage only, never elements or the runtime.
struct TransformStorage {
  explicit TransformStorage(size_t size) : matrices(size * 48), flags(size) {
    auto& counts = State().data_diagnostics;
    counts.Record(&DataDiagnostics::transform_buffer_allocations);
    counts.Record(&DataDiagnostics::transform_buffer_bytes,
                  size * (48 * sizeof(float) + sizeof(uint8_t)));
  }
  std::vector<float> matrices;
  std::vector<uint8_t> flags;
};

struct TransformBufferState {
  std::vector<Rml::ObserverPtr<Rml::Element>> elements;
  std::shared_ptr<TransformStorage> storage;
  uint64_t generation{0};
};

using TransformStateHandle = sfmljs::SharedHandle<TransformStateToken>;
using TransformBufferHandle = sfmljs::SharedHandle<TransformBufferState>;

void SetData(v8::Local<v8::Object> object,
             const char* key,
             v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

bool ReadMatrix(v8::Local<v8::Value> input, Rml::Matrix4f* result) {
  if (input->IsNull()) {
    return true;
  }
  if (!input->IsFloat32Array()) {
    Nan::ThrowTypeError(
        "Expected a Float32Array matrix with 16 values or null");
    return false;
  }
  auto view = input.As<v8::Float32Array>();
  if (view->Length() != 16 || view->Buffer()->WasDetached()) {
    Nan::ThrowRangeError("Expected a matrix with 16 values");
    return false;
  }
  auto store = view->Buffer()->GetBackingStore();
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

TransformStateToken* TokenOf(v8::Local<v8::Value> input, bool write = false) {
  auto* handle = TransformStateHandle::From(input);
  if (!handle) {
    return nullptr;
  }
  auto* token = handle->owner().get();
  if (!token->owned) {
    if (!RuntimeReady()) {
      return nullptr;
    }
    if (token->generation != State().generation || !token->element) {
      Nan::ThrowError("TransformState element is no longer valid");
      return nullptr;
    }
    if (write) {
      Nan::ThrowTypeError("Element TransformState is read-only");
      return nullptr;
    }
    if (!token->element->GetTransformState()) {
      Nan::ThrowError("Element no longer has a TransformState");
      return nullptr;
    }
  }
  return token;
}

const Rml::TransformState& ValueOf(const TransformStateToken& token) {
  return token.owned ? *token.owned : *token.element->GetTransformState();
}

v8::Local<v8::Value> MatrixSnapshot(const Rml::Matrix4f* matrix) {
  if (!matrix) {
    return Nan::Null();
  }
  auto owner = std::make_shared<Rml::Matrix4f>(*matrix);
  auto buffer = sfmljs::MapShared(
      v8::Isolate::GetCurrent(), owner, owner->data(), 16 * sizeof(float));
  return v8::Float32Array::New(buffer, 0, 16);
}

NAN_METHOD(CreateTransformState) {
  auto token = std::make_shared<TransformStateToken>();
  token->owned = std::make_unique<Rml::TransformState>();
  State().data_diagnostics.Record(
      &DataDiagnostics::transform_state_allocations);
  info.GetReturnValue().Set(TransformStateHandle::Create(token));
}

NAN_METHOD(GetElementTransformState) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  if (!element->GetTransformState()) {
    return info.GetReturnValue().SetNull();
  }
  if (auto* previous = TransformStateHandle::TryFrom(info[1])) {
    const auto& token = *previous->owner();
    if (!token.owned && token.generation == State().generation &&
        token.element.get() == element) {
      info.GetReturnValue().Set(info[1]);
      return;
    }
  }
  auto token = std::make_shared<TransformStateToken>();
  token->element = element->GetObserverPtr();
  token->generation = State().generation;
  State().data_diagnostics.Record(
      &DataDiagnostics::transform_state_allocations);
  auto handle = TransformStateHandle::Create(token);
  // A detached element remains alive through a V8-visible edge; its state
  // does not create a hidden native ownership cycle.
  Nan::SetPrivate(
      handle, Nan::New("element").ToLocalChecked(), WrapElement(element));
  info.GetReturnValue().Set(handle);
}

template <auto getter>
NAN_METHOD(GetMatrix) {
  if (auto* token = TokenOf(info[0])) {
    info.GetReturnValue().Set(MatrixSnapshot((ValueOf(*token).*getter)()));
  }
}

template <auto setter>
NAN_METHOD(SetMatrix) {
  Rml::Matrix4f value = Rml::Matrix4f::Identity();
  if (!ReadMatrix(info[1], &value)) {
    return;
  }
  if (auto* token = TokenOf(info[0], true)) {
    info.GetReturnValue().Set(
        (token->owned.get()->*setter)(info[1]->IsNull() ? nullptr : &value));
  }
}

NAN_METHOD(CreateTransformBuffer) {
  if (!info[0]->IsArray()) {
    return Nan::ThrowTypeError("Expected an array of Element handles");
  }
  auto array = info[0].As<v8::Array>();
  const uint32_t size = array->Length();
  if (size > 1000000) {
    return Nan::ThrowRangeError(
        "Transform buffer supports at most 1000000 elements");
  }
  // First gather all values, then check handles; array accessors can destroy
  // a receiver or restart the runtime before validation finishes.
  auto values = Nan::New<v8::Array>(size);
  for (uint32_t i = 0; i < size; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(array, i).ToLocal(&value)) {
      return;
    }
    values->CreateDataProperty(Nan::GetCurrentContext(), i, value).FromJust();
  }
  auto state = std::make_shared<TransformBufferState>();
  state->elements.reserve(size);
  for (uint32_t i = 0; i < size; ++i) {
    auto* element = ElementOf(Nan::Get(values, i).ToLocalChecked());
    if (!element) {
      return;
    }
    state->elements.push_back(element->GetObserverPtr());
  }
  state->generation = State().generation;
  state->storage = std::make_shared<TransformStorage>(size);
  auto handle = TransformBufferHandle::Create(state);
  Nan::SetPrivate(handle, Nan::New("elements").ToLocalChecked(), values);
  auto result = Nan::New<v8::Object>();
  SetData(result, "handle", handle);
  SetData(result, "length", Nan::New(size));
  auto* isolate = v8::Isolate::GetCurrent();
  auto matrices = sfmljs::MapShared(isolate,
                                    state->storage,
                                    state->storage->matrices.data(),
                                    size * 48 * sizeof(float));
  auto flags = sfmljs::MapShared(
      isolate, state->storage, state->storage->flags.data(), size);
  SetData(result, "matrices", v8::Float32Array::New(matrices, 0, size * 48));
  SetData(result, "flags", v8::Uint8Array::New(flags, 0, size));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(RefreshTransformBuffer) {
  auto* handle = TransformBufferHandle::From(info[0]);
  if (!handle) {
    return;
  }
  auto& state = *handle->owner();
  if (state.generation != State().generation) {
    return Nan::ThrowError("Transform buffer is no longer valid");
  }
  // Validate all borrowed owners before touching output; failures leave the
  // previous complete snapshot intact.
  for (const auto& element : state.elements) {
    if (!element) {
      return Nan::ThrowError("Transform buffer element is no longer valid");
    }
  }
  auto& counts = State().data_diagnostics;
  counts.Record(&DataDiagnostics::transform_buffer_elements,
                state.elements.size());
  for (size_t i = 0; i < state.elements.size(); ++i) {
    const auto* transform = state.elements[i]->GetTransformState();
    const std::array<const Rml::Matrix4f*, 3> matrices =
        transform ? std::array{transform->GetTransform(),
                               transform->GetLocalPerspective(),
                               transform->GetInverseTransform()}
                  : std::array<const Rml::Matrix4f*, 3>{};
    uint8_t flags = 0;
    for (size_t j = 0; j < matrices.size(); ++j) {
      auto* output = state.storage->matrices.data() + i * 48 + j * 16;
      if (matrices[j]) {
        std::copy_n(matrices[j]->data(), 16, output);
        counts.Record(&DataDiagnostics::transform_matrix_copied_bytes,
                      16 * sizeof(float));
        flags |= static_cast<uint8_t>(1 << j);
      } else {
        std::fill_n(output, 16, 0.f);
      }
    }
    state.storage->flags[i] = flags;
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlTransformState) {
  SetRuntimeMethod<CreateTransformState, true, false>(target,
                                                      "createTransformState");
  SetRuntimeMethod<GetElementTransformState, true>(target,
                                                   "elementGetTransformState");
  SetRuntimeMethod<GetMatrix<&Rml::TransformState::GetTransform>, true, false>(
      target, "transformStateGetTransform");
  SetRuntimeMethod<GetMatrix<&Rml::TransformState::GetLocalPerspective>,
                   true,
                   false>(target, "transformStateGetLocalPerspective");
  SetRuntimeMethod<GetMatrix<&Rml::TransformState::GetInverseTransform>,
                   true,
                   false>(target, "transformStateGetInverseTransform");
  SetRuntimeMethod<SetMatrix<&Rml::TransformState::SetTransform>, true, false>(
      target, "transformStateSetTransform");
  SetRuntimeMethod<SetMatrix<&Rml::TransformState::SetLocalPerspective>,
                   true,
                   false>(target, "transformStateSetLocalPerspective");
  SetRuntimeMethod<CreateTransformBuffer, true>(target,
                                                "createElementTransformBuffer");
  SetRuntimeMethod<RefreshTransformBuffer, true>(
      target, "refreshElementTransformBuffer");
}

}  // namespace sfmlrmlui
