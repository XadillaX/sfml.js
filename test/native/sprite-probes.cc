#include "../../native/graphics-state.h"

#include <SFML/Graphics/Image.hpp>

#include <cmath>

namespace {

using sfmljs::SharedHandle;

v8::Local<v8::Value> Get(v8::Local<v8::Object> value, const char* key) {
  return Nan::Get(value, Nan::New(key).ToLocalChecked()).ToLocalChecked();
}

template <typename T>
v8::Local<v8::Array> Rect(const sf::Rect<T>& rectangle) {
  auto result = Nan::New<v8::Array>(4);
  const double values[] = {static_cast<double>(rectangle.position.x),
                           static_cast<double>(rectangle.position.y),
                           static_cast<double>(rectangle.size.x),
                           static_cast<double>(rectangle.size.y)};
  for (std::uint32_t i = 0; i < 4; ++i) {
    Nan::Set(result, i, Nan::New(values[i])).FromJust();
  }
  return result;
}

v8::Local<v8::Object> Describe(const sf::Sprite& sprite) {
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("rect").ToLocalChecked(),
           Rect(sprite.getTextureRect())).FromJust();
  Nan::Set(result, Nan::New("local").ToLocalChecked(),
           Rect(sprite.getLocalBounds())).FromJust();
  Nan::Set(result, Nan::New("global").ToLocalChecked(),
           Rect(sprite.getGlobalBounds())).FromJust();
  Nan::Set(result, Nan::New("color").ToLocalChecked(),
           Nan::New(sprite.getColor().toInteger())).FromJust();
  return result;
}

// Independently build immediate SFML state, without ApplyTransform/Appearance.
bool Configure(sf::Sprite& sprite, v8::Local<v8::Object> input,
               sf::RenderStates& states) {
  const auto rectangle = Get(input, "rect");
  const auto transform = Get(input, "transform");
  const auto color = Get(input, "color");
  if (!rectangle->IsInt32Array() ||
      rectangle.As<v8::Int32Array>()->ByteLength() != 16 ||
      !transform->IsFloat32Array() ||
      transform.As<v8::Float32Array>()->ByteLength() != 28 ||
      !color->IsUint32()) {
    Nan::ThrowTypeError("Expected rectangle, transform and RGBA snapshot");
    return false;
  }
  std::array<std::int32_t, 4> rect{};
  std::array<float, 7> pose{};
  rectangle.As<v8::Int32Array>()->CopyContents(rect.data(), sizeof(rect));
  transform.As<v8::Float32Array>()->CopyContents(pose.data(), sizeof(pose));
  if (!std::isfinite(pose[2]) || std::abs(pose[2]) > 1000000.f) {
    Nan::ThrowRangeError("Unsafe oracle rotation");
    return false;
  }
  sprite.setTextureRect({{rect[0], rect[1]}, {rect[2], rect[3]}});
  sprite.setColor(sf::Color(Nan::To<std::uint32_t>(color).FromJust()));
  sprite.setPosition({pose[0], pose[1]});
  sprite.setRotation(sf::radians(pose[2]));
  sprite.setScale({pose[3], pose[4]});
  sprite.setOrigin({pose[5], pose[6]});
  const auto parent = Get(input, "parent");
  if (!parent->IsUndefined()) {
    if (!parent->IsFloat32Array() ||
        parent.As<v8::Float32Array>()->ByteLength() != 64) {
      Nan::ThrowTypeError("Expected a parent matrix");
      return false;
    }
    std::array<float, 16> matrix{};
    parent.As<v8::Float32Array>()->CopyContents(matrix.data(), sizeof(matrix));
    states.transform = sf::Transform(
        matrix[0], matrix[4], matrix[12],
        matrix[1], matrix[5], matrix[13],
        matrix[3], matrix[7], matrix[15]);
  }
  return true;
}

NAN_METHOD(EvaluateSprite) {
  if (!info[0]->IsObject()) return Nan::ThrowTypeError("Expected a snapshot");
  const auto input = info[0].As<v8::Object>();
  auto* texture = SharedHandle<sf::Texture>::From(Get(input, "texture"));
  if (!texture) return;
  sf::Sprite sprite(*texture->owner());
  sf::RenderStates states;
  if (!Configure(sprite, input, states)) return;
  info.GetReturnValue().Set(Describe(sprite));
}

NAN_METHOD(RenderSpriteAppearanceOracle) {
  if (!info[0]->IsArray()) return Nan::ThrowTypeError("Expected snapshots");
  const auto inputs = info[0].As<v8::Array>();
  sf::RenderTexture target({64, 64});
  target.clear(sf::Color::Black);
  for (std::uint32_t i = 0; i < inputs->Length(); ++i) {
    const auto value = Nan::Get(inputs, i).ToLocalChecked();
    if (!value->IsObject()) return Nan::ThrowTypeError("Expected a snapshot");
    const auto input = value.As<v8::Object>();
    auto* texture = SharedHandle<sf::Texture>::From(Get(input, "texture"));
    if (!texture) return;
    sf::Sprite sprite(*texture->owner());
    sf::RenderStates states;
    if (!Configure(sprite, input, states)) return;
    target.draw(sprite, states);
  }
  target.display();
  const auto image = target.getTexture().copyToImage();
  info.GetReturnValue().Set(Nan::CopyBuffer(
      reinterpret_cast<const char*>(image.getPixelsPtr()), 64 * 64 * 4)
      .ToLocalChecked());
}

NAN_METHOD(ReadSpriteAppearance) {
  auto* handle = SharedHandle<sfmljs::SpriteState>::From(info[0]);
  if (!handle) return;
  if (info[1]->IsTrue()) handle->owner()->SyncSprite();
  auto result = Describe(*handle->owner());
  Nan::Set(result, Nan::New("currentTexture").ToLocalChecked(),
           Nan::New(&handle->owner()->getTexture() ==
                    handle->owner()->texture.get())).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SpriteRectSharesStorage) {
  auto* sprite = SharedHandle<sfmljs::SpriteState>::From(info[0]);
  if (!sprite) return;
  auto* rectangle = SharedHandle<sf::IntRect>::From(info[1]);
  if (rectangle) info.GetReturnValue().Set(
      rectangle->owner().get() == &sprite->owner()->appearance.rectangle);
}

}  // namespace

NAN_MODULE_INIT(InitializeSpriteProbes) {
  Nan::SetMethod(target, "evaluateSprite", EvaluateSprite);
  Nan::SetMethod(target, "renderSpriteAppearanceOracle", RenderSpriteAppearanceOracle);
  Nan::SetMethod(target, "readSpriteAppearance", ReadSpriteAppearance);
  Nan::SetMethod(target, "spriteRectSharesStorage", SpriteRectSharesStorage);
}
