#pragma once

#include <RmlUi/Lua/IncludeLua.h>
#include <RmlUi/Lua/Utilities.h>
#include <utility>

namespace Rml {
namespace Lua {

template <class T>
int PairsConvertTolua(lua_State* L, const T& v);

template <class F, class S>
int PairsConvertTolua(lua_State* L, const std::pair<F, S>& v)
{
	int nresult = 0;
	nresult += PairsConvertTolua(L, v.first);
	nresult += PairsConvertTolua(L, v.second);
	return nresult;
}

template <>
inline int PairsConvertTolua<String>(lua_State* L, const String& s)
{
	lua_pushlstring(L, s.c_str(), s.size());
	return 1;
}

template <>
inline int PairsConvertTolua<Variant>(lua_State* L, const Variant& v)
{
	PushVariant(L, &v);
	return 1;
}

// Convert native iterators while their container is live. The
// returned Lua iterator owns a Lua value snapshot, no C++ iterator.
inline int SnapshotPairsNext(lua_State* L)
{
	lua_settop(L, 2);
	return lua_next(L, 1) ? 2 : 0;
}

inline int FinishSnapshotPairs(lua_State* L)
{
	lua_pushcfunction(L, SnapshotPairsNext);
	lua_insert(L, -2);
	lua_pushnil(L);
	return 3;
}

template <class Iterator>
int MakePairs(lua_State* L, const Iterator& first, const Iterator& last)
{
	lua_newtable(L);
	for (auto item = first; item != last; ++item)
	{
		const int count = PairsConvertTolua(L, *item);
		if (count != 2)
			return luaL_error(L, "Expected key/value snapshot");
		lua_rawset(L, -3);
	}
	return FinishSnapshotPairs(L);
}
template <class Container>
int MakePairs(lua_State* L, const Container& container)
{
	return MakePairs(L, std::begin(container), std::end(container));
}

inline int ipairsaux(lua_State* L)
{
	lua_Integer i = luaL_checkinteger(L, 2) + 1;
	lua_pushinteger(L, i);
#if LUA_VERSION_NUM >= 503
	return (lua_geti(L, 1, i) == LUA_TNIL) ? 1 : 2;
#else
	lua_pushinteger(L, i);
	lua_gettable(L, 1);
	return (lua_isnil(L, -1)) ? 1 : 2;
#endif
}

inline int MakeIntPairs(lua_State* L)
{
	luaL_checkany(L, 1);
	lua_pushcfunction(L, ipairsaux);
	lua_pushvalue(L, 1);
	lua_pushinteger(L, 0);
	return 3;
}

} // namespace Lua
} // namespace Rml
