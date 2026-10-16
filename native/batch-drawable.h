#pragma once

#include "vertex-storage.h"

#include <SFML/Graphics/Drawable.hpp>

#include <cstddef>
#include <memory>
#include <span>
#include <vector>

namespace sf { class Texture; }

namespace sfmljs {

struct DrawCommand;
struct GraphicsContext;
struct SpriteState;
struct VertexBufferState;
struct ShaderState;
struct ShapeState;

// One reusable native drawable per render target. JS records into its fixed
// command storage; submission never calls back into JS.
class BatchDrawable final : public sf::Drawable {
 public:
  BatchDrawable(std::shared_ptr<GraphicsContext> context, std::size_t capacity);
  ~BatchDrawable() override;

  // The mapped command storage and owning batch must remain at stable addresses.
  BatchDrawable(const BatchDrawable&) = delete;
  BatchDrawable& operator=(const BatchDrawable&) = delete;
  BatchDrawable(BatchDrawable&&) = delete;
  BatchDrawable& operator=(BatchDrawable&&) = delete;

  std::span<DrawCommand> Commands() noexcept;
  std::shared_ptr<VertexStorage> AllocateVertices(std::size_t capacity);
  bool Submit(sf::RenderTarget& target, std::size_t count,
              const sf::Texture* output);

 private:
  // Recorded leaf states are complete snapshots. This internal drawable is
  // submitted with default outer states, not used as a public scene object.
  void draw(sf::RenderTarget& target, sf::RenderStates) const override;

  std::shared_ptr<GraphicsContext> context_;
  std::vector<DrawCommand> commands_;
  std::vector<std::shared_ptr<SpriteState>> retained_;
  std::vector<std::shared_ptr<const sf::Texture>> textures_;
  std::vector<std::shared_ptr<VertexBufferState>> buffers_;
  std::vector<std::shared_ptr<ShaderState>> shaders_;
  std::vector<std::shared_ptr<ShapeState>> shapes_;
  std::shared_ptr<VertexStorage> vertices_;
  std::size_t count_{};
};

}  // namespace sfmljs
