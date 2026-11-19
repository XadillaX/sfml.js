// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Lua/Interpreter.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <memory>
#include <vector>

#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-host.h"
#include "native/scripting/lua/rmlui-lua-variant.h"

namespace sfmlrmlui {
namespace {

constexpr int kMaxSlots = LUAI_MAXSTACK - 8;

// Registry references never escape to JS. Each reference retains its exact VM.
struct LuaFunctionState {
  std::shared_ptr<LuaHost> host;
  v8::Global<v8::Object> handle;
  int reference{LUA_NOREF};

  ~LuaFunctionState() { Release(); }

  void Release() {
    if (host && host->state && reference != LUA_NOREF) {
      luaL_unref(host->state, LUA_REGISTRYINDEX, reference);
    }

    reference = LUA_NOREF;
    host.reset();
    Rml::InvalidateCallbackResourcesForBinding();
  }
};

using LuaFunctionHandle = sfmljs::SharedHandle<LuaFunctionState>;

auto& Functions() {
  static std::vector<std::weak_ptr<LuaFunctionState>> functions;
  return functions;
}

std::shared_ptr<LuaFunctionState> FunctionOf(v8::Local<v8::Value> value) {
  auto* handle = LuaFunctionHandle::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a managed Lua function");
    return {};
  }

  auto owner = handle->owner();
  if (!owner->host || !owner->host->state ||
      owner->host->generation != State().generation ||
      owner->reference == LUA_NOREF) {
    Nan::ThrowError("Lua function is no longer valid");
    return {};
  }

  return owner;
}

v8::Local<v8::Object> RetainFunction(const std::shared_ptr<LuaHost>& host) {
  auto function = std::make_shared<LuaFunctionState>();
  function->host = host;
  function->reference = luaL_ref(host->state, LUA_REGISTRYINDEX);

  auto handle = LuaFunctionHandle::Create(function);
  function->handle.Reset(v8::Isolate::GetCurrent(), handle);
  function->handle.SetWeak();
  Functions().push_back(function);
  Rml::InvalidateCallbackResourcesForBinding();
  return handle;
}

bool ReadPath(v8::Local<v8::Value> value, Rml::String* path) {
  if (!value->IsString()) {
    Nan::ThrowTypeError("Expected a Lua source path");
    return false;
  }

  Nan::Utf8String text(value);
  path->assign(*text, text.length());
  if (path->find('\0') != Rml::String::npos) {
    Nan::ThrowTypeError("Lua source path cannot contain a null byte");
    return false;
  }

  return true;
}

NAN_METHOD(Compile) {
  auto host = LuaHostOf(info[0]);
  Rml::String path;
  if (!host || !ReadPath(info[2], &path)) {
    return;
  }

  if (!info[1]->IsString() || !info[3]->IsInt32() ||
      Nan::To<int>(info[3]).FromJust() < 1) {
    return Nan::ThrowTypeError("Expected Lua source and positive line");
  }

  Nan::Utf8String source(info[1]);
  LuaStateScope selected(host->state);
  LuaStackScope stack(host->state);
  if (host->Compile(Rml::String(*source, source.length()),
                    path,
                    Nan::To<int>(info[3]).FromJust())) {
    info.GetReturnValue().Set(RetainFunction(host));
  }
}

NAN_METHOD(Capture) {
  auto host = LuaHostOf(info[0]);
  Rml::String name;
  if (!host || !ReadLuaName(info[1], &name)) {
    return;
  }

  LuaStateScope selected(host->state);
  LuaStackScope stack(host->state);
  lua_pushglobaltable(host->state);
  lua_pushlstring(host->state, name.data(), name.size());
  lua_rawget(host->state, -2);
  if (!lua_isfunction(host->state, -1)) {
    return Nan::ThrowTypeError("Expected a named Lua function");
  }

  info.GetReturnValue().Set(RetainFunction(host));
}

NAN_METHOD(Invoke) {
  auto function = FunctionOf(info[0]);
  if (!function) {
    return;
  }

  if (!info[1]->IsArray() || !info[2]->IsInt32() ||
      Nan::To<int>(info[2]).FromJust() < 0) {
    return Nan::ThrowTypeError("Expected Lua arguments and result count");
  }

  const auto arguments = info[1].As<v8::Array>();
  const auto length = arguments->Length();
  const int results = Nan::To<int>(info[2]).FromJust();
  if (length > static_cast<unsigned>(kMaxSlots) || results > kMaxSlots) {
    return Nan::ThrowRangeError("Too many Lua arguments or results");
  }

  // Finish arbitrary V8 getters before borrowing the stack. A getter may
  // release this very reference, shut down the runtime or throw.
  std::vector<v8::Local<v8::Value>> values;
  values.reserve(length);
  for (unsigned i = 0; i < length; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(arguments, i).ToLocal(&value)) {
      return;
    }
    values.push_back(value);
  }

