// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/DataModelHandle.h>
#include <RmlUi/Core/DataStructHandle.h>
#include <RmlUi/Core/DataTypeRegister.h>
#include <RmlUi/Core/DataVariable.h>
#include <RmlUi/Core/Event.h>

#include <array>
#include <cassert>
#include <iostream>
#include <list>
#include <memory>
#include <type_traits>
#include <vector>

#include "vendor/rmlui/Source/Core/DataModel.h"

namespace {

struct Payload {
  int value{0};
};

// Exact upstream DataTypeGetFunc/DataTypeSetFunc reference signatures.
void GetPayload(const Payload& payload,
                Rml::Variant& output) {  // NOLINT(runtime/references)
  output = payload.value;
}

void SetPayload(Payload& payload,  // NOLINT(runtime/references)
                const Rml::Variant& input) {
  payload.value = input.Get<int>();
}

struct Record {
  int raw{3};
  std::vector<int> items{1, 2};
  int events{0};

  int GetValue() { return raw; }
  int& GetReference() { return raw; }
  int* GetPointer() { return &raw; }
  std::vector<int>& GetItems() { return items; }
  void SetValue(int value) { raw = value; }
  void GetVariant(Rml::Variant& output) {  // NOLINT(runtime/references)
    output = raw;
  }
  void SetVariant(const Rml::Variant& input) { raw = input.Get<int>(); }
  void OnEvent(Rml::DataModelHandle model,
               Rml::Event&,
               const Rml::VariantList& args) {
    events += args.front().Get<int>();
    model.DirtyVariable("record");
  }
};

class CustomDefinition final : public Rml::VariableDefinition {
 public:
  explicit CustomDefinition(int* destroyed)
      : VariableDefinition(Rml::DataVariableType::Scalar),
        destroyed_(destroyed) {}
  ~CustomDefinition() override { ++*destroyed_; }

  bool Get(void* ptr, Rml::Variant& output) override {
    output = static_cast<Payload*>(ptr)->value;
    return true;
  }
  bool Set(void* ptr, const Rml::Variant& input) override {
    return input.GetInto(static_cast<Payload*>(ptr)->value);
  }

