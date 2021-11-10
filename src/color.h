#ifndef SRC_COLOR_H_
#define SRC_COLOR_H_

#include <nan.h>
#include <SFML/Graphics/Color.hpp>

namespace node_sfml {
namespace color {

#define RGBAProperties(V)                                                      \
  V(Red, r)                                                                    \
  V(Green, g)                                                                  \
  V(Blue, b)                                                                   \
  V(Alpha, a)

class Color : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);
  static v8::MaybeLocal<v8::Object> NewRealColorInstance(v8::Isolate* isolate,
                                                         sf::Uint32 val);

  inline const sf::Color& color() const { return *_color; }
  inline sf::Color& color() { return *_color; }

 private:
  static NAN_METHOD(New);
  static NAN_METHOD(ToInteger);

#define V(name, lowercase)                                                     \
  static NAN_METHOD(name##Getter);                                             \
  static NAN_METHOD(name##Setter);

  RGBAProperties(V);
#undef V

 private:
  Color();
  explicit Color(sf::Uint32 color);
  Color(sf::Uint8 red, sf::Uint8 green, sf::Uint8 blue, sf::Uint8 alpha = 255);
  virtual ~Color();

 private:
  sf::Color* _color;
};

}  // namespace color
}  // namespace node_sfml

#endif  // SRC_COLOR_H_
