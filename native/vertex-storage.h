#pragma once

#include <SFML/Graphics/Vertex.hpp>

#include <cstddef>
#include <memory>
#include <vector>

namespace sfmljs {

// Every slot contains a live sf::Vertex. Never resize a mapped allocation:
// wrappers, member handles and buffers may outlive the array's current storage.
using VertexStorage = std::vector<sf::Vertex>;
inline constexpr std::size_t kMaxVertices = 0x7fffffff / sizeof(sf::Vertex);
static_assert(sizeof(sf::Vertex) == 20);
static_assert(offsetof(sf::Vertex, position) == 0);
static_assert(offsetof(sf::Vertex, color) == 8);
static_assert(offsetof(sf::Vertex, texCoords) == 12);

}  // namespace sfmljs
