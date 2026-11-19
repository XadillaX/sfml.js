// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/DataModelHandle.h>
#include <RmlUi/Core/DataTypeRegister.h>
#include <RmlUi/Core/DataVariable.h>
#include <RmlUi/Core/Variant.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <memory>
#include <string>
#include <utility>

#include "native/data/rmlui-data-address.h"
#include "native/data/rmlui-data-schema.h"
#include "native/data/rmlui-data.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"
#include "third_party/rmlui/Source/Core/DataModel.h"

namespace sfmlrmlui {
namespace {

bool ReadString(v8::Local<v8::Value> input, Rml::String* output) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a data model name or variable path string");
    return false;
  }
  Nan::Utf8String text(input);
  output->assign(*text, text.length());
  return true;
}

std::shared_ptr<DataModelState> ShareModel(Rml::Context* context,
                                           const Rml::String& name,
                                           Rml::DataModelConstructor value) {
  auto token = State().contexts.at(context);
  auto& owner = token->data_models[name];
  if (owner) {
    return owner;
  }
  owner = std::make_shared<DataModelState>();
  owner->constructor = value;
  owner->value = Rml::Detail::DataModelConstructorAccessor::GetModel(value);
  owner->context = token;
  if (token->data_register &&
      token->data_register->value == value.GetDataTypeRegister()) {
    owner->type_register = token->data_register;
  } else {
    for (const auto& weak : State().data_registers) {
      auto type_register = weak.lock();
      if (type_register &&
          type_register->value == value.GetDataTypeRegister()) {
        owner->type_register = std::move(type_register);
        break;
      }
    }
  }
  if (!owner->type_register) {
    if (!token->data_register) {
      token->data_register = std::make_shared<DataRegisterState>();
      token->data_register->value = value.GetDataTypeRegister();
      token->data_register->context = token;
      token->data_register->generation = State().generation;
      token->data_register->callbacks = std::make_shared<DataCallbacks>();
    }
    owner->type_register = token->data_register;
  }
  owner->callbacks = std::make_shared<DataCallbacks>();
  owner->name = name;
  owner->generation = State().generation;
  IndexDataModel(owner);
  return owner;
}

NAN_METHOD(CreateModel) {
  Rml::String name;
  if (!ReadString(info[1], &name) || !info[2]->IsBoolean()) {
    return;
  }
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  std::shared_ptr<DataRegisterState> type_register;
  if (!info[3]->IsUndefined()) {
    type_register = DataRegisterOf(info[3]);
    if (!type_register) {
      return;
    }
    // Borrowed context registers cannot be exported to other contexts.
    if (!type_register->owned &&
        type_register->context.lock()->context != context) {
      return Nan::ThrowTypeError(
          "Shared data models require an owned register");
    }
  }
  auto value = context->CreateDataModel(
      name, type_register ? type_register->value : nullptr, info[2]->IsTrue());
  info.GetReturnValue().Set(value ? v8::Local<v8::Value>(WrapDataModel(
                                        ShareModel(context, name, value)))
                                  : v8::Local<v8::Value>(Nan::Null()));
}

NAN_METHOD(GetModel) {
  Rml::String name;
  if (!ReadString(info[1], &name)) {
    return;
  }
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  auto value = context->GetDataModel(name);
  info.GetReturnValue().Set(value ? v8::Local<v8::Value>(WrapDataModel(
                                        ShareModel(context, name, value)))
                                  : v8::Local<v8::Value>(Nan::Null()));
}

NAN_METHOD(GetModels) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  auto result = Nan::New<v8::Object>();
  const auto models = context->GetDataModels();
  for (const auto& [name, value] : models) {
    result
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             Nan::New(name).ToLocalChecked(),
                             WrapDataModel(ShareModel(context, name, value)))
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(RemoveModel) {
  Rml::String name;
  if (!ReadString(info[1], &name)) {
    return;
  }
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  auto token = State().contexts.at(context);
  const bool removed = context->RemoveDataModel(name);
  if (removed) {
    const auto found = token->data_models.find(name);
    if (found != token->data_models.end()) {
      InvalidateDataModel(found->second);
      token->data_models.erase(found);
    }
  }
  info.GetReturnValue().Set(removed);
}

NAN_METHOD(IsModelValid) {
  auto* handle = DataModelNativeHandle::TryFrom(info[0]);
  if (!handle) {
    return Nan::ThrowTypeError("Expected a data model handle");
  }
  info.GetReturnValue().Set(DataModelIsValid(handle->owner()));
}

