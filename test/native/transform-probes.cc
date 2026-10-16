#include "../../native/value-binding.h"
#include "value-oracle.h"

namespace {

using TransformHandle = sfmljs::SharedHandle<sf::Transform>;
using VectorHandle = sfmljs::SharedHandle<sf::Vector2f>;
using RectHandle = sfmljs::SharedHandle<sf::FloatRect>;
using AngleHandle = sfmljs::SharedHandle<sf::Angle>;

v8::Local<v8::Array> Matrix(const sf::Transform& transform) {
  auto array = Nan::New<v8::Array>(16);
  for (std::uint32_t i = 0; i < 16; ++i) {
    Nan::Set(array, i, Nan::New(
        static_cast<double>(transform.getMatrix()[i]))).FromJust();
  }
  return array;
}

void SetMatrix(v8::Local<v8::Object> result, const char* name,
               const sf::Transform& transform) {
  Nan::Set(result, Nan::New(name).ToLocalChecked(), Matrix(transform)).FromJust();
}

NAN_METHOD(ReadTransform) {
  auto* handle = TransformHandle::From(info[0]);
  if (handle) info.GetReturnValue().Set(Matrix(*handle->owner()));
}

NAN_METHOD(TranslateTransform) {
  auto* handle = TransformHandle::From(info[0]);
  if (!handle) return;
  handle->owner()->translate({
      static_cast<float>(Nan::To<double>(info[1]).FromMaybe(0)),
      static_cast<float>(Nan::To<double>(info[2]).FromMaybe(0))});
}

NAN_METHOD(EvaluateTransform) {
  auto* lhs = TransformHandle::From(info[0]);
  if (!lhs) return;
  auto* rhs = TransformHandle::From(info[1]);
  if (!rhs) return;
  auto* point = VectorHandle::From(info[2]);
  if (!point) return;
  auto* rect = RectHandle::From(info[3]);
  if (!rect) return;
  auto* angle = AngleHandle::From(info[4]);
  if (!angle) return;
  auto* factors = VectorHandle::From(info[5]);
  if (!factors) return;
  auto* center = VectorHandle::From(info[6]);
  if (!center) return;
  const auto& a = *lhs->owner();
  const auto& b = *rhs->owner();
  auto result = Nan::New<v8::Object>();
  SetMatrix(result, "matrix", a);
  SetMatrix(result, "inverse", a.getInverse());
  SetMatrix(result, "multiply", a * b);
  SetMatrix(result, "selfCombine", sf::Transform(a).combine(a));
  sfmljs::SetVector(result, "point", a.transformPoint(*point->owner()));
  sfmljs::SetVector(result, "multiplyPoint", a * *point->owner());
  const auto bounds = a.transformRect(*rect->owner());
  auto rectangle = Nan::New<v8::Object>();
  sfmljs::SetVector(rectangle, "position", bounds.position);
  sfmljs::SetVector(rectangle, "size", bounds.size);
  Nan::Set(result, Nan::New("rectangle").ToLocalChecked(), rectangle).FromJust();
  auto value = a;
  SetMatrix(result, "combine", value.combine(b));
  value = a;
  SetMatrix(result, "multiplyAssign", value *= b);
  value = a;
  SetMatrix(result, "translate", value.translate(*point->owner()));
  value = a;
  SetMatrix(result, "scale", value.scale(*factors->owner()));
  value = a;
  SetMatrix(result, "scaleCenter", value.scale(*factors->owner(), *center->owner()));
  value = a;
  SetMatrix(result, "rotate", value.rotate(*angle->owner()));
  value = a;
  SetMatrix(result, "rotateCenter", value.rotate(*angle->owner(), *center->owner()));
  sfmljs::Set(result, "equal", a == b);
  sfmljs::Set(result, "notEqual", a != b);
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeTransformProbes) {
  Nan::SetMethod(target, "readTransform", ReadTransform);
  Nan::SetMethod(target, "translateTransform", TranslateTransform);
  Nan::SetMethod(target, "evaluateTransform", EvaluateTransform);
}
