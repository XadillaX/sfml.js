#ifndef SRC_VERTEX_H_
#define SRC_VERTEX_H_

#include <nan.h>

#include <SFML/Config.hpp>
#include <SFML/Graphics/Vertex.hpp>

namespace node_sfml {
namespace vertex {

#define VERTEX_PROPERTIES(V)                                                   \
  V(Position, position, position, vector2::Vector2F, vector2)                  \
  V(Color, color, color, color::Color, color)                                  \
  V(TexCoords, tex_coords, texCoords, vector2::Vector2F, vector2)

class Vertex : public Nan::ObjectWrap {
 public:
  static const sf::Int32 new_from_pointer_magic_number;

  enum SyncType {
    kPosition,
    kColor,
    kTexCoords,
    kAll,
  };

  static v8::MaybeLocal<v8::Object> NewRealInstance(v8::Isolate* isolate,
                                                    const sf::Vertex& vertex);

 public:
  static NAN_MODULE_INIT(Init);

  static NAN_METHOD(SetRealConstructor);

 public:
  inline void SyncFromJS(SyncType type = kAll) {
    switch (type) {
      case kPosition:
        _vtx->position = *_position;
        break;
      case kColor:
        _vtx->color = *_color;
        break;
      case kTexCoords:
        _vtx->texCoords = *_tex_coords;
        break;
      case kAll:
      default:
        _vtx->position = *_position;
        _vtx->color = *_color;
        _vtx->texCoords = *_tex_coords;
        break;
    }

    printf("%d synced.\n", type);
  }

  inline void SyncToJS(SyncType type = kAll) {
    switch (type) {
      case kPosition:
        *_position = _vtx->position;
        break;
      case kColor:
        *_color = _vtx->color;
        break;
      case kTexCoords:
        *_tex_coords = _vtx->texCoords;
        break;
      case kAll:
      default:
        *_position = _vtx->position;
        *_color = _vtx->color;
        *_tex_coords = _vtx->texCoords;
        break;
    }
  }

  inline sf::Vertex& vertex() {
    SyncFromJS();
    return *_vtx;
  }

  static NAN_METHOD(New);
  static NAN_METHOD(SyncFromJS);

#define V(name, lowercase, snake_case, unwrap_type, inner_func)                \
  static NAN_METHOD(name##Getter);                                             \
  static NAN_METHOD(name##Setter);

  VERTEX_PROPERTIES(V);
#undef V

 private:
  explicit Vertex(sf::Vertex* src);
  Vertex(v8::Local<v8::Value> position = Nan::Undefined(),
         v8::Local<v8::Value> color = Nan::Undefined(),
         v8::Local<v8::Value> tex_coords = Nan::Undefined());
  ~Vertex();

 private:
  std::unique_ptr<sf::Vertex> _vtx;

  Nan::Persistent<v8::Object> _position_wrap;
  Nan::Persistent<v8::Object> _color_wrap;
  Nan::Persistent<v8::Object> _tex_coords_wrap;

  sf::Vector2f* _position;
  sf::Color* _color;
  sf::Vector2f* _tex_coords;
};

}  // namespace vertex
}  // namespace node_sfml

#endif  // SRC_VERTEX_H_
