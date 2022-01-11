#ifndef SRC_JOYSTICK_H_
#define SRC_JOYSTICK_H_

#include <nan.h>

#include <map>
#include <string>

#include <SFML/Window/Joystick.hpp>

namespace node_sfml {
namespace gen {
extern std::map<int, std::string> joystick_axis_itoa;
extern std::map<std::string, int> joystick_axis_atoi;
}  // namespace gen

namespace joystick {

NAN_MODULE_INIT(Init);

NAN_METHOD(IsConnected);
NAN_METHOD(GetButtonCount);
NAN_METHOD(HasAxis);
NAN_METHOD(IsButtonPressed);
NAN_METHOD(GetAxisPosition);
NAN_METHOD(GetIdentification);
NAN_METHOD(Update);

}  // namespace joystick
}  // namespace node_sfml

#endif  // SRC_JOYSTICK_H_
