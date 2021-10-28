#ifndef SRC_SOUND_SOUND_BUFFER_H_
#define SRC_SOUND_SOUND_BUFFER_H_

#include <nan.h>
#include <SFML/Audio/SoundBuffer.hpp>

namespace node_sfml {
namespace sound {

class SoundBuffer : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(LoadFromMemory);
  static NAN_METHOD(LoadFromSamples);
  static NAN_METHOD(DuplicateSamples);

  static NAN_METHOD(GetSampleCount);
  static NAN_METHOD(GetSampleRate);
  static NAN_METHOD(GetChannelCount);
  static NAN_METHOD(GetDuration);

  static NAN_METHOD(SaveToFile);

  inline const sf::SoundBuffer& sound_buffer() const { return _sound_buffer; }
  inline sf::SoundBuffer& sound_buffer() { return _sound_buffer; }

 private:
  SoundBuffer();
  explicit SoundBuffer(const char* buff, size_t len);
  virtual ~SoundBuffer();

  inline bool LoadFromMemory(const char* buff, size_t len);

 private:
  sf::SoundBuffer _sound_buffer;
};

}  // namespace sound
}  // namespace node_sfml

#endif  // SRC_SOUND_SOUND_BUFFER_H_
