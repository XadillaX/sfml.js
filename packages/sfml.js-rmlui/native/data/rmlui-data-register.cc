// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <algorithm>
#include <cerrno>
#include <cmath>
#include <cstdlib>
#include <limits>
#include <memory>
#include <optional>
#include <type_traits>
#include <unordered_set>
#include <utility>

#include "native/data/rmlui-data-schema.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

// Allocates genuine upstream family identities for runtime-named schemas.
class DynamicDataFamily final : Rml::FamilyBase {
 public:
  static Rml::FamilyId Allocate() {
    const int id = GetNewId();
    CurrentAllocations().insert(id);
    return static_cast<Rml::FamilyId>(id);
  }

  static bool IsAllocated(Rml::FamilyId id) {
    return CurrentAllocations().contains(static_cast<int>(id));
  }

 private:
  static std::unordered_set<int>& CurrentAllocations() {
    static uint64_t generation = 0;
    static std::unordered_set<int> ids;
    if (generation != State().generation) {
      ids.clear();
      generation = State().generation;
    }
    return ids;
  }
};

template <typename T>
bool ReadInteger(const Rml::Variant& value, T* result) {
  using Wide = std::conditional_t<std::is_signed_v<T>, int64_t, uint64_t>;
  Wide converted{};
  if (value.GetType() == Rml::Variant::FLOAT ||
      value.GetType() == Rml::Variant::DOUBLE) {
    const double number = value.Get<double>();
    const double upper = std::ldexp(1.0, std::numeric_limits<T>::digits);
    const double lower = std::is_signed_v<T> ? -upper : 0;
    if (!std::isfinite(number) || number < lower || number >= upper) {
      return false;
    }
  } else if (value.GetType() == Rml::Variant::INT64) {
    const auto integer = value.Get<int64_t>();
    if constexpr (!std::is_signed_v<T>) {
      if (integer < 0) {
        return false;
      }
    }
    if (integer < static_cast<int64_t>(std::numeric_limits<T>::lowest()) ||
        (integer >= 0 &&
         static_cast<uint64_t>(integer) > std::numeric_limits<T>::max())) {
      // The unsigned 64-bit lower bound must not be cast from its maximum.
      return false;
    }
  } else if (value.GetType() == Rml::Variant::UINT64) {
    if (value.Get<uint64_t>() >
        static_cast<uint64_t>(std::numeric_limits<T>::max())) {
      return false;
    }
  } else if (value.GetType() == Rml::Variant::STRING) {
    const auto text = value.Get<Rml::String>();
    errno = 0;
    if constexpr (std::is_signed_v<T>) {
      std::strtoll(text.c_str(), nullptr, 10);
    } else {
      const auto first = text.find_first_not_of(" \t\r\n");
      if (first != Rml::String::npos && text[first] == '-') {
        return false;
      }
      std::strtoull(text.c_str(), nullptr, 10);
    }
    if (errno == ERANGE) {
      return false;
    }
  }
  if (!value.GetInto(converted) ||
      converted < std::numeric_limits<T>::lowest() ||
      converted > std::numeric_limits<T>::max()) {
    return false;
  }
  *result = static_cast<T>(converted);
  return true;
}

