// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef SFML_JS_RMLUI_TEST_SOFTWARE_GEOMETRY_COMPLETION_H_
#define SFML_JS_RMLUI_TEST_SOFTWARE_GEOMETRY_COMPLETION_H_

#include <cstring>

#include "third_party/rmlui/Backends/RmlUi_Include_GL3.h"

namespace gl3_reference {

// Apple's software renderer can lose queued draws when the upstream backend
// deletes a temporary quad's VAO. Complete those draws before deletion, keeping
// the pinned shader, geometry, filters and pixel comparison unchanged.
class SoftwareGeometryCompletion {
 public:
  SoftwareGeometryCompletion() {
#if defined(__APPLE__)
    const auto* renderer =
        reinterpret_cast<const char*>(glGetString(GL_RENDERER));
    if (renderer && std::strcmp(renderer, "Apple Software Renderer") == 0) {
      original_delete_ = glad_glDeleteVertexArrays;
      glad_glDeleteVertexArrays = DeleteCompletedVertexArrays;
      enabled_ = true;
    }
#endif
  }

  ~SoftwareGeometryCompletion() {
    if (enabled_) {
      glad_glDeleteVertexArrays = original_delete_;
      original_delete_ = nullptr;
    }
  }

  SoftwareGeometryCompletion(const SoftwareGeometryCompletion&) = delete;
  SoftwareGeometryCompletion& operator=(const SoftwareGeometryCompletion&) =
      delete;

 private:
  static void GLAD_API_PTR DeleteCompletedVertexArrays(GLsizei count,
                                                       const GLuint* arrays) {
    if (count > 0) {
      glFinish();
    }
    original_delete_(count, arrays);
  }

  inline static PFNGLDELETEVERTEXARRAYSPROC original_delete_ = nullptr;
  bool enabled_ = false;
};

}  // namespace gl3_reference

#endif  // SFML_JS_RMLUI_TEST_SOFTWARE_GEOMETRY_COMPLETION_H_
