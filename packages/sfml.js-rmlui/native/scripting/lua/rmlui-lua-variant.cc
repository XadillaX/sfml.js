// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/scripting/lua/rmlui-lua-variant.h"

#include <cstdint>
#include <cstring>
#include <limits>
#include <memory>
#include <new>
#include <unordered_map>
#include <utility>

#include "native/animation/rmlui-animation-values.h"
#include "native/animation/rmlui-value-callbacks.h"
#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-context-instancers.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-host.h"
#include "native/scripting/lua/rmlui-lua-object.h"
#include "native/values/rmlui-variant-pointers.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

constexpr const char* kVariantType = "SFMLRMLUI_LUA_VARIANT";

auto& VariantHosts() {
  static std::unordered_map<LuaHost*, std::weak_ptr<LuaHost>> hosts;
  return hosts;
}

struct LuaCallbackOwners {
  CallbackResourceGate gate;
  v8::Global<v8::Array> native_roots;
  bool active{false};
};

auto& CallbackOwners() {
  static LuaCallbackOwners owners;
  return owners;
}

struct LuaVariant {
  LuaVariant(Rml::Variant source, const std::shared_ptr<LuaHost>& owner)
      : value(std::move(source)), host(owner), generation(owner->generation) {
    owner->variants.insert(&value);
    VariantHosts().insert_or_assign(owner.get(), owner);
    Rml::InvalidateCallbackResourcesForBinding();
  }

  ~LuaVariant() {
    if (auto owner = host.lock()) {
      owner->variants.erase(&value);
    }

    Rml::InvalidateCallbackResourcesForBinding();
  }

  Rml::Variant value;
  std::weak_ptr<LuaHost> host;
  uint64_t generation;
};

LuaVariant* VariantOf(lua_State* state, int index) {
  if (lua_rawlen(state, index) != sizeof(LuaVariant)) {
    return nullptr;
  }

  return static_cast<LuaVariant*>(luaL_testudata(state, index, kVariantType));
}

LuaVariant* CheckedVariant(lua_State* state, int index) {
  auto* variant = VariantOf(state, index);
  if (!variant) {
    luaL_error(state, "Expected an owned RmlUi Variant");
    return nullptr;
  }

  const auto host = variant->host.lock();
  if (!host || !host->state || LuaStateIsClosing() ||
      variant->generation != State().generation || host != FindLuaHost(state)) {
    luaL_error(state, "RmlUi Variant is no longer valid");
    return nullptr;
  }

  return variant;
}

int CollectVariant(lua_State* state) {
  if (auto* variant = VariantOf(state, 1)) {
    variant->~LuaVariant();
    lua_pushnil(state);
    lua_setmetatable(state, 1);
  }

  return 0;
}

int EqualVariants(lua_State* state) {
  const auto* first = CheckedVariant(state, 1);
  const auto* second = VariantOf(state, 2);
  if (second) {
    second = CheckedVariant(state, 2);
  }

  lua_pushboolean(state, second && first->value == second->value);
  return 1;
}

int DescribeVariant(lua_State* state) {
  CheckedVariant(state, 1);
  lua_pushliteral(state, "RmlUi Variant");
  return 1;
}

void PushSnapshot(lua_State* state, const Rml::Variant& value) {
  const auto host = FindLuaHost(state);
  if (!host) {
    luaL_error(state, "Expected a managed Lua state for an owned Variant");
    return;
  }

  if (luaL_newmetatable(state, kVariantType)) {
    lua_pushcfunction(state, CollectVariant);
    lua_setfield(state, -2, "__gc");
    lua_pushcfunction(state, EqualVariants);
    lua_setfield(state, -2, "__eq");
    lua_pushcfunction(state, DescribeVariant);
    lua_setfield(state, -2, "__tostring");
    lua_pushliteral(state, "RmlUi Variant");
    lua_setfield(state, -2, "__metatable");
  }

  auto* storage = lua_newuserdatauv(state, sizeof(LuaVariant), 0);
  new (storage) LuaVariant(value, host);
  lua_pushvalue(state, -2);
  lua_setmetatable(state, -2);
  lua_remove(state, -2);
}

}  // namespace