NAN_METHOD(BindScalar) {
  Rml::String name;
  if (!info[3]->IsUndefined()) {
    if (!ReadString(info[1], &name)) {
      return;
    }
    auto schema = DataSchemaOf(info[3]);
    auto model = DataModelOf(info[0]);
    if (!schema || !model) {
      return;
    }
    if (schema->owner.lock() != model->type_register) {
      return Nan::ThrowTypeError("Binding schema belongs to another register");
    }
    FreezeDataSchema(schema.get());
    auto storage = ReadDataStorage(schema.get(), info[2]);
    // User accessors may destroy the model, context or owning register.
    if (!storage || !DataModelOf(info[0]) || !DataSchemaOf(info[3])) {
      return;
    }
    const bool bound =
        model->constructor.BindCustomDataVariable(name, storage->Variable());
    if (bound) {
      AddDataCallback(model->callbacks, DataStorageEdges(storage.get()));
      AttachDataStorage(storage.get(), model, {{name}});
      model->storage.emplace(name, std::move(storage));
    }
    info.GetReturnValue().Set(bound);
    return;
  }
  Rml::Variant value;
  if (!ReadString(info[1], &name) || !VariantFromJs(info[2], &value)) {
    return;
  }
  // Conversion can run getters. Resolve the live owner only afterwards.
  auto owner = DataModelOf(info[0]);
  if (!owner) {
    return;
  }
  auto storage = std::make_unique<DataScalarStorage>();
  Rml::DataVariable variable;
  auto* types = owner->constructor.GetDataTypeRegister();
  switch (value.GetType()) {
    case Rml::Variant::BOOL:
      storage->boolean = value.Get<bool>();
      variable = {types->GetDefinition<bool>(), &storage->boolean};
      break;
    case Rml::Variant::DOUBLE:
      storage->number = value.Get<double>();
      variable = {types->GetDefinition<double>(), &storage->number};
      break;
    case Rml::Variant::INT64:
      storage->signed_integer = value.Get<int64_t>();
      variable = {types->GetDefinition<int64_t>(), &storage->signed_integer};
      break;
    case Rml::Variant::UINT64:
      storage->unsigned_integer = value.Get<uint64_t>();
      variable = {types->GetDefinition<uint64_t>(), &storage->unsigned_integer};
      break;
    case Rml::Variant::STRING:
      storage->text = value.Get<Rml::String>();
      variable = {types->GetDefinition<Rml::String>(), &storage->text};
      break;
    default:
      return Nan::ThrowTypeError(
          "Data scalar must be a boolean, number, BigInt or string");
  }
  const bool bound = owner->constructor.BindCustomDataVariable(name, variable);
  if (bound) {
    owner->scalars.push_back(std::move(storage));
  }
  info.GetReturnValue().Set(bound);
}

NAN_METHOD(IsDirty) {
  Rml::String name;
  if (!ReadString(info[1], &name)) {
    return;
  }
  if (auto owner = DataModelOf(info[0])) {
    info.GetReturnValue().Set(
        owner->constructor.GetModelHandle().IsVariableDirty(name));
  }
}

NAN_METHOD(DirtyVariable) {
  Rml::String name;
  if (!ReadString(info[1], &name)) {
    return;
  }
  if (auto owner = DataModelOf(info[0])) {
    owner->constructor.GetModelHandle().DirtyVariable(name);
  }
}

NAN_METHOD(DirtyAll) {
  if (auto owner = DataModelOf(info[0])) {
    owner->constructor.GetModelHandle().DirtyAllVariables();
  }
}

NAN_METHOD(UpdateModel) {
  if (!info[1]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected clearDirtyVariables boolean");
  }
  if (auto owner = DataModelOf(info[0])) {
    info.GetReturnValue().Set(owner->value->Update(info[1]->IsTrue()));
  }
}

}  // namespace

v8::Local<v8::Object> WrapDataVariable(
    const std::shared_ptr<DataModelState>& model, Rml::DataAddress address) {
  auto owner = std::make_shared<DataVariableState>();
  owner->model = model;
  owner->address = std::move(address);
  auto handle = DataVariableNativeHandle::Create(std::move(owner));
  Nan::SetPrivate(
      handle, Nan::New("rml.data.model").ToLocalChecked(), WrapDataModel(model))
      .FromJust();
  return handle;
}

