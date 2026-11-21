// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Test direct String converters without Variant's storage normalization.
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/ScriptInterface.h>
#include <RmlUi/Core/SystemInterface.h>
#include <RmlUi/Core/TypeConverter.h>

#include <cassert>
#include <cmath>
#include <cstdio>
#include <iostream>
#include <limits>
#include <memory>
#include <type_traits>

#include "vendor/rmlui/Source/Core/PropertyParserColour.h"

namespace {

using NativeLong = long;                            // NOLINT(runtime/int)
using NativeUnsignedLong = unsigned long;           // NOLINT(runtime/int)
using NativeLongLong = long long;                   // NOLINT(runtime/int)
using NativeUnsignedLongLong = unsigned long long;  // NOLINT(runtime/int)

class ConverterScript final : public Rml::ScriptInterface {
 protected:
  void Release() override { delete this; }
};

class ConverterLog final : public Rml::SystemInterface {
 public:
  bool LogMessage(Rml::Log::Type type, const Rml::String& text) override {
    assert(type == Rml::Log::LT_ASSERT);
    assert(text.find("No converter specified.") != Rml::String::npos);
    ++assertions;
    return true;
  }

  int assertions = 0;
};

template <typename Integer>
void CheckIntegerStrings() {
  using Reader = Rml::TypeConverter<Rml::String, Integer>;
  using Writer = Rml::TypeConverter<Integer, Rml::String>;

  Integer output = 91;
  assert(Reader::Convert(" 17 suffix", output));
  assert(output == 17);
  assert(!Reader::Convert("bad", output));
  assert(output == 17);
  assert(!Reader::Convert("", output));
  assert(output == 17);

  Rml::String text = "fallback";
  assert(Writer::Convert(17, text));
  assert(text == "17");
  assert(Writer::Convert(std::numeric_limits<Integer>::max(), text));
  assert(Reader::Convert(text, output));
  assert(output == std::numeric_limits<Integer>::max());
  assert(Rml::FromString<Integer>("bad", Integer{91}) == Integer{91});

  if constexpr (std::is_signed_v<Integer>) {
    assert(Reader::Convert("-7 suffix", output));
    assert(output == -7);
    assert(Writer::Convert(std::numeric_limits<Integer>::min(), text));
    assert(Reader::Convert(text, output));
    assert(output == std::numeric_limits<Integer>::min());
  } else {
    assert(Reader::Convert("-1 suffix", output));
    assert(output == std::numeric_limits<Integer>::max());
  }
}

template <typename Float>
void CheckFloatingStrings() {
  using Reader = Rml::TypeConverter<Rml::String, Float>;
  using Writer = Rml::TypeConverter<Float, Rml::String>;

  Float output = 91;
  assert(Reader::Convert(" 17.75 suffix", output));
  assert(output == Float{17.75});
  assert(Reader::Convert("bad", output));
  assert(output == 0);
  assert(Reader::Convert("", output));
  assert(output == 0);
  assert(Reader::Convert("nan", output));
  assert(std::isnan(output));
  assert(Reader::Convert("inf", output));
  assert(std::isinf(output));

  Rml::String text = "fallback";
  assert(Writer::Convert(Float{1.23456}, text));
  assert(text == "1.235");
  assert(Writer::Convert(Float{-7.5}, text));
  assert(text == "-7.5");
  assert(Writer::Convert(Float{0}, text));
  assert(text == "0");
  assert(Rml::FromString<Float>("bad", Float{91}) == Float{0});
}

void CheckNumericStrings() {
  CheckIntegerStrings<int>();
  CheckIntegerStrings<unsigned int>();
  CheckIntegerStrings<NativeLong>();
  CheckIntegerStrings<NativeUnsignedLong>();
  CheckIntegerStrings<NativeLongLong>();
  CheckIntegerStrings<NativeUnsignedLongLong>();
  CheckIntegerStrings<Rml::byte>();
  CheckFloatingStrings<float>();
  CheckFloatingStrings<double>();
  std::cout << "PASS direct-numeric-string-converters-and-width-boundaries\n";
}

void CheckBoolCharAndPointers() {
  using BoolReader = Rml::TypeConverter<Rml::String, bool>;
  bool output = false;
  for (const char* text : {"1", "true", "TRUE", "TrUe"}) {
    assert(BoolReader::Convert(text, output));
    assert(output);
  }

  for (const char* text : {"0", "false", "FALSE", "FaLsE"}) {
    assert(BoolReader::Convert(text, output));
    assert(!output);
  }

  for (const char* text : {" true", "false ", "2", ""}) {
    output = true;
    assert(!BoolReader::Convert(text, output));
    assert(output);
  }

  Rml::String text = "fallback";
  assert((Rml::TypeConverter<bool, Rml::String>::Convert(true, text)));
  assert(text == "1");
  assert((Rml::TypeConverter<bool, Rml::String>::Convert(false, text)));
  assert(text == "0");
  assert((Rml::TypeConverter<char, Rml::String>::Convert('A', text)));
  assert(text == "A");

  // Native-only pointer formatting must not become a JS address adapter.
  int payload = 37;
  void* pointer = &payload;
  char expected[64];
  std::snprintf(expected, sizeof(expected), "%p", pointer);
  assert((Rml::TypeConverter<void*, Rml::String>::Convert(pointer, text)));
  assert(text == expected);

  auto script = std::make_unique<ConverterScript>();
  Rml::ScriptInterface* script_pointer = script.get();
  std::snprintf(
      expected, sizeof(expected), "%p", static_cast<void*>(script_pointer));
  assert((Rml::TypeConverter<Rml::ScriptInterface*, Rml::String>::Convert(
      script_pointer, text)));
  assert(text == expected);

  pointer = nullptr;
  script_pointer = nullptr;
  std::snprintf(expected, sizeof(expected), "%p", pointer);
  assert((Rml::TypeConverter<void*, Rml::String>::Convert(pointer, text)));
  assert(text == expected);
  assert((Rml::TypeConverter<Rml::ScriptInterface*, Rml::String>::Convert(
      script_pointer, text)));
  assert(text == expected);
  std::cout << "PASS native-bool-char-and-pointer-string-contracts\n";
}

template <typename Vector, typename Component, int count>
void CheckVectorStrings() {
  using Reader = Rml::TypeConverter<Rml::String, Vector>;
  using Writer = Rml::TypeConverter<Vector, Rml::String>;
  Vector output{};
  for (int i = 0; i < count; ++i) {
    output[i] = Component{91};
  }

  assert(!Reader::Convert("17", output));
  for (int i = 0; i < count; ++i) {
    assert(output[i] == 91);
  }

  if constexpr (std::is_integral_v<Component>) {
    const Vector fallback = output;
    assert(!Reader::Convert("17, bad, 3, 4", output));
    assert(output[0] == 17 && output[1] == 91);
    assert(Rml::FromString<Vector>("17, bad, 3, 4", fallback) == output);
  } else {
    assert(Reader::Convert("17, bad, 3, 4", output));
    assert(output[0] == 17 && output[1] == 0);
  }

  assert(Reader::Convert("1, 2, 3, 4, 99", output));
  Rml::String expected;
  for (int i = 0; i < count; ++i) {
    assert(output[i] == i + 1);
    if (i > 0) {
      expected += ", ";
    }
    expected += static_cast<char>('1' + i);
  }

  Rml::String text = "fallback";
  assert(Writer::Convert(output, text));
  assert(text == expected);
  if constexpr (std::is_same_v<Vector, Rml::Colourf>) {
    std::cout << "PASS direct-float-colour-string-components\n";
  } else {
    std::cout << "PASS direct-vector-string-components-" << count
              << (std::is_integral_v<Component> ? "-integer\n" : "-float\n");
  }
}

void CheckColoursAndDefaults() {
  using Reader = Rml::TypeConverter<Rml::String, Rml::Colourb>;
  Rml::Colourb colour(1, 2, 3, 4);
  assert(!Reader::Convert("", colour));
  assert(colour == Rml::Colourb(1, 2, 3, 4));
  assert(!Reader::Convert("missing-colour", colour));
  assert(colour == Rml::Colourb{});
  assert(Reader::Convert("#12345678", colour));
  assert(colour == Rml::Colourb(0x12, 0x34, 0x56, 0x78));
  assert(Reader::Convert("RED", colour));
  assert(colour == Rml::Colourb(255, 0, 0));

  Rml::String text = "fallback";
  assert((Rml::TypeConverter<Rml::Colourb, Rml::String>::Convert(
      Rml::Colourb(0x12, 0x34, 0x56), text)));
  assert(text == "#123456");
  assert((Rml::TypeConverter<Rml::Colourb, Rml::String>::Convert(
      Rml::Colourb(0x12, 0x34, 0x56, 0x78), text)));
  assert(text == "#12345678");

  ConverterLog log;
  Rml::SetSystemInterface(&log);
  Rml::Vector2f vector(91, 92);
  assert((!Rml::TypeConverter<int, Rml::Vector2f>::Convert(17, vector)));
  assert(vector == Rml::Vector2f(91, 92));
  Rml::byte byte = 91;
  assert((!Rml::TypeConverter<Rml::byte, Rml::byte>::Convert(17, byte)));
  assert(byte == 91);
  assert(log.assertions == 2);
  Rml::SetSystemInterface(nullptr);
  std::cout << "PASS colour-failure-mutation-and-generic-default-converter\n";
}

}  // namespace

int main() {
  Rml::PropertyParserColour::Initialize();
  CheckNumericStrings();
  CheckBoolCharAndPointers();
  CheckVectorStrings<Rml::Vector2i, int, 2>();
  CheckVectorStrings<Rml::Vector2f, float, 2>();
  CheckVectorStrings<Rml::Vector3i, int, 3>();
  CheckVectorStrings<Rml::Vector3f, float, 3>();
  CheckVectorStrings<Rml::Vector4i, int, 4>();
  CheckVectorStrings<Rml::Vector4f, float, 4>();
  CheckVectorStrings<Rml::Colourf, float, 4>();
  CheckColoursAndDefaults();
  Rml::PropertyParserColour::Shutdown();
}
