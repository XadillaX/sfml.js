// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Links the existing package object files, including the real iterator backend.
#include <RmlUi/Core/PropertiesIteratorView.h>
#include <RmlUi/Core/PropertyDictionary.h>
#include <RmlUi/Core/StyleSheetSpecification.h>

#include <array>
#include <cassert>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <type_traits>
#include <utility>

#include "PropertiesIterator.h"

namespace {

struct TrackedDeletion {
  void* address{nullptr};
  int count{0};
};

std::array<TrackedDeletion, 4> deletions;

void Track(size_t index, void* address) {
  assert(address);
  deletions[index] = {address, 0};
}

void CheckConstruction() {
  Rml::PropertyDictionary properties;
  properties.SetProperty(Rml::PropertyId::Width,
                         Rml::Property(11, Rml::Unit::PX));

  {
    auto owner = std::make_unique<Rml::AllPropertiesIterator>(
        properties, nullptr, nullptr);
    Track(0, owner.get());
    Rml::PropertiesIteratorView view(std::move(owner));

    assert(!owner);
    assert(!view.AtEnd());
    const auto entry = *view;
    assert(entry.first == "width");
    assert(entry.second.Get<int>() == 11);
    assert(&entry.second == properties.GetProperty(Rml::PropertyId::Width));
    ++view;
    assert(view.AtEnd());
    assert(deletions[0].count == 0);
  }

  assert(deletions[0].count == 1);
  std::cout << "PASS unique-native-iterator-construction-and-destruction\n";
}

void CheckMoveConstruction() {
  Rml::PropertyDictionary properties;
  properties.SetProperty(Rml::PropertyId::Width,
                         Rml::Property(11, Rml::Unit::PX));
  properties.SetProperty(Rml::PropertyId::Height,
                         Rml::Property(23, Rml::Unit::PX));

  {
    auto owner = std::make_unique<Rml::AllPropertiesIterator>(
        properties, nullptr, nullptr);
    Track(1, owner.get());
    Rml::PropertiesIteratorView source(std::move(owner));
    ++source;
    assert(!source.AtEnd());
    const Rml::Property* current = &(*source).second;

    {
      Rml::PropertiesIteratorView destination(std::move(source));
      assert(!destination.AtEnd());
      assert(&(*destination).second == current);
      ++destination;
      assert(destination.AtEnd());
      assert(deletions[1].count == 0);
    }

    assert(deletions[1].count == 1);
    // Moved-from native views have no iterator; do not invoke their getters.
  }

  assert(deletions[1].count == 1);
  std::cout
      << "PASS native-move-construction-retains-position-and-unique-owner\n";
}

void CheckMoveAssignment() {
  Rml::PropertyDictionary source_properties;
  source_properties.SetProperty(Rml::PropertyId::Width,
                                Rml::Property(11, Rml::Unit::PX));
  Rml::PropertyDictionary old_properties;
  old_properties.SetProperty(Rml::PropertyId::Height,
                             Rml::Property(23, Rml::Unit::PX));

  {
    auto owner = std::make_unique<Rml::AllPropertiesIterator>(
        source_properties, nullptr, nullptr);
    auto old_owner = std::make_unique<Rml::AllPropertiesIterator>(
        old_properties, nullptr, nullptr);
    Track(2, owner.get());
    Track(3, old_owner.get());
    Rml::PropertiesIteratorView destination(std::move(old_owner));

    {
      Rml::PropertiesIteratorView source(std::move(owner));
      auto& returned = (destination = std::move(source));

      assert(&returned == &destination);
      assert(deletions[3].count == 1);
      assert(deletions[2].count == 0);
      assert((*destination).first == "width");
      assert((*destination).second.Get<int>() == 11);
    }

    assert(deletions[2].count == 0);
    ++destination;
    assert(destination.AtEnd());
  }

  assert(deletions[2].count == 1);
  assert(deletions[3].count == 1);
  std::cout << "PASS native-move-assignment-releases-replaced-owner-once\n";
}

}  // namespace

// Observe destruction of the actual native allocation without subclassing its
// non-virtual backend or exposing private fields in production.
void operator delete(void* address) noexcept {
  for (auto& deletion : deletions) {
    if (address && deletion.address == address) {
      ++deletion.count;
    }
  }
  std::free(address);
}

int main() {
  static_assert(!std::is_copy_constructible_v<Rml::PropertiesIteratorView>);
  static_assert(!std::is_copy_assignable_v<Rml::PropertiesIteratorView>);
  static_assert(
      std::is_nothrow_move_constructible_v<Rml::PropertiesIteratorView>);
  static_assert(std::is_nothrow_move_assignable_v<Rml::PropertiesIteratorView>);

  Rml::StyleSheetSpecification::Initialise();
  CheckConstruction();
  CheckMoveConstruction();
  CheckMoveAssignment();
  Rml::StyleSheetSpecification::Shutdown();
}
