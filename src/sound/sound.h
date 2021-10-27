#ifndef SRC_SOUND_SOUND_H_
#define SRC_SOUND_SOUND_H_

#include <SFML/Audio/Sound.hpp>
#include <SFML/Audio/SoundBuffer.hpp>

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

  inline const sf::Sound& sound() const { return sound_source<sf::Sound>(); }
  inline sf::Sound& sound() { return sound_source<sf::Sound>(); }

 private:
  Sound();
  explicit Sound(const std::shared_ptr<sf::SoundBuffer>& sound_buffer);
  virtual ~Sound();

 private:
  // Should store sound buffer by self because `sf::Sound` only holds its
  // pointer.
  std::shared_ptr<sf::SoundBuffer> _sfml_sound_buffer;
  // TODO(XadillaX): SoundBuffer object of JavaScript should be attached here
  // also.
};

}  // namespace sound
}  // namespace node_sfml

#endif  // SRC_SOUND_SOUND_H_
