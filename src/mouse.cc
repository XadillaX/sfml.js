#include "mouse.h"

namespace node_sfml {
namespace gen {
extern void InitMouseButton();
}  // namespace gen

namespace mouse {

NAN_MODULE_INIT(Init) {
  gen::InitMouseButton();
}

}  // namespace mouse
}  // namespace node_sfml
