#ifndef SRC_KEYBOARD_H_
#define SRC_KEYBOARD_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace gen {
extern std::map<int, std::string> keycode_itoa;
extern std::map<std::string, int> keycode_atoi;
}  // namespace gen

namespace keyboard {

NAN_MODULE_INIT(Init);

NAN_METHOD(IsKeyPressed);
NAN_METHOD(SetVirtualKeyboardVisible);

}  // namespace keyboard
}  // namespace node_sfml

#endif  // SRC_KEYBOARD_H_
