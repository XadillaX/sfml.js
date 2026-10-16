#pragma once

#include "shared-handle.h"
#include "value-layout.h"

#include <array>
#include <bit>
#include <cstdint>
#include <cstring>
#include <memory>
#include <new>
#include <string_view>
#include <type_traits>

namespace sfmljs::values {

using CallbackInfo = Nan::FunctionCallbackInfo<v8::Value>;

template <typename T>
void ReturnMapped(const CallbackInfo& info, const std::shared_ptr<T>& owner,
                  std::shared_ptr<v8::BackingStore> backing = {}) {
  static_assert(std::is_standard_layout_v<T>);
  static_assert(std::is_trivially_copyable_v<T>);
  static_assert(sizeof(T) == Layout<T>::bytes);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("handle").ToLocalChecked(),
           SharedHandle<T>::Create(owner)).FromJust();
  Nan::Set(result, Nan::New("buffer").ToLocalChecked(),
           backing ? v8::ArrayBuffer::New(info.GetIsolate(), std::move(backing))
                   : MapShared(info.GetIsolate(), owner, owner.get(), sizeof(T)))
      .FromJust();
  info.GetReturnValue().Set(result);
}

template <typename T>
void CreateValue(const CallbackInfo& info) {
  ReturnMapped(info, std::make_shared<T>());
}

template <typename T>
void WrapBackingStore(const CallbackInfo& info, v8::Local<v8::Value> input) {
  static_assert(std::is_trivially_copyable_v<T>);
  static_assert(std::is_trivially_destructible_v<T>);
  if (!input->IsArrayBuffer()) {
    return Nan::ThrowTypeError("Expected an ArrayBuffer");
  }
  const auto buffer = input.As<v8::ArrayBuffer>();
  if (buffer->WasDetached() || buffer->ByteLength() != sizeof(T)) {
    return Nan::ThrowRangeError("Expected an attached value-sized ArrayBuffer");
  }
  auto backing = buffer->GetBackingStore();
#if V8_MAJOR_VERSION >= 11
  if (backing->IsResizableByUserJavaScript()) {
    return Nan::ThrowTypeError("Resizable value storage is not supported");
  }
#endif
  void* data = backing->Data();
  if (!data || reinterpret_cast<std::uintptr_t>(data) % alignof(T) != 0) {
    return Nan::ThrowRangeError("Value storage is not correctly aligned");
  }
  if constexpr (requires { typename Layout<T>::Scalar; }) {
    if constexpr (std::is_same_v<typename Layout<T>::Scalar, bool>) {
      const auto* bytes = static_cast<const unsigned char*>(data);
      for (std::size_t i = 0; i < sizeof(T); ++i) {
        if (bytes[i] > 1) {
          return Nan::ThrowRangeError("Boolean storage requires 0 or 1");
        }
      }
    }
  }
  // Begin a real C++ object's lifetime without replacing its storage.
  // Trivial copy construction preserves the original scalar bit patterns.
  std::array<std::byte, sizeof(T)> bytes;
  std::memcpy(bytes.data(), data, sizeof(T));
  const auto initial = std::bit_cast<T>(bytes);
  auto* value = ::new (data) T(initial);
  // Alias the existing BackingStore's control block. No separate value owner,
  // deleter or data allocation; both ArrayBuffers retain this same store.
  ReturnMapped(info, std::shared_ptr<T>(backing, value), backing);
}

template <typename T>
constexpr std::string_view ScalarName() {
  static_assert(std::is_same_v<T, int> || std::is_same_v<T, unsigned int> ||
                std::is_same_v<T, float> || std::is_same_v<T, double> ||
                std::is_integral_v<T>,
                "Unsupported value scalar");
  if constexpr (std::is_same_v<T, int>) return "i32";
  if constexpr (std::is_same_v<T, unsigned int>) return "u32";
  if constexpr (std::is_same_v<T, bool>) return "bool";
  if constexpr (std::is_same_v<T, double>) return "f64";
  if constexpr (std::is_same_v<T, std::int8_t>) return "i8";
  if constexpr (std::is_same_v<T, std::uint8_t>) return "u8";
  if constexpr (std::is_same_v<T, std::int16_t>) return "i16";
  if constexpr (std::is_same_v<T, std::uint16_t>) return "u16";
  if constexpr (std::is_same_v<T, std::int64_t>) return "i64";
  if constexpr (std::is_same_v<T, std::uint64_t>) return "u64";
  return "f32";
}

