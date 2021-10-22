#ifndef SRC_CLOCK_H_
#define SRC_CLOCK_H_

#include <nan.h>
#include <SFML/System/Clock.hpp>

namespace node_sfml {
namespace clock {

class Clock : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);

 private:
  static NAN_METHOD(New);
  static NAN_METHOD(GetElapsedTime);
  static NAN_METHOD(Restart);

 private:
  Clock();
  ~Clock();

 private:
  sf::Clock _clock;
};

}  // namespace clock
}  // namespace node_sfml

#endif  // SRC_CLOCK_H_
