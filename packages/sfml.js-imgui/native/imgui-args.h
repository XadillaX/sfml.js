// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#pragma once

#include <nan.h>
#include <sfml-js-interop.h>

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <memory>
#include <string>
#include <vector>

#include "native/cimgui.h"

namespace sfmlimgui {

using CallbackInfo = Nan::FunctionCallbackInfo<v8::Value>;

inline bool ReadUtf8(const CallbackInfo& info,
                     unsigned index,
                     std::string* storage,
                     const char** output,
                     bool nullable) {
  auto value = info[index];
  if (value->IsUndefined() || value->IsNull()) {
    if (!nullable) {
      Nan::ThrowTypeError("Expected a string");
      return false;
    }
    *output = nullptr;
    return true;
  }
  if (value->IsUint8Array()) {
    auto bytes = value.As<v8::Uint8Array>();
    const auto length = bytes->Length();
    auto* data =
        static_cast<const char*>(bytes->Buffer()->GetBackingStore()->Data()) +
        bytes->ByteOffset();
    if (length != 0 && data[length - 1] == '\0') {
      *output = data;
      return true;
    }
    storage->assign(data, length);
    storage->push_back('\0');
    *output = storage->c_str();
    return true;
  }
  if (!value->IsString()) {
    Nan::ThrowTypeError("Expected a string or UTF-8 bytes");
    return false;
  }
  Nan::Utf8String text(value);
  storage->assign(*text, text.length());
  storage->push_back('\0');
  *output = storage->c_str();
  return true;
}

// Retain converted strings or shared byte storage until the native call ends.
struct Utf8Range {
  std::string storage;
  std::shared_ptr<v8::BackingStore> backing;
  const char* begin = nullptr;
  const char* end = nullptr;
};

inline bool ReadUtf8Range(const CallbackInfo& info,
                          unsigned begin_index,
                          unsigned end_index,
                          Utf8Range* output) {
  auto begin_value = info[begin_index];
  auto end_value = info[end_index];
  if (end_value->IsUndefined() || end_value->IsNull()) {
    if (begin_value->IsUint8Array()) {
      output->backing =
          begin_value.As<v8::Uint8Array>()->Buffer()->GetBackingStore();
    }
    return ReadUtf8(info, begin_index, &output->storage, &output->begin, true);
  }
  if (!begin_value->IsUint8Array() || !end_value->IsUint8Array()) {
    Nan::ThrowTypeError("Text range endpoints must be Uint8Array views");
    return false;
  }
  auto begin_view = begin_value.As<v8::Uint8Array>();
  auto end_view = end_value.As<v8::Uint8Array>();
  auto begin_buffer = begin_view->Buffer();
  auto end_buffer = end_view->Buffer();
  if (begin_buffer->WasDetached() || end_buffer->WasDetached()) {
    Nan::ThrowTypeError("Text range buffers must not be detached");
    return false;
  }
  output->backing = begin_buffer->GetBackingStore();
  if (output->backing != end_buffer->GetBackingStore()) {
    Nan::ThrowTypeError("Text range endpoints must share a backing store");
    return false;
  }
  const size_t begin_offset = begin_view->ByteOffset();
  const size_t end_offset = end_view->ByteOffset();
  if (end_offset < begin_offset ||
      end_offset - begin_offset > begin_view->ByteLength()) {
    Nan::ThrowRangeError("Text range end must lie within the begin view");
    return false;
  }
  const auto* data = static_cast<const char*>(output->backing->Data());
  // Empty backing stores may have no data; avoid arithmetic on nullptr.
  if (!data) data = "";
  output->begin = data + begin_offset;
  output->end = data + end_offset;
  return true;
}

inline bool ReadBool(const CallbackInfo& info, unsigned index, bool* output) {
  if (!info[index]->IsBoolean()) {
    Nan::ThrowTypeError("Expected a boolean");
    return false;
  }
  *output = info[index]->IsTrue();
  return true;
}

template <typename T>
bool ReadScalar(const CallbackInfo& info, unsigned index, T* output) {
  if (!info[index]->IsNumber()) {
    Nan::ThrowTypeError("Expected a number");
    return false;
  }
  *output = static_cast<T>(Nan::To<double>(info[index]).FromJust());
  return true;
}

inline bool ReadS64(const CallbackInfo& info,
                    unsigned index,
                    std::int64_t* output) {
  auto value = info[index];
  if (value->IsBigInt()) {
    bool lossless = false;
    *output = value.As<v8::BigInt>()->Int64Value(&lossless);
    if (!lossless) {
      Nan::ThrowRangeError("Expected a lossless 64-bit integer");
      return false;
    }
    return true;
  }
  if (!value->IsNumber()) {
    Nan::ThrowTypeError("Expected a bigint or number");
    return false;
  }
  *output = static_cast<std::int64_t>(Nan::To<double>(value).FromJust());
  return true;
}

inline bool ReadU64(const CallbackInfo& info,
                    unsigned index,
                    std::uint64_t* output) {
  auto value = info[index];
  if (value->IsBigInt()) {
    bool lossless = false;
    *output = value.As<v8::BigInt>()->Uint64Value(&lossless);
    if (!lossless) {
      Nan::ThrowRangeError("Expected a lossless 64-bit integer");
      return false;
    }
    return true;
  }
  if (!value->IsNumber()) {
    Nan::ThrowTypeError("Expected a bigint or number");
    return false;
  }
  const double number = Nan::To<double>(value).FromJust();
  if (number < 0) {
    Nan::ThrowRangeError("Expected a non-negative integer");
    return false;
  }
  *output = static_cast<std::uint64_t>(number);
  return true;
}

inline bool ReadSize(const CallbackInfo& info, unsigned index, size_t* output) {
  std::uint64_t value = 0;
  if (!ReadU64(info, index, &value)) return false;
  if (value > static_cast<std::uint64_t>(SIZE_MAX)) {
    Nan::ThrowRangeError("Size exceeds the platform limit");
    return false;
  }
  *output = static_cast<size_t>(value);
  return true;
}

inline bool ReadPointer(const CallbackInfo& info,
                        unsigned index,
                        void** output) {
  auto value = info[index];
  if (value->IsUndefined() || value->IsNull()) {
    *output = nullptr;
    return true;
  }
  if (!value->IsBigInt()) {
    Nan::ThrowTypeError("Expected a bigint pointer");
    return false;
  }
  bool lossless = false;
  const auto address = value.As<v8::BigInt>()->Uint64Value(&lossless);
  if (!lossless) {
    Nan::ThrowRangeError("Expected a lossless pointer");
    return false;
  }
  *output = reinterpret_cast<void*>(static_cast<std::uintptr_t>(address));
  return true;
}

inline bool ReadRequiredPointer(const CallbackInfo& info,
                                unsigned index,
                                void** output) {
  if (!ReadPointer(info, index, output)) return false;
  if (!*output) {
    Nan::ThrowTypeError("Expected a non-null pointer address");
    return false;
  }
  return true;
}

inline bool ReadBytes(const CallbackInfo& info, unsigned index, char** output) {
  auto value = info[index];
  if (!value->IsUint8Array()) {
    Nan::ThrowTypeError("Expected a Uint8Array");
    return false;
  }
  auto bytes = value.As<v8::Uint8Array>();
  *output = static_cast<char*>(bytes->Buffer()->GetBackingStore()->Data()) +
            bytes->ByteOffset();
  return true;
}

#define SFMLIMGUI_ARRAY_READER(NAME, V8TYPE, CTYPE)                            \
  inline CTYPE* NAME(const CallbackInfo& info, unsigned index, size_t count) { \
    auto value = info[index];                                                  \
    if (!value->Is##V8TYPE()) {                                                \
      Nan::ThrowTypeError("Expected a typed array");                           \
      return nullptr;                                                          \
    }                                                                          \
    auto array = value.As<v8::V8TYPE>();                                       \
    if (array->Length() < count) {                                             \
      Nan::ThrowRangeError("Typed array is too short");                        \
      return nullptr;                                                          \
    }                                                                          \
    auto* data = static_cast<std::uint8_t*>(                                   \
                     array->Buffer()->GetBackingStore()->Data()) +             \
                 array->ByteOffset();                                          \
    return reinterpret_cast<CTYPE*>(data);                                     \
  }

SFMLIMGUI_ARRAY_READER(ReadInt8Array, Int8Array, std::int8_t)
SFMLIMGUI_ARRAY_READER(ReadUint8Array, Uint8Array, std::uint8_t)
SFMLIMGUI_ARRAY_READER(ReadInt16Array, Int16Array, std::int16_t)
SFMLIMGUI_ARRAY_READER(ReadUint16Array, Uint16Array, std::uint16_t)
SFMLIMGUI_ARRAY_READER(ReadInt32Array, Int32Array, std::int32_t)
SFMLIMGUI_ARRAY_READER(ReadUint32Array, Uint32Array, std::uint32_t)
SFMLIMGUI_ARRAY_READER(ReadFloat32Array, Float32Array, float)
SFMLIMGUI_ARRAY_READER(ReadFloat64Array, Float64Array, double)
SFMLIMGUI_ARRAY_READER(ReadInt64Array, BigInt64Array, std::int64_t)
SFMLIMGUI_ARRAY_READER(ReadUint64Array, BigUint64Array, std::uint64_t)

#undef SFMLIMGUI_ARRAY_READER

inline bool* ReadBoolArray(const CallbackInfo& info,
                           unsigned index,
                           size_t count) {
  return reinterpret_cast<bool*>(ReadUint8Array(info, index, count));
}

inline size_t* ReadSizeArray(const CallbackInfo& info, unsigned index) {
  return reinterpret_cast<size_t*>(ReadUint64Array(info, index, 1));
}

inline bool ReadImVec2(const CallbackInfo& info,
                       unsigned index,
                       cimgui::ImVec2* output) {
  auto value = info[index];
  if (value->IsFloat32Array()) {
    auto array = value.As<v8::Float32Array>();
    if (array->Length() < 2) {
      Nan::ThrowRangeError("Expected a Float32Array of length 2");
      return false;
    }
    auto* data = reinterpret_cast<const float*>(
        static_cast<const std::uint8_t*>(
            array->Buffer()->GetBackingStore()->Data()) +
        array->ByteOffset());
    output->x = data[0];
    output->y = data[1];
    return true;
  }
  if (value->IsArray()) {
    auto array = value.As<v8::Array>();
    if (array->Length() < 2) {
      Nan::ThrowRangeError("Expected a coordinate pair");
      return false;
    }
    output->x = static_cast<float>(
        Nan::To<double>(Nan::Get(array, 0).ToLocalChecked()).FromJust());
    output->y = static_cast<float>(
        Nan::To<double>(Nan::Get(array, 1).ToLocalChecked()).FromJust());
    return true;
  }
  if (!value->IsObject()) {
    Nan::ThrowTypeError("Expected an ImVec2 value");
    return false;
  }
  auto object = value.As<v8::Object>();
  v8::Local<v8::Value> x;
  v8::Local<v8::Value> y;
  if (!Nan::Get(object, Nan::New("x").ToLocalChecked()).ToLocal(&x) ||
      !Nan::Get(object, Nan::New("y").ToLocalChecked()).ToLocal(&y) ||
      !x->IsNumber() || !y->IsNumber()) {
    Nan::ThrowTypeError("Expected an ImVec2 value");
    return false;
  }
  output->x = static_cast<float>(Nan::To<double>(x).FromJust());
  output->y = static_cast<float>(Nan::To<double>(y).FromJust());
  return true;
}

inline bool ReadImVec4(const CallbackInfo& info,
                       unsigned index,
                       cimgui::ImVec4* output) {
  auto value = info[index];
  if (value->IsFloat32Array()) {
    auto array = value.As<v8::Float32Array>();
    if (array->Length() < 4) {
      Nan::ThrowRangeError("Expected a Float32Array of length 4");
      return false;
    }
    auto* data = reinterpret_cast<const float*>(
        static_cast<const std::uint8_t*>(
            array->Buffer()->GetBackingStore()->Data()) +
        array->ByteOffset());
    output->x = data[0];
    output->y = data[1];
    output->z = data[2];
    output->w = data[3];
    return true;
  }
  if (value->IsArray()) {
    auto array = value.As<v8::Array>();
    if (array->Length() < 4) {
      Nan::ThrowRangeError("Expected four numbers");
      return false;
    }
    float* fields[] = {&output->x, &output->y, &output->z, &output->w};
    for (int i = 0; i < 4; ++i) {
      *fields[i] = static_cast<float>(
          Nan::To<double>(Nan::Get(array, i).ToLocalChecked()).FromJust());
    }
    return true;
  }
  if (!value->IsObject()) {
    Nan::ThrowTypeError("Expected an ImVec4 value");
    return false;
  }
  auto object = value.As<v8::Object>();
  const char* keys[] = {"x", "y", "z", "w"};
  float* fields[] = {&output->x, &output->y, &output->z, &output->w};
  for (int i = 0; i < 4; ++i) {
    v8::Local<v8::Value> field;
    if (!Nan::Get(object, Nan::New(keys[i]).ToLocalChecked()).ToLocal(&field) ||
        !field->IsNumber()) {
      Nan::ThrowTypeError("Expected an ImVec4 value");
      return false;
    }
    *fields[i] = static_cast<float>(Nan::To<double>(field).FromJust());
  }
  return true;
}

inline bool ReadStringArray(const CallbackInfo& info,
                            unsigned index,
                            std::vector<std::string>* storage,
                            std::vector<const char*>* pointers) {
  if (!info[index]->IsArray()) {
    Nan::ThrowTypeError("Expected an array of strings");
    return false;
  }
  auto array = info[index].As<v8::Array>();
  storage->clear();
  pointers->clear();
  storage->reserve(array->Length());
  for (std::uint32_t i = 0; i < array->Length(); ++i) {
    v8::Local<v8::Value> value = Nan::Get(array, i).ToLocalChecked();
    if (!value->IsString()) {
      Nan::ThrowTypeError("Expected an array of strings");
      return false;
    }
    Nan::Utf8String text(value);
    storage->emplace_back(*text, text.length());
  }
  pointers->reserve(storage->size());
  for (const auto& text : *storage) pointers->push_back(text.c_str());
  return true;
}

template <typename T>
T* ReadStruct(const CallbackInfo& info, unsigned index) {
  auto* handle = sfmljs::SharedHandle<T>::From(info[index]);
  return handle ? handle->owner().get() : nullptr;
}

inline void ReturnString(const CallbackInfo& info, const char* text) {
  if (!text) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  info.GetReturnValue().Set(Nan::New(text).ToLocalChecked());
}

inline void ReturnPointer(const CallbackInfo& info, void* pointer) {
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(
      info.GetIsolate(), reinterpret_cast<std::uintptr_t>(pointer)));
}

