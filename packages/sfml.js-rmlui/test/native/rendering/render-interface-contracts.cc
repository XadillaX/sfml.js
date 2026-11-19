// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Dictionary.h>
#include <RmlUi/Core/RenderInterfaceCompatibility.h>

#include <algorithm>
#include <array>
#include <cassert>
#include <iostream>
#include <type_traits>
#include <vector>

namespace sfmlrmlui {

// Core's binding-only cleanup hooks remain linked into this standalone probe.
// No contexts, JS runtime or Lua data models are created here.
void InvalidateLuaModel(Rml::Context*, Rml::DataModel*) {
  assert(false && "Renderer contracts must not create data models");
}

void ReleaseLuaContextModels(Rml::Context*) {}

}  // namespace sfmlrmlui

namespace {

// Count required calls to detect side effects from optional base virtuals.
class BasicRenderer : public Rml::RenderInterface {
 public:
  Rml::CompiledGeometryHandle CompileGeometry(Rml::Span<const Rml::Vertex>,
                                              Rml::Span<const int>) override {
    ++required_calls;
    return 1;
  }

  void RenderGeometry(Rml::CompiledGeometryHandle,
                      Rml::Vector2f,
                      Rml::TextureHandle) override {
    ++required_calls;
  }

  void ReleaseGeometry(Rml::CompiledGeometryHandle) override {
    ++required_calls;
  }

  Rml::TextureHandle LoadTexture(Rml::Vector2i&, const Rml::String&) override {
    ++required_calls;
    return 0;
  }

  Rml::TextureHandle GenerateTexture(Rml::Span<const Rml::byte>,
                                     Rml::Vector2i) override {
    ++required_calls;
    return 0;
  }

  void ReleaseTexture(Rml::TextureHandle) override { ++required_calls; }

  void EnableScissorRegion(bool) override { ++required_calls; }

  void SetScissorRegion(Rml::Rectanglei) override { ++required_calls; }

  int required_calls = 0;
};

class BareLegacyRenderer : public Rml::RenderInterfaceCompatibility {
 public:
  void RenderGeometry(Rml::Vertex*,
                      int,
                      int*,
                      int,
                      Rml::TextureHandle,
                      const Rml::Vector2f&) override {}

  void EnableScissorRegion(bool) override {}

  void SetScissorRegion(int, int, int, int) override {}
};

// Observe adapter inputs without introducing a GPU or application renderer.
class CaptureLegacyRenderer : public BareLegacyRenderer {
 public:
  Rml::CompiledGeometryHandle CompileGeometry(
      Rml::Vertex* vertices,
      int num_vertices,
      int* indices,
      int num_indices,
      Rml::TextureHandle texture) override {
    compile_textures.push_back(texture);
    captured_vertices.assign(vertices, vertices + num_vertices);
    captured_indices.assign(indices, indices + num_indices);
    return compilation_succeeds ? 100 + compile_textures.size() : 0;
  }

  void RenderGeometry(Rml::Vertex* vertices,
                      int num_vertices,
                      int* indices,
                      int num_indices,
                      Rml::TextureHandle texture,
                      const Rml::Vector2f& translation) override {
    ++immediate_calls;
    captured_vertices.assign(vertices, vertices + num_vertices);
    captured_indices.assign(indices, indices + num_indices);
    last_texture = texture;
    last_translation = translation;
  }

  void RenderCompiledGeometry(Rml::CompiledGeometryHandle geometry,
                              const Rml::Vector2f& translation) override {
    rendered_handles.push_back(geometry);
    last_translation = translation;
  }

  void ReleaseCompiledGeometry(Rml::CompiledGeometryHandle geometry) override {
    released_handles.push_back(geometry);
  }

  void EnableScissorRegion(bool enable) override {
    scissor_enabled.push_back(enable);
  }

  void SetScissorRegion(int x, int y, int width, int height) override {
    scissor_regions.push_back({x, y, width, height});
  }

