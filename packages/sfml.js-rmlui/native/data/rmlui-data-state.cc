// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <nan.h>

#include <memory>
#include <unordered_set>
#include <utility>

#include "native/data/rmlui-data-batch.h"
#include "native/data/rmlui-data-schema.h"
#include "native/data/rmlui-data.h"
#include "native/runtime/rmlui-context-instancers.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

auto& ModelIndex() {
  static std::unordered_map<const Rml::DataModel*,
                            std::weak_ptr<DataModelState>>
      values;
  return values;
}

}  // namespace

void IndexDataModel(const std::shared_ptr<DataModelState>& model) {
  ModelIndex()[model->value] = model;
}

std::shared_ptr<DataModelState> DataModelFromPointer(
    const Rml::DataModel* model) {
  const auto found = ModelIndex().find(model);
  const auto owner =
      found == ModelIndex().end() ? nullptr : found->second.lock();
  if (!DataModelIsValid(owner)) {
    Nan::ThrowError("Data callback model is no longer valid");
    return {};
  }
  return owner;
}

DataRegisterState::~DataRegisterState() = default;

bool DataRegisterIsValid(const std::shared_ptr<DataRegisterState>& owner) {
  if (!State().initialized || !owner->value ||
      owner->generation != State().generation) {
    return false;
  }
  if (owner->owned) {
    return true;
  }
  auto context = owner->context.lock();
  return context && context->context;
}

std::shared_ptr<DataRegisterState> DataRegisterOf(v8::Local<v8::Value> value) {
  auto* handle = DataRegisterNativeHandle::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a data type register");
    return {};
  }
  auto owner = handle->owner();
  if (!DataRegisterIsValid(owner)) {
    Nan::ThrowError("RmlUi data type register is no longer valid");
    return {};
  }
  return owner;
}

v8::Local<v8::Object> WrapDataRegister(
    const std::shared_ptr<DataRegisterState>& owner) {
  if (!owner->handle.IsEmpty()) {
    return owner->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = DataRegisterNativeHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  if (!owner->owned) {
    auto context = owner->context.lock();
    Nan::SetPrivate(handle,
                    Nan::New("rml.data.context").ToLocalChecked(),
                    WrapContext(context->context))
        .FromJust();
  }
  Nan::SetPrivate(handle,
                  Nan::New("rml.data.callbacks").ToLocalChecked(),
                  DataCallbackArray(owner->callbacks))
      .FromJust();
  State().data_ownership_dirty = true;
  return handle;
}

bool DataModelIsValid(const std::shared_ptr<DataModelState>& owner) {
  if (!owner) {
    return false;
  }
  const auto context = owner->context.lock();
  return owner->value && context && context->context &&
         owner->generation == State().generation;
}

std::shared_ptr<DataModelState> DataModelOf(v8::Local<v8::Value> input) {
  auto* handle = DataModelNativeHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a data model handle");
    return {};
  }
  const auto owner = handle->owner();
  if (!DataModelIsValid(owner)) {
    Nan::ThrowError("RmlUi data model is no longer valid");
    return {};
  }
  return owner;
}

v8::Local<v8::Array> DataCallbackArray(
    const std::shared_ptr<DataCallbacks>& owner) {
  if (owner->functions.IsEmpty()) {
    auto functions = Nan::New<v8::Array>();
    owner->functions.Reset(v8::Isolate::GetCurrent(), functions);
    return functions;
  }
  return owner->functions.Get(v8::Isolate::GetCurrent());
}

uint32_t AddDataCallback(const std::shared_ptr<DataCallbacks>& owner,
                         v8::Local<v8::Value> callback) {
  auto functions = DataCallbackArray(owner);
  const auto index = functions->Length();
  Nan::Set(functions, index, callback).FromJust();
  State().data_ownership_dirty = true;
  return index;
}

