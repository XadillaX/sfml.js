// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <algorithm>
#include <cstring>
#include <limits>
#include <memory>
#include <type_traits>
#include <utility>
#include <vector>

#include "native/data/rmlui-data-schema.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"
#include "vendor/rmlui/Source/Core/DataModel.h"

namespace sfmlrmlui {
namespace {

bool SchemaIsLive(DataSchemaState* schema) {
  auto owner = schema->owner.lock();
  if (!owner || !DataRegisterIsValid(owner)) {
    Nan::ThrowError("RmlUi data schema is no longer valid");
    return false;
  }
  return true;
}

std::shared_ptr<DataStorageNode> ResolveStorage(
    const std::shared_ptr<DataVariableState>& owner,
    bool follow_reference,
    unsigned depth) {
  if (!owner->model && !owner->owned_storage) {
    Nan::ThrowTypeError("Data variable has no registered native storage");
    return {};
  }
  if (depth >= 256) {
    Nan::ThrowRangeError(
        "Data reference path exceeds the recursive depth limit");
    return {};
  }
  std::shared_ptr<DataStorageNode> node;
  size_t first = 0;
  if (owner->owned_storage) {
    if (!DataRegisterIsValid(owner->owned_storage->type_register)) {
      Nan::ThrowError("RmlUi owned data storage is no longer valid");
      return {};
    }
    node = owner->owned_storage->root;
  } else {
    if (!DataModelIsValid(owner->model)) {
      Nan::ThrowError("RmlUi data model is no longer valid");
      return {};
    }
    const auto found = owner->model->storage.find(owner->address.front().name);
    if (found == owner->model->storage.end()) {
      Nan::ThrowTypeError("Data variable has no registered native storage");
      return {};
    }
    node = found->second;
    first = 1;
  }
  for (size_t i = first; i <= owner->address.size(); ++i) {
    if (node->schema->reference &&
        (i < owner->address.size() || follow_reference)) {
      if (!node->reference_bound) {
        Nan::ThrowError("Data storage reference is null");
        return {};
      }
      auto target = std::make_shared<DataVariableState>();
      target->model = node->reference_model.lock();
      target->owned_storage = node->reference_storage.lock();
      if (!target->model && !target->owned_storage) {
        Nan::ThrowError("RmlUi data reference target is no longer valid");
        return {};
      }
      target->address = node->reference_address;
      node = ResolveStorage(target, true, depth + 1);
      if (!node) {
        return {};
      }
    }
    if (i == owner->address.size()) {
      break;
    }
    const auto& address = owner->address[i];
    auto* schema = node->schema;
    if (schema->custom) {
      Rml::DataVariable variable;
      auto target = CustomDataChild(node.get(), address, &variable);
      if (!target) {
        if (State().callback_exception.IsEmpty()) {
          Nan::ThrowError("Custom data storage child path is no longer valid");
        }
        return {};
      }
      target = std::make_shared<DataVariableState>(*target);
      target->address.insert(target->address.end(),
                             owner->address.begin() + i + 1,
                             owner->address.end());
      return ResolveStorage(target, follow_reference, depth + 1);
    } else if (schema->type == Rml::DataVariableType::Struct) {
      const auto accessor = schema->accessors.find(address.name);
      if (accessor != schema->accessors.end()) {
        if (!accessor->second.reference) {
          Nan::ThrowTypeError("Value accessor has no native backing storage");
          return {};
        }
        Rml::DataVariable variable;
        auto target =
            DataMemberTarget(node.get(), &accessor->second, &variable);
        if (!target) {
          if (State().callback_exception.IsEmpty()) {
            Nan::ThrowError("Data member storage target is null");
          }
          return {};
        }
        target = std::make_shared<DataVariableState>(*target);
        target->address.insert(target->address.end(),
                               owner->address.begin() + i + 1,
                               owner->address.end());
        return ResolveStorage(target, follow_reference, depth + 1);
      }
      size_t index = 0;
      for (; index < schema->members.size(); ++index) {
        if (schema->members[index].first == address.name) {
          break;
        }
      }
      if (index >= node->children.size()) {
        Nan::ThrowError("Data storage member path is no longer valid");
        return {};
      }
      node = node->children[index];
    } else if (schema->type == Rml::DataVariableType::Array && !node->backing &&
               address.index >= 0 &&
               static_cast<size_t>(address.index) < node->children.size()) {
      node = node->children[address.index];
    } else {
      Nan::ThrowTypeError("Expected a registered array storage path");
      return {};
    }
  }
  return node;
}

v8::Local<v8::Value> NumericView(DataStorageNode* node) {
  auto buffer = v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), node->backing);
  switch (node->schema->underlying->scalar) {
    case DataScalarKind::kInt8:
      return v8::Int8Array::New(buffer, 0, node->count);
    case DataScalarKind::kBoolean:
    case DataScalarKind::kUint8:
      return v8::Uint8Array::New(buffer, 0, node->count);
    case DataScalarKind::kInt16:
      return v8::Int16Array::New(buffer, 0, node->count);
    case DataScalarKind::kUint16:
      return v8::Uint16Array::New(buffer, 0, node->count);
    case DataScalarKind::kInt32:
      return v8::Int32Array::New(buffer, 0, node->count);
    case DataScalarKind::kUint32:
      return v8::Uint32Array::New(buffer, 0, node->count);
    case DataScalarKind::kInt64:
      return v8::BigInt64Array::New(buffer, 0, node->count);
    case DataScalarKind::kUint64:
      return v8::BigUint64Array::New(buffer, 0, node->count);
    case DataScalarKind::kFloat32:
      return v8::Float32Array::New(buffer, 0, node->count);
    case DataScalarKind::kFloat64:
      return v8::Float64Array::New(buffer, 0, node->count);
    case DataScalarKind::kString:
      break;
  }
  return Nan::Undefined();
}