inline void ReturnS64(const CallbackInfo& info, std::int64_t value) {
  info.GetReturnValue().Set(
      v8::BigInt::New(info.GetIsolate(), static_cast<std::int64_t>(value)));
}

inline void ReturnU64(const CallbackInfo& info, std::uint64_t value) {
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(
      info.GetIsolate(), static_cast<std::uint64_t>(value)));
}

inline void ReturnVec2(const CallbackInfo& info, const cimgui::ImVec2& value) {
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("x").ToLocalChecked(), Nan::New(value.x))
      .FromJust();
  Nan::Set(result, Nan::New("y").ToLocalChecked(), Nan::New(value.y))
      .FromJust();
  info.GetReturnValue().Set(result);
}

inline void ReturnVec4(const CallbackInfo& info, const cimgui::ImVec4& value) {
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("x").ToLocalChecked(), Nan::New(value.x))
      .FromJust();
  Nan::Set(result, Nan::New("y").ToLocalChecked(), Nan::New(value.y))
      .FromJust();
  Nan::Set(result, Nan::New("z").ToLocalChecked(), Nan::New(value.z))
      .FromJust();
  Nan::Set(result, Nan::New("w").ToLocalChecked(), Nan::New(value.w))
      .FromJust();
  info.GetReturnValue().Set(result);
}

template <typename T>
void ReturnStruct(const CallbackInfo& info, T* pointer) {
  if (!pointer) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  info.GetReturnValue().Set(
      sfmljs::SharedHandle<T>::Create(std::shared_ptr<T>(pointer, [](T*) {})));
}

template <typename T>
void ReturnStruct(const CallbackInfo& info, const T* pointer) {
  ReturnStruct<T>(info, const_cast<T*>(pointer));
}

}  // namespace sfmlimgui
