// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/data/rmlui-data-address.h"

#include <RmlUi/Core/DataModelHandle.h>
#include <RmlUi/Core/DataVariable.h>
#include <nan.h>

#include <memory>
#include <string>
#include <utility>
#include <vector>

#include "native/data/rmlui-data-schema.h"
#include "native/data/rmlui-data.h"
#include "native/runtime/rmlui-state.h"
#include "third_party/rmlui/Source/Core/DataModel.h"

namespace sfmlrmlui {

bool ReadDataAddressEntry(v8::Local<v8::Value> input,
                          Rml::DataAddressEntry* output) {
  if (input->IsString()) {
    Nan::Utf8String text(input);
    *output = Rml::DataAddressEntry(Rml::String(*text, text.length()));
    return true;
  }
  if (input->IsInt32()) {
    *output = Rml::DataAddressEntry(Nan::To<int>(input).FromJust());
    return true;
  }
  if (!input->IsObject()) {
    Nan::ThrowTypeError("Expected a data address name, integer index or entry");
    return false;
  }
  v8::Local<v8::Value> name;
  v8::Local<v8::Value> index;
  if (!Nan::Get(input.As<v8::Object>(), Nan::New("name").ToLocalChecked())
           .ToLocal(&name) ||
      !Nan::Get(input.As<v8::Object>(), Nan::New("index").ToLocalChecked())
           .ToLocal(&index)) {
    return false;
  }
  if (!name->IsString() || !index->IsInt32()) {
    Nan::ThrowTypeError("Expected data address entry name and integer index");
    return false;
  }
  Nan::Utf8String text(name);
  output->name.assign(*text, text.length());
  output->index = Nan::To<int>(index).FromJust();
  return true;
}

bool ReadDataAddress(v8::Local<v8::Array> input, Rml::DataAddress* output) {
  const uint32_t length = input->Length();
  output->reserve(length);
  for (uint32_t i = 0; i < length; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(input, i).ToLocal(&value)) {
      return false;
    }
    if (!value->IsObject()) {
      Nan::ThrowTypeError("Expected a data address entry object");
      return false;
    }
    Rml::DataAddressEntry entry("");
    if (!ReadDataAddressEntry(value, &entry)) {
      return false;
    }
    output->push_back(std::move(entry));
  }
  return true;
}

