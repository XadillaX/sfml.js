// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cassert>
#include <iostream>

#if __has_include("native/platform/ime/windows/composition-delivery.h")
#include "native/platform/ime/windows/composition-delivery.h"
#endif

int main() {
#if __has_include("native/platform/ime/windows/composition-delivery.h")
  using sfmlrmlui::ime::windows::CompositionDelivery;
  using Kind = CompositionDelivery::Kind;
  CompositionDelivery delivery;
  int result = 0;
  int high_surrogate = 0;
  int low_surrogate = 0;
  delivery.Enter(&result, Kind::kImeCharacter);
  delivery.Enter(&high_surrogate, Kind::kCharacter);
  assert(delivery.handled());
  delivery.Leave(&high_surrogate);
  delivery.Enter(&low_surrogate, Kind::kCharacter);
  assert(delivery.handled());
  delivery.Leave(&low_surrogate);
  delivery.Leave(&result);
  delivery.Enter(&result, Kind::kCharacter);
  assert(!delivery.handled());
  delivery.Leave(&result);
  assert(!delivery.handled());
  std::cout << "PASS IME result descendants suppress both surrogate units\n";

  int key = 0;
  int nested = 0;
  delivery.Enter(&key, Kind::kKey, true);
  assert(delivery.handled());
  delivery.Enter(&nested, Kind::kCharacter);
  assert(!delivery.handled());
  delivery.Leave(&nested);
  assert(delivery.handled());
  delivery.Leave(&key);
  delivery.Enter(&key, Kind::kKey, false);
  assert(!delivery.handled());
  delivery.Leave(&key);
  std::cout
      << "PASS composition keys and independent characters stay distinct\n";

  delivery.Enter(&key, Kind::kKey, true);
  delivery.Leave(&nested);
  assert(delivery.handled());
  delivery.Enter(&result, Kind::kImeCharacter);
  delivery.Enter(&nested, Kind::kOther);
  delivery.Enter(&high_surrogate, Kind::kCharacter);
  assert(delivery.handled());
  delivery.Leave(&high_surrogate);
  delivery.Leave(&nested);
  delivery.Leave(&result);
  assert(delivery.handled());
  delivery.Leave(&key);
  assert(!delivery.handled());
  std::cout
      << "PASS unmatched exits preserve outer native delivery ownership\n";
#else
  assert(false && "Windows composition delivery is not implemented");
#endif
}
