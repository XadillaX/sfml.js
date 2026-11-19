// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/DecorationTypes.h>
#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/Event.h>
#include <RmlUi/Core/Property.h>
#include <RmlUi/Core/StyleSheetTypes.h>
#include <RmlUi/Core/SystemInterface.h>
#include <RmlUi/Core/Transform.h>
#include <nan.h>

#include <cassert>
#include <cstdint>
#include <iostream>
#include <type_traits>

namespace {

class ConsumerLog final : public Rml::SystemInterface {
 public:
  bool LogMessage(Rml::Log::Type type, const Rml::String& text) override {
    const bool expected =
        (type == Rml::Log::LT_ASSERT &&
         text.find("No converter specified.") != Rml::String::npos) ||
        (type == Rml::Log::LT_WARNING &&
         text.find("Invalid property name") != Rml::String::npos);
    assert(expected);
    ++messages;
    return true;
  }

  int messages = 0;
};

template <typename Value>
void CheckStorage(const Value& source, Rml::Variant::Type type) {
  Rml::Variant stored(source);
  assert(stored.GetType() == type);
  assert(stored.GetReference<Value>() == source);

  Rml::Variant assigned;
  assigned = source;
  assert(assigned == stored);
  Rml::Variant moved{Value(source)};
  assert(moved == stored);
  Rml::Property property(source, Rml::Unit::UNKNOWN, 7);
  assert(property.value == stored);
  assert(property.unit == Rml::Unit::UNKNOWN);
  assert(property.specificity == 7);

  if constexpr (std::is_same_v<Value, Rml::byte>) {
    Value output = 91;
    assert(!stored.GetInto(output));
    assert(output == 91);
    assert(stored.Get<Value>(91) == 91);
    assert(property.Get<Value>() == 0);
  } else {
    Value output{};
    assert(stored.GetInto(output));
    assert(output == source);
    assert(stored.Get<Value>() == source);
    assert(property.Get<Value>() == source);
  }

  assigned.Clear();
  assert(assigned.GetType() == Rml::Variant::NONE);
  assert(stored.GetReference<Value>() == source);
}

void CheckAllStorage() {
  using Rml::Variant;
  CheckStorage(true, Variant::BOOL);
  CheckStorage(Rml::byte{17}, Variant::BYTE);
  CheckStorage(char{'A'}, Variant::CHAR);
  CheckStorage(0.25f, Variant::FLOAT);
  CheckStorage(0.25, Variant::DOUBLE);
  CheckStorage(int{-17}, Variant::INT);
  CheckStorage(int64_t{-17}, Variant::INT64);
  CheckStorage(unsigned{17}, Variant::UINT);
  CheckStorage(uint64_t{17}, Variant::UINT64);
  CheckStorage(Rml::String("a\0b", 3), Variant::STRING);
  CheckStorage(Rml::Vector2f(1, 2), Variant::VECTOR2);
  CheckStorage(Rml::Vector3f(1, 2, 3), Variant::VECTOR3);
  CheckStorage(Rml::Vector4f(1, 2, 3, 4), Variant::VECTOR4);
  CheckStorage(Rml::Colourf(0.25f, 0.5f, 0.75f, 1), Variant::COLOURF);
  CheckStorage(Rml::Colourb(1, 2, 3, 4), Variant::COLOURB);

  Rml::Event event;
  CheckStorage(static_cast<Rml::ScriptInterface*>(&event),
               Variant::SCRIPTINTERFACE);
  int payload = 37;
  CheckStorage(static_cast<void*>(&payload), Variant::VOIDPTR);
  CheckStorage(Rml::MakeShared<Rml::Transform>(), Variant::TRANSFORMPTR);
  CheckStorage(Rml::TransitionList{}, Variant::TRANSITIONLIST);
  CheckStorage(Rml::AnimationList{}, Variant::ANIMATIONLIST);
  CheckStorage(Rml::DecoratorsPtr{}, Variant::DECORATORSPTR);
  CheckStorage(Rml::FiltersPtr{}, Variant::FILTERSPTR);
  CheckStorage(Rml::FontEffectsPtr{}, Variant::FONTEFFECTSPTR);
  CheckStorage(Rml::ColorStopList{}, Variant::COLORSTOPLIST);
  CheckStorage(Rml::BoxShadowList{}, Variant::BOXSHADOWLIST);

  Rml::Variant empty;
  int output = 91;
  assert(empty.GetType() == Variant::NONE);
  assert(!empty.GetInto(output));
  assert(output == 91);
  assert(empty.Get<int>(91) == 91);
  std::cout << "PASS all-26-native-variant-storage-and-property-templates\n";
}

void CheckConversionDestinations() {
  Rml::Variant source("17, bad, 3");
  Rml::Vector3i vector(91, 92, 93);
  assert(!source.GetInto(vector));
  assert(vector == Rml::Vector3i(17, 92, 93));
  assert(source.Get(Rml::Vector3i(91, 92, 93)) == vector);
  Rml::Property property(Rml::String("17, bad, 3"), Rml::Unit::STRING);
  assert(property.Get<Rml::Vector3i>() == Rml::Vector3i(17, 0, 0));

  Rml::Character character = Rml::Character::Null;
  source = Rml::String("128512 suffix");
  assert(source.GetInto(character));
  assert(static_cast<unsigned>(character) == 0x1f600);
  source = static_cast<Rml::Character>(0x1f600);
  assert(source.GetType() == Rml::Variant::INT64);
  assert(source.GetReference<int64_t>() == 0x1f600);
  assert(source.GetInto(character));
  assert(static_cast<unsigned>(character) == 0x1f600);

  source = char{'A'};
  character = static_cast<Rml::Character>(91);
  assert(!source.GetInto(character));
  assert(static_cast<unsigned>(character) == 91);
  assert((Rml::TypeConverter<char, Rml::Character>::Convert('A', character)));
  assert(static_cast<unsigned>(character) == 65);
  std::cout << "PASS native-partial-vector-and-enum-int64-destinations\n";
}

void CheckElementAndEventTemplates() {
  Rml::Element element("div");
  element.SetAttribute("partial", Rml::String("17, bad, 3"));
  element.SetAttribute("enum", static_cast<Rml::Character>(0x1f600));
  const Rml::Element& const_element = element;
  auto* mutable_attribute = element.GetAttribute("partial");
  const auto* const_attribute = const_element.GetAttribute("partial");
  assert(mutable_attribute == const_attribute);
  assert(mutable_attribute->GetType() == Rml::Variant::STRING);
  *mutable_attribute = Rml::String("19, bad, 3");
  assert(element.GetAttribute("partial", Rml::Vector3i(91, 92, 93)) ==
         Rml::Vector3i(19, 92, 93));
  assert(element.GetAttribute("missing", 91) == 91);
  assert(element.GetAttribute("missing") == nullptr);
  assert(const_element.GetAttribute("missing") == nullptr);
  assert(element.GetAttribute("enum", Rml::Character::Null) ==
         static_cast<Rml::Character>(0x1f600));

  Rml::ElementAttributes attributes;
  attributes.emplace("added", Rml::Variant(37));
  element.SetAttributes(attributes);
  attributes["added"] = 99;
  assert(element.GetAttribute("added", 0) == 37);
  const auto& snapshot = element.GetAttributes();
  assert(snapshot.at("added").Get<int>() == 37);
  assert(snapshot.at("partial").Get<Rml::String>() == "19, bad, 3");
  assert(element.SetProperty(Rml::PropertyId::Width,
                             Rml::Property(17.5f, Rml::Unit::PX)));
  assert(element.GetProperty<float>("width") == 17.5f);
  assert(element.GetProperty<float>("missing") == 0);

  Rml::Dictionary parameters;
  parameters.emplace("partial", Rml::Variant("17, bad, 3"));
  parameters.emplace("enum", Rml::Variant(Rml::String("128512 suffix")));
  Rml::Event event(
      &element, Rml::EventId::FirstCustomId, "templates", parameters, true);
  parameters["enum"] = 3;
  assert(event.GetParameter("partial", Rml::Vector3i(91, 92, 93)) ==
         Rml::Vector3i(17, 92, 93));
  assert(event.GetParameter("enum", Rml::Character::Null) ==
         static_cast<Rml::Character>(0x1f600));
  assert(event.GetParameter("missing", 91) == 91);
  std::cout << "PASS native-element-attributes-property-and-event-templates\n";
}

NAN_METHOD(RunConsumers) {
  auto* previous_system = Rml::GetSystemInterface();
  ConsumerLog log;
  Rml::SetSystemInterface(&log);
  CheckAllStorage();
  CheckConversionDestinations();
  CheckElementAndEventTemplates();
  assert(log.messages == 5);
  Rml::SetSystemInterface(previous_system);
}

NAN_MODULE_INIT(Initialize) {
  Nan::Set(target,
           Nan::New("run").ToLocalChecked(),
           Nan::GetFunction(Nan::New<v8::FunctionTemplate>(RunConsumers))
               .ToLocalChecked());
}

}  // namespace

NAN_MODULE_WORKER_ENABLED(variant_template_consumers, Initialize)
