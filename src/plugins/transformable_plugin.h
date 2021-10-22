#ifndef SRC_PLUGINS_TRANSFORMABLE_PLUGIN_H_
#define SRC_PLUGINS_TRANSFORMABLE_PLUGIN_H_

#include <nan.h>

namespace node_sfml {
namespace transformable {

template <class T>
inline void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

template <class T>
inline static NAN_METHOD(SetPosition);
template <class T>
inline static NAN_METHOD(GetPosition);

template <class T>
inline static NAN_METHOD(SetScale);
template <class T>
inline static NAN_METHOD(GetScale);

template <class T>
inline static NAN_METHOD(SetOrigin);
template <class T>
inline static NAN_METHOD(GetOrigin);

template <class T>
inline static NAN_METHOD(SetRotation);
template <class T>
inline static NAN_METHOD(GetRotation);

template <class T>
inline static NAN_METHOD(Move);
template <class T>
inline static NAN_METHOD(Scale);
template <class T>
inline static NAN_METHOD(Rotate);

}  // namespace transformable
}  // namespace node_sfml

#endif  // SRC_PLUGINS_TRANSFORMABLE_PLUGIN_H_