// Keep native ScalarDefinition semantics while guarding casts in both host
// writes and Core's two-way controllers. Failed conversion leaves storage
// alone.
template <typename T>
class CheckedDataScalar final : public Rml::VariableDefinition {
 public:
  CheckedDataScalar() : VariableDefinition(Rml::DataVariableType::Scalar) {}
  bool Get(void* ptr, Rml::Variant& value) override {
    State().data_diagnostics.Record(&DataDiagnostics::scalar_reads);
    if constexpr (std::is_integral_v<T> && !std::is_same_v<T, bool> &&
                  sizeof(T) < sizeof(int32_t)) {
      // Core has no general arithmetic converters from byte/short. Promote
      // narrow storage when producing a Variant so native expressions work.
      using Wide = std::conditional_t<std::is_signed_v<T>, int, unsigned>;
      value = static_cast<Wide>(*static_cast<T*>(ptr));
      return true;
    }
    return native_.Get(ptr, value);
  }
  bool Set(void* ptr, const Rml::Variant& value) override {
    T converted{};
    if constexpr (std::is_integral_v<T> && !std::is_same_v<T, bool>) {
      if (!ReadInteger(value, &converted)) {
        return false;
      }
      // Upstream lacks TypeConverter destinations for signed char and short.
      // Convert through the checked wide native converter, then assign T.
      *static_cast<T*>(ptr) = converted;
      State().data_diagnostics.Record(&DataDiagnostics::scalar_writes);
      return true;
    } else {
      if constexpr (std::is_floating_point_v<T>) {
        double number{};
        if (!value.GetInto(number) || !std::isfinite(number) ||
            std::abs(number) > std::numeric_limits<T>::max()) {
          return false;
        }
      }
      if (!value.GetInto(converted)) {
        return false;
      }
      if constexpr (std::is_floating_point_v<T>) {
        if (!std::isfinite(converted)) {
          return false;
        }
      }
    }
    const bool success = native_.Set(ptr, Rml::Variant(converted));
    if (success) {
      State().data_diagnostics.Record(&DataDiagnostics::scalar_writes);
    }
    return success;
  }

 private:
  Rml::ScalarDefinition<T> native_;
};

// Real enum storage, with underlying-width guards before any native cast.
// Reading through T also preserves unsigned 64-bit values which upstream's
// generic enum-to-Variant conversion would narrow into signed INT64.
template <typename T>
class CheckedDataEnum final : public Rml::VariableDefinition {
 public:
  enum class Value : T {};
  CheckedDataEnum() : VariableDefinition(Rml::DataVariableType::Scalar) {}
  bool Get(void* ptr, Rml::Variant& value) override {
    T stored = static_cast<T>(*static_cast<Value*>(ptr));
    return underlying_.Get(&stored, value);
  }
  bool Set(void* ptr, const Rml::Variant& value) override {
    T converted{};
    if (!ReadInteger(value, &converted)) {
      return false;
    }
    *static_cast<Value*>(ptr) = static_cast<Value>(converted);
    State().data_diagnostics.Record(&DataDiagnostics::scalar_writes);
    return true;
  }

 private:
  CheckedDataScalar<T> underlying_;
};

class DynamicDataStruct final : public Rml::VariableDefinition {
 public:
  explicit DynamicDataStruct(DataSchemaState* schema)
      : VariableDefinition(Rml::DataVariableType::Struct), schema_(schema) {}
  Rml::DataVariable Child(void* ptr,
                          const Rml::DataAddressEntry& address) override {
    auto* node = static_cast<DataStorageNode*>(ptr);
    for (size_t i = 0; i < schema_->members.size(); ++i) {
      if (schema_->members[i].first == address.name) {
        const auto accessor = schema_->accessors.find(address.name);
        if (accessor != schema_->accessors.end()) {
          return {accessor->second.definition.get(), node};
        }
        return i < node->children.size() ? node->children[i]->Variable()
                                         : Rml::DataVariable{};
      }
    }
    return {};
  }
  Rml::StringList ReflectMemberNames() override {
    Rml::StringList result;
    for (const auto& [name, schema] : schema_->members) {
      result.push_back(name);
    }
    return result;
  }

 private:
  DataSchemaState* schema_;
};

