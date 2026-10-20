#pragma once

#include <nan.h>

#include <memory>
#include <unordered_map>
#include <utility>

namespace sfmljs {

// V8 retains instantiated template metadata in its native context. Reuse one
// shape per Node environment, and release its persistent before isolate teardown.
// All handle types have the same layout; the private marker below checks T.
class SharedHandleTemplate final {
 public:
  static v8::Local<v8::ObjectTemplate> Get() {
    auto* environment = node::GetCurrentEnvironment(Nan::GetCurrentContext());
    auto found = templates_.find(environment);
    if (found == templates_.end()) {
      auto* cache = new SharedHandleTemplate(environment);
      found = templates_.emplace(environment, cache).first;
      node::AddEnvironmentCleanupHook(v8::Isolate::GetCurrent(), Cleanup, cache);
    }
    return Nan::New(found->second->shape_);
  }

 private:
  explicit SharedHandleTemplate(node::Environment* environment)
      : environment_(environment) {
    auto shape = Nan::New<v8::ObjectTemplate>();
    shape->SetInternalFieldCount(1);
    shape_.Reset(shape);
  }

  static void Cleanup(void* data) {
    auto* cache = static_cast<SharedHandleTemplate*>(data);
    cache->shape_.Reset();
    templates_.erase(cache->environment_);
    delete cache;
  }

  // Worker threads must never share V8 handles. The cleanup hook also removes
  // entries when an environment is replaced on the same thread.
  inline static thread_local
      std::unordered_map<node::Environment*, SharedHandleTemplate*> templates_;
  node::Environment* environment_;
  Nan::Persistent<v8::ObjectTemplate> shape_;
};

template <typename T>
class SharedHandle final : public Nan::ObjectWrap {
 public:
  static v8::Local<v8::Object> Create(std::shared_ptr<T> owner) {
    auto object = Nan::NewInstance(SharedHandleTemplate::Get()).ToLocalChecked();
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