NAN_METHOD(GetNumericView) {
  Rml::DataVariable variable;
  auto owner = DataVariableOf(info[0], &variable);
  if (!owner) {
    return;
  }
  auto node = DataStorageOf(owner);
  if (!node) {
    return;
  }
  if (!node->backing) {
    return Nan::ThrowTypeError("Numeric views require a numeric data array");
  }
  info.GetReturnValue().Set(NumericView(node.get()));
}

NAN_METHOD(ResizeArray) {
  const auto& state = State();
  if (state.callback_depth &&
      (state.data_event_callback_depth != state.callback_depth ||
       state.data_value_callback_depth)) {
    return Nan::ThrowError(
        "Data array resize is only allowed in a data event callback");
  }
  if (!info[1]->IsUint32()) {
    return Nan::ThrowRangeError("Expected a nonnegative array length");
  }
  const auto count = Nan::To<uint32_t>(info[1]).FromJust();
  Rml::DataVariable variable;
  auto owner = DataVariableOf(info[0], &variable);
  if (!owner) {
    return;
  }
  auto node = DataStorageOf(owner);
  if (node && ResizeDataStorage(node.get(), count)) {
    info.GetReturnValue().Set(true);
  }
}

NAN_METHOD(GetReference) {
  Rml::DataVariable variable;
  auto owner = DataVariableOf(info[0], &variable);
  if (!owner) {
    return;
  }
  auto node = DataStorageOf(owner, false);
  if (!node) {
    return;
  }
  if (!node->schema->reference) {
    return Nan::ThrowTypeError("Expected a managed data reference");
  }
  if (!node->reference_bound) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  auto edges = DataStorageEdges(node.get());
  v8::Local<v8::Value> target;
  Rml::DataVariable resolved;
  if (Nan::Get(edges, 0).ToLocal(&target) &&
      DataVariableOf(target, &resolved)) {
    info.GetReturnValue().Set(target);
  }
}

