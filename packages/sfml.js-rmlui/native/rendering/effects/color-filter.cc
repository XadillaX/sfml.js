// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/effects/color-filter.h"

#include <algorithm>
#include <cmath>

namespace sfmlrmlui {

bool IsColorFilterName(const Rml::String& name) {
  return name == "opacity" || name == "brightness" || name == "contrast" ||
         name == "invert" || name == "grayscale" || name == "sepia" ||
         name == "hue-rotate" || name == "saturate";
}

std::optional<ColorFilterData> CompileColorFilter(
    const Rml::String& name, const Rml::Dictionary& parameters) {
  if (!IsColorFilterName(name)) {
    return std::nullopt;
  }
  const auto parameter = parameters.find("value");
  if (parameter != parameters.end()) {
    switch (parameter->second.GetType()) {
      case Rml::Variant::FLOAT:
      case Rml::Variant::DOUBLE:
      case Rml::Variant::INT:
      case Rml::Variant::UINT:
      case Rml::Variant::INT64:
      case Rml::Variant::UINT64:
        break;
      default:
        return std::nullopt;
    }
  }
  const float value =
      parameter == parameters.end() ? 1.f : parameter->second.Get<float>();
  if (!std::isfinite(value)) {
    return std::nullopt;
  }
  ColorFilterData result;

  if (name == "opacity") {
    result.opacity = std::clamp(value, 0.f, 1.f);
  } else if (name == "brightness") {
    result.matrix = Rml::Matrix4f::Diag(value, value, value, 1.f);
  } else if (name == "contrast") {
    const float constant = 0.5f - 0.5f * value;
    result.matrix = Rml::Matrix4f::Diag(value, value, value, 1.f);
    result.matrix.SetColumn(3, {constant, constant, constant, 1.f});
  } else if (name == "invert") {
    const float amount = std::clamp(value, 0.f, 1.f);
    const float scale = 1.f - 2.f * amount;
    result.matrix = Rml::Matrix4f::Diag(scale, scale, scale, 1.f);
    result.matrix.SetColumn(3, {amount, amount, amount, 1.f});
  } else if (name == "grayscale") {
    const float remaining = 1.f - value;
    const Rml::Vector3f gray = value * Rml::Vector3f(0.2126f, 0.7152f, 0.0722f);
    result.matrix =
        Rml::Matrix4f::FromRows({gray.x + remaining, gray.y, gray.z, 0.f},
                                {gray.x, gray.y + remaining, gray.z, 0.f},
                                {gray.x, gray.y, gray.z + remaining, 0.f},
                                {0.f, 0.f, 0.f, 1.f});
  } else if (name == "sepia") {
    const float remaining = 1.f - value;
    const Rml::Vector3f red = value * Rml::Vector3f(0.393f, 0.769f, 0.189f);
    const Rml::Vector3f green = value * Rml::Vector3f(0.349f, 0.686f, 0.168f);
    const Rml::Vector3f blue = value * Rml::Vector3f(0.272f, 0.534f, 0.131f);
    result.matrix =
        Rml::Matrix4f::FromRows({red.x + remaining, red.y, red.z, 0.f},
                                {green.x, green.y + remaining, green.z, 0.f},
                                {blue.x, blue.y, blue.z + remaining, 0.f},
                                {0.f, 0.f, 0.f, 1.f});
  } else if (name == "hue-rotate") {
    const float sine = std::sin(value);
    const float cosine = std::cos(value);
    result.matrix =
        Rml::Matrix4f::FromRows({0.213f + 0.787f * cosine - 0.213f * sine,
                                 0.715f - 0.715f * cosine - 0.715f * sine,
                                 0.072f - 0.072f * cosine + 0.928f * sine,
                                 0.f},
                                {0.213f - 0.213f * cosine + 0.143f * sine,
                                 0.715f + 0.285f * cosine + 0.140f * sine,
                                 0.072f - 0.072f * cosine - 0.283f * sine,
                                 0.f},
                                {0.213f - 0.213f * cosine - 0.787f * sine,
                                 0.715f - 0.715f * cosine + 0.715f * sine,
                                 0.072f + 0.928f * cosine + 0.072f * sine,
                                 0.f},
                                {0.f, 0.f, 0.f, 1.f});
  } else if (name == "saturate") {
    result.matrix = Rml::Matrix4f::FromRows({0.213f + 0.787f * value,
                                             0.715f - 0.715f * value,
                                             0.072f - 0.072f * value,
                                             0.f},
                                            {0.213f - 0.213f * value,
                                             0.715f + 0.285f * value,
                                             0.072f - 0.072f * value,
                                             0.f},
                                            {0.213f - 0.213f * value,
                                             0.715f - 0.715f * value,
                                             0.072f + 0.928f * value,
                                             0.f},
                                            {0.f, 0.f, 0.f, 1.f});
  }

  return result;
}

}  // namespace sfmlrmlui
