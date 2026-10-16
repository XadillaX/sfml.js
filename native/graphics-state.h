#pragma once

#include "batch-drawable.h"
#include "deferred-delete.h"
#include "texture-resource.h"
#include "transformable-state.h"

#include <SFML/Graphics/RenderTexture.hpp>
#include <SFML/Graphics/RenderWindow.hpp>
#include <SFML/Graphics/Shader.hpp>
#include <SFML/Graphics/Sprite.hpp>
#include <SFML/Graphics/Texture.hpp>
#include <SFML/Graphics/VertexBuffer.hpp>
#include <SFML/System/Clock.hpp>
#include <SFML/System/Vector2.hpp>
#include <SFML/Window/Event.hpp>

#include <array>
#include <cstddef>
#include <cstdint>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

namespace sfmljs {

static_assert(sizeof(sf::Vector2f) == 8);
static_assert(offsetof(sf::Vector2f, x) == 0);
static_assert(offsetof(sf::Vector2f, y) == 4);

struct SpriteState;
struct VertexBufferState;
struct ShaderState;
struct ShapeState;

// One context per JS module instance, retained by its native resources.
struct GraphicsContext {
  std::uint32_t nextId{1};
  std::unordered_map<std::uint32_t, std::weak_ptr<SpriteState>> sprites;
  std::unordered_map<std::uint32_t, std::weak_ptr<const sf::Texture>> textures;
  std::unordered_map<std::uint32_t, std::weak_ptr<VertexBufferState>> vertexBuffers;
  std::unordered_map<std::uint32_t, std::weak_ptr<ShaderState>> shaders;
  std::unordered_map<std::uint32_t, std::weak_ptr<ShapeState>> shapes;
};

struct ShaderState : sf::GlResource {
  using Lock = TransientContextLock;
  ShaderState(std::shared_ptr<GraphicsContext> context, std::uint32_t id)
      : context(std::move(context)), id(id) {}
  ~ShaderState() { context->shaders.erase(id); }
  std::shared_ptr<GraphicsContext> context;
  std::uint32_t id;
  std::shared_ptr<sf::Shader> current = std::make_shared<sf::Shader>();
  std::uint32_t programId{};
  std::unordered_map<int, std::shared_ptr<const sf::Texture>> textures;
};

struct VertexBufferState : sf::VertexBuffer {
  VertexBufferState(std::shared_ptr<GraphicsContext> context, std::uint32_t id,
                    sf::PrimitiveType type, Usage usage)
      : sf::VertexBuffer(type, usage), context(std::move(context)), id(id) {}
  ~VertexBufferState() { context->vertexBuffers.erase(id); }
  std::shared_ptr<GraphicsContext> context;
  std::uint32_t id;
};

struct TextureState : sf::Texture {
  TextureState(std::shared_ptr<GraphicsContext> context, std::uint32_t id)
      : context(std::move(context)), id(id) {}
  TextureState(std::shared_ptr<GraphicsContext> context, std::uint32_t id,
               const sf::Texture& source)
      : sf::Texture(source), context(std::move(context)), id(id) {}
  ~TextureState() { context->textures.erase(id); }
  std::shared_ptr<GraphicsContext> context;
  std::uint32_t id;
};

struct SpriteAppearance {
  std::uint32_t textureId{};
  sf::IntRect rectangle;
  std::uint32_t color{0xffffffff};
};
static_assert(sizeof(SpriteAppearance) == 24);
static_assert(offsetof(SpriteAppearance, rectangle) == 4);
static_assert(offsetof(SpriteAppearance, color) == 20);

inline void ApplyAppearance(sf::Sprite& sprite, const sf::Texture& texture,
                            const SpriteAppearance& appearance) {
  sprite.setTexture(texture);
  sprite.setTextureRect(appearance.rectangle);
  sprite.setColor(sf::Color(appearance.color));
}

struct SpriteState : sf::Sprite, TransformableState {
  SpriteState(std::shared_ptr<GraphicsContext> context,
              std::shared_ptr<const sf::Texture> texture, std::uint32_t id,
              std::uint32_t textureId)
      : sf::Sprite(*texture),
        TransformableState(static_cast<sf::Transformable*>(this)),
        context(std::move(context)), texture(std::move(texture)), id(id),
        appearance{textureId, getTextureRect(), 0xffffffff} {}

  ~SpriteState() { context->sprites.erase(id); }

  void SyncSprite() {
    Sync();
    ApplyAppearance(*this, *texture, appearance);
  }

  std::shared_ptr<GraphicsContext> context;
  std::shared_ptr<const sf::Texture> texture;
  std::uint32_t id;
  SpriteAppearance appearance;
};

// Explicit wire layout: no dependency on the C++ layout of RenderStates.
// Texture/coordinateType are in the vertex payload; shader ID follows sprite.
struct DrawStates {
  std::array<float, 16> matrix{};
  std::array<std::uint32_t, 6> blend{};
  std::array<std::uint32_t, 5> stencil{};

