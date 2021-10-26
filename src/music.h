#ifndef SRC_MUSIC_H_
#define SRC_MUSIC_H_

#include <nan.h>

#include <SFML/Audio/Music.hpp>

namespace node_sfml {
namespace music {

class Music : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(OpenFromFile);
  static NAN_METHOD(OpenFromFileSync);

  static NAN_METHOD(Play);
  static NAN_METHOD(Pause);
  static NAN_METHOD(Stop);

  static NAN_METHOD(SetLoop);
  static NAN_METHOD(GetLoop);

  static NAN_METHOD(SetPitch);
  static NAN_METHOD(GetPitch);

  static NAN_METHOD(SetVolume);
  static NAN_METHOD(GetVolume);

  inline const sf::Music& music() const { return _music; }
  inline sf::Music& music() { return _music; }
  inline void SetLoading(bool loading) { _loading = loading; }

 private:
  Music();
  virtual ~Music();

 private:
  sf::Music _music;
  bool _loading;
};

}  // namespace music
}  // namespace node_sfml

#endif  // SRC_MUSIC_H_