NAN_METHOD(GetPayload) {
  Rml::DataVariable variable;
  auto owner = DataVariableOf(info[0], &variable);
  if (!owner) {
    return;
  }
  auto node = DataStorageOf(owner);
  if (!node) {
    return;
  }
  if (!node->schema->custom) {
    return Nan::ThrowTypeError("Payload requires custom data storage");
  }
  info.GetReturnValue().Set(
      Nan::Get(DataStorageEdges(node.get()), 0).ToLocalChecked());
}

NAN_METHOD(SetReference) {
  Rml::DataVariable variable;
  auto owner = DataVariableOf(info[0], &variable);
  if (!owner) {
    return;
  }
  auto node = DataStorageOf(owner, false);
  if (node && ReadDataReference(node.get(), info[1])) {
    info.GetReturnValue().Set(true);
  }
}

NAN_METHOD(ApplyPatch) {
  if (!info[1]->IsObject() || info[1]->IsArray()) {
    return Nan::ThrowTypeError("Expected a map of data variable paths");
  }
  auto input = info[1].As<v8::Object>();
  v8::Local<v8::Array> keys;
  if (!Nan::GetOwnPropertyNames(input).ToLocal(&keys)) {
    return;
  }
  std::vector<std::pair<Rml::String, Rml::Variant>> values;
  values.reserve(keys->Length());
  // Snapshot only touched values before any storage mutation or borrowed path
  // resolution. Accessors may remove the model or throw.
  for (uint32_t i = 0; i < keys->Length(); ++i) {
    v8::Local<v8::Value> key;
    v8::Local<v8::Value> value;
    Rml::Variant converted;
    if (!Nan::Get(keys, i).ToLocal(&key) ||
        !Nan::Get(input, key).ToLocal(&value) ||
        !VariantFromJs(value, &converted)) {
      return;
    }
    Nan::Utf8String text(key);
    Rml::String path(*text, text.length());
    if (path.starts_with("$.")) {
      path.erase(0, 2);
    }
    values.emplace_back(std::move(path), std::move(converted));
  }
  auto model = DataModelOf(info[0]);
  if (!model) {
    return;
  }
  std::vector<Rml::DataAddress> addresses;
  for (const auto& [path, value] : values) {
    auto address = model->value->ResolveAddress(path, nullptr);
    if (!model->value->GetVariable(address)) {
      return Nan::ThrowError("Data patch path is no longer valid");
    }
    addresses.push_back(std::move(address));
  }
  bool success = true;
  for (size_t i = 0; i < values.size(); ++i) {
    Nan::TryCatch caught;
    // Setters can perform allowed scalar operations. Re-resolve the current
    // native variable and never hold a child pointer across a host callback.
    auto variable = model->value->GetVariable(addresses[i]);
    if (variable && SetDataVariableValue(model, variable, values[i].second)) {
      model->constructor.GetModelHandle().DirtyVariable(addresses[i][0].name);
    } else {
      success = false;
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
      return;
    }
    if (!State().callback_exception.IsEmpty()) {
      return;
    }
  }
  info.GetReturnValue().Set(success);
}

}  // namespace

DataStorageNode::DataStorageNode() {
  State().data_diagnostics.Record(&DataDiagnostics::storage_nodes);
}

void* DataStorageNode::Pointer() {
  if (schema->reference || schema->custom ||
      schema->type != Rml::DataVariableType::Scalar) {
    return this;
  }
  return schema->scalar == DataScalarKind::kString
             ? static_cast<void*>(&text)
             : static_cast<void*>(scalar.data());
}

v8::Local<v8::Array> DataStorageEdges(DataStorageNode* node) {
  if (node->edges.IsEmpty()) {
    auto edges = Nan::New<v8::Array>();
    node->edges.Reset(v8::Isolate::GetCurrent(), edges);
    node->edges.SetWeak();
    return edges;
  }
  return node->edges.Get(v8::Isolate::GetCurrent());
}

std::shared_ptr<DataStorageNode> DataStorageOf(
    const std::shared_ptr<DataVariableState>& owner, bool follow_reference) {
  return ResolveStorage(owner, follow_reference, 0);
}

