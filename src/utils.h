#ifndef SRC_UTILS_H_
#define SRC_UTILS_H_

#include <nan.h>

namespace node_sfml {

template <typename T, typename NAN_T, class V8_T>
inline bool ParseParameters(Nan::NAN_METHOD_ARGS_TYPE info,
                            size_t parameter_count,
                            T* val);

}  // namespace node_sfml

#endif  // SRC_UTILS_H_
