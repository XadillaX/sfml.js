#include "vertex_array.h"
#include "../color.h"
#include "../rect-inl.h"
#include "../vector2-inl.h"
#include "../vertex.h"
#include "drawable-inl.h"

namespace node_sfml {
namespace drawable {

using v8::Function;
using v8::FunctionTemplate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;
using v8::Uint32;
using v8::Value;

const char vertex_array_name[] = "VertexArray";
Nan::Persistent<v8::Function> VertexArray::constructor;

NAN_MODULE_INIT(VertexArray::Init) {
  Drawable::Init<VertexArray, vertex_array_name>(target);

  // Set PrimitiveType enumerations
  {
    Local<Object> style = Nan::New<Object>();

#define SET_PRIMITIVE_TYPE(V)                                                  \
  V(Points)                                                                    \
  V(Lines)                                                                     \
  V(LineStrip)                                                                 \
  V(Triangles)                                                                 \
  V(TriangleStrip)                                                             \
  V(TriangleFan)                                                               \
  V(Quads)                                                                     \
  V(LinesStrip)                                                                \
  V(TrianglesStrip)                                                            \
  V(TrianglesFan)

#define SET_PER_PRIMITIVE_TYPE(name)                                           \
  Nan::Set(style,                                                              \
           Nan::New(#name).ToLocalChecked(),                                   \
           Nan::New(sf::PrimitiveType::name));

    SET_PRIMITIVE_TYPE(SET_PER_PRIMITIVE_TYPE)

#undef SET_PER_PRIMITIVE_TYPE
#undef SET_PRIMITIVE_TYPE

    Nan::Set(target, Nan::New("PrimitiveType").ToLocalChecked(), style);
  }
}

void VertexArray::SetPrototype(Local<FunctionTemplate>* _tpl) {
  v8::Local<v8::FunctionTemplate>& tpl = *_tpl;

  Nan::SetPrototypeMethod(tpl, "getVertexCount", GetVertexCount);
  Nan::SetPrototypeMethod(tpl, "duplicateVertex", DuplicateVertex);
  Nan::SetPrototypeMethod(tpl, "setVertex", SetVertex);
  Nan::SetPrototypeMethod(tpl, "setPosition", SetPosition);
  Nan::SetPrototypeMethod(tpl, "setColor", SetColor);
  Nan::SetPrototypeMethod(tpl, "setTexCoords", SetTexCoords);

  Nan::SetPrototypeMethod(tpl, "clear", Clear);
  Nan::SetPrototypeMethod(tpl, "resize", Resize);
  Nan::SetPrototypeMethod(tpl, "append", Append);
  Nan::SetPrototypeMethod(tpl, "setPrimitiveType", SetPrimitiveType);
  Nan::SetPrototypeMethod(tpl, "getPrimitiveType", GetPrimitiveType);
  Nan::SetPrototypeMethod(tpl, "getBounds", GetBounds);
}

NAN_METHOD(VertexArray::New) {
  if (info.Length() == 0) {
    VertexArray* text = new VertexArray();
    text->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
    return;
  }

  sf::Uint32 type = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::Uint32 vertex_count = Nan::To<sf::Uint32>(info[1]).FromJust();

  VertexArray* text =
      new VertexArray(static_cast<sf::PrimitiveType>(type), vertex_count);
  text->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(VertexArray::GetVertexCount) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  Local<Uint32> vertex_count = Nan::New<Uint32>(
      static_cast<sf::Uint32>(va->raw<sf::VertexArray>().getVertexCount()));
  info.GetReturnValue().Set(vertex_count);
}

NAN_METHOD(VertexArray::Clear) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  va->raw<sf::VertexArray>().clear();
}

NAN_METHOD(VertexArray::Resize) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  sf::Uint32 size = Nan::To<sf::Uint32>(info[0]).FromJust();
  va->raw<sf::VertexArray>().resize(size);
}

NAN_METHOD(VertexArray::SetPrimitiveType) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  sf::Uint32 type = Nan::To<sf::Uint32>(info[0]).FromJust();
  if (type > sf::PrimitiveType::TrianglesFan) {
    Nan::ThrowRangeError("Invalid primivite type.");
  }

  va->raw<sf::VertexArray>().setPrimitiveType(
      static_cast<sf::PrimitiveType>(type));
}

