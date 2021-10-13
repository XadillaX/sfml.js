#include "vector2.h"
#include "vector2-inl.h"

namespace node_sfml {
namespace vector2 {

template <typename T, typename NAN_T, class V8_T>
Nan::Persistent<v8::Function> Vector2<T, NAN_T, V8_T>::constructor;

template <typename T, typename NAN_T, class V8_T>
Nan::Persistent<v8::Function> Vector2<T, NAN_T, V8_T>::real_constructor;

const char int_name[] = "Vector2I";
NAN_MODULE_INIT(Vector2I::Init) {
  Vector2<int, int, v8::Int32>::Init<int_name>(target);
}

Vector2I::~Vector2I() {}

const char uint_name[] = "Vector2U";
NAN_MODULE_INIT(Vector2U::Init) {
  Vector2<sf::Uint32, sf::Uint32, v8::Number>::Init<uint_name>(target);
}

Vector2U::~Vector2U() {}

const char float_name[] = "Vector2F";
NAN_MODULE_INIT(Vector2F::Init) {
  Vector2<float, double, v8::Number>::Init<float_name>(target);
}

Vector2F::~Vector2F() {}

}  // namespace vector2
}  // namespace node_sfml
