// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_OWNED_VARIANT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_OWNED_VARIANT_H_

#include <RmlUi/Core/Variant.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <cstdint>
#include <memory>

namespace sfmlrmlui {

// Shared metadata owns no RmlUi resources; backing stores may die off-thread.
struct VariantMetadata {
  uint32_t type{static_cast<uint32_t>(Rml::Variant::NONE)};
};

struct OwnedVariantState {
  Rml::Variant value;
  v8::Global<v8::Object> handle;
  std::shared_ptr<VariantMetadata> metadata;
  uint64_t generation{0};
};

using OwnedVariantHandle = sfmljs::SharedHandle<OwnedVariantState>;

OwnedVariantState* OwnedVariantOf(v8::Local<v8::Value> handle);
v8::Local<v8::Object> WrapOwnedVariant(Rml::Variant value);
void ReleaseOwnedVariants();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_VALUES_RMLUI_OWNED_VARIANT_H_
