#pragma once

#include "numeric-fields.h"

#include <SFML/Graphics/Image.hpp>

#include <cstdint>
#include <limits>
#include <memory>
#include <span>

namespace sfmljs {

SFMLJS_MEMBER(ImageSize, sf::Image, sf::Vector2u, m_size);

// Only the isolate thread reads/replaces current. Workers own private images.
struct ImageState {
  std::shared_ptr<sf::Image> current;
};

using ImageHandle = SharedHandle<ImageState>;

inline std::size_t ImageBytes(const sf::Image& image) {
  const auto size = image.getSize();
  return static_cast<std::size_t>(size.x) * size.y * 4;
}

inline bool ReadImageSize(v8::Local<v8::Value> width,
                          v8::Local<v8::Value> height, sf::Vector2u& size) {
  if (!width->IsUint32() || !height->IsUint32()) {
    Nan::ThrowRangeError("Expected unsigned integer image dimensions");
    return false;
  }
  size = {Nan::To<std::uint32_t>(width).FromJust(),
          Nan::To<std::uint32_t>(height).FromJust()};
  if (size.x != 0 &&
      size.y > node::Buffer::kMaxLength / 4 / size.x) {
    Nan::ThrowRangeError("Image dimensions exceed the pixel buffer limit");
    return false;
  }
  return true;
}

inline bool ReadImageBytes(v8::Local<v8::Value> value,
                           std::span<const std::uint8_t>& bytes) {
  if (!value->IsUint8Array()) {
    Nan::ThrowTypeError("Expected bytes in a Uint8Array");
    return false;
  }
  const auto view = value.As<v8::Uint8Array>();
  const auto buffer = view->Buffer();
  const auto backing = buffer->GetBackingStore();
  if (buffer->WasDetached() || backing->IsShared()) {
    Nan::ThrowTypeError("Expected an attached, fixed, non-shared byte buffer");
    return false;
  }
#if V8_MAJOR_VERSION >= 11
  if (backing->IsResizableByUserJavaScript()) {
    Nan::ThrowTypeError("Expected a fixed byte buffer");
    return false;
  }
#endif
  Nan::TypedArrayContents<std::uint8_t> data(value);
  bytes = {*data, view->ByteLength()};
  return true;
}

inline v8::Local<v8::Object> MapImage(v8::Isolate* isolate,
                                     const std::shared_ptr<sf::Image>& image) {
  const auto& size = Field<ImageSize>(*image);
  const auto bytes = ImageBytes(*image);
  auto result = Nan::New<v8::Object>();
  // sf::Image is mutable; only its public pointer accessor is const-qualified.
  // A view owns this specific allocation, never the replaceable ImageState.
  auto buffer = bytes == 0 ? v8::ArrayBuffer::New(isolate, 0)
      : MapShared(isolate, image,
          const_cast<std::uint8_t*>(image->getPixelsPtr()), bytes);
  Nan::Set(result, Nan::New("buffer").ToLocalChecked(), buffer).FromJust();
  Nan::Set(result, Nan::New("info").ToLocalChecked(), NumericFields()
      .Add("width", size.x).Add("height", size.y).Map(image)).FromJust();
  return result;
}

inline v8::Local<v8::Object> MapImageResource(
    v8::Isolate* isolate, std::shared_ptr<sf::Image> image) {
  auto result = MapImage(isolate, image);
  auto state = std::make_shared<ImageState>(ImageState{std::move(image)});
  Nan::Set(result, Nan::New("handle").ToLocalChecked(),
           ImageHandle::Create(std::move(state))).FromJust();
  return result;
}

}  // namespace sfmljs