class DynamicDataArray final : public Rml::VariableDefinition {
 public:
  explicit DynamicDataArray(DataSchemaState* schema)
      : VariableDefinition(Rml::DataVariableType::Array), schema_(schema) {}
  int Size(void* ptr) override {
    return static_cast<int>(static_cast<DataStorageNode*>(ptr)->count);
  }
  Rml::DataVariable Child(void* ptr,
                          const Rml::DataAddressEntry& address) override {
    auto* node = static_cast<DataStorageNode*>(ptr);
    if (address.index < 0 ||
        static_cast<size_t>(address.index) >= node->count) {
      return address.name == "size"
                 ? Rml::MakeLiteralIntVariable(static_cast<int>(node->count))
                 : Rml::DataVariable{};
    }
    if (node->backing) {
      auto* bytes = static_cast<std::byte*>(node->backing->Data());
      return {schema_->underlying->definition,
              bytes + address.index * schema_->underlying->width};
    }
    return node->children[address.index]->Variable();
  }

 private:
  DataSchemaState* schema_;
};

// Unlike upstream's BasePointerDefinition, every operation checks the
// dereferenced target before forwarding to the underlying definition.
class ManagedDataReference final : public Rml::VariableDefinition {
 public:
  explicit ManagedDataReference(DataSchemaState* schema)
      : VariableDefinition(schema->underlying->type), schema_(schema) {}
  bool Get(void* ptr, Rml::Variant& value) override {
    auto* node = static_cast<DataStorageNode*>(ptr);
    if (!node->reference_bound) {
      value = Rml::Variant{};
      return true;
    }
    auto target = DataReferenceVariable(node);
    return target && target.Get(value);
  }
  bool Set(void* ptr, const Rml::Variant& value) override {
    auto* node = static_cast<DataStorageNode*>(ptr);
    auto target = DataReferenceVariable(node);
    return target &&
           SetDataVariableValue(node->reference_model.lock(), target, value);
  }
  int Size(void* ptr) override {
    auto target = DataReferenceVariable(static_cast<DataStorageNode*>(ptr));
    return target ? target.Size() : 0;
  }
  Rml::DataVariable Child(void* ptr,
                          const Rml::DataAddressEntry& address) override {
    auto target = DataReferenceVariable(static_cast<DataStorageNode*>(ptr));
    return target ? target.Child(address) : Rml::DataVariable{};
  }
  Rml::StringList ReflectMemberNames() override {
    if (schema_->borrowed_scalar_definition) {
      return {};
    }
    return schema_->underlying->definition->ReflectMemberNames();
  }

 private:
  DataSchemaState* schema_;
};

bool ReadName(v8::Local<v8::Value> value, Rml::String* name) {
  if (!value->IsString()) {
    Nan::ThrowTypeError("Expected a data schema name");
    return false;
  }
  Nan::Utf8String text(value);
  name->assign(*text, text.length());
  return true;
}

template <typename T>
void ScalarSchema(DataSchemaState* schema,
                  DataScalarKind kind,
                  Rml::UniquePtr<Rml::VariableDefinition>* definition) {
  schema->scalar = kind;
  schema->width = sizeof(T);
  if constexpr (std::is_integral_v<T> && !std::is_same_v<T, bool>) {
    if (schema->enumeration) {
      *definition = Rml::MakeUnique<CheckedDataEnum<T>>();
      return;
    }
  }
  *definition = Rml::MakeUnique<CheckedDataScalar<T>>();
}

std::shared_ptr<DataSchemaState> NewSchema(
    const std::shared_ptr<DataRegisterState>& owner,
    const Rml::String& name,
    std::optional<Rml::FamilyId> family = std::nullopt) {
  auto schema = std::make_shared<DataSchemaState>();
  schema->owner = owner;
  schema->name = name;
  schema->family = family ? *family : DynamicDataFamily::Allocate();
  return schema;
}

bool RegisterSchema(const std::shared_ptr<DataRegisterState>& owner,
                    const std::shared_ptr<DataSchemaState>& schema,
                    Rml::UniquePtr<Rml::VariableDefinition> definition) {
  auto* pointer = definition.get();
  if (!owner->value->RegisterDefinition(schema->family,
                                        std::move(definition))) {
    return false;
  }
  schema->definition = pointer;
  owner->schemas.emplace(schema->name, schema);
  return true;
}

