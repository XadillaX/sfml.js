#ifndef SRC_TOUCH_H_
#define SRC_TOUCH_H_

#include <nan.h>

#include <map>
#include <string>

#include <SFML/Window/Touch.hpp>

namespace node_sfml {

namespace touch {

NAN_MODULE_INIT(Init);

NAN_METHOD(IsDown);
NAN_METHOD(GetPosition);

}  // namespace touch
}  // namespace node_sfml

#endif  // SRC_TOUCH_H_
