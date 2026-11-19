// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Compile the same source with and without the unsupported source selectors.
#include <RmlUi/Core/TypeConverter.h>

namespace {

#if defined(SFML_RMLUI_UNSUPPORTED_PAYLOAD)
struct Payload {};
using Source = Payload;
#elif defined(SFML_RMLUI_UNSUPPORTED_CHARACTER)
using Source = Rml::Character;
#else
using Source = int;
#endif

}  // namespace

int main() {
  Rml::String destination;
  return Rml::TypeConverter<Source, Rml::String>::Convert(Source{}, destination)
             ? 0
             : 1;
}
