// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/values/rmlui-variant-pointers.h"

#include <sfml-js-interop.h>

#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-parent-observers.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

size_t& LifetimeCount() {
  static size_t count = 0;
  return count;
}

auto& RetiredContexts() {
  static std::vector<std::weak_ptr<ContextState>> contexts;
  return contexts;
}

struct ScriptLifetime;

auto& Lifetimes() {
  // Key the actual shared slot, not Event*: nested dispatch leases can refer
  // to the same event while retaining different expiry and JS identities.
  static std::unordered_map<Rml::ScriptInterface* const*,
                            std::weak_ptr<ScriptLifetime>>
      lifetimes;
  return lifetimes;
}

struct ScriptLifetime final : ElementOwnershipObserver {
  explicit ScriptLifetime(Rml::ScriptInterface* value) : pointer(value) {
    ++LifetimeCount();
  }

  ~ScriptLifetime() override {
    Lifetimes().erase(&pointer);
    --LifetimeCount();
  }

  void OnOwnershipChange(bool destroying) override {
    if (destroying) {
      pointer = nullptr;
      Rml::InvalidateCallbackResourcesForBinding();
    }
  }

  Rml::ScriptInterface* pointer;
  std::weak_ptr<ContextState> context;
  std::weak_ptr<EventState> event;
  v8::Global<v8::Object> object;
  uint64_t generation{0};
  bool external{false};
};

using ScriptObjectHandle = sfmljs::SharedHandle<ScriptLifetime>;

std::shared_ptr<ScriptLifetime> CachedScriptLifetime(
    v8::Local<v8::Object> object) {
  const auto key = Nan::New("rml.variant.script.object").ToLocalChecked();
  v8::Local<v8::Value> cached;
  if (!Nan::GetPrivate(object, key).ToLocal(&cached)) {
    return {};
  }

  const auto* handle = ScriptObjectHandle::TryFrom(cached);
  return handle ? handle->owner() : nullptr;
}

std::shared_ptr<Rml::ScriptInterface*> MakeSlot(
    const std::shared_ptr<ScriptLifetime>& lifetime) {
  Lifetimes().emplace(&lifetime->pointer, lifetime);
  return {lifetime, &lifetime->pointer};
}

}  // namespace

NativeScriptVariantOwner::NativeScriptVariantOwner(
    std::shared_ptr<Rml::ScriptInterface*> slot)
    : slot_(std::move(slot)) {}

NativeScriptVariantOwner::~NativeScriptVariantOwner() {
  Invalidate();
}

void NativeScriptVariantOwner::Invalidate() {
  if (slot_ && *slot_) {
    *slot_ = nullptr;
    Rml::InvalidateCallbackResourcesForBinding();
  }
}

void NativeScriptVariantOwner::SetVariant(Rml::Variant* result) const {
  result->SetScriptInterfaceForBinding(slot_);
}

std::unique_ptr<NativeScriptVariantOwner> RegisterNativeScriptVariant(
    Rml::ScriptInterface* script, v8::Local<v8::Object> object) {
  if (!script || !State().initialized || State().cleaning_up) {
    Nan::ThrowTypeError("Native script registration requires a live pointer");
    return {};
  }

  if (CachedScriptLifetime(object)) {
    Nan::ThrowTypeError("Script object already has its registered identity");
    return {};
  }

  auto lifetime = std::make_shared<ScriptLifetime>(script);
  lifetime->external = true;
  lifetime->generation = State().generation;
  lifetime->object.Reset(v8::Isolate::GetCurrent(), object);
  lifetime->object.SetWeak();
  auto slot = MakeSlot(lifetime);

  const auto key = Nan::New("rml.variant.script.object").ToLocalChecked();
  if (!Nan::SetPrivate(object, key, ScriptObjectHandle::Create(lifetime))
           .FromMaybe(false)) {
    return {};
  }

  Rml::InvalidateCallbackResourcesForBinding();
  return std::make_unique<NativeScriptVariantOwner>(std::move(slot));
}

bool IsScriptObjectVariant(v8::Local<v8::Value> object) {
  return object->IsObject() &&
         CachedScriptLifetime(object.As<v8::Object>()) != nullptr;
}

void ReleaseNativeScriptVariants() {
  for (const auto& [slot, weak] : Lifetimes()) {
    if (const auto lifetime = weak.lock(); lifetime && lifetime->external) {
      lifetime->pointer = nullptr;
      lifetime->object.Reset();
      lifetime->generation = 0;
    }
  }
}

EventState::~EventState() {
  InvalidateEvent(this);
}

void InvalidateEvent(EventState* state) {
  if (auto slot = state->variant_pointer.lock()) {
    *slot = nullptr;
    Rml::InvalidateCallbackResourcesForBinding();
  }

  state->event = nullptr;
}

bool HasNonElementVariantLifetimes() {
  return LifetimeCount() != 0;
}

void RetireContextVariantOwners(const std::shared_ptr<ContextState>& state) {
  if (!state->handle.IsEmpty()) {
    RetiredContexts().emplace_back(state);
  }
}

