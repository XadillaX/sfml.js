// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/values/rmlui-variant-objects.h"

#include <sfml-js-interop.h>

#include <memory>
#include <unordered_map>
#include <utility>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

struct ObjectLifetime;

auto& Lifetimes() {
  static std::unordered_map<void* const*, std::weak_ptr<ObjectLifetime>>
      lifetimes;
  return lifetimes;
}

struct ObjectLifetime {
  ~ObjectLifetime() { Lifetimes().erase(&pointer); }

  void* pointer{this};
  v8::Global<v8::Object> object;
  uint64_t generation{0};
};

using ObjectHandle = sfmljs::SharedHandle<ObjectLifetime>;

std::shared_ptr<ObjectLifetime> CachedLifetime(v8::Local<v8::Object> object) {
  const auto key = Nan::New("rml.variant.opaque.object").ToLocalChecked();
  v8::Local<v8::Value> cached;
  if (!Nan::GetPrivate(object, key).ToLocal(&cached)) {
    return {};
  }

  const auto* handle = ObjectHandle::TryFrom(cached);
  return handle ? handle->owner() : nullptr;
}

std::shared_ptr<ObjectLifetime> CacheLifetime(v8::Local<v8::Object> object,
                                              void* pointer,
                                              bool native_pointer) {
  auto lifetime = std::make_shared<ObjectLifetime>();
  if (native_pointer) {
    lifetime->pointer = pointer;
  }
  lifetime->generation = State().generation;
  lifetime->object.Reset(v8::Isolate::GetCurrent(), object);
  lifetime->object.SetWeak();
  Lifetimes().emplace(&lifetime->pointer, lifetime);

  // The visible object -> handle edge caches identity without a global root.
  // Native/Variant/DOM owners supply their own collectible private edges.
  const auto key = Nan::New("rml.variant.opaque.object").ToLocalChecked();
  if (!Nan::SetPrivate(object, key, ObjectHandle::Create(lifetime))
           .FromMaybe(false)) {
    return {};
  }

  return lifetime;
}

std::shared_ptr<ObjectLifetime> LifetimeOf(v8::Local<v8::Object> object) {
  if (const auto lifetime = CachedLifetime(object)) {
    if (lifetime->generation == State().generation) {
      return lifetime;
    }
  }

  return CacheLifetime(object, nullptr, false);
}

}  // namespace

NativeObjectVariantOwner::NativeObjectVariantOwner(std::shared_ptr<void*> slot)
    : slot_(std::move(slot)) {}

NativeObjectVariantOwner::~NativeObjectVariantOwner() {
  Invalidate();
}

void NativeObjectVariantOwner::Invalidate() {
  if (slot_ && *slot_) {
    *slot_ = nullptr;
    Rml::InvalidateCallbackResourcesForBinding();
  }
}

void NativeObjectVariantOwner::SetVariant(Rml::Variant* result) const {
  result->SetOpaquePointerForBinding(slot_);
}

std::unique_ptr<NativeObjectVariantOwner> RegisterNativeObjectVariant(
    void* pointer, v8::Local<v8::Object> object) {
  if (!pointer || !State().initialized || State().cleaning_up) {
    Nan::ThrowTypeError("Native opaque registration requires a live pointer");
    return {};
  }

  // Multiple independently expiring native registrations cannot own one slot.
  // Otherwise destruction of either registration would invalidate the other.
  if (CachedLifetime(object)) {
    Nan::ThrowTypeError("Opaque object already has its registered identity");
    return {};
  }

  const auto lifetime = CacheLifetime(object, pointer, true);
  if (!lifetime) {
    return {};
  }

  std::shared_ptr<void*> slot(lifetime, &lifetime->pointer);
  Rml::InvalidateCallbackResourcesForBinding();
  return std::make_unique<NativeObjectVariantOwner>(std::move(slot));
}

bool IsObjectVariant(v8::Local<v8::Value> object) {
  if (!object->IsObject()) {
    return false;
  }

  const auto key = Nan::New("rml.variant.opaque.object").ToLocalChecked();
  v8::Local<v8::Value> cached;
  return Nan::GetPrivate(object.As<v8::Object>(), key).ToLocal(&cached) &&
         ObjectHandle::TryFrom(cached) != nullptr;
}

bool ObjectVariantFromJs(v8::Local<v8::Value> object, Rml::Variant* result) {
  if (object->IsNull()) {
    *result = static_cast<void*>(nullptr);
    return true;
  }

  if (!object->IsObject()) {
    Nan::ThrowTypeError("Opaque pointer Variant requires an object or null");
    return false;
  }

  const auto lifetime = LifetimeOf(object.As<v8::Object>());
  if (!lifetime) {
    return false;
  }

  std::shared_ptr<void*> slot(lifetime, &lifetime->pointer);
  result->SetOpaquePointerForBinding(std::move(slot));
  return true;
}

v8::MaybeLocal<v8::Object> ObjectVariantOwner(const Rml::Variant& value) {
  const auto& pointer = value.GetReference<void*>();
  if (!pointer) {
    return {};
  }

  const auto found = Lifetimes().find(&pointer);
  const auto lifetime =
      found == Lifetimes().end() ? nullptr : found->second.lock();

  if (!lifetime || lifetime->generation != State().generation ||
      lifetime->object.IsEmpty()) {
    Nan::ThrowTypeError("Native opaque pointer requires its registered object");
    return {};
  }

  return lifetime->object.Get(v8::Isolate::GetCurrent());
}

v8::MaybeLocal<v8::Value> ObjectVariantToJs(const Rml::Variant& value) {
  if (!value.GetReference<void*>()) {
    return Nan::Null();
  }

  v8::Local<v8::Object> object;
  if (!ObjectVariantOwner(value).ToLocal(&object)) {
    return {};
  }

  // Keep user fields away from the native-output decoder. An opaque object
  // may itself contain type, elementHandle, or other facade discriminator keys.
  auto result = Nan::New<v8::Object>();
  Nan::DefineOwnProperty(
      result, Nan::New("opaqueObject").ToLocalChecked(), object)
      .FromJust();
  return result;
}

bool HasObjectVariantLifetimes() {
  return !Lifetimes().empty();
}

void ReleaseObjectVariants() {
  for (const auto& [pointer, weak] : Lifetimes()) {
    if (const auto lifetime = weak.lock()) {
      lifetime->pointer = nullptr;
      lifetime->object.Reset();
      lifetime->generation = 0;
    }
  }

  Lifetimes().clear();
}

}  // namespace sfmlrmlui
