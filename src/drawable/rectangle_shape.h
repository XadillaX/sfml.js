#ifndef SRC_DRAWABLE_RECTANGLE_SHAPE_H_
#define SRC_DRAWABLE_RECTANGLE_SHAPE_H_

#include "shape.h"

namespace node_sfml {
namespace drawable {

class RectangleShape : public Shape<sf::RectangleShape> {
 public:
  static NAN_MODULE_INIT(Init);

 public:
  static NAN_METHOD(New);

 private:
  explicit RectangleShape(const sf::Vector2f& size);
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_RECTANGLE_SHAPE_H_
