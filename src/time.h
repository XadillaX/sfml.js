#ifndef SRC_TIME_H_
#define SRC_TIME_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace time {

class Time : public Nan::ObjectWrap {
  enum NewTimeType {
    kSeconds = 0,
    kMilliseconds,
    kMicroseconds,
    kCount,
  };

 public:
  static NAN_MODULE_INIT(Init);

 private:
  static NAN_METHOD(New);
  static NAN_METHOD(AsSeconds);
  static NAN_METHOD(AsMilliseconds);
  static NAN_METHOD(AsMicroseconds);

 private:
  Time();
  explicit Time(const sf::Time& src);
  ~Time();

 private:
  sf::Time _time;
};

}  // namespace time
}  // namespace node_sfml

#endif  // SRC_TIME_H_
