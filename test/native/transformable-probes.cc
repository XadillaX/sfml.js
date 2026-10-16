#include "../../native/graphics-state.h"
#include "value-oracle.h"

#include <SFML/Graphics/Image.hpp>

#include <cmath>
#include <limits>

namespace {

using sfmljs::SharedHandle;
using StateHandle = SharedHandle<sfmljs::TransformableState>;

bool ReadData(v8::Local<v8::Value> input, sfmljs::TransformableData& data) {
  if (!input->IsFloat32Array() ||
      input.As<v8::Float32Array>()->ByteLength() != sizeof(data)) {
    Nan::ThrowTypeError("Expected seven float32 transform components");
    return false;
  }
  input.As<v8::Float32Array>()->CopyContents(data.data(), sizeof(data));
  const double quotient = std::trunc(data[2] / sf::priv::tau);
  if (!std::isfinite(quotient) ||
      quotient < std::numeric_limits<int>::min() ||
      quotient > std::numeric_limits<int>::max()) {
    Nan::ThrowRangeError("Rotation is outside SFML's wrapping domain");
    return false;
  }
  return true;
}

// Deliberately independent of the production staging-to-SFML helper.
void SetOracle(sf::Transformable& object, const sfmljs::TransformableData& data) {
  object.setOrigin({data[5], data[6]});
  object.setScale({data[3], data[4]});
  object.setRotation(sf::radians(data[2]));
  object.setPosition({data[0], data[1]});
}

v8::Local<v8::Object> Snapshot(const sf::Transformable& object) {
  auto result = Nan::New<v8::Object>();
  sfmljs::SetVector(result, "position", object.getPosition());
  sfmljs::SetVector(result, "scale", object.getScale());
  sfmljs::SetVector(result, "origin", object.getOrigin());
  sfmljs::Set(result, "rotation", object.getRotation().asRadians());
  const auto set = [&](const char* name, const sf::Transform& transform) {
    auto matrix = Nan::New<v8::Array>(16);
    for (std::uint32_t i = 0; i < 16; ++i) {
      Nan::Set(matrix, i,
          Nan::New(static_cast<double>(transform.getMatrix()[i]))).FromJust();
    }
    Nan::Set(result, Nan::New(name).ToLocalChecked(), matrix).FromJust();
  };
  set("transform", object.getTransform());
  set("inverse", object.getInverseTransform());
  return result;
}

NAN_METHOD(ReadTransformable) {
  auto* handle = StateHandle::From(info[0]);
  if (!handle) return;
  if (!info[1]->IsFalse()) handle->owner()->Sync();
  info.GetReturnValue().Set(Snapshot(*handle->owner()->object));
}

NAN_METHOD(SetTransformableState) {
  auto* handle = StateHandle::From(info[0]);
  if (!handle) return;
  sfmljs::TransformableData data;
  if (!ReadData(info[1], data)) return;
  data[2] = sf::radians(data[2]).wrapUnsigned().asRadians();
  handle->owner()->values = data;
  handle->owner()->Sync();
}

NAN_METHOD(RetainTransformable) {
  auto* handle = StateHandle::From(info[0]);
  if (handle) info.GetReturnValue().Set(StateHandle::Create(handle->owner()));
}

NAN_METHOD(TransformableUseCount) {
  auto* handle = StateHandle::From(info[0]);
  if (handle) {
    info.GetReturnValue().Set(static_cast<double>(handle->owner().use_count()));
  }
}

NAN_METHOD(TransformableSharesSprite) {
  auto* base = StateHandle::From(info[0]);
  auto* sprite = SharedHandle<sfmljs::SpriteState>::From(info[1]);
  if (!base || !sprite) return;
  const auto& a = base->owner();
  const auto& b = sprite->owner();
  info.GetReturnValue().Set(
      !a.owner_before(b) && !b.owner_before(a) &&
      a.get() == static_cast<sfmljs::TransformableState*>(b.get()) &&
      a->object == static_cast<sf::Transformable*>(b.get()));
}

NAN_METHOD(EvaluateTransformable) {
  sfmljs::TransformableData data;
  if (!ReadData(info[0], data)) return;
  auto* offset = SharedHandle<sf::Vector2f>::From(info[1]);
  auto* angle = SharedHandle<sf::Angle>::From(info[2]);
  auto* factors = SharedHandle<sf::Vector2f>::From(info[3]);
  if (!offset || !angle || !factors) return;
  sf::Transformable object;
  SetOracle(object, data);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("base").ToLocalChecked(), Snapshot(object)).FromJust();
  object.move(*offset->owner());
  object.rotate(*angle->owner());
  object.scale(*factors->owner());
  Nan::Set(result, Nan::New("changed").ToLocalChecked(), Snapshot(object)).FromJust();
  info.GetReturnValue().Set(result);
}

// Immediate C++ draws form an independent reference for the deferred JS queue.
NAN_METHOD(RenderSpriteSnapshots) {
  auto* texture = SharedHandle<sf::Texture>::From(info[0]);
  if (!texture) return;
  if (!info[1]->IsArray()) return Nan::ThrowTypeError("Expected snapshots");
  const auto inputs = info[1].As<v8::Array>();
  std::vector<sfmljs::TransformableData> snapshots(inputs->Length());
  for (std::uint32_t i = 0; i < inputs->Length(); ++i) {
    if (!ReadData(Nan::Get(inputs, i).ToLocalChecked(), snapshots[i])) return;
  }
  sf::RenderTexture target;
  if (!target.resize({64, 64})) return Nan::ThrowError("Could not render oracle");
  target.clear(sf::Color::Black);
  sf::Sprite sprite(*texture->owner());
  for (const auto& values : snapshots) {
    SetOracle(sprite, values);
    target.draw(sprite);
  }
  target.display();
  const auto image = target.getTexture().copyToImage();
  info.GetReturnValue().Set(Nan::CopyBuffer(
      reinterpret_cast<const char*>(image.getPixelsPtr()), 64 * 64 * 4)
      .ToLocalChecked());
}

}  // namespace

NAN_MODULE_INIT(InitializeTransformableProbes) {
  Nan::SetMethod(target, "readTransformable", ReadTransformable);
  Nan::SetMethod(target, "setTransformableState", SetTransformableState);
  Nan::SetMethod(target, "retainTransformable", RetainTransformable);
  Nan::SetMethod(target, "transformableUseCount", TransformableUseCount);
  Nan::SetMethod(target, "transformableSharesSprite", TransformableSharesSprite);
  Nan::SetMethod(target, "evaluateTransformable", EvaluateTransformable);
  Nan::SetMethod(target, "renderSpriteSnapshots", RenderSpriteSnapshots);
}
