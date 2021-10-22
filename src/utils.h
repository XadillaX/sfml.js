#ifndef SRC_UTILS_H_
#define SRC_UTILS_H_

#include <nan.h>

#include <SFML/System/String.hpp>

namespace node_sfml {

template <typename T, typename NAN_T, class V8_T>
inline bool ParseParameters(Nan::NAN_METHOD_ARGS_TYPE info,
                            size_t parameter_count,
                            T* val);

inline void V8StringToSFString(v8::Isolate* isolate,
                               v8::Local<v8::String> v8_string,
                               sf::String* sf_string);

}  // namespace node_sfml

#endif  // SRC_UTILS_H_