void DrainVariantPointerOwners() {
  if (RetiredContexts().empty()) {
    return;
  }

  auto retired = std::move(RetiredContexts());
  RetiredContexts().clear();

  for (const auto& weak : retired) {
    if (auto state = weak.lock(); state && !state->handle.IsEmpty()) {
      const auto handle = state->handle.Get(v8::Isolate::GetCurrent());
      const auto key = Nan::New("rml.owner.element.values").ToLocalChecked();

      Nan::DeletePrivate(handle, key).FromJust();
      state->handle.Reset();
    }
  }
}

bool ScriptVariantFromHandle(v8::Local<v8::Value> handle,
                             Rml::Variant* result) {
  if (handle->IsObject()) {
    if (const auto lifetime = CachedScriptLifetime(handle.As<v8::Object>())) {
      if (lifetime->generation != State().generation ||
          lifetime->object.IsEmpty()) {
        Nan::ThrowError("Native script pointer is no longer valid");
        return false;
      }

      result->SetScriptInterfaceForBinding(
          std::shared_ptr<Rml::ScriptInterface*>(lifetime, &lifetime->pointer));
      return true;
    }
  }

  if (ContextHandle::TryFrom(handle)) {
    auto* context = ContextOf(handle);
    if (!context) {
      return false;
    }

    return ContextVariantFromNative(context, result);
  }

  auto* event_handle = EventHandle::TryFrom(handle);
  if (!event_handle) {
    Nan::ThrowTypeError("Expected a live ScriptInterface pointer handle");
    return false;
  }

  auto* event = EventOf(handle);
  if (!event) {
    return false;
  }

  EventVariantFromNative(event_handle->owner(), result);
  return true;
}

bool ContextVariantFromNative(Rml::Context* context, Rml::Variant* result) {
  const auto found = State().contexts.find(context);
  if (found == State().contexts.end()) {
    return false;
  }

  const auto& state = found->second;
  auto slot = state->variant_pointer.lock();
  if (!slot) {
    auto lifetime = std::make_shared<ScriptLifetime>(context);
    lifetime->context = state;
    BindElementOwnershipObserver(context->GetRootElement(), lifetime.get());
    slot = MakeSlot(lifetime);
    state->variant_pointer = slot;
  }

  result->SetScriptInterfaceForBinding(std::move(slot));
  return true;
}

void EventVariantFromNative(const std::shared_ptr<EventState>& state,
                            Rml::Variant* result) {
  auto slot = state->variant_pointer.lock();
  if (!slot) {
    auto lifetime = std::make_shared<ScriptLifetime>(state->event);
    lifetime->event = state;
    slot = MakeSlot(lifetime);
    state->variant_pointer = slot;
  }

  result->SetScriptInterfaceForBinding(std::move(slot));
}

v8::MaybeLocal<v8::Object> ScriptVariantOwner(const Rml::Variant& value) {
  auto* script = value.GetReference<Rml::ScriptInterface*>();
  if (!script) {
    return {};
  }

  // Reject unregistered raw addresses before RTTI can dereference them.
  if (!value.HasGuardedScriptInterfaceForBinding()) {
    Nan::ThrowTypeError("Native script pointer requires its registered owner");
    return {};
  }

  const auto found =
      Lifetimes().find(&value.GetReference<Rml::ScriptInterface*>());
  const auto lifetime =
      found == Lifetimes().end() ? nullptr : found->second.lock();
  if (lifetime && lifetime->external) {
    if (lifetime->pointer != script ||
        lifetime->generation != State().generation ||
        lifetime->object.IsEmpty()) {
      Nan::ThrowError("Native script pointer is no longer valid");
      return {};
    }

    return lifetime->object.Get(v8::Isolate::GetCurrent());
  }

  v8::Local<v8::Object> element;
  if (GuardedElementVariantOwner(value).ToLocal(&element)) {
    return element;
  }

  if (lifetime) {
    // Context and Event inherit ScriptInterface's RTTI identifier; they do
    // not declare their own RMLUI_RTTI. Use the nominal registered slot.
    if (auto context = lifetime->context.lock()) {
      if (context->context == script &&
          context->generation == State().generation) {
        return WrapContext(context->context);
      }
    }

    if (auto event = lifetime->event.lock()) {
      if (event->event == script && event->generation == State().generation) {
        if (event->handle.IsEmpty()) {
          auto handle = EventHandle::Create(event);
          event->handle.Reset(v8::Isolate::GetCurrent(), handle);
          event->handle.SetWeak();
        }

        return event->handle.Get(v8::Isolate::GetCurrent());
      }
    }
  }

  if (script) {
    Nan::ThrowTypeError("Native script pointer requires its typed owner");
  }
  return {};
}

v8::MaybeLocal<v8::Value> ScriptVariantToJs(const Rml::Variant& value) {
  auto* script = value.GetReference<Rml::ScriptInterface*>();
  if (!script) {
    return Nan::Null();
  }

  v8::Local<v8::Object> handle;
  if (!ScriptVariantOwner(value).ToLocal(&handle)) {
    return {};
  }

  const char* key = "eventHandle";
  if (IsScriptObjectVariant(handle)) {
    key = "scriptObject";
  } else if (ElementHandle::TryFrom(handle)) {
    key = "elementHandle";
  } else if (ContextHandle::TryFrom(handle)) {
    key = "contextHandle";
  }

  auto result = Nan::New<v8::Object>();
  Nan::DefineOwnProperty(result, Nan::New(key).ToLocalChecked(), handle)
      .FromJust();
  return result;
}

}  // namespace sfmlrmlui
