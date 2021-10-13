#include "rect.h"
#include "rect-inl.h"

namespace node_sfml {
namespace rect {

template <typename T, typename NAN_T, class V8_T>
Nan::Persistent<v8::Function> Rect<T, NAN_T, V8_T>::constructor;

template <typename T, typename NAN_T, class V8_T>
Nan::Persistent<v8::Function> Rect<T, NAN_T, V8_T>::real_constructor;

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