  function = FunctionOf(info[0]);
  if (!function) {
    return;
  }

  // Nested callbacks may release the reference while the function executes.
  // Retain its host separately until the borrowed stack scope has unwound.
  auto host = function->host;
  auto* state = host->state;
  LuaStateScope selected(state);
  LuaStackScope stack(state);
  if (!lua_checkstack(state, std::max(static_cast<int>(length), results) + 8)) {
    return Nan::ThrowRangeError("Too many Lua arguments or results for stack");
  }

  lua_rawgeti(state, LUA_REGISTRYINDEX, function->reference);
  for (auto value : values) {
    if (!PushLuaScalar(state, value)) {
      return;
    }
  }

  if (!ProtectedLuaCall(state, static_cast<int>(length), results)) {
    return;
  }

  auto output = Nan::New<v8::Array>(results);
  Nan::TryCatch caught;
  for (int i = 0; i < results; ++i) {
    auto value = ReadLuaScalar(state, i - results);
    if (caught.HasCaught()) {
      caught.ReThrow();
      return;
    }
    if (Nan::Set(output, i, value).IsNothing()) {
      return;
    }
  }

  info.GetReturnValue().Set(output);
}

NAN_METHOD(Release) {
  auto function = FunctionOf(info[0]);
  if (function) {
    function->Release();
  }
}

NAN_METHOD(ExecuteFile) {
  auto host = LuaHostOf(info[0]);
  Rml::String path;
  if (!host || !ReadPath(info[1], &path)) {
    return;
  }

  LuaStateScope selected(host->state);
  LuaStackScope stack(host->state);
  // Explicit host execution has no document. Restore any enclosing globals.
  LuaDocumentScope globals(host->state, nullptr);
  Rml::Lua::Interpreter::LoadFile(path);
}

}  // namespace

void AppendLuaFunctionVariantOwners(LuaVariantOwnerCollector* collector) {
  std::erase_if(Functions(), [](const auto& weak) { return weak.expired(); });

  for (const auto& weak : Functions()) {
    if (auto function = weak.lock(); function && !function->handle.IsEmpty()) {
      AppendLuaVariantOwner(function->host,
                            function->handle.Get(v8::Isolate::GetCurrent()),
                            collector);
    }
  }
}

void ClearLuaFunctionVariantOwners() {
  for (const auto& weak : Functions()) {
    if (auto function = weak.lock(); function && !function->handle.IsEmpty()) {
      ClearLuaVariantOwner(function->handle.Get(v8::Isolate::GetCurrent()));
    }
  }
}

NAN_MODULE_INIT(InitializeRmlLuaFunctions) {
  SetRuntimeMethod<Compile, true>(target, "compileLuaFunction");
  SetRuntimeMethod<Capture, true>(target, "captureLuaFunction");
  SetRuntimeMethod<Invoke, true>(target, "invokeLuaFunction");
  SetRuntimeMethod<Release, true>(target, "releaseLuaFunction");
  SetRuntimeMethod<ExecuteFile, true>(target, "executeLuaFile");
}

}  // namespace sfmlrmlui
