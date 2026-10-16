#include "../../native/value-binding.h"
#include "value-oracle.h"

#include <limits>
#include <type_traits>

namespace {

using namespace sfmljs::values;
using AngleHandle = sfmljs::SharedHandle<sf::Angle>;
using ColorHandle = sfmljs::SharedHandle<sf::Color>;
using VertexHandle = sfmljs::SharedHandle<sf::Vertex>;

NAN_METHOD(SameBackingStore) {
  if (!info[0]->IsArrayBuffer() || !info[1]->IsArrayBuffer()) {
    return Nan::ThrowTypeError("Expected two ArrayBuffers");
  }
  const auto left = info[0].As<v8::ArrayBuffer>();
  const auto right = info[1].As<v8::ArrayBuffer>();
  info.GetReturnValue().Set(!left->WasDetached() && !right->WasDetached() &&
                           left->GetBackingStore() == right->GetBackingStore());
}

// These entry points are internal test probes, not production value operations.
template <typename Values>
void Retain(const CallbackInfo& info) {
  Values::Visit(info[0], [&](auto* handle) {
    using H = std::remove_pointer_t<decltype(handle)>;
    info.GetReturnValue().Set(H::Create(handle->owner()));
  });
}

template <typename Values>
void UseCount(const CallbackInfo& info) {
  Values::Visit(info[0], [&](auto* handle) {
    info.GetReturnValue().Set(
        static_cast<double>(handle->owner().use_count()));
  });
}

NAN_METHOD(ReadAngle) {
  auto* handle = AngleHandle::From(info[0]);
  if (handle) info.GetReturnValue().Set(handle->owner()->asRadians());
}

NAN_METHOD(SetAngle) {
  auto* handle = AngleHandle::From(info[0]);
  if (!handle) return;
  *handle->owner() = sf::radians(static_cast<float>(
      Nan::To<double>(info[1]).FromMaybe(0)));
}

bool ValidRemainder(float lhs, float rhs) {
  const double quotient = std::trunc(static_cast<double>(lhs / rhs));
  return rhs > 0 && std::isfinite(quotient) &&
      quotient >= std::numeric_limits<int>::min() &&
      quotient <= std::numeric_limits<int>::max();
}

NAN_METHOD(EvaluateAngle) {
  const float a = static_cast<float>(Nan::To<double>(info[0]).FromMaybe(0));
  const float b = static_cast<float>(Nan::To<double>(info[1]).FromMaybe(0));
  const float scalar = static_cast<float>(Nan::To<double>(info[2]).FromMaybe(3));
  if (scalar == 0 || !ValidRemainder(a, b) ||
      !ValidRemainder(a + sf::priv::pi, sf::priv::tau)) {
    return Nan::ThrowRangeError("Angle oracle inputs are outside SFML's domain");
  }
  const auto lhs = sf::radians(a);
  const auto rhs = sf::radians(b);
  auto result = Nan::New<v8::Object>();
  sfmljs::Set(result, "asDegrees", lhs.asDegrees());
  sfmljs::Set(result, "degrees", sf::degrees(a).asRadians());
  sfmljs::Set(result, "wrapSigned", lhs.wrapSigned().asRadians());
  sfmljs::Set(result, "wrapUnsigned", lhs.wrapUnsigned().asRadians());
  sfmljs::Set(result, "add", (lhs + rhs).asRadians());
  sfmljs::Set(result, "subtract", (lhs - rhs).asRadians());
  sfmljs::Set(result, "negate", (-lhs).asRadians());
  sfmljs::Set(result, "multiply", (lhs * scalar).asRadians());
  sfmljs::Set(result, "leftMultiply", (scalar * lhs).asRadians());
  sfmljs::Set(result, "divide", (lhs / scalar).asRadians());
  sfmljs::Set(result, "ratio", lhs / rhs);
  sfmljs::Set(result, "modulo", (lhs % rhs).asRadians());
  auto value = lhs;
  sfmljs::Set(result, "addAssign", (value += rhs).asRadians());
  value = lhs;
  sfmljs::Set(result, "subtractAssign", (value -= rhs).asRadians());
  value = lhs;
  sfmljs::Set(result, "multiplyAssign", (value *= scalar).asRadians());
  value = lhs;
  sfmljs::Set(result, "divideAssign", (value /= scalar).asRadians());
  value = lhs;
  sfmljs::Set(result, "moduloAssign", (value %= rhs).asRadians());
  sfmljs::Set(result, "equal", lhs == rhs);
  sfmljs::Set(result, "notEqual", lhs != rhs);
  sfmljs::Set(result, "less", lhs < rhs);
  sfmljs::Set(result, "lessEqual", lhs <= rhs);
  sfmljs::Set(result, "greater", lhs > rhs);
  sfmljs::Set(result, "greaterEqual", lhs >= rhs);
  info.GetReturnValue().Set(result);
}

template <typename Values>
void ReadVector(const CallbackInfo& info) {
  Values::Visit(info[0], [&](auto* handle) {
    info.GetReturnValue().Set(sfmljs::Coordinates(*handle->owner()));
  });
}

template <typename Values>
void SwapVector(const CallbackInfo& info) {
  Values::Visit(info[0], [](auto* handle) {
    auto& vector = *handle->owner();
    if constexpr (requires { vector.w; }) {
      std::swap(vector.x, vector.w);
    } else if constexpr (requires { vector.z; }) {
      std::swap(vector.x, vector.z);
    } else {
      std::swap(vector.x, vector.y);
    }
  });
}

template <typename Values>
void ConvertVector(const CallbackInfo& info) {
  Values::Visit(info[0], [&](auto* handle) {
    Values::Select(info[1], [&]<typename V>() {
      info.GetReturnValue().Set(
          sfmljs::Coordinates(static_cast<V>(*handle->owner())));
    });
  });
}

NAN_METHOD(ColorVector4) {
  auto* color = ColorHandle::From(info[0]);
  if (!color) return;
  auto result = Nan::New<v8::Object>();
  sfmljs::SetVector(result, "Vec4", sf::Glsl::Vec4(*color->owner()));
  sfmljs::SetVector(result, "Ivec4", sf::Glsl::Ivec4(*color->owner()));
  info.GetReturnValue().Set(result);
}

template <typename Values>
void EvaluateVector(const CallbackInfo& info) {
  Values::Visit(info[0], [&](auto* lhs) {
    using H = std::remove_pointer_t<decltype(lhs)>;
    auto* rhs = H::From(info[1]);
    if (!rhs) return;
    const auto& vector = *lhs->owner();
    using V = std::decay_t<decltype(vector)>;
    using T = decltype(V::x);
    constexpr bool is3d = requires { vector.z; };
    const auto& other = *rhs->owner();
    bool canDivide = other.x != 0 && other.y != 0;
    if constexpr (is3d) {
      canDivide = canDivide && other.z != 0;
    }
    if (!canDivide && !std::is_same_v<T, bool>) {
      return Nan::ThrowRangeError("Vector divisor cannot be zero");
    }
    auto result = Nan::New<v8::Object>();
    sfmljs::Set(result, "lengthSquared", vector.lengthSquared());
    sfmljs::Set(result, "dot", vector.dot(other));
    if constexpr (is3d) {
      sfmljs::SetVector(result, "cross", vector.cross(other));
    } else {
      sfmljs::Set(result, "cross", vector.cross(other));
      sfmljs::SetVector(result, "perpendicular", vector.perpendicular());
    }
    sfmljs::SetVector(result, "componentWiseMul", vector.componentWiseMul(other));
    if (canDivide) {
      sfmljs::SetVector(result, "componentWiseDiv", vector.componentWiseDiv(other));
    }
    // The test oracle uses a representable, nonzero scalar for all types.
    sfmljs::EvaluateOperators(result, vector, other, T(3));
    sfmljs::EvaluateFloating(result, vector);
    if constexpr (!is3d && std::is_floating_point_v<T>) {
      const auto phi = sf::degrees(37);
      sfmljs::SetVector(result, "polar", V(vector.x, phi));
      sfmljs::SetVector(result, "rotatedBy", vector.rotatedBy(phi));
      sfmljs::SetVector(result, "projectedOnto", vector.projectedOnto(other));
      if (vector != V{}) {
        sfmljs::Set(result, "angle", vector.angle().asRadians());
        sfmljs::Set(result, "angleTo", vector.angleTo(other).asRadians());
      }
    }
    info.GetReturnValue().Set(result);
  });
}

NAN_METHOD(ReadColor) {
  auto* handle = ColorHandle::From(info[0]);
  if (handle) info.GetReturnValue().Set(Nan::New(handle->owner()->toInteger()));
}

NAN_METHOD(SetColor) {
  auto* handle = ColorHandle::From(info[0]);
  if (!handle) return;
  *handle->owner() = sf::Color(Nan::To<uint32_t>(info[1]).FromMaybe(0));
}

NAN_METHOD(EvaluateColor) {
  auto* lhs = ColorHandle::From(info[0]);
  if (!lhs) return;
  auto* rhs = ColorHandle::From(info[1]);
  if (!rhs) return;
  const auto left = *lhs->owner();
  const auto right = *rhs->owner();
  auto result = Nan::New<v8::Object>();
  sfmljs::Set(result, "toInteger", left.toInteger());
  sfmljs::Set(result, "add", (left + right).toInteger());
  sfmljs::Set(result, "subtract", (left - right).toInteger());
  sfmljs::Set(result, "multiply", (left * right).toInteger());
  auto value = left;
  sfmljs::Set(result, "addAssign", (value += right).toInteger());
  value = left;
  sfmljs::Set(result, "subtractAssign", (value -= right).toInteger());
  value = left;
  sfmljs::Set(result, "multiplyAssign", (value *= right).toInteger());
  sfmljs::Set(result, "equal", left == right);
  sfmljs::Set(result, "notEqual", left != right);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ColorConstants) {
  auto result = Nan::New<v8::Object>();
  sfmljs::Set(result, "Black", sf::Color::Black.toInteger());
  sfmljs::Set(result, "White", sf::Color::White.toInteger());
  sfmljs::Set(result, "Red", sf::Color::Red.toInteger());
  sfmljs::Set(result, "Green", sf::Color::Green.toInteger());
  sfmljs::Set(result, "Blue", sf::Color::Blue.toInteger());
  sfmljs::Set(result, "Yellow", sf::Color::Yellow.toInteger());
  sfmljs::Set(result, "Magenta", sf::Color::Magenta.toInteger());
  sfmljs::Set(result, "Cyan", sf::Color::Cyan.toInteger());
  sfmljs::Set(result, "Transparent", sf::Color::Transparent.toInteger());
  info.GetReturnValue().Set(result);
}

template <typename R>
v8::Local<v8::Object> RectCoordinates(const R& rect) {
  auto result = Nan::New<v8::Object>();
  sfmljs::SetVector(result, "position", rect.position);
  sfmljs::SetVector(result, "size", rect.size);
  return result;
}

NAN_METHOD(ReadRect) {
  RectValues::Visit(info[0], [&](auto* handle) {
    info.GetReturnValue().Set(RectCoordinates(*handle->owner()));
  });
}

NAN_METHOD(SwapRectMembers) {
  RectValues::Visit(info[0], [](auto* handle) {
    std::swap(handle->owner()->position, handle->owner()->size);
  });
}

NAN_METHOD(EvaluateRect) {
  RectValues::Visit(info[0], [&](auto* lhs) {
    using H = std::remove_pointer_t<decltype(lhs)>;
    auto* rhs = H::From(info[1]);
    if (!rhs) return;
    const auto& left = *lhs->owner();
    const auto& right = *rhs->owner();
    using V = std::decay_t<decltype(left.position)>;
    auto* point = sfmljs::SharedHandle<V>::From(info[2]);
    if (!point) return;
    auto result = Nan::New<v8::Object>();
    sfmljs::Set(result, "contains", left.contains(*point->owner()));
    sfmljs::SetVector(result, "center", left.getCenter());
    sfmljs::Set(result, "equal", left == right);
    sfmljs::Set(result, "notEqual", left != right);
    const auto intersection = left.findIntersection(right);
    if (intersection) {
      Nan::Set(result, Nan::New("intersection").ToLocalChecked(),
               RectCoordinates(*intersection)).FromJust();
    }
    info.GetReturnValue().Set(result);
  });
}

v8::Local<v8::Object> VertexFields(const sf::Vertex& vertex) {
  auto result = Nan::New<v8::Object>();
  sfmljs::SetVector(result, "position", vertex.position);
  sfmljs::Set(result, "color", vertex.color.toInteger());
  sfmljs::SetVector(result, "texCoords", vertex.texCoords);
  return result;
}

NAN_METHOD(ReadVertex) {
  auto* handle = VertexHandle::From(info[0]);
  if (handle) info.GetReturnValue().Set(VertexFields(*handle->owner()));
}

NAN_METHOD(CopyVertex) {
  auto* target = VertexHandle::From(info[0]);
  if (!target) return;
  auto* source = VertexHandle::From(info[1]);
  if (source) *target->owner() = *source->owner();
}

NAN_METHOD(EvaluateVertex) {
  auto* position = sfmljs::SharedHandle<sf::Vector2f>::From(info[0]);
  if (!position) return;
  auto* color = ColorHandle::From(info[1]);
  if (!color) return;
  auto* texCoords = sfmljs::SharedHandle<sf::Vector2f>::From(info[2]);
  if (!texCoords) return;
  auto result = Nan::New<v8::Object>();
  const auto set = [&](const char* name, const sf::Vertex& vertex) {
    Nan::Set(result, Nan::New(name).ToLocalChecked(),
             VertexFields(vertex)).FromJust();
  };
  set("default", sf::Vertex{});
  set("position", sf::Vertex{*position->owner()});
  set("color", sf::Vertex{*position->owner(), *color->owner()});
  set("texCoords", sf::Vertex{
      *position->owner(), *color->owner(), *texCoords->owner()});
  set("defaultColor", sf::Vertex{
      .position = *position->owner(), .texCoords = *texCoords->owner()});
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeValueProbes) {
  Nan::SetMethod(target, "sameBackingStore", SameBackingStore);
  Nan::SetMethod(target, "readAngle", ReadAngle);
  Nan::SetMethod(target, "setAngle", SetAngle);
  Nan::SetMethod(target, "retainAngle", Retain<AngleValues>);
  Nan::SetMethod(target, "angleUseCount", UseCount<AngleValues>);
  Nan::SetMethod(target, "evaluateAngle", EvaluateAngle);

  Nan::SetMethod(target, "readVector2", ReadVector<Vector2Values>);
  Nan::SetMethod(target, "swapVector2", SwapVector<Vector2Values>);
  Nan::SetMethod(target, "retainVector2", Retain<Vector2Values>);
  Nan::SetMethod(target, "vector2UseCount", UseCount<Vector2Values>);
  Nan::SetMethod(target, "evaluateVector2", EvaluateVector<Vector2Values>);

  Nan::SetMethod(target, "readVector3", ReadVector<Vector3Values>);
  Nan::SetMethod(target, "swapVector3", SwapVector<Vector3Values>);
  Nan::SetMethod(target, "retainVector3", Retain<Vector3Values>);
  Nan::SetMethod(target, "vector3UseCount", UseCount<Vector3Values>);
  Nan::SetMethod(target, "evaluateVector3", EvaluateVector<Vector3Values>);

  Nan::SetMethod(target, "readVector4", ReadVector<Vector4Values>);
  Nan::SetMethod(target, "swapVector4", SwapVector<Vector4Values>);
  Nan::SetMethod(target, "retainVector4", Retain<Vector4Values>);
  Nan::SetMethod(target, "vector4UseCount", UseCount<Vector4Values>);
  Nan::SetMethod(target, "convertVector2", ConvertVector<Vector2Values>);
  Nan::SetMethod(target, "convertVector3", ConvertVector<Vector3Values>);
  Nan::SetMethod(target, "convertVector4", ConvertVector<Vector4Values>);
  Nan::SetMethod(target, "colorVector4", ColorVector4);

  Nan::SetMethod(target, "readColor", ReadColor);
  Nan::SetMethod(target, "setColor", SetColor);
  Nan::SetMethod(target, "retainColor", Retain<ColorValues>);
  Nan::SetMethod(target, "colorUseCount", UseCount<ColorValues>);
  Nan::SetMethod(target, "evaluateColor", EvaluateColor);
  Nan::SetMethod(target, "colorConstants", ColorConstants);

  Nan::SetMethod(target, "readRect", ReadRect);
  Nan::SetMethod(target, "swapRectMembers", SwapRectMembers);
  Nan::SetMethod(target, "retainRect", Retain<RectValues>);
  Nan::SetMethod(target, "rectUseCount", UseCount<RectValues>);
  Nan::SetMethod(target, "evaluateRect", EvaluateRect);

  Nan::SetMethod(target, "readVertex", ReadVertex);
  Nan::SetMethod(target, "copyVertex", CopyVertex);
  Nan::SetMethod(target, "retainVertex", Retain<VertexValues>);
  Nan::SetMethod(target, "vertexUseCount", UseCount<VertexValues>);
  Nan::SetMethod(target, "evaluateVertex", EvaluateVertex);
  Nan::SetMethod(target, "retainTransform", Retain<TransformValues>);
  Nan::SetMethod(target, "transformUseCount", UseCount<TransformValues>);
  Nan::SetMethod(target, "retainMat3", Retain<Mat3Values>);
  Nan::SetMethod(target, "mat3UseCount", UseCount<Mat3Values>);
  Nan::SetMethod(target, "retainMat4", Retain<Mat4Values>);
  Nan::SetMethod(target, "mat4UseCount", UseCount<Mat4Values>);
}
