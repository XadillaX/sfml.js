// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_SCRIPTING_LUA_CONTRACT_TYPES_H_
#define PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_SCRIPTING_LUA_CONTRACT_TYPES_H_

#include <RmlUi/Lua/IncludeLua.h>

#include <cstddef>

namespace lua_contracts {

// Register real custom value/Element descriptors in the supplied managed VM.
void RegisterTypes(lua_State* state);
// Push fixtures into globals without transferring ownership of borrowed values.
void PushFixtures(lua_State* state);
// Count only value allocations whose ownership was transferred to Lua.
size_t DestructionCount();
// Exercise the public pointer formatter with a bounded output buffer.
bool CheckPointerFormatter();

}  // namespace lua_contracts

#endif  // PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_SCRIPTING_LUA_CONTRACT_TYPES_H_
