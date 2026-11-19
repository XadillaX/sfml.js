// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Inject only the C random generator's output; execute the real Math object.
#include <RmlUi/Core/Math.h>

#include <cassert>
#include <cstdlib>
#include <iostream>
#include <limits>

namespace {

int random_result = 0;

void CheckReal(float maximum) {
  for (const int generated : {0, RAND_MAX / 2, RAND_MAX - 1, RAND_MAX}) {
    random_result = generated;
    const float result = Rml::Math::RandomReal(maximum);
    assert(result >= 0);
    assert(result < maximum);
  }
}

}  // namespace

extern "C" int rand() {
  return random_result;
}

int main() {
  CheckReal(1.f);
  CheckReal(7.f);
  CheckReal(std::numeric_limits<float>::min());
  CheckReal(std::numeric_limits<float>::max());
  std::cout << "PASS random-real-strict-positive-upper-bound\n";

  random_result = 0;
  assert(Rml::Math::RandomInteger(7) == 0);
  assert(!Rml::Math::RandomBool());
  random_result = 1;
  assert(Rml::Math::RandomInteger(7) == 1);
  assert(Rml::Math::RandomBool());
  random_result = RAND_MAX;
  assert(Rml::Math::RandomInteger(7) == RAND_MAX % 7);
  assert(Rml::Math::RandomReal(0) == 0);
  std::cout << "PASS random-integer-bool-and-zero-scale-native-contracts\n";
}
