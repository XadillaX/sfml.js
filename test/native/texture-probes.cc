#include "../../native/image-state.h"
#include "../../native/texture-resource.h"

#include <SFML/Graphics/RenderTexture.hpp>
#include <SFML/Graphics/Texture.hpp>
#include <SFML/Graphics/VertexArray.hpp>
#include <SFML/Window/Context.hpp>
#include <SFML/Window/Window.hpp>
#define GL_SILENCE_DEPRECATION
#include <SFML/OpenGL.hpp>

namespace {

using TextureHandle = sfmljs::SharedHandle<sf::Texture>;

NAN_METHOD(PaintWindow) {
  auto* window = sfmljs::SharedHandle<sf::Window>::From(info[0]);
  if (!window) return;
  if (!window->owner()->setActive()) return Nan::ThrowError("Inactive window");
  const auto clearColor = reinterpret_cast<decltype(&glClearColor)>(
      sf::Context::getFunction("glClearColor"));
  const auto clear = reinterpret_cast<decltype(&glClear)>(
      sf::Context::getFunction("glClear"));
  const auto enable = reinterpret_cast<decltype(&glEnable)>(
      sf::Context::getFunction("glEnable"));
  const auto disable = reinterpret_cast<decltype(&glDisable)>(
      sf::Context::getFunction("glDisable"));
  const auto scissor = reinterpret_cast<decltype(&glScissor)>(
      sf::Context::getFunction("glScissor"));
  const auto size = window->owner()->getSize();
  disable(GL_SCISSOR_TEST);
  clearColor(1, 0, 0, 1);
  clear(GL_COLOR_BUFFER_BIT);
  enable(GL_SCISSOR_TEST);
  scissor(0, size.y / 2, size.x, size.y - size.y / 2);
  clearColor(0, 0, 1, 1);
  clear(GL_COLOR_BUFFER_BIT);
  disable(GL_SCISSOR_TEST);
}

NAN_METHOD(ReadTextureBinding) {
  const auto getInteger = reinterpret_cast<decltype(&glGetIntegerv)>(
      sf::Context::getFunction("glGetIntegerv"));
  const auto getFloat = reinterpret_cast<decltype(&glGetFloatv)>(
      sf::Context::getFunction("glGetFloatv"));
  GLint binding{};
  GLfloat matrix[16]{};
  getInteger(GL_TEXTURE_BINDING_2D, &binding);
  getFloat(GL_TEXTURE_MATRIX, matrix);
  auto result = Nan::New<v8::Object>();
  auto values = Nan::New<v8::Array>(16);
  for (std::uint32_t i = 0; i < 16; ++i) {
    Nan::Set(values, i, Nan::New(matrix[i])).FromJust();
  }
  Nan::Set(result, Nan::New("binding").ToLocalChecked(),
           Nan::New(static_cast<std::uint32_t>(binding))).FromJust();
  Nan::Set(result, Nan::New("matrix").ToLocalChecked(), values).FromJust();
  Nan::Set(result, Nan::New("context").ToLocalChecked(),
      v8::BigInt::NewFromUnsigned(info.GetIsolate(),
          sf::Context::getActiveContextId())).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ReadTexturePixels) {
  auto* texture = TextureHandle::From(info[0]);
  if (!texture) return;
  auto image = std::make_shared<sf::Image>(texture->owner()->copyToImage());
  info.GetReturnValue().Set(sfmljs::MapImage(info.GetIsolate(), image));
}

NAN_METHOD(ReadTextureFlags) {
  auto* texture = TextureHandle::From(info[0]);
  if (!texture) return;
  auto result = Nan::New<v8::Array>(3);
  Nan::Set(result, 0, Nan::New(texture->owner()->isSmooth())).FromJust();
  Nan::Set(result, 1, Nan::New(texture->owner()->isRepeated())).FromJust();
  Nan::Set(result, 2, Nan::New(texture->owner()->isSrgb())).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(LoadTextureAreaOracle) {
  auto* image = sfmljs::ImageHandle::From(info[0]);
  if (!image) return;
  for (int i = 1; i <= 4; ++i) {
    if (!info[i]->IsInt32()) return Nan::ThrowTypeError("Expected rectangle");
  }
  const sf::IntRect area{
      {Nan::To<int>(info[1]).FromJust(), Nan::To<int>(info[2]).FromJust()},
      {Nan::To<int>(info[3]).FromJust(), Nan::To<int>(info[4]).FromJust()}};
  sf::Texture texture;
  if (!texture.loadFromImage(*image->owner()->current, false, area)) return;
  info.GetReturnValue().Set(sfmljs::MapImage(info.GetIsolate(),
      std::make_shared<sf::Image>(texture.copyToImage())));
}

// Immediate SFML draws, with sampling changed between the two rows.
NAN_METHOD(RenderTextureSamplingOracle) {
  if (!info[0]->IsBoolean()) return Nan::ThrowTypeError("Expected repeat mode");
  const bool repeat = info[0]->IsTrue();
  const std::uint8_t pixels[] = {255, 0, 0, 255, 0, 0, 255, 255};
  const sf::Image image({2, 1}, pixels);
  sf::Texture texture(image);
  sf::RenderTexture target({8, 2});
  target.clear();
  sf::VertexArray quad(sf::PrimitiveType::TriangleStrip, 4);
  const float edge = repeat ? 8.f : 2.f;
  quad[0] = {{0, 0}, sf::Color::White, {0, 0}};
  quad[1] = {{8, 0}, sf::Color::White, {edge, 0}};
  quad[2] = {{0, 1}, sf::Color::White, {0, 1}};
  quad[3] = {{8, 1}, sf::Color::White, {edge, 1}};
  sf::RenderStates states(&texture);
  target.draw(quad, states);
  if (repeat) texture.setRepeated(true);
  else texture.setSmooth(true);
  states.transform.translate({0, 1});
  target.draw(quad, states);
  target.display();
  info.GetReturnValue().Set(sfmljs::MapImage(info.GetIsolate(),
      std::make_shared<sf::Image>(target.getTexture().copyToImage())));
}

// A minified high-frequency image exposes mipmap state in actual pixels.
// Keep operations immediate here so missing JS flushes change the comparison.
NAN_METHOD(RenderTextureMipmapOracle) {
  auto* source = sfmljs::ImageHandle::From(info[0]);
  if (!source) return;
  auto* patch = sfmljs::ImageHandle::From(info[1]);
  if (!patch) return;
  if (!info[2]->IsUint32()) return Nan::ThrowTypeError("Expected update mode");
  const auto mode = Nan::To<std::uint32_t>(info[2]).FromJust();
  if (mode > 4) return Nan::ThrowRangeError("Invalid update mode");
  const auto& image = *source->owner()->current;
  const auto& replacement = *patch->owner()->current;
  if (image.getSize() != sf::Vector2u{64, 64} ||
      replacement.getSize() != image.getSize()) {
    return Nan::ThrowRangeError("Expected 64 x 64 images");
  }
  sf::Texture texture(image);
  texture.setSmooth(true);
  sf::RenderTexture target({8, 56});
  target.clear();
  sf::VertexArray quad(sf::PrimitiveType::TriangleStrip, 4);
  quad[0] = {{0, 0}, sf::Color::White, {0.2f, 0.2f}};
  quad[1] = {{8, 0}, sf::Color::White, {64.2f, 0.2f}};
  quad[2] = {{0, 8}, sf::Color::White, {0.2f, 64.2f}};
  quad[3] = {{8, 8}, sf::Color::White, {64.2f, 64.2f}};
  const auto draw = [&](const sf::Texture& input, float y) {
    sf::RenderStates states(&input);
    states.transform.translate({0, y});
    target.draw(quad, states);
  };
  draw(texture, 0);
  const bool generated = texture.generateMipmap();
  draw(texture, 8);
  const sf::Texture copy(texture);
  draw(copy, 16);
  switch (mode) {
    case 0: texture.update(replacement.getPixelsPtr()); break;
    case 1: texture.update(replacement); break;
    case 2: texture.update(sf::Texture(replacement)); break;
    case 3:
      if (!texture.loadFromImage(replacement)) {
        return Nan::ThrowError("Oracle load failed");
      }
      break;
    case 4:
      if (!texture.resize({64, 64})) return Nan::ThrowError("Oracle resize failed");
      texture.update(replacement);
      break;
  }
  draw(texture, 24);
  const bool regenerated = texture.generateMipmap();
  draw(texture, 32);
  sf::Texture other(image);
  other.setSmooth(true);
  texture.swap(other);
  draw(texture, 40);
  draw(other, 48);
  target.display();
  auto result = sfmljs::MapImage(info.GetIsolate(),
      std::make_shared<sf::Image>(target.getTexture().copyToImage()));
  Nan::Set(result, Nan::New("generated").ToLocalChecked(),
           Nan::New(generated)).FromJust();
  Nan::Set(result, Nan::New("regenerated").ToLocalChecked(),
           Nan::New(regenerated)).FromJust();
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeTextureProbes) {
  Nan::SetMethod(target, "paintWindow", PaintWindow);
  Nan::SetMethod(target, "readTextureBinding", ReadTextureBinding);
  Nan::SetMethod(target, "readTexturePixels", ReadTexturePixels);
  Nan::SetMethod(target, "readTextureFlags", ReadTextureFlags);
  Nan::SetMethod(target, "loadTextureAreaOracle", LoadTextureAreaOracle);
  Nan::SetMethod(target, "renderTextureSamplingOracle",
                 RenderTextureSamplingOracle);
  Nan::SetMethod(target, "renderTextureMipmapOracle", RenderTextureMipmapOracle);
}
