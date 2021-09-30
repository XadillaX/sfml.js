#include <nan.h>

#include "color.h"
#include "keyboard.h"
#include "mouse.h"
#include "render_window.h"
#include "time.h"
#include "video_mode.h"

#include "drawable/circle_shape.h"

namespace node_sfml {

void Init(v8::Local<v8::Object> target) {
  keyboard::Init(target);
  mouse::Init(target);

  color::Color::Init(target);
  render_window::RenderWindow::Init(target);
  time::Time::Init(target);
  video_mode::VideoMode::Init(target);

  // drawable
  drawable::CircleShape::Init(target);
}

}  // namespace node_sfml

NODE_MODULE(sfml, node_sfml::Init)
