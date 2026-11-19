// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Debug.h>
#include <RmlUi/Core/Dictionary.h>
#include <RmlUi/Core/Log.h>
#include <RmlUi/Core/ObserverPtr.h>
#include <RmlUi/Core/PropertyIdSet.h>
#include <RmlUi/Core/Span.h>
#include <RmlUi/Core/StableVector.h>
#include <RmlUi/Core/SystemInterface.h>
#include <RmlUi/Core/Traits.h>

#include <cassert>
#include <iostream>
#include <type_traits>
#include <utility>

namespace {

void CheckSpan() {
  Rml::Span<int> empty;
  assert(empty.empty() && empty.size() == 0 && empty.data() == nullptr);

  Rml::Vector<int> values{3, 7, 11};
  Rml::Span<int> mutable_view(values);
  mutable_view[1] = 17;
  assert(values[1] == 17);
  assert(mutable_view.begin() == values.data());
  assert(mutable_view.end() == values.data() + 3);

  const auto& constant_values = values;
  Rml::Span<const int> constant_view(constant_values);
  Rml::Span<const int> pointer_view(values.data() + 1, 2);
  assert(constant_view[1] == 17 && pointer_view[0] == 17);
  assert(pointer_view.size() == 2 && !pointer_view.empty());
  std::cout << "PASS native-support-span-borrowed-storage\n";
}

void CheckStableVector() {
  Rml::StableVector<Rml::String> values;
  values.reserve(2);
  assert(values.empty() && values.size() == 0);
  const auto first = values.insert("first");
  const auto erased = values.insert("second");
  const auto third = values.insert("third");
  assert(first != erased && erased != third);
  assert(values.erase(erased) == "second");
  assert(values.size() == 2);

  const auto reused = values.insert("replacement");
  assert(reused == erased);
  values[first] = "updated";
  const auto& constant_values = values;
  assert(constant_values[first] == "updated");
  assert(constant_values[third] == "third");
  assert(values.erase(first) == "updated");

  Rml::Vector<Rml::String> visited;
  values.for_each([&](Rml::String& value) { visited.push_back(value); });
  assert((visited == Rml::Vector<Rml::String>{"replacement", "third"}));
  values.clear();
  assert(values.empty() && values.size() == 0);
  assert(size_t(values.insert("new")) == 0);
  std::cout << "PASS native-support-stable-vector-index-reuse\n";
}

void CheckDictionary() {
  Rml::Dictionary values;
  values["integer"] = 17;
  values["text"] = Rml::String("42");
  values["invalid"] = Rml::String("invalid");
  Rml::Variant* mutable_value = Rml::GetIf(values, "integer");
  assert(mutable_value && mutable_value->Get<int>() == 17);
  *mutable_value = 23;

  const auto& constant_values = values;
  const Rml::Variant* constant_value = Rml::GetIf(constant_values, "integer");
  assert(constant_value && constant_value->Get<int>() == 23);
  assert(Rml::GetIf(values, "missing") == nullptr);
  assert(Rml::GetIf(constant_values, "missing") == nullptr);
  assert(Rml::Get(constant_values, "integer", -1) == 23);
  assert(Rml::Get(constant_values, "text", -1) == 42);
  assert(Rml::Get(constant_values, "invalid", -1) == -1);
  assert(Rml::Get(constant_values, "missing", -1) == -1);
  std::cout << "PASS native-support-dictionary-default-and-conversion\n";
}

struct ObservedValue : Rml::EnableObserverPtr<ObservedValue> {
  int value{17};
};

void CheckObservers() {
  Rml::Detail::InitializeObserverPtrPool();
  Rml::ObserverPtr<ObservedValue> empty;
  Rml::ObserverPtr<ObservedValue> null(nullptr);
  assert(empty == null && empty.get() == nullptr && !empty);

  auto owner = Rml::MakeUnique<ObservedValue>();
  auto observer = owner->GetObserverPtr();
  auto copied(observer);
  Rml::ObserverPtr<ObservedValue> assigned;
  assigned = copied;
  assert(observer == owner.get() && observer == copied);
  assert(observer->value == 17 && assigned.get() == owner.get());
  const auto* self = &assigned;
  assigned = *self;
  assert(assigned == observer);

  auto moved(std::move(copied));
  assert(!copied && moved == observer);
  assigned = std::move(moved);
  assert(!moved && assigned == observer);

  // Copying/moving the observed object creates independent observer blocks.
  ObservedValue copy(*owner);
  auto copy_observer = copy.GetObserverPtr();
  ObservedValue destination(std::move(copy));
  auto destination_observer = destination.GetObserverPtr();
  destination = *owner;
  copy = std::move(destination);
  assert(copy_observer.get() == &copy);
  assert(destination_observer.get() == &destination);
  assert(copy_observer.get() != observer.get());

  Rml::Detail::ShutdownObserverPtrPool();
  owner.reset();
  assert(!observer && observer == nullptr && assigned == null);
  observer.reset();
  assigned.reset();
  assert(observer == empty && assigned == empty);
  std::cout << "PASS native-support-observer-copy-move-and-shutdown\n";
}

void CheckPropertySets() {
  Rml::PropertyIdSet empty;
  assert(empty.Empty() && empty.Size() == 0 && empty.begin() == empty.end());
  Rml::PropertyIdSet first;
  first.Insert(Rml::PropertyId::Width);
  first.Insert(Rml::PropertyId::Height);
  first.Insert(Rml::PropertyId::Width);
  Rml::PropertyIdSet second;
  second.Insert(Rml::PropertyId::Height);
  second.Insert(Rml::PropertyId::Color);

  auto united = first | second;
  const auto intersected = first & second;
  assert(united.Size() == 3 && intersected.Size() == 1);
  assert(intersected.Contains(Rml::PropertyId::Height));
  first |= second;
  first &= intersected;
  assert(first.Size() == 1 && first.Contains(Rml::PropertyId::Height));

  Rml::Vector<Rml::PropertyId> ids;
  for (auto id : united) {
    ids.push_back(id);
  }
  assert((ids == Rml::Vector<Rml::PropertyId>{Rml::PropertyId::Width,
                                              Rml::PropertyId::Height,
                                              Rml::PropertyId::Color}));
  auto iterator = united.Erase(united.begin());
  assert(*iterator == Rml::PropertyId::Height);
  ++iterator;
  assert(*iterator == Rml::PropertyId::Color);
  assert(iterator != united.end());
  united.Erase(Rml::PropertyId::Color);
  assert(united.Size() == 1);
  united.Clear();
  assert(united.Empty());
  std::cout << "PASS native-support-property-set-algebra-and-iteration\n";
}

struct ReleasedValue : Rml::Releasable {
  explicit ReleasedValue(int* releases) : releases(releases) {}
  void Release() override {
    ++*releases;
    delete this;
  }
  int* releases;
};

struct TypeBase {
  virtual ~TypeBase() = default;
  RMLUI_RTTI_Declare(TypeBase)
};

struct TypeChild : TypeBase {
  RMLUI_RTTI_DeclareWithParent(TypeChild, TypeBase)
};

RMLUI_RTTI_Define(TypeBase);
RMLUI_RTTI_Define(TypeChild);

void CheckTraits() {
  static_assert(!std::is_copy_constructible_v<Rml::NonCopyMoveable>);
  static_assert(!std::is_move_constructible_v<Rml::NonCopyMoveable>);
  static_assert(!std::is_copy_assignable_v<Rml::NonCopyMoveable>);
  static_assert(!std::is_move_assignable_v<Rml::NonCopyMoveable>);
  Rml::NonCopyMoveable noncopyable;
  int releases = 0;
  {
    Rml::UniqueReleaserPtr<ReleasedValue> owner(new ReleasedValue(&releases));
    auto moved = std::move(owner);
    assert(!owner && moved);
  }
  assert(releases == 1);
  assert(Rml::Family<int>::Id() == Rml::Family<int>::Id());
  assert(Rml::Family<int>::Id() != Rml::Family<Rml::String>::Id());
  static_assert(std::is_same_v<Rml::ClassId, void*>);

  TypeChild child;
  TypeBase base;
  TypeBase* pointer = &child;
  assert(rmlui_dynamic_cast<TypeChild*>(pointer) == &child);
  assert(rmlui_dynamic_cast<TypeChild*>(&base) == nullptr);
  assert(rmlui_dynamic_cast<TypeChild*>(static_cast<TypeBase*>(nullptr)) ==
         nullptr);
  assert(rmlui_static_cast<TypeChild*>(pointer) == &child);
  const int value = 17;
  const Rml::String type_name = rmlui_type_name(value);
  assert(!type_name.empty() && type_name == rmlui_type_name<int>());
  std::cout << "PASS native-support-releaser-and-type-family\n";
}

void CheckConfiguration() {
  Rml::Vector<int> values{1, 2};
  Rml::Array<int, 2> array{3, 4};
  Rml::Stack<int> stack;
  stack.push(array[0]);
  Rml::Queue<int> queue;
  queue.push(array[1]);
  Rml::List<int> list{stack.top(), queue.front()};
  Rml::Pair<int, int> pair{list.front(), list.back()};
  assert(pair.first == 3 && pair.second == 4);

  Rml::StableMap<int, int> stable{{1, 7}};
  Rml::StableUnorderedMap<int, int> hashed{{1, 7}};
  Rml::UnorderedMultimap<int, int> multiple{{1, 7}, {1, 9}};
  Rml::UnorderedMap<int, int> unordered{{1, 7}};
  Rml::SmallUnorderedMap<int, int> small{{1, 7}};
  Rml::SmallOrderedMap<int, int> ordered{{1, 7}};
  assert(stable.at(1) == 7 && hashed.at(1) == 7 && multiple.count(1) == 2);
  assert(unordered.at(1) == 7 && small.at(1) == 7 && ordered.at(1) == 7);

  Rml::UnorderedSet<int> set{1, 2};
  Rml::SmallUnorderedSet<int> small_set{1, 2};
  Rml::SmallOrderedSet<int> ordered_set{1, 2};
  assert(set.count(2) == 1 && small_set.count(2) == 1 &&
         ordered_set.count(2) == 1);
  Rml::Function<int(int)> twice = [](int value) { return 2 * value; };
  assert(twice(7) == 14);
  static_assert(std::is_invocable_r_v<size_t, Rml::Hash<int>, int>);
  auto shared = Rml::MakeShared<Rml::String>("retained");
  Rml::WeakPtr<Rml::String> weak = shared;
  assert(*weak.lock() == "retained");
  shared.reset();
  assert(weak.expired());
  auto unique = Rml::MakeUnique<Rml::String>("moved");
  Rml::StringList strings;
  strings.push_back(std::move(*unique));
  Rml::Vector<int> moved(Rml::MakeMoveIterator(values.begin()),
                         Rml::MakeMoveIterator(values.end()));
  assert((moved == Rml::Vector<int>{1, 2}) && strings[0] == "moved");
  std::cout << "PASS native-support-configured-container-abi\n";
}

class CaptureSystem : public Rml::SystemInterface {
 public:
  bool LogMessage(Rml::Log::Type type, const Rml::String& message) override {
    messages.emplace_back(type, message);
    return false;
  }
  Rml::Vector<Rml::Pair<Rml::Log::Type, Rml::String>> messages;
};

void CheckNativeLog() {
  CaptureSystem system;
  Rml::SetSystemInterface(&system);
  Rml::Log::Message(Rml::Log::LT_INFO, "%s:%04d %%", "text", 7);
  Rml::Log::ParseError("panel.rml", 12, "Invalid %s", "width");
  Rml::Log::ParseError("panel.rml", -1, "missing");
  Rml::Log::Message(Rml::Log::LT_DEBUG, "a%cb", 0);
  Rml::Log::Message(Rml::Log::LT_WARNING, "%s", Rml::String(2000, 'x').c_str());
  assert(!Rml::Assert("assertion", "probe.cc", 3));
  assert(system.messages.size() == 6);
  assert(system.messages[0].first == Rml::Log::LT_INFO);
  assert(system.messages[0].second == "text:0007 %");
  assert(system.messages[1].first == Rml::Log::LT_ERROR);
  assert(system.messages[1].second == "panel.rml:12: Invalid width");
  assert(system.messages[2].second == "panel.rml: missing");
  assert(system.messages[3].second == "a");
  assert(system.messages[4].second == Rml::String(1021, 'x'));
  assert(system.messages[5].first == Rml::Log::LT_ASSERT);
  assert(system.messages[5].second == "assertion\nprobe.cc:3");
  Rml::SetSystemInterface(nullptr);
  std::cout << "PASS native-support-original-varargs-log\n";
}

}  // namespace

int main() {
  CheckSpan();
  CheckStableVector();
  CheckDictionary();
  CheckObservers();
  CheckPropertySets();
  CheckTraits();
  CheckConfiguration();
  CheckNativeLog();
}