  bool LoadTexture(Rml::TextureHandle& texture,
                   Rml::Vector2i& dimensions,
                   const Rml::String& source) override {
    loaded_source = source;
    dimensions = {7, 9};
    texture = 61;
    return texture_succeeds;
  }

  bool GenerateTexture(Rml::TextureHandle& texture,
                       const Rml::byte* source,
                       const Rml::Vector2i& dimensions) override {
    generated_dimensions = dimensions;
    generated_pixels.assign(source, source + dimensions.x * dimensions.y * 4);
    texture = 62;
    return texture_succeeds;
  }

  void ReleaseTexture(Rml::TextureHandle texture) override {
    released_textures.push_back(texture);
  }

  void SetTransform(const Rml::Matrix4f* transform) override {
    transforms.push_back(transform);
  }

  bool compilation_succeeds = true;
  bool texture_succeeds = true;
  int immediate_calls = 0;
  Rml::TextureHandle last_texture = 0;
  Rml::Vector2f last_translation;
  Rml::Vector2i generated_dimensions;
  Rml::String loaded_source;
  std::vector<Rml::Vertex> captured_vertices;
  std::vector<int> captured_indices;
  std::vector<Rml::TextureHandle> compile_textures;
  std::vector<Rml::CompiledGeometryHandle> rendered_handles;
  std::vector<Rml::CompiledGeometryHandle> released_handles;
  std::vector<Rml::TextureHandle> released_textures;
  std::vector<Rml::byte> generated_pixels;
  std::vector<bool> scissor_enabled;
  std::vector<std::array<int, 4>> scissor_regions;
  std::vector<const Rml::Matrix4f*> transforms;
};

struct Triangle {
  Rml::Span<const Rml::Vertex> Vertices() const {
    return {vertices.data(), vertices.size()};
  }

  Rml::Span<const int> Indices() const {
    return {indices.data(), indices.size()};
  }

