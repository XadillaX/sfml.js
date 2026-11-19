// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/ComputedValues.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <memory>
#include <type_traits>

#include "native/fonts/rmlui-font-handle.h"
#include "native/style/values/rmlui-style-values.h"

namespace sfmlrmlui {
namespace {

template <typename T>
struct StructStorage {
  T value;
  uint64_t font_generation{0};
};

template <typename T>
using StructHandle = sfmljs::SharedHandle<StructStorage<T>>;

template <typename T>
struct StyleEnumLimit;

#include "native/generated/rmlui-style-enums.inc"

void Own(v8::Local<v8::Object> object,
         const char* name,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

template <typename T, typename V>
void MapField(v8::Local<v8::Object> views,
              const char* name,
              const std::shared_ptr<StructStorage<T>>& owner,
              V* field) {
  auto buffer =
      sfmljs::MapShared(v8::Isolate::GetCurrent(), owner, field, sizeof(V));
  if constexpr (std::is_same_v<V, float>) {
    Own(views, name, v8::Float32Array::New(buffer, 0, 1));
  } else if constexpr (std::is_same_v<V, uint16_t>) {
    Own(views, name, v8::Uint16Array::New(buffer, 0, 1));
  } else if constexpr (std::is_same_v<V, int16_t>) {
    Own(views, name, v8::Int16Array::New(buffer, 0, 1));
  } else {
    static_assert(std::is_same_v<V, Rml::Colourb> && sizeof(V) == 4);
    Own(views, name, v8::Uint8Array::New(buffer, 0, 4));
  }
}

template <typename T>
void MapStruct(v8::Local<v8::Object> views,
               const std::shared_ptr<StructStorage<T>>& owner);

template <typename T>
StructStorage<T>* StructOf(v8::Local<v8::Value> value) {
  auto* handle = StructHandle<T>::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a matching native style struct handle");
    return nullptr;
  }
  return handle->owner().get();
}

template <typename T>
NAN_METHOD(CreateStruct) {
  auto owner = std::make_shared<StructStorage<T>>();
  auto result = Nan::New<v8::Object>();
  auto views = Nan::New<v8::Object>();
  MapStruct(views, owner);
  Own(result, "handle", StructHandle<T>::Create(owner));
  Own(result, "views", views);
  info.GetReturnValue().Set(result);
}

template <typename Field>
NAN_METHOD(GetField) {
  if (auto* owner = StructOf<typename Field::Owner>(info[0])) {
    using Value = typename Field::Value;
    const auto value = Field::Get(owner->value);
    if constexpr (std::is_same_v<Value, bool>) {
      info.GetReturnValue().Set(value);
    } else if constexpr (std::is_same_v<Value, Rml::String>) {
      info.GetReturnValue().Set(Nan::New(value).ToLocalChecked());
    } else if constexpr (std::is_same_v<Value, Rml::Style::Clip>) {
      info.GetReturnValue().Set(StyleValueToJs(value));
    } else {
      info.GetReturnValue().Set(static_cast<int>(value));
    }
  }
}

template <typename Field>
NAN_METHOD(SetField) {
  using Value = typename Field::Value;
  Value value;
  if constexpr (std::is_same_v<Value, bool>) {
    if (!info[1]->IsBoolean()) {
      return Nan::ThrowTypeError("Expected a style struct boolean");
    }
    value = info[1]->IsTrue();
  } else if constexpr (std::is_same_v<Value, Rml::String>) {
    if (!info[1]->IsString()) {
      return Nan::ThrowTypeError("Expected a style struct string");
    }
    Nan::Utf8String text(info[1]);
    value.assign(*text, text.length());
  } else if constexpr (std::is_same_v<Value, Rml::Style::Clip>) {
    if (!ReadStyleValue(info[1], &value)) {
      return;
    }
  } else {
    const int maximum = [] {
      if constexpr (std::is_enum_v<Value>) {
        return StyleEnumLimit<Value>::kMaximum;
      } else {
        return Field::kMaximum;
      }
    }();
    if (!info[1]->IsInt32()) {
      return Nan::ThrowRangeError("Style struct enum is outside its range");
    }
    const int number = Nan::To<int>(info[1]).FromJust();
    if (number < 0 || number > maximum) {
      return Nan::ThrowRangeError("Style struct enum is outside its range");
    }
    value = static_cast<Value>(number);
  }
  if (auto* owner = StructOf<typename Field::Owner>(info[0])) {
    Field::Set(owner->value, value);
  }
}

NAN_METHOD(GetFontFace) {
  if (auto* owner = StructOf<Rml::Style::InheritedValues>(info[0])) {
    v8::Local<v8::Value> value;
    if (WrapFontFace(owner->value.font_face_handle, owner->font_generation)
            .ToLocal(&value)) {
      info.GetReturnValue().Set(value);
    }
  }
}

NAN_METHOD(SetFontFace) {
  Rml::FontFaceHandle value;
  uint64_t generation;
  if (!ReadFontFace(info[1], &value, &generation)) {
    return;
  }
  if (auto* owner = StructOf<Rml::Style::InheritedValues>(info[0])) {
    owner->value.font_face_handle = value;
    owner->font_generation = generation;
  }
}

#include "native/generated/rmlui-style-struct-fields.inc"

}  // namespace

NAN_MODULE_INIT(InitializeRmlStyleStructs) {
#include "native/generated/rmlui-style-struct-bindings.inc"
}

}  // namespace sfmlrmlui
