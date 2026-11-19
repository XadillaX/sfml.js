// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/scripting/lua/rmlui-lua-object.h"

#include <cstring>
#include <new>
#include <unordered_map>
#include <utility>

#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-host.h"
#include "native/values/rmlui-variant-pointers.h"

namespace sfmlrmlui {
namespace {

char object_marker;

auto& EventLifetimes() {
  static std::unordered_map<Rml::Event*, std::weak_ptr<EventState>> values;
  return values;
}

LuaObject* RawObject(lua_State* state, int index) {
  if (lua_type(state, index) != LUA_TUSERDATA ||
      lua_rawlen(state, index) != sizeof(LuaObject) ||
      !lua_getmetatable(state, index)) {
    return nullptr;
  }
  lua_rawgetp(state, -1, &object_marker);
  const bool marked = lua_touserdata(state, -1) == &object_marker;
  lua_pop(state, 2);
  return marked ? static_cast<LuaObject*>(lua_touserdata(state, index))
                : nullptr;
}

}  // namespace

void ObserveLuaObject(LuaObject* object, Rml::Element* element) {
  if (element) {
    object->requires_element = true;
    object->element = element->GetObserverPtr();
  }
}

void ObserveLuaObject(LuaObject* object, Rml::Context* context) {
  if (context) {
    object->requires_context = true;
    object->context_root = context->GetRootElement()->GetObserverPtr();
  }
}

void ObserveLuaObject(LuaObject* object, Rml::Event* event) {
  object->requires_event = true;
  object->event_alive = EventLifetimes()[event];
}

LuaAccessScope::LuaAccessScope(lua_State* state,
                               int index,
                               const char* operation,
                               bool write)
    : state_(state),
      reference_(LUA_NOREF),
      depth_(State().active_elements.size()) {
  auto* object = CheckLuaObjectRecord(state, index);
  const auto& runtime = State();
  if (runtime.stream_callback_depth || runtime.system_callback_depth ||
      runtime.plugin_callback_depth || runtime.value_callback_depth ||
      runtime.parser_callback_depth || runtime.effect_callback_depth ||
      runtime.texture_callback_depth || runtime.instancer_callback_depth) {
    luaL_error(state, "RmlUi operation is not allowed during this callback");
  }
  if (object->requires_context && runtime.callback_depth &&
      (write || (std::strcmp(operation, "Update") == 0) ||
       (std::strcmp(operation, "Render") == 0) ||
       (std::strcmp(operation, "UnloadAllDocuments") == 0) ||
       (std::strcmp(operation, "UnloadDocument") == 0) ||
       ((std::strcmp(operation, "CloseDataModel") == 0 ||
         std::strcmp(operation, "OpenDataModel") == 0) &&
        (runtime.data_value_callback_depth ||
         runtime.data_event_callback_depth)) ||
       (std::strncmp(operation, "Process", 7) == 0))) {
    luaL_error(state,
               "RmlUi context mutation is not allowed during a callback");
  }
  // Original Lua menus load documents from load/click/submit handlers.
  // Loading only appends an owned document; context removal and recursive
  // update/render remain prohibited, and Close defers native destruction.
  // The selected VM and nested document/event globals keep their own roots.
  auto* receiver = object->cast_element;
  if (!receiver && object->requires_element) {
    receiver = object->element.get();
  }
  if (receiver) {
    State().active_elements.push_back(receiver);
  }
  lua_pushvalue(state, index);
  reference_ = luaL_ref(state, LUA_REGISTRYINDEX);
}

LuaAccessScope::~LuaAccessScope() {
  luaL_unref(state_, LUA_REGISTRYINDEX, reference_);
  State().active_elements.resize(depth_);
}

void RequireLuaChildMutation(lua_State* state, Rml::Element* element) {
  Nan::TryCatch caught;
  if (CanReplaceElementChildren(element, true)) {
    return;
  }
  Rml::String message = "Cannot replace an active RmlUi subtree";
  if (caught.HasCaught()) {
    Nan::Utf8String text(caught.Exception());
    message.assign(*text, text.length());
  }
  luaL_error(state, "%s", message.c_str());
}

int PushLuaObject(lua_State* state, LuaObject object) {
  luaL_getmetatable(state, object.type);
  if (lua_isnil(state, -1)) {
    return luaL_error(state, "%s missing metatable", object.type);
  }
  lua_pushlightuserdata(state, &object_marker);
  lua_rawsetp(state, -2, &object_marker);
  auto* memory = lua_newuserdatauv(state, sizeof(LuaObject), 0);
  object.generation = State().generation;
  new (memory) LuaObject(std::move(object));
  lua_pushvalue(state, -2);
  lua_setmetatable(state, -2);
  lua_remove(state, -2);
  return lua_gettop(state);
}

LuaObject* TryLuaObjectRecord(lua_State* state, int index) {
  auto* object = RawObject(state, index);
  if (!object) {
    return nullptr;
  }

  const bool borrowed_expired =
      (object->requires_element && !object->element) ||
      (object->requires_context && !object->context_root);
  const auto event = object->event_alive.lock();
  if (LuaStateIsClosing() || !object->pointer ||
      object->generation != State().generation || borrowed_expired ||
      (object->requires_event && (!event || !event->event))) {
    luaL_error(state, "RmlUi userdata is no longer valid");
    return nullptr;
  }
  return object;
}

LuaObject* CheckLuaObjectRecord(lua_State* state, int index) {
  auto* object = TryLuaObjectRecord(state, index);
  if (!object) {
    luaL_error(state, "Expected checked RmlUi userdata");
  }

  return object;
}

std::shared_ptr<EventState> LuaEventOwner(Rml::Event* event) {
  const auto found = EventLifetimes().find(event);
  return found == EventLifetimes().end() ? nullptr : found->second.lock();
}

int CollectLuaObject(lua_State* state) {
  auto* object = RawObject(state, 1);
  if (object && object->pointer) {
    if (object->destroy && object->cast_element) {
      for (auto* active : State().active_elements) {
        for (auto* element = active; element;
             element = element->GetParentNode()) {
          if (element == object->cast_element) {
            return luaL_error(state, "Cannot collect an active RmlUi element");
          }
        }
      }
      for (auto* active : State().event_elements) {
        for (auto* element = active; element;
             element = element->GetParentNode()) {
          if (element == object->cast_element) {
            return luaL_error(state,
                              "Cannot collect an active RmlUi event target");
          }
        }
      }
    }
    auto* pointer = object->pointer;
    object->pointer = nullptr;
    if (object->destroy) {
      object->destroy(pointer);
    }
    object->~LuaObject();
    lua_pushnil(state);
    lua_setmetatable(state, 1);
  }
  return 0;
}

LuaEventScope::LuaEventScope(Rml::Event* event)
    : event_(event), alive_(std::make_shared<EventState>()) {
  alive_->event = event;
  alive_->generation = State().generation;
  previous_ = EventLifetimes()[event];
  EventLifetimes()[event] = alive_;
}

LuaEventScope::~LuaEventScope() {
  InvalidateEvent(alive_.get());

  if (previous_.expired()) {
    EventLifetimes().erase(event_);
  } else {
    EventLifetimes()[event_] = previous_;
  }
}

}  // namespace sfmlrmlui
