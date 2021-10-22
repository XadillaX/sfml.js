#ifndef SRC_DRAWABLE_SHAPE_H_
#define SRC_DRAWABLE_SHAPE_H_

#include <SFML/Graphics/Transformable.hpp>
#include "drawable.h"

namespace node_sfml {
namespace drawable {

class Shape : public DrawableWithTexture {
 public:
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

  const sf::Shape& transformable() const {
    return *reinterpret_cast<sf::Shape*>(_raw);
  }

  sf::Shape& transformable() { return *reinterpret_cast<sf::Shape*>(_raw); }

  virtual void SetTexture(v8::Local<v8::Object> texture_object,
                          bool reset_rect = false);

 protected:
  static NAN_METHOD(GetPointCount);
  static NAN_METHOD(GetPoint);

  // TODO(XadillaX): More methods.

 protected:
  explicit Shape(sf::Shape* raw);
  inline virtual ~Shape() {}
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_SHAPE_H_
