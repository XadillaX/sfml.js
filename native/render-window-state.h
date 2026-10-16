#pragma once

#include "graphics-state.h"
#include "window-owner.h"

namespace sfmljs {

struct RenderWindowState : OwnedWindow<sf::RenderWindow> {
  explicit RenderWindowState(std::shared_ptr<GraphicsContext> context)
      : batch(std::move(context), 4096) {}

  bool Submit(std::size_t count, bool present) {
    if (!isOpen()) return true;
    if (!batch.Submit(*this, count, nullptr)) return false;
    if (present) display();
    return true;
  }

  BatchDrawable batch;
};

}  // namespace sfmljs