NAN_METHOD(CreateRegister) {
  auto owner = std::make_shared<DataRegisterState>();
  owner->owned = std::make_unique<Rml::DataTypeRegister>();
  owner->value = owner->owned.get();
  owner->callbacks = std::make_shared<DataCallbacks>();
  owner->generation = State().generation;
  State().data_registers.push_back(owner);
  info.GetReturnValue().Set(WrapDataRegister(owner));
}

void RegisterScalarFor(const Nan::FunctionCallbackInfo<v8::Value>& info,
                       bool enumeration) {
  Rml::String name;
  Rml::String kind;
  if (!ReadName(info[1], &name) || !ReadName(info[2], &kind)) {
    return;
  }
  auto owner = DataRegisterOf(info[0]);
  if (!owner) {
    return;
  }
  if (owner->schemas.contains(name)) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  auto schema = NewSchema(owner, name);
  schema->enumeration = enumeration;
  if (enumeration && (kind == "bool" || kind == "string" || kind == "float32" ||
                      kind == "float64")) {
    return Nan::ThrowTypeError("Enum storage requires an integer kind");
  }
  Rml::UniquePtr<Rml::VariableDefinition> definition;
  if (kind == "bool") {
    ScalarSchema<bool>(schema.get(), DataScalarKind::kBoolean, &definition);
    // A Uint8Array may write invalid native bool representations. Keep bool
    // arrays behind checked element writes instead of exposing raw bool bytes.
    schema->width = 0;
  } else if (kind == "int8") {
    ScalarSchema<int8_t>(schema.get(), DataScalarKind::kInt8, &definition);
  } else if (kind == "uint8") {
    ScalarSchema<uint8_t>(schema.get(), DataScalarKind::kUint8, &definition);
  } else if (kind == "int16") {
    ScalarSchema<int16_t>(schema.get(), DataScalarKind::kInt16, &definition);
  } else if (kind == "uint16") {
    ScalarSchema<uint16_t>(schema.get(), DataScalarKind::kUint16, &definition);
  } else if (kind == "int32") {
    ScalarSchema<int32_t>(schema.get(), DataScalarKind::kInt32, &definition);
  } else if (kind == "uint32") {
    ScalarSchema<uint32_t>(schema.get(), DataScalarKind::kUint32, &definition);
  } else if (kind == "int64") {
    ScalarSchema<int64_t>(schema.get(), DataScalarKind::kInt64, &definition);
  } else if (kind == "uint64") {
    ScalarSchema<uint64_t>(schema.get(), DataScalarKind::kUint64, &definition);
  } else if (kind == "float32") {
    ScalarSchema<float>(schema.get(), DataScalarKind::kFloat32, &definition);
  } else if (kind == "float64") {
    ScalarSchema<double>(schema.get(), DataScalarKind::kFloat64, &definition);
  } else if (kind == "string") {
    ScalarSchema<Rml::String>(
        schema.get(), DataScalarKind::kString, &definition);
    schema->width = 0;
  } else {
    return Nan::ThrowTypeError("Unknown native data scalar kind");
  }
  RegisterSchema(owner, schema, std::move(definition));
  info.GetReturnValue().Set(WrapDataSchema(schema));
}

NAN_METHOD(RegisterScalar) {
  RegisterScalarFor(info, false);
}

NAN_METHOD(RegisterEnum) {
  RegisterScalarFor(info, true);
}