v8::Local<v8::Object> WrapOwnedDataVariable(
    const std::shared_ptr<DataOwnedStorageState>& storage,
    Rml::DataAddress address) {
  const bool root = address.empty();
  if (root && !storage->handle.IsEmpty()) {
    return storage->handle.Get(v8::Isolate::GetCurrent());
  }
  auto owner = std::make_shared<DataVariableState>();
  owner->owned_storage = storage;
  owner->address = std::move(address);
  auto handle = DataVariableNativeHandle::Create(std::move(owner));
  if (root) {
    storage->handle.Reset(v8::Isolate::GetCurrent(), handle);
    storage->handle.SetWeak();
    Nan::SetPrivate(handle,
                    Nan::New("rml.data.register").ToLocalChecked(),
                    WrapDataRegister(storage->type_register))
        .FromJust();
    Nan::SetPrivate(handle,
                    Nan::New("rml.data.storage").ToLocalChecked(),
                    DataStorageEdges(storage->root.get()))
        .FromJust();
  } else {
    Nan::SetPrivate(handle,
                    Nan::New("rml.data.owner").ToLocalChecked(),
                    WrapOwnedDataVariable(storage, {}))
        .FromJust();
  }
  return handle;
}

namespace {

NAN_METHOD(GetVariable) {
  Rml::String path;
  Rml::DataAddress address;
  const bool explicit_address = info[1]->IsArray();
  if (explicit_address) {
    if (!ReadDataAddress(info[1].As<v8::Array>(), &address)) {
      return;
    }
  } else {
    if (!ReadString(info[1], &path)) {
      return;
    }
    if (path.starts_with("$.")) {
      path.erase(0, 2);
    }
  }
  auto owner = DataModelOf(info[0]);
  if (!owner) {
    return;
  }
  if (!explicit_address) {
    address = owner->value->ResolveAddress(path, nullptr);
  }
  const auto variable = owner->value->GetVariable(address);
  info.GetReturnValue().Set(variable ? v8::Local<v8::Value>(WrapDataVariable(
                                           owner, std::move(address)))
                                     : v8::Local<v8::Value>(Nan::Null()));
}

}  // namespace

std::shared_ptr<DataRegisterState> DataVariableRegister(
    const std::shared_ptr<DataVariableState>& owner) {
  return owner->model           ? owner->model->type_register
         : owner->owned_storage ? owner->owned_storage->type_register
                                : nullptr;
}

Rml::DataVariable ResolveDataVariable(
    const std::shared_ptr<DataVariableState>& owner) {
  if (owner->owned_storage) {
    if (!DataRegisterIsValid(owner->owned_storage->type_register)) {
      Nan::ThrowError("RmlUi owned data storage is no longer valid");
      return {};
    }
    auto variable = owner->owned_storage->root->Variable();
    for (const auto& entry : owner->address) {
      variable = variable.Child(entry);
      if (!variable || !State().callback_exception.IsEmpty()) {
        return {};
      }
    }
    return variable;
  }
  if (!owner->model) {
    if (!owner->standalone) {
      Nan::ThrowError("RmlUi data variable is not valid");
      return {};
    }
    return owner->standalone;
  }
  if (!DataModelIsValid(owner->model)) {
    Nan::ThrowError("RmlUi data model is no longer valid");
    return {};
  }
  return owner->model->value->GetVariable(owner->address);
}

bool DataVariableIsValid(const std::shared_ptr<DataVariableState>& owner) {
  if (owner->owned_storage &&
      !DataRegisterIsValid(owner->owned_storage->type_register)) {
    return false;
  }
  if (owner->model && !DataModelIsValid(owner->model)) {
    return false;
  }
  if (!owner->model && !owner->owned_storage) {
    return static_cast<bool>(owner->standalone);
  }
  return static_cast<bool>(ResolveDataVariable(owner));
}

std::shared_ptr<DataVariableState> DataVariableOf(v8::Local<v8::Value> input,
                                                  Rml::DataVariable* variable) {
  auto* handle = DataVariableNativeHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a data variable handle");
    return {};
  }
  auto owner = handle->owner();
  {
    Nan::TryCatch caught;
    *variable = ResolveDataVariable(owner);
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
      return {};
    }
  }
  if (!*variable) {
    if (State().callback_exception.IsEmpty()) {
      Nan::ThrowError("RmlUi data variable path is no longer valid");
    }
    return {};
  }
  return owner;
}

