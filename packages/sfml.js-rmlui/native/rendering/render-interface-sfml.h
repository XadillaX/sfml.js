// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_RENDER_INTERFACE_SFML_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_RENDER_INTERFACE_SFML_H_

#include <RmlUi/Core/Dictionary.h>
#include <RmlUi/Core/RenderInterface.h>

#include <cstddef>
#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#include "native/data/rmlui-data-diagnostics.h"
#include "native/rendering/effects/filter-record.h"
#include "native/rendering/shaders/shader-record.h"
#include <SFML/Graphics/RenderTexture.hpp>
#include <SFML/Graphics/RenderWindow.hpp>
#include <SFML/Graphics/Shader.hpp>
#include <SFML/Graphics/VertexBuffer.hpp>
#include <SFML/Graphics/View.hpp>

namespace sfmlrmlui {

// Immutable Native geometry. Solo and stencil draws acquire a VBO lazily;
// compatible runs upload their combined vertices without redundant solo VBOs.
struct CompiledGeometryRecord {
  std::vector<sf::Vertex> vertices;
  std::shared_ptr<sf::VertexBuffer> buffer;
  std::size_t vertex_count{0};
  uint64_t serial{0};
  bool queued{false};
};

// Retain immutable mask geometry so each SFML target can rebuild its stencil.
struct ClipMaskCommand {
  Rml::ClipMaskOperation operation;
  std::shared_ptr<sf::VertexBuffer> buffer;
  Rml::Matrix4f transform;
  Rml::Vector2f translation;
  bool scissor_enabled;
  Rml::Rectanglei scissor_region;
};

// Offscreen render target backing an RmlUi layer handle.
struct LayerResource {
  std::unique_ptr<sf::RenderTexture> target;
  uint64_t serial{0};
};

// SFML-backed compiled geometry, scissor, stencil masks, layer compositing,
// all ten built-in filters, readable base-layer sessions and custom shader
// decorators, including gradients and creation with full homogeneous
// transforms.
class RenderInterfaceSFML final : public Rml::RenderInterface {
 public:
  // A standalone native renderer owns its counters. The runtime can supply
  // borrowed counters and callback depth for its lifetime without V8 coupling.
  explicit RenderInterfaceSFML(DataDiagnostics* diagnostics = nullptr,
                               const unsigned* callback_depth = nullptr)
      : diagnostics_(diagnostics ? diagnostics : &owned_diagnostics_),
        callback_depth_(callback_depth) {}

  // A context frame owns a transparent layer zero. End presents only on
  // success; rollback discards its pixels and restores the host view/state.
  void BeginFrame();
  void EndFrame();
  void RollbackFrame() noexcept;
  bool HasActiveFrame() const;

  // Only context traversal may defer draws. Every JS callback and state
  // mutation submits the current run before exposing its effects.
  void BeginBatchRendering();
  void EndBatchRendering();
  void FlushGeometry();
  // Preloading uploads once. Core handles share ownership through counted
  // leases while explicit cache eviction leaves existing handles untouched.
  bool PreloadTexture(const std::string& source, const sf::Image& image);
  void ClearPreloadedTextures(const std::string* source);
  void SetWindow(sf::RenderWindow* window);
  // Queries never dereference untrusted handles. Serials prevent pool reuse
  // from making a previously popped layer token valid again.
  uint64_t GetLayerSerial(Rml::LayerHandle layer) const;
  Rml::LayerHandle GetActiveLayer() const;

  Rml::CompiledGeometryHandle CompileGeometry(
      Rml::Span<const Rml::Vertex> vertices,
      Rml::Span<const int> indices) override;
  void RenderGeometry(Rml::CompiledGeometryHandle geometry,
                      Rml::Vector2f translation,
                      Rml::TextureHandle texture) override;
  void ReleaseGeometry(Rml::CompiledGeometryHandle geometry) override;

