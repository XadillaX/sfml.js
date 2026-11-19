// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// Consume the managed VM and actual upstream Lua binding from a native addon.
#include <RmlUi/Lua/Utilities.h>
#include <dlfcn.h>
#include <nan.h>

#include <cstdint>
#include <cstring>
#include <limits>

#include "native/scripting/lua/rmlui-lua-host.h"
#include "test/native/scripting/lua-contract-types.h"

namespace {

int ReadIndex(lua_State* state) {
  lua_pushinteger(state, Rml::Lua::GetIndex(state, 1));
  return 1;
}

template <typename T>
bool RoundTripVariant(lua_State* state, const T& value) {
  Rml::Variant source(value);
  Rml::Lua::PushVariant(state, &source);
  Rml::Variant result;
  Rml::Lua::GetVariant(state, -1, &result);
  lua_pop(state, 1);
  return result.Get<T>() == value;
}

NAN_METHOD(OpenNative) {
  Nan::Utf8String path(info[0]);
  if (!dlopen(*path, RTLD_NOW | RTLD_GLOBAL)) {
    Nan::ThrowError(dlerror());
  }
}

NAN_METHOD(PushIndex) {
  auto host = sfmlrmlui::LuaHostOf(info[0]);
  if (!host) {
    return;
  }

  sfmlrmlui::LuaStateScope selection(host->state);
  sfmlrmlui::LuaStackScope stack(host->state);
  if (!sfmlrmlui::PushLuaScalar(host->state, info[1])) {
    return;
  }

  const lua_Integer value = lua_tointeger(host->state, -1);
  if (value < std::numeric_limits<int>::min() ||
      value > std::numeric_limits<int>::max()) {
    Nan::ThrowRangeError("Expected a native int index");
    return;
  }

  Rml::Lua::PushIndex(host->state, static_cast<int>(value));
  info.GetReturnValue().Set(sfmlrmlui::ReadLuaScalar(host->state, -1));
}

NAN_METHOD(GetIndex) {
  auto host = sfmlrmlui::LuaHostOf(info[0]);
  if (!host) {
    return;
  }

  sfmlrmlui::LuaStateScope selection(host->state);
  sfmlrmlui::LuaStackScope stack(host->state);
  lua_pushcfunction(host->state, ReadIndex);
  if (!sfmlrmlui::PushLuaScalar(host->state, info[1])) {
    return;
  }

  if (lua_pcall(host->state, 1, 1, 0) != LUA_OK) {
    Nan::ThrowError(lua_tostring(host->state, -1));
    return;
  }

  info.GetReturnValue().Set(sfmlrmlui::ReadLuaScalar(host->state, -1));
}

NAN_METHOD(RegisterTypes) {
  auto host = sfmlrmlui::LuaHostOf(info[0]);
  if (!host) {
    return;
  }

  sfmlrmlui::LuaStateScope selection(host->state);
  sfmlrmlui::LuaStackScope stack(host->state);
  lua_pushliteral(host->state, "outer-frame-marker");
  const int before = lua_gettop(host->state);
  lua_contracts::RegisterTypes(host->state);
  lua_contracts::PushFixtures(host->state);
  info.GetReturnValue().Set(
      lua_gettop(host->state) == before &&
      std::strcmp(lua_tostring(host->state, -1), "outer-frame-marker") == 0);
}

NAN_METHOD(DestructionCount) {
  info.GetReturnValue().Set(
      static_cast<double>(lua_contracts::DestructionCount()));
}

NAN_METHOD(CheckPointerFormatter) {
  info.GetReturnValue().Set(lua_contracts::CheckPointerFormatter());
}

NAN_METHOD(CheckVariantUtilities) {
  auto host = sfmlrmlui::LuaHostOf(info[0]);
  if (!host) {
    return;
  }

  sfmlrmlui::LuaStateScope selection(host->state);
  sfmlrmlui::LuaStackScope stack(host->state);
  Rml::Lua::GetVariant(host->state, 1, nullptr);
  Rml::Lua::PushVariant(host->state, nullptr);
  const bool null_input = lua_isnil(host->state, -1);
  Rml::Variant empty(9);
  Rml::Lua::GetVariant(host->state, -1, &empty);
  lua_pop(host->state, 1);

  const bool values =
      RoundTripVariant(host->state, true) &&
      RoundTripVariant(host->state, std::numeric_limits<int64_t>::min()) &&
      RoundTripVariant(host->state, std::numeric_limits<int64_t>::max()) &&
      RoundTripVariant(host->state, std::numeric_limits<uint64_t>::max()) &&
      RoundTripVariant(host->state, 1.25) &&
      RoundTripVariant(host->state, Rml::String("prefix\0suffix", 13)) &&
      RoundTripVariant(host->state, Rml::Vector2f(3.25f, -2.5f)) &&
      RoundTripVariant(host->state, Rml::Colourb(17, 31, 63, 127));

  lua_newtable(host->state);
  Rml::Variant table(11);
  Rml::Lua::GetVariant(host->state, -1, &table);
  lua_pop(host->state, 1);
  info.GetReturnValue().Set(null_input &&
                            empty.GetType() == Rml::Variant::NONE && values &&
                            table.GetType() == Rml::Variant::NONE);
}

NAN_MODULE_INIT(Initialize) {
  Nan::SetMethod(target, "openNative", OpenNative);
  Nan::SetMethod(target, "pushIndex", PushIndex);
  Nan::SetMethod(target, "getIndex", GetIndex);
  Nan::SetMethod(target, "registerTypes", RegisterTypes);
  Nan::SetMethod(target, "destructionCount", DestructionCount);
  Nan::SetMethod(target, "checkPointerFormatter", CheckPointerFormatter);
  Nan::SetMethod(target, "checkVariantUtilities", CheckVariantUtilities);
}

}  // namespace

NAN_MODULE_WORKER_ENABLED(lua_contracts, Initialize)
