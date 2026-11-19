// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_LAYERS_SFML_TARGET_FAULTS_H_
#define PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_LAYERS_SFML_TARGET_FAULTS_H_

#include <cstddef>

namespace target_faults {

extern unsigned target_calls;
extern unsigned target_failure;
extern unsigned texture_calls;
extern unsigned texture_failure;
extern bool fail_mask_record;
extern void* captured_texture;
extern bool captured_texture_deleted;
extern std::size_t failed_allocation_size;

void Reset(unsigned target = 0, unsigned texture = 0);

}  // namespace target_faults

#endif  // PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_RENDERING_LAYERS_SFML_TARGET_FAULTS_H_
