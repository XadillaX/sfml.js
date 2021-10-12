#include "rect.h"
#include "rect-inl.h"

namespace node_sfml {
namespace rect {

const char int_name[] = "IntRect";
NAN_MODULE_INIT(IntRect::Init) {
  Rect<int, int, v8::Int32>::Init<int_name>(target);
}

IntRect::~IntRect() {}

const char float_name[] = "FloatRect";
NAN_MODULE_INIT(FloatRect::Init) {
  Rect<float, double, v8::Number>::Init<float_name>(target);
}

FloatRect::~FloatRect() {}

}  // namespace rect
}  // namespace node_sfml
