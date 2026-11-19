// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_CONTEXT_INSTANCERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_CONTEXT_INSTANCERS_H_

#include <RmlUi/Core/Context.h>
#include <nan.h>

#include <memory>

namespace sfmlrmlui {

struct RenderManagerState;

// The V8 owner edge, rather than the runtime's context-token map, owns this.
struct ContextOwnership {
  ~ContextOwnership();
  Rml::ContextPtr value;
  std::shared_ptr<RenderManagerState> manager;
};

bool IsOwnedContext(Rml::Context* context);
bool ReleaseOwnedContext(Rml::Context* context);
v8::Local<v8::Object> WrapOwnedContext(
    Rml::ContextPtr context, std::shared_ptr<RenderManagerState> manager);
void ReleaseOwnedContexts();
void RefreshContextInstancerOwnership();
void DrainContextInstancerReleases();
// Call after native contexts and upstream Factory have been destroyed.
void ReleaseContextInstancers();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_CONTEXT_INSTANCERS_H_
