// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/ConvolutionFilter.h>
#include <RmlUi/Core/Mesh.h>
#include <RmlUi/Core/MeshUtilities.h>

#include <algorithm>
#include <array>
#include <cassert>
#include <cstdint>
#include <iostream>
#include <string_view>

namespace {

void CheckConvolution() {
  Rml::ConvolutionFilter sum;
  assert(sum.Initialise(Rml::Vector2i(1, 0), Rml::FilterOperation::Sum));
  sum[0][0] = 0.25f;
  sum[0][1] = 0.5f;
  sum[0][2] = 0.25f;
  const std::array<Rml::byte, 6> source{40, 80, 120, 20, 60, 100};
  std::array<Rml::byte, 32> destination;
  destination.fill(17);
  sum.Run(destination.data() + 4,
          Rml::Vector2i(3, 2),
          16,
          Rml::ColorFormat::RGBA8,
          source.data(),
          Rml::Vector2i(3, 2),
          Rml::Vector2i(0, 0),
          Rml::ColorFormat::A8);
  const std::array<Rml::byte, 32> expected{
      17, 17, 17, 17, 17, 17, 17, 40, 17, 17, 17, 80, 17, 17, 17, 80,
      17, 17, 17, 17, 17, 17, 17, 25, 17, 17, 17, 60, 17, 17, 17, 65};
  assert(destination == expected);
  std::cout << "PASS native-utility-convolution-stride-alpha\n";

  Rml::ConvolutionFilter dilation;
  assert(dilation.Initialise(1, Rml::FilterOperation::Dilation));
  for (int y = 0; y < 3; ++y) {
    std::fill_n(dilation[y], 3, 1.f);
  }
  const std::array<Rml::byte, 8> rgba{200, 201, 202, 30, 210, 211, 212, 90};
  std::array<Rml::byte, 12> alpha{};
  dilation.Run(alpha.data(),
               Rml::Vector2i(4, 3),
               4,
               Rml::ColorFormat::A8,
               rgba.data(),
               Rml::Vector2i(2, 1),
               Rml::Vector2i(1, 1),
               Rml::ColorFormat::RGBA8);
  const std::array<Rml::byte, 12> expected_alpha{
      30, 90, 90, 90, 30, 90, 90, 90, 30, 90, 90, 90};
  assert(alpha == expected_alpha);
  std::cout << "PASS native-utility-dilation-source-offset\n";
}

std::array<Rml::Mesh, 5> MakeMeshes() {
  std::array<Rml::Mesh, 5> meshes;
  const Rml::ColourbPremultiplied colour(60, 30, 10, 120);
  Rml::MeshUtilities::GenerateQuad(
      meshes[0], Rml::Vector2f(2, 3), Rml::Vector2f(4, 5), colour);
  Rml::MeshUtilities::GenerateQuad(meshes[1],
                                   Rml::Vector2f(10, 20),
                                   Rml::Vector2f(2, 3),
                                   colour,
                                   Rml::Vector2f(0.25f, 0.5f),
                                   Rml::Vector2f(0.75f, 1));
  Rml::MeshUtilities::GenerateLine(
      meshes[2], Rml::Vector2f(0.4f, 0.6f), Rml::Vector2f(2.4f, 1.6f), colour);
  const Rml::RenderBox sharp(
      Rml::Vector2f(10, 20), Rml::Vector2f(2, 3), {1, 2, 3, 4}, {});
  Rml::MeshUtilities::GenerateBackground(meshes[3], sharp, colour);
  const Rml::RenderBox rounded(
      Rml::Vector2f(30, 20), Rml::Vector2f(2, 3), {1, 2, 3, 4}, {15, 9, 7, 5});
  const Rml::ColourbPremultiplied borders[4]{
      {120, 0, 0, 120}, {0, 120, 0, 120}, {0, 0, 120, 120}, {0, 90, 90, 120}};
  Rml::MeshUtilities::GenerateBackgroundBorder(
      meshes[4], rounded, colour, borders);
  return meshes;
}

void CheckMeshes(const std::array<Rml::Mesh, 5>& meshes) {
  assert(meshes[0].vertices.size() == 4);
  assert((meshes[0].indices == Rml::Vector<int>{0, 3, 1, 1, 3, 2}));
  assert(meshes[0].vertices[2].position == Rml::Vector2f(6, 8));
  assert(meshes[1].vertices[1].tex_coord == Rml::Vector2f(0.75f, 0.5f));
  assert(meshes[2].vertices[0].position == Rml::Vector2f(0, 1));
  assert(meshes[2].vertices[2].position == Rml::Vector2f(3, 2));
  std::cout << "PASS native-utility-quad-line-layout\n";

  assert(meshes[3].vertices[0].position == Rml::Vector2f(6, 4));
  assert((meshes[3].indices == Rml::Vector<int>{0, 2, 1, 0, 3, 2}));
  assert(meshes[4].vertices.size() > 12);
  for (const int index : meshes[4].indices) {
    assert(index >= 0 && size_t(index) < meshes[4].vertices.size());
  }
  std::cout << "PASS native-utility-rounded-background-border\n";
}

void PrintMeshes(const std::array<Rml::Mesh, 5>& meshes) {
  static_assert(sizeof(Rml::Vertex) == 20);
  std::cout << "[";
  for (size_t i = 0; i < meshes.size(); ++i) {
    const auto& mesh = meshes[i];
    const auto* bytes = reinterpret_cast<const uint8_t*>(mesh.vertices.data());
    const size_t size = mesh.vertices.size() * sizeof(Rml::Vertex);
    std::cout << (i ? ",{\"vertices\":[" : "{\"vertices\":[");
    for (size_t j = 0; j < size; ++j) {
      std::cout << (j ? "," : "") << static_cast<unsigned>(bytes[j]);
    }
    std::cout << "],\"indices\":[";
    for (size_t j = 0; j < mesh.indices.size(); ++j) {
      std::cout << (j ? "," : "") << mesh.indices[j];
    }
    std::cout << "]}";
  }
  std::cout << "]\n";
}

}  // namespace

int main(int argc, char** argv) {
  const auto meshes = MakeMeshes();
  if (argc == 2 && std::string_view(argv[1]) == "--json") {
    PrintMeshes(meshes);
  } else {
    CheckConvolution();
    CheckMeshes(meshes);
  }
}
