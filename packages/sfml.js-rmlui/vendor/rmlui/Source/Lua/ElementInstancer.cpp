#include "ElementInstancer.h"
#include <native/scripting/lua/rmlui-lua-instancer.h>

namespace Rml {
namespace Lua {
template <>
void ExtraInit<ElementInstancer>(lua_State* L, int metatable_index)
{
	lua_pushcfunction(L, ElementInstancernew);
	lua_setfield(L, metatable_index - 1, "new");
}

// method
int ElementInstancernew(lua_State* L)
{
	return sfmlrmlui::CreateLuaElementInstancer(L);
}
// setter
int ElementInstancerSetAttrInstanceElement(lua_State* L)
{
	return sfmlrmlui::SetLuaElementInstancer(L);
}
RegType<ElementInstancer> ElementInstancerMethods[] = {
	{nullptr, nullptr},
};

luaL_Reg ElementInstancerGetters[] = {
	{nullptr, nullptr},
};

luaL_Reg ElementInstancerSetters[] = {
	RMLUI_LUASETTER(ElementInstancer, InstanceElement),
	{nullptr, nullptr},
};

RMLUI_LUATYPE_DEFINE(ElementInstancer)
} // namespace Lua
} // namespace Rml
