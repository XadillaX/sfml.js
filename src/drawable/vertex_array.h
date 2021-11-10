#ifndef SRC_DRAWABLE_VERTEX_ARRAY_H_
#define SRC_DRAWABLE_VERTEX_ARRAY_H_

#include <SFML/Graphics/VertexArray.hpp>
#include <SFML/System/String.hpp>

#include "drawable.h"

namespace node_sfml {
namespace drawable {

class VertexArray : public Drawable {
 public:
  static Nan::Persistent<v8::Function> constructor;

  static NAN_MODULE_INIT(Init);
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 public:
  static NAN_METHOD(New);

  static NAN_METHOD(Clear);
  static NAN_METHOD(Resize);
  static NAN_METHOD(Append);
  static NAN_METHOD(SetPrimitiveType);
  static NAN_METHOD(GetPrimitiveType);

  static NAN_METHOD(GetVertexCount);
  static NAN_METHOD(GetBounds);

  static NAN_METHOD(DuplicateVertex);
  static NAN_METHOD(SetVertex);
  static NAN_METHOD(SetPosition);
  static NAN_METHOD(SetColor);
  static NAN_METHOD(SetTexCoords);

 private:
  VertexArray();
  VertexArray(sf::PrimitiveType type, size_t vertex_count);
  virtual ~VertexArray();
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_VERTEX_ARRAY_H_
