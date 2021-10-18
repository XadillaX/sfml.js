#ifndef SRC_DRAWABLE_TEXT_H_
#define SRC_DRAWABLE_TEXT_H_

#include "common_drawable.h"

namespace node_sfml {
namespace drawable {

class Text : public CommonDrawable<sf::Text> {
 public:
  static Nan::Persistent<v8::Function> constructor;

  static NAN_MODULE_INIT(Init);
  static void SetPrototype(v8::Local<v8::FunctionTemplate>* _tpl);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(SetString);
  static NAN_METHOD(SetFont);

  static NAN_METHOD(SetCharacterSize);
  static NAN_METHOD(SetLineSpacing);
  static NAN_METHOD(SetLetterSpacing);
  static NAN_METHOD(SetStyle);
  static NAN_METHOD(SetColor);

 private:
  Text();
  Text(const sf::String& string,
       v8::Local<v8::Object> font,
       unsigned int character_size = 30);
  virtual ~Text();

  void SetFont(v8::Local<v8::Object> font);

 private:
  Nan::Persistent<v8::Object> _font;
};

}  // namespace drawable
}  // namespace node_sfml

#endif  // SRC_DRAWABLE_TEXT_H_