NAN_METHOD(RegisterCustom) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  if (!info[2]->IsInt32()) {
    return Nan::ThrowTypeError("Expected a custom data type category");
  }
  const int type = Nan::To<int>(info[2]).FromJust();
  if (type < 0 || type > 2 || !info[3]->IsArray()) {
    return Nan::ThrowTypeError("Expected a custom data type category");
  }
  std::array<v8::Local<v8::Value>, 5> callbacks;
  for (uint32_t i = 0; i < callbacks.size(); ++i) {
    if (!Nan::Get(info[3].As<v8::Array>(), i).ToLocal(&callbacks[i])) {
      return;
    }
    if (!callbacks[i]->IsUndefined() && !callbacks[i]->IsFunction()) {
      return Nan::ThrowTypeError("Expected a custom data callback function");
    }
  }
  // Snapshot callback accessors before accepting a borrowed register lease.
  auto owner = DataRegisterOf(info[0]);
  if (!owner) {
    return;
  }
  if (owner->schemas.contains(name)) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  std::optional<Rml::FamilyId> family;
  if (!info[4]->IsUndefined()) {
    if (!info[4]->IsInt32() || Nan::To<int>(info[4]).FromJust() < 0) {
      return Nan::ThrowTypeError("Expected an allocated integer family id");
    }
    family = static_cast<Rml::FamilyId>(Nan::To<int>(info[4]).FromJust());
    if (!DynamicDataFamily::IsAllocated(*family)) {
      return Nan::ThrowError("Data family identity is not from this runtime");
    }
  }
  auto schema = NewSchema(owner, name, family);
  schema->type = static_cast<Rml::DataVariableType>(type);
  schema->custom = true;
  // Native insertion consumes the unique definition even when rejected.
  // Do not retain any host callbacks until the actual family id is accepted.
  if (!RegisterSchema(owner, schema, MakeCustomDataDefinition(schema.get()))) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  for (uint32_t i = 0; i < callbacks.size(); ++i) {
    schema->custom_callbacks[i] =
        AddDataCallback(owner->callbacks, callbacks[i]);
  }
  info.GetReturnValue().Set(WrapDataSchema(schema));
}

NAN_METHOD(CreateFamilyId) {
  if (DataRegisterOf(info[0])) {
    info.GetReturnValue().Set(static_cast<int>(DynamicDataFamily::Allocate()));
  }
}

NAN_METHOD(RegisterStruct) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  auto owner = DataRegisterOf(info[0]);
  if (!owner) {
    return;
  }
  if (owner->schemas.contains(name)) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  auto schema = NewSchema(owner, name);
  schema->type = Rml::DataVariableType::Struct;
  RegisterSchema(
      owner, schema, Rml::MakeUnique<DynamicDataStruct>(schema.get()));
  info.GetReturnValue().Set(WrapDataSchema(schema));
}

NAN_METHOD(CreateStructHandle) {
  const auto owner = DataRegisterOf(info[0]);
  if (!owner) {
    return;
  }
  const auto schema = DataSchemaOf(info[1]);
  if (!schema) {
    return;
  }
  if (schema->owner.lock() != owner) {
    return Nan::ThrowTypeError(
        "Struct schema belongs to another type register");
  }
  if (schema->type != Rml::DataVariableType::Struct || schema->reference ||
      schema->custom) {
    return Nan::ThrowTypeError("Expected a registered struct data schema");
  }
  // Return the existing schema lease: its private register edge owns the
  // definition. A struct handle does not allocate or copy native storage.
  info.GetReturnValue().Set(WrapDataSchema(schema));
}

NAN_METHOD(RegisterArray) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  auto owner = DataRegisterOf(info[0]);
  auto underlying = DataSchemaOf(info[2]);
  if (!owner || !underlying) {
    return;
  }
  if (underlying->owner.lock() != owner) {
    return Nan::ThrowTypeError("Array schema belongs to another type register");
  }
  if (owner->schemas.contains(name)) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  auto schema = NewSchema(owner, name);
  schema->type = Rml::DataVariableType::Array;
  schema->underlying = underlying.get();
  RegisterSchema(
      owner, schema, Rml::MakeUnique<DynamicDataArray>(schema.get()));
  info.GetReturnValue().Set(WrapDataSchema(schema));
}

