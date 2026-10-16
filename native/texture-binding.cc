#include "graphics-state.h"
#include "exception-boundary.h"
#include "image-state.h"

#include <SFML/Window/Context.hpp>
#define GL_SILENCE_DEPRECATION
#include <SFML/OpenGL.hpp>

#include <exception>
#include <limits>

namespace {

using TextureHandle = sfmljs::SharedHandle<sf::Texture>;
using ContextHandle = sfmljs::SharedHandle<sfmljs::GraphicsContext>;

// RenderTexture submissions may bind an FBO in the window's GL context.
// Window::setActive() alone does not select its default framebuffer.
class WindowFramebuffer {
 public:
  explicit WindowFramebuffer(const sf::Window& window) {
    separate_ = window.getSettings().majorVersion >= 3 ||
        sf::Context::isExtensionAvailable("GL_ARB_framebuffer_object");
    if (!separate_ &&
        !sf::Context::isExtensionAvailable("GL_EXT_framebuffer_object")) return;
    bind_ = reinterpret_cast<decltype(&glBindTexture)>(sf::Context::getFunction(
        separate_ ? "glBindFramebuffer" : "glBindFramebufferEXT"));
    if (!bind_) return;
    const auto get = reinterpret_cast<decltype(&glGetIntegerv)>(
        sf::Context::getFunction("glGetIntegerv"));
    get(0x8ca6 /* GL_DRAW_FRAMEBUFFER_BINDING */, &draw_);
    if (separate_) get(0x8caa /* GL_READ_FRAMEBUFFER_BINDING */, &read_);
    bind_(0x8d40 /* GL_FRAMEBUFFER */, 0);
  }
  ~WindowFramebuffer() {
    if (!bind_) return;
    if (separate_) {
      bind_(0x8ca8 /* GL_READ_FRAMEBUFFER */, read_);
      bind_(0x8ca9 /* GL_DRAW_FRAMEBUFFER */, draw_);
    } else {
      bind_(0x8d40 /* GL_FRAMEBUFFER */, draw_);
    }
  }

