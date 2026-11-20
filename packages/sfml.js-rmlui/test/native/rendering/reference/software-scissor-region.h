// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_REFERENCE_SOFTWARE_SCISSOR_REGION_H_
#define PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_REFERENCE_SOFTWARE_SCISSOR_REGION_H_

#include <array>
#include <cassert>
#include <cstring>

#include "third_party/rmlui/Backends/RmlUi_Include_GL3.h"

namespace gl3_reference {

// Apple software clipping can produce 80.0000076 at an integer edge of 80.
// Its polygon rasterizer rejects the entire triangle in that case. Use an
// exact stencil window on color-only postprocess targets, retaining the pinned
// upstream geometry, shaders, viewport, blend mode and pixel assertions.
class SoftwareScissorRegion {
 public:
  SoftwareScissorRegion() {
#if defined(__APPLE__)
    const auto* renderer =
        reinterpret_cast<const char*>(glGetString(GL_RENDERER));
    if (renderer && std::strcmp(renderer, "Apple Software Renderer") == 0) {
      original_draw_ = glad_glDrawElements;
      active_ = this;
      glad_glDrawElements = Draw;
    }
#endif
  }

  ~SoftwareScissorRegion() {
    if (active_ == this) {
      glad_glDrawElements = original_draw_;
      glDeleteRenderbuffers(1, &stencil_buffer_);
      active_ = nullptr;
    }
  }

  SoftwareScissorRegion(const SoftwareScissorRegion&) = delete;
  SoftwareScissorRegion& operator=(const SoftwareScissorRegion&) = delete;

 private:
  struct StencilState {
    GLint function;
    GLint reference;
    GLint value_mask;
    GLint write_mask;
    GLint fail;
    GLint depth_fail;
    GLint depth_pass;
  };

  static StencilState ReadStencil(bool back) {
    StencilState state{};
    glGetIntegerv(back ? GL_STENCIL_BACK_FUNC : GL_STENCIL_FUNC,
                  &state.function);
    glGetIntegerv(back ? GL_STENCIL_BACK_REF : GL_STENCIL_REF,
                  &state.reference);
    glGetIntegerv(back ? GL_STENCIL_BACK_VALUE_MASK : GL_STENCIL_VALUE_MASK,
                  &state.value_mask);
    glGetIntegerv(back ? GL_STENCIL_BACK_WRITEMASK : GL_STENCIL_WRITEMASK,
                  &state.write_mask);
    glGetIntegerv(back ? GL_STENCIL_BACK_FAIL : GL_STENCIL_FAIL, &state.fail);
    glGetIntegerv(
        back ? GL_STENCIL_BACK_PASS_DEPTH_FAIL : GL_STENCIL_PASS_DEPTH_FAIL,
        &state.depth_fail);
    glGetIntegerv(
        back ? GL_STENCIL_BACK_PASS_DEPTH_PASS : GL_STENCIL_PASS_DEPTH_PASS,
        &state.depth_pass);
    return state;
  }

  static void RestoreStencil(GLenum face, const StencilState& state) {
    glStencilFuncSeparate(
        face, state.function, state.reference, state.value_mask);
    glStencilMaskSeparate(face, state.write_mask);
    glStencilOpSeparate(face, state.fail, state.depth_fail, state.depth_pass);
  }

  static void GLAD_API_PTR Draw(GLenum mode,
                                GLsizei count,
                                GLenum type,
                                const void* indices) {
    active_->DrawRegion(mode, count, type, indices);
  }