namespace {

NAN_METHOD(CreateInvalidModel) {
  info.GetReturnValue().Set(
      DataModelNativeHandle::Create(std::make_shared<DataModelState>()));
}

NAN_METHOD(CreateInvalidVariable) {
  info.GetReturnValue().Set(
      DataVariableNativeHandle::Create(std::make_shared<DataVariableState>()));
}

NAN_METHOD(CreateLiteralInt) {
  if (!info[0]->IsInt32()) {
    return Nan::ThrowTypeError("Expected a signed 32-bit integer literal");
  }
  auto owner = std::make_shared<DataVariableState>();
  owner->standalone =
      Rml::MakeLiteralIntVariable(Nan::To<int>(info[0]).FromJust());
  info.GetReturnValue().Set(DataVariableNativeHandle::Create(std::move(owner)));
}

NAN_METHOD(CreateOwnedVariable) {
  auto schema = DataSchemaOf(info[0]);
  if (!schema) {
    return;
  }
  if (schema->borrowed_scalar_definition) {
    return Nan::ThrowTypeError(
        "Borrowed model definitions cannot allocate owned storage");
  }
  auto storage = std::make_shared<DataOwnedStorageState>();
  storage->type_register = schema->owner.lock();
  FreezeDataSchema(schema.get());
  storage->root = ReadDataStorage(schema.get(), info[1]);
  // Input accessors may remove the context or shut down the runtime.
  if (!storage->root || !DataSchemaOf(info[0])) {
    return;
  }
  AttachOwnedDataStorage(storage->root.get(), storage, {});
  info.GetReturnValue().Set(WrapOwnedDataVariable(storage, {}));
}

NAN_METHOD(IsVariableValid) {
  auto* handle = DataVariableNativeHandle::TryFrom(info[0]);
  if (!handle) {
    return Nan::ThrowTypeError("Expected a data variable handle");
  }
  const auto owner = handle->owner();
  info.GetReturnValue().Set(DataVariableIsValid(owner));
}

NAN_METHOD(GetAllVariables) {
  auto model = DataModelOf(info[0]);
  if (!model) {
    return;
  }
  // Copy names before V8 allocations, which may run host collection.
  std::vector<Rml::String> names;
  for (const auto& [name, variable] :
       Rml::Detail::DataModelConstructorAccessor::GetAllVariables(
           model->constructor)) {
    names.push_back(name);
  }
  auto result = Nan::New<v8::Object>();
  for (const auto& name : names) {
    result
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             Nan::New(name).ToLocalChecked(),
                             WrapDataVariable(model, {{name}}))
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetVariableDefinition) {
  Rml::DataVariable variable;
  auto owner = DataVariableOf(info[0], &variable);
  if (!owner) {
    return;
  }
  auto* definition = Rml::Detail::DataVariableAccessor::GetDefinition(variable);
  if (const auto types = DataVariableRegister(owner)) {
    for (const auto& [name, schema] : types->schemas) {
      if (schema->definition == definition) {
        info.GetReturnValue().Set(WrapDataSchema(schema));
        return;
      }
    }
    for (const auto& schema : types->private_schemas) {
      if (schema->definition == definition) {
        info.GetReturnValue().Set(WrapDataSchema(schema));
        return;
      }
    }
  }
  // Unregistered definitions belong to the variable's checked lease. Keep
  // that lease instead of exporting a raw pointer or inventing a family id.
  info.GetReturnValue().Set(info[0]);
}

NAN_METHOD(IsRegisteredDefinition) {
  info.GetReturnValue().Set(DataSchemaNativeHandle::TryFrom(info[0]) !=
                            nullptr);
}

NAN_METHOD(IsDefinitionValid) {
  if (auto* schema = DataSchemaNativeHandle::TryFrom(info[0])) {
    const auto owner = schema->owner()->owner.lock();
    info.GetReturnValue().Set(owner && DataRegisterIsValid(owner));
    return;
  }
  IsVariableValid(info);
}

NAN_METHOD(DefinitionType) {
  if (DataSchemaNativeHandle::TryFrom(info[0])) {
    if (auto schema = DataSchemaOf(info[0])) {
      info.GetReturnValue().Set(static_cast<int>(schema->type));
    }
    return;
  }
  Rml::DataVariable variable;
  if (DataVariableOf(info[0], &variable)) {
    info.GetReturnValue().Set(static_cast<int>(variable.Type()));
  }
}

NAN_METHOD(DefinitionMembers) {
  Rml::StringList members;
  if (DataSchemaNativeHandle::TryFrom(info[0])) {
    const auto schema = DataSchemaOf(info[0]);
    if (!schema) {
      return;
    }
    // Model-owned function definitions may expire before their shared
    // register. They have no reflected members and must not be dereferenced.
    if (!schema->borrowed_scalar_definition) {
      members = schema->definition->ReflectMemberNames();
    }
  } else {
    Rml::DataVariable variable;
    if (!DataVariableOf(info[0], &variable)) {
      return;
    }
    members = Rml::Detail::DataVariableAccessor::GetDefinition(variable)
                  ->ReflectMemberNames();
  }
  auto result = Nan::New<v8::Array>(static_cast<int>(members.size()));
  for (uint32_t i = 0; i < members.size(); ++i) {
    Nan::Set(result, i, Nan::New(members[i]).ToLocalChecked()).FromJust();
  }
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlDataAddress) {
  SetRuntimeMethod<CreateInvalidModel, true, false>(target,
                                                    "createInvalidDataModel");
  SetRuntimeMethod<CreateInvalidVariable, true, false>(
      target, "createInvalidDataVariable");
  SetRuntimeMethod<CreateLiteralInt, true, false>(target,
                                                  "makeLiteralIntVariable");
  SetRuntimeMethod<CreateOwnedVariable>(target, "createOwnedDataVariable");
  SetRuntimeMethod<IsVariableValid, true, false>(target, "dataVariableIsValid");
  SetRuntimeMethod<GetAllVariables, true>(target, "dataModelGetAllVariables");
  SetRuntimeMethod<GetVariableDefinition, true, false>(
      target, "dataVariableGetDefinition");
  SetRuntimeMethod<IsRegisteredDefinition, true, false>(
      target, "dataDefinitionIsRegistered");
  SetRuntimeMethod<IsDefinitionValid, true, false>(target,
                                                   "dataDefinitionIsValid");
  SetRuntimeMethod<DefinitionType, true, false>(target, "dataDefinitionType");
  SetRuntimeMethod<DefinitionMembers, true, false>(
      target, "dataDefinitionReflectMembers");
}

}  // namespace sfmlrmlui
