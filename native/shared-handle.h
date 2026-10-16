#pragma once

#include <nan.h>

#include <memory>
#include <utility>

namespace sfmljs {

template <typename T>
class SharedHandle final : public Nan::ObjectWrap {
 public:
  static v8::Local<v8::Object> Create(std::shared_ptr<T> owner) {
    auto shape = Nan::New<v8::ObjectTemplate>();
    shape->SetInternalFieldCount(1);
    auto object = Nan::NewInstance(shape).ToLocalChecked();
    auto* handle = new SharedHandle(std::move(owner));
    handle->Wrap(object);
    Nan::SetPrivate(object, Key(),
        Nan::New<v8::External>(&identity_)).FromJust();
    return object;
  }

  static SharedHandle* TryFrom(v8::Local<v8::Value> value) {
    if (value->IsObject()) {
      auto object = value.As<v8::Object>();
      v8::Local<v8::Value> marker;
      if (object->InternalFieldCount() == 1 &&
          Nan::GetPrivate(object, Key()).ToLocal(&marker) &&
          marker->IsExternal() &&
          marker.As<v8::External>()->Value() == &identity_) {
        return Nan::ObjectWrap::Unwrap<SharedHandle>(object);
      }
    }
    return nullptr;
  }

  static SharedHandle* From(v8::Local<v8::Value> value) {
    auto* handle = TryFrom(value);
    if (!handle) Nan::ThrowTypeError("Expected a matching native handle");
    return handle;
  }

  const std::shared_ptr<T>& owner() const { return owner_; }

 private:
  explicit SharedHandle(std::shared_ptr<T> owner) : owner_(std::move(owner)) {}

  static v8::Local<v8::String> Key() {
    return Nan::New("sfml.shared.owner").ToLocalChecked();
  }

  inline static char identity_;
  std::shared_ptr<T> owner_;
};

template <typename T>
v8::Local<v8::ArrayBuffer> MapShared(v8::Isolate* isolate,
                                    const std::shared_ptr<T>& owner,
                                    void* data, std::size_t size) {
  auto* viewOwner = new std::shared_ptr<T>(owner);
  auto backing = v8::ArrayBuffer::NewBackingStore(data, size,
      [](void*, size_t, void* retained) {
        delete static_cast<std::shared_ptr<T>*>(retained);
      }, viewOwner);
  return v8::ArrayBuffer::New(isolate, std::move(backing));
}

}  // namespace sfmljs