namespace {

template <typename Owner>
void AttachStorage(DataStorageNode* node,
                   const std::shared_ptr<Owner>& owner,
                   Rml::DataAddress address) {
  if constexpr (std::is_same_v<Owner, DataModelState>) {
    node->storage_model = owner;
  } else {
    node->storage_owner = owner;
  }
  node->storage_address = std::move(address);
  for (size_t i = 0; i < node->children.size(); ++i) {
    if (!node->children[i]) {
      continue;
    }
    auto child_address = node->storage_address;
    if (node->schema->type == Rml::DataVariableType::Struct) {
      child_address.emplace_back(node->schema->members[i].first);
    } else {
      child_address.emplace_back(static_cast<int>(i));
    }
    AttachStorage(node->children[i].get(), owner, std::move(child_address));
  }
}

}  // namespace

void AttachDataStorage(DataStorageNode* node,
                       const std::shared_ptr<DataModelState>& model,
                       Rml::DataAddress address) {
  AttachStorage(node, model, std::move(address));
}

void AttachOwnedDataStorage(
    DataStorageNode* node,
    const std::shared_ptr<DataOwnedStorageState>& storage,
    Rml::DataAddress address) {
  AttachStorage(node, storage, std::move(address));
}

Rml::DataVariable DataReferenceVariable(DataStorageNode* node) {
  if (!node->reference_bound) {
    return {};
  }
  static thread_local unsigned depth = 0;
  if (depth >= 256) {
    Nan::ThrowRangeError(
        "Data reference path exceeds the recursive depth limit");
    return {};
  }
  struct DepthScope {
    explicit DepthScope(unsigned& depth) : depth(depth) { ++depth; }
    ~DepthScope() { --depth; }
    unsigned& depth;
  } scope(depth);
  Rml::DataVariable variable;
  {
    Nan::TryCatch caught;
    v8::Local<v8::Value> handle;
    if (Nan::Get(DataStorageEdges(node), 0).ToLocal(&handle)) {
      DataVariableOf(handle, &variable);
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
      return {};
    }
  }
  if (!State().callback_exception.IsEmpty()) {
    return {};
  }
  // The target may now be out of bounds after an array was resized.
  if (!variable) {
    Nan::ThrowError("RmlUi data reference target path is no longer valid");
  }
  return variable;
}

bool ReadDataReference(DataStorageNode* node, v8::Local<v8::Value> value) {
  if (!node->schema->reference) {
    Nan::ThrowTypeError("Expected a managed data reference");
    return false;
  }
  if (value->IsNull() || value->IsUndefined()) {
    node->reference_model.reset();
    node->reference_storage.reset();
    node->reference_address.clear();
    node->reference_bound = false;
    Nan::Set(DataStorageEdges(node), 0, Nan::Undefined()).FromJust();
    return true;
  }
  v8::Local<v8::Value> handle = value;
  if (!DataVariableNativeHandle::TryFrom(handle) && value->IsObject()) {
    if (!Nan::Get(value.As<v8::Object>(), Nan::New("handle").ToLocalChecked())
             .ToLocal(&handle) ||
        !SchemaIsLive(node->schema)) {
      return false;
    }
  }
  Rml::DataVariable target;
  auto owner = DataVariableOf(handle, &target);
  if (!owner) {
    return false;
  }
  if (DataVariableRegister(owner) != node->schema->owner.lock() ||
      Rml::Detail::DataVariableAccessor::GetDefinition(target) !=
          node->schema->underlying->definition) {
    Nan::ThrowTypeError("Reference target has a different schema definition");
    return false;
  }
  node->reference_model = owner->model;
  node->reference_storage = owner->owned_storage;
  node->reference_address = owner->address;
  node->reference_bound = true;
  Nan::Set(DataStorageEdges(node), 0, handle).FromJust();
  return true;
}

Rml::DataVariable DataStorageNode::Variable() {
  return {schema->definition, Pointer()};
}

void FreezeDataSchema(DataSchemaState* schema) {
  if (schema->frozen) {
    return;
  }
  schema->frozen = true;
  if (schema->underlying) {
    FreezeDataSchema(schema->underlying);
  }
  for (const auto& [name, member] : schema->members) {
    FreezeDataSchema(member);
  }
}

