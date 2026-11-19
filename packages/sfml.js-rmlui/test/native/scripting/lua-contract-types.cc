// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "test/native/scripting/lua-contract-types.h"

#include <RmlUi/Core/Element.h>
#include <RmlUi/Lua/Utilities.h>

#include <cstdio>
#include <cstring>

#include "third_party/rmlui/Source/Lua/Element.h"

namespace lua_contracts {
namespace {

size_t destroyed_values = 0;

}  // namespace

// A native value whose lifetime is independent of Element ownership.
struct ContractValue {
  explicit ContractValue(int initial, bool count = true)
      : value(initial), count_destruction(count) {}

  ~ContractValue() {
    if (count_destruction) {
      ++destroyed_values;
    }
  }

  int value;
  bool count_destruction;
};

// A real Element subclass for inherited tables and checked downcasts.
class ContractElement final : public Rml::Element {
 public:
  ContractElement() : Rml::Element("contract-element") {}

  RMLUI_RTTI_DeclareWithParent(ContractElement, Rml::Element)
};

RMLUI_RTTI_Define(ContractElement)

}  // namespace lua_contracts

namespace Rml::Lua {

using lua_contracts::ContractElement;
using lua_contracts::ContractValue;

RMLUI_LUATYPE_DECLARE(ContractValue)
RMLUI_LUATYPE_DECLARE(ContractElement)

int ContractValueIncrement(lua_State* state, ContractValue* object) {
  const lua_Integer increment = luaL_checkinteger(state, 1);
  if (increment < -100 || increment > 100) {
    return luaL_error(state, "Contract increment out of range");
  }

  object->value += static_cast<int>(increment);
  lua_pushinteger(state, object->value);
  return 1;
}

int ContractValueFail(lua_State* state, ContractValue*) {
  lua_gc(state, LUA_GCCOLLECT);
  return luaL_error(state, "contract method error");
}

int ContractValueGetAttrvalue(lua_State* state) {
  auto* object = LuaType<ContractValue>::check(state, 1);
  if (!object) {
    lua_pushnil(state);
    return 1;
  }

  lua_pushinteger(state, object->value);
  return 1;
}

int ContractValueSetAttrvalue(lua_State* state) {
  auto* object = LuaType<ContractValue>::check(state, 1);
  if (!object) {
    lua_pushnil(state);
    return 1;
  }

  const lua_Integer value = luaL_checkinteger(state, 2);
  if (value < -100 || value > 100) {
    return luaL_error(state, "Contract value out of range");
  }

  object->value = static_cast<int>(value);
  return 0;
}

int ContractValuenew(lua_State* state) {
  const lua_Integer value = luaL_checkinteger(state, 1);
  if (value < -100 || value > 100) {
    return luaL_error(state, "Contract value out of range");
  }

  LuaType<ContractValue>::push(
      state, new ContractValue(static_cast<int>(value)), true);
  return 1;
}

int ContractElementHasChildNodes(lua_State* state, ContractElement*) {
  lua_pushstring(state, "custom-override");
  return 1;
}

int ContractElementGetAttrtag_name(lua_State* state) {
  auto* element = LuaType<ContractElement>::check(state, 1);
  if (!element) {
    lua_pushnil(state);
    return 1;
  }

  lua_pushstring(state, "custom-tag");
  return 1;
}

RegType<ContractValue> ContractValueMethods[] = {
    RMLUI_LUAMETHOD(ContractValue, Increment),
    RMLUI_LUAMETHOD(ContractValue, Fail),
    {nullptr, nullptr},
};

luaL_Reg ContractValueGetters[] = {
    RMLUI_LUAGETTER(ContractValue, value),
    {nullptr, nullptr},
};

luaL_Reg ContractValueSetters[] = {
    RMLUI_LUASETTER(ContractValue, value),
    {nullptr, nullptr},
};

RegType<ContractElement> ContractElementMethods[] = {
    RMLUI_LUAMETHOD(ContractElement, HasChildNodes),
    {nullptr, nullptr},
};

luaL_Reg ContractElementGetters[] = {
    RMLUI_LUAGETTER(ContractElement, tag_name),
    {nullptr, nullptr},
};

luaL_Reg ContractElementSetters[] = {
    {nullptr, nullptr},
};

RMLUI_LUATYPE_DEFINE(ContractValue)
RMLUI_LUATYPE_DEFINE(ContractElement)

template <>
void ExtraInit<ContractValue>(lua_State* state, int metatable_index) {
  lua_pushcfunction(state, ContractValuenew);
  lua_setfield(state, metatable_index - 1, "new");
}

template <>
void ExtraInit<ContractElement>(lua_State* state, int metatable_index) {
  LuaType<Element>::_regfunctions(state, metatable_index, metatable_index - 1);
}

}  // namespace Rml::Lua

namespace lua_contracts {

void RegisterTypes(lua_State* state) {
  Rml::Lua::LuaType<ContractValue>::Register(state);
  Rml::Lua::LuaType<ContractElement>::Register(state);
  Rml::Lua::AddTypeToElementAsTable<ContractElement>(state);
}

void PushFixtures(lua_State* state) {
  static ContractValue borrowed(7, false);
  Rml::Lua::LuaType<ContractValue>::push(state, &borrowed);
  lua_setglobal(state, "borrowed");
  Rml::Lua::LuaType<ContractValue>::push(state, &borrowed);
  lua_setglobal(state, "sameBorrowed");
  Rml::Lua::LuaType<ContractValue>::push(state, nullptr);
  lua_setglobal(state, "nullValue");
  Rml::Lua::LuaType<ContractElement>::push(state, new ContractElement(), true);
  lua_setglobal(state, "ownedElement");
}

size_t DestructionCount() {
  return destroyed_values;
}

bool CheckPointerFormatter() {
  int value = 0;
  char full[32]{};
  char expected[32]{};
  Rml::Lua::LuaType<ContractValue>::tostring(full, sizeof(full), &value);
  std::snprintf(expected, sizeof(expected), "%p", static_cast<void*>(&value));
  if (std::strcmp(full, expected) != 0) {
    return false;
  }

  char bounded[] = {'x', 'x', 'x', 'x', '!'};
  Rml::Lua::LuaType<ContractValue>::tostring(bounded, 4, &value);
  return bounded[3] == '\0' && bounded[4] == '!' &&
         std::strncmp(bounded, expected, 3) == 0;
}

}  // namespace lua_contracts
