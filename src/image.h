#ifndef SRC_IMAGE_H_
#define SRC_IMAGE_H_

#include <nan.h>

#include <SFML/Graphics/Image.hpp>

namespace node_sfml {
namespace image {

class Image : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);
  static v8::MaybeLocal<v8::Object> NewRealInstance(v8::Isolate* isolate);

 public:
  static NAN_METHOD(New);

  void SetInnerImage(const sf::Image& image);
  inline const sf::Image& image() const { return _image; }

 private:
  Image();

 private:
  sf::Image _image;
};

}  // namespace image
}  // namespace node_sfml

#endif  // SRC_IMAGE_H_
