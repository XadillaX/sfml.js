#include "../../native/graphics-state.h"
#include "../../native/shared-handle.h"

#include <SFML/Graphics/Image.hpp>
#include <SFML/Graphics/VertexArray.hpp>
#define GL_SILENCE_DEPRECATION
#include <SFML/OpenGL.hpp>

namespace {

NAN_METHOD(RenderShaderOracle) {
  auto* handle = sfmljs::SharedHandle<sfmljs::ShaderState>::From(info[0]);
  if (!handle) return;
  auto texture = sfmljs::ReadTexture(info[1]);
  if (!texture) return;
  const unsigned mode = Nan::To<unsigned>(info[2]).FromJust();
  sf::RenderTexture target({8, 8});
  target.clear(sf::Color(20, 40, 60));
  sf::RenderStates states(handle->owner()->current.get());
  states.texture = texture.get();
  states.blendMode = sf::BlendNone;
  states.transform.translate({2, 1}).scale({0.75f, 1.25f});
  sf::VertexArray vertices(sf::PrimitiveType::TriangleStrip, 4);
  const std::array<sf::Vector2f, 4> positions{{
      {0, 0}, {4, 0}, {0, 4}, {4, 4}}};
  for (std::size_t i = 0; i < positions.size(); ++i) {
    vertices[i] = {positions[i], sf::Color(128, 255, 64), positions[i]};
  }
  if (mode == 0) {
    sf::Sprite sprite(*texture);
    sprite.setColor(sf::Color(128, 255, 64));
    target.draw(sprite, states);
  } else if (mode == 1) {
    target.draw(vertices, states);
  } else if (mode == 2) {
    target.draw(&vertices[0], 4, sf::PrimitiveType::TriangleStrip, states);
  } else {
    sf::VertexBuffer buffer(sf::PrimitiveType::TriangleStrip);
    if (!buffer.create(4) || !buffer.update(&vertices[0])) {
      return Nan::ThrowError("Could not create shader oracle buffer");
    }
    target.draw(buffer, states);
  }
  target.display();
  const auto image = target.getTexture().copyToImage();
  info.GetReturnValue().Set(Nan::CopyBuffer(
      reinterpret_cast<const char*>(image.getPixelsPtr()), 8 * 8 * 4)
      .ToLocalChecked());
}

NAN_METHOD(BoundShader) {
  GLint program{};
  glGetIntegerv(0x8B8D /* GL_CURRENT_PROGRAM */, &program);
  info.GetReturnValue().Set(Nan::New(program));
}

NAN_METHOD(ShaderRegistrySize) {
  auto* context = sfmljs::SharedHandle<sfmljs::GraphicsContext>::From(info[0]);
  if (context) info.GetReturnValue().Set(
      Nan::New(static_cast<unsigned>(context->owner()->shaders.size())));
}

}  // namespace

NAN_MODULE_INIT(InitializeShaderProbes) {
  Nan::SetMethod(target, "renderShaderOracle", RenderShaderOracle);
  Nan::SetMethod(target, "boundShader", BoundShader);
  Nan::SetMethod(target, "shaderRegistrySize", ShaderRegistrySize);
}
