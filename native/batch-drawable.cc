#include "batch-drawable.h"
#include "graphics-state.h"
#include "view-data.h"
#include "shape-state.h"

#include <bit>
#include <stdexcept>
#include <utility>

namespace sfmljs {

BatchDrawable::BatchDrawable(std::shared_ptr<GraphicsContext> context,
                             std::size_t capacity)
    : context_(std::move(context)), commands_(capacity) {
  retained_.reserve(capacity);
  textures_.reserve(capacity);
  buffers_.reserve(capacity);
  shaders_.reserve(capacity);
  shapes_.reserve(capacity);
}

BatchDrawable::~BatchDrawable() = default;

std::span<DrawCommand> BatchDrawable::Commands() noexcept {
  return commands_;
}

std::shared_ptr<VertexStorage> BatchDrawable::AllocateVertices(
    std::size_t capacity) {
  if (capacity > kMaxVertices) throw std::length_error("Vertex buffer too large");
  vertices_ = std::make_shared<VertexStorage>(capacity);
  return vertices_;
}

bool BatchDrawable::Submit(sf::RenderTarget& target, std::size_t count,
                           const sf::Texture* output) {
  if (count > commands_.size()) return false;
  // Reuse capacity, but release resource ownership on success, rejection, or
  // exception. A completed batch must not keep otherwise unused sprites alive.
  struct Release {
    std::vector<std::shared_ptr<SpriteState>>& retained;
    std::vector<std::shared_ptr<const sf::Texture>>& textures;
    std::vector<std::shared_ptr<VertexBufferState>>& buffers;
    std::vector<std::shared_ptr<ShaderState>>& shaders;
    std::vector<std::shared_ptr<ShapeState>>& shapes;
    std::size_t& count;
    ~Release() {
      count = 0;
      retained.clear();
      textures.clear();
      buffers.clear();
      shaders.clear();
      shapes.clear();
    }
  } release{retained_, textures_, buffers_, shaders_, shapes_, count_};
  retained_.resize(count);
  textures_.resize(count);
  buffers_.resize(count);
  shaders_.resize(count);
  shapes_.resize(count);
  // Resolve and validate the entire batch before changing the render target.
  for (std::size_t index = 0; index < count; ++index) {
    const auto& command = commands_[index];
    if (command.type == 0 || command.type == 2 || command.type == 3) continue;
    if (command.type == 5) {
      if (!ValidView(std::span(command.states.matrix).first<13>())) return false;
      continue;
    }
    if (!command.states.Valid()) return false;
    if (command.shaderId) {
      const auto found = context_->shaders.find(command.shaderId);
      if (found == context_->shaders.end()) return false;
      shaders_[index] = found->second.lock();
      if (!shaders_[index]) return false;
      for (const auto& [location, texture] : shaders_[index]->textures) {
        if (texture.get() == output) return false;
      }
    }
    if (command.type == 7) {
      const auto found = context_->shapes.find(command.argument);
      if (found == context_->shapes.end()) return false;
      shapes_[index] = found->second.lock();
      if (!shapes_[index]) return false;
      if (const auto id = command.payload[0]) {
        const auto texture = context_->textures.find(id);
        if (texture == context_->textures.end()) return false;
        textures_[index] = texture->second.lock();
        if (!textures_[index]) return false;
      }
    } else if (command.type == 1) {
      const auto found = context_->sprites.find(command.argument);
      if (found == context_->sprites.end()) return false;
      retained_[index] = found->second.lock();
      if (!retained_[index]) return false;
      const auto texture = context_->textures.find(command.sprite.textureId);
      if (texture == context_->textures.end()) return false;
      textures_[index] = texture->second.lock();
      if (!textures_[index]) return false;
    } else if (command.type == 4 || command.type == 6) {
      const auto first = command.payload[0];
      std::size_t size{};
      if (command.type == 4) {
        if (!vertices_) return false;
        size = vertices_->size();
      } else {
        const auto found = context_->vertexBuffers.find(command.payload[4]);
        if (found == context_->vertexBuffers.end()) return false;
        buffers_[index] = found->second.lock();
        if (!buffers_[index]) return false;
        size = buffers_[index]->getVertexCount();
      }
      if (first > size || command.argument > size - first ||
          command.payload[1] > 5 || command.payload[3] > 1) return false;
      if (const auto id = command.payload[2]) {
        const auto found = context_->textures.find(id);
        if (found == context_->textures.end()) return false;
        textures_[index] = found->second.lock();
        if (!textures_[index]) return false;
      }
    } else {
      return false;
    }
    if (textures_[index] && textures_[index].get() == output) return false;
  }
  count_ = count;
  if (count_ != 0) target.draw(*this);
  return true;
}

void BatchDrawable::draw(sf::RenderTarget& target, sf::RenderStates) const {
  for (std::size_t index = 0; index < count_; ++index) {
    const auto& command = commands_[index];
    if (command.type == 0) {
      target.clear(sf::Color(command.argument));
    } else if (command.type == 2) {
      target.clear(sf::Color(command.argument),
                   sf::StencilValue(command.states.stencil[2]));
    } else if (command.type == 3) {
      target.clearStencil(sf::StencilValue(command.argument));
    } else if (command.type == 5) {
      target.setView(MakeView(std::span(command.states.matrix).first<13>()));
    } else if (command.type == 7) {
      auto& object = *shapes_[index];
      struct Restore {
        ShapeState& object;
        ~Restore() { object.SyncShape(); }
      } restore{object};
      ApplyTransform(*object.shape, {0, 0, 0, 1, 1, 0, 0});
      ApplyShapeAppearance(*object.shape, textures_[index].get(),
          std::bit_cast<ShapeAppearance>(command.payload));
      auto states = command.states.Make();
      states.shader = shaders_[index] ? shaders_[index]->current.get() : nullptr;
      target.draw(*object.shape, states);
    } else if (command.type == 4 || command.type == 6) {
      if (command.argument == 0) continue;
      auto states = command.states.Make();
      states.shader = shaders_[index] ? shaders_[index]->current.get() : nullptr;
      states.texture = textures_[index].get();
      states.coordinateType = static_cast<sf::CoordinateType>(command.payload[3]);
      if (command.type == 4) {
        target.draw(vertices_->data() + command.payload[0], command.argument,
                    static_cast<sf::PrimitiveType>(command.payload[1]), states);
      } else {
        auto& buffer = *buffers_[index];
        struct Restore {
          sf::VertexBuffer& buffer;
          sf::PrimitiveType type;
          ~Restore() { buffer.setPrimitiveType(type); }
        } restore{buffer, buffer.getPrimitiveType()};
        buffer.setPrimitiveType(static_cast<sf::PrimitiveType>(command.payload[1]));
        target.draw(buffer, command.payload[0], command.argument, states);
      }
    } else {
      auto& object = *retained_[index];
      // Restore the latest staged state even if SFML throws during drawing.
      struct Restore {
        SpriteState& object;
        ~Restore() { object.SyncSprite(); }
      } restore{object};
      ApplyTransform(object, std::bit_cast<TransformableData>(command.payload));
      ApplyAppearance(object, *textures_[index], command.sprite);
      auto states = command.states.Make();
      states.shader = shaders_[index] ? shaders_[index]->current.get() : nullptr;
      target.draw(static_cast<const sf::Drawable&>(object), states);
    }
  }
}

}  // namespace sfmljs
