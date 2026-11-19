// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_INSTANCER_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_INSTANCER_H_

#include <RmlUi/Core/ElementInstancer.h>
#include <RmlUi/Lua/IncludeLua.h>

#include <memory>

namespace sfmlrmlui {

struct LuaHost;

// Lua registration, direct Factory facades and produced elements independently
// retain the exact allocator and VM. Replacing a tag does not affect old nodes.
int CreateLuaElementInstancer(lua_State* state);
int SetLuaElementInstancer(lua_State* state);
int RegisterLuaElementInstancer(lua_State* state);
std::shared_ptr<Rml::ElementInstancer> RetainLuaElementInstancer(
    Rml::ElementInstancer* pointer);
std::shared_ptr<LuaHost> LuaHostForElementInstancer(
    Rml::ElementInstancer* pointer);
bool LuaInstancerOwnsElement(Rml::ElementInstancer* instancer,
                             Rml::Element* element);
void NotifyLuaInstancerRegistration(const Rml::String& tag,
                                    Rml::ElementInstancer* pointer);
void ReleaseLuaElementInstancers();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_INSTANCER_H_
