// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/effects/rmlui-decoration-values.h"

#include <array>
#include <utility>

#include "native/values/rmlui-numeric-value.h"

namespace sfmlrmlui {
namespace {

void Own(v8::Local<v8::Object> object,
         const char* name,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

bool Read(v8::Local<v8::Object> object,
          const char* name,
          v8::Local<v8::Value>* result) {
  return Nan::Get(object, Nan::New(name).ToLocalChecked()).ToLocal(result);
}

bool Object(v8::Local<v8::Value> value, v8::Local<v8::Object>* result) {
  if (!value->IsObject() || value->IsArray()) {
    Nan::ThrowTypeError("Expected a decoration value object");
    return false;
  }
  *result = value.As<v8::Object>();
  return true;
}

bool Numeric(v8::Local<v8::Object> parent,
             const char* key,
             Rml::NumericValue* result) {
  v8::Local<v8::Value> value;
  v8::Local<v8::Object> object;
  v8::Local<v8::Value> number;
  v8::Local<v8::Value> unit;
  return Read(parent, key, &value) && Object(value, &object) &&
         Read(object, "number", &number) &&
         ReadFiniteNumericFloat(number, &result->number) &&
         Read(object, "unit", &unit) && ReadUnit(unit, &result->unit);
}

bool Color(v8::Local<v8::Object> parent, Rml::ColourbPremultiplied* result) {
  v8::Local<v8::Value> value;
  v8::Local<v8::Object> object;
  v8::Local<v8::Value> type;
  if (!Read(parent, "color", &value) || !Object(value, &object) ||
      !Read(object, "type", &type)) {
    return false;
  }
  if (!type->StrictEquals(Nan::New("colourb-premultiplied").ToLocalChecked())) {
    Nan::ThrowTypeError("Expected a colourb-premultiplied decoration colour");
    return false;
  }
  const char* names[] = {"red", "green", "blue", "alpha"};
  std::array<Rml::byte, 4> bytes{};
  for (size_t i = 0; i < bytes.size(); ++i) {
    if (!Read(object, names[i], &value)) {
      return false;
    }
    if (!value->IsUint32() || Nan::To<uint32_t>(value).FromJust() > 255) {
      Nan::ThrowRangeError("Decoration colour requires integer bytes 0..255");
      return false;
    }
    bytes[i] = static_cast<Rml::byte>(Nan::To<uint32_t>(value).FromJust());
  }
  *result = Rml::ColourbPremultiplied(bytes[0], bytes[1], bytes[2], bytes[3]);
  return true;
}

bool ReadEntry(v8::Local<v8::Object> object, Rml::ColorStop* result) {
  return Color(object, &result->color) &&
         Numeric(object, "position", &result->position);
}

bool ReadEntry(v8::Local<v8::Object> object, Rml::BoxShadow* result) {
  v8::Local<v8::Value> inset;
  if (!Color(object, &result->color) ||
      !Numeric(object, "offsetX", &result->offset_x) ||
      !Numeric(object, "offsetY", &result->offset_y) ||
      !Numeric(object, "blurRadius", &result->blur_radius) ||
      !Numeric(object, "spreadDistance", &result->spread_distance) ||
      !Read(object, "inset", &inset)) {
    return false;
  }
  if (!inset->IsBoolean()) {
    Nan::ThrowTypeError("BoxShadow inset requires a boolean");
    return false;
  }
  result->inset = inset->IsTrue();
  return true;
}

template <typename List>
bool ReadList(v8::Local<v8::Object> object, List* result) {
  v8::Local<v8::Value> value;
  if (!Read(object, "values", &value)) {
    return false;
  }
  if (!value->IsArray()) {
    Nan::ThrowTypeError("Decoration list values must be an array");
    return false;
  }
  const auto array = value.As<v8::Array>();
  const uint32_t size = array->Length();
  List copy;
  for (uint32_t i = 0; i < size; ++i) {
    v8::Local<v8::Object> entry;
    typename List::value_type converted{};
    if (!Nan::Get(array, i).ToLocal(&value) || !Object(value, &entry) ||
        !ReadEntry(entry, &converted)) {
      return false;
    }
    copy.push_back(std::move(converted));
  }
  *result = std::move(copy);
  return true;
}

v8::Local<v8::Object> Numeric(const Rml::NumericValue& value) {
  auto result = Nan::New<v8::Object>();
  Own(result, "number", Nan::New(value.number));
  Own(result, "unit", Nan::New(static_cast<int>(value.unit)));
  return result;
}

v8::Local<v8::Object> Color(const Rml::ColourbPremultiplied& value) {
  auto result = Nan::New<v8::Object>();
  Own(result, "type", Nan::New("colourb-premultiplied").ToLocalChecked());
  Own(result, "red", Nan::New(value.red));
  Own(result, "green", Nan::New(value.green));
  Own(result, "blue", Nan::New(value.blue));
  Own(result, "alpha", Nan::New(value.alpha));
  return result;
}

v8::Local<v8::Object> Entry(const Rml::ColorStop& value) {
  auto result = Nan::New<v8::Object>();
  Own(result, "color", Color(value.color));
  Own(result, "position", Numeric(value.position));
  return result;
}

v8::Local<v8::Object> Entry(const Rml::BoxShadow& value) {
  auto result = Nan::New<v8::Object>();
  Own(result, "color", Color(value.color));
  Own(result, "offsetX", Numeric(value.offset_x));
  Own(result, "offsetY", Numeric(value.offset_y));
  Own(result, "blurRadius", Numeric(value.blur_radius));
  Own(result, "spreadDistance", Numeric(value.spread_distance));
  Own(result, "inset", Nan::New(value.inset));
  return result;
}

template <typename List>
v8::Local<v8::Object> WriteList(const char* type, const List& values) {
  auto result = Nan::New<v8::Object>();
  auto array = Nan::New<v8::Array>();
  for (const auto& value : values) {
    array
        ->CreateDataProperty(
            Nan::GetCurrentContext(), array->Length(), Entry(value))
        .FromJust();
  }
  Own(result, "type", Nan::New(type).ToLocalChecked());
  Own(result, "values", array);
  return result;
}

}  // namespace

v8::Local<v8::Object> ColorStopsToJs(const Rml::ColorStopList& values) {
  return WriteList("colorstoplist", values);
}

v8::Local<v8::Object> BoxShadowsToJs(const Rml::BoxShadowList& values) {
  return WriteList("boxshadowlist", values);
}

bool ColorStopsFromJs(v8::Local<v8::Object> value, Rml::ColorStopList* result) {
  return ReadList(value, result);
}

bool BoxShadowsFromJs(v8::Local<v8::Object> value, Rml::BoxShadowList* result) {
  return ReadList(value, result);
}

}  // namespace sfmlrmlui
