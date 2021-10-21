#include "drawable.h"

namespace node_sfml {
namespace drawable {

Drawable::Drawable() : _raw(nullptr) {}
Drawable::Drawable(sf::Drawable* raw) : _raw(raw) {}
Drawable::~Drawable() {
  if (_raw != nullptr) {
    delete _raw;
    _raw = nullptr;
  }
}

}  // namespace drawable
}  // namespace node_sfml