  void DrawRegion(GLenum mode,
                   GLsizei count,
                   GLenum type,
                   const void* indices) {
    GLint framebuffer = 0;
    glGetIntegerv(GL_DRAW_FRAMEBUFFER_BINDING, &framebuffer);
    if (!framebuffer || !glIsEnabled(GL_SCISSOR_TEST)) {
      original_draw_(mode, count, type, indices);
      return;
    }
    // Layer targets retain their shared depth/stencil masks. Only upstream
    // postprocess targets have a texture and no depth or stencil attachment.
    for (const GLenum attachment :
         {GL_DEPTH_ATTACHMENT, GL_STENCIL_ATTACHMENT}) {
      GLint kind = 0;
      glGetFramebufferAttachmentParameteriv(
          GL_DRAW_FRAMEBUFFER, attachment,
          GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE, &kind);
      if (kind != GL_NONE) {
        original_draw_(mode, count, type, indices);
        return;
      }
    }
    GLint kind = 0;
    glGetFramebufferAttachmentParameteriv(
        GL_DRAW_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
        GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE, &kind);
    if (kind != GL_TEXTURE) {
      original_draw_(mode, count, type, indices);
      return;
    }

    GLint texture = 0, previous_texture = 0, previous_buffer = 0;
    GLint previous_clear = 0;
    glGetIntegerv(GL_TEXTURE_BINDING_2D, &previous_texture);
    glGetIntegerv(GL_RENDERBUFFER_BINDING, &previous_buffer);
    glGetIntegerv(GL_STENCIL_CLEAR_VALUE, &previous_clear);
    glGetFramebufferAttachmentParameteriv(
        GL_DRAW_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
        GL_FRAMEBUFFER_ATTACHMENT_OBJECT_NAME, &texture);
    glBindTexture(GL_TEXTURE_2D, texture);
    std::array<GLint, 2> size{};
    glGetTexLevelParameteriv(GL_TEXTURE_2D, 0, GL_TEXTURE_WIDTH, &size[0]);
    glGetTexLevelParameteriv(GL_TEXTURE_2D, 0, GL_TEXTURE_HEIGHT, &size[1]);
    glBindTexture(GL_TEXTURE_2D, previous_texture);

    if (!stencil_buffer_) {
      glGenRenderbuffers(1, &stencil_buffer_);
    }
    glBindRenderbuffer(GL_RENDERBUFFER, stencil_buffer_);
    if (stencil_size_ != size) {
      glRenderbufferStorage(
          GL_RENDERBUFFER, GL_STENCIL_INDEX8, size[0], size[1]);
      stencil_size_ = size;
    }
    glFramebufferRenderbuffer(GL_DRAW_FRAMEBUFFER, GL_STENCIL_ATTACHMENT,
                              GL_RENDERBUFFER, stencil_buffer_);
    assert(glCheckFramebufferStatus(GL_DRAW_FRAMEBUFFER) ==
           GL_FRAMEBUFFER_COMPLETE);

    const auto front = ReadStencil(false);
    const auto back = ReadStencil(true);
    // GL3 leaves stencil testing enabled while drawing its color-only scratch
    // targets. With no attachment this imposes no mask; it must not prevent
    // replacing the software polygon clipper with an exact stencil window.
    const bool stencil_enabled = glIsEnabled(GL_STENCIL_TEST);
    glStencilMask(255);
    glDisable(GL_SCISSOR_TEST);
    glClearStencil(0);
    glClear(GL_STENCIL_BUFFER_BIT);
    glEnable(GL_SCISSOR_TEST);
    glClearStencil(1);
    glClear(GL_STENCIL_BUFFER_BIT);
    glDisable(GL_SCISSOR_TEST);
    glEnable(GL_STENCIL_TEST);
    glStencilFunc(GL_EQUAL, 1, 255);
    glStencilOp(GL_KEEP, GL_KEEP, GL_KEEP);
    glStencilMask(0);
    original_draw_(mode, count, type, indices);

    if (!stencil_enabled) {
      glDisable(GL_STENCIL_TEST);
    }
    glEnable(GL_SCISSOR_TEST);
    glClearStencil(previous_clear);
    RestoreStencil(GL_FRONT, front);
    RestoreStencil(GL_BACK, back);
    glFramebufferRenderbuffer(GL_DRAW_FRAMEBUFFER, GL_STENCIL_ATTACHMENT,
                              GL_RENDERBUFFER, 0);
    glBindRenderbuffer(GL_RENDERBUFFER, previous_buffer);
  }

  inline static SoftwareScissorRegion* active_ = nullptr;
  PFNGLDRAWELEMENTSPROC original_draw_ = nullptr;
  GLuint stencil_buffer_ = 0;
  std::array<GLint, 2> stencil_size_{};
};

}  // namespace gl3_reference

#endif  // PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_REFERENCE_SOFTWARE_SCISSOR_REGION_H_
