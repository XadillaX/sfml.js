// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_BLUR_KERNEL_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_BLUR_KERNEL_H_

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>

namespace sfmlrmlui {

// Matches the pinned GL3 integer logarithm without overflowing int for a
// large finite sigma. Reduced-resolution passes always use sigma <= 3.
struct BlurKernel {
  int levels{0};
  std::array<float, 4> weights{};

  explicit BlurKernel(float sigma) {
    const float scaled = sigma * (2.f / 3.f);
    while (levels < 10 && scaled >= static_cast<float>(1 << (levels + 1))) {
      ++levels;
    }
    sigma = std::clamp(sigma / static_cast<float>(1 << levels), 0.f, 3.f);
    if (sigma < 0.1f) {
      weights[0] = 1.f;
      return;
    }
    float total = 0.f;
    for (std::size_t i = 0; i < weights.size(); ++i) {
      weights[i] = std::exp(-static_cast<float>(i * i) / (2.f * sigma * sigma));
      total += weights[i] * (i == 0 ? 1.f : 2.f);
    }
    for (auto& weight : weights) {
      weight /= total;
    }
  }
};

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_EFFECTS_BLUR_KERNEL_H_
