// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_INITIALIZATION_SFML_FAULTS_H_
#define PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_INITIALIZATION_SFML_FAULTS_H_

namespace faults {

// Native-only symbol overrides replace selected SFML driver return values.
// All successful calls forward to the installed library; production classes
// contain no test hooks or alternate rendering implementations.
extern bool unavailable_shaders;
extern unsigned shader_failure_call;
extern unsigned shader_calls;
extern bool fail_texture_resize;
extern unsigned vertex_failures;

void Reset();

}  // namespace faults

#endif  // PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_INITIALIZATION_SFML_FAULTS_H_
