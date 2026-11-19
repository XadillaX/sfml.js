// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/scripting/lua/rmlui-lua-model.h"

#include <RmlUi/Core/DataModelHandle.h>
#include <RmlUi/Core/DataVariable.h>
#include <RmlUi/Lua/Utilities.h>

#include <limits>
#include <memory>
#include <new>
#include <unordered_map>
#include <utility>

#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-host.h"
#include "native/scripting/lua/rmlui-lua-object.h"
#include "native/scripting/lua/rmlui-lua-variant.h"

namespace sfmlrmlui {
namespace {

constexpr const char* kModelType = "SFMLRMLUI_LUA_MODEL";
constexpr const char* kProxyType = "SFMLRMLUI_LUA_TABLE";
struct Model;

// Paths are resolved against the current root table. Cached native addresses
// therefore survive replacement of any ancestor table without stale values.
struct Node {
  Model* model;
  Node* parent{nullptr};
  Rml::String name;
  int index{-1};
  bool active_event{false};
  std::unordered_map<Rml::String, std::unique_ptr<Node>> children;
};

class Definition final : public Rml::VariableDefinition {
 public:
  Definition() : VariableDefinition(Rml::DataVariableType::Scalar) {}
  bool Get(void* pointer, Rml::Variant& value) override;
  bool Set(void* pointer, const Rml::Variant& value) override;
  int Size(void* pointer) override;
  Rml::DataVariable Child(void* pointer,
                          const Rml::DataAddressEntry& address) override;
};

struct Model {
  std::shared_ptr<LuaHost> host;
  Rml::Context* context{nullptr};
  Rml::DataModel* native{nullptr};
  Rml::String name;
  Rml::DataModelConstructor constructor;
  Rml::DataModelHandle handle;
  Definition definition;
  std::unordered_map<Rml::String, std::unique_ptr<Node>> roots;
  int table_ref{LUA_NOREF};
  int userdata_ref{LUA_NOREF};
  bool alive{true};

  void Release() {
    Rml::InvalidateCallbackResourcesForBinding();
    alive = false;
    context = nullptr;
    constructor = {};
    handle = {};
    if (host && host->state) {
      luaL_unref(host->state, LUA_REGISTRYINDEX, table_ref);
      luaL_unref(host->state, LUA_REGISTRYINDEX, userdata_ref);
    }
    table_ref = userdata_ref = LUA_NOREF;
    roots.clear();
    host.reset();
  }
};

struct Proxy {
  std::shared_ptr<Model> model;
  Rml::String root;
  int table_ref{LUA_NOREF};
  unsigned active{0};
};

// Lua table metamethods can reenter the binding. Keep storage active until
// they return, so they cannot collect a receiver or remove its native model.
class AccessScope final {
 public:
  explicit AccessScope(unsigned* active = nullptr) : active_(active) {
    ++State().callback_depth;
    ++State().data_value_callback_depth;
    if (active_) {
      ++*active_;
    }
  }
  ~AccessScope() {
    if (active_) {
      --*active_;
    }
    --State().callback_depth;
    --State().data_value_callback_depth;
  }

 private:
  unsigned* active_;
};

using ModelLease = std::shared_ptr<Model>;
using ContextModels = std::unordered_map<Rml::String, ModelLease>;

auto& Models() {
  static std::unordered_map<Rml::Context*, ContextModels> values;
  return values;
}

auto& NativeModels() {
  static std::unordered_map<Rml::DataModel*, ModelLease> values;
  return values;
}

class StackScope final {
 public:
  explicit StackScope(lua_State* state)
      : state_(state), top_(lua_gettop(state)) {}
  ~StackScope() { lua_settop(state_, top_); }

