#include "LuaDocumentElementInstancer.h"
#include "LuaEventListenerInstancer.h"
#include "LuaPlugin.h"
#include <native/scripting/lua/rmlui-lua-host.h>
#include "../Core/StreamFile.h"
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/FileInterface.h>
#include <RmlUi/Core/Log.h>
#include <RmlUi/Lua/Interpreter.h>
#include <RmlUi/Lua/LuaType.h>

namespace Rml {
namespace Lua {

static bool LuaCall(lua_State* L, int nargs, int nresults)
{
	return sfmlrmlui::ProtectedLuaCall(L, nargs, nresults);
}
lua_State* Interpreter::GetLuaState()
{
	return LuaPlugin::GetLuaState();
}

bool Interpreter::LoadFile(const String& file)
{
	lua_State* L = GetLuaState();
	Rml::StreamFile stream;
	if (!stream.Open(file))
	{
		lua_pushfstring(L, "Failed to open Lua script: %s", file.c_str());
		sfmlrmlui::CaptureLuaError(L);
		lua_pop(L, 1);
		return false;
	}
	String code(stream.Length(), '\0');
	if (stream.Read(code.data(), code.size()) != code.size() ||
		stream.HasReadError())
	{
		lua_pushfstring(L, "Failed to read Lua script: %s", file.c_str());
		sfmlrmlui::CaptureLuaError(L);
		lua_pop(L, 1);
		return false;
	}
	return LoadString(code, "@" + file) && LuaCall(L, 0, 0);
}
bool Interpreter::DoString(const String& code, const String& name)
{
	lua_State* L = GetLuaState();
	return LoadString(code, name) && LuaCall(L, 0, 0);
}

bool Interpreter::LoadString(const String& code, const String& name)
{
	lua_State* L = GetLuaState();

	if (luaL_loadbufferx(L, code.data(), code.size(), name.c_str(), "t") != 0)
	{
		sfmlrmlui::CaptureLuaError(L);
		lua_pop(L, 1);
		return false;
	}
	return true;
}
void Interpreter::BeginCall(int funRef)
{
	lua_State* L = GetLuaState();

	// Preserve any outer native/Lua call frame.
	// lua_getref(g_L,funRef);
	lua_rawgeti(L, LUA_REGISTRYINDEX, (int)funRef);
}

bool Interpreter::ExecuteCall(int params, int res)
{
	lua_State* L = GetLuaState();
	return LuaCall(L, params, res);
}

void Interpreter::EndCall(int res)
{
	lua_State* L = GetLuaState();
	lua_pop(L, res);
}

} // namespace Lua
} // namespace Rml
