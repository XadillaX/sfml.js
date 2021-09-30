#include <map>
#include <string>

namespace node_sfml {
namespace gen {

std::map<int, std::string> mouse_button_itoa;
std::map<std::string, int> mouse_button_atoi;
std::map<int, std::string> mouse_wheel_itoa;
std::map<std::string, int> mouse_wheel_atoi;

void InitMouseButton() {
  mouse_button_itoa[0] = "Left";
  mouse_button_atoi["Left"] = 0;
  mouse_button_itoa[1] = "Right";
  mouse_button_atoi["Right"] = 1;
  mouse_button_itoa[2] = "Middle";
  mouse_button_atoi["Middle"] = 2;
  mouse_button_itoa[3] = "XButton1";
  mouse_button_atoi["XButton1"] = 3;
  mouse_button_itoa[4] = "XButton2";
  mouse_button_atoi["XButton2"] = 4;
  mouse_wheel_itoa[0] = "VerticalWheel";
  mouse_wheel_atoi["VerticalWheel"] = 0;
  mouse_wheel_itoa[1] = "HorizontalWheel";
  mouse_wheel_atoi["HorizontalWheel"] = 1;
}

}  // namespace gen
}  // namespace node_sfml
