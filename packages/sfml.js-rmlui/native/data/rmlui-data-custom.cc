// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <limits>
#include <memory>

#include "native/data/rmlui-data-schema.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

enum CustomCallback : size_t { kGet, kSet, kSize, kChild, kReflect };

bool ReadBoolean(v8::Local<v8::Value> input, bool* result) {
  if (!input->IsBoolean()) {
    Nan::ThrowTypeError("Custom data result must be a boolean");
    return false;
  }
  *result = input->IsTrue();
  return true;
}

bool InvokeCustom(DataSchemaState* schema,
                  CustomCallback callback,
                  int argc,
                  v8::Local<v8::Value>* argv,
                  const std::function<bool(v8::Local<v8::Value>)>& consume) {
  const auto owner = schema->owner.lock();
  return owner && DataRegisterIsValid(owner) &&
         InvokeDataCallback(owner->callbacks,
                            schema->custom_callbacks[callback],
                            argc,
                            argv,
                            consume);
}

v8::Local<v8::Value> Payload(DataStorageNode* node) {
  return Nan::Get(DataStorageEdges(node), 0).ToLocalChecked();
}

class CustomDataDefinition final : public Rml::VariableDefinition {
 public:
  explicit CustomDataDefinition(DataSchemaState* schema)
      : VariableDefinition(schema->type), schema_(schema) {}

  bool Get(void* ptr, Rml::Variant& value) override {
    Nan::HandleScope handles;
    v8::Local<v8::Value> argument = Payload(static_cast<DataStorageNode*>(ptr));
    bool accepted = false;
    const bool invoked = InvokeCustom(
        schema_, kGet, 1, &argument, [&](v8::Local<v8::Value> result) {
          if (!result->IsObject()) {
            Nan::ThrowTypeError("Expected a custom data get result");
            return false;
          }
          v8::Local<v8::Value> success;
          if (!Nan::Get(result.As<v8::Object>(),
                        Nan::New("success").ToLocalChecked())
                   .ToLocal(&success) ||
              !ReadBoolean(success, &accepted)) {
            return false;
          }
          if (!accepted) {
            return true;
          }
          v8::Local<v8::Value> input;
          return Nan::Get(result.As<v8::Object>(),
                          Nan::New("value").ToLocalChecked())
                     .ToLocal(&input) &&
                 ReadOwnedDataVariant(input, &value);
        });
    return invoked && accepted;
  }

  bool Set(void* ptr, const Rml::Variant& value) override {
    Nan::HandleScope handles;
    v8::Local<v8::Value> argv[] = {Payload(static_cast<DataStorageNode*>(ptr)),
                                   Nan::Undefined()};
    if (!VariantToJs(value).ToLocal(&argv[1])) {
      return false;
    }
    bool accepted = false;
    const bool invoked =
        InvokeCustom(schema_, kSet, 2, argv, [&](v8::Local<v8::Value> result) {
          return ReadBoolean(result, &accepted);
        });
    return invoked && accepted;
  }

  int Size(void* ptr) override {
    Nan::HandleScope handles;
    v8::Local<v8::Value> argument = Payload(static_cast<DataStorageNode*>(ptr));
    int size = 0;
    InvokeCustom(
        schema_, kSize, 1, &argument, [&](v8::Local<v8::Value> result) {
          if (!result->IsInt32() || Nan::To<int>(result).FromJust() < 0) {
            Nan::ThrowRangeError("Custom data size must be a nonnegative int");
            return false;
          }
          size = Nan::To<int>(result).FromJust();
          return true;
        });
    return size;
  }

  Rml::DataVariable Child(void* ptr,
                          const Rml::DataAddressEntry& address) override {
    Rml::DataVariable variable;
    CustomDataChild(static_cast<DataStorageNode*>(ptr), address, &variable);
    return variable;
  }

  Rml::StringList ReflectMemberNames() override {
    Rml::StringList names;
    InvokeCustom(
        schema_, kReflect, 0, nullptr, [&](v8::Local<v8::Value> result) {
          if (!result->IsArray()) {
            Nan::ThrowTypeError("Expected custom data member names");
            return false;
          }
          auto values = result.As<v8::Array>();
          for (uint32_t i = 0; i < values->Length(); ++i) {
            v8::Local<v8::Value> name;
            if (!Nan::Get(values, i).ToLocal(&name)) {
              return false;
            }
            if (!name->IsString()) {
              Nan::ThrowTypeError("Expected a member name string");
              return false;
            }
            Nan::Utf8String text(name);
            names.emplace_back(*text, text.length());
          }
          return true;
        });
    return names;
  }

 private:
  DataSchemaState* schema_;
};

}  // namespace

Rml::UniquePtr<Rml::VariableDefinition> MakeCustomDataDefinition(
    DataSchemaState* schema) {
  return Rml::MakeUnique<CustomDataDefinition>(schema);
}

std::shared_ptr<DataVariableState> CustomDataChild(
    DataStorageNode* node,
    const Rml::DataAddressEntry& address,
    Rml::DataVariable* variable) {
  Nan::HandleScope handles;
  std::shared_ptr<DataVariableState> owner;
  v8::Local<v8::Value> argv[] = {
      Payload(node),
      address.index < 0
          ? v8::Local<v8::Value>(Nan::New(address.name).ToLocalChecked())
          : v8::Local<v8::Value>(Nan::New(address.index))};
  const bool invoked = InvokeCustom(
      node->schema, kChild, 2, argv, [&](v8::Local<v8::Value> result) {
        if (result->IsNull()) {
          return true;
        }
        owner = CheckedDataTarget(
            result, node->schema->owner.lock(), nullptr, variable);
        return static_cast<bool>(owner);
      });
  if (!invoked) {
    *variable = {};
    return {};
  }
  return owner;
}

}  // namespace sfmlrmlui