NAN_METHOD(RegisterMember) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  for (int i = 3; i < 5; ++i) {
    if (!info[i]->IsUndefined() && !info[i]->IsFunction()) {
      return Nan::ThrowTypeError("Expected a member callback function");
    }
  }
  auto schema = DataSchemaOf(info[0]);
  auto member = DataSchemaOf(info[2]);
  if (!schema || !member) {
    return;
  }
  if (schema->owner.lock() != member->owner.lock()) {
    return Nan::ThrowTypeError(
        "Member schema belongs to another type register");
  }
  if (schema->type != Rml::DataVariableType::Struct || schema->custom ||
      schema->reference) {
    return Nan::ThrowTypeError("Members require a struct data schema");
  }
  for (const auto& [existing, type] : schema->members) {
    if (existing == name) {
      info.GetReturnValue().Set(false);
      return;
    }
  }
  if (schema->frozen) {
    return Nan::ThrowError("Data schema is frozen after storage creation");
  }
  if (info[3]->IsFunction() || info[4]->IsFunction()) {
    const bool reference =
        member->reference || member->type != Rml::DataVariableType::Scalar;
    if (reference && info[4]->IsFunction()) {
      return Nan::ThrowTypeError("Member setters require scalar value types");
    }
    auto& accessor = schema->accessors[name];
    accessor.schema = member.get();
    accessor.reference = reference;
    const auto callbacks = schema->owner.lock()->callbacks;
    accessor.get_callback = AddDataCallback(callbacks, info[3]);
    accessor.set_callback = AddDataCallback(callbacks, info[4]);
    accessor.definition = MakeDataMemberDefinition(&accessor);
  }
  schema->members.emplace_back(name, member.get());
  info.GetReturnValue().Set(true);
}

NAN_METHOD(BindAlias) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  auto model = DataModelOf(info[0]);
  if (!model) {
    return;
  }
  Rml::DataVariable target;
  auto target_owner =
      CheckedDataTarget(info[2], model->type_register, nullptr, &target);
  if (!target_owner || !DataModelOf(info[0])) {
    return;
  }
  // Core's literal definition is static and stores its integer in the pointer
  // bits. Copying this value needs no target context or mutable storage lease.
  if (!target_owner->model && !target_owner->owned_storage) {
    info.GetReturnValue().Set(
        model->constructor.BindCustomDataVariable(name, target));
    return;
  }
  auto underlying = NewSchema(model->type_register, "");
  underlying->type = target.Type();
  underlying->definition =
      Rml::Detail::DataVariableAccessor::GetDefinition(target);
  auto schema = NewSchema(model->type_register, "");
  schema->type = underlying->type;
  schema->reference = true;
  schema->underlying = underlying.get();
  const auto known_definition = [&](const auto& registered) {
    if (registered->definition == underlying->definition) {
      return true;
    }
    return std::any_of(registered->accessors.begin(),
                       registered->accessors.end(),
                       [&](const auto& member) {
                         return member.second.definition.get() ==
                                underlying->definition;
                       });
  };
  // Custom scalar reflection must still call its registered native adapter.
  // Only unregistered scalar definitions (notably model FuncDefinition)
  // have empty native reflection without a register-owned lifetime.
  schema->borrowed_scalar_definition =
      schema->type == Rml::DataVariableType::Scalar &&
      std::none_of(
          model->type_register->schemas.begin(),
          model->type_register->schemas.end(),
          [&](const auto& entry) { return known_definition(entry.second); }) &&
      std::none_of(model->type_register->private_schemas.begin(),
                   model->type_register->private_schemas.end(),
                   known_definition);
  underlying->borrowed_scalar_definition = schema->borrowed_scalar_definition;
  auto definition = Rml::MakeUnique<ManagedDataReference>(schema.get());
  schema->definition = definition.get();
  auto storage = std::make_shared<DataStorageNode>();
  storage->schema = schema.get();
  if (!ReadDataReference(storage.get(), info[2]) || !DataModelOf(info[0])) {
    return;
  }
  const bool bound =
      model->constructor.BindCustomDataVariable(name, storage->Variable());
  if (bound) {
    model->type_register->value->RegisterDefinition(schema->family,
                                                    std::move(definition));
    model->type_register->private_schemas.push_back(std::move(underlying));
    model->type_register->private_schemas.push_back(std::move(schema));
    AddDataCallback(model->callbacks, DataStorageEdges(storage.get()));
    AttachDataStorage(storage.get(), model, {{name}});
    model->storage.emplace(name, std::move(storage));
  }
  info.GetReturnValue().Set(bound);
}

