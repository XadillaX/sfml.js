// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Execute direct specializations, independently from Variant storage aliases.
#include <RmlUi/Core/ScriptInterface.h>
#include <RmlUi/Core/TypeConverter.h>

#include <cassert>
#include <iostream>
#include <memory>
#include <string>
#include <type_traits>

namespace {

// These are the exact upstream specializations, including platform long widths.
using NativeLong = long;                            // NOLINT(runtime/int)
using NativeUnsignedLong = unsigned long;           // NOLINT(runtime/int)
using NativeLongLong = long long;                   // NOLINT(runtime/int)
using NativeUnsignedLongLong = unsigned long long;  // NOLINT(runtime/int)

class ConverterScript final : public Rml::ScriptInterface {
 protected:
  void Release() override { delete this; }
};

template <typename Source, typename Destination>
void CheckScalarPair() {
  using Converter = Rml::TypeConverter<Source, Destination>;
  constexpr bool bool_conversion =
      std::is_same_v<Destination, bool> || std::is_same_v<Source, bool>;
  constexpr bool floating_conversion =
      std::is_floating_point_v<Source> && std::is_floating_point_v<Destination>;

  Source source{};
  Destination destination = Destination{1};
  assert(Converter::Convert(source, destination));
  assert(destination == Destination{0});

  if constexpr (std::is_same_v<Source, bool>) {
    source = true;
  } else if constexpr (std::is_floating_point_v<Source>) {
    source = Source{7.75};
  } else {
    source = Source{7};
  }
  assert(Converter::Convert(source, destination));

  if constexpr (bool_conversion) {
    assert(destination == Destination{1});
  } else if constexpr (floating_conversion) {
    assert(destination == Destination{7.75});
  } else {
    assert(destination == Destination{7});
  }

  if constexpr (std::is_signed_v<Source> && std::is_signed_v<Destination>) {
    if constexpr (std::is_floating_point_v<Source>) {
      source = Source{-7.75};
    } else {
      source = Source{-7};
    }
    assert(Converter::Convert(source, destination));

    if constexpr (floating_conversion) {
      assert(destination == Destination{-7.75});
    } else {
      assert(destination == Destination{-7});
    }
  }
}

template <typename Source>
void CheckScalarDestinations() {
  CheckScalarPair<Source, int>();
  CheckScalarPair<Source, unsigned int>();
  CheckScalarPair<Source, NativeLong>();
  CheckScalarPair<Source, NativeUnsignedLong>();
  CheckScalarPair<Source, NativeLongLong>();
  CheckScalarPair<Source, NativeUnsignedLongLong>();
  CheckScalarPair<Source, float>();
  CheckScalarPair<Source, double>();
  CheckScalarPair<Source, bool>();
}

void CheckScalars() {
  CheckScalarDestinations<int>();
  CheckScalarDestinations<unsigned int>();
  CheckScalarDestinations<NativeLong>();
  CheckScalarDestinations<NativeUnsignedLong>();
  CheckScalarDestinations<NativeLongLong>();
  CheckScalarDestinations<NativeUnsignedLongLong>();
  CheckScalarDestinations<float>();
  CheckScalarDestinations<double>();
  CheckScalarDestinations<bool>();
  std::cout << "PASS 81-direct-native-scalar-specializations\n";
}

void CheckCharacters() {
  char character = 0;
  assert((Rml::TypeConverter<char, char>::Convert('A', character)));
  assert(character == 'A');

  Rml::Character output = Rml::Character::Null;
  assert((Rml::TypeConverter<char, Rml::Character>::Convert('A', output)));
  assert(static_cast<unsigned>(output) == 65);
  assert((Rml::TypeConverter<Rml::Character, Rml::Character>::Convert(
      static_cast<Rml::Character>(0x1f600), output)));
  assert(static_cast<unsigned>(output) == 0x1f600);
  std::cout << "PASS direct-char-character-and-character-copy\n";
}

template <typename Vector>
void CheckVectorCopy(const Vector& source) {
  Vector destination{};
  assert((Rml::TypeConverter<Vector, Vector>::Convert(source, destination)));
  assert(destination == source);
  destination.x = 91;
  assert(source.x == 1);
}

void CheckVectorsAndColours() {
  CheckVectorCopy(Rml::Vector2i(1, 2));
  CheckVectorCopy(Rml::Vector2f(1, 2));
  CheckVectorCopy(Rml::Vector3i(1, 2, 3));
  CheckVectorCopy(Rml::Vector3f(1, 2, 3));
  CheckVectorCopy(Rml::Vector4i(1, 2, 3, 4));
  CheckVectorCopy(Rml::Vector4f(1, 2, 3, 4));

  Rml::Colourb bytes;
  assert((Rml::TypeConverter<Rml::Colourb, Rml::Colourb>::Convert(
      Rml::Colourb(1, 2, 3, 4), bytes)));
  assert(bytes.red == 1 && bytes.green == 2 && bytes.blue == 3 &&
         bytes.alpha == 4);

  Rml::Colourf floats;
  assert((Rml::TypeConverter<Rml::Colourf, Rml::Colourf>::Convert(
      Rml::Colourf(0.25f, 0.5f, 0.75f, 1), floats)));
  assert(floats.red == 0.25f && floats.green == 0.5f && floats.blue == 0.75f &&
         floats.alpha == 1);
  std::cout << "PASS native-integer-float-vector-and-colour-copies\n";
}

void CheckPointersAndStrings() {
  int payload = 37;
  void* opaque = nullptr;
  assert((Rml::TypeConverter<void*, void*>::Convert(&payload, opaque)));
  assert(opaque == &payload);

  using ScriptConverter =
      Rml::TypeConverter<Rml::ScriptInterface*, Rml::ScriptInterface*>;
  auto owner = std::make_unique<ConverterScript>();
  Rml::ScriptInterface* script = nullptr;
  assert(ScriptConverter::Convert(owner.get(), script));
  assert(script == owner.get());
  assert(ScriptConverter::Convert(nullptr, script));
  assert(script == nullptr);

  Rml::String text = "destination";
  const Rml::String source("a\0b", 3);
  assert((Rml::TypeConverter<Rml::String, Rml::String>::Convert(source, text)));
  assert(text.size() == 3 && text[0] == 'a' && text[1] == '\0' &&
         text[2] == 'b');
  text[0] = 'z';
  assert(source[0] == 'a');

  char input[] = "native string";
  char* pointer = input;
  assert((Rml::TypeConverter<char*, Rml::String>::Convert(pointer, text)));
  input[0] = 'x';
  assert(text == "native string");
  std::cout << "PASS typed-pointer-and-native-string-copy-contracts\n";
}

}  // namespace

int main() {
  CheckScalars();
  CheckCharacters();
  CheckVectorsAndColours();
  CheckPointersAndStrings();
}