bool PushManagedLuaVariant(lua_State* state, const Rml::Variant& value) {
  switch (value.GetType()) {
    case Rml::Variant::BYTE:
      lua_pushinteger(state, value.GetReference<Rml::byte>());
      return true;

    case Rml::Variant::CHAR:
      lua_pushinteger(state, value.GetReference<char>());
      return true;

    case Rml::Variant::UINT64:
      if (value.GetReference<uint64_t>() <=
          static_cast<uint64_t>(std::numeric_limits<lua_Integer>::max())) {
        return false;
      }
      break;

    case Rml::Variant::VOIDPTR:
      if (value.GetReference<void*>() &&
          !value.HasGuardedOpaquePointerForBinding()) {
        luaL_error(state,
                   "Native opaque pointer requires its registered owner");
      }
      break;

    case Rml::Variant::SCRIPTINTERFACE:
      if (value.GetReference<Rml::ScriptInterface*>() &&
          !value.HasGuardedScriptInterfaceForBinding()) {
        luaL_error(state,
                   "Native script pointer requires its registered owner");
      }
      break;

    case Rml::Variant::VECTOR3:
    case Rml::Variant::VECTOR4:
    case Rml::Variant::TRANSFORMPTR:
    case Rml::Variant::TRANSITIONLIST:
    case Rml::Variant::ANIMATIONLIST:
    case Rml::Variant::DECORATORSPTR:
    case Rml::Variant::FILTERSPTR:
    case Rml::Variant::FONTEFFECTSPTR:
    case Rml::Variant::COLORSTOPLIST:
    case Rml::Variant::BOXSHADOWLIST:
      break;

    default:
      return false;
  }

  PushSnapshot(state, value);
  return true;
}

bool ReadManagedLuaVariant(lua_State* state, int index, Rml::Variant* result) {
  if (VariantOf(state, index)) {
    *result = CheckedVariant(state, index)->value;
    return true;
  }

  auto* object = TryLuaObjectRecord(state, index);
  if (!object) {
    return false;
  }

  if (std::strcmp(object->type, "Vector2f") == 0) {
    *result = *static_cast<Rml::Vector2f*>(object->pointer);
  } else if (std::strcmp(object->type, "Colourb") == 0) {
    *result = *static_cast<Rml::Colourb*>(object->pointer);
  } else if (std::strcmp(object->type, "Colourf") == 0) {
    *result = *static_cast<Rml::Colourf*>(object->pointer);
  } else if (object->cast_element) {
    ElementVariantFromNative(object->cast_element, result);
  } else if (std::strcmp(object->type, "Context") == 0) {
    if (!ContextVariantFromNative(static_cast<Rml::Context*>(object->pointer),
                                  result)) {
      luaL_error(state, "Expected a registered RmlUi context");
    }
  } else if (std::strcmp(object->type, "Event") == 0) {
    const auto owner = LuaEventOwner(static_cast<Rml::Event*>(object->pointer));
    if (!owner || !owner->event) {
      luaL_error(state, "RmlUi event callback has expired");
    }

    EventVariantFromNative(owner, result);
  } else {
    return false;
  }

  return true;
}

void AppendLuaVariantValues(const std::shared_ptr<LuaHost>& host,
                            CallbackOwnerSnapshot* snapshot) {
  if (!host || !host->state || host->generation != State().generation) {
    return;
  }

  for (const auto* value : host->variants) {
    if (Rml::HasCallbackResourcesForBinding(*value) ||
        value->GetType() == Rml::Variant::ANIMATIONLIST ||
        value->GetType() == Rml::Variant::TRANSITIONLIST) {
      snapshot->values.push_back(*value);
      State().data_diagnostics.Record(
          &DataDiagnostics::lua_variant_snapshot_values);
    }
  }
}

void AppendLuaVariantCallbackOwners(CallbackOwnerSnapshots* snapshots) {
  State().data_diagnostics.Record(&DataDiagnostics::lua_variant_owner_passes);
  LuaVariantOwnerCollector collector(snapshots);

  for (auto iterator = VariantHosts().begin();
       iterator != VariantHosts().end();) {
    const auto host = iterator->second.lock();
    if (!host) {
      iterator = VariantHosts().erase(iterator);
      continue;
    }
    ++iterator;

    if (!host->handle.IsEmpty()) {
      AppendLuaVariantOwner(
          host, host->handle.Get(v8::Isolate::GetCurrent()), &collector);
    }

    // Keep this weak VM entry until VM destruction. Separate callback-owner
    // passes each need its empty snapshot to clear their previous edges.
  }

  // Native documents/selections can retain the VM without its JS facade.
  // Their owners supply separate roots instead of promoting every live VM.
  AppendScriptLuaVariantOwners(&collector);
  AppendLuaFunctionVariantOwners(&collector);
  AppendLuaListenerVariantOwners(&collector);
  AppendLuaModelVariantOwners(&collector);
  AppendLuaInstancerVariantOwners(&collector);
  AppendElementInstancerLuaVariantOwners(&collector);
}

