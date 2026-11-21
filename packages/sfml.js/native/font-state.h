#ifndef PACKAGES_SFML_JS_NATIVE_FONT_STATE_H_
#define PACKAGES_SFML_JS_NATIVE_FONT_STATE_H_

#include "graphics-state.h"
#include <SFML/Graphics/Font.hpp>

namespace sfmljs {

struct FontData {
  // The memory stream inside Font borrows these bytes.
  std::shared_ptr<std::vector<std::uint8_t>> bytes;
  sf::Font font;
};

struct FontState {
  std::shared_ptr<GraphicsContext> context;
  std::shared_ptr<FontData> current;
};
using FontHandle = SharedHandle<FontState>;

struct FontAtlas {
  std::shared_ptr<GraphicsContext> context;
  std::shared_ptr<FontData> font;
  std::uint32_t id;
  ~FontAtlas() { context->textures.erase(id); }
};

}  // namespace sfmljs

#endif  // PACKAGES_SFML_JS_NATIVE_FONT_STATE_H_
