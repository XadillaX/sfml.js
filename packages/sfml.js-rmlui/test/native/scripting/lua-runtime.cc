// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Links the package's real C++ Lua archive. No interpreter copies or test VM.
#include <lauxlib.h>
#include <lua.h>
#include <lualib.h>

#include <cassert>
#include <cstring>
#include <iostream>
#include <memory>

namespace {

struct LuaCloser {
  void operator()(lua_State* state) const { lua_close(state); }
};

int unwound_scopes = 0;

struct UnwindProbe {
  ~UnwindProbe() { ++unwound_scopes; }
};

int RaiseWithScope(lua_State* state) {
  UnwindProbe scope;
  return luaL_error(state, "unwind probe");
}

void CheckIndependentStates() {
  std::unique_ptr<lua_State, LuaCloser> first(luaL_newstate());
  std::unique_ptr<lua_State, LuaCloser> second(luaL_newstate());
  assert(first && second);
  luaL_openlibs(first.get());
  luaL_openlibs(second.get());
  assert(luaL_dostring(first.get(),
                       "value = 9007199254740993; "
                       "function add(n) return value + n end") == LUA_OK);
  assert(lua_getglobal(second.get(), "value") == LUA_TNIL);
  lua_pop(second.get(), 1);
  lua_getglobal(first.get(), "add");
  lua_pushinteger(first.get(), 2);
  assert(lua_pcall(first.get(), 1, 1, 0) == LUA_OK);
  assert(lua_isinteger(first.get(), -1));
  assert(lua_tointeger(first.get(), -1) == 9007199254740995LL);
  lua_pop(first.get(), 1);
  assert(lua_gettop(first.get()) == 0);
  assert(lua_gettop(second.get()) == 0);
  std::cout << "PASS real-lua-independent-states-and-int64\n";
}

void CheckSourceAndUnwinding() {
  std::unique_ptr<lua_State, LuaCloser> state(luaL_newstate());
  assert(state);
  lua_pushcfunction(state.get(), RaiseWithScope);
  assert(lua_pcall(state.get(), 0, 0, 0) == LUA_ERRRUN);
  assert(unwound_scopes == 1);
  assert(std::strstr(lua_tostring(state.get(), -1), "unwind probe"));
  lua_settop(state.get(), 0);
  luaL_openlibs(state.get());
  constexpr char script[] = "\n\n\nerror('source probe')";
  assert(luaL_loadbufferx(state.get(),
                          script,
                          sizeof(script) - 1,
                          "@source/original.lua",
                          "t") == LUA_OK);
  assert(lua_pcall(state.get(), 0, 0, 0) == LUA_ERRRUN);
  assert(std::strstr(lua_tostring(state.get(), -1),
                     "source/original.lua:4: source probe"));
  lua_settop(state.get(), 0);
  assert(luaL_dostring(state.get(), "return 42") == LUA_OK);
  assert(lua_tointeger(state.get(), -1) == 42);
  lua_pop(state.get(), 1);
  assert(lua_gettop(state.get()) == 0);
  std::cout << "PASS real-lua-source-stack-recovery-and-cxx-unwind\n";
}

}  // namespace

int main() {
  CheckIndependentStates();
  CheckSourceAndUnwinding();
}
