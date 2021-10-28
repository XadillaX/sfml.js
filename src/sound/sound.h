#ifndef SRC_SOUND_SOUND_H_
#define SRC_SOUND_SOUND_H_

#include <SFML/Audio/Sound.hpp>
#include <SFML/Audio/SoundBuffer.hpp>

#include "sound_buffer.h"
#include "sound_source.h"

namespace node_sfml {
namespace sound {

// TODO(XadillaX): SoundBuffer

class Sound : public SoundSource {
 public:
  static NAN_MODULE_INIT(Init);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(SetLoop);
  static NAN_METHOD(GetLoop);
  static NAN_METHOD(SetBuffer);

  inline const sf::Sound& sound() const { return sound_source<sf::Sound>(); }
  inline sf::Sound& sound() { return sound_source<sf::Sound>(); }

 private:
  Sound();
  explicit Sound(SoundBuffer* sound_buffer);
  virtual ~Sound();

 private:
  SoundBuffer* _sound_buffer;
  Nan::Persistent<v8::Object> _sound_buffer_object;
};

}  // namespace sound
}  // namespace node_sfml

#endif  // SRC_SOUND_SOUND_H_
