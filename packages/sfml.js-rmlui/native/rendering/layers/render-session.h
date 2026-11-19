// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_LAYERS_RENDER_SESSION_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_LAYERS_RENDER_SESSION_H_

#include <RmlUi/Core/RenderManager.h>

namespace sfmlrmlui {

class RenderInterfaceSFML;

// Own one context traversal. The destructor rolls back unless Commit has
// completed presentation, including when a C++ or JS callback fails.
class RenderSession final {
 public:
  RenderSession(RenderInterfaceSFML* renderer, Rml::RenderManager* manager);
  ~RenderSession();

  RenderSession(const RenderSession&) = delete;
  RenderSession& operator=(const RenderSession&) = delete;

  void Commit();

 private:
  RenderInterfaceSFML* renderer_;
  Rml::RenderManager* manager_;
  Rml::RenderState saved_state_;
};

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RENDERING_LAYERS_RENDER_SESSION_H_