std::shared_ptr<DataStorageNode> ReadDataStorage(DataSchemaState* schema,
                                                 v8::Local<v8::Value> value,
                                                 unsigned depth) {
  if (depth >= 256) {
    Nan::ThrowRangeError("Data storage exceeds the recursive depth limit");
    return {};
  }
  if (!SchemaIsLive(schema)) {
    return {};
  }
  auto node = std::make_shared<DataStorageNode>();
  node->schema = schema;
  auto edges = DataStorageEdges(node.get());
  if (schema->custom) {
    Nan::Set(edges, 0, value).FromJust();
  } else if (schema->reference) {
    if (!ReadDataReference(node.get(), value)) {
      return {};
    }
  } else if (schema->type == Rml::DataVariableType::Scalar) {
    if (!value->IsUndefined()) {
      Rml::Variant converted;
      if (!VariantFromJs(value, &converted) || !SchemaIsLive(schema)) {
        return {};
      }
      if (!node->Variable().Set(converted)) {
        Nan::ThrowTypeError("Initial data value cannot convert to its schema");
        return {};
      }
    }
  } else if (schema->type == Rml::DataVariableType::Struct) {
    if (!value->IsUndefined() && (!value->IsObject() || value->IsArray())) {
      Nan::ThrowTypeError("Expected a record for a struct data schema");
      return {};
    }
    for (const auto& [name, member] : schema->members) {
      if (schema->accessors.contains(name)) {
        Nan::Set(edges,
                 static_cast<uint32_t>(node->children.size()),
                 Nan::Undefined())
            .FromJust();
        node->children.push_back({});
        continue;
      }
      v8::Local<v8::Value> child = Nan::Undefined();
      if (!value->IsUndefined() &&
          !Nan::Get(value.As<v8::Object>(), Nan::New(name).ToLocalChecked())
               .ToLocal(&child)) {
        return {};
      }
      if (!SchemaIsLive(schema)) {
        return {};
      }
      auto storage = ReadDataStorage(member, child, depth + 1);
      if (!storage) {
        return {};
      }
      Nan::Set(edges,
               static_cast<uint32_t>(node->children.size()),
               DataStorageEdges(storage.get()))
          .FromJust();
      node->children.push_back(std::move(storage));
    }
  } else {
    if (!value->IsUndefined() &&
        (!value->IsArray() && !value->IsTypedArray())) {
      Nan::ThrowTypeError("Expected an array for an array data schema");
      return {};
    }
    node->count = value->IsArray()        ? value.As<v8::Array>()->Length()
                  : value->IsTypedArray() ? value.As<v8::TypedArray>()->Length()
                                          : 0;
    if (node->count > static_cast<size_t>(std::numeric_limits<int>::max())) {
      Nan::ThrowRangeError("Data array exceeds the native size range");
      return {};
    }
    const bool numeric =
        schema->underlying->type == Rml::DataVariableType::Scalar &&
        schema->underlying->width != 0;
    if (numeric) {
      node->backing = v8::ArrayBuffer::NewBackingStore(
          v8::Isolate::GetCurrent(), node->count * schema->underlying->width);
      if (!node->backing) {
        Nan::ThrowError("Cannot allocate native numerical data storage");
        return {};
      }
      auto& counts = State().data_diagnostics;
      counts.Record(&DataDiagnostics::backing_allocations);
      counts.Record(&DataDiagnostics::backing_bytes,
                    node->count * schema->underlying->width);
    }
    for (uint32_t i = 0; i < node->count; ++i) {
      v8::Local<v8::Value> child;
      if (!Nan::Get(value.As<v8::Object>(), i).ToLocal(&child)) {
        return {};
      }
      if (!SchemaIsLive(schema)) {
        return {};
      }
      if (numeric) {
        Rml::Variant converted;
        auto* bytes = static_cast<std::byte*>(node->backing->Data());
        if (!VariantFromJs(child, &converted) || !SchemaIsLive(schema)) {
          return {};
        }
        if (!schema->underlying->definition->Set(
                bytes + i * schema->underlying->width, converted)) {
          Nan::ThrowTypeError("Array value cannot convert to its data schema");
          return {};
        }
      } else {
        auto storage = ReadDataStorage(schema->underlying, child, depth + 1);
        if (!storage) {
          return {};
        }
        Nan::Set(edges,
                 static_cast<uint32_t>(node->children.size()),
                 DataStorageEdges(storage.get()))
            .FromJust();
        node->children.push_back(std::move(storage));
      }
    }
  }
  return node;
}

