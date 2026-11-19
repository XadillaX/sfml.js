// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/scripting/lua/rmlui-lua-instancer.h"

#include <RmlUi/Core/Factory.h>
#include <RmlUi/Lua/LuaType.h>

#include <cstring>
#include <memory>
#include <unordered_map>
#include <utility>

#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-host.h"
#include "native/scripting/lua/rmlui-lua-object.h"
#include "native/scripting/lua/rmlui-lua-variant.h"

namespace sfmlrmlui {
namespace {

class LuaInstancer;

struct Lease {
  std::shared_ptr<LuaHost> host;
  std::shared_ptr<LuaInstancer> instancer;
};

struct Allocation {
  std::shared_ptr<Lease> lease;
  Rml::ElementInstancer* original;
};

auto& Instancers() {
  static std::unordered_map<Rml::ElementInstancer*, std::weak_ptr<LuaInstancer>>
      values;
  return values;
}

auto& Registrations() {
  static std::unordered_map<Rml::String, std::shared_ptr<Lease>> values;
  return values;
}

auto& Allocations() {
  static std::unordered_map<Rml::Element*, Allocation> values;
  return values;
}

class CallbackScope final {
 public:
  explicit CallbackScope(bool* active) : active_(active) {
    *active_ = true;
    ++State().callback_depth;
    ++State().instancer_callback_depth;
  }
  ~CallbackScope() {
    --State().instancer_callback_depth;
    --State().callback_depth;
    *active_ = false;
  }

 private:
  bool* active_;
};

class LuaInstancer final : public Rml::ElementInstancer {
 public:
  ~LuaInstancer() {
    if (auto owner = host.lock(); owner && owner->state) {
      luaL_unref(owner->state, LUA_REGISTRYINDEX, reference);
    }
    Instancers().erase(this);
  }

  Rml::ElementPtr InstanceElement(Rml::Element*,
                                  const Rml::String& tag,
                                  const Rml::XMLAttributes&) override {
    auto owner = host.lock();
    if (!owner || !owner->state || owner->generation != State().generation ||
        !CanInvokeCallback()) {
      CaptureCallbackException(
          Nan::Error("Lua element instancer is no longer valid"));
      return {};
    }
    if (active) {
      CaptureCallbackException(Nan::Error("Recursive Lua element instancer"));
      return {};
    }
    auto* state = owner->state;
    LuaStateScope selected(state);
    const auto top = lua_gettop(state);
    CallbackScope callback(&active);
    Rml::ElementPtr result;
    // Run both callback and return conversion inside pcall. A wrong userdata
    // Invalid returns become catchable host errors inside the protected call.
    struct Call {
      LuaInstancer* instancer;
      const Rml::String* tag;
      Rml::ElementPtr* result;
    } call{this, &tag, &result};
    lua_pushcfunction(state, [](lua_State* current) {
      auto* invocation = static_cast<Call*>(lua_touserdata(current, 1));
      lua_rawgeti(current, LUA_REGISTRYINDEX, invocation->instancer->reference);
      if (lua_isnil(current, -1)) {
        return 0;
      }
      lua_pushlstring(
          current, invocation->tag->data(), invocation->tag->size());
      lua_call(current, 1, 1);
      if (lua_isnil(current, -1)) {
        return 0;
      }
      auto* object = CheckLuaObjectRecord(current, -1);
      Rml::Element* element = object->cast_element;
      Rml::ElementPtr* container = nullptr;
      if (!element && std::strcmp(object->type, "ElementPtr") == 0) {
        container = static_cast<Rml::ElementPtr*>(object->pointer);
        element = container->get();
      }
      if (!element || !object->destroy || element->GetParentNode() ||
          IsContextRoot(element)) {
        return luaL_error(current,
                          "Lua instancer requires a detached owned Element");
      }
      if (container) {
        *invocation->result = std::move(*container);
      } else {
        object->destroy = nullptr;
        invocation->result->reset(element);
      }
      return 0;
    });
    lua_pushlightuserdata(state, &call);
    const bool called = ProtectedLuaCall(state, 1, 0);
    lua_settop(state, top);
    if (!called || !result) {
      return {};
    }
    auto lease = std::make_shared<Lease>();
    lease->host = std::move(owner);
    lease->instancer = Instancers().at(this).lock();
    Allocations().emplace(
        result.get(),
        Allocation{std::move(lease), result->GetInstancerForBinding()});
    Rml::InvalidateCallbackResourcesForBinding();
    result->ReplaceInstancerForBinding(this);
    return result;
  }

  void ReleaseElement(Rml::Element* element) override {
    const auto found = Allocations().find(element);
    if (found == Allocations().end()) {
      return;
    }
    auto allocation = std::move(found->second);
    Allocations().erase(found);
    Rml::InvalidateCallbackResourcesForBinding();
    element->ReplaceInstancerForBinding(allocation.original);
    if (allocation.original) {
      allocation.original->ReleaseElement(element);
    } else {
      delete element;
    }
  }

