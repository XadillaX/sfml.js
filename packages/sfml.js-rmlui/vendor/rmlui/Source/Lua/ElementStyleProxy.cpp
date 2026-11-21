#include "ElementStyleProxy.h"
#include "Pairs.h"
#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/PropertiesIteratorView.h>
#include <RmlUi/Core/Property.h>
#include <RmlUi/Core/PropertyDefinition.h>
#include <RmlUi/Lua/IncludeLua.h>
#include <RmlUi/Lua/LuaType.h>

namespace Rml {
namespace Lua {
template <>
void ExtraInit<ElementStyleProxy>(lua_State* L, int metatable_index)
{
	lua_pushcfunction(L, ElementStyleProxy__index);
	lua_setfield(L, metatable_index, "__index");

	lua_pushcfunction(L, ElementStyleProxy__newindex);
	lua_setfield(L, metatable_index, "__newindex");

	lua_pushcfunction(L, ElementStyleProxy__pairs);
	lua_setfield(L, metatable_index, "__pairs");
}

int ElementStyleProxy__index(lua_State* L)
{
	/*the table obj and the missing key are currently on the stack(index 1 & 2) as defined by the Lua language*/
	int keytype = lua_type(L, 2);
	if (keytype == LUA_TSTRING) // if we are trying to access a string, then we will assume that it is a property
	{
		ElementStyleProxy* es = LuaType<ElementStyleProxy>::check(L, 1);
		RMLUI_CHECK_OBJ(es);
		const Property* prop = es->owner->GetProperty(lua_tostring(L, 2));
		RMLUI_CHECK_OBJ(prop)
		lua_pushstring(L, prop->ToString().c_str());
		return 1;
	}
	else // if it wasn't trying to get a string
	{
		lua_settop(L, 2);
		return LuaType<ElementStyleProxy>::index(L);
	}
}

int ElementStyleProxy__newindex(lua_State* L)
{
	//[1] = obj, [2] = key, [3] = value
	ElementStyleProxy* es = LuaType<ElementStyleProxy>::check(L, 1);
	RMLUI_CHECK_OBJ(es);
	int keytype = lua_type(L, 2);
	int valuetype = lua_type(L, 3);
	if (keytype == LUA_TSTRING)
	{
		const char* key = lua_tostring(L, 2);
		if (valuetype == LUA_TSTRING)
		{
			const char* value = lua_tostring(L, 3);
			lua_pushboolean(L, es->owner->SetProperty(key, value));
			return 1;
		}
		else if (valuetype == LUA_TNIL)
		{
			es->owner->RemoveProperty(key);
			return 0;
		}
	}
	// everything else returns when it needs to, so we are safe to pass it
	// on if needed

	lua_settop(L, 3);
	return LuaType<ElementStyleProxy>::newindex(L);
}

int ElementStyleProxy__pairs(lua_State* L)
{
	auto* obj = LuaType<ElementStyleProxy>::check(L, 1);
	RMLUI_CHECK_OBJ(obj);
	lua_newtable(L);
	for (auto view = obj->owner->IterateLocalProperties(nullptr);
		!view.AtEnd(); ++view)
	{
		const auto& [key, property] = *view;
		String value;
		if (property.definition)
			property.definition->GetValue(value, property);
		else
			value = property.ToString();
		lua_pushlstring(L, key.c_str(), key.size());
		lua_pushlstring(L, value.c_str(), value.size());
		lua_rawset(L, -3);
	}
	return FinishSnapshotPairs(L);
}
RegType<ElementStyleProxy> ElementStyleProxyMethods[] = {
	{nullptr, nullptr},
};

luaL_Reg ElementStyleProxyGetters[] = {
	{nullptr, nullptr},
};

luaL_Reg ElementStyleProxySetters[] = {
	{nullptr, nullptr},
};

RMLUI_LUATYPE_DEFINE(ElementStyleProxy)
} // namespace Lua
} // namespace Rml
