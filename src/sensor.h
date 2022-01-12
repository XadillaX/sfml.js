#ifndef SRC_sensor_H_
#define SRC_sensor_H_

#include <nan.h>

#include <map>
#include <string>

#include <SFML/Window/sensor.hpp>

namespace node_sfml {
namespace gen {
extern std::map<int, std::string> sensor_type_itoa;
extern std::map<std::string, int> sensor_type_atoi;
}  // namespace gen

namespace sensor {

NAN_MODULE_INIT(Init);

NAN_METHOD(IsAvailable);
NAN_METHOD(SetEnabled);
NAN_METHOD(GetValue);

}  // namespace sensor
}  // namespace node_sfml

#endif  // SRC_sensor_H_
