#ifndef SRC_CLOCK_H_
#define SRC_CLOCK_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace clock {

class Clock : public Nan::ObjectWrap, sf::Clock {
 public:
  static NAN_MODULE_INIT(Init);

 private:
  static NAN_METHOD(New);
  static NAN_METHOD(GetElapsedTime);
  static NAN_METHOD(Restart);

 private:
  Clock();
  ~Clock();
};

}  // namespace clock
}  // namespace node_sfml

#endif  // SRC_CLOCK_H_
