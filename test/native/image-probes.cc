#include "../../native/image-state.h"

#include <chrono>

namespace {

using sfmljs::ImageHandle;
using sfmljs::SharedHandle;
using WeakImage = SharedHandle<std::weak_ptr<sf::Image>>;

NAN_METHOD(ReadImagePixels) {
  auto* handle = ImageHandle::From(info[0]);
  if (!handle) return;
  const auto& image = *handle->owner()->current;
  const auto bytes = sfmljs::ImageBytes(image);
  if (bytes > std::numeric_limits<std::uint32_t>::max()) {
    return Nan::ThrowRangeError("Image too large for the readback probe");
  }
  info.GetReturnValue().Set(Nan::CopyBuffer(
      bytes ? reinterpret_cast<const char*>(image.getPixelsPtr()) : "",
      static_cast<std::uint32_t>(bytes)).ToLocalChecked());
}

NAN_METHOD(ImageSharesPixels) {
  auto* handle = ImageHandle::From(info[0]);
  if (!handle) return;
  std::span<const std::uint8_t> pixels;
  if (!sfmljs::ReadImageBytes(info[1], pixels)) return;
  info.GetReturnValue().Set(
      pixels.data() == handle->owner()->current->getPixelsPtr() &&
      pixels.size() == sfmljs::ImageBytes(*handle->owner()->current));
}

NAN_METHOD(SetImagePixel) {
  auto* handle = ImageHandle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsUint32() || !info[2]->IsUint32() || !info[3]->IsUint32()) {
    return Nan::ThrowTypeError("Expected pixel coordinates and RGBA integer");
  }
  const sf::Vector2u coords{Nan::To<std::uint32_t>(info[1]).FromJust(),
                            Nan::To<std::uint32_t>(info[2]).FromJust()};
  auto& image = *handle->owner()->current;
  const auto size = image.getSize();
  if (coords.x >= size.x || coords.y >= size.y) {
    return Nan::ThrowRangeError("Pixel outside image");
  }
  image.setPixel(coords, sf::Color(Nan::To<std::uint32_t>(info[3]).FromJust()));
}

NAN_METHOD(ObserveImage) {
  auto* handle = ImageHandle::From(info[0]);
  if (handle) {
    info.GetReturnValue().Set(WeakImage::Create(
        std::make_shared<std::weak_ptr<sf::Image>>(handle->owner()->current)));
  }
}

NAN_METHOD(ImageExpired) {
  auto* handle = WeakImage::From(info[0]);
  if (handle) info.GetReturnValue().Set(handle->owner()->expired());
}

// C++ loop baseline, separate from the production NAN wrappers.
NAN_METHOD(BenchmarkImageBulk) {
  auto* dest = ImageHandle::From(info[0]);
  if (!dest) return;
  auto* source = ImageHandle::From(info[1]);
  if (!source) return;
  if (!info[2]->IsUint32() || !info[3]->IsUint32()) {
    return Nan::ThrowTypeError("Expected benchmark operation and count");
  }
  const auto operation = Nan::To<std::uint32_t>(info[2]).FromJust();
  const auto count = Nan::To<std::uint32_t>(info[3]).FromJust();
  if (operation > 3 || dest->owner()->current == source->owner()->current) {
    return Nan::ThrowRangeError("Expected a valid operation and distinct images");
  }
  auto& image = *dest->owner()->current;
  const auto start = std::chrono::steady_clock::now();
  for (std::uint32_t i = 0; i < count; ++i) {
    switch (operation) {
      case 0: image.flipHorizontally(); break;
      case 1: image.flipVertically(); break;
      case 2: image.createMaskFromColor(sf::Color::Red, 0); break;
      case 3:
        if (!image.copy(*source->owner()->current, {0, 0})) {
          return Nan::ThrowError("Benchmark copy failed");
        }
        break;
    }
  }
  const auto elapsed = std::chrono::duration<double, std::milli>(
      std::chrono::steady_clock::now() - start).count();
  info.GetReturnValue().Set(elapsed);
}

}  // namespace

NAN_MODULE_INIT(InitializeImageProbes) {
  Nan::SetMethod(target, "readImagePixels", ReadImagePixels);
  Nan::SetMethod(target, "imageSharesPixels", ImageSharesPixels);
  Nan::SetMethod(target, "setImagePixel", SetImagePixel);
  Nan::SetMethod(target, "observeImage", ObserveImage);
  Nan::SetMethod(target, "imageExpired", ImageExpired);
  Nan::SetMethod(target, "benchmarkImageBulk", BenchmarkImageBulk);
}
