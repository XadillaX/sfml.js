// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_HOST_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_HOST_H_

#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/EventListener.h>
#include <RmlUi/Core/Variant.h>
#include <RmlUi/Lua/IncludeLua.h>
#include <nan.h>

#include <array>
#include <cstddef>
#include <cstdint>
#include <memory>
#include <unordered_set>

#include "native/runtime/rmlui-exports.h"

namespace sfmlrmlui {

// One native Lua VM per host. Documents intentionally share its globals.
// Context selection never changes the VM of an already loaded document.
struct LuaHost {
  ~LuaHost();

  lua_State* state{nullptr};
  uint64_t generation{0};
  bool allow_inline{false};
  bool allow_external{false};

  // Weak facade edges keep VM/object cycles collectible. Live native userdata
  // registers its exact value until Lua GC, without owning the host itself.
  v8::Global<v8::Object> handle;
  std::unordered_set<const Rml::Variant*> variants;

  bool Execute(const Rml::String& content,
               const Rml::String& source,
               int line,
               Rml::ElementDocument* document = nullptr);

  // Leaves a compiled chunk on this VM's stack, without executing it.
  bool Compile(const Rml::String& content, const Rml::String& source, int line);

  Rml::EventListener* CreateListener(const Rml::String& code,
                                     Rml::ElementDocument* document);
};

// Interpreter compatibility borrows the actual VM only within this scope.
// Nested Lua and Node callbacks restore the previous interpreter selection.
class SFML_RMLUI_API LuaStateScope final {
 public:
  explicit LuaStateScope(lua_State* state);
  ~LuaStateScope();

 private:
  lua_State* previous_;
};

// Each managed call restores the exact outer frame, including nested events.
class LuaStackScope final {
 public:
  explicit LuaStackScope(lua_State* state)
      : state_(state), top_(lua_gettop(state)) {}
  ~LuaStackScope() { lua_settop(state_, top_); }

 private:
  lua_State* state_;
  int top_;
};

// DOM listeners and data events use the same nested global/document scope.
class LuaDocumentScope final {
 public:
  LuaDocumentScope(lua_State* state,
                   Rml::ElementDocument* document,
                   Rml::Event* event = nullptr);
  ~LuaDocumentScope();

 private:
  lua_State* state_;
  size_t depth_;
  const std::array<const char*, 4> names_{
      "document", "context", "event", "element"};
  std::array<int, 4> previous_{};
};

lua_State* CurrentLuaState();
bool LuaStateIsClosing();
std::shared_ptr<LuaHost> FindLuaHost(lua_State* state);
SFML_RMLUI_API std::shared_ptr<LuaHost> LuaHostOf(v8::Local<v8::Value> value);
Rml::EventListener* CreateLuaListener(lua_State* state,
                                      int index,
                                      Rml::Element* element);
bool ProtectedLuaCall(lua_State* state, int arguments, int results);
bool PushLuaScalar(lua_State* state, v8::Local<v8::Value> value);
v8::Local<v8::Value> ReadLuaScalar(lua_State* state, int index);
bool ReadLuaName(v8::Local<v8::Value> value, Rml::String* result);
void CaptureLuaError(lua_State* state);
void DrainLuaStates();
void ReleaseLuaHosts();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_HOST_H_