  bool Valid() const {
    return blend[0] <= 9 && blend[1] <= 9 && blend[2] <= 4 &&
           blend[3] <= 9 && blend[4] <= 9 && blend[5] <= 4 &&
           stencil[0] <= 7 && stencil[1] <= 5 && stencil[4] <= 1;
  }

  sf::RenderStates Make() const {
    sf::RenderStates result;
    result.transform = sf::Transform(
        matrix[0], matrix[4], matrix[12],
        matrix[1], matrix[5], matrix[13],
        matrix[3], matrix[7], matrix[15]);
    using F = sf::BlendMode::Factor;
    using E = sf::BlendMode::Equation;
    result.blendMode = sf::BlendMode(
        static_cast<F>(blend[0]), static_cast<F>(blend[1]),
        static_cast<E>(blend[2]), static_cast<F>(blend[3]),
        static_cast<F>(blend[4]), static_cast<E>(blend[5]));
    result.stencilMode = {
        static_cast<sf::StencilComparison>(stencil[0]),
        static_cast<sf::StencilUpdateOperation>(stencil[1]),
        sf::StencilValue(stencil[2]), sf::StencilValue(stencil[3]),
        stencil[4] != 0};
    return result;
  }
};

// 0: clear color, 1: sprite, 2: clear color+stencil, 3: clear stencil, 4: vertices.
// 5: set view (13 floats at states.matrix, remaining command fields unused).
// 6: GPU vertices (vertex payload followed by vertex buffer ID).
// 7: shape ID, ShapeAppearance in payload, combined matrix in states.
struct DrawCommand {
  std::uint32_t type{};
  std::uint32_t argument{};
  // Sprite: bit representation of TransformableData.
  // Vertices: first vertex, primitive type, texture ID, coordinate type.
  std::array<std::uint32_t, 7> payload{};
  DrawStates states{};
  SpriteAppearance sprite{};
  std::uint32_t shaderId{};
};
static_assert(sizeof(DrawCommand) == 172);
static_assert(offsetof(DrawCommand, argument) == 4);
static_assert(offsetof(DrawCommand, payload) == 8);
static_assert(offsetof(DrawCommand, states) == 36);
static_assert(offsetof(DrawCommand, sprite) == 144);
static_assert(offsetof(DrawCommand, shaderId) == 168);
static_assert(offsetof(DrawStates, blend) == 64);
static_assert(offsetof(DrawStates, stencil) == 88);

// Internal demo presentation, not the public RenderWindow binding.
struct PreviewWindow {
  sf::RenderWindow window;
  sf::Clock clock;
  std::uint32_t open{};
  std::uint32_t frames{};
  std::uint32_t intervalFrames{};

  void CloseBeforeThreadExit() {
    window.close();
    open = 0;
  }

  void Present(const sf::Texture& texture, std::size_t commandCount) {
    while (const auto event = window.pollEvent()) {
      const auto* key = event->getIf<sf::Event::KeyPressed>();
      if (event->is<sf::Event::Closed>() ||
          (key && key->code == sf::Keyboard::Key::Escape)) {
        window.close();
      }
    }
    open = window.isOpen() ? 1 : 0;
    if (!open) return;
    window.clear();
    window.draw(sf::Sprite(texture));
    window.display();
    ++frames;
    ++intervalFrames;
    const auto elapsed = clock.getElapsedTime().asSeconds();
    if (elapsed >= 1.f) {
      const auto fps = static_cast<unsigned>(intervalFrames / elapsed + 0.5f);
      window.setTitle("sfml.js | " + std::to_string(commandCount) +
                      " commands | " + std::to_string(fps) +
                      " FPS | 1 native submit/frame | Esc closes");
      intervalFrames = 0;
      clock.restart();
    }
  }
};

struct RenderTextureState {
  explicit RenderTextureState(std::shared_ptr<GraphicsContext> context,
                              std::size_t capacity)
      : context(std::move(context)), batch(this->context, capacity) {}

  ~RenderTextureState() {
    if (textureId) context->textures.erase(textureId);
  }

  bool Resize(sf::Vector2u size, const sf::ContextSettings& settings) {
    // Commit only after the texture and framebuffer are both ready.
    // Move assignment preserves the address of target's Texture subobject.
    sf::RenderTexture replacement;
    replacement.setRepeated(target.isRepeated());
    if (!replacement.resize(size, settings)) return false;
    target = std::move(replacement);
    initialized = true;
    targetSrgb = target.isSrgb();
    return true;
  }

  bool Submit(std::size_t count, bool display) {
    if (!batch.Submit(target, count, &target.getTexture())) return false;
    if (display) {
      target.display();
      if (preview) preview->Present(target.getTexture(), count);
    }
    return true;
  }

  std::shared_ptr<GraphicsContext> context;
  std::uint32_t textureId{};
  bool initialized{};
  bool targetSrgb{};
  sf::RenderTexture target;
  BatchDrawable batch;
  std::shared_ptr<PreviewWindow> preview;
};

}  // namespace sfmljs