 private:
  decltype(&glBindTexture) bind_{};
  GLint read_{};
  GLint draw_{};
  bool separate_{};
};

bool ReadPosition(v8::Local<v8::Value> x, v8::Local<v8::Value> y,
                  sf::Vector2u& position) {
  if (!x->IsUint32() || !y->IsUint32()) {
    Nan::ThrowRangeError("Expected unsigned integer texture coordinates");
    return false;
  }
  position = {Nan::To<std::uint32_t>(x).FromJust(),
              Nan::To<std::uint32_t>(y).FromJust()};
  return true;
}

bool CheckRegion(const sf::Texture& texture, sf::Vector2u size,
                 sf::Vector2u dest) {
  const auto target = texture.getSize();
  // Subtract only after checking dest, avoiding unsigned integer overflow.
  if (dest.x > target.x || dest.y > target.y ||
      size.x > target.x - dest.x || size.y > target.y - dest.y) {
    Nan::ThrowRangeError("Update region is outside the texture");
    return false;
  }
  return true;
}

NAN_METHOD(CreateTexture) {
  auto* context = ContextHandle::From(info[0]);
  if (!context) return;
  sf::Vector2u size;
  std::shared_ptr<const sf::Texture> source;
  if (info.Length() == 2) {
    source = sfmljs::ReadTexture(info[1]);
    if (!source) return;
  }
  const bool sized = info.Length() > 2;
  if (sized) {
    if (!ReadPosition(info[1], info[2], size)) return;
    if (size.x == 0 || size.y == 0) {
      return Nan::ThrowRangeError("Expected positive integer dimensions");
    }
    if (!info[3]->IsBoolean()) return Nan::ThrowTypeError("Expected sRGB flag");
  }
  if (context->owner()->nextId == std::numeric_limits<std::uint32_t>::max()) {
    return Nan::ThrowRangeError("Graphics ID space exhausted");
  }
  try {
    const auto id = context->owner()->nextId++;
    auto texture = source
        ? sfmljs::MakeThreadOwned<sfmljs::TextureState>(
            context->owner(), id, *source)
        : sfmljs::MakeThreadOwned<sfmljs::TextureState>(context->owner(), id);
    // SFML's copy constructor reports allocation failure only on stderr.
    if (source && texture->getSize() != source->getSize()) {
      return sfmljs::ThrowError("SFML could not copy the texture");
    }
    if (sized && !texture->resize(size, Nan::To<bool>(info[3]).FromJust())) {
      return sfmljs::ThrowError("SFML could not create the texture");
    }
    context->owner()->textures.emplace(texture->id, texture);
    auto result = Nan::New<v8::Object>();
    Nan::Set(result, Nan::New("info").ToLocalChecked(),
             sfmljs::MapTexture(texture)).FromJust();
    Nan::Set(result, Nan::New("handle").ToLocalChecked(),
             TextureHandle::Create(texture)).FromJust();
    Nan::Set(result, Nan::New("id").ToLocalChecked(),
             Nan::New(texture->id)).FromJust();
    info.GetReturnValue().Set(result);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(ResizeTexture) {
  auto* texture = TextureHandle::From(info[0]);
  if (!texture) return;
  sf::Vector2u size;
  if (!ReadPosition(info[1], info[2], size)) return;
  if (!info[3]->IsBoolean()) return Nan::ThrowTypeError("Expected sRGB flag");
  try {
    if (texture->owner()->resize(size, info[3]->IsTrue())) {
      info.GetReturnValue().Set(true);
    }
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(CopyTextureToImage) {
  const auto texture = sfmljs::ReadTexture(info[0]);
  if (!texture) return;
  const auto size = texture->getSize();
  const auto bytes = static_cast<std::uint64_t>(size.x) * size.y * 4;
  // SFML's readback path computes the byte count with unsigned int math.
  if (bytes > std::numeric_limits<unsigned int>::max() ||
      bytes > node::Buffer::kMaxLength) {
    return Nan::ThrowRangeError("Texture exceeds the image readback limit");
  }
  try {
    info.GetReturnValue().Set(sfmljs::MapImageResource(info.GetIsolate(),
        std::make_shared<sf::Image>(texture->copyToImage())));
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(GetMaximumTextureSize) {
  info.GetReturnValue().Set(Nan::New(sf::Texture::getMaximumSize()));
}

NAN_METHOD(GetTextureNativeHandle) {
  const auto texture = sfmljs::ReadTexture(info[0]);
  if (texture) info.GetReturnValue().Set(Nan::New(texture->getNativeHandle()));
}

NAN_METHOD(BindTexture) {
  if (!info[1]->IsUint32() ||
      Nan::To<std::uint32_t>(info[1]).FromJust() > 1) {
    return Nan::ThrowRangeError("Expected a CoordinateType");
  }
  std::shared_ptr<const sf::Texture> texture;
  if (!info[0]->IsNull()) {
    texture = sfmljs::ReadTexture(info[0]);
    if (!texture) return;
  }
  sf::Texture::bind(texture.get(), static_cast<sf::CoordinateType>(
      Nan::To<std::uint32_t>(info[1]).FromJust()));
}

NAN_METHOD(GenerateTextureMipmap) {
  auto* texture = TextureHandle::From(info[0]);
  if (texture) info.GetReturnValue().Set(texture->owner()->generateMipmap());
}

NAN_METHOD(SwapTextures) {
  auto* left = TextureHandle::From(info[0]);
  if (!left) return;
  auto* right = TextureHandle::From(info[1]);
  if (!right) return;
  // Only swap the SFML resources, keeping registry identity and owners intact.
  if (left->owner() != right->owner()) left->owner()->swap(*right->owner());
}

NAN_METHOD(AssignTexture) {
  auto* target = TextureHandle::From(info[0]);
  if (!target) return;
  const auto source = sfmljs::ReadTexture(info[1]);
  if (!source || target->owner() == source) return;
  sf::Texture replacement(*source);
  if (replacement.getSize() != source->getSize()) {
    return sfmljs::ThrowError("SFML could not copy the texture");
  }
  // Keep the TextureState address, mapped fields and registry ID unchanged.
  target->owner()->swap(replacement);
}

NAN_METHOD(LoadTextureImage) {
  auto* texture = TextureHandle::From(info[0]);
  if (!texture) return;
  auto* image = sfmljs::ImageHandle::From(info[1]);
  if (!image) return;
  if (!info[2]->IsBoolean() || !info[3]->IsInt32() || !info[4]->IsInt32() ||
      !info[5]->IsInt32() || !info[6]->IsInt32()) {
    return Nan::ThrowTypeError("Expected sRGB flag and an integer rectangle");
  }
  const sf::IntRect area{
      {Nan::To<int>(info[3]).FromJust(), Nan::To<int>(info[4]).FromJust()},
      {Nan::To<int>(info[5]).FromJust(), Nan::To<int>(info[6]).FromJust()}};
  const auto& input = *image->owner()->current;
  const auto size = input.getSize();
  if (size.x == 0 || size.y == 0) return;
  // Match SFML 3's empty-area rule and clamping, but reject its assertion/UB
  // cases before entering the library (negative size or a start past the end).
  if (area.size.x != 0 && area.size.y != 0 &&
      (area.size.x < 0 || area.size.y < 0 ||
       static_cast<std::int64_t>(area.position.x) >= size.x ||
       static_cast<std::int64_t>(area.position.y) >= size.y)) {
    return Nan::ThrowRangeError("Invalid texture source rectangle");
  }
  try {
    // sf::Texture keeps its address and registry ID. SFML guarantees that a
    // failed load leaves it unchanged; existing sprites keep the same object.
    if (texture->owner()->loadFromImage(
            input, Nan::To<bool>(info[2]).FromJust(), area)) {
      info.GetReturnValue().Set(true);
    }
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(UpdateTexture) {
  auto* texture = TextureHandle::From(info[0]);
  if (!texture) return;
  std::span<const std::uint8_t> pixels;
  if (!sfmljs::ReadImageBytes(info[1], pixels)) return;
  auto size = texture->owner()->getSize();
  sf::Vector2u dest;
  if (info.Length() != 2 &&
      (!sfmljs::ReadImageSize(info[2], info[3], size) ||
       !ReadPosition(info[4], info[5], dest))) return;
  if (!CheckRegion(*texture->owner(), size, dest)) return;
  const auto required = static_cast<std::uint64_t>(size.x) * size.y * 4;
  if (pixels.size() != required) {
    return Nan::ThrowRangeError("Pixel length must equal width * height * 4");
  }
  if (size.x != 0 && size.y != 0) {
    texture->owner()->update(pixels.data(), size, dest);
  }
}

NAN_METHOD(UpdateTextureImage) {
  auto* texture = TextureHandle::From(info[0]);
  if (!texture) return;
  auto* image = sfmljs::ImageHandle::From(info[1]);
  if (!image) return;
  sf::Vector2u dest;
  if (!ReadPosition(info[2], info[3], dest)) return;
  const auto& input = *image->owner()->current;
  const auto size = input.getSize();
  if (!CheckRegion(*texture->owner(), size, dest)) return;
  if (size.x != 0 && size.y != 0) texture->owner()->update(input, dest);
}

NAN_METHOD(UpdateTextureTexture) {
  auto* texture = TextureHandle::From(info[0]);
  if (!texture) return;
  const auto source = sfmljs::ReadTexture(info[1]);
  if (!source) return;
  sf::Vector2u dest;
  if (!ReadPosition(info[2], info[3], dest)) return;
  const auto size = source->getSize();
  if (!CheckRegion(*texture->owner(), size, dest)) return;
  // A valid self-copy can only be the whole texture to (0, 0). Avoid an
  // overlapping OpenGL framebuffer blit, whose result would be undefined.
  if (texture->owner() == source) return;
  if (size.x != 0 && size.y != 0) texture->owner()->update(*source, dest);
}

NAN_METHOD(UpdateTextureWindow) {
  auto* texture = TextureHandle::From(info[0]);
  if (!texture) return;
  auto* window = sfmljs::SharedHandle<sf::Window>::From(info[1]);
  if (!window) return;
  sf::Vector2u dest;
  if (!ReadPosition(info[2], info[3], dest)) return;
  if (!window->owner()->isOpen()) return;
  if (!CheckRegion(*texture->owner(), window->owner()->getSize(), dest)) return;
  if (!window->owner()->setActive()) return;
  const WindowFramebuffer framebuffer(*window->owner());
  texture->owner()->update(*window->owner(), dest);
}

template <bool Smooth>
NAN_METHOD(SetSampling) {
  auto* texture = TextureHandle::From(info[0]);
  if (!texture) return;
  if (!info[1]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
  if constexpr (Smooth) texture->owner()->setSmooth(info[1]->IsTrue());
  else texture->owner()->setRepeated(info[1]->IsTrue());
}

}  // namespace

NAN_MODULE_INIT(InitializeTexture) {
  sfmljs::SetMethod<CreateTexture>(target, "createTexture");
  sfmljs::SetMethod<ResizeTexture>(target, "resizeTexture");
  sfmljs::SetMethod<CopyTextureToImage>(target, "copyTextureToImage");
  sfmljs::SetMethod<GetMaximumTextureSize>(target, "getMaximumTextureSize");
  sfmljs::SetMethod<GetTextureNativeHandle>(target, "getTextureNativeHandle");
  sfmljs::SetMethod<BindTexture>(target, "bindTexture");
  sfmljs::SetMethod<GenerateTextureMipmap>(target, "generateTextureMipmap");
  sfmljs::SetMethod<SwapTextures>(target, "swapTextures");
  sfmljs::SetMethod<AssignTexture>(target, "assignTexture");
  sfmljs::SetMethod<LoadTextureImage>(target, "loadTextureImage");
  sfmljs::SetMethod<UpdateTexture>(target, "updateTexture");
  sfmljs::SetMethod<UpdateTextureImage>(target, "updateTextureImage");
  sfmljs::SetMethod<UpdateTextureTexture>(target, "updateTextureTexture");
  sfmljs::SetMethod<UpdateTextureWindow>(target, "updateTextureWindow");
  sfmljs::SetMethod<SetSampling<true>>(target, "setTextureSmooth");
  sfmljs::SetMethod<SetSampling<false>>(target, "setTextureRepeated");
}
