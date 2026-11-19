// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_SCHEMA_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_SCHEMA_H_

#include <RmlUi/Core/DataTypeRegister.h>
#include <nan.h>

#include <array>
#include <cstddef>
#include <memory>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/data/rmlui-data.h"

namespace sfmlrmlui {

struct DataMemberAccessor {
  DataSchemaState* schema{nullptr};
  Rml::UniquePtr<Rml::VariableDefinition> definition;
  uint32_t get_callback{0};
  uint32_t set_callback{0};
  bool reference{false};
};

enum class DataScalarKind {
  kBoolean,
  kInt8,
  kUint8,
  kInt16,
  kUint16,
  kInt32,
  kUint32,
  kInt64,
  kUint64,
  kFloat32,
  kFloat64,
  kString,
};

// The register owns every definition and schema. Recursive edges are borrowed
// from that same register, avoiding native shared_ptr cycles in tree schemas.
struct DataSchemaState {
  std::weak_ptr<DataRegisterState> owner;
  Rml::VariableDefinition* definition{nullptr};
  Rml::FamilyId family{};
  Rml::DataVariableType type{Rml::DataVariableType::Scalar};
  DataScalarKind scalar{DataScalarKind::kFloat64};
  DataSchemaState* underlying{nullptr};
  std::vector<std::pair<Rml::String, DataSchemaState*>> members;
  std::unordered_map<Rml::String, DataMemberAccessor> accessors;
  v8::Global<v8::Object> handle;
  Rml::String name;
  size_t width{0};
  bool frozen{false};
  bool reference{false};
  bool enumeration{false};
  bool custom{false};
  // Only model-owned scalar function definitions can expire before a shared
  // register. Their native reflection is empty and must not be dereferenced.
  bool borrowed_scalar_definition{false};
  std::array<uint32_t, 5> custom_callbacks{};
};

// Root nodes have stable addresses. Numeric arrays keep a native backing store
// independent of all context/model handles; old JS views can outlive resize.
struct DataStorageNode {
  DataStorageNode();
  DataSchemaState* schema{nullptr};
  alignas(std::max_align_t) std::array<std::byte, 8> scalar{};
  Rml::String text;
  std::vector<std::shared_ptr<DataStorageNode>> children;
  std::shared_ptr<v8::BackingStore> backing;
  size_t count{0};
  // Targets are native weak paths. Only the V8-visible storage edge array
  // retains target leases, so references between owned contexts can collect.
  std::weak_ptr<DataModelState> reference_model;
  std::weak_ptr<DataOwnedStorageState> reference_storage;
  Rml::DataAddress reference_address;
  bool reference_bound{false};
  // Weak owner and checked current path used by member callbacks.
  std::weak_ptr<DataModelState> storage_model;
  std::weak_ptr<DataOwnedStorageState> storage_owner;
  Rml::DataAddress storage_address;
  v8::Global<v8::Array> edges;

  void* Pointer();
  Rml::DataVariable Variable();
};

using DataSchemaNativeHandle = sfmljs::SharedHandle<DataSchemaState>;

std::shared_ptr<DataSchemaState> DataSchemaOf(v8::Local<v8::Value> value);
v8::Local<v8::Object> WrapDataSchema(
    const std::shared_ptr<DataSchemaState>& owner);
std::shared_ptr<DataStorageNode> ReadDataStorage(DataSchemaState* schema,
                                                 v8::Local<v8::Value> value,
                                                 unsigned depth = 0);
void FreezeDataSchema(DataSchemaState* schema);
bool ResizeDataStorage(DataStorageNode* node, size_t count);
v8::Local<v8::Array> DataStorageEdges(DataStorageNode* node);
Rml::DataVariable DataReferenceVariable(DataStorageNode* node);
Rml::UniquePtr<Rml::VariableDefinition> MakeCustomDataDefinition(
    DataSchemaState* schema);
std::shared_ptr<DataVariableState> CustomDataChild(
    DataStorageNode* node,
    const Rml::DataAddressEntry& address,
    Rml::DataVariable* variable);
bool ReadDataReference(DataStorageNode* node, v8::Local<v8::Value> value);
void AttachDataStorage(DataStorageNode* node,
                       const std::shared_ptr<DataModelState>& model,
                       Rml::DataAddress address);
void AttachOwnedDataStorage(
    DataStorageNode* node,
    const std::shared_ptr<DataOwnedStorageState>& storage,
    Rml::DataAddress address);
Rml::UniquePtr<Rml::VariableDefinition> MakeDataMemberDefinition(
    DataMemberAccessor* accessor);
std::shared_ptr<DataVariableState> DataMemberTarget(
    DataStorageNode* node,
    DataMemberAccessor* accessor,
    Rml::DataVariable* variable);
std::shared_ptr<DataVariableState> CheckedDataTarget(
    v8::Local<v8::Value> result,
    const std::shared_ptr<DataRegisterState>& type_register,
    Rml::VariableDefinition* expected,
    Rml::DataVariable* variable);
std::shared_ptr<DataStorageNode> DataStorageOf(
    const std::shared_ptr<DataVariableState>& owner,
    bool follow_reference = true);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_SCHEMA_H_
