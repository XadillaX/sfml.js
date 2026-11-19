// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_EXAMPLES_OFFICIAL_SHELL_NATIVE_APPLICATION_H_
#define PACKAGES_SFML_JS_RMLUI_EXAMPLES_OFFICIAL_SHELL_NATIVE_APPLICATION_H_

#include <RmlUi/Lua/IncludeLua.h>

// Each application supplies its own original instancers and startup sequence.
// The shell only adapts Node ownership, file output, and Backend::RequestExit.
namespace official {

void InitialiseApplication(lua_State* state);
void ReleaseApplicationHandlers();
const char* ApplicationDirectory();

}  // namespace official

#endif  // PACKAGES_SFML_JS_RMLUI_EXAMPLES_OFFICIAL_SHELL_NATIVE_APPLICATION_H_
