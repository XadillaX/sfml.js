#include "keyboard.h"

namespace node_sfml {
namespace gen {
extern void InitKeyCode();
}  // namespace gen

namespace keyboard {

NAN_MODULE_INIT(Init) {
  gen::InitKeyCode();
}

}  // namespace keyboard
}  // namespace node_sfml