  Rml::TextureHandle LoadTexture(Rml::Vector2i& texture_dimensions,
                                 const Rml::String& source) override;
  Rml::TextureHandle GenerateTexture(Rml::Span<const Rml::byte> source,
                                     Rml::Vector2i source_dimensions) override;
  void ReleaseTexture(Rml::TextureHandle texture) override;

  void EnableScissorRegion(bool enable) override;
  void SetScissorRegion(Rml::Rectanglei region) override;
  void SetTransform(const Rml::Matrix4f* transform) override;

  void EnableClipMask(bool enable) override;
  void RenderToClipMask(Rml::ClipMaskOperation operation,
                        Rml::CompiledGeometryHandle geometry,
                        Rml::Vector2f translation) override;

  Rml::LayerHandle PushLayer() override;
  void CompositeLayers(
      Rml::LayerHandle source,
      Rml::LayerHandle destination,
      Rml::BlendMode blend_mode,
      Rml::Span<const Rml::CompiledFilterHandle> filters) override;
  void PopLayer() override;
  Rml::TextureHandle SaveLayerAsTexture() override;
  Rml::CompiledFilterHandle SaveLayerAsMaskImage() override;

  Rml::CompiledFilterHandle CompileFilter(
      const Rml::String& name, const Rml::Dictionary& parameters) override;
  void ReleaseFilter(Rml::CompiledFilterHandle filter) override;

  Rml::CompiledShaderHandle CompileShader(
      const Rml::String& name, const Rml::Dictionary& parameters) override;
  void RenderShader(Rml::CompiledShaderHandle shader,
                    Rml::CompiledGeometryHandle geometry,
                    Rml::Vector2f translation,
                    Rml::TextureHandle texture) override;
  void ReleaseShader(Rml::CompiledShaderHandle shader) override;

 private:
  DataDiagnostics& Diagnostics() { return *diagnostics_; }
  bool InCallback() const { return callback_depth_ && *callback_depth_ != 0; }

  DataDiagnostics owned_diagnostics_;
  DataDiagnostics* diagnostics_;
  const unsigned* callback_depth_;

  struct BatchKey {
    uint64_t serial;
    sf::Vector2f translation;
    size_t vertex_count;
    bool operator==(const BatchKey&) const = default;
  };

  struct BatchCommand {
    CompiledGeometryRecord* geometry;
    BatchKey key;
  };

  struct BatchCache {
    std::unique_ptr<sf::VertexBuffer> buffer;
    std::vector<BatchKey> keys;
    size_t vertex_capacity{0};
    size_t Bytes() const;
  };

  bool EnsureSoloBuffer(CompiledGeometryRecord* record);
  void DrawBuffer(const sf::VertexBuffer& buffer,
                  size_t count,
                  Rml::Vector2f translation,
                  const sf::Texture* texture,
                  const sf::Shader* shader,
                  bool homogeneous = false);
  bool UploadBatch(BatchCache* cache);
  BatchCache* AcquireBatchCache();
  sf::RenderTarget* ActiveTarget();
  sf::Vector2u ActiveTargetSize() const;
  void ApplyView(sf::RenderTarget* target);
  void WithoutScissor(const std::function<void()>& draw);
  void DrawGeometry(CompiledGeometryRecord* record,
                    Rml::Vector2f translation,
                    const sf::Texture* texture,
                    const sf::Shader* shader,
                    bool homogeneous = false);
  sf::StencilMode ApplyClipMask(sf::RenderTarget* target);
  void NormalizeClipMask(sf::RenderTarget* target);

  std::unique_ptr<LayerResource> AcquireLayer(sf::Vector2u size);
  void RecycleLayer(std::unique_ptr<LayerResource> layer) noexcept;
  sf::RenderTexture* LayerTarget(Rml::LayerHandle layer);
  void RestoreFrameState() noexcept;