  std::weak_ptr<LuaHost> host;
  int reference{LUA_NOREF};
  bool active{false};
};

std::shared_ptr<LuaInstancer> CheckInstancer(lua_State* state, int index) {
  auto* pointer = Rml::Lua::LuaType<Rml::ElementInstancer>::check(state, index);
  const auto found = Instancers().find(pointer);
  auto owner = found == Instancers().end() ? nullptr : found->second.lock();
  auto host = owner ? owner->host.lock() : nullptr;
  if (!host || FindLuaHost(state) != host || owner->active) {
    luaL_error(state, "Expected an inactive managed Lua ElementInstancer");
  }
  return owner;
}

void CheckMutation(lua_State* state) {
  const auto& runtime = State();
  if (runtime.callback_depth || runtime.stream_callback_depth ||
      runtime.system_callback_depth || runtime.plugin_callback_depth) {
    luaL_error(state, "Lua Factory mutation is not allowed during a callback");
  }
}

}  // namespace

int CreateLuaElementInstancer(lua_State* state) {
  if (!lua_isnoneornil(state, 1) && !lua_isfunction(state, 1)) {
    return luaL_error(state, "Expected a Lua instancer function or nil");
  }
  auto host = FindLuaHost(state);
  if (!host) {
    return luaL_error(state, "Expected a managed Lua state");
  }
  auto owner = std::make_shared<LuaInstancer>();
  owner->host = host;
  lua_pushvalue(state, 1);
  owner->reference = luaL_ref(state, LUA_REGISTRYINDEX);
  Instancers().emplace(owner.get(), owner);
  LuaObject object;
  object.pointer = owner.get();
  object.type = Rml::Lua::GetTClassName<Rml::ElementInstancer>();
  object.lifetime = std::move(owner);
  PushLuaObject(state, std::move(object));
  return 1;
}

int SetLuaElementInstancer(lua_State* state) {
  auto owner = CheckInstancer(state, 1);
  if (!lua_isfunction(state, 2) && !lua_isnil(state, 2)) {
    return luaL_error(state, "Expected a Lua instancer function or nil");
  }
  lua_pushvalue(state, 2);
  const auto reference = luaL_ref(state, LUA_REGISTRYINDEX);
  luaL_unref(state, LUA_REGISTRYINDEX, owner->reference);
  owner->reference = reference;
  return 0;
}

int RegisterLuaElementInstancer(lua_State* state) {
  CheckMutation(state);
  size_t length = 0;
  const auto* value = luaL_checklstring(state, 1, &length);
  Rml::String tag(value, length);
  if (tag.empty() || tag.find('\0') != Rml::String::npos) {
    return luaL_error(state, "Expected a nonempty Lua tag without null bytes");
  }
  auto owner = CheckInstancer(state, 2);
  auto lease = std::make_shared<Lease>();
  lease->host = owner->host.lock();
  lease->instancer = std::move(owner);
  Rml::Factory::RegisterElementInstancer(tag, lease->instancer.get());
  Registrations()[tag] = std::move(lease);
  Rml::InvalidateCallbackResourcesForBinding();
  return 0;
}

std::shared_ptr<LuaHost> LuaHostForElementInstancer(
    Rml::ElementInstancer* pointer) {
  const auto found = Instancers().find(pointer);
  const auto instancer =
      found == Instancers().end() ? nullptr : found->second.lock();
  return instancer ? instancer->host.lock() : nullptr;
}

void AppendLuaInstancerVariantOwners(LuaVariantOwnerCollector* collector) {
  for (const auto& [tag, lease] : Registrations()) {
    AppendLuaVariantOwner(lease->host, {}, collector);
  }

  for (const auto& [element, allocation] : Allocations()) {
    AppendLuaVariantElementOwner(allocation.lease->host, element, collector);
  }
}

std::shared_ptr<Rml::ElementInstancer> RetainLuaElementInstancer(
    Rml::ElementInstancer* pointer) {
  const auto found = Instancers().find(pointer);
  auto instancer = found == Instancers().end() ? nullptr : found->second.lock();
  if (!instancer) {
    return {};
  }
  auto lease = std::make_shared<Lease>();
  lease->host = instancer->host.lock();
  lease->instancer = std::move(instancer);
  return {lease, pointer};
}

bool LuaInstancerOwnsElement(Rml::ElementInstancer* instancer,
                             Rml::Element* element) {
  const auto found = Allocations().find(element);
  return found != Allocations().end() &&
         found->second.lease->instancer.get() == instancer;
}

void NotifyLuaInstancerRegistration(const Rml::String& tag,
                                    Rml::ElementInstancer* pointer) {
  const auto found = Registrations().find(tag);
  if (found != Registrations().end() &&
      found->second->instancer.get() != pointer) {
    Registrations().erase(found);
    Rml::InvalidateCallbackResourcesForBinding();
  }
}

void ReleaseLuaElementInstancers() {
  Registrations().clear();
  Allocations().clear();
  Instancers().clear();
}

}  // namespace sfmlrmlui
