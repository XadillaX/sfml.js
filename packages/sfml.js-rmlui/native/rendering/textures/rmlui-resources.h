// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_RESOURCES_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_RESOURCES_H_

#include <cstdint>
#include <memory>

#include "native/rendering/render-interface-sfml.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {

// Used interfaces outlive every native borrower. Unused interfaces are owned
// by their checked JS token and may be collected before shutdown.
struct RenderInterfaceState {
  Rml::RenderInterface* render_interface{nullptr};
  std::shared_ptr<RenderInterfaceSFML> owned;
  sf::RenderWindow* window{nullptr};
  v8::Global<v8::Object> window_handle;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

using RenderInterfaceHandle = sfmljs::SharedHandle<RenderInterfaceState>;

void PrepareRenderInterface(v8::Local<v8::Object> window_handle);
// Call before constructing a native manager or queuing a resource preload.
bool RetainRenderInterface(Rml::RenderInterface* renderer);
void ReleaseRenderInterfaceStates();
Rml::RenderInterface* RenderInterfaceOf(v8::Local<v8::Value> value);
v8::Local<v8::Object> WrapRenderInterface(Rml::RenderInterface* renderer);
sf::RenderWindow* RenderWindowFor(Rml::RenderInterface* renderer);
bool CanTransferBetweenRenderInterfaces(Rml::Element* parent,
                                        Rml::Element* child);
void RememberElementRenderInterface(Rml::Element* element);
// Detached nodes are not visited by upstream font/geometry invalidation.
bool CanReleaseGlobalResources();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_TEXTURES_RMLUI_RESOURCES_H_