 private:
  int* destroyed_;
};

class DefaultDefinition final : public Rml::VariableDefinition {
 public:
  DefaultDefinition() : VariableDefinition(Rml::DataVariableType::Scalar) {}
};

int Read(Rml::DataVariable variable) {
  Rml::Variant output;
  assert(variable);
  assert(variable.Get(output));
  return output.Get<int>();
}

void CheckScalarAndFunctions() {
  static_assert(Rml::is_builtin_data_scalar_v<int>);
  static_assert(Rml::is_builtin_data_scalar_v<Rml::String>);
  static_assert(!Rml::is_builtin_data_scalar_v<Payload>);
  static_assert(Rml::IsVoidMemberFunc<Rml::VoidMemberFunc>);
  static_assert(!Rml::IsVoidMemberFunc<int>);
  Rml::DataVariable invalid;
  assert(!invalid);

  Rml::ScalarDefinition<int> definition;
  int value = 3;
  Rml::DataVariable variable(&definition, &value);
  assert(variable.Type() == Rml::DataVariableType::Scalar);
  assert(Rml::Detail::DataVariableAccessor::GetDefinition(variable) ==
         &definition);
  assert(Read(variable) == 3);
  assert(variable.Set(Rml::Variant("7")));
  assert(value == 7);

  Payload payload{9};
  Rml::ScalarFuncDefinition<Payload> functions(GetPayload, SetPayload);
  Rml::DataVariable custom(&functions, &payload);
  assert(Read(custom) == 9);
  assert(custom.Set(Rml::Variant(10)));
  assert(payload.value == 10);
  Rml::ScalarFuncDefinition<Payload> readonly(GetPayload, nullptr);
  assert(!readonly.Set(&payload, Rml::Variant(11)));
  Rml::ScalarFuncDefinition<Payload> writeonly(nullptr, SetPayload);
  Rml::Variant output;
  assert(!writeonly.Get(&payload, output));

  DefaultDefinition defaults;
  assert(!defaults.Get(&value, output));
  assert(!defaults.Set(&value, Rml::Variant(1)));
  assert(defaults.Size(&value) == 0);
  assert(!defaults.Child(&value, Rml::DataAddressEntry(0)));
  assert(defaults.ReflectMemberNames().empty());
  std::cout << "PASS native scalar/default/function definitions\n";
}

void CheckMembersAndPointers() {
  Rml::DataTypeRegister types;
  auto definition = Rml::MakeUnique<Rml::StructDefinition>();
  auto* struct_definition = definition.get();
  assert(types.RegisterDefinition(Rml::Family<Record>::Id(),
                                  std::move(definition)));
  Rml::StructHandle<Record> members(&types, struct_definition);
  Rml::StructHandle<Record> invalid(nullptr, nullptr);
  assert(members);
  assert(!invalid);
  assert(members.RegisterMember("raw", &Record::raw));
  assert(members.RegisterMember("value", &Record::GetValue));
  assert(members.RegisterMember("reference", &Record::GetReference));
  assert(members.RegisterMember("pointer", &Record::GetPointer));
  assert(members.RegisterMember("pair", &Record::GetValue, &Record::SetValue));
  // The explicit definition supports absent getters. StructHandle's public
  // overload requires a getter function pointer, so instantiate the definition.
  using WriteOnly = Rml::MemberScalarGetSetFuncDefinition<Record,
                                                          Rml::VoidMemberFunc,
                                                          void(int),
                                                          int>;
  struct_definition->AddMember(
      "writeonly",
      Rml::MakeUnique<WriteOnly>(
          types.GetDefinition<int>(), nullptr, &Record::SetValue));

  Record record;
  Rml::DataVariable variable(struct_definition, &record);
  for (const char* name : {"raw", "value", "reference", "pointer", "pair"}) {
    assert(Read(variable.Child(Rml::DataAddressEntry(name))) == 3);
  }
  assert(variable.Child(Rml::DataAddressEntry("pair")).Set(Rml::Variant(8)));
  assert(record.raw == 8);
  assert(!variable.Child(Rml::DataAddressEntry("value")).Set(Rml::Variant(9)));
  assert(
      variable.Child(Rml::DataAddressEntry("reference")).Set(Rml::Variant(10)));
  assert(record.raw == 10);
  Rml::Variant output;
  assert(!variable.Child(Rml::DataAddressEntry("writeonly")).Get(output));
  assert(
      variable.Child(Rml::DataAddressEntry("writeonly")).Set(Rml::Variant(12)));
  assert(record.raw == 12);
  assert(struct_definition->ReflectMemberNames().size() == 6);

  Rml::MemberGetFunc<Record> get = &Record::GetVariant;
  Rml::MemberSetFunc<Record> set = &Record::SetVariant;
  (record.*get)(output);
  assert(output.Get<int>() == 12);
  (record.*set)(Rml::Variant(13));
  Rml::MemberGetterFunc<Record, int> getter = &Record::GetValue;
  Rml::MemberSetterFunc<Record, int> setter = &Record::SetValue;
  (record.*setter)(14);
  assert((record.*getter)() == 14);

  int raw = 1;
  int* pointer = &raw;
  auto unique = std::make_unique<int>(2);
  auto shared = std::make_shared<int>(3);
  assert(Read({types.GetDefinition<int*>(), &pointer}) == 1);
  assert(Read({types.GetDefinition<Rml::UniquePtr<int>>(), &unique}) == 2);
  assert(Read({types.GetDefinition<Rml::SharedPtr<int>>(), &shared}) == 3);
  Rml::PointerDefinition<int*> explicit_pointer(types.GetDefinition<int>());
  Rml::DataVariable forwarded(&explicit_pointer, &pointer);
  assert(forwarded.Set(Rml::Variant(4)));
  assert(raw == 4);
  assert(forwarded.Size() == 0);
  assert(!forwarded.Child(Rml::DataAddressEntry("missing")));
  assert(explicit_pointer.ReflectMemberNames().empty());
  // BasePointerDefinition guards the outer storage address. A null pointee
  // is unsafe upstream; the JS adapter deliberately checks it before
  // forwarding.
  assert(!explicit_pointer.Get(nullptr, output));
  assert(!explicit_pointer.Set(nullptr, Rml::Variant(1)));
  assert(explicit_pointer.Size(nullptr) == 0);
  assert(!explicit_pointer.Child(nullptr, Rml::DataAddressEntry(0)));

  Rml::PointerDefinition<Record*> record_pointer(struct_definition);
  Record* record_address = &record;
  Rml::DataVariable record_reference(&record_pointer, &record_address);
  assert(record_pointer.ReflectMemberNames().size() == 6);
  assert(Read(record_reference.Child(Rml::DataAddressEntry("raw"))) == 14);
  assert(record_reference.Child(Rml::DataAddressEntry("raw"))
             .Set(Rml::Variant(15)));
  assert(record.raw == 15);
  std::cout << "PASS native member objects/value/reference/pointer/setters\n";
}

void CheckModelTemplates() {
  int destroyed = 0;
  {
    Rml::DataTypeRegister types;
    Rml::DataModel model(&types);
    Rml::DataModelConstructor constructor(&model);
    assert(constructor);
    assert(constructor.GetDataTypeRegister() == &types);
    assert(constructor.RegisterScalar<Payload>(GetPayload, SetPayload));
    Payload payload{3};
    assert(constructor.Bind("payload", &payload));
    assert(Read(model.GetVariable({Rml::DataAddressEntry("payload")})) == 3);
    assert(constructor.RegisterArray<std::vector<int>>());
    assert((constructor.RegisterArray<std::array<int, 2>>()));
    assert(constructor.RegisterArray<std::list<int>>());
    std::vector<int> vector{1, 2};
    std::array<int, 2> fixed{3, 4};
    std::list<int> list{5, 6};
    assert(constructor.Bind("vector", &vector));
    assert(constructor.Bind("fixed", &fixed));
    assert(constructor.Bind("list", &list));
    for (const char* name : {"vector", "fixed", "list"}) {
      auto variable = model.GetVariable({Rml::DataAddressEntry(name)});
      assert(variable.Size() == 2);
      assert(Read(variable.Child(Rml::DataAddressEntry("size"))) == 2);
      assert(variable.Child(Rml::DataAddressEntry(1)));
      assert(!variable.Child(Rml::DataAddressEntry(2)));
      assert(variable.Child(Rml::DataAddressEntry(1)).Set(Rml::Variant(9)));
      assert(Read(variable.Child(Rml::DataAddressEntry(1))) == 9);
    }
    Rml::ArrayDefinition<std::vector<int>> array(types.GetDefinition<int>());
    Rml::DataVariable direct_array(&array, &vector);
    assert(direct_array.Size() == 2);
    vector.push_back(10);
    assert(direct_array.Size() == 3);
    assert(Read(direct_array.Child(Rml::DataAddressEntry(2))) == 10);
    Rml::PointerDefinition<std::vector<int>*> pointer_array(&array);
    auto* vector_address = &vector;
    Rml::DataVariable indirect_array(&pointer_array, &vector_address);
    assert(indirect_array.Size() == 3);
    assert(Read(indirect_array.Child(Rml::DataAddressEntry("size"))) == 3);
    assert(Read(indirect_array.Child(Rml::DataAddressEntry(2))) == 10);
    auto members = constructor.RegisterStruct<Record>();
    assert(members);
    assert(members.RegisterMember("raw", &Record::raw));
    assert(members.RegisterMember("items", &Record::GetItems));
    Record record;
    assert(constructor.Bind("record", &record));
    auto variable = model.GetVariable({Rml::DataAddressEntry("record")});
    assert(variable.Child(Rml::DataAddressEntry("items")).Size() == 2);
    assert(constructor.BindCustomDataVariable("constant",
                                              Rml::MakeLiteralIntVariable(-7)));
    assert(Read(model.GetVariable({Rml::DataAddressEntry("constant")})) == -7);
    int current = 7;
    assert(constructor.BindFunc(
        "function",
        [&](Rml::Variant& result) { result = current; },
        [&](const Rml::Variant& input) { current = input.Get<int>(); }));
    auto function = model.GetVariable({Rml::DataAddressEntry("function")});
    assert(Read(function) == 7);
    assert(function.Set(Rml::Variant(9)));
    assert(current == 9);
    assert(constructor.BindEventCallback("event", &Record::OnEvent, &record));
    Rml::Event event;
    (*model.GetEventCallback("event"))(
        constructor.GetModelHandle(), event, {Rml::Variant(2)});
    assert(record.events == 2);
    assert(constructor.GetModelHandle().IsVariableDirty("record"));
    assert(
        Rml::Detail::DataModelConstructorAccessor::GetAllVariables(constructor)
            .size() == 7);

    struct Custom {};
    assert(constructor.RegisterCustomDataVariableDefinition<Custom>(
        Rml::MakeUnique<CustomDefinition>(&destroyed)));
    assert(!types.RegisterDefinition(
        Rml::Family<Custom>::Id(),
        Rml::MakeUnique<CustomDefinition>(&destroyed)));
    assert(destroyed == 1);
    auto* custom = types.GetDefinition<Custom>();
    assert(custom->Type() == Rml::DataVariableType::Scalar);
    assert(custom->Set(&payload, Rml::Variant(11)));
    assert(payload.value == 11);
  }
  assert(destroyed == 2);
  std::cout << "PASS native model binding/registration/containers/events\n";
}

}  // namespace

int main() {
  CheckScalarAndFunctions();
  CheckMembersAndPointers();
  CheckModelTemplates();
}
