// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_MODEL_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_MODEL_H_

#include <RmlUi/Core/Context.h>
#include <RmlUi/Lua/IncludeLua.h>

namespace sfmlrmlui {

// Native models retain their VM and definitions until actual Core destruction.
// The pre-destroy notice expires Lua aliases; the post-destroy notice releases
// definitions only after all native views/controllers have gone.
bool OpenLuaModel(lua_State* state,
                  Rml::Context* context,
                  int name_index,
                  int table_index);
void CloseLuaModel(lua_State* state, Rml::Context* context, int name_index);
void InvalidateLuaModel(Rml::Context* context, Rml::DataModel* model);
void ReleaseLuaModel(Rml::Context* context, Rml::DataModel* model);
void ReleaseLuaContextModels(Rml::Context* context);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_MODEL_H_
