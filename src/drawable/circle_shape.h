#ifndef SRC_DRAWABLE_CIRCLE_SHAPE_H_
#define SRC_DRAWABLE_CIRCLE_SHAPE_H_

#include "shape.h"

namespace node_sfml {
namespace drawable {

class CircleShape : public Shape<sf::CircleShape> {
 public:
  static NAN_MODULE_INIT(Init);

 public:
  static NAN_METHOD(New);

 private:
  explicit CircleShape(float radius = 0, size_t point_count = 30);
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_CIRCLE_SHAPE_H_
