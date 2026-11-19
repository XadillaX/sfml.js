// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "test/native/rendering/layers/sfml-target-faults.h"

#include <dlfcn.h>

#include <cstdlib>
#include <new>
#include <stdexcept>

#include <SFML/Graphics/RenderTexture.hpp>
#include <SFML/Graphics/Texture.hpp>
#include <SFML/System/Exception.hpp>

namespace target_faults {

unsigned target_calls{0};
unsigned target_failure{0};
unsigned texture_calls{0};
unsigned texture_failure{0};
bool fail_mask_record{false};
bool fail_next_allocation{false};
void* captured_texture{nullptr};
bool captured_texture_deleted{false};
std::size_t failed_allocation_size{0};

void Reset(unsigned target, unsigned texture) {
  target_calls = 0;
  target_failure = target;
  texture_calls = 0;
  texture_failure = texture;
  fail_mask_record = false;
  fail_next_allocation = false;
  captured_texture = nullptr;
  captured_texture_deleted = false;
  failed_allocation_size = 0;
}

template <typename Function>
Function Installed(const char* symbol) {
  const auto address = dlsym(RTLD_NEXT, symbol);
  if (!address) {
    throw std::runtime_error("Cannot resolve installed SFML allocation");
  }
  return reinterpret_cast<Function>(address);
}

}  // namespace target_faults

void* operator new(std::size_t size) {
  if (target_faults::fail_next_allocation) {
    target_faults::fail_next_allocation = false;
    target_faults::failed_allocation_size = size;
    throw std::bad_alloc();
  }
  if (auto* pointer = std::malloc(size ? size : 1)) {
    return pointer;
  }
  throw std::bad_alloc();
}

void operator delete(void* pointer) noexcept {
  if (pointer && pointer == target_faults::captured_texture) {
    target_faults::captured_texture_deleted = true;
  }
  std::free(pointer);
}

void operator delete(void* pointer, std::size_t) noexcept {
  ::operator delete(pointer);
}

namespace sf {

// The installed dylibs bind constructor-internal calls locally. Delegating
// here makes a driver's false return observable at the renderer's constructor
// boundary. All successful allocations use the installed SFML implementation.
RenderTexture::RenderTexture(Vector2u size, const ContextSettings& settings)
    : RenderTexture() {
  if (!resize(size, settings)) {
    throw sf::Exception("Injected render-target allocation failure");
  }
}

bool RenderTexture::resize(Vector2u size, const ContextSettings& settings) {
  ++target_faults::target_calls;
  if (target_faults::target_calls == target_faults::target_failure) {
    return false;
  }
  using Function = bool (*)(RenderTexture*, Vector2u, const ContextSettings&);
  static const auto kInstalled = target_faults::Installed<Function>(
      "_ZN2sf13RenderTexture6resizeENS_7Vector2IjEERKNS_15ContextSettingsE");
  return kInstalled(this, size, settings);
}

Texture::Texture(Vector2u size, bool srgb) : Texture() {
  if (!resize(size, srgb)) {
    throw sf::Exception("Injected capture-texture allocation failure");
  }
}

bool Texture::resize(Vector2u size, bool srgb) {
  ++target_faults::texture_calls;
  if (target_faults::texture_calls == target_faults::texture_failure) {
    return false;
  }
  using Function = bool (*)(Texture*, Vector2u, bool);
  static const auto kInstalled = target_faults::Installed<Function>(
      "_ZN2sf7Texture6resizeENS_7Vector2IjEEb");
  return kInstalled(this, size, srgb);
}

void Texture::update(const Texture& texture) {
  using Function = void (*)(Texture*, const Texture&);
  static const auto kInstalled =
      target_faults::Installed<Function>("_ZN2sf7Texture6updateERKS0_");
  kInstalled(this, texture);
  if (target_faults::fail_mask_record) {
    // The saved texture is complete. Fail the immediately following mask
    // record allocation, after all real SFML work and temporary destruction.
    target_faults::fail_mask_record = false;
    target_faults::captured_texture = this;
    target_faults::fail_next_allocation = true;
  }
}

}  // namespace sf
