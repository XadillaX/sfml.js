namespace Rml {
namespace Lua {

	template <typename T>
	void LuaType<T>::Register(lua_State* L)
	{
		// for annotations, starting at 1, but it is a relative value, not always 1
		lua_newtable(L);             //[1] = table
		int methods = lua_gettop(L); // methods = 1

		luaL_newmetatable(L, GetTClassName<T>()); //[2] = metatable named <ClassName>, referred in here by ClassMT
		int metatable = lua_gettop(L);            // metatable = 2

		luaL_newmetatable(L, "DO NOT TRASH"); //[3] = metatable named "DO NOT TRASH"
		lua_pop(L, 1);                        // remove the above metatable -> [-1 = 2]

		// store method table in globals so that scripts can add functions written in Lua
		lua_pushvalue(L, methods);            //[methods = 1] -> [3] = copy (reference) of methods table
		lua_setglobal(L, GetTClassName<T>()); // -> <ClassName> = [3 = 1], pop top [3]

		// hide metatable from Lua getmetatable()
		lua_pushvalue(L, methods);                 //[methods = 1] -> [3] = copy of methods table, including modifications above
		lua_setfield(L, metatable, "__metatable"); //[metatable = 2] -> t[k] = v; t = [2 = ClassMT], k = "__metatable", v = [3 = 1]; pop [3]

		lua_pushcfunction(L, index);           // index = cfunction -> [3] = cfunction
		lua_setfield(L, metatable, "__index"); //[metatable = 2] -> t[k] = v; t = [2], k = "__index", v = cfunc; pop [3]

		lua_pushcfunction(L, newindex);
		lua_setfield(L, metatable, "__newindex");

		lua_pushcfunction(L, gc_T);
		lua_setfield(L, metatable, "__gc");

		lua_pushcfunction(L, tostring_T);
		lua_setfield(L, metatable, "__tostring");

		lua_pushcfunction(L, eq_T);
		lua_setfield(L, metatable, "__eq");

		ExtraInit<T>(L, metatable); // optionally implemented by individual types

		lua_newtable(L);              // for method table -> [3] = this table
		lua_setmetatable(L, methods); //[methods = 1] -> metatable for [1] is [3]; [3] is popped off, top = [2]

		_regfunctions(L, metatable, methods);

		lua_pop(L, 2); // remove the two items from the stack, [1 = methods] and [2 = metatable]
	}

	template <typename T>
	int LuaType<T>::push(lua_State* L, T* obj, bool gc)
	{
		return sfmlrmlui::PushTypedLuaObject(
			L, obj, GetTClassName<T>(), gc);
	}

	template <typename T>
	T* LuaType<T>::check(lua_State* L, int narg)
	{
		return sfmlrmlui::CheckTypedLuaObject<T>(
			L, narg, GetTClassName<T>());
	}
	// private members

	template <typename T>
	int LuaType<T>::thunk(lua_State* L)
	{
		T* obj = check(L, 1);
		if (obj == nullptr)
		{
			lua_pushnil(L);
			return 1;
		}
		sfmlrmlui::LuaAccessScope scope(L, 1,
			static_cast<RegType*>(lua_touserdata(L, lua_upvalueindex(1)))->name, false);
		lua_remove(L, 1);     // remove self so member function args start at index 1
		RegType* method = static_cast<RegType*>(
			lua_touserdata(L, lua_upvalueindex(1)));
		return method->func(L, obj);
	}
	template <typename T>
	void LuaType<T>::tostring(char* buff, size_t buff_size, void* obj)
	{
		snprintf(buff, buff_size, "%p", obj);
	}

	template <typename T>
	int LuaType<T>::gc_T(lua_State* L)
	{
		return sfmlrmlui::CollectLuaObject(L);
	}
	template <typename T>
	int LuaType<T>::tostring_T(lua_State* L)
	{
		T* obj = check(L, 1);
		char buffer[max_pointer_string_size];
		snprintf(buffer, sizeof(buffer), "%p", static_cast<void*>(obj));
		lua_pushfstring(L, "%s (%s)", GetTClassName<T>(), buffer);
		return 1;
	}
	template <typename T>
	int LuaType<T>::eq_T(lua_State* L)
	{
		T* o1 = check(L, 1);
		RMLUI_CHECK_OBJ(o1);
		T* o2 = check(L, 2);
		RMLUI_CHECK_OBJ(o2);
		lua_pushboolean(L, o1 == o2);
		return 1;
	}

	template <typename T>
	int LuaType<T>::index(lua_State* L)
	{
		const char* class_name = GetTClassName<T>();
		sfmlrmlui::LuaAccessScope scope(L, 1, "index", false);
		return LuaTypeImpl::index(L, class_name);
	}

	template <typename T>
	int LuaType<T>::newindex(lua_State* L)
	{
		const char* class_name = GetTClassName<T>();
		sfmlrmlui::LuaAccessScope scope(L, 1, "newindex", true);
		return LuaTypeImpl::newindex(L, class_name);
	}

	template <typename T>
	void LuaType<T>::_regfunctions(lua_State* L, int /*meta*/, int methods)
	{
		// fill method table with methods.
		for (RegType* m = (RegType*)GetMethodTable<T>(); m->name; m++)
		{
			lua_pushstring(L, m->name);         // ->[1] = name of function Lua side
			lua_pushlightuserdata(L, (void*)m); // ->[2] = pointer to the object containing the name and the function pointer as light userdata
			lua_pushcclosure(L, thunk, 1);      // thunk = function pointer -> pop 1 item from stack, [2] = closure
			lua_settable(L, methods);           // represents t[k] = v, t = [methods] -> pop [2 = closure] to be v, pop [1 = name] to be k
		}

		lua_getfield(L, methods, "__getters"); // -> table[1]
		if (lua_isnoneornil(L, -1))
		{
			lua_pop(L, 1);                         // pop unsuccessful get
			lua_newtable(L);                       // -> table [1]
			lua_setfield(L, methods, "__getters"); // pop [1]
			lua_getfield(L, methods, "__getters"); // -> table [1]
		}
		for (luaL_Reg* m = (luaL_Reg*)GetAttrTable<T>(); m->name; m++)
		{
			lua_pushcfunction(L, m->func); // -> [2] is this function
			lua_setfield(L, -2, m->name);  //[-2 = 1] -> __getters.name = function
		}
		lua_pop(L, 1); // pop __getters

		lua_getfield(L, methods, "__setters"); // -> table[1]
		if (lua_isnoneornil(L, -1))
		{
			lua_pop(L, 1);                         // pop unsuccessful get
			lua_newtable(L);                       // -> table [1]
			lua_setfield(L, methods, "__setters"); // pop [1]
			lua_getfield(L, methods, "__setters"); // -> table [1]
		}
		for (luaL_Reg* m = (luaL_Reg*)SetAttrTable<T>(); m->name; m++)
		{
			lua_pushcfunction(L, m->func); // -> [2] is this function
			lua_setfield(L, -2, m->name);  //[-2 = 1] -> __setters.name = function
		}
		lua_pop(L, 1); // pop __setters
	}

} // namespace Lua
} // namespace Rml
