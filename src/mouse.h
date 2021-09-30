#ifndef SRC_MOUSE_H_
#define SRC_MOUSE_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace gen {
extern std::map<int, std::string> mouse_button_itoa;
extern std::map<std::string, int> mouse_button_atoi;
extern std::map<int, std::string> mouse_wheel_itoa;
extern std::map<std::string, int> mouse_wheel_atoi;
}  // namespace gen

namespace mouse {

NAN_MODULE_INIT(Init);

}  // namespace mouse
}  // namespace node_sfml

#endif  // SRC_MOUSE_H_
