// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_H_

#include <RmlUi/Core/DataModelHandle.h>
#include <RmlUi/Core/DataVariable.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#include "native/data/rmlui-data-diagnostics.h"

namespace sfmlrmlui {

struct ContextState;
struct DataSchemaState;
struct DataStorageNode;
struct DataBatchState;
struct DataOwnedStorageState;

// Persistent arrays are strong for native-owned contexts and weak for contexts
// owned by V8. Private context edges keep the latter's callback cycles visible.
struct DataCallbacks {
  DiagnosticCallback diagnostic_category{DiagnosticCallback::kDataDefinition};
  v8::Global<v8::Array> functions;
  unsigned active{0};
  std::vector<uint32_t> active_functions;
};

struct DataRegisterState {
  Rml::DataTypeRegister* value{nullptr};
  std::unique_ptr<Rml::DataTypeRegister> owned;
  std::weak_ptr<ContextState> context;
  std::shared_ptr<DataCallbacks> callbacks;
  std::unordered_map<std::string, uint32_t> transforms;
  std::unordered_map<std::string, std::shared_ptr<DataSchemaState>> schemas;
  // Advanced aliases own private definitions without adding public type names.
  std::vector<std::shared_ptr<DataSchemaState>> private_schemas;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
  ~DataRegisterState();
};

struct DataScalarStorage {
  bool boolean{false};
  double number{0};
  int64_t signed_integer{0};
  uint64_t unsigned_integer{0};
  Rml::String text;
};

struct DataModelState {
  Rml::DataModel* value{nullptr};
  Rml::DataModelConstructor constructor;
  std::weak_ptr<ContextState> context;
  std::shared_ptr<DataRegisterState> type_register;
  std::shared_ptr<DataCallbacks> callbacks;
  std::vector<std::unique_ptr<DataScalarStorage>> scalars;
  std::unordered_map<std::string, std::shared_ptr<DataStorageNode>> storage;
  std::vector<std::shared_ptr<DataBatchState>> batches;
  v8::Global<v8::Object> handle;
  Rml::String name;
  uint64_t generation{0};
};

// Both model and independently owned variables re-resolve their paths after
// resize or callback execution. Literal definitions have static Core lifetime.
struct DataVariableState {
  std::shared_ptr<DataModelState> model;
  std::shared_ptr<DataOwnedStorageState> owned_storage;
  Rml::DataAddress address;
  Rml::DataVariable standalone;
};

struct DataOwnedStorageState {
  std::shared_ptr<DataRegisterState> type_register;
  std::shared_ptr<DataStorageNode> root;
  // Canonical root wrapper retains V8-visible payload/reference edges.
  v8::Global<v8::Object> handle;
};

using DataModelNativeHandle = sfmljs::SharedHandle<DataModelState>;
using DataVariableNativeHandle = sfmljs::SharedHandle<DataVariableState>;
using DataRegisterNativeHandle = sfmljs::SharedHandle<DataRegisterState>;

std::shared_ptr<DataModelState> DataModelOf(v8::Local<v8::Value> value);
std::shared_ptr<DataModelState> DataModelFromPointer(
    const Rml::DataModel* model);
void IndexDataModel(const std::shared_ptr<DataModelState>& model);
bool DataModelIsValid(const std::shared_ptr<DataModelState>& owner);
v8::Local<v8::Object> WrapDataModel(
    const std::shared_ptr<DataModelState>& owner);
v8::Local<v8::Array> DataCallbackArray(
    const std::shared_ptr<DataCallbacks>& owner);
uint32_t AddDataCallback(const std::shared_ptr<DataCallbacks>& owner,
                         v8::Local<v8::Value> callback);
// Data expressions may retain Variant values; borrowed element/void pointers
// require managed reference schemas instead of entering this value boundary.
bool ReadOwnedDataVariant(v8::Local<v8::Value> input, Rml::Variant* value);
// Invoke and convert under one active scope, including result accessors.
bool InvokeDataCallback(
    const std::shared_ptr<DataCallbacks>& owner,
    uint32_t index,
    int argc,
    v8::Local<v8::Value>* argv,
    const std::function<bool(v8::Local<v8::Value>)>& consume);
v8::Local<v8::Object> WrapDataVariable(
    const std::shared_ptr<DataModelState>& model, Rml::DataAddress address);
v8::Local<v8::Object> WrapOwnedDataVariable(
    const std::shared_ptr<DataOwnedStorageState>& storage,
    Rml::DataAddress address);
std::shared_ptr<DataRegisterState> DataVariableRegister(
    const std::shared_ptr<DataVariableState>& owner);
Rml::DataVariable ResolveDataVariable(
    const std::shared_ptr<DataVariableState>& owner);
bool DataVariableIsValid(const std::shared_ptr<DataVariableState>& owner);
void RefreshDataOwnership();
void InvalidateDataModels(const std::shared_ptr<ContextState>& context);
void InvalidateDataModel(const std::shared_ptr<DataModelState>& model);
void ReleaseDataRegisters();
bool DataRegisterIsValid(const std::shared_ptr<DataRegisterState>& owner);
std::shared_ptr<DataRegisterState> DataRegisterOf(v8::Local<v8::Value> value);
v8::Local<v8::Object> WrapDataRegister(
    const std::shared_ptr<DataRegisterState>& owner);
std::shared_ptr<DataVariableState> DataVariableOf(v8::Local<v8::Value> input,
                                                  Rml::DataVariable* variable);
bool SetDataVariableValue(const std::shared_ptr<DataModelState>& model,
                          Rml::DataVariable variable,
                          const Rml::Variant& value);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DATA_RMLUI_DATA_H_
