#ifndef SRC_DRAWABLE_PACKAGE_PLUGIN_H_
#define SRC_DRAWABLE_PACKAGE_PLUGIN_H_

#include <nan.h>

namespace node_sfml {
namespace drawable {
namespace package_plugin_texture {

template <class T, class RAW_T>
inline void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

template <class T>
inline static NAN_METHOD(SetTexture);
template <class T>
inline static NAN_METHOD(SetTextureRect);
template <class T>
inline static NAN_METHOD(GetTexture);
template <class T>
inline static NAN_METHOD(GetTextureRect);

}  // namespace package_plugin_texture

namespace package_plugin_bounds {

template <class T>
inline void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

template <class T>
inline static NAN_METHOD(GetLocalBounds);
template <class T>
inline static NAN_METHOD(GetGlobalBounds);

}  // namespace package_plugin_bounds

namespace package_plugin_color_and_thickness {

template <class T>
inline void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

template <class T>
inline static NAN_METHOD(SetFillColor);
template <class T>
inline static NAN_METHOD(GetFillColor);

template <class T>
inline static NAN_METHOD(SetOutlineColor);
template <class T>
inline static NAN_METHOD(GetOutlineColor);

template <class T>
inline static NAN_METHOD(SetOutlineThickness);
template <class T>
inline static NAN_METHOD(GetOutlineThickness);

}  // namespace package_plugin_color_and_thickness
}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_PACKAGE_PLUGIN_H_
