#ifndef SRC_FONT_H_
#define SRC_FONT_H_

#include <nan.h>
#include <SFML/Graphics.hpp>

namespace node_sfml {
namespace font {

class Font : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);

  inline const sf::Font& font() const { return *_font; }

 private:
  static NAN_METHOD(New);
  static NAN_METHOD(LoadFromFile);
  static NAN_METHOD(GetInfo);
  static NAN_METHOD(GetGlyph);
  static NAN_METHOD(GetKerning);
  static NAN_METHOD(GetLineSpacing);
  static NAN_METHOD(GetUnderlinePosition);
  static NAN_METHOD(GetUnderlineThickness);

 private:
  Font();
  explicit Font(const sf::Font& copy);
  virtual ~Font();

 private:
  sf::Font* _font;
};

}  // namespace font
}  // namespace node_sfml

#endif  // SRC_FONT_H_
