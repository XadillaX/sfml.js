#include "../../native/shared-handle.h"

#include <SFML/Graphics/Drawable.hpp>
#include <SFML/Graphics/Image.hpp>
#include <SFML/Graphics/RenderTexture.hpp>
#include <SFML/Graphics/Sprite.hpp>
#include <SFML/Graphics/Transformable.hpp>

#include <array>
#include <vector>

namespace {

template <std::size_t N>
bool ReadMode(v8::Local<v8::Value> input, std::array<std::uint32_t, N>& values) {
  if (!input->IsUint32Array() ||
      input.As<v8::Uint32Array>()->ByteLength() != sizeof(values)) {
    Nan::ThrowTypeError("Expected a mode field array");
    return false;
  }
  input.As<v8::Uint32Array>()->CopyContents(values.data(), sizeof(values));
  return true;
}

NAN_METHOD(CompareBlendModes) {
  std::array<std::uint32_t, 6> a{}, b{};
  if (!ReadMode(info[0], a) || !ReadMode(info[1], b)) return;
  const auto make = [](const auto& values) {
    using F = sf::BlendMode::Factor;
    using E = sf::BlendMode::Equation;
    return sf::BlendMode(static_cast<F>(values[0]), static_cast<F>(values[1]),
                        static_cast<E>(values[2]), static_cast<F>(values[3]),
                        static_cast<F>(values[4]), static_cast<E>(values[5]));
  };
  const auto left = make(a), right = make(b);
  auto result = Nan::New<v8::Array>(2);
  Nan::Set(result, 0, Nan::New(left == right)).FromJust();
  Nan::Set(result, 1, Nan::New(left != right)).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(CompareStencilModes) {
  std::array<std::uint32_t, 5> a{}, b{};
  if (!ReadMode(info[0], a) || !ReadMode(info[1], b)) return;
  const auto make = [](const auto& values) {
    return sf::StencilMode{static_cast<sf::StencilComparison>(values[0]),
                          static_cast<sf::StencilUpdateOperation>(values[1]),
                          sf::StencilValue(values[2]), sf::StencilValue(values[3]),
                          values[4] != 0};
  };
  const auto left = make(a), right = make(b);
  auto result = Nan::New<v8::Array>(2);
  Nan::Set(result, 0, Nan::New(left == right)).FromJust();
  Nan::Set(result, 1, Nan::New(left != right)).FromJust();
  info.GetReturnValue().Set(result);
}

// Ordinary SFML composition, independent of the binding's command layout.
class Group : public sf::Drawable, public sf::Transformable {
 public:
  std::vector<const sf::Drawable*> children;

 private:
  void draw(sf::RenderTarget& target, sf::RenderStates states) const override {
    states.transform *= getTransform();
    for (const auto* child : children) target.draw(*child, states);
  }
};

void Nested(sf::RenderTarget& target, const sf::Texture& texture) {
  sf::Sprite sprite(texture);
  sprite.setPosition({3.25f, 2.5f});
  sprite.setScale({8.f, 6.f});
  sprite.setOrigin({0.25f, 0.75f});
  sprite.setRotation(sf::degrees(37.f));
  Group inner;
  inner.setPosition({10.f, 12.f});
  inner.setRotation(sf::degrees(23.f));
  inner.setScale({0.9f, 1.25f});
  inner.children = {&sprite};
  Group outer;
  outer.setPosition({6.f, 5.f});
  outer.setScale({1.7f, 0.8f});
  outer.children = {&inner, &sprite};
  sf::RenderStates states(sf::Transform().translate({2.f, 3.f}));
  target.draw(outer, states);
  outer.move({21.f, 8.f});
  target.draw(outer, states);
  // Future mutations must not change either already-issued draw.
  sprite.setPosition({200.f, 200.f});
  states.transform.translate({200.f, 200.f});
}

void Blends(sf::RenderTarget& target, const sf::Texture& texture) {
  using F = sf::BlendMode::Factor;
  using E = sf::BlendMode::Equation;
  const std::array modes{
      sf::BlendAlpha, sf::BlendAdd, sf::BlendMultiply, sf::BlendMin,
      sf::BlendMax, sf::BlendNone,
      sf::BlendMode(F::One, F::One, E::Subtract,
                    F::DstAlpha, F::OneMinusDstAlpha, E::ReverseSubtract),
      sf::BlendMode(F::OneMinusDstColor, F::SrcColor, E::ReverseSubtract,
                    F::OneMinusSrcColor, F::DstColor, E::Add)};
  sf::Sprite sprite(texture);
  sprite.setScale({8.f, 32.f});
  for (std::size_t i = 0; i < modes.size(); ++i) {
    sprite.setPosition({static_cast<float>(i * 8), 0.f});
    target.draw(sprite, modes[i]);
    sprite.setPosition({static_cast<float>(i * 8), 32.f});
    target.draw(sprite);
    target.draw(sprite, modes[i]);
  }
}

void Stencils(sf::RenderTarget& target, const sf::Texture& texture) {
  sf::Sprite sprite(texture);
  sprite.setScale({8.f, 8.f});
  for (unsigned comparison = 0; comparison < 8; ++comparison) {
    for (unsigned operation = 0; operation < 6; ++operation) {
      target.clearStencil(2);
      sprite.setPosition({static_cast<float>(operation * 8),
                          static_cast<float>(comparison * 8)});
      target.draw(sprite, sf::StencilMode{
          sf::StencilComparison::Always,
          static_cast<sf::StencilUpdateOperation>(operation), 5, 0xff, true});
      target.draw(sprite, sf::StencilMode{
          static_cast<sf::StencilComparison>(comparison),
          sf::StencilUpdateOperation::Keep, 2, 0xff, false});
    }
  }
  // A masked comparison in the remaining column.
  target.clearStencil(0x12);
  sprite.setPosition({48.f, 0.f});
  target.draw(sprite, sf::StencilMode{
      sf::StencilComparison::Equal, sf::StencilUpdateOperation::Keep,
      0x02, 0x0f, false});
}

NAN_METHOD(RenderDrawableOracle) {
  auto* texture = sfmljs::SharedHandle<sf::Texture>::From(info[0]);
  if (!texture) return;
  if (!info[1]->IsUint32()) return Nan::ThrowTypeError("Expected scenario");
  const auto scenario = Nan::To<std::uint32_t>(info[1]).FromJust();
  if (scenario > 2) return Nan::ThrowRangeError("Unknown drawable scenario");
  sf::RenderTexture target;
  sf::ContextSettings settings;
  settings.stencilBits = 8;
  if (!target.resize({64, 64}, settings)) {
    return Nan::ThrowError("Could not create drawable oracle target");
  }
  target.clear(sf::Color(24, 40, 72, 180), 0);
  if (scenario == 0) Nested(target, *texture->owner());
  else if (scenario == 1) Blends(target, *texture->owner());
  else Stencils(target, *texture->owner());
  target.display();
  const auto image = target.getTexture().copyToImage();
  info.GetReturnValue().Set(Nan::CopyBuffer(
      reinterpret_cast<const char*>(image.getPixelsPtr()), 64 * 64 * 4)
      .ToLocalChecked());
}

}  // namespace

NAN_MODULE_INIT(InitializeDrawableProbes) {
  Nan::SetMethod(target, "compareBlendModes", CompareBlendModes);
  Nan::SetMethod(target, "compareStencilModes", CompareStencilModes);
  Nan::SetMethod(target, "renderDrawableOracle", RenderDrawableOracle);
}
