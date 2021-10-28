#ifndef SRC_SOUND_MUSIC_H_
#define SRC_SOUND_MUSIC_H_

#include <SFML/Audio/Music.hpp>

#include "../base_class_with_loading.h"
#include "sound_source.h"

namespace node_sfml {
namespace sound {

class Music : public SoundSource, public BaseClassWithLoading {
 public:
  static NAN_MODULE_INIT(Init);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(OpenFromFile);
  static NAN_METHOD(OpenFromFileSync);
  static NAN_METHOD(SetLoop);
  static NAN_METHOD(GetLoop);

  inline const sf::Music& music() const { return sound_source<sf::Music>(); }
  inline sf::Music& music() { return sound_source<sf::Music>(); }

 private:
  Music();
  virtual ~Music();
};

}  // namespace sound
}  // namespace node_sfml

#endif  // SRC_SOUND_MUSIC_H_
