#ifndef SRC_DRAWABLE_DRAWABLE_INL_H_
#define SRC_DRAWABLE_DRAWABLE_INL_H_

#include "drawable.h"

namespace node_sfml {
namespace drawable {

template <class Self, const char* class_name>
inline NAN_MODULE_INIT(Drawable::Init) {
  v8::Local<v8::String> name = Nan::New(class_name).ToLocalChecked();
  v8::Local<v8::FunctionTemplate> tpl =
      Nan::New<v8::FunctionTemplate>(Self::New);

  Self::SetPrototype(&tpl);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  v8::Local<v8::Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  Self::constructor.Reset(func);

  Nan::Set(target, name, func);
}

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_DRAWABLE_INL_H_