NAN_METHOD(VertexArray::GetPrimitiveType) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  info.GetReturnValue().Set(va->raw<sf::VertexArray>().getPrimitiveType());
}

NAN_METHOD(VertexArray::GetBounds) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  sf::FloatRect rect = va->raw<sf::VertexArray>().getBounds();

  Nan::TryCatch try_catch;
  v8::MaybeLocal<v8::Value> maybe_rect =
      rect::FloatRect::NewRealInstance(info.GetIsolate());
  if (try_catch.HasCaught()) {
    try_catch.ReThrow();
    return;
  }

  v8::Local<v8::Object> node_rect = maybe_rect.ToLocalChecked().As<Object>();
  sf::FloatRect& ret =
      Nan::ObjectWrap::Unwrap<rect::FloatRect>(node_rect)->rect();
  ret.top = rect.top;
  ret.left = rect.left;
  ret.width = rect.width;
  ret.height = rect.height;

  info.GetReturnValue().Set(node_rect);
}

NAN_METHOD(VertexArray::Append) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  sf::VertexArray& raw = va->raw<sf::VertexArray>();

  vertex::Vertex* vertex =
      Nan::ObjectWrap::Unwrap<vertex::Vertex>(info[0].As<Object>());
  raw.append(vertex->vertex());
}

NAN_METHOD(VertexArray::DuplicateVertex) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());

  sf::Uint32 idx = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::VertexArray& raw = va->raw<sf::VertexArray>();
  if (idx >= raw.getVertexCount()) {
    Nan::ThrowRangeError("Index out of VertexArray's range.");
    return;
  }

  const sf::Vertex& vertex = raw[idx];

  Nan::TryCatch try_catch;
  MaybeLocal<Value> maybe_ret =
      vertex::Vertex::NewRealInstance(info.GetIsolate(), vertex);
  if (maybe_ret.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(maybe_ret.ToLocalChecked());
}

NAN_METHOD(VertexArray::SetVertex) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  sf::Uint32 idx = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::VertexArray& raw = va->raw<sf::VertexArray>();

  if (idx >= raw.getVertexCount()) {
    Nan::ThrowRangeError("Index out of VertexArray's range.");
    return;
  }

  vertex::Vertex* vertex =
      Nan::ObjectWrap::Unwrap<vertex::Vertex>(info[1].As<Object>());
  raw[idx] = vertex->vertex();
}

NAN_METHOD(VertexArray::SetPosition) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  sf::Uint32 idx = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::VertexArray& raw = va->raw<sf::VertexArray>();

  if (idx >= raw.getVertexCount()) {
    Nan::ThrowRangeError("Index out of VertexArray's range.");
    return;
  }

  vector2::Vector2F* vec =
      Nan::ObjectWrap::Unwrap<vector2::Vector2F>(info[1].As<Object>());
  raw[idx].position = vec->vector2();
}

NAN_METHOD(VertexArray::SetColor) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  sf::Uint32 idx = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::VertexArray& raw = va->raw<sf::VertexArray>();

  if (idx >= raw.getVertexCount()) {
    Nan::ThrowRangeError("Index out of VertexArray's range.");
    return;
  }

  color::Color* clr =
      Nan::ObjectWrap::Unwrap<color::Color>(info[1].As<Object>());
  raw[idx].color = clr->color();
}

NAN_METHOD(VertexArray::SetTexCoords) {
  VertexArray* va = Nan::ObjectWrap::Unwrap<VertexArray>(info.Holder());
  sf::Uint32 idx = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::VertexArray& raw = va->raw<sf::VertexArray>();

  if (idx >= raw.getVertexCount()) {
    Nan::ThrowRangeError("Index out of VertexArray's range.");
    return;
  }

  vector2::Vector2F* vec =
      Nan::ObjectWrap::Unwrap<vector2::Vector2F>(info[1].As<Object>());
  raw[idx].texCoords = vec->vector2();
}

VertexArray::VertexArray() : Drawable(new sf::VertexArray()) {}

VertexArray::VertexArray(sf::PrimitiveType type, size_t vertex_count)
    : Drawable(new sf::VertexArray(type, vertex_count)) {}

VertexArray::~VertexArray() {}

}  // namespace drawable
}  // namespace node_sfml
