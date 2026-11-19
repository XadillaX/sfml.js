// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <memory>
#include <utility>

#include "native/data/rmlui-data-schema.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

bool InvokeMember(DataStorageNode* node,
                  DataMemberAccessor* accessor,
                  bool setter,
                  v8::Local<v8::Value> value,
                  const std::function<bool(v8::Local<v8::Value>)>& consume) {
  const auto model = node->storage_model.lock();
  const auto storage = node->storage_owner.lock();
  if ((model && (!DataModelIsValid(model) || node->storage_address.empty())) ||
      (storage && !DataRegisterIsValid(storage->type_register)) ||
      (!model && !storage)) {
    Nan::ThrowError("Data member parent path is no longer valid");
    return false;
  }
  v8::Local<v8::Value> argv[] = {
      storage ? WrapOwnedDataVariable(storage, node->storage_address)
              : WrapDataVariable(model, node->storage_address),
      value};
  return InvokeDataCallback(
      (storage ? storage->type_register : model->type_register)->callbacks,
      setter ? accessor->set_callback : accessor->get_callback,
      setter ? 2 : 1,
      argv,
      consume);
}

// Plain scalars and enums convert through their checked native storage.
// A custom scalar has no fixed storage width: its member callback exchanges
// owned Variants directly, rather than treating scalar bytes as a JS payload.
bool NormalizeMember(DataSchemaState* schema,
                     const Rml::Variant& input,
                     Rml::Variant* output) {
  if (schema->custom) {
    *output = input;
    return true;
  }
  DataStorageNode temporary;
  temporary.schema = schema;
  return temporary.Variable().Set(input) && temporary.Variable().Get(*output);
}

class DataMemberDefinition final : public Rml::VariableDefinition {
 public:
  explicit DataMemberDefinition(DataMemberAccessor* accessor)
      : VariableDefinition(accessor->schema->type), accessor_(accessor) {}

  bool Get(void* ptr, Rml::Variant& value) override {
    Nan::HandleScope handles;
    auto* node = static_cast<DataStorageNode*>(ptr);
    if (accessor_->reference) {
      Rml::DataVariable target;
      const auto owner = DataMemberTarget(node, accessor_, &target);
      if (!owner) {
        if (!State().callback_exception.IsEmpty()) {
          return false;
        }
        value = Rml::Variant{};
        return true;
      }
      return target.Get(value);
    }
    return InvokeMember(node,
                        accessor_,
                        false,
                        Nan::Undefined(),
                        [&](v8::Local<v8::Value> result) {
                          Rml::Variant input;
                          return ReadOwnedDataVariant(result, &input) &&
                                 NormalizeMember(
                                     accessor_->schema, input, &value);
                        });
  }

  bool Set(void* ptr, const Rml::Variant& value) override {
    Nan::HandleScope handles;
    auto* node = static_cast<DataStorageNode*>(ptr);
    if (accessor_->reference) {
      Rml::DataVariable target;
      const auto owner = DataMemberTarget(node, accessor_, &target);
      return owner && target.Set(value);
    }
    Rml::Variant converted;
    v8::Local<v8::Value> input;
    if (!NormalizeMember(accessor_->schema, value, &converted) ||
        !VariantToJs(converted).ToLocal(&input)) {
      return false;
    }
    return InvokeMember(node, accessor_, true, input, [](v8::Local<v8::Value>) {
      return true;
    });
  }

  int Size(void* ptr) override {
    if (!accessor_->reference) {
      return 0;
    }
    Rml::DataVariable target;
    const auto owner = DataMemberTarget(
        static_cast<DataStorageNode*>(ptr), accessor_, &target);
    return owner ? target.Size() : 0;
  }

  Rml::DataVariable Child(void* ptr,
                          const Rml::DataAddressEntry& address) override {
    if (!accessor_->reference) {
      return {};
    }
    Rml::DataVariable target;
    const auto owner = DataMemberTarget(
        static_cast<DataStorageNode*>(ptr), accessor_, &target);
    return owner ? target.Child(address) : Rml::DataVariable{};
  }

  Rml::StringList ReflectMemberNames() override {
    auto* schema = accessor_->schema;
    return (schema->reference ? schema->underlying : schema)
        ->definition->ReflectMemberNames();
  }

 private:
  DataMemberAccessor* accessor_;
};

}  // namespace

Rml::UniquePtr<Rml::VariableDefinition> MakeDataMemberDefinition(
    DataMemberAccessor* accessor) {
  return Rml::MakeUnique<DataMemberDefinition>(accessor);
}

std::shared_ptr<DataVariableState> DataMemberTarget(
    DataStorageNode* node,
    DataMemberAccessor* accessor,
    Rml::DataVariable* variable) {
  Nan::HandleScope handles;
  std::shared_ptr<DataVariableState> owner;
  auto* schema = accessor->schema;
  auto* underlying = schema->reference ? schema->underlying : schema;
  const bool invoked = InvokeMember(
      node,
      accessor,
      false,
      Nan::Undefined(),
      [&](v8::Local<v8::Value> result) {
        if (result->IsNull()) {
          return true;
        }
        owner = CheckedDataTarget(
            result, schema->owner.lock(), underlying->definition, variable);
        return static_cast<bool>(owner);
      });
  if (!invoked) {
    *variable = {};
    return {};
  }
  return owner;
}

std::shared_ptr<DataVariableState> CheckedDataTarget(
    v8::Local<v8::Value> result,
    const std::shared_ptr<DataRegisterState>& type_register,
    Rml::VariableDefinition* expected,
    Rml::DataVariable* variable) {
  v8::Local<v8::Value> handle = result;
  if (!DataVariableNativeHandle::TryFrom(handle) && result->IsObject()) {
    if (!Nan::Get(result.As<v8::Object>(), Nan::New("handle").ToLocalChecked())
             .ToLocal(&handle)) {
      return {};
    }
  }
  if (!DataVariableNativeHandle::TryFrom(handle)) {
    Nan::ThrowTypeError("Expected a checked data target variable");
    return {};
  }
  // A later Child callback can force collection while Core still borrows
  // an earlier returned pointer. Keep all leases until the outer call ends.
  State().active_data_variables.emplace_back(v8::Isolate::GetCurrent(),
                                             handle.As<v8::Object>());
  auto owner = DataVariableOf(handle, variable);
  if (!owner) {
    return {};
  }
  if ((DataVariableRegister(owner) &&
       DataVariableRegister(owner) != type_register) ||
      (!DataVariableRegister(owner) && expected) ||
      (expected && Rml::Detail::DataVariableAccessor::GetDefinition(
                       *variable) != expected)) {
    Nan::ThrowTypeError("Data target has a different schema definition");
    return {};
  }
  return owner;
}

}  // namespace sfmlrmlui