// A family is the closed set of native types accepted by one TS value API.
// Dispatch passes the existing handle; it does not copy or retain ownership.
template <typename... Types>
struct Family {
  template <typename Callback>
  static void Select(v8::Local<v8::Value> type, Callback callback) {
    if (!type->IsString()) {
      return Nan::ThrowTypeError("Expected a value scalar type");
    }
    const Nan::Utf8String input(type);
    const std::string_view name(*input, input.length());
    const bool found =
        ((name == ScalarName<typename Layout<Types>::Scalar>()
              ? (callback.template operator()<Types>(), true) : false) || ...);
    if (!found) Nan::ThrowTypeError("Unsupported value scalar type");
  }

  template <typename Callback>
  static void Visit(v8::Local<v8::Value> value, Callback callback) {
    const bool found = ([&] {
      auto* handle = SharedHandle<Types>::TryFrom(value);
      if (!handle) return false;
      callback(handle);
      return true;
    }() || ...);
    if (!found) Nan::ThrowTypeError("Expected a matching native handle");
  }

  static void Create(const CallbackInfo& info) {
    if constexpr (sizeof...(Types) == 1) {
      (CreateValue<Types>(info), ...);
    } else {
      if (info.Length() != 1) {
        return Nan::ThrowTypeError("Expected a value scalar type");
      }
      Select(info[0], [&]<typename T>() { CreateValue<T>(info); });
    }
  }

  static void Wrap(const CallbackInfo& info) {
    if constexpr (sizeof...(Types) == 1) {
      if (info.Length() != 1) {
        return Nan::ThrowTypeError("Expected an ArrayBuffer");
      }
      (WrapBackingStore<Types>(info, info[0]), ...);
    } else {
      if (info.Length() != 2) {
        return Nan::ThrowTypeError("Expected a scalar type and ArrayBuffer");
      }
      Select(info[0], [&]<typename T>() { WrapBackingStore<T>(info, info[1]); });
    }
  }
};

using AngleValues = Family<sf::Angle>;
using TransformValues = Family<sf::Transform>;
using Mat3Values = Family<sf::Glsl::Mat3>;
using Mat4Values = Family<sf::Glsl::Mat4>;
using ColorValues = Family<sf::Color>;
template <template <typename> typename Vector>
using VectorValues = Family<Vector<int>, Vector<unsigned>, Vector<float>,
    Vector<bool>, Vector<double>, Vector<std::int8_t>, Vector<std::uint8_t>,
    Vector<std::int16_t>, Vector<std::uint16_t>,
    Vector<std::int64_t>, Vector<std::uint64_t>>;
using Vector2Values = VectorValues<sf::Vector2>;
using Vector3Values = VectorValues<sf::Vector3>;
using Vector4Values =
    Family<sf::Glsl::Vec4, sf::Glsl::Ivec4, sf::Glsl::Bvec4>;
using RectValues = Family<sf::IntRect, sf::FloatRect>;
using VertexValues = Family<sf::Vertex>;

template <typename Parent, typename Member>
void ReturnMember(const CallbackInfo& info,
                  const std::shared_ptr<Parent>& owner, Member Parent::*field) {
  // Point to the real member while sharing the parent's control block.
  ReturnMapped(info, std::shared_ptr<Member>(owner, &(owner.get()->*field)));
}

template <typename Values>
void Member(const CallbackInfo& info) {
  if (!info[1]->IsUint32()) {
    return Nan::ThrowTypeError("Expected a valid value member index");
  }
  const auto index = Nan::To<uint32_t>(info[1]).FromJust();
  Values::Visit(info[0], [&](auto* handle) {
    const auto& owner = handle->owner();
    using T = std::decay_t<decltype(*owner)>;
    constexpr auto members = Layout<T>::members;
    if (index >= std::tuple_size_v<decltype(members)>) {
      return Nan::ThrowTypeError("Expected a valid value member index");
    }
    std::apply([&](auto... fields) {
      std::size_t current = 0;
      return ((index == current++
                   ? (ReturnMember(info, owner, fields), true) : false) || ...);
    }, members);
  });
}

}  // namespace sfmljs::values
