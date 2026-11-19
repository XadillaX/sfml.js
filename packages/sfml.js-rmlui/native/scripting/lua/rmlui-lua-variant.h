// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_VARIANT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_VARIANT_H_

#include <RmlUi/Core/Variant.h>
#include <RmlUi/Lua/IncludeLua.h>

#include <memory>
#include <unordered_map>
#include <unordered_set>
#include <vector>

#include "native/runtime/rmlui-callback-owners.h"

namespace sfmlrmlui {

struct LuaHost;

// Index one discovery pass by stable V8 identity, checking hash collisions.
// Each VM contributes its native values once to each actual owner.
class LuaVariantOwnerCollector {
 public:
  explicit LuaVariantOwnerCollector(CallbackOwnerSnapshots* snapshots);
  void Append(const std::shared_ptr<LuaHost>& host,
              v8::Local<v8::Object> handle);

 private:
  CallbackOwnerSnapshots* snapshots_;
  std::unordered_map<int, std::vector<size_t>> owners_;
  std::unordered_map<size_t, std::unordered_set<LuaHost*>> hosts_;
};

// Preserve values without Lua scalar representations as native-owned copies.
// The shared pointer slots retain their original expiry, not new raw leases.
bool PushManagedLuaVariant(lua_State* state, const Rml::Variant& value);
bool ReadManagedLuaVariant(lua_State* state, int index, Rml::Variant* result);

// Weak VM owners and indexed live userdata are consulted only after mutations.
void AppendLuaVariantCallbackOwners(CallbackOwnerSnapshots* snapshots);
void AppendLuaVariantValues(const std::shared_ptr<LuaHost>& host,
                            CallbackOwnerSnapshot* snapshot);
// Merge with the same owner instead of overwriting its existing DOM edges.
void AppendLuaVariantOwner(const std::shared_ptr<LuaHost>& host,
                           v8::Local<v8::Object> handle,
                           LuaVariantOwnerCollector* collector);
void AppendScriptLuaVariantOwners(LuaVariantOwnerCollector* collector);
void AppendLuaFunctionVariantOwners(LuaVariantOwnerCollector* collector);
void AppendLuaListenerVariantOwners(LuaVariantOwnerCollector* collector);
void AppendLuaModelVariantOwners(LuaVariantOwnerCollector* collector);
void AppendLuaInstancerVariantOwners(LuaVariantOwnerCollector* collector);
void AppendElementInstancerLuaVariantOwners(
    LuaVariantOwnerCollector* collector);
// Native trees root the VM's values; independent trees use their JS owner.
void AppendLuaVariantContextOwner(const std::shared_ptr<LuaHost>& host,
                                  Rml::Context* context,
                                  LuaVariantOwnerCollector* collector);
void AppendLuaVariantElementOwner(const std::shared_ptr<LuaHost>& host,
                                  Rml::Element* element,
                                  LuaVariantOwnerCollector* collector);
// Called at explicit shutdown, outside native destructors and Lua finalizers.
void ClearLuaVariantOwner(v8::Local<v8::Object> handle);
void ClearLuaFunctionVariantOwners();
// Lua-only tween copies use visible owner edges and a mutation-gated refresh.
void RefreshLuaVariantCallbackOwnership();
void ReleaseLuaVariantCallbackOwnership();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_LUA_RMLUI_LUA_VARIANT_H_
