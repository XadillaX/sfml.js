// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_VARIANT_OBJECTS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_VARIANT_OBJECTS_H_

#include <RmlUi/Core/Variant.h>
#include <nan.h>

#include <memory>

namespace sfmlrmlui {

// A native extension owns this registration alongside its real allocation.
// Copies of Variant share the slot, never the allocation. Invalidate before
// releasing the allocation; destruction also invalidates without entering V8.
class NativeObjectVariantOwner final {
 public:
  explicit NativeObjectVariantOwner(std::shared_ptr<void*> slot);
  ~NativeObjectVariantOwner();

  NativeObjectVariantOwner(const NativeObjectVariantOwner&) = delete;
  NativeObjectVariantOwner& operator=(const NativeObjectVariantOwner&) = delete;

  void Invalidate();
  void SetVariant(Rml::Variant* result) const;

 private:
  std::shared_ptr<void*> slot_;
};

// Called only from Native, with a live allocation and its JS owner. One JS
// object has one opaque identity; conflicting or expired registrations reject.
std::unique_ptr<NativeObjectVariantOwner> RegisterNativeObjectVariant(
    void* pointer, v8::Local<v8::Object> object);

// JS-created identities use registry tokens. Registered Native objects reuse
// their original guarded slot without reconstructing an address.
bool ObjectVariantFromJs(v8::Local<v8::Value> object, Rml::Variant* result);
// Raw objects are accepted only when Native has already registered identity.
bool IsObjectVariant(v8::Local<v8::Value> object);
// Return the original JS object; copied native values share its weak record.
v8::MaybeLocal<v8::Object> ObjectVariantOwner(const Rml::Variant& value);
v8::MaybeLocal<v8::Value> ObjectVariantToJs(const Rml::Variant& value);
// Constant-time activation check; stable frames do not visit the registry.
bool HasObjectVariantLifetimes();
void ReleaseObjectVariants();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_VARIANT_OBJECTS_H_