NAN_METHOD(RegisterReference) {
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  auto owner = DataRegisterOf(info[0]);
  auto underlying = DataSchemaOf(info[2]);
  if (!owner || !underlying) {
    return;
  }
  if (underlying->owner.lock() != owner) {
    return Nan::ThrowTypeError(
        "Reference schema belongs to another type register");
  }
  // DataTypeRegister::GetDefinition<T> statically rejects pointer-to-pointer
  // types in Core 6.3. Preserve the same contract for runtime-named schemas.
  if (underlying->reference) {
    return Nan::ThrowTypeError("Recursive reference types are not supported");
  }
  if (owner->schemas.contains(name)) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  auto schema = NewSchema(owner, name);
  schema->type = underlying->type;
  schema->underlying = underlying.get();
  schema->reference = true;
  RegisterSchema(
      owner, schema, Rml::MakeUnique<ManagedDataReference>(schema.get()));
  info.GetReturnValue().Set(WrapDataSchema(schema));
}

NAN_METHOD(GetDefinition) {
  if (info[1]->IsNumber()) {
    if (!info[1]->IsInt32() || Nan::To<int>(info[1]).FromJust() < 0) {
      return Nan::ThrowTypeError("Expected an integer family identity");
    }
    const auto family =
        static_cast<Rml::FamilyId>(Nan::To<int>(info[1]).FromJust());
    const auto owner = DataRegisterOf(info[0]);
    if (!owner) {
      return;
    }
    for (const auto& [name, schema] : owner->schemas) {
      if (schema->family == family) {
        info.GetReturnValue().Set(WrapDataSchema(schema));
        return;
      }
    }
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  Rml::String name;
  if (!ReadName(info[1], &name)) {
    return;
  }
  auto owner = DataRegisterOf(info[0]);
  if (!owner) {
    return;
  }
  auto found = owner->schemas.find(name);
  info.GetReturnValue().Set(
      found == owner->schemas.end()
          ? v8::Local<v8::Value>(Nan::Null())
          : v8::Local<v8::Value>(WrapDataSchema(found->second)));
}

NAN_METHOD(RegisterValid) {
  auto* handle = DataRegisterNativeHandle::TryFrom(info[0]);
  if (!handle) {
    return Nan::ThrowTypeError("Expected a data type register");
  }
  info.GetReturnValue().Set(DataRegisterIsValid(handle->owner()));
}

NAN_METHOD(SchemaValid) {
  auto* handle = DataSchemaNativeHandle::TryFrom(info[0]);
  if (!handle) {
    return Nan::ThrowTypeError("Expected a data schema");
  }
  auto owner = handle->owner()->owner.lock();
  info.GetReturnValue().Set(owner && DataRegisterIsValid(owner));
}

NAN_METHOD(SchemaFamily) {
  if (auto schema = DataSchemaOf(info[0])) {
    info.GetReturnValue().Set(static_cast<int>(schema->family));
  }
}

NAN_METHOD(SchemaType) {
  if (auto schema = DataSchemaOf(info[0])) {
    info.GetReturnValue().Set(static_cast<int>(schema->type));
  }
}

NAN_METHOD(SchemaReference) {
  if (auto schema = DataSchemaOf(info[0])) {
    info.GetReturnValue().Set(schema->reference);
  }
}

NAN_METHOD(SchemaEnum) {
  if (auto schema = DataSchemaOf(info[0])) {
    info.GetReturnValue().Set(schema->enumeration);
  }
}

NAN_METHOD(SchemaCustom) {
  if (auto schema = DataSchemaOf(info[0])) {
    info.GetReturnValue().Set(schema->custom);
  }
}

NAN_METHOD(SchemaUnderlying) {
  const auto schema = DataSchemaOf(info[0]);
  if (!schema) {
    return;
  }
  if (!schema->underlying) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  const auto owner = schema->owner.lock();
  for (const auto& [name, candidate] : owner->schemas) {
    if (candidate.get() == schema->underlying) {
      info.GetReturnValue().Set(WrapDataSchema(candidate));
      return;
    }
  }
  for (const auto& candidate : owner->private_schemas) {
    if (candidate.get() == schema->underlying) {
      info.GetReturnValue().Set(WrapDataSchema(candidate));
      return;
    }
  }
  Nan::ThrowError("RmlUi underlying data definition is no longer valid");
}

}  // namespace

