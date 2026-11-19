// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "test/native/rendering/initialization/sfml-faults.h"

#include <dlfcn.h>

#include <stdexcept>
#include <string_view>

#include <SFML/Graphics/Shader.hpp>
#include <SFML/Graphics/Texture.hpp>
#include <SFML/Graphics/VertexBuffer.hpp>

namespace faults {

bool unavailable_shaders{false};
unsigned shader_failure_call{0};
unsigned shader_calls{0};
bool fail_texture_resize{false};
unsigned vertex_failures{0};

void Reset() {
  unavailable_shaders = false;
  shader_failure_call = 0;
  shader_calls = 0;
  fail_texture_resize = false;
  vertex_failures = 0;
}

template <typename Function>
Function Installed(const char* symbol) {
  const auto address = dlsym(RTLD_NEXT, symbol);
  if (!address) {
    throw std::runtime_error("Cannot resolve installed SFML function");
  }
  return reinterpret_cast<Function>(address);
}

}  // namespace faults

namespace sf {

bool Shader::isAvailable() {
  if (faults::unavailable_shaders) {
    return false;
  }
  using Function = bool (*)();
  static const auto kInstalled =
      faults::Installed<Function>("_ZN2sf6Shader11isAvailableEv");
  return kInstalled();
}

bool Shader::loadFromMemory(std::string_view vertex_shader,
                            std::string_view fragment_shader) {
  ++faults::shader_calls;
  if (faults::shader_failure_call == faults::shader_calls) {
    return false;
  }
  using Function = bool (*)(Shader*, std::string_view, std::string_view);
  static const auto kInstalled = faults::Installed<Function>(
      "_ZN2sf6Shader14loadFromMemoryENSt3__117basic_string_view"
      "IcNS1_11char_traitsIcEEEES5_");
  return kInstalled(this, vertex_shader, fragment_shader);
}

bool Texture::resize(Vector2u size, bool srgb) {
  if (faults::fail_texture_resize) {
    return false;
  }
  using Function = bool (*)(Texture*, Vector2u, bool);
  static const auto kInstalled =
      faults::Installed<Function>("_ZN2sf7Texture6resizeENS_7Vector2IjEEb");
  return kInstalled(this, size, srgb);
}

bool VertexBuffer::create(size_t vertex_count) {
  if (faults::vertex_failures) {
    --faults::vertex_failures;
    return false;
  }
  using Function = bool (*)(VertexBuffer*, size_t);
  static const auto kInstalled =
      faults::Installed<Function>("_ZN2sf12VertexBuffer6createEm");
  return kInstalled(this, vertex_count);
}

}  // namespace sf