v8::Local<v8::Object> WrapDataModel(
    const std::shared_ptr<DataModelState>& owner) {
  if (!owner->handle.IsEmpty()) {
    return owner->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = DataModelNativeHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  auto context = owner->context.lock();
  Nan::SetPrivate(handle,
                  Nan::New("rml.data.context").ToLocalChecked(),
                  WrapContext(context->context))
      .FromJust();
  Nan::SetPrivate(handle,
                  Nan::New("rml.data.register").ToLocalChecked(),
                  WrapDataRegister(owner->type_register))
      .FromJust();
  return handle;
}

void RefreshDataOwnership() {
  if (State().cleaning_up || !State().data_ownership_dirty) {
    return;
  }
  State().data_ownership_dirty = false;
  // Snapshot tokens because V8 allocations can collect another owned context.
  std::vector<std::shared_ptr<ContextState>> contexts;
  for (const auto& [pointer, context] : State().contexts) {
    contexts.push_back(context);
  }
  std::unordered_set<DataRegisterState*> rooted_registers;
  for (const auto& context : contexts) {
    if (context->context && !IsOwnedContext(context->context)) {
      if (context->data_register) {
        rooted_registers.insert(context->data_register.get());
      }
      for (const auto& [name, model] : context->data_models) {
        rooted_registers.insert(model->type_register.get());
      }
    }
  }
  auto retain_register = [&](const std::shared_ptr<DataRegisterState>& owner,
                             v8::Local<v8::Array> edges) {
    if (!owner || !DataRegisterIsValid(owner)) {
      return;
    }
    auto handle = WrapDataRegister(owner);
    auto functions = DataCallbackArray(owner->callbacks);
    Nan::Set(edges, edges->Length(), handle).FromJust();
    Nan::SetPrivate(
        handle, Nan::New("rml.data.callbacks").ToLocalChecked(), functions)
        .FromJust();
    if (rooted_registers.contains(owner.get())) {
      if (owner->callbacks->functions.IsWeak()) {
        owner->callbacks->functions.ClearWeak();
      }
    } else if (!owner->callbacks->functions.IsWeak()) {
      owner->callbacks->functions.SetWeak();
    }
  };
  for (const auto& context : contexts) {
    if (!context->context) {
      continue;
    }
    const bool native_owned = !IsOwnedContext(context->context);
    auto edges = Nan::New<v8::Array>();
    auto retain = [&](const std::shared_ptr<DataCallbacks>& callbacks) {
      if (!callbacks || callbacks->functions.IsEmpty()) {
        return;
      }
      auto functions = callbacks->functions.Get(v8::Isolate::GetCurrent());
      Nan::Set(edges, edges->Length(), functions).FromJust();
      if (native_owned && callbacks->functions.IsWeak()) {
        callbacks->functions.ClearWeak();
      } else if (!native_owned && !callbacks->functions.IsWeak()) {
        callbacks->functions.SetWeak();
      }
    };
    if (context->data_register) {
      retain_register(context->data_register, edges);
    }
    for (const auto& [name, model] : context->data_models) {
      retain(model->callbacks);
      retain_register(model->type_register, edges);
    }
    Nan::SetPrivate(WrapContext(context->context),
                    Nan::New("rml.data.callbacks").ToLocalChecked(),
                    edges)
        .FromJust();
  }
  for (auto it = State().data_registers.begin();
       it != State().data_registers.end();) {
    auto owner = it->lock();
    if (!owner) {
      it = State().data_registers.erase(it);
      continue;
    }
    // Independently owned registers keep their callbacks through the visible
    // register edge even when their last borrowing context disappears.
    if (!owner->handle.IsEmpty() && DataRegisterIsValid(owner)) {
      retain_register(owner, Nan::New<v8::Array>());
    }
    ++it;
  }
  // Wrap operations above can mark ownership dirty without changing the graph.
  State().data_ownership_dirty = false;
}

void InvalidateDataModel(const std::shared_ptr<DataModelState>& model) {
  ModelIndex().erase(model->value);
  InvalidateDataBatches(model);
  model->value = nullptr;
  model->constructor = {};
  model->callbacks->functions.Reset();
  model->scalars.clear();
  model->storage.clear();
  if (!model->handle.IsEmpty()) {
    auto handle = model->handle.Get(v8::Isolate::GetCurrent());
    Nan::SetPrivate(
        handle, Nan::New("rml.data.context").ToLocalChecked(), Nan::Undefined())
        .FromJust();
    Nan::SetPrivate(handle,
                    Nan::New("rml.data.register").ToLocalChecked(),
                    Nan::Undefined())
        .FromJust();
    model->handle.Reset();
  }
  State().data_ownership_dirty = true;
}

void InvalidateDataModels(const std::shared_ptr<ContextState>& context) {
  if (!context->handle.IsEmpty()) {
    Nan::SetPrivate(context->handle.Get(v8::Isolate::GetCurrent()),
                    Nan::New("rml.data.callbacks").ToLocalChecked(),
                    Nan::Undefined())
        .FromJust();
  }
  State().data_ownership_dirty = true;
  for (const auto& [name, model] : context->data_models) {
    InvalidateDataModel(model);
  }
  context->data_models.clear();
  if (context->data_register) {
    context->data_register->value = nullptr;
    context->data_register->callbacks->functions.Reset();
    if (!context->data_register->handle.IsEmpty()) {
      auto handle =
          context->data_register->handle.Get(v8::Isolate::GetCurrent());
      Nan::SetPrivate(handle,
                      Nan::New("rml.data.callbacks").ToLocalChecked(),
                      Nan::Undefined())
          .FromJust();
      Nan::SetPrivate(handle,
                      Nan::New("rml.data.context").ToLocalChecked(),
                      Nan::Undefined())
          .FromJust();
    }
    context->data_register.reset();
  }
}

void ReleaseDataRegisters() {
  for (const auto& weak : State().data_registers) {
    if (auto owner = weak.lock()) {
      owner->value = nullptr;
      owner->callbacks->functions.Reset();
      if (!owner->handle.IsEmpty()) {
        Nan::SetPrivate(owner->handle.Get(v8::Isolate::GetCurrent()),
                        Nan::New("rml.data.callbacks").ToLocalChecked(),
                        Nan::Undefined())
            .FromJust();
      }
    }
  }
  State().data_registers.clear();
}

}  // namespace sfmlrmlui
