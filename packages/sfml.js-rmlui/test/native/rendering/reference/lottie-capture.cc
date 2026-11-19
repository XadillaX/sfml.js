// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <rlottie.h>

#include <cassert>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <string>
#include <vector>

int main(int argc, char** argv) {
  assert(argc == 6);
  const size_t width = std::stoul(argv[2]);
  const size_t height = std::stoul(argv[3]);
  const double elapsed = std::stod(argv[4]);
  assert(width > 0 && height > 0 && elapsed >= 0);

  auto animation = rlottie::Animation::loadFromFile(argv[1], false);
  assert(animation && animation->duration() > 0);
  double cycles;
  const double progress = std::modf(elapsed / animation->duration(), &cycles);
  const size_t frame = animation->frameAtPos(progress);
  std::vector<uint32_t> pixels(width * height);
  rlottie::Surface surface(pixels.data(), width, height, width * 4);
  animation->renderSync(frame, surface);

  std::ofstream output(argv[5], std::ios::binary | std::ios::trunc);
  output.write(reinterpret_cast<const char*>(pixels.data()),
               static_cast<std::streamsize>(pixels.size() * sizeof(uint32_t)));
  assert(output.good());
  std::cout << "{\"frame\":" << frame
            << ",\"duration\":" << animation->duration() << "}\n";
}
