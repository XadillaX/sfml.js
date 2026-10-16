#include "../../native/graphics-state.h"
#include "../../native/shared-handle.h"

#include <SFML/Graphics/Image.hpp>
#define GL_SILENCE_DEPRECATION
#include <SFML/OpenGL.hpp>

#include <array>

namespace {

NAN_METHOD(RenderVertexBufferOracle) {
  auto* texture = sfmljs::SharedHandle<sf::Texture>::From(info[0]);
  if (!texture) return;
  if (!info[1]->IsUint32() || Nan::To<unsigned>(info[1]).FromJust() > 5 ||
      !info[2]->IsBoolean() || !info[3]->IsUint32() || !info[4]->IsUint32()) {
    return Nan::ThrowTypeError("Expected primitive type, normalized flag and range");
  }
  const bool normalized = Nan::To<bool>(info[2]).FromJust();
  std::array<sf::Vertex, 6> vertices;
  const std::array<sf::Vector2f, 6> positions{{
      {0, 0}, {10, 0}, {0, 10}, {0, 10}, {10, 0}, {10, 10}}};
  for (std::size_t i = 0; i < vertices.size(); ++i) {
    vertices[i] = {positions[i],
        sf::Color(static_cast<std::uint8_t>(80 + i * 25), 180, 220, 160),
        positions[i] / (normalized ? 10.f : 5.f)};
  }
  sf::VertexBuffer buffer(
      static_cast<sf::PrimitiveType>(Nan::To<unsigned>(info[1]).FromJust()),
      sf::VertexBuffer::Usage::Static);
  if (!buffer.create(vertices.size()) || !buffer.update(vertices.data())) {
    return Nan::ThrowError("Could not create oracle vertex buffer");
  }
  sf::RenderTexture target;
  sf::ContextSettings settings;
  settings.stencilBits = 8;
  if (!target.resize({32, 32}, settings)) {
    return Nan::ThrowError("Could not create oracle target");
  }
  target.clear(sf::Color(24, 40, 72, 180), 0);
  auto view = target.getDefaultView();
  view.move({1, -1});
  view.setRotation(sf::degrees(7));
  view.setViewport({{0.1f, 0.1f}, {0.8f, 0.8f}});
  view.setScissor({{0.2f, 0.2f}, {0.7f, 0.6f}});
  target.setView(view);
  sf::RenderStates states;
  states.transform.translate({7, 5}).scale({1.3f, 0.8f}).rotate(sf::degrees(23));
  states.texture = texture->owner().get();
  states.coordinateType = normalized ? sf::CoordinateType::Normalized
                                     : sf::CoordinateType::Pixels;
  states.blendMode = sf::BlendAdd;
  states.stencilMode = {sf::StencilComparison::Always,
      sf::StencilUpdateOperation::Replace, 3, 0xff, true};
  const auto first = Nan::To<unsigned>(info[3]).FromJust();
  const auto count = Nan::To<unsigned>(info[4]).FromJust();
  target.draw(buffer, first, count, states);
  states.stencilMode = {sf::StencilComparison::Equal,
      sf::StencilUpdateOperation::Keep, 3, 0xff, false};
  target.draw(buffer, first, count, states);
  target.display();
  const auto image = target.getTexture().copyToImage();
  info.GetReturnValue().Set(Nan::CopyBuffer(
      reinterpret_cast<const char*>(image.getPixelsPtr()), 32 * 32 * 4)
      .ToLocalChecked());
}

NAN_METHOD(VertexBufferRegistrySize) {
  auto* context = sfmljs::SharedHandle<sfmljs::GraphicsContext>::From(info[0]);
  if (!context) return;
  info.GetReturnValue().Set(
      Nan::New(static_cast<unsigned>(context->owner()->vertexBuffers.size())));
}

NAN_METHOD(BoundVertexBuffer) {
  GLint buffer{};
  glGetIntegerv(0x8894 /* GL_ARRAY_BUFFER_BINDING */, &buffer);
  info.GetReturnValue().Set(Nan::New(static_cast<unsigned>(buffer)));
}

}  // namespace

NAN_MODULE_INIT(InitializeVertexBufferProbes) {
  Nan::SetMethod(target, "renderVertexBufferOracle", RenderVertexBufferOracle);
  Nan::SetMethod(target, "vertexBufferRegistrySize", VertexBufferRegistrySize);
  Nan::SetMethod(target, "boundVertexBuffer", BoundVertexBuffer);
}
