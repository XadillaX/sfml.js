// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Deliberately unsupported domains must keep their compiler rejection.
#include <RmlUi/Core/Types.h>

int main() {
#if defined(SFML_RMLUI_NORMALISE_2I)
  return Rml::Vector2i(1, 2).Normalise().x;
#elif defined(SFML_RMLUI_NORMALISE_3I)
  return Rml::Vector3i(1, 2, 3).Normalise().x;
#elif defined(SFML_RMLUI_NORMALISE_4I)
  return Rml::Vector4i(1, 2, 3, 4).Normalise().x;
#elif defined(SFML_RMLUI_FLOAT_PREMULTIPLIED)
  return Rml::Colourf(1).ToPremultiplied().red;
#elif defined(SFML_RMLUI_BYTE_COLOUR_LERP)
  return Rml::Math::Lerp(0.5f, Rml::Colourb(0), Rml::Colourb(255)).red;
#else
  const auto normalized = Rml::Vector3f(1, 2, 3).Normalise();
  const auto colour = Rml::Colourb(1).ToPremultiplied();
  return static_cast<int>(normalized.x) + colour.red;
#endif
}