std::shared_ptr<DataSchemaState> DataSchemaOf(v8::Local<v8::Value> value) {
  auto* handle = DataSchemaNativeHandle::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a data schema");
    return {};
  }
  auto schema = handle->owner();
  auto owner = schema->owner.lock();
  if (!owner || !DataRegisterIsValid(owner)) {
    Nan::ThrowError("RmlUi data schema is no longer valid");
    return {};
  }
  return schema;
}

v8::Local<v8::Object> WrapDataSchema(
    const std::shared_ptr<DataSchemaState>& owner) {
  if (!owner->handle.IsEmpty()) {
    return owner->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = DataSchemaNativeHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  Nan::SetPrivate(handle,
                  Nan::New("rml.data.register").ToLocalChecked(),
                  WrapDataRegister(owner->owner.lock()))
      .FromJust();
  return handle;
}

NAN_MODULE_INIT(InitializeRmlDataRegister) {
  SetRuntimeMethod<CreateRegister>(target, "createDataTypeRegister");
  SetRuntimeMethod<RegisterScalar>(target, "dataRegisterScalar");
  SetRuntimeMethod<RegisterEnum>(target, "dataRegisterEnum");
  SetRuntimeMethod<RegisterCustom>(target, "dataRegisterCustom");
  SetRuntimeMethod<CreateFamilyId>(target, "dataRegisterCreateFamilyId");
  SetRuntimeMethod<RegisterStruct>(target, "dataRegisterStruct");
  SetRuntimeMethod<CreateStructHandle>(target, "dataCreateStructHandle");
  SetRuntimeMethod<RegisterArray>(target, "dataRegisterArray");
  SetRuntimeMethod<RegisterReference>(target, "dataRegisterReference");
  SetRuntimeMethod<RegisterMember>(target, "dataRegisterMember");
  SetRuntimeMethod<BindAlias>(target, "dataModelBindAlias");
  SetRuntimeMethod<GetDefinition, true>(target, "dataRegisterGetDefinition");
  SetRuntimeMethod<RegisterValid, true, false>(target, "dataRegisterIsValid");
  SetRuntimeMethod<SchemaValid, true, false>(target, "dataSchemaIsValid");
  SetRuntimeMethod<SchemaFamily, true>(target, "dataSchemaFamily");
  SetRuntimeMethod<SchemaType, true>(target, "dataSchemaType");
  SetRuntimeMethod<SchemaReference, true>(target, "dataSchemaIsReference");
  SetRuntimeMethod<SchemaEnum, true>(target, "dataSchemaIsEnum");
  SetRuntimeMethod<SchemaCustom, true>(target, "dataSchemaIsCustom");
  SetRuntimeMethod<SchemaUnderlying, true, false>(target,
                                                  "dataSchemaUnderlying");
}

}  // namespace sfmlrmlui
