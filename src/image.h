#ifndef SRC_IMAGE_H_
#define SRC_IMAGE_H_

#include <nan.h>

#include <SFML/Graphics/Image.hpp>

#include "base_class_with_loading.h"
#include "color.h"
#include "rect.h"

namespace node_sfml {
namespace image {

class Image : public Nan::ObjectWrap, public BaseClassWithLoading {
 public:
  static NAN_MODULE_INIT(Init);
  static v8::MaybeLocal<v8::Object> NewRealInstance(v8::Isolate* isolate);

 public:
  static NAN_METHOD(New);
  static NAN_METHOD(Create);
  static NAN_METHOD(Copy);
  static NAN_METHOD(LoadFromMemory);
  static NAN_METHOD(SaveToFile);
  static NAN_METHOD(GetSize);
  static NAN_METHOD(CreateMaskFromColor);
  static NAN_METHOD(SetPixel);
  static NAN_METHOD(GetPixel);
  static NAN_METHOD(DuplicatePixels);
  static NAN_METHOD(FlipHorizontally);
  static NAN_METHOD(FlipVertically);

  void SetInnerImage(const sf::Image& image);
  inline const sf::Image& image() const { return _image; }

 private:
  Image();

  inline void CreateFromColor(sf::Uint32 width,
                              sf::Uint32 height,
                              color::Color* color = nullptr);
  inline void CreateFromPixels(sf::Uint32 width,
                               sf::Uint32 height,
                               v8::Local<v8::Object> pixels);
  inline void CreateFromPixels(sf::Uint32 width,
                               sf::Uint32 height,
                               v8::Local<v8::ArrayBuffer> pixels,
                               size_t offset,
                               size_t length);
  inline void CreateFromPixels(sf::Uint32 width,
                               sf::Uint32 height,
                               v8::Local<v8::Array> pixels);
  inline void CreateFromPixels(sf::Uint32 width,
                               sf::Uint32 height,
                               const sf::Uint8* pixels,
                               size_t length);

  inline void Copy(const Image& src,
                   sf::Uint32 destX,
                   sf::Uint32 destY,
                   rect::IntRect* rect = nullptr,
                   bool apply_alpha = false);

 private:
  sf::Image _image;
};

}  // namespace image
}  // namespace node_sfml

#endif  // SRC_IMAGE_H_
