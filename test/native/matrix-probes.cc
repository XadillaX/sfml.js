#include "../../native/value-binding.h"

namespace {

using sfmljs::SharedHandle;
using namespace sfmljs::values;

template <typename T>
void ReadMatrix(const CallbackInfo& info) {
  auto* handle = SharedHandle<T>::From(info[0]);
  if (!handle) return;
  const auto& data = handle->owner()->array;
  auto result = Nan::New<v8::Array>(data.size());
  for (std::uint32_t i = 0; i < data.size(); ++i) {
    Nan::Set(result, i, Nan::New(static_cast<double>(data[i]))).FromJust();
  }
  info.GetReturnValue().Set(result);
}

template <typename T>
void SetMatrixElement(const CallbackInfo& info) {
  auto* handle = SharedHandle<T>::From(info[0]);
  if (!handle) return;
  auto& data = handle->owner()->array;
  if (!info[1]->IsUint32() || Nan::To<uint32_t>(info[1]).FromJust() >= data.size()) {
    return Nan::ThrowRangeError("Expected a valid matrix index");
  }
  if (!info[2]->IsNumber()) {
    return Nan::ThrowTypeError("Expected a matrix element");
  }
  data[Nan::To<uint32_t>(info[1]).FromJust()] =
      static_cast<float>(Nan::To<double>(info[2]).FromJust());
}

template <typename T>
void MatrixFromTransform(const CallbackInfo& info) {
  auto* handle = SharedHandle<sf::Transform>::From(info[0]);
  if (handle) ReturnMapped(info, std::make_shared<T>(*handle->owner()));
}

template <typename T>
void MatrixFromArray(const CallbackInfo& info) {
  constexpr auto count = Layout<T>::bytes / sizeof(float);
  if (!info[0]->IsFloat32Array()) {
    return Nan::ThrowTypeError("Expected a Float32Array");
  }
  const auto view = info[0].As<v8::Float32Array>();
  if (view->Length() != count) {
    return Nan::ThrowRangeError("Expected a matrix-sized Float32Array");
  }
  std::array<float, count> data;
  view->CopyContents(data.data(), sizeof(data));
  ReturnMapped(info, std::make_shared<T>(data.data()));
}

}  // namespace

NAN_MODULE_INIT(InitializeMatrixProbes) {
  Nan::SetMethod(target, "readMat3", ReadMatrix<sf::Glsl::Mat3>);
  Nan::SetMethod(target, "readMat4", ReadMatrix<sf::Glsl::Mat4>);
  Nan::SetMethod(target, "setMat3Element", SetMatrixElement<sf::Glsl::Mat3>);
  Nan::SetMethod(target, "setMat4Element", SetMatrixElement<sf::Glsl::Mat4>);
  Nan::SetMethod(target, "mat3FromTransform", MatrixFromTransform<sf::Glsl::Mat3>);
  Nan::SetMethod(target, "mat4FromTransform", MatrixFromTransform<sf::Glsl::Mat4>);
  Nan::SetMethod(target, "mat3FromArray", MatrixFromArray<sf::Glsl::Mat3>);
  Nan::SetMethod(target, "mat4FromArray", MatrixFromArray<sf::Glsl::Mat4>);
}