 private:
  lua_State* state_;
  int top_;
};

class ValueScope final {
 public:
  ValueScope() {
    ++State().value_callback_depth;
    ++State().callback_depth;
  }
  ~ValueScope() {
    --State().callback_depth;
    --State().value_callback_depth;
  }
};

class EventScope final {
 public:
  explicit EventScope(bool* active) : active_(active) {
    *active_ = true;
    ++State().data_event_callback_depth;
  }
  ~EventScope() {
    --State().data_event_callback_depth;
    *active_ = false;
  }

 private:
  bool* active_;
};

template <typename Function>
bool Invoke(lua_State* state, Function function) {
  lua_pushcfunction(state, [](lua_State* current) {
    auto* callback = static_cast<Function*>(lua_touserdata(current, 1));
    (*callback)();
    return 0;
  });
  lua_pushlightuserdata(state, &function);
  return ProtectedLuaCall(state, 1, 0);
}

template <typename Function>
bool Evaluate(Model* model, Function function) {
  if (!model->alive || !model->host || !model->host->state ||
      !CanInvokeCallback()) {
    return false;
  }
  auto* state = model->host->state;
  LuaStateScope selected(state);
  StackScope stack(state);
  ValueScope scope;
  return Invoke(state, std::move(function));
}

void PushKey(lua_State* state, const Node* node) {
  if (node->index >= 0) {
    lua_pushinteger(state, static_cast<lua_Integer>(node->index) + 1);
  } else {
    lua_pushlstring(state, node->name.data(), node->name.size());
  }
}

void PushNode(lua_State* state, const Node* node) {
  if (node->parent) {
    PushNode(state, node->parent);
  } else {
    lua_rawgeti(state, LUA_REGISTRYINDEX, node->model->table_ref);
  }
  if (!lua_istable(state, -1)) {
    lua_pop(state, 1);
    lua_pushnil(state);
    return;
  }
  PushKey(state, node);
  lua_gettable(state, -2);
  lua_remove(state, -2);
}

const Rml::String& RootName(const Node* node) {
  while (node->parent) {
    node = node->parent;
  }
  return node->name;
}

bool Definition::Get(void* pointer, Rml::Variant& value) {
  auto* node = static_cast<Node*>(pointer);
  bool result = false;
  const bool called = Evaluate(node->model, [&]() {
    auto* state = node->model->host->state;
    PushNode(state, node);
    const auto type = lua_type(state, -1);
    if (type == LUA_TNIL || type == LUA_TBOOLEAN || type == LUA_TNUMBER ||
        type == LUA_TSTRING) {
      Rml::Lua::GetVariant(state, -1, &value);
      result = true;
    }
  });
  return called && result;
}

bool Definition::Set(void* pointer, const Rml::Variant& value) {
  auto* node = static_cast<Node*>(pointer);
  bool result = false;
  const bool called = Evaluate(node->model, [&]() {
    auto* state = node->model->host->state;
    if (node->parent) {
      PushNode(state, node->parent);
    } else {
      lua_rawgeti(state, LUA_REGISTRYINDEX, node->model->table_ref);
    }
    if (!lua_istable(state, -1)) {
      return;
    }
    PushKey(state, node);
    Rml::Lua::PushVariant(state, &value);
    lua_settable(state, -3);
    node->model->handle.DirtyVariable(RootName(node));
    result = true;
  });
  return called && result;
}

int Definition::Size(void* pointer) {
  auto* node = static_cast<Node*>(pointer);
  int size = 0;
  if (!Evaluate(node->model, [&]() {
        auto* state = node->model->host->state;
        PushNode(state, node);
        if (lua_istable(state, -1)) {
          const auto length = luaL_len(state, -1);
          if (length > std::numeric_limits<int>::max() || length < 0) {
            luaL_error(state, "Lua array length exceeds the native limit");
          }
          size = static_cast<int>(length);
        }
      })) {
    return 0;
  }
  return size;
}

Rml::DataVariable Definition::Child(void* pointer,
                                    const Rml::DataAddressEntry& address) {
  auto* node = static_cast<Node*>(pointer);
  if (address.index < 0 && address.name == "size") {
    return Rml::MakeLiteralIntVariable(Size(pointer));
  }
  const auto key = address.index >= 0 ? "i:" + std::to_string(address.index)
                                      : "s:" + address.name;
  auto& child = node->children[key];
  if (!child) {
    child = std::make_unique<Node>();
    child->model = node->model;
    child->parent = node;
    child->name = address.name;
    child->index = address.index;
  }
  return {this, child.get()};
}

void CheckAlive(lua_State* state, const ModelLease& model) {
  if (!model || !model->alive || !model->host ||
      FindLuaHost(state) != model->host) {
    luaL_error(state, "Lua DataModel closed");
  }
}

ModelLease* CheckModel(lua_State* state, int index) {
  auto* lease =
      static_cast<ModelLease*>(luaL_checkudata(state, index, kModelType));
  CheckAlive(state, *lease);
  return lease;
}

Proxy* CheckProxy(lua_State* state, int index) {
  auto* proxy = static_cast<Proxy*>(luaL_checkudata(state, index, kProxyType));
  CheckAlive(state, proxy->model);
  if (proxy->table_ref == LUA_NOREF) {
    luaL_error(state, "Lua table proxy is no longer valid");
  }
  return proxy;
}

void PushTable(lua_State* state, const Proxy* proxy) {
  lua_rawgeti(state, LUA_REGISTRYINDEX, proxy->table_ref);
}

void Unwrap(lua_State* state, int index) {
  auto* proxy = static_cast<Proxy*>(luaL_testudata(state, index, kProxyType));
  if (proxy) {
    proxy = CheckProxy(state, index);
    PushTable(state, proxy);
  } else {
    lua_pushvalue(state, index);
  }
}

void WrapTable(lua_State* state,
               const ModelLease& model,
               const Rml::String& root) {
  if (!lua_istable(state, -1)) {
    return;
  }
  const auto reference = luaL_ref(state, LUA_REGISTRYINDEX);
  auto* memory = lua_newuserdatauv(state, sizeof(Proxy), 0);
  new (memory) Proxy{model, root, reference};
  luaL_setmetatable(state, kProxyType);
}

int ProxyGet(lua_State* state) {
  auto* proxy = CheckProxy(state, 1);
  AccessScope scope(&proxy->active);
  PushTable(state, proxy);
  lua_pushvalue(state, 2);
  lua_gettable(state, -2);
  WrapTable(state, proxy->model, proxy->root);
  return 1;
}

int ProxySet(lua_State* state) {
  auto* proxy = CheckProxy(state, 1);
  AccessScope scope(&proxy->active);
  PushTable(state, proxy);
  lua_pushvalue(state, 2);
  Unwrap(state, 3);
  lua_settable(state, -3);
  proxy->model->handle.DirtyVariable(proxy->root);
  return 0;
}

int ProxyLength(lua_State* state) {
  auto* proxy = CheckProxy(state, 1);
  AccessScope scope(&proxy->active);
  PushTable(state, proxy);
  lua_pushinteger(state, luaL_len(state, -1));
  return 1;
}

int ProxyCollect(lua_State* state) {
  auto* proxy = static_cast<Proxy*>(luaL_testudata(state, 1, kProxyType));
  if (proxy) {
    if (proxy->active) {
      return luaL_error(state, "Cannot collect an active Lua table proxy");
    }
    luaL_unref(state, LUA_REGISTRYINDEX, proxy->table_ref);
    proxy->~Proxy();
    lua_pushnil(state);
    lua_setmetatable(state, 1);
  }
  return 0;
}

int ModelCollect(lua_State* state) {
  auto* lease = static_cast<ModelLease*>(luaL_testudata(state, 1, kModelType));
  if (lease) {
    if ((*lease)->alive) {
      return luaL_error(state, "Cannot collect an active Lua DataModel");
    }
    lease->~ModelLease();
    lua_pushnil(state);
    lua_setmetatable(state, 1);
  }
  return 0;
}

Rml::String Name(lua_State* state, int index) {
  if (lua_type(state, index) != LUA_TSTRING) {
    luaL_error(state, "Expected a data model string name");
  }
  size_t length = 0;
  const auto* name = lua_tolstring(state, index, &length);
  Rml::String result(name, length);
  if (result.empty() || result.find('\0') != Rml::String::npos) {
    luaL_error(state, "Expected a nonempty data model name without null bytes");
  }
  return result;
}

void Bind(lua_State* state,
          Model* model,
          const Rml::String& name,
          int value_index) {
  auto node = std::make_unique<Node>();
  node->model = model;
  node->name = name;
  auto* pointer = node.get();
  if (lua_isfunction(state, value_index)) {
    const bool bound = model->constructor.BindEventCallback(
        name,
        [pointer](Rml::DataModelHandle,
                  Rml::Event& event,
                  const Rml::VariantList& arguments) {
          auto* owner = pointer->model;
          if (!owner->alive || !owner->host || !owner->host->state ||
              !CanInvokeCallback()) {
            return;
          }
          if (pointer->active_event) {
            const auto error =
                Nan::Error("Cannot recursively invoke the same Lua data event");
            CaptureCallbackException(error);
            return;
          }
          EventScope active(&pointer->active_event);
          auto* current = owner->host->state;
          LuaStateScope selected(current);
          StackScope stack(current);
          CallbackScope callback(event);
          LuaEventScope lease(&event);
          auto* target = event.GetCurrentElement();
          LuaDocumentScope globals(
              current, target ? target->GetOwnerDocument() : nullptr, &event);
          Invoke(current, [&]() {
            PushNode(current, pointer);
            Rml::Lua::LuaType<Rml::Event>::push(current, &event);
            for (const auto& value : arguments) {
              Rml::Lua::PushVariant(current, &value);
            }
            lua_call(current, static_cast<int>(arguments.size()) + 1, 0);
          });
        });
    if (!bound) {
      luaL_error(state, "Failed to bind Lua data event '%s'", name.c_str());
    }
  } else if (!model->constructor.BindCustomDataVariable(
                 name, {&model->definition, pointer})) {
    luaL_error(state, "Failed to bind Lua data variable '%s'", name.c_str());
  }
  model->roots.emplace(name, std::move(node));
}

int ModelGet(lua_State* state) {
  auto* lease = CheckModel(state, 1);
  AccessScope scope;
  lua_rawgeti(state, LUA_REGISTRYINDEX, (*lease)->table_ref);
  lua_pushvalue(state, 2);
  lua_gettable(state, -2);
  if (lua_istable(state, -1)) {
    WrapTable(state, *lease, Name(state, 2));
  }
  return 1;
}

int ModelSet(lua_State* state) {
  auto* lease = CheckModel(state, 1);
  AccessScope scope;
  auto* model = lease->get();
  const auto name = Name(state, 2);
  lua_rawgeti(state, LUA_REGISTRYINDEX, model->table_ref);
  Unwrap(state, 3);
  if (!model->roots.contains(name)) {
    Bind(state, model, name, lua_gettop(state));
  }
  lua_pushlstring(state, name.data(), name.size());
  lua_insert(state, -2);
  lua_settable(state, -3);
  model->handle.DirtyVariable(name);
  return 0;
}

void RegisterMetatables(lua_State* state) {
  if (luaL_newmetatable(state, kModelType)) {
    const luaL_Reg methods[] = {{"__index", ModelGet},
                                {"__newindex", ModelSet},
                                {"__gc", ModelCollect},
                                {nullptr, nullptr}};
    luaL_setfuncs(state, methods, 0);
  }
  lua_pop(state, 1);
  if (luaL_newmetatable(state, kProxyType)) {
    const luaL_Reg methods[] = {{"__index", ProxyGet},
                                {"__newindex", ProxySet},
                                {"__len", ProxyLength},
                                {"__gc", ProxyCollect},
                                {nullptr, nullptr}};
    luaL_setfuncs(state, methods, 0);
  }
  lua_pop(state, 1);
}

}  // namespace

bool OpenLuaModel(lua_State* state,
                  Rml::Context* context,
                  int name_index,
                  int table_index) {
  const auto name = Name(state, name_index);
  luaL_checktype(state, table_index, LUA_TTABLE);
  table_index = lua_absindex(state, table_index);
  auto host = FindLuaHost(state);
  if (!host) {
    return luaL_error(state, "Expected a managed Lua state");
  }
  const auto existing_context = Models().find(context);
  if (existing_context != Models().end()) {
    const auto existing = existing_context->second.find(name);
    if (existing != existing_context->second.end()) {
      const auto& model = existing->second;
      if (model->host != host || !model->alive) {
        return false;
      }
      lua_rawgeti(state, LUA_REGISTRYINDEX, model->userdata_ref);
      return true;
    }
  }
  auto constructor = context->CreateDataModel(name);
  if (!constructor) {
    return false;
  }
  auto model = std::make_shared<Model>();
  model->host = std::move(host);
  model->context = context;
  model->name = name;
  model->constructor = constructor;
  model->handle = constructor.GetModelHandle();
  auto* native =
      Rml::Detail::DataModelConstructorAccessor::GetModel(constructor);
  model->native = native;
  RegisterMetatables(state);
  lua_pushvalue(state, table_index);
  model->table_ref = luaL_ref(state, LUA_REGISTRYINDEX);
  auto* memory = lua_newuserdatauv(state, sizeof(ModelLease), 0);
  new (memory) ModelLease(model);
  luaL_setmetatable(state, kModelType);
  lua_pushvalue(state, -1);
  model->userdata_ref = luaL_ref(state, LUA_REGISTRYINDEX);
  Models()[context].emplace(name, model);
  NativeModels().emplace(native, model);
  Rml::InvalidateCallbackResourcesForBinding();
  try {
    lua_pushnil(state);
    while (lua_next(state, table_index)) {
      Bind(state, model.get(), Name(state, -2), lua_gettop(state));
      lua_pop(state, 1);
    }
  } catch (...) {
    context->RemoveDataModel(name);
    throw;
  }
  return true;
}

void CloseLuaModel(lua_State* state, Rml::Context* context, int name_index) {
  const auto name = Name(state, name_index);
  context->RemoveDataModel(name);
}

void InvalidateLuaModel(Rml::Context* context, Rml::DataModel* native) {
  const auto found = NativeModels().find(native);
  if (found != NativeModels().end() && found->second->context == context) {
    found->second->alive = false;
  }
}

void ReleaseLuaModel(Rml::Context* context, Rml::DataModel* native) {
  const auto found = Models().find(context);
  if (found == Models().end()) {
    return;
  }
  const auto model = NativeModels().find(native);
  if (model != NativeModels().end() && model->second->context == context) {
    const auto name = model->second->name;
    model->second->Release();
    found->second.erase(name);
    NativeModels().erase(model);
  }
  if (found->second.empty()) {
    Models().erase(found);
  }
}

void ReleaseLuaContextModels(Rml::Context* context) {
  const auto found = Models().find(context);
  if (found != Models().end()) {
    for (const auto& [name, model] : found->second) {
      NativeModels().erase(model->native);
      model->Release();
    }
    Models().erase(found);
  }
}

void AppendLuaModelVariantOwners(LuaVariantOwnerCollector* collector) {
  for (const auto& [context, models] : Models()) {
    for (const auto& [name, model] : models) {
      if (model->alive && model->host) {
        AppendLuaVariantContextOwner(model->host, context, collector);
      }
    }
  }
}

}  // namespace sfmlrmlui
