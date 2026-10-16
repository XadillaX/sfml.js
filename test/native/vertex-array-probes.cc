#include "../../native/shared-handle.h"

#include <SFML/Graphics/Image.hpp>
#include <SFML/Graphics/RenderTexture.hpp>
#include <SFML/Graphics/VertexArray.hpp>

#include <array>

namespace {

// Ordinary sf::VertexArray + immediate draws, independent of command storage.
NAN_METHOD(RenderVertexArrayOracle) {
  auto* texture = sfmljs::SharedHandle<sf::Texture>::From(info[0]);
  if (!texture) return;
  if (!info[1]->IsUint32() || Nan::To<unsigned>(info[1]).FromJust() > 5 ||
      !info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected primitive type and normalized flag");
  }
  const bool normalized = Nan::To<bool>(info[2]).FromJust();
  sf::VertexArray vertices(
      static_cast<sf::PrimitiveType>(Nan::To<unsigned>(info[1]).FromJust()), 6);
  const std::array<sf::Vector2f, 6> positions{{
      {0, 0}, {10, 0}, {0, 10}, {0, 10}, {10, 0}, {10, 10}}};
  for (std::size_t i = 0; i < positions.size(); ++i) {
    vertices[i] = {positions[i],
        sf::Color(static_cast<std::uint8_t>(80 + i * 25), 180, 220, 160),
        positions[i] / (normalized ? 10.f : 5.f)};
  }
  sf::RenderTexture target;
  sf::ContextSettings settings;
  settings.stencilBits = 8;
  if (!target.resize({32, 32}, settings)) {
    return Nan::ThrowError("Could not create vertex oracle target");
  }
  target.clear(sf::Color(24, 40, 72, 180), 0);
  sf::RenderStates states;
  states.transform.translate({7, 5}).scale({1.3f, 0.8f})
      .rotate(sf::degrees(23));
  states.texture = texture->owner().get();
  states.coordinateType = normalized ? sf::CoordinateType::Normalized
                                     : sf::CoordinateType::Pixels;
  states.blendMode = sf::BlendAdd;
  states.stencilMode = {sf::StencilComparison::Always,
      sf::StencilUpdateOperation::Replace, 3, 0xff, true};
  target.draw(vertices, states);
  states.stencilMode = {sf::StencilComparison::Equal,
      sf::StencilUpdateOperation::Keep, 3, 0xff, false};
  target.draw(vertices, states);
  target.display();
  const auto image = target.getTexture().copyToImage();
  info.GetReturnValue().Set(Nan::CopyBuffer(
      reinterpret_cast<const char*>(image.getPixelsPtr()), 32 * 32 * 4)
      .ToLocalChecked());
}

NAN_METHOD(VertexArrayBoundsOracle) {
  if (!info[0]->IsFloat32Array()) {
    return Nan::ThrowTypeError("Expected coordinates");
  }
  Nan::TypedArrayContents<float> coordinates(info[0]);
  if (coordinates.length() % 2 != 0) {
    return Nan::ThrowRangeError("Expected coordinate pairs");
  }
  sf::VertexArray array(sf::PrimitiveType::Points, coordinates.length() / 2);
  for (std::size_t i = 0; i < array.getVertexCount(); ++i) {
    array[i].position = {(*coordinates)[i * 2], (*coordinates)[i * 2 + 1]};
  }
  const auto bounds = array.getBounds();
  auto result = Nan::New<v8::Array>(4);
  Nan::Set(result, 0, Nan::New(bounds.position.x)).FromJust();
  Nan::Set(result, 1, Nan::New(bounds.position.y)).FromJust();
  Nan::Set(result, 2, Nan::New(bounds.size.x)).FromJust();
  Nan::Set(result, 3, Nan::New(bounds.size.y)).FromJust();
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeVertexArrayProbes) {
  Nan::SetMethod(target, "renderVertexArrayOracle", RenderVertexArrayOracle);
  Nan::SetMethod(target, "vertexArrayBoundsOracle", VertexArrayBoundsOracle);
}
