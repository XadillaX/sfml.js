#include <nan.h>

#include "clock.h"
#include "color.h"
#include "font.h"
#include "image.h"
#include "joystick.h"
#include "keyboard.h"
#include "mouse.h"
#include "rect.h"
#include "render_window.h"
#include "sensor.h"
#include "texture.h"
#include "time.h"
#include "touch.h"
#include "vector2.h"
#include "vector3.h"
#include "vertex.h"
#include "video_mode.h"

#include "drawable/circle_shape.h"
#include "drawable/convex_shape.h"
#include "drawable/rectangle_shape.h"
#include "drawable/sprite.h"
#include "drawable/text.h"
#include "drawable/vertex_array.h"

#include "sound/music.h"
#include "sound/sound.h"
#include "sound/sound_buffer.h"
#include "sound/sound_source.h"

namespace node_sfml {

void Init(v8::Local<v8::Object> target) {
  keyboard::Init(target);
  mouse::Init(target);
  joystick::Init(target);
  sensor::Init(target);
  touch::Init(target);

  clock::Clock::Init(target);
  color::Color::Init(target);
  font::Font::Init(target);
  image::Image::Init(target);
  render_window::RenderWindow::Init(target);
  texture::Texture::Init(target);
  time::Time::Init(target);
  vertex::Vertex::Init(target);
  video_mode::VideoMode::Init(target);

  // drawable
  drawable::CircleShape::Init(target);
  drawable::ConvexShape::Init(target);
  drawable::RectangleShape::Init(target);
  drawable::Sprite::Init(target);
  drawable::Text::Init(target);
  drawable::VertexArray::Init(target);

  // sound
  sound::Music::Init(target);
  sound::Sound::Init(target);
  sound::SoundBuffer::Init(target);

  // rect
  rect::IntRect::Init(target);
  rect::FloatRect::Init(target);

  // vector2
  vector2::Vector2I::Init(target);
  vector2::Vector2U::Init(target);
  vector2::Vector2F::Init(target);

  // vector3
  vector3::Vector3I::Init(target);
  vector3::Vector3U::Init(target);
  vector3::Vector3F::Init(target);

  node::AddEnvironmentCleanupHook(
      target->GetIsolate(), sound::SoundSource::AtExit, nullptr);
}

}  // namespace node_sfml

NODE_MODULE(sfml, node_sfml::Init)
