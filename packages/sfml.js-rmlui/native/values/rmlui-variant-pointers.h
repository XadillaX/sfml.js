// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_VARIANT_POINTERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_VARIANT_POINTERS_H_

#include <RmlUi/Core/Variant.h>
#include <nan.h>

#include <memory>

namespace sfmlrmlui {

struct ContextState;
struct EventState;

// Native extensions retain this guard alongside their real ScriptInterface.
// Invalidate before releasing the allocation; copies share only the slot.
class NativeScriptVariantOwner final {
 public:
  explicit NativeScriptVariantOwner(
      std::shared_ptr<Rml::ScriptInterface*> slot);
  ~NativeScriptVariantOwner();

  NativeScriptVariantOwner(const NativeScriptVariantOwner&) = delete;
  NativeScriptVariantOwner& operator=(const NativeScriptVariantOwner&) = delete;

  void Invalidate();
  void SetVariant(Rml::Variant* result) const;

 private:
  std::shared_ptr<Rml::ScriptInterface*> slot_;
};

// Register a real Native interface and its original JS identity. This does
// not register GetScriptObject or transfer ownership of the native allocation.
std::unique_ptr<NativeScriptVariantOwner> RegisterNativeScriptVariant(
    Rml::ScriptInterface* script, v8::Local<v8::Object> object);
bool IsScriptObjectVariant(v8::Local<v8::Value> object);
void ReleaseNativeScriptVariants();

// Nominal Context/Event handles become guarded ScriptInterface storage.
bool ScriptVariantFromHandle(v8::Local<v8::Value> handle, Rml::Variant* result);
// Native userdata uses the existing typed owner without a JS round trip.
bool ContextVariantFromNative(Rml::Context* context, Rml::Variant* result);
void EventVariantFromNative(const std::shared_ptr<EventState>& state,
                            Rml::Variant* result);
// Resolve only live registered owners; never reconstruct an Event lease.
v8::MaybeLocal<v8::Object> ScriptVariantOwner(const Rml::Variant& value);
v8::MaybeLocal<v8::Value> ScriptVariantToJs(const Rml::Variant& value);
bool HasNonElementVariantLifetimes();
// Expiry is shared by release, Factory transfer, shutdown and dispatch scope.
void InvalidateEvent(EventState* state);
// Native destruction only queues weak states. Clear private V8 roots after
// returning from GC/destruction, including retained invalid Context facades.
void RetireContextVariantOwners(const std::shared_ptr<ContextState>& state);
void DrainVariantPointerOwners();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_VARIANT_POINTERS_H_
