#include <nan.h>

#include "clock.h"
#include "color.h"
#include "keyboard.h"
#include "mouse.h"
#include "rect.h"
#include "render_window.h"
#include "time.h"
#include "vector2.h"
#include "video_mode.h"

#include "drawable/circle_shape.h"
#include "drawable/rectangle_shape.h"

namespace node_sfml {

void Init(v8::Local<v8::Object> target) {
  keyboard::Init(target);
  mouse::Init(target);

  clock::Clock::Init(target);
  color::Color::Init(target);
  render_window::RenderWindow::Init(target);
  time::Time::Init(target);
  video_mode::VideoMode::Init(target);

  // drawable
  drawable::CircleShape::Init(target);
  drawable::RectangleShape::Init(target);

  // rect
  rect::IntRect::Init(target);
  rect::FloatRect::Init(target);

  // vector2
  vector2::Vector2I::Init(target);
  vector2::Vector2U::Init(target);
  vector2::Vector2F::Init(target);
}

}  // namespace node_sfml

NODE_MODULE(sfml, node_sfml::Init)