  sf::RenderTexture* PostTarget(int index);
  void EnsurePostTargets(sf::Vector2u size);
  void BlitFullscreen(const sf::Texture& source,
                      sf::RenderTarget* destination,
                      const sf::BlendMode& blend,
                      const sf::Shader* shader);
  void ApplyFilters(Rml::Span<const Rml::CompiledFilterHandle> filters,
                    const sf::Texture* source,
                    sf::Vector2u size);
  void BlitPostRegion(const sf::Texture& source,
                      sf::RenderTexture* destination,
                      Rml::Rectanglei source_bounds,
                      Rml::Rectanglei destination_bounds,
                      Rml::Rectanglei write_bounds,
                      const sf::BlendMode& blend = sf::BlendNone,
                      const sf::Shader* shader = nullptr);
  void BlurCurrent(float sigma,
                   sf::Vector2u size,
                   Rml::Rectanglei bounds,
                   int temporary);
  Rml::TextureHandle CaptureLayerRegion(const Rml::Rectanglei& bounds);

  sf::RenderWindow* window_{nullptr};
  sf::Transform transform_{sf::Transform::Identity};
  Rml::Matrix4f matrix_{Rml::Matrix4f::Identity()};
  bool transform_enabled_{false};
  uint64_t geometry_serial_{0};
  bool batch_rendering_{false};
  const sf::Texture* batch_texture_{nullptr};
  size_t batch_vertices_{0};
  std::vector<BatchCommand> batch_commands_;
  std::vector<sf::Vertex> batch_staging_;
  std::vector<BatchCache> batch_cache_;
  BatchCache batch_overflow_;
  size_t batch_cache_cursor_{0};
  size_t batch_cache_bytes_{0};
  struct TextureLease {
    std::shared_ptr<sf::Texture> texture;
    size_t count{0};
  };
  std::unordered_map<std::string, std::shared_ptr<sf::Texture>>
      preloaded_textures_;
  std::unordered_map<sf::Texture*, TextureLease> preloaded_texture_leases_;

  bool scissor_enabled_{false};
  Rml::Rectanglei scissor_region_{};

  bool stencil_available_{false};
  bool clip_mask_enabled_{false};
  unsigned int mask_reference_{0};
  std::vector<ClipMaskCommand> clip_commands_;
  sf::RenderTarget* mask_target_{nullptr};

  std::vector<std::unique_ptr<LayerResource>> layer_stack_;
  std::vector<std::unique_ptr<LayerResource>> layer_pool_;
  uint64_t layer_serial_{0};

  struct FrameState {
    sf::View host_view;
    sf::Transform transform;
    Rml::Matrix4f matrix;
    bool transform_enabled;
    bool scissor_enabled;
    Rml::Rectanglei scissor_region;
    bool clip_mask_enabled;
    unsigned int mask_reference;
    std::vector<ClipMaskCommand> clip_commands;
  };

  std::unique_ptr<sf::RenderTexture> base_target_;
  std::unique_ptr<FrameState> frame_state_;

  // Three targets preserve the unblurred source when building a shadow.
  std::unique_ptr<sf::RenderTexture> post_targets_[3];
  int post_current_{0};

  // Reuse the pinned fullscreen triangle endpoints across blur passes.
  sf::VertexBuffer blur_geometry_{sf::PrimitiveType::Triangles,
                                  sf::VertexBuffer::Usage::Static};
  bool blur_geometry_ready_{false};

  sf::Shader blur_shader_;
  sf::Shader geometry_color_shader_;
  sf::Shader geometry_texture_shader_;
  sf::Shader drop_shadow_shader_;
  sf::Shader mask_shader_;
  sf::Shader color_filter_shader_;
  sf::Shader post_copy_shader_;
  // Apple's software texture interpolation is unstable across reused targets.
  bool manual_post_sampling_{false};
  bool shaders_ready_{false};

  std::vector<std::unique_ptr<FilterRecord>> filters_;
  std::vector<std::unique_ptr<ShaderRecord>> shaders_;
};

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_RENDER_INTERFACE_SFML_H_