  std::array<Rml::Vertex, 3> vertices{{
      {{2, 3}, {64, 32, 0, 128}, {0, 0}},
      {{10, 3}, {0, 0, 0, 0}, {1, 0}},
      {{2, 9}, {255, 128, 64, 255}, {0, 1}},
  }};
  std::array<int, 3> indices{{0, 1, 2}};
};

void CheckAdvancedDefaults(Rml::RenderInterface* renderer) {
  Rml::Dictionary parameters;
  assert(renderer->PushLayer() == 0);
  renderer->CompositeLayers(0, 0, Rml::BlendMode::Blend, {});
  renderer->CompositeLayers(0, 0, Rml::BlendMode::Replace, {});
  renderer->PopLayer();
  assert(renderer->SaveLayerAsTexture() == 0);
  assert(renderer->SaveLayerAsMaskImage() == 0);

  assert(renderer->CompileFilter("unsupported", parameters) == 0);
  renderer->ReleaseFilter(0);
  assert(renderer->CompileShader("unsupported", parameters) == 0);
  renderer->RenderShader(0, 0, {1, 2}, 0);
  renderer->ReleaseShader(0);
}

void CheckModernDefaults() {
  static_assert(!std::is_copy_constructible_v<Rml::RenderInterface>);
  static_assert(!std::is_move_constructible_v<Rml::RenderInterface>);
  static_assert(std::has_virtual_destructor_v<Rml::RenderInterface>);
  static_assert(static_cast<int>(Rml::ClipMaskOperation::Set) == 0);
  static_assert(static_cast<int>(Rml::ClipMaskOperation::SetInverse) == 1);
  static_assert(static_cast<int>(Rml::ClipMaskOperation::Intersect) == 2);
  static_assert(static_cast<int>(Rml::BlendMode::Blend) == 0);
  static_assert(static_cast<int>(Rml::BlendMode::Replace) == 1);

  BasicRenderer renderer;
  const Rml::Matrix4f transform = Rml::Matrix4f::Identity();
  renderer.EnableClipMask(true);
  renderer.RenderToClipMask(Rml::ClipMaskOperation::Set, 0, {1, 2});
  renderer.SetTransform(&transform);
  renderer.SetTransform(nullptr);
  renderer.EnableClipMask(false);
  CheckAdvancedDefaults(&renderer);
  assert(renderer.required_calls == 0);
}

void CheckLegacyDefaults() {
  BareLegacyRenderer legacy;
  auto* adapter = legacy.GetAdaptedInterface();
  assert(adapter && adapter == legacy.GetAdaptedInterface());
  static_assert(
      std::is_base_of_v<Rml::RenderInterface, Rml::RenderInterfaceAdapter>);
  static_assert(
      !std::is_copy_constructible_v<Rml::RenderInterfaceCompatibility>);

  Triangle triangle;
  assert(legacy.CompileGeometry(
             triangle.vertices.data(), 3, triangle.indices.data(), 3, 0) == 0);
  legacy.RenderCompiledGeometry(0, {1, 2});
  legacy.ReleaseCompiledGeometry(0);

  Rml::TextureHandle texture = 91;
  Rml::Vector2i dimensions{1, 1};
  std::array<Rml::byte, 4> pixels{{0, 0, 0, 0}};
  assert(!legacy.LoadTexture(texture, dimensions, "missing.png"));
  assert(texture == 91 && dimensions == Rml::Vector2i(1, 1));
  assert(!legacy.GenerateTexture(texture, pixels.data(), dimensions));
  legacy.ReleaseTexture(texture);
  legacy.SetTransform(nullptr);
  CheckAdvancedDefaults(adapter);
}

void CheckCompiledSnapshots() {
  CaptureLegacyRenderer legacy;
  auto* adapter = legacy.GetAdaptedInterface();
  Triangle triangle;
  const auto original = triangle;
  const auto geometry =
      adapter->CompileGeometry(triangle.Vertices(), triangle.Indices());
  assert(geometry != 0);
  assert(legacy.compile_textures.empty());
  assert(triangle.vertices == original.vertices);
  triangle.vertices[0].position = {90, 90};
  triangle.indices[0] = 2;

  adapter->RenderGeometry(geometry, {7, 8}, 11);
  assert(legacy.captured_vertices[0].position == Rml::Vector2f(2, 3));
  assert(legacy.captured_vertices[0].colour ==
         Rml::ColourbPremultiplied(127, 63, 0, 128));
  assert(legacy.captured_vertices[1].colour ==
         Rml::ColourbPremultiplied(255, 255, 255, 0));
  assert(legacy.captured_vertices[2] == original.vertices[2]);
  assert((legacy.captured_indices == std::vector<int>{0, 1, 2}));

  adapter->RenderGeometry(geometry, {9, 10}, 11);
  adapter->RenderGeometry(geometry, {11, 12}, 12);
  assert((legacy.compile_textures == std::vector<Rml::TextureHandle>{11, 12}));
  assert((legacy.rendered_handles ==
          std::vector<Rml::CompiledGeometryHandle>{101, 101, 102}));
  assert(legacy.immediate_calls == 0);
  assert(legacy.last_translation == Rml::Vector2f(11, 12));

  adapter->ReleaseGeometry(geometry);
  std::sort(legacy.released_handles.begin(), legacy.released_handles.end());
  assert((legacy.released_handles ==
          std::vector<Rml::CompiledGeometryHandle>{101, 102}));
}

void CheckImmediateFallback() {
  CaptureLegacyRenderer legacy;
  legacy.compilation_succeeds = false;
  auto* adapter = legacy.GetAdaptedInterface();
  Triangle triangle;
  const auto geometry =
      adapter->CompileGeometry(triangle.Vertices(), triangle.Indices());
  adapter->RenderGeometry(geometry, {4, 5}, 13);
  adapter->RenderGeometry(geometry, {6, 7}, 13);

  assert((legacy.compile_textures == std::vector<Rml::TextureHandle>{13, 13}));
  assert(legacy.immediate_calls == 2 && legacy.rendered_handles.empty());
  assert(legacy.last_texture == 13);
  assert(legacy.last_translation == Rml::Vector2f(6, 7));
  assert(legacy.captured_vertices[0].position == Rml::Vector2f(2, 3));
  adapter->ReleaseGeometry(geometry);
  assert(
      (legacy.released_handles == std::vector<Rml::CompiledGeometryHandle>{0}));
}

void CheckTextureConversion() {
  CaptureLegacyRenderer legacy;
  auto* adapter = legacy.GetAdaptedInterface();
  Rml::Vector2i dimensions;
  assert(adapter->LoadTexture(dimensions, "assets/source.png") == 61);
  assert(dimensions == Rml::Vector2i(7, 9));
  assert(legacy.loaded_source == "assets/source.png");

  std::array<Rml::byte, 8> pixels{{64, 32, 0, 128, 0, 0, 0, 0}};
  const auto original = pixels;
  const Rml::Span<const Rml::byte> source(pixels.data(), pixels.size());
  assert(adapter->GenerateTexture(source, {2, 1}) == 62);
  assert(legacy.generated_dimensions == Rml::Vector2i(2, 1));
  assert((legacy.generated_pixels ==
          std::vector<Rml::byte>{127, 63, 0, 128, 255, 255, 255, 0}));
  assert(pixels == original);
  adapter->ReleaseTexture(61);
  adapter->ReleaseTexture(62);
  assert((legacy.released_textures == std::vector<Rml::TextureHandle>{61, 62}));

  legacy.texture_succeeds = false;
  assert(adapter->LoadTexture(dimensions, "failed.png") == 0);
  assert(adapter->GenerateTexture(source, {2, 1}) == 0);
}

void CheckScissorAndTransform() {
  CaptureLegacyRenderer legacy;
  auto* adapter = legacy.GetAdaptedInterface();
  adapter->EnableScissorRegion(true);
  adapter->SetScissorRegion(Rml::Rectanglei::FromPositionSize({2, 3}, {8, 6}));
  adapter->EnableClipMask(false);
  adapter->EnableClipMask(true);
  assert((legacy.scissor_enabled == std::vector<bool>{true, false, true}));

  Triangle triangle;
  const auto geometry =
      adapter->CompileGeometry(triangle.Vertices(), triangle.Indices());
  adapter->RenderToClipMask(Rml::ClipMaskOperation::Set, geometry, {7, -2});
  adapter->RenderToClipMask(
      Rml::ClipMaskOperation::Intersect, geometry, {-2, 3});
  assert((legacy.scissor_regions ==
          std::vector<std::array<int, 4>>{
              {2, 3, 8, 6}, {9, 1, 8, 6}, {0, 6, 8, 6}}));
  adapter->RenderToClipMask(
      Rml::ClipMaskOperation::SetInverse, geometry, {0, 0});
  assert(legacy.scissor_regions.size() == 3);

  const Rml::Matrix4f transform = Rml::Matrix4f::Identity();
  adapter->SetTransform(&transform);
  adapter->SetTransform(nullptr);
  assert((legacy.transforms ==
          std::vector<const Rml::Matrix4f*>{&transform, nullptr}));
  adapter->ReleaseGeometry(geometry);
}

}  // namespace

int main() {
  CheckModernDefaults();
  std::cout << "PASS native-render-interface-enums-and-optional-defaults\n";
  CheckLegacyDefaults();
  std::cout << "PASS native-legacy-defaults-and-owned-canonical-adapter\n";
  CheckCompiledSnapshots();
  std::cout << "PASS native-legacy-geometry-snapshot-and-per-texture-cache\n";
  CheckImmediateFallback();
  std::cout << "PASS native-legacy-immediate-fallback-and-compilation-retry\n";
  CheckTextureConversion();
  std::cout << "PASS native-legacy-texture-conversion-failure-and-release\n";
  CheckScissorAndTransform();
  std::cout
      << "PASS native-legacy-scissor-clip-limits-and-transform-forwarding\n";
}
