#include "../../native/shape-state.h"
#include "../../native/value-binding.h"
#include <SFML/Graphics/Image.hpp>

namespace {
using sfmljs::SharedHandle;

v8::Local<v8::Value> Get(v8::Local<v8::Object> input, const char* name) {
  return Nan::Get(input, Nan::New(name).ToLocalChecked()).ToLocalChecked();
}

// Independent custom shape, using the public SFML extension contract.
struct Polygon : sf::Shape {
  std::vector<sf::Vector2f> points;
  std::size_t getPointCount() const override { return points.size(); }
  sf::Vector2f getPoint(std::size_t index) const override { return points[index]; }
  void refresh() { update(); }
};

template <class T>
v8::Local<v8::Array> Box(const sf::Rect<T>& rect) {
  auto result = Nan::New<v8::Array>(4);
  const double fields[]{double(rect.position.x), double(rect.position.y),
                         double(rect.size.x), double(rect.size.y)};
  for (unsigned i = 0; i < 4; ++i) {
    Nan::Set(result, i, Nan::New(fields[i])).FromJust();
  }
  return result;
}

v8::Local<v8::Object> Describe(const sf::Shape& shape) {
  auto result = Nan::New<v8::Object>();
#define FIELD(name, value) \
  Nan::Set(result, Nan::New(name).ToLocalChecked(), value).FromJust()
  FIELD("rect", Box(shape.getTextureRect()));
  FIELD("local", Box(shape.getLocalBounds()));
  FIELD("global", Box(shape.getGlobalBounds()));
  FIELD("fill", Nan::New(shape.getFillColor().toInteger()));
  FIELD("outline", Nan::New(shape.getOutlineColor().toInteger()));
  FIELD("thickness", Nan::New(shape.getOutlineThickness()));
  FIELD("miterLimit", Nan::New(shape.getMiterLimit()));
  const auto center = shape.getGeometricCenter();
  auto middle = Nan::New<v8::Array>(2);
  Nan::Set(middle, 0, Nan::New(center.x)).FromJust();
  Nan::Set(middle, 1, Nan::New(center.y)).FromJust();
  FIELD("center", middle);
  auto points = Nan::New<v8::Array>(shape.getPointCount() * 2);
  for (unsigned i = 0; i < shape.getPointCount(); ++i) {
    const auto point = shape.getPoint(i);
    Nan::Set(points, i * 2, Nan::New(point.x)).FromJust();
    Nan::Set(points, i * 2 + 1, Nan::New(point.y)).FromJust();
  }
  FIELD("points", points);
#undef FIELD
  return result;
}

std::unique_ptr<sf::Shape> Configure(v8::Local<v8::Object> input,
                                   sf::RenderStates& states) {
  const auto kind = Nan::To<unsigned>(Get(input, "kind")).FromJust();
  Nan::TypedArrayContents<float> dimensions(Get(input, "dimensions"));
  Nan::TypedArrayContents<float> points(Get(input, "points"));
  std::unique_ptr<sf::Shape> shape;
  if (kind == 1) {
    shape = std::make_unique<sf::CircleShape>((*dimensions)[0], (*dimensions)[1]);
  } else if (kind == 2) {
    shape = std::make_unique<sf::RectangleShape>(
        sf::Vector2f{(*dimensions)[0], (*dimensions)[1]});
  } else if (kind == 3) {
    auto polygon = std::make_unique<sf::ConvexShape>(points.length() / 2);
    for (unsigned i = 0; i < points.length() / 2; ++i) {
      polygon->setPoint(i, {(*points)[i * 2], (*points)[i * 2 + 1]});
    }
    shape = std::move(polygon);
  } else {
    auto polygon = std::make_unique<Polygon>();
    for (unsigned i = 0; i < points.length() / 2; ++i) {
      polygon->points.push_back({(*points)[i * 2], (*points)[i * 2 + 1]});
    }
    polygon->refresh();
    shape = std::move(polygon);
  }
  const auto textureValue = Get(input, "texture");
  if (!textureValue->IsNull()) {
    const auto texture = sfmljs::ReadTexture(textureValue);
    if (!texture) return {};
    shape->setTexture(texture.get());
  }
  Nan::TypedArrayContents<std::int32_t> rect(Get(input, "rect"));
  shape->setTextureRect({{(*rect)[0], (*rect)[1]}, {(*rect)[2], (*rect)[3]}});
  shape->setFillColor(sf::Color(
      Nan::To<std::uint32_t>(Get(input, "fill")).FromJust()));
  shape->setOutlineColor(sf::Color(
      Nan::To<std::uint32_t>(Get(input, "outline")).FromJust()));
  shape->setOutlineThickness(Nan::To<double>(Get(input, "thickness")).FromJust());
  shape->setMiterLimit(Nan::To<double>(Get(input, "miterLimit")).FromJust());
  Nan::TypedArrayContents<float> pose(Get(input, "transform"));
  shape->setPosition({(*pose)[0], (*pose)[1]});
  shape->setRotation(sf::radians((*pose)[2]));
  shape->setScale({(*pose)[3], (*pose)[4]});
  shape->setOrigin({(*pose)[5], (*pose)[6]});
  Nan::TypedArrayContents<float> matrix(Get(input, "parent"));
  states.transform = sf::Transform(
      (*matrix)[0], (*matrix)[4], (*matrix)[12],
      (*matrix)[1], (*matrix)[5], (*matrix)[13],
      (*matrix)[3], (*matrix)[7], (*matrix)[15]);
  return shape;
}

NAN_METHOD(EvaluateShape) {
  sf::RenderStates states;
  const auto shape = Configure(info[0].As<v8::Object>(), states);
  if (shape) info.GetReturnValue().Set(Describe(*shape));
}

NAN_METHOD(RenderShapeOracle) {
  const auto inputs = info[0].As<v8::Array>();
  sf::RenderTexture target({64, 64});
  target.clear();
  for (unsigned i = 0; i < inputs->Length(); ++i) {
    sf::RenderStates states;
    const auto shape = Configure(
        Nan::Get(inputs, i).ToLocalChecked().As<v8::Object>(), states);
    if (!shape) return;
    target.draw(*shape, states);
  }
  target.display();
  const auto image = target.getTexture().copyToImage();
  info.GetReturnValue().Set(Nan::CopyBuffer(
      reinterpret_cast<const char*>(image.getPixelsPtr()), 64 * 64 * 4)
      .ToLocalChecked());
}

NAN_METHOD(ReadShape) {
  auto* handle = SharedHandle<sfmljs::ShapeState>::From(info[0]);
  if (!handle) return;
  const auto& state = *handle->owner();
  auto result = Describe(*state.shape);
  Nan::Set(result, Nan::New("currentTexture").ToLocalChecked(),
           Nan::New(state.shape->getTexture() == state.texture.get())).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ShapeAliases) {
  auto* handle = SharedHandle<sfmljs::ShapeState>::From(info[0]);
  auto* transform = SharedHandle<sfmljs::TransformableState>::From(info[1]);
  auto* rectangle = SharedHandle<sf::IntRect>::From(info[2]);
  if (!handle || !transform || !rectangle) return;
  info.GetReturnValue().Set(
      transform->owner().get() == handle->owner().get() &&
      rectangle->owner().get() == &handle->owner()->appearance.rectangle);
}
}  // namespace

NAN_MODULE_INIT(InitializeShapeProbes) {
  Nan::SetMethod(target, "evaluateShape", EvaluateShape);
  Nan::SetMethod(target, "renderShapeOracle", RenderShapeOracle);
  Nan::SetMethod(target, "readShape", ReadShape);
  Nan::SetMethod(target, "shapeAliases", ShapeAliases);
}