bool ResizeDataStorage(DataStorageNode* node, size_t count) {
  if (node->schema->reference || node->schema->custom ||
      node->schema->type != Rml::DataVariableType::Array) {
    Nan::ThrowTypeError("Only registered arrays can resize");
    return false;
  }
  if (count > static_cast<size_t>(std::numeric_limits<int>::max())) {
    Nan::ThrowRangeError("Data array exceeds the native size range");
    return false;
  }
  if (count == node->count) {
    return true;
  }
  if (node->backing) {
    const auto width = node->schema->underlying->width;
    std::shared_ptr<v8::BackingStore> next = v8::ArrayBuffer::NewBackingStore(
        v8::Isolate::GetCurrent(), count * width);
    if (!next) {
      Nan::ThrowError("Cannot allocate native numerical data storage");
      return false;
    }
    auto& counts = State().data_diagnostics;
    counts.Record(&DataDiagnostics::backing_allocations);
    counts.Record(&DataDiagnostics::backing_bytes, count * width);
    const auto copied = std::min(count, node->count) * width;
    if (copied) {
      std::memcpy(next->Data(), node->backing->Data(), copied);
      counts.Record(&DataDiagnostics::resize_copies);
      counts.Record(&DataDiagnostics::resize_copied_bytes, copied);
    }
    node->backing = std::move(next);
  } else {
    // Construct new values before changing the live container. Existing nodes
    // retain their stable addresses during vector growth.
    std::vector<std::shared_ptr<DataStorageNode>> added;
    for (size_t i = node->count; i < count; ++i) {
      auto child = ReadDataStorage(node->schema->underlying, Nan::Undefined());
      if (!child) {
        return false;
      }
      added.push_back(std::move(child));
    }
    node->children.reserve(count);
    auto edges = DataStorageEdges(node);
    for (auto& child : added) {
      if (auto model = node->storage_model.lock()) {
        auto address = node->storage_address;
        address.emplace_back(static_cast<int>(node->children.size()));
        AttachDataStorage(child.get(), model, std::move(address));
      } else if (auto storage = node->storage_owner.lock()) {
        auto address = node->storage_address;
        address.emplace_back(static_cast<int>(node->children.size()));
        AttachOwnedDataStorage(child.get(), storage, std::move(address));
      }
      Nan::Set(edges,
               static_cast<uint32_t>(node->children.size()),
               DataStorageEdges(child.get()))
          .FromJust();
      node->children.push_back(std::move(child));
    }
    node->children.resize(count);
    Nan::Set(edges,
             Nan::New("length").ToLocalChecked(),
             Nan::New(static_cast<uint32_t>(count)))
        .FromJust();
  }
  node->count = count;
  return true;
}

NAN_MODULE_INIT(InitializeRmlDataStorage) {
  SetRuntimeMethod<GetNumericView, true>(target, "dataVariableNumericView");
  SetRuntimeMethod<ResizeArray, true>(target, "dataVariableResize");
  SetRuntimeMethod<GetReference, true>(target, "dataVariableGetReference");
  SetRuntimeMethod<GetPayload, true>(target, "dataVariableGetPayload");
  SetRuntimeMethod<SetReference>(target, "dataVariableSetReference");
  SetRuntimeMethod<ApplyPatch, true>(target, "dataModelApplyPatch");
}

}  // namespace sfmlrmlui
