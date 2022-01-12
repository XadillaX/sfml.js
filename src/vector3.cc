#include "vector3.h"
#include "vector3-inl.h"

namespace node_sfml {
namespace vector3 {

template <typename T, typename NAN_T, class V8_T>
Nan::Persistent<v8::Function> Vector3<T, NAN_T, V8_T>::constructor;

template <typename T, typename NAN_T, class V8_T>
Nan::Persistent<v8::Function> Vector3<T, NAN_T, V8_T>::real_constructor;

const char int_name[] = "Vector3I";
NAN_MODULE_INIT(Vector3I::Init) {
  Vector3<int, int, v8::Int32>::Init<Vector3I, int_name>(target);
}

Vector3I::~Vector3I() {}

const char uint_name[] = "Vector3U";
NAN_MODULE_INIT(Vector3U::Init) {
  Vector3<sf::Uint32, sf::Uint32, v8::Uint32>::Init<Vector3U, uint_name>(
      target);
}

Vector3U::~Vector3U() {}

const char float_name[] = "Vector3F";
NAN_MODULE_INIT(Vector3F::Init) {
  Vector3<float, double, v8::Number>::Init<Vector3F, float_name>(target);
}

Vector3F::~Vector3F() {}

}  // namespace vector3
}  // namespace node_sfml
