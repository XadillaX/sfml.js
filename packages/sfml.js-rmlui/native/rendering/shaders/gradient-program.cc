// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/shaders/gradient-program.h"

#include <cmath>
#include <iomanip>
#include <limits>
#include <locale>
#include <sstream>

namespace sfmlrmlui {
namespace {

bool Finite(Rml::Vector2f value) {
  return std::isfinite(value.x) && std::isfinite(value.y);
}

bool VectorParameter(const Rml::Dictionary& parameters,
                     const char* name,
                     Rml::Vector2f fallback,
                     Rml::Vector2f* result) {
  const auto it = parameters.find(name);
  if (it != parameters.end() && it->second.GetType() != Rml::Variant::VECTOR2) {
    return false;
  }
  *result = it == parameters.end() ? fallback : it->second.Get<Rml::Vector2f>();
  return Finite(*result);
}

std::string Number(float value) {
  std::ostringstream stream;
  stream.imbue(std::locale::classic());
  stream << std::scientific
         << std::setprecision(std::numeric_limits<float>::max_digits10)
         << value;
  return stream.str();
}

std::string Color(const Rml::ColourbPremultiplied& color) {
  std::string result = "vec4(";
  for (int i = 0; i < 4; ++i) {
    if (i != 0) {
      result += ",";
    }
    result += Number(static_cast<float>(color[i]) / 255.f);
  }
  return result + ")";
}

}  // namespace

bool ReadGradientParameters(const Rml::String& name,
                            const Rml::Dictionary& parameters,
                            GradientParameters* gradient) {
  const auto stops = parameters.find("color_stop_list");
  if (stops == parameters.end() ||
      stops->second.GetType() != Rml::Variant::COLORSTOPLIST) {
    return false;
  }
  gradient->stops = stops->second.GetReference<Rml::ColorStopList>();
  if (gradient->stops.empty()) {
    return false;
  }
  float previous = -std::numeric_limits<float>::infinity();
  for (const auto& stop : gradient->stops) {
    if (stop.position.unit != Rml::Unit::NUMBER ||
        !std::isfinite(stop.position.number) ||
        stop.position.number < previous) {
      return false;
    }
    previous = stop.position.number;
  }
  const auto repeat = parameters.find("repeating");
  if (repeat != parameters.end()) {
    if (repeat->second.GetType() != Rml::Variant::BOOL) {
      return false;
    }
    gradient->repeating = repeat->second.Get<bool>();
  }
  const float period = gradient->stops.back().position.number -
                       gradient->stops.front().position.number;
  if (!std::isfinite(period)) {
    return false;
  }

  if (name == "linear-gradient") {
    Rml::Vector2f end;
    if (!VectorParameter(parameters, "p0", {}, &gradient->origin) ||
        !VectorParameter(parameters, "p1", {}, &end)) {
      return false;
    }
    gradient->vector = end - gradient->origin;
    const float square = gradient->vector.DotProduct(gradient->vector);
    return Finite(gradient->vector) && std::isfinite(square) &&
           square >= std::numeric_limits<float>::min();
  }
  if (!VectorParameter(parameters, "center", {}, &gradient->origin)) {
    return false;
  }
  if (name == "radial-gradient") {
    gradient->function = GradientParameters::Function::kRadial;
    Rml::Vector2f radius;
    if (!VectorParameter(parameters, "radius", {1.f, 1.f}, &radius) ||
        radius.x <= 0.f || radius.y <= 0.f) {
      return false;
    }
    gradient->vector = {1.f / radius.x, 1.f / radius.y};
    return Finite(gradient->vector);
  }
  gradient->function = GradientParameters::Function::kConic;
  const auto angle = parameters.find("angle");
  if (angle != parameters.end() &&
      angle->second.GetType() != Rml::Variant::FLOAT &&
      angle->second.GetType() != Rml::Variant::DOUBLE &&
      angle->second.GetType() != Rml::Variant::INT) {
    return false;
  }
  const float radians =
      angle == parameters.end() ? 0.f : angle->second.Get<float>();
  gradient->vector = {std::cos(radians), std::sin(radians)};
  return std::isfinite(radians) && Finite(gradient->vector);
}

std::string GradientFragmentProgram(const GradientParameters& gradient) {
  std::string program = R"(
uniform vec2 origin;
uniform vec2 vector;
void main()
{
    vec2 position = gl_TexCoord[1].xy - origin;
    float t = 0.0;
)";
  switch (gradient.function) {
    case GradientParameters::Function::kLinear:
      program += "t = dot(vector, position) / dot(vector, vector);\n";
      break;
    case GradientParameters::Function::kRadial:
      program += "t = length(vector * position);\n";
      break;
    case GradientParameters::Function::kConic:
      program += R"(
    vec2 rotated = mat2(vector.x, -vector.y, vector.y, vector.x) * position;
    if (any(notEqual(rotated, vec2(0.0))))
        t = 0.5 + atan(-rotated.x, rotated.y) / 6.283185307179586;
)";
      break;
  }
  const auto& stops = gradient.stops;
  const float first = stops.front().position.number;
  const float last = stops.back().position.number;
  if (gradient.repeating && last == first) {
    // A constant repeat interval paints its final color everywhere.
    return program + "gl_FragColor = gl_Color * " + Color(stops.back().color) +
           ";\n}\n";
  }
  if (gradient.repeating) {
    program += "t = " + Number(first) + " + mod(t - " + Number(first) + ", " +
               Number(last - first) + ");\n";
  }
  program += "vec4 color = " + Color(stops.front().color) + ";\n";
  for (size_t i = 1; i < stops.size(); ++i) {
    const float begin = stops[i - 1].position.number;
    const float end = stops[i].position.number;
    const std::string weight = begin == end ? "step(" + Number(end) + ", t)"
                                            : "smoothstep(" + Number(begin) +
                                                  ", " + Number(end) + ", t)";
    program +=
        "color = mix(color, " + Color(stops[i].color) + ", " + weight + ");\n";
  }
  return program + "gl_FragColor = gl_Color * color;\n}\n";
}

}  // namespace sfmlrmlui
