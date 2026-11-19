// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <array>
#include <cmath>
#include <utility>

#include "native/style/values/rmlui-transform.h"
#include "native/values/rmlui-numeric-value.h"

namespace sfmlrmlui {
namespace {

// Keep each union discriminator paired with its actual active member.
#define RML_TRANSFORM_PRIMITIVES(V)                                            \
  V(MATRIX2D, matrix_2d, Matrix2D, 6, false)                                   \
  V(MATRIX3D, matrix_3d, Matrix3D, 16, false)                                  \
  V(TRANSLATEX, translate_x, TranslateX, 1, true)                              \
  V(TRANSLATEY, translate_y, TranslateY, 1, true)                              \
  V(TRANSLATEZ, translate_z, TranslateZ, 1, true)                              \
  V(TRANSLATE2D, translate_2d, Translate2D, 2, true)                           \
  V(TRANSLATE3D, translate_3d, Translate3D, 3, true)                           \
  V(SCALEX, scale_x, ScaleX, 1, false)                                         \
  V(SCALEY, scale_y, ScaleY, 1, false)                                         \
  V(SCALEZ, scale_z, ScaleZ, 1, false)                                         \
  V(SCALE2D, scale_2d, Scale2D, 2, false)                                      \
  V(SCALE3D, scale_3d, Scale3D, 3, false)                                      \
  V(ROTATEX, rotate_x, RotateX, 1, false)                                      \
  V(ROTATEY, rotate_y, RotateY, 1, false)                                      \
  V(ROTATEZ, rotate_z, RotateZ, 1, false)                                      \
  V(ROTATE2D, rotate_2d, Rotate2D, 1, false)                                   \
  V(ROTATE3D, rotate_3d, Rotate3D, 4, false)                                   \
  V(SKEWX, skew_x, SkewX, 1, false)                                            \
  V(SKEWY, skew_y, SkewY, 1, false)                                            \
  V(SKEW2D, skew_2d, Skew2D, 2, false)                                         \
  V(PERSPECTIVE, perspective, Perspective, 1, true)

using Primitive = Rml::TransformPrimitive;

void Own(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

bool Read(v8::Local<v8::Object> object,
          const char* key,
          v8::Local<v8::Value>* result) {
  return Nan::Get(object, Nan::New(key).ToLocalChecked()).ToLocal(result);
}

bool Object(v8::Local<v8::Value> value, v8::Local<v8::Object>* result) {
  if (!value->IsObject() || value->IsArray()) {
    Nan::ThrowTypeError("Expected a transform primitive object");
    return false;
  }
  *result = value.As<v8::Object>();
  return true;
}

bool ReadType(v8::Local<v8::Value> value, Primitive::Type* result) {
  if (!value->IsUint32() ||
      Nan::To<uint32_t>(value).FromJust() > Primitive::DECOMPOSEDMATRIX4) {
    Nan::ThrowRangeError("Expected a TransformPrimitiveType");
    return false;
  }
  *result = static_cast<Primitive::Type>(Nan::To<uint32_t>(value).FromJust());
  return true;
}

bool ReadNumeric(v8::Local<v8::Value> value, Rml::NumericValue* result) {
  v8::Local<v8::Object> object;
  v8::Local<v8::Value> number;
  v8::Local<v8::Value> unit;
  return Object(value, &object) && Read(object, "number", &number) &&
         ReadFiniteNumericFloat(number, &result->number) &&
         Read(object, "unit", &unit) && ReadUnit(unit, &result->unit);
}

bool IsAngle(Primitive::Type type, size_t index) {
  return type >= Primitive::ROTATEX && type <= Primitive::SKEW2D &&
         (type != Primitive::ROTATE3D || index == 3);
}

template <typename T, size_t count, bool unresolved>
bool ReadValues(v8::Local<v8::Value> value,
                Primitive::Type type,
                bool construct,
                Primitive* result) {
  if (!value->IsArray() || value.As<v8::Array>()->Length() != count) {
    Nan::ThrowRangeError("Transform primitive values have the wrong length");
    return false;
  }
  std::array<Rml::NumericValue, count> values{};
  for (size_t i = 0; i < count; ++i) {
    v8::Local<v8::Value> entry;
    if (!Nan::Get(value.As<v8::Array>(), static_cast<uint32_t>(i))
             .ToLocal(&entry)) {
      return false;
    }
    if (unresolved || construct) {
      if (!ReadNumeric(entry, &values[i])) {
        return false;
      }
    } else {
      if (!ReadFiniteNumericFloat(entry, &values[i].number)) {
        return false;
      }
      values[i].unit = IsAngle(type, i) ? Rml::Unit::RAD : Rml::Unit::NUMBER;
    }
    if (construct && IsAngle(type, i) && values[i].unit != Rml::Unit::RAD &&
        values[i].unit != Rml::Unit::DEG &&
        values[i].unit != Rml::Unit::PERCENT) {
      Nan::ThrowTypeError("Transform angle requires RAD, DEG or PERCENT");
      return false;
    }
    if (construct && type == Primitive::ROTATE3D && i < 3 &&
        values[i].unit != Rml::Unit::NUMBER) {
      Nan::ThrowTypeError("Rotate3D axis requires NUMBER");
      return false;
    }
  }
  T primitive(values.data());
  // Degree/percentage conversion may overflow even finite float inputs.
  if constexpr (!unresolved) {
    for (float number : primitive.values) {
      if (!std::isfinite(number)) {
        Nan::ThrowRangeError("Transform primitive conversion overflow");
        return false;
      }
    }
  }
  *result = Primitive(primitive);
  return true;
}

bool ReadTypedValues(v8::Local<v8::Value> value,
                     Primitive::Type type,
                     bool construct,
                     Primitive* result) {
  switch (type) {
#define READ_VALUES(tag, member, name, count, unresolved)                      \
  case Primitive::tag:                                                         \
    return ReadValues<Rml::Transforms::name, count, unresolved>(               \
        value, type, construct, result);
    RML_TRANSFORM_PRIMITIVES(READ_VALUES)
#undef READ_VALUES
    default:
      Nan::ThrowTypeError("DecomposedMatrix4 requires named vector fields");
      return false;
  }
}

template <typename Vector, size_t count>
bool ReadVector(v8::Local<v8::Object> object, const char* key, Vector* result) {
  v8::Local<v8::Value> value;
  v8::Local<v8::Object> vector;
  if (!Read(object, key, &value) || !Object(value, &vector)) {
    return false;
  }
  const char* names[] = {"x", "y", "z", "w"};
  for (size_t i = 0; i < count; ++i) {
    if (!Read(vector, names[i], &value) ||
        !ReadFiniteNumericFloat(value, &(*result)[static_cast<int>(i)])) {
      return false;
    }
  }
  return true;
}

v8::Local<v8::Value> WriteValue(float value) {
  return Nan::New(value);
}

v8::Local<v8::Value> WriteValue(Rml::NumericValue value) {
  auto result = Nan::New<v8::Object>();
  Own(result, "number", Nan::New(value.number));
  Own(result, "unit", Nan::New(static_cast<int>(value.unit)));
  return result;
}

template <typename Values>
v8::Local<v8::Array> WriteValues(const Values& values) {
  auto result = Nan::New<v8::Array>();
  for (const auto& value : values) {
    result
        ->CreateDataProperty(
            Nan::GetCurrentContext(), result->Length(), WriteValue(value))
        .FromJust();
  }
  return result;
}

template <typename Vector, size_t count>
v8::Local<v8::Object> WriteVector(const Vector& vector) {
  auto result = Nan::New<v8::Object>();
  const char* names[] = {"x", "y", "z", "w"};
  for (size_t i = 0; i < count; ++i) {
    Own(result, names[i], Nan::New(vector[static_cast<int>(i)]));
  }
  return result;
}

}  // namespace

bool PrimitiveFromJs(v8::Local<v8::Value> value, Primitive* result) {
  v8::Local<v8::Object> object;
  v8::Local<v8::Value> type_value;
  Primitive::Type type;
  if (!Object(value, &object) || !Read(object, "type", &type_value) ||
      !ReadType(type_value, &type)) {
    return false;
  }
  if (type == Primitive::DECOMPOSEDMATRIX4) {
    Rml::Transforms::DecomposedMatrix4 matrix{};
    if (!ReadVector<Rml::Vector4f, 4>(
            object, "perspective", &matrix.perspective) ||
        !ReadVector<Rml::Vector4f, 4>(
            object, "quaternion", &matrix.quaternion) ||
        !ReadVector<Rml::Vector3f, 3>(
            object, "translation", &matrix.translation) ||
        !ReadVector<Rml::Vector3f, 3>(object, "scale", &matrix.scale) ||
        !ReadVector<Rml::Vector3f, 3>(object, "skew", &matrix.skew)) {
      return false;
    }
    *result = Primitive(matrix);
    return true;
  }
  v8::Local<v8::Value> values;
  return Read(object, "values", &values) &&
         ReadTypedValues(values, type, false, result);
}

bool ConstructPrimitive(v8::Local<v8::Value> type_value,
                        v8::Local<v8::Value> values,
                        Primitive* result) {
  Primitive::Type type;
  return ReadType(type_value, &type) &&
         ReadTypedValues(values, type, true, result);
}

v8::Local<v8::Object> PrimitiveToJs(const Primitive& value) {
  auto result = Nan::New<v8::Object>();
  Own(result, "type", Nan::New(static_cast<int>(value.type)));
  switch (value.type) {
#define WRITE_VALUES(tag, member, name, count, unresolved)                     \
  case Primitive::tag:                                                         \
    Own(result, "values", WriteValues(value.member.values));                   \
    break;
    RML_TRANSFORM_PRIMITIVES(WRITE_VALUES)
#undef WRITE_VALUES
    case Primitive::DECOMPOSEDMATRIX4: {
      const auto& matrix = value.decomposed_matrix_4;
      Own(result,
          "perspective",
          WriteVector<Rml::Vector4f, 4>(matrix.perspective));
      Own(result,
          "quaternion",
          WriteVector<Rml::Vector4f, 4>(matrix.quaternion));
      Own(result,
          "translation",
          WriteVector<Rml::Vector3f, 3>(matrix.translation));
      Own(result, "scale", WriteVector<Rml::Vector3f, 3>(matrix.scale));
      Own(result, "skew", WriteVector<Rml::Vector3f, 3>(matrix.skew));
      break;
    }
  }
  return result;
}

#undef RML_TRANSFORM_PRIMITIVES

bool PrimitiveListFromJs(v8::Local<v8::Value> value,
                         Rml::Transform::PrimitiveList* result) {
  if (!value->IsArray()) {
    Nan::ThrowTypeError("Transform primitives must be an array");
    return false;
  }
  const auto array = value.As<v8::Array>();
  const auto size = array->Length();
  Rml::Transform::PrimitiveList copy;
  for (uint32_t i = 0; i < size; ++i) {
    v8::Local<v8::Value> entry;
    Primitive primitive(Rml::Transforms::ScaleX(1));
    if (!Nan::Get(array, i).ToLocal(&entry) ||
        !PrimitiveFromJs(entry, &primitive)) {
      return false;
    }
    copy.push_back(primitive);
  }
  *result = std::move(copy);
  return true;
}

v8::Local<v8::Array> PrimitiveListToJs(
    const Rml::Transform::PrimitiveList& values) {
  auto result = Nan::New<v8::Array>();
  for (const auto& value : values) {
    result
        ->CreateDataProperty(
            Nan::GetCurrentContext(), result->Length(), PrimitiveToJs(value))
        .FromJust();
  }
  return result;
}

bool TransformFromJs(v8::Local<v8::Object> object, Rml::TransformPtr* result) {
  v8::Local<v8::Value> value;
  if (!Read(object, "primitives", &value)) {
    return false;
  }
  if (value->IsNull()) {
    result->reset();
    return true;
  }
  Rml::Transform::PrimitiveList primitives;
  if (!PrimitiveListFromJs(value, &primitives)) {
    return false;
  }
  *result = Rml::MakeShared<Rml::Transform>(std::move(primitives));
  return true;
}

v8::Local<v8::Object> TransformToJs(const Rml::TransformPtr& value) {
  auto result = Nan::New<v8::Object>();
  Own(result, "type", Nan::New("transform").ToLocalChecked());
  if (value) {
    Own(result, "primitives", PrimitiveListToJs(value->GetPrimitives()));
  } else {
    Own(result, "primitives", Nan::Null());
  }
  return result;
}

}  // namespace sfmlrmlui
