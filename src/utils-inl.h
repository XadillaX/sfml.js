#ifndef SRC_UTILS_INL_H_
#define SRC_UTILS_INL_H_

#include "utils.h"

namespace node_sfml {

template <typename T, typename NAN_T, class V8_T>
inline bool ParseParameters(Nan::NAN_METHOD_ARGS_TYPE info,
                            size_t parameter_count,
                            T* val) {
  v8::MaybeLocal<V8_T> maybe;
  for (size_t i = 0; i < parameter_count; i++) {
    maybe = Nan::To<V8_T>(info[i]);
    if (maybe.IsEmpty()) {
      Nan::ThrowError("Invalid parameter type.");
      return false;
    }

    NAN_T v = Nan::To<NAN_T>(maybe.ToLocalChecked()).FromJust();
    val[i] = static_cast<T>(v);
  }

  return true;
}

}  // namespace node_sfml

#endif  // SRC_UTILS_INL_H_
