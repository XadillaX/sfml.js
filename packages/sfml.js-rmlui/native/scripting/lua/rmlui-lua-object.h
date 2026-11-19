// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_OBJECT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_OBJECT_H_

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/Event.h>
#include <RmlUi/Lua/IncludeLua.h>

#include <cstddef>
#include <cstdint>
#include <cstring>
#include <memory>
#include <type_traits>
#include <utility>

namespace sfmlrmlui {

struct EventState;

// Every userdata records both its exact C++ type and its actual borrowed owner.
// A proxy owns its small value object, never the Element/Context/Event it uses.
struct LuaObject {
  void* pointer{nullptr};
  const char* type{nullptr};
  void (*destroy)(void*) = nullptr;
  std::shared_ptr<void> lifetime;
  Rml::ObserverPtr<Rml::Element> element;
  Rml::ObserverPtr<Rml::Element> context_root;
  Rml::Element* cast_element{nullptr};
  std::weak_ptr<EventState> event_alive;
  bool requires_element{false};
  bool requires_context{false};
  bool requires_event{false};
  uint64_t generation{0};
};

int PushLuaObject(lua_State* state, LuaObject object);
// Foreign userdata returns null; managed userdata still checks expiry.
LuaObject* TryLuaObjectRecord(lua_State* state, int index);
LuaObject* CheckLuaObjectRecord(lua_State* state, int index);
std::shared_ptr<EventState> LuaEventOwner(Rml::Event* event);
int CollectLuaObject(lua_State* state);
void ObserveLuaObject(LuaObject* object, Rml::Element* element);
void ObserveLuaObject(LuaObject* object, Rml::Context* context);
void ObserveLuaObject(LuaObject* object, Rml::Event* event);

// Keep method receivers rooted across explicit Lua GC and preserve the same
// native active-subtree rules as Node calls.
class LuaAccessScope final {
 public:
  LuaAccessScope(lua_State* state,
                 int index,
                 const char* operation,
                 bool write);
  ~LuaAccessScope();

 private:
  lua_State* state_;
  int reference_;
  size_t depth_;
};

void RequireLuaChildMutation(lua_State* state, Rml::Element* element);

class LuaEventScope final {
 public:
  explicit LuaEventScope(Rml::Event* event);
  ~LuaEventScope();

 private:
  Rml::Event* event_;
  std::shared_ptr<EventState> alive_;
  std::weak_ptr<EventState> previous_;
};

template <typename T>
int PushTypedLuaObject(lua_State* state,
                       T* pointer,
                       const char* type,
                       bool owned) {
  if (!pointer) {
    lua_pushnil(state);
    return lua_gettop(state);
  }
  LuaObject object;
  object.pointer = pointer;
  object.type = type;
  if (owned) {
    object.destroy = [](void* value) { delete static_cast<T*>(value); };
  }
  if constexpr (std::is_base_of_v<Rml::Element, T>) {
    object.cast_element = pointer;
    ObserveLuaObject(&object, pointer);
  } else {
    constexpr bool runtime_object =
        std::is_same_v<T, Rml::Context> || std::is_same_v<T, Rml::Event>;
    if constexpr (runtime_object) {
      ObserveLuaObject(&object, pointer);
    } else {
      if constexpr (requires { pointer->owner; }) {
        ObserveLuaObject(&object, pointer->owner);
      }
    }
  }
  return PushLuaObject(state, std::move(object));
}

template <typename T>
T* CheckTypedLuaObject(lua_State* state, int index, const char* type) {
  if (lua_isnoneornil(state, index)) {
    return nullptr;
  }
  auto* object = CheckLuaObjectRecord(state, index);
  if constexpr (std::is_base_of_v<Rml::Element, T>) {
    auto* result = object->cast_element
                       ? rmlui_dynamic_cast<T*>(object->cast_element)
                       : nullptr;
    if (result) {
      return result;
    }
  } else if (std::strcmp(object->type, type) == 0) {
    return static_cast<T*>(object->pointer);
  }
  luaL_error(state, "Expected %s userdata", type);
  return nullptr;
}

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_OBJECT_H_
