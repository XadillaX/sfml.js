#include "vertex.h"
#include "color.h"
#include "vector2-inl.h"

namespace node_sfml {
namespace vertex {

using v8::Function;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::MaybeLocal;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

const sf::Int32 Vertex::new_from_pointer_magic_number = -99999;
Nan::Persistent<v8::Function> real_constructor;

NAN_MODULE_INIT(Vertex::Init) {
  Local<String> name = Nan::New("Vertex").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

#define V(name, lowercase, snake_case, unwrap_type, inner_func)                \
  tpl->PrototypeTemplate()->SetAccessorProperty(                               \
      Nan::New(#snake_case).ToLocalChecked(),                                  \
      Nan::New<FunctionTemplate>(name##Getter),                                \
      Nan::New<FunctionTemplate>(name##Setter),                                \
      v8::PropertyAttribute::DontDelete);
  VERTEX_PROPERTIES(V);
#undef V

  Nan::SetPrototypeMethod(tpl, "syncFromJS", SyncFromJS);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();

  Nan::SetMethod(func, "setRealConstructor", SetRealConstructor);

  Nan::Set(target, name, func);
}

MaybeLocal<Object> Vertex::NewRealInstance(v8::Isolate* isolate,
                                           const sf::Vertex& vertex) {
  Nan::HandleScope scope;

  v8::Local<v8::Function> cons = real_constructor.Get(isolate);
  if (cons.IsEmpty()) {
    Nan::ThrowError("`real_constructor` is not set.");
    return v8::MaybeLocal<v8::Object>();
  }

  sf::Uint32 temp = reinterpret_cast<sf::Uint64>(&vertex);
  Local<Value> argv[] = {
      Nan::New(vertex::Vertex::new_from_pointer_magic_number),
      Nan::New(temp),
  };

  v8::MaybeLocal<v8::Object> maybe_ret =
      cons->NewInstance(isolate->GetCurrentContext(), 2, argv);
  return maybe_ret;
}

NAN_METHOD(Vertex::New) {
  if (info[0]->IsNumber()) {
    sf::Int32 magic_number = Nan::To<sf::Int32>(info[0]).FromJust();
    if (magic_number == new_from_pointer_magic_number) {
      sf::Uint32 ptr = Nan::To<sf::Int32>(info[1]).FromJust();
      sf::Vertex* vertex = reinterpret_cast<sf::Vertex*>(ptr);
      Vertex* ret = new Vertex(vertex);
      ret->Wrap(info.This());
      info.GetReturnValue().Set(info.This());
      return;
    }
  }

  Vertex* vertex = new Vertex(info[0], info[1], info[2]);
  vertex->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Vertex::SetRealConstructor) {
  Local<Function> func = info[0].As<Function>();
  real_constructor.Reset(func);
}

NAN_METHOD(Vertex::SyncFromJS) {
  Vertex* vertex = Nan::ObjectWrap::Unwrap<Vertex>(info.Holder());
  sf::Uint32 type = Nan::To<sf::Uint32>(info[0]).FromJust();
  if (type > SyncType::kAll) type = SyncType::kAll;
  vertex->SyncFromJS(static_cast<SyncType>(type));
}

#define V(name, lowercase, snake_case, unwrap_type, inner_func)                \
  NAN_METHOD(Vertex::name##Getter) {                                           \
    Vertex* vertex = Nan::ObjectWrap::Unwrap<Vertex>(info.Holder());           \
    info.GetReturnValue().Set(Nan::New<Object>(vertex->_##lowercase##_wrap));  \
    vertex->_vtx->snake_case = *vertex->_##lowercase;                          \
  }                                                                            \
                                                                               \
  NAN_METHOD(Vertex::name##Setter) {                                           \
    Local<Object> obj = info[0].As<Object>();                                  \
    unwrap_type* obj_unwrapped = Nan::ObjectWrap::Unwrap<unwrap_type>(obj);    \
                                                                               \
    Vertex* vertex = Nan::ObjectWrap::Unwrap<Vertex>(info.Holder());           \
    vertex->_##lowercase = &obj_unwrapped->inner_func();                       \
    vertex->_##lowercase##_wrap.Reset(obj);                                    \
    vertex->SyncFromJS(k##name);                                               \
  }

VERTEX_PROPERTIES(V);
#undef V

Vertex::Vertex(sf::Vertex* src) {
  _vtx =
      std::make_unique<sf::Vertex>(src->position, src->color, src->texCoords);

  Local<Object> temp =
      vector2::Vector2F::NewRealInstance(Isolate::GetCurrent(), _vtx->position)
          .ToLocalChecked();
  _position_wrap.Reset(temp);
  _position = &Nan::ObjectWrap::Unwrap<vector2::Vector2F>(temp)->vector2();

  temp = color::Color::NewRealColorInstance(Isolate::GetCurrent(),
                                            _vtx->color.toInteger())
             .ToLocalChecked();
  _color_wrap.Reset(temp);
  _color = &Nan::ObjectWrap::Unwrap<color::Color>(temp)->color();

  temp =
      vector2::Vector2F::NewRealInstance(Isolate::GetCurrent(), _vtx->texCoords)
          .ToLocalChecked();
  _tex_coords_wrap.Reset(temp);
  _tex_coords = &Nan::ObjectWrap::Unwrap<vector2::Vector2F>(temp)->vector2();
}

Vertex::Vertex(Local<Value> position,
               Local<Value> color,
               Local<Value> tex_coords) {
  if (position->IsUndefined()) {
    _vtx = std::make_unique<sf::Vertex>();
  } else {
    vector2::Vector2F* position_wrap =
        Nan::ObjectWrap::Unwrap<vector2::Vector2F>(position.As<Object>());
    if (color->IsUndefined()) {
      if (tex_coords->IsUndefined()) {
        vector2::Vector2F* tex_coords_wrap =
            Nan::ObjectWrap::Unwrap<vector2::Vector2F>(tex_coords.As<Object>());
        _vtx = std::make_unique<sf::Vertex>(position_wrap->vector2(),
                                            tex_coords_wrap->vector2());
      } else {
        _vtx = std::make_unique<sf::Vertex>(position_wrap->vector2());
      }
    } else {
      color::Color* color_wrap =
          Nan::ObjectWrap::Unwrap<color::Color>(color.As<Object>());
      if (tex_coords->IsUndefined()) {
        vector2::Vector2F* tex_coords_wrap =
            Nan::ObjectWrap::Unwrap<vector2::Vector2F>(tex_coords.As<Object>());
        _vtx = std::make_unique<sf::Vertex>(position_wrap->vector2(),
                                            color_wrap->color(),
                                            tex_coords_wrap->vector2());
      } else {
        _vtx = std::make_unique<sf::Vertex>(position_wrap->vector2(),
                                            color_wrap->color());
      }
    }
  }

  Local<Object> temp =
      vector2::Vector2F::NewRealInstance(Isolate::GetCurrent(), _vtx->position)
          .ToLocalChecked();
  _position_wrap.Reset(temp);
  _position = &Nan::ObjectWrap::Unwrap<vector2::Vector2F>(temp)->vector2();

  temp = color::Color::NewRealColorInstance(Isolate::GetCurrent(),
                                            _vtx->color.toInteger())
             .ToLocalChecked();
  _color_wrap.Reset(temp);
  _color = &Nan::ObjectWrap::Unwrap<color::Color>(temp)->color();

  temp =
      vector2::Vector2F::NewRealInstance(Isolate::GetCurrent(), _vtx->texCoords)
          .ToLocalChecked();
  _tex_coords_wrap.Reset(temp);
  _tex_coords = &Nan::ObjectWrap::Unwrap<vector2::Vector2F>(temp)->vector2();
}

Vertex::~Vertex() {
  _position_wrap.Reset();
  _color_wrap.Reset();
  _tex_coords_wrap.Reset();
}

}  // namespace vertex
}  // namespace node_sfml
