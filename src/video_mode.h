#ifndef SRC_VIDEO_MODE_H_
#define SRC_VIDEO_MODE_H_

#include <nan.h>

#include <SFML/Window/VideoMode.hpp>

namespace node_sfml {
namespace video_mode {

class VideoMode : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);

  inline const sf::VideoMode& mode() const { return _mode; }
  inline sf::VideoMode& mode() { return _mode; }

 private:
  static NAN_METHOD(New);
  static NAN_METHOD(IsValid);
  static NAN_METHOD(SetProperty);
  static NAN_METHOD(GetProperty);

 private:
  VideoMode();
  VideoMode(sf::Uint32 mode_width,
            sf::Uint32 mode_height,
            sf::Uint32 mode_bits_per_pixel = 32);
  ~VideoMode();

 private:
  sf::VideoMode _mode;
};

}  // namespace video_mode
}  // namespace node_sfml

#endif  // SRC_VIDEO_MODE_H_