LuaVariantOwnerCollector::LuaVariantOwnerCollector(
    CallbackOwnerSnapshots* snapshots)
    : snapshots_(snapshots) {
  owners_.reserve(snapshots->size());

  for (size_t index = 0; index < snapshots->size(); ++index) {
    const auto handle = (*snapshots)[index].handle;
    const int identity = handle.IsEmpty() ? 0 : handle->GetIdentityHash();
    owners_[identity].push_back(index);
  }
}

void LuaVariantOwnerCollector::Append(const std::shared_ptr<LuaHost>& host,
                                      v8::Local<v8::Object> handle) {
  State().data_diagnostics.Record(&DataDiagnostics::lua_variant_owner_lookups);

  const int identity = handle.IsEmpty() ? 0 : handle->GetIdentityHash();
  auto& candidates = owners_[identity];
  size_t index = snapshots_->size();

  for (const auto candidate : candidates) {
    State().data_diagnostics.Record(
        &DataDiagnostics::lua_variant_owner_comparisons);
    if ((*snapshots_)[candidate].handle == handle) {
      index = candidate;
      break;
    }
  }

  if (index == snapshots_->size()) {
    auto& snapshot = snapshots_->emplace_back();
    snapshot.handle = handle;
    candidates.push_back(index);
  }

  if (hosts_[index].insert(host.get()).second) {
    AppendLuaVariantValues(host, &(*snapshots_)[index]);
  }
}

void AppendLuaVariantOwner(const std::shared_ptr<LuaHost>& host,
                           v8::Local<v8::Object> handle,
                           LuaVariantOwnerCollector* collector) {
  collector->Append(host, handle);
}

void AppendLuaVariantContextOwner(const std::shared_ptr<LuaHost>& host,
                                  Rml::Context* context,
                                  LuaVariantOwnerCollector* collector) {
  v8::Local<v8::Object> handle;
  if (context && IsOwnedContext(context)) {
    const auto found = State().contexts.find(context);
    if (found == State().contexts.end() || found->second->handle.IsEmpty()) {
      return;
    }

    handle = found->second->handle.Get(v8::Isolate::GetCurrent());
  }

  AppendLuaVariantOwner(host, handle, collector);
}

void AppendLuaVariantElementOwner(const std::shared_ptr<LuaHost>& host,
                                  Rml::Element* element,
                                  LuaVariantOwnerCollector* collector) {
  if (auto* root = DetachedOwnerOf(element)) {
    AppendLuaVariantOwner(host, WrapElement(root), collector);
    return;
  }

  AppendLuaVariantContextOwner(host, element->GetContext(), collector);
}

void ClearLuaVariantOwner(v8::Local<v8::Object> handle) {
  for (const auto* name : {"rml.owner.element.values",
                           "rml.owner.font.effects",
                           "rml.lua.value.tweens",
                           "rml.value.callbacks"}) {
    Nan::DeletePrivate(handle, Nan::New(name).ToLocalChecked()).FromJust();
  }
}

void RefreshLuaVariantCallbackOwnership() {
  auto& owners = CallbackOwners();
  if (State().cleaning_up || !State().initialized ||
      (VariantHosts().empty() && !owners.active) || !owners.gate.Changed()) {
    return;
  }

  owners.active = !VariantHosts().empty();
  CallbackOwnerSnapshots snapshots;
  AppendLuaVariantCallbackOwners(&snapshots);
  v8::Local<v8::Array> native_roots;
  const auto key = Nan::New("rml.lua.value.tweens").ToLocalChecked();

  for (const auto& snapshot : snapshots) {
    auto handles = Nan::New<v8::Array>();

    for (const auto& value : snapshot.values) {
      VisitCallbackValues(value, [&](const Rml::Variant& current) {
        if (current.GetType() != Rml::Variant::TRANSITIONLIST &&
            current.GetType() != Rml::Variant::ANIMATIONLIST) {
          return;
        }

        auto holder = Nan::New<v8::Object>();
        RetainVariantTweens(holder, current);
        handles
            ->CreateDataProperty(
                Nan::GetCurrentContext(), handles->Length(), holder)
            .FromJust();
      });
    }

    if (!snapshot.handle.IsEmpty()) {
      if (handles->Length()) {
        Nan::SetPrivate(snapshot.handle, key, handles).FromJust();
      } else {
        Nan::DeletePrivate(snapshot.handle, key).FromJust();
      }
    } else if (handles->Length()) {
      native_roots = handles;
    }
  }

  if (native_roots.IsEmpty()) {
    owners.native_roots.Reset();
  } else {
    owners.native_roots.Reset(v8::Isolate::GetCurrent(), native_roots);
  }
}

void ReleaseLuaVariantCallbackOwnership() {
  auto& owners = CallbackOwners();
  owners.gate.Reset();
  owners.native_roots.Reset();
  owners.active = false;
}

}  // namespace sfmlrmlui
