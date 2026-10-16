#include "../../native/graphics-state.h"
#include "../../native/image-state.h"

#include <SFML/Graphics/VertexArray.hpp>
#include <SFML/Window/Context.hpp>
#define GL_SILENCE_DEPRECATION
#include <SFML/OpenGL.hpp>

namespace {

using sfmljs::SharedHandle;
using Target = sfmljs::RenderTextureState;
using Observation = std::weak_ptr<Target>;

// Inspect the current FBO without activating a target, so tests detect a
// missing final activation after flushing dependent render targets.
NAN_METHOD(InspectActiveFramebuffer) {
  const auto get = reinterpret_cast<decltype(&glGetIntegerv)>(
      sf::Context::getFunction("glGetIntegerv"));
  auto result = Nan::New<v8::Array>(4);
  const GLenum names[] = {0x8ca6, GL_DEPTH_BITS, GL_STENCIL_BITS, 0x80a9};
  for (std::uint32_t i = 0; i < 4; ++i) {
    GLint value{};
    get(names[i], &value);
    Nan::Set(result, i, Nan::New(value)).FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ClearActiveFramebuffer) {
  const auto clearColor = reinterpret_cast<decltype(&glClearColor)>(
      sf::Context::getFunction("glClearColor"));
  const auto clear = reinterpret_cast<decltype(&glClear)>(
      sf::Context::getFunction("glClear"));
  const auto disable = reinterpret_cast<decltype(&glDisable)>(
      sf::Context::getFunction("glDisable"));
  disable(GL_SCISSOR_TEST);
  clearColor(0, 0, 1, 1);
  clear(GL_COLOR_BUFFER_BIT);
}

NAN_METHOD(ReadRenderTextureState) {
  auto* target = SharedHandle<Target>::From(info[0]);
  if (!target) return;
  auto result = sfmljs::DescribeTexture(target->owner()->target.getTexture());
  Nan::Set(result, Nan::New("targetSrgb").ToLocalChecked(),
      Nan::New(target->owner()->initialized &&
          target->owner()->target.isSrgb())).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(RenderTextureSamplingOracle) {
  const bool repeat = info[0]->IsTrue();
  const std::uint8_t pixels[] = {255, 0, 0, 255, 0, 0, 255, 255};
  const sf::Texture input(sf::Image({2, 1}, pixels));
  sf::RenderTexture source({2, 1});
  source.clear();
  source.draw(sf::Sprite(input));
  source.display();
  sf::RenderTexture output({8, 2});
  output.clear();
  sf::VertexArray quad(sf::PrimitiveType::TriangleStrip, 4);
  const float edge = repeat ? 8.f : 2.f;
  quad[0] = {{0, 0}, sf::Color::White, {0, 0}};
  quad[1] = {{8, 0}, sf::Color::White, {edge, 0}};
  quad[2] = {{0, 1}, sf::Color::White, {0, 1}};
  quad[3] = {{8, 1}, sf::Color::White, {edge, 1}};
  sf::RenderStates states(&source.getTexture());
  output.draw(quad, states);
  if (repeat) source.setRepeated(true);
  else source.setSmooth(true);
  states.transform.translate({0, 1});
  output.draw(quad, states);
  output.display();
  info.GetReturnValue().Set(sfmljs::MapImage(info.GetIsolate(),
      std::make_shared<sf::Image>(output.getTexture().copyToImage())));
}

NAN_METHOD(RenderTextureMipmapOracle) {
  auto* image = sfmljs::ImageHandle::From(info[0]);
  if (!image) return;
  const sf::Texture input(*image->owner()->current);
  sf::RenderTexture source(input.getSize());
  source.clear();
  source.draw(sf::Sprite(input));
  source.display();
  source.setSmooth(true);
  sf::RenderTexture output({8, 24});
  output.clear();
  sf::VertexArray quad(sf::PrimitiveType::TriangleStrip, 4);
  quad[0] = {{0, 0}, sf::Color::White, {0.2f, 0.2f}};
  quad[1] = {{8, 0}, sf::Color::White, {64.2f, 0.2f}};
  quad[2] = {{0, 8}, sf::Color::White, {0.2f, 64.2f}};
  quad[3] = {{8, 8}, sf::Color::White, {64.2f, 64.2f}};
  sf::RenderStates states(&source.getTexture());
  output.draw(quad, states);
  const bool generated = source.generateMipmap();
  states.transform.translate({0, 8});
  output.draw(quad, states);
  source.clear(sf::Color::Blue);
  source.display();
  states.transform.translate({0, 8});
  output.draw(quad, states);
  output.display();
  auto result = sfmljs::MapImage(info.GetIsolate(),
      std::make_shared<sf::Image>(output.getTexture().copyToImage()));
  Nan::Set(result, Nan::New("generated").ToLocalChecked(),
           Nan::New(generated)).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(RenderTextureSharesTexture) {
  auto* target = SharedHandle<Target>::From(info[0]);
  if (!target) return;
  const auto texture = sfmljs::ReadTexture(info[1]);
  if (!texture) return;
  const auto& owner = target->owner();
  info.GetReturnValue().Set(
      texture.get() == &owner->target.getTexture() &&
      !texture.owner_before(owner) && !owner.owner_before(texture) &&
      texture->getNativeHandle() == owner->target.getTexture().getNativeHandle());
}

NAN_METHOD(ObserveRenderTexture) {
  auto* target = SharedHandle<Target>::From(info[0]);
  if (target) info.GetReturnValue().Set(
      SharedHandle<Observation>::Create(
          std::make_shared<Observation>(target->owner())));
}

NAN_METHOD(RenderTextureExpired) {
  auto* observed = SharedHandle<Observation>::From(info[0]);
  if (observed) info.GetReturnValue().Set(observed->owner()->expired());
}

NAN_METHOD(TextureRegistered) {
  auto* context = SharedHandle<sfmljs::GraphicsContext>::From(info[0]);
  if (!context) return;
  if (!info[1]->IsUint32()) return Nan::ThrowTypeError("Expected texture ID");
  info.GetReturnValue().Set(context->owner()->textures.contains(
      Nan::To<std::uint32_t>(info[1]).FromJust()));
}

// Immediate SFML offscreen composition, independent of the command recorder.
NAN_METHOD(RenderTextureViewOracle) {
  auto* input = sfmljs::ImageHandle::From(info[0]);
  if (!input) return;
  const auto& image = *input->owner()->current;
  if (image.getSize() != sf::Vector2u{3, 2}) {
    return Nan::ThrowRangeError("Expected a 3 x 2 image");
  }
  sf::Texture original(image);
  sf::RenderTexture source({3, 2});
  source.clear();
  source.draw(sf::Sprite(original));
  source.display();
  sf::RenderTexture target({6, 4});
  target.clear();
  sf::Sprite sprite(source.getTexture());
  sf::VertexArray quad(sf::PrimitiveType::TriangleStrip, 4);
  quad[0] = {{3, 0}, sf::Color::White, {0, 0}};
  quad[1] = {{6, 0}, sf::Color::White, {3, 0}};
  quad[2] = {{3, 2}, sf::Color::White, {0, 2}};
  quad[3] = {{6, 2}, sf::Color::White, {3, 2}};
  target.draw(sprite);
  target.draw(quad, &source.getTexture());
  source.clear(sf::Color::Blue);
  source.display();
  sprite.setPosition({0, 2});
  target.draw(sprite);
  sf::RenderStates states(&source.getTexture());
  states.transform.translate({0, 2});
  target.draw(quad, states);
  target.display();
  info.GetReturnValue().Set(sfmljs::MapImage(info.GetIsolate(),
      std::make_shared<sf::Image>(target.getTexture().copyToImage())));
}

}  // namespace

NAN_MODULE_INIT(InitializeRenderTextureProbes) {
  Nan::SetMethod(target, "inspectActiveFramebuffer", InspectActiveFramebuffer);
  Nan::SetMethod(target, "clearActiveFramebuffer", ClearActiveFramebuffer);
  Nan::SetMethod(target, "readRenderTextureState", ReadRenderTextureState);
  Nan::SetMethod(target, "renderOffscreenSamplingOracle",
                 RenderTextureSamplingOracle);
  Nan::SetMethod(target, "renderOffscreenMipmapOracle", RenderTextureMipmapOracle);
  Nan::SetMethod(target, "renderTextureSharesTexture", RenderTextureSharesTexture);
  Nan::SetMethod(target, "observeRenderTexture", ObserveRenderTexture);
  Nan::SetMethod(target, "renderTextureExpired", RenderTextureExpired);
  Nan::SetMethod(target, "textureRegistered", TextureRegistered);
  Nan::SetMethod(target, "renderTextureViewOracle", RenderTextureViewOracle);
}
