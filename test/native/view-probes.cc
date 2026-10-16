#include "../../native/graphics-state.h"
#include "../../native/image-state.h"
#include "../../native/view-data.h"

#include <SFML/Window/Context.hpp>
#define GL_SILENCE_DEPRECATION
#include <SFML/OpenGL.hpp>

namespace {

using Target = sfmljs::RenderTextureState;

template <typename T>
v8::Local<v8::Array> Array(const T* values, std::uint32_t count) {
  auto result = Nan::New<v8::Array>(count);
  for (std::uint32_t i = 0; i < count; ++i) {
    Nan::Set(result, i, Nan::New(static_cast<double>(values[i]))).FromJust();
  }
  return result;
}

bool ReadView(v8::Local<v8::Value> value, sf::View& view) {
  if (!value->IsFloat32Array() ||
      value.As<v8::Float32Array>()->Length() != 13) {
    Nan::ThrowTypeError("Expected 13 view floats");
    return false;
  }
  Nan::TypedArrayContents<float> data(value);
  if (!*data) return false;
  const std::span<const float, 13> values(*data, 13);
  if (!sfmljs::ValidView(values)) {
    Nan::ThrowRangeError("Invalid scissor");
    return false;
  }
  view = sfmljs::MakeView(values);
  return true;
}

NAN_METHOD(ViewOracle) {
  sf::View view;
  if (!ReadView(info[0], view)) return;
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("matrix").ToLocalChecked(),
           Array(view.getTransform().getMatrix(), 16)).FromJust();
  Nan::Set(result, Nan::New("inverse").ToLocalChecked(),
           Array(view.getInverseTransform().getMatrix(), 16)).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ViewCoordinatesOracle) {
  auto* target = sfmljs::SharedHandle<Target>::From(info[0]);
  if (!target) return;
  sf::View view;
  if (!ReadView(info[1], view)) return;
  const auto pixel = target->owner()->target.mapCoordsToPixel(
      {static_cast<float>(Nan::To<double>(info[2]).FromJust()),
       static_cast<float>(Nan::To<double>(info[3]).FromJust())}, view);
  const auto point = target->owner()->target.mapPixelToCoords(
      {Nan::To<int>(info[4]).FromJust(), Nan::To<int>(info[5]).FromJust()}, view);
  const auto viewport = target->owner()->target.getViewport(view);
  const auto scissor = target->owner()->target.getScissor(view);
  const double values[] = {
      static_cast<double>(pixel.x), static_cast<double>(pixel.y), point.x, point.y,
      static_cast<double>(viewport.position.x), static_cast<double>(viewport.position.y),
      static_cast<double>(viewport.size.x), static_cast<double>(viewport.size.y),
      static_cast<double>(scissor.position.x), static_cast<double>(scissor.position.y),
      static_cast<double>(scissor.size.x), static_cast<double>(scissor.size.y)};
  info.GetReturnValue().Set(Array(values, 12));
}

NAN_METHOD(RenderViewOracle) {
  sf::RenderTexture target({32, 16});
  const auto original = target.getDefaultView();
  const sf::Texture texture(sf::Image({4, 4}, sf::Color::White));
  sf::Sprite sprite(texture);
  target.clear(sf::Color::Black);
  sf::View view(original);
  view.setViewport({{0, 0}, {0.5f, 1}});
  view.setCenter({8, 8});
  view.setSize({16, 16});
  target.setView(view);
  sprite.setPosition({4, 4});
  sprite.setColor(sf::Color::Red);
  target.draw(sprite);
  view.setRotation(sf::degrees(90));
  view.setViewport({{0.5f, 0}, {0.5f, 1}});
  target.setView(view);
  sprite.setColor(sf::Color::Green);
  target.draw(sprite);
  view.setScissor({{0.25f, 0.5f}, {0.5f, 0.5f}});
  target.setView(view);
  target.clear(sf::Color::Blue);
  target.setView(original);
  sprite.setPosition({0, 12});
  sprite.setColor(sf::Color::Yellow);
  target.draw(sprite);
  target.display();
  info.GetReturnValue().Set(sfmljs::MapImage(info.GetIsolate(),
      std::make_shared<sf::Image>(target.getTexture().copyToImage())));
}

NAN_METHOD(SetExternalGLState) {
  const auto enable = reinterpret_cast<decltype(&glEnable)>(
      sf::Context::getFunction("glEnable"));
  const auto mode = reinterpret_cast<decltype(&glMatrixMode)>(
      sf::Context::getFunction("glMatrixMode"));
  const auto load = reinterpret_cast<decltype(&glLoadMatrixf)>(
      sf::Context::getFunction("glLoadMatrixf"));
  const auto viewport = reinterpret_cast<decltype(&glViewport)>(
      sf::Context::getFunction("glViewport"));
  enable(GL_DEPTH_TEST);
  enable(GL_CULL_FACE);
  viewport(1, 2, 17, 19);
  const float matrix[] = {2, 0, 0, 0, 0, 3, 0, 0,
                          0, 0, 1, 0, 5, 7, 0, 1};
  for (const auto type : {GL_MODELVIEW, GL_PROJECTION, GL_TEXTURE}) {
    mode(type);
    load(matrix);
  }
  mode(GL_MODELVIEW);
}

NAN_METHOD(ReadGLState) {
  const auto get = reinterpret_cast<decltype(&glGetFloatv)>(
      sf::Context::getFunction("glGetFloatv"));
  const auto integer = reinterpret_cast<decltype(&glGetIntegerv)>(
      sf::Context::getFunction("glGetIntegerv"));
  const auto enabled = reinterpret_cast<decltype(&glIsEnabled)>(
      sf::Context::getFunction("glIsEnabled"));
  float values[54]{};
  get(GL_MODELVIEW_MATRIX, values);
  get(GL_PROJECTION_MATRIX, values + 16);
  get(GL_TEXTURE_MATRIX, values + 32);
  GLint viewport[4]{};
  integer(GL_VIEWPORT, viewport);
  for (int i = 0; i < 4; ++i) values[48 + i] = viewport[i];
  values[52] = enabled(GL_DEPTH_TEST);
  values[53] = enabled(GL_CULL_FACE);
  info.GetReturnValue().Set(Array(values, 54));
}

}  // namespace

NAN_MODULE_INIT(InitializeViewProbes) {
  Nan::SetMethod(target, "viewOracle", ViewOracle);
  Nan::SetMethod(target, "viewCoordinatesOracle", ViewCoordinatesOracle);
  Nan::SetMethod(target, "renderViewOracle", RenderViewOracle);
  Nan::SetMethod(target, "setExternalGLState", SetExternalGLState);
  Nan::SetMethod(target, "readGLState", ReadGLState);
}
