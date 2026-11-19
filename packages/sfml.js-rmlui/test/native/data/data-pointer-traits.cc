// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/DataTypes.h>

#include <cassert>
#include <iostream>
#include <memory>
#include <type_traits>

int main() {
  using Value = Rml::PointerTraits<int>;
  using Raw = Rml::PointerTraits<int*>;
  using Unique = Rml::PointerTraits<Rml::UniquePtr<int>>;
  using Shared = Rml::PointerTraits<Rml::SharedPtr<int>>;
  static_assert(!Value::is_pointer_v);
  static_assert(Raw::is_pointer_v);
  static_assert(Unique::is_pointer_v);
  static_assert(Shared::is_pointer_v);
  static_assert(std::is_same_v<Value::element_type, int>);
  static_assert(std::is_same_v<Raw::element_type, int>);
  static_assert(std::is_same_v<Unique::element_type, int>);
  static_assert(std::is_same_v<Shared::element_type, int>);

  int value = 7;
  int* raw = &value;
  auto unique = std::make_unique<int>(8);
  auto shared = std::make_shared<int>(9);
  assert(Value::Dereference(&value) == &value);
  assert(Raw::Dereference(&raw) == &value);
  assert(Unique::Dereference(&unique) == unique.get());
  assert(Shared::Dereference(&shared) == shared.get());
  assert(*static_cast<int*>(Value::Dereference(&value)) == 7);
  assert(*static_cast<int*>(Raw::Dereference(&raw)) == 7);
  assert(*static_cast<int*>(Unique::Dereference(&unique)) == 8);
  assert(*static_cast<int*>(Shared::Dereference(&shared)) == 9);

  raw = nullptr;
  unique.reset();
  shared.reset();
  assert(Raw::Dereference(&raw) == nullptr);
  assert(Unique::Dereference(&unique) == nullptr);
  assert(Shared::Dereference(&shared) == nullptr);
  std::cout << "PASS native value/raw/unique/shared pointer traits\n";
}
