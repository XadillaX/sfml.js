// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/layers/render-session.h"
#include "native/rendering/render-interface-sfml.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {

RenderSession::RenderSession(RenderInterfaceSFML* renderer,
                             Rml::RenderManager* manager)
    : renderer_(renderer),
      manager_(manager),
      saved_state_(manager->GetState()) {
  renderer_->BeginFrame();
  State().batching_render_interface = renderer_;
  try {
    manager_->ResetState();
  } catch (...) {
    renderer_->RollbackFrame();
    State().batching_render_interface = nullptr;
    throw;
  }
}

RenderSession::~RenderSession() {
  if (renderer_) {
    try {
      manager_->SetState(saved_state_);
    } catch (...) {
      // Preserve the first traversal failure while the renderer rolls back.
    }
    renderer_->RollbackFrame();
    State().batching_render_interface = nullptr;
  }
}

void RenderSession::Commit() {
  manager_->SetState(saved_state_);
  renderer_->EndFrame();
  State().batching_render_interface = nullptr;
  renderer_ = nullptr;
}

}  // namespace sfmlrmlui
