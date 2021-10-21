#include "common_drawable.h"
#include "common_drawable-inl.h"

namespace node_sfml {
namespace drawable {

CommonDrawable1::CommonDrawable1() : Drawable() {}
CommonDrawable1::CommonDrawable1(sf::Drawable* raw) : Drawable(raw) {}

CommonDrawable2::CommonDrawable2() : CommonDrawable1() {}
CommonDrawable2::CommonDrawable2(sf::Drawable* raw) : CommonDrawable1(raw) {}

}  // namespace drawable
}  // namespace node_sfml