bool SetDataVariableValue(const std::shared_ptr<DataModelState>& model,
                          Rml::DataVariable variable,
                          const Rml::Variant& value) {
  if (!model) {
    return variable.Set(value);
  }
  // Preserve the foundation's guards for inferred 64-bit scalar storage.
  auto* definition = Rml::Detail::DataVariableAccessor::GetDefinition(variable);
  auto* types = model->constructor.GetDataTypeRegister();
  const bool integer = definition == types->GetDefinition<int64_t>() ||
                       definition == types->GetDefinition<uint64_t>();
  if (integer) {
    Rml::Variant previous;
    Rml::Variant checked;
    if (!variable.Get(previous) ||
        !VariantWithDefault(&value, previous, &checked)) {
      return false;
    }
  }
  return variable.Set(value);
}

namespace {

NAN_METHOD(GetValue) {
  Rml::DataVariable variable;
  if (!DataVariableOf(info[0], &variable)) {
    return;
  }
  Rml::Variant result;
  if (variable.Get(result)) {
    v8::Local<v8::Value> value;
    if (VariantToJs(result).ToLocal(&value)) {
      info.GetReturnValue().Set(value);
    }
  }
}

NAN_METHOD(SetValue) {
  Rml::Variant value;
  if (!ReadOwnedDataVariant(info[1], &value)) {
    return;
  }
  Rml::DataVariable variable;
  if (auto owner = DataVariableOf(info[0], &variable)) {
    info.GetReturnValue().Set(
        SetDataVariableValue(owner->model, variable, value));
  }
}

NAN_METHOD(VariableType) {
  Rml::DataVariable variable;
  if (DataVariableOf(info[0], &variable)) {
    info.GetReturnValue().Set(static_cast<int>(variable.Type()));
  }
}

NAN_METHOD(VariableSize) {
  Rml::DataVariable variable;
  if (DataVariableOf(info[0], &variable)) {
    info.GetReturnValue().Set(variable.Size());
  }
}

NAN_METHOD(VariableChild) {
  Rml::DataAddressEntry entry("");
  if (!ReadDataAddressEntry(info[1], &entry)) {
    return;
  }
  Rml::DataVariable variable;
  auto owner = DataVariableOf(info[0], &variable);
  if (!owner) {
    return;
  }
  if (!variable.Child(entry)) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  auto address = owner->address;
  address.push_back(std::move(entry));
  info.GetReturnValue().Set(
      owner->owned_storage
          ? WrapOwnedDataVariable(owner->owned_storage, std::move(address))
          : WrapDataVariable(owner->model, std::move(address)));
}

NAN_METHOD(ReflectMembers) {
  Rml::DataVariable variable;
  if (!DataVariableOf(info[0], &variable)) {
    return;
  }
  auto* definition = Rml::Detail::DataVariableAccessor::GetDefinition(variable);
  const auto members = definition->ReflectMemberNames();
  auto result = Nan::New<v8::Array>(static_cast<int>(members.size()));
  for (uint32_t i = 0; i < members.size(); ++i) {
    Nan::Set(result, i, Nan::New(members[i]).ToLocalChecked()).FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetRegister) {
  if (auto model = DataModelOf(info[0])) {
    info.GetReturnValue().Set(WrapDataRegister(model->type_register));
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlDataModel) {
  SetRuntimeMethod<CreateModel>(target, "contextCreateDataModel");
  SetPluginReadMethod<GetModel>(target, "contextGetDataModel");
  SetPluginReadMethod<GetModels>(target, "contextGetDataModels");
  SetRuntimeMethod<RemoveModel>(target, "contextRemoveDataModel");
  SetRuntimeMethod<IsModelValid, true, false>(target, "dataModelIsValid");
  SetRuntimeMethod<BindScalar>(target, "dataModelBind");
  SetRuntimeMethod<GetRegister, true>(target, "dataModelGetTypeRegister");
  SetRuntimeMethod<IsDirty, true>(target, "dataModelIsVariableDirty");
  SetRuntimeMethod<DirtyVariable, true>(target, "dataModelDirtyVariable");
  SetRuntimeMethod<DirtyAll, true>(target, "dataModelDirtyAllVariables");
  SetRuntimeMethod<UpdateModel>(target, "dataModelUpdate");
  SetRuntimeMethod<GetVariable, true>(target, "dataModelGetVariable");
  SetRuntimeMethod<GetValue, true, false>(target, "dataVariableGet");
  SetRuntimeMethod<SetValue, true, false>(target, "dataVariableSet");
  SetRuntimeMethod<VariableType, true, false>(target, "dataVariableType");
  SetRuntimeMethod<VariableSize, true, false>(target, "dataVariableSize");
  SetRuntimeMethod<VariableChild, true, false>(target, "dataVariableChild");
  SetRuntimeMethod<ReflectMembers, true, false>(target,
                                                "dataVariableReflectMembers");
}

}  // namespace sfmlrmlui
