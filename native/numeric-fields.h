#pragma once

#include "shared-handle.h"

#include <algorithm>
#include <cstdint>
#include <type_traits>
#include <vector>

namespace sfmljs {

// Explicit instantiation can name private members (C++ [temp.explicit]).
// Use member pointers from the installed headers, never replica class layouts.
template <typename Tag, typename Tag::Type Pointer>
struct MemberAccess {
  friend typename Tag::Type Member(Tag) { return Pointer; }
};

#define SFMLJS_MEMBER(Tag, Class, Value, Name) \
  struct Tag { \
    using Type = Value Class::*; \
    friend Type Member(Tag); \
  }; \
  template struct sfmljs::MemberAccess<Tag, &Class::Name>

template <typename Tag, typename Object>
decltype(auto) Field(Object& object) {
  return object.*Member(Tag{});
}

// Map numeric regions once. Adjacent fields share a backing store; strings,
// pointers and containers between regions are never exposed to JavaScript.
class NumericFields {
 public:
  template <typename T>
  NumericFields& Add(const char* name, const T& value, const char* type = nullptr) {
    if (!type) {
      if constexpr (std::is_same_v<T, bool>) type = "bool";
      else if constexpr (std::is_same_v<T, float>) type = "f32";
      else if constexpr (std::is_same_v<T, double>) type = "f64";
      else if constexpr (sizeof(T) == 8) type = "u64";
      else {
        static_assert(sizeof(T) == 4);
        type = "u32";
      }
    }
    fields_.push_back({name, type, reinterpret_cast<std::uintptr_t>(&value),
                       sizeof(T)});
    return *this;
  }

  template <typename T>
  v8::Local<v8::Object> Map(const std::shared_ptr<T>& owner) {
    std::sort(fields_.begin(), fields_.end(),
        [](const auto& a, const auto& b) { return a.address < b.address; });
    auto buffers = Nan::New<v8::Array>();
    auto fields = Nan::New<v8::Object>();
    std::uint32_t region = 0;
    for (std::size_t begin = 0; begin < fields_.size(); ++region) {
      const auto start = fields_[begin].address;
      auto end = start + fields_[begin].size;
      auto next = begin + 1;
      // Exact adjacency only: no hidden members or padding are mapped.
      while (next < fields_.size() && fields_[next].address == end) {
        end += fields_[next++].size;
      }
      Nan::Set(buffers, region, MapShared(v8::Isolate::GetCurrent(), owner,
          reinterpret_cast<void*>(start), end - start)).FromJust();
      for (; begin < next; ++begin) {
        const auto& field = fields_[begin];
        auto descriptor = Nan::New<v8::Array>(3);
        Nan::Set(descriptor, 0, Nan::New(field.type).ToLocalChecked()).FromJust();
        Nan::Set(descriptor, 1, Nan::New(region)).FromJust();
        Nan::Set(descriptor, 2, Nan::New(
            static_cast<std::uint32_t>(field.address - start))).FromJust();
        Nan::Set(fields, Nan::New(field.name).ToLocalChecked(), descriptor)
            .FromJust();
      }
    }
    auto result = Nan::New<v8::Object>();
    Nan::Set(result, Nan::New("buffers").ToLocalChecked(), buffers).FromJust();
    Nan::Set(result, Nan::New("fields").ToLocalChecked(), fields).FromJust();
    return result;
  }

 private:
  struct Entry {
    const char* name;
    const char* type;
    std::uintptr_t address;
    std::size_t size;
  };
  std::vector<Entry> fields_;
};

}  // namespace sfmljs
