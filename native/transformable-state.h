#pragma once

#include "shared-handle.h"

#include <SFML/Graphics/Transformable.hpp>

#include <array>
#include <cstddef>

namespace sfmljs {

// position.xy, rotation (radians), scale.xy, origin.xy.
using TransformableData = std::array<float, 7>;
static_assert(sizeof(TransformableData) == 28);

inline void ApplyTransform(sf::Transformable& object,
                           const TransformableData& values) {
  object.setPosition({values[0], values[1]});
  object.setRotation(sf::radians(values[2]));
  object.setScale({values[3], values[4]});
  object.setOrigin({values[5], values[6]});
}

// SharedHandle aliases this base while retaining the complete concrete owner.
struct TransformableState {
  explicit TransformableState(sf::Transformable* object) : object(object) {}

  void Sync() { ApplyTransform(*object, values); }

  sf::Transformable* object;
  TransformableData values{0, 0, 0, 1, 1, 0, 0};
};

struct TransformableObject : sf::Transformable, TransformableState {
  TransformableObject()
      : TransformableState(static_cast<sf::Transformable*>(this)) {}
};

inline v8::Local<v8::Object> TransformableHandle(
    const std::shared_ptr<TransformableState>& owner) {
  return SharedHandle<TransformableState>::Create(owner);
}

}  // namespace sfmljs
