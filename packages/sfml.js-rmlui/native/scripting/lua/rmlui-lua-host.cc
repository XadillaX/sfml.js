// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/scripting/lua/rmlui-lua-host.h"

#include <RmlUi/Lua/LuaType.h>
#include <sfml-js-interop.h>

#include <array>
#include <cmath>
#include <limits>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/events/rmlui-listener-instancers.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-object.h"
#include "native/scripting/lua/rmlui-lua-variant.h"
#include "third_party/rmlui/Source/Lua/LuaPlugin.h"

namespace sfmlrmlui {
namespace {

using LuaHostHandle = sfmljs::SharedHandle<LuaHost>;
thread_local lua_State* selected_state = nullptr;
thread_local bool closing_state = false;

class CloseScope final {
 public:
  explicit CloseScope(lua_State* state)
      : selected_(state), previous_(closing_state) {
    closing_state = true;
  }
  ~CloseScope() { closing_state = previous_; }

 private:
  LuaStateScope selected_;
  bool previous_;
};

auto& Hosts() {
  static std::unordered_map<lua_State*, std::weak_ptr<LuaHost>> values;
  return values;
}

auto& RetiredStates() {
  static std::vector<lua_State*> values;
  return values;
}

int Traceback(lua_State* state) {
  const auto* message = lua_tostring(state, 1);
  luaL_traceback(state, state, message ? message : "Lua script error", 1);
  return 1;
}

void GetGlobal(lua_State* state, const char* name) {
  lua_pushglobaltable(state);
  lua_pushstring(state, name);
  lua_rawget(state, -2);
  lua_remove(state, -2);
}

void SetGlobal(lua_State* state, const char* name) {
  lua_pushglobaltable(state);
  lua_pushstring(state, name);
  lua_pushvalue(state, -3);
  lua_rawset(state, -3);
  lua_pop(state, 2);
}

struct LuaFunction {
  std::shared_ptr<LuaHost> host;
  Rml::ObserverPtr<Rml::Element> document;
  bool requires_document{false};
  int reference{LUA_NOREF};

  ~LuaFunction() {
    if (host->state) {
      luaL_unref(host->state, LUA_REGISTRYINDEX, reference);
    }
  }

  void Invoke(Rml::Event* event) {
    if (!host->state || (requires_document && !document)) {
      CaptureCallbackException(
          Nan::Error("Lua listener document is no longer valid"));
      return;
    }
    auto* state = host->state;
    LuaStateScope selected(state);
    LuaStackScope stack(state);
    LuaEventScope lease(event);
    auto* owner =
        document ? rmlui_dynamic_cast<Rml::ElementDocument*>(document.get())
                 : nullptr;
    LuaDocumentScope globals(state, owner, event);
    lua_rawgeti(state, LUA_REGISTRYINDEX, reference);
    Rml::Lua::LuaType<Rml::Event>::push(state, event);
    Rml::Lua::LuaType<Rml::Element>::push(state, event->GetCurrentElement());
    Rml::Lua::LuaType<Rml::ElementDocument>::push(state, owner);
    ProtectedLuaCall(state, 3, 0);
  }
};

Rml::EventListener* RetainFunction(lua_State* state,
                                   const std::shared_ptr<LuaHost>& host,
                                   Rml::ElementDocument* document) {
  auto function = std::make_shared<LuaFunction>();
  function->host = host;
  function->requires_document = document != nullptr;
  if (document) {
    function->document = document->GetObserverPtr();
  }
  function->reference = luaL_ref(state, LUA_REGISTRYINDEX);
  return CreateNativeEventListener(
      [function](Rml::Event* event) { function->Invoke(event); }, host);
}

bool Identifier(const Rml::String& value) {
  if (value.empty()) {
    return false;
  }
  const auto letter = [](unsigned char c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
  };
  if (!letter(value.front())) {
    return false;
  }
  for (unsigned char c : value) {
    if (!letter(c) && !(c >= '0' && c <= '9')) {
      return false;
    }
  }
  return true;
}

bool ReadName(v8::Local<v8::Value> value, Rml::String* result) {
  if (!value->IsString()) {
    Nan::ThrowTypeError("Expected a Lua global name");
    return false;
  }
  Nan::Utf8String text(value);
  result->assign(*text, text.length());
  if (!Identifier(*result)) {
    Nan::ThrowTypeError("Expected a Lua identifier");
    return false;
  }
  return true;
}

bool PushValue(lua_State* state, v8::Local<v8::Value> value) {
  if (value->IsNull()) {
    lua_pushnil(state);
  } else if (value->IsBoolean()) {
    lua_pushboolean(state, value->IsTrue());
  } else if (value->IsBigInt()) {
    bool exact = false;
    const auto integer = value.As<v8::BigInt>()->Int64Value(&exact);
    if (!exact) {
      Nan::ThrowRangeError("Lua integers require signed 64-bit values");
      return false;
    }
    lua_pushinteger(state, integer);
  } else if (value->IsNumber()) {
    const auto number = Nan::To<double>(value).FromJust();
    if (!std::isfinite(number)) {
      Nan::ThrowRangeError("Expected a finite Lua number");
      return false;
    }
    lua_pushnumber(state, number);
  } else if (value->IsString()) {
    Nan::Utf8String string(value);
    lua_pushlstring(state, *string, string.length());
  } else {
    Nan::ThrowTypeError("Expected a Lua scalar value");
    return false;
  }
  return true;
}

v8::Local<v8::Value> ReadValue(lua_State* state, int index) {
  switch (lua_type(state, index)) {
    case LUA_TNIL:
      return Nan::Null();
    case LUA_TBOOLEAN:
      return Nan::New(lua_toboolean(state, index) != 0);
    case LUA_TNUMBER: {
      if (lua_isinteger(state, index)) {
        return v8::BigInt::New(v8::Isolate::GetCurrent(),
                               lua_tointeger(state, index));
      }
      const auto number = lua_tonumber(state, index);
      if (!std::isfinite(number)) {
        Nan::ThrowRangeError("Expected a finite Lua result");
        return Nan::Undefined();
      }
      return Nan::New(number);
    }
    case LUA_TSTRING: {
      size_t length = 0;
      const auto* text = lua_tolstring(state, index, &length);
      if (length > static_cast<size_t>(v8::String::kMaxLength)) {
        Nan::ThrowRangeError("Lua string exceeds the host string limit");
        return Nan::Undefined();
      }
      return Nan::New(text, static_cast<int>(length)).ToLocalChecked();
    }
    default:
      Nan::ThrowTypeError("Lua result is not a scalar value");
      return Nan::Undefined();
  }
}

NAN_METHOD(CreateHost) {
  if (!info[0]->IsBoolean() || !info[1]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected Lua script policy flags");
  }
  auto owner = std::make_shared<LuaHost>();
  owner->generation = State().generation;
  owner->allow_inline = info[0]->IsTrue();
  owner->allow_external = info[1]->IsTrue();
  owner->state = luaL_newstate();
  if (!owner->state) {
    return Nan::ThrowError("Failed to allocate Lua state");
  }
  Hosts().emplace(owner->state, owner);
  luaL_openlibs(owner->state);
  Rml::Lua::LuaPlugin::RegisterTypesForBinding(owner->state);
  lua_settop(owner->state, 0);

  auto handle = LuaHostHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(Execute) {
  auto host = LuaHostOf(info[0]);
  if (!host) {
    return;
  }
  if (!info[1]->IsString() || !info[2]->IsString() || !info[3]->IsInt32() ||
      Nan::To<int>(info[3]).FromJust() < 1) {
    return Nan::ThrowTypeError("Expected Lua source, path and positive line");
  }
  Nan::Utf8String text(info[1]);
  Nan::Utf8String source(info[2]);
  const Rml::String path(*source, source.length());
  if (path.find('\0') != Rml::String::npos) {
    return Nan::ThrowTypeError("Lua source path cannot contain a null byte");
  }
  host->Execute(Rml::String(*text, text.length()),
                path,
                Nan::To<int>(info[3]).FromJust());
}

template <bool set>
NAN_METHOD(Global) {
  auto host = LuaHostOf(info[0]);
  Rml::String name;
  if (!host || !ReadName(info[1], &name)) {
    return;
  }
  if constexpr (set) {
    if (name == "document" || name == "context" || name == "event" ||
        name == "element" || name == "rmlui") {
      return Nan::ThrowTypeError("Reserved Lua global");
    }
  }
  LuaStateScope selected(host->state);
  LuaStackScope stack(host->state);
  if constexpr (set) {
    if (PushValue(host->state, info[2])) {
      SetGlobal(host->state, name.c_str());
    }
  } else {
    GetGlobal(host->state, name.c_str());
    info.GetReturnValue().Set(ReadValue(host->state, -1));
  }
}

NAN_METHOD(Call) {
  auto host = LuaHostOf(info[0]);
  Rml::String name;
  if (!host || !ReadName(info[1], &name)) {
    return;
  }
  if (!info[2]->IsArray()) {
    return Nan::ThrowTypeError("Expected Lua call arguments");
  }
  const auto arguments = info[2].As<v8::Array>();
  const auto length = arguments->Length();
  if (length > static_cast<unsigned>(std::numeric_limits<int>::max() - 8)) {
    return Nan::ThrowRangeError("Too many Lua arguments");
  }
  // V8 getters may remove/restart the runtime. Finish all host reads before
  // borrowing the VM stack, then revalidate its exact generation.
  std::vector<v8::Local<v8::Value>> values;
  values.reserve(length);
  for (unsigned i = 0; i < length; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(arguments, i).ToLocal(&value)) {
      return;
    }
    values.push_back(value);
  }
  if (!host->state || host->generation != State().generation) {
    return Nan::ThrowError("Lua script host is no longer valid");
  }
  LuaStateScope selected(host->state);
  LuaStackScope stack(host->state);
  GetGlobal(host->state, name.c_str());
  if (!lua_isfunction(host->state, -1)) {
    return Nan::ThrowTypeError("Expected a named Lua function");
  }
  if (!lua_checkstack(host->state, static_cast<int>(length) + 8)) {
    return Nan::ThrowRangeError("Too many Lua arguments");
  }
  for (auto value : values) {
    if (!PushValue(host->state, value)) {
      return;
    }
  }
  if (ProtectedLuaCall(host->state, length, 1)) {
    info.GetReturnValue().Set(ReadValue(host->state, -1));
  }
}

}  // namespace

bool PushLuaScalar(lua_State* state, v8::Local<v8::Value> value) {
  return PushValue(state, value);
}

v8::Local<v8::Value> ReadLuaScalar(lua_State* state, int index) {
  return ReadValue(state, index);
}

bool ReadLuaName(v8::Local<v8::Value> value, Rml::String* result) {
  return ReadName(value, result);
}

LuaDocumentScope::LuaDocumentScope(lua_State* state,
                                   Rml::ElementDocument* document,
                                   Rml::Event* event)
    : state_(state), depth_(State().active_elements.size()) {
  // Registry references root previous receiver userdata across nested Lua GC.
  for (size_t i = 0; i < names_.size(); ++i) {
    GetGlobal(state, names_[i]);
    previous_[i] = luaL_ref(state, LUA_REGISTRYINDEX);
  }
  Rml::Lua::LuaType<Rml::ElementDocument>::push(state, document);
  SetGlobal(state, "document");
  Rml::Lua::LuaType<Rml::Context>::push(
      state, document ? document->GetContext() : nullptr);
  SetGlobal(state, "context");
  Rml::Lua::LuaType<Rml::Event>::push(state, event);
  SetGlobal(state, "event");
  Rml::Lua::LuaType<Rml::Element>::push(
      state, event ? event->GetCurrentElement() : nullptr);
  SetGlobal(state, "element");
  if (document) {
    State().active_elements.push_back(document);
  }
}

LuaDocumentScope::~LuaDocumentScope() {
  for (size_t i = 0; i < names_.size(); ++i) {
    lua_rawgeti(state_, LUA_REGISTRYINDEX, previous_[i]);
    SetGlobal(state_, names_[i]);
    luaL_unref(state_, LUA_REGISTRYINDEX, previous_[i]);
  }
  State().active_elements.resize(depth_);
}

LuaHost::~LuaHost() {
  if (state) {
    Hosts().erase(state);
    // A SharedHandle finalizer may run during V8 GC. Lua GC can destroy DOM
    // objects and deliver native Plugin notifications; defer it to a boundary.
    RetiredStates().push_back(state);
  }
}

LuaStateScope::LuaStateScope(lua_State* state) : previous_(selected_state) {
  selected_state = state;
}
LuaStateScope::~LuaStateScope() {
  selected_state = previous_;
}
lua_State* CurrentLuaState() {
  return selected_state;
}

bool LuaStateIsClosing() {
  return closing_state;
}

std::shared_ptr<LuaHost> FindLuaHost(lua_State* state) {
  // Coroutines have independent stacks but share the main VM's registry.
  // Resolve ownership without retaining or scanning every coroutine instance.
  lua_rawgeti(state, LUA_REGISTRYINDEX, LUA_RIDX_MAINTHREAD);
  auto* main = lua_tothread(state, -1);
  lua_pop(state, 1);
  const auto found = Hosts().find(main);
  return found == Hosts().end() ? nullptr : found->second.lock();
}

std::shared_ptr<LuaHost> LuaHostOf(v8::Local<v8::Value> value) {
  auto* handle = LuaHostHandle::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a Lua script host");
    return {};
  }
  auto owner = handle->owner();
  if (!owner->state || owner->generation != State().generation) {
    Nan::ThrowError("Lua script host is no longer valid");
    return {};
  }
  return owner;
}

void CaptureLuaError(lua_State* state) {
  const auto* message = lua_tostring(state, -1);
  CaptureCallbackException(Nan::Error(message ? message : "Lua script error"));
}

bool ProtectedLuaCall(lua_State* state, int arguments, int results) {
  const int function = lua_gettop(state) - arguments;
  lua_pushcfunction(state, Traceback);
  lua_insert(state, function);
  const auto status = lua_pcall(state, arguments, results, function);
  if (status != LUA_OK) {
    CaptureLuaError(state);
    lua_pop(state, 1);
  }
  lua_remove(state, function);
  return status == LUA_OK;
}

bool LuaHost::Execute(const Rml::String& content,
                      const Rml::String& source,
                      int line,
                      Rml::ElementDocument* document) {
  LuaStateScope selected(state);
  LuaStackScope stack(state);
  LuaDocumentScope globals(state, document);
  return Compile(content, source, line) && ProtectedLuaCall(state, 0, 0);
}

bool LuaHost::Compile(const Rml::String& content,
                      const Rml::String& source,
                      int line) {
  Rml::String code(static_cast<size_t>(line - 1), '\n');
  code += content;
  const auto path = source.empty() ? "=[Lua script]" : "@" + source;
  if (luaL_loadbufferx(state, code.data(), code.size(), path.c_str(), "t") !=
      LUA_OK) {
    CaptureLuaError(state);
    return false;
  }
  return true;
}

Rml::EventListener* LuaHost::CreateListener(const Rml::String& code,
                                            Rml::ElementDocument* document) {
  LuaStateScope selected(state);
  LuaStackScope stack(state);
  LuaDocumentScope globals(state, document);
  if (Identifier(code)) {
    GetGlobal(state, code.c_str());
    if (lua_isfunction(state, -1)) {
      return RetainFunction(state, FindLuaHost(state), document);
    }
    lua_pop(state, 1);
  }
  if (!allow_inline) {
    CaptureCallbackException(Nan::Error("Unknown named Lua script handler"));
    return nullptr;
  }
  const auto function =
      "return function(event, element, document)\n" + code + "\nend";
  const auto source = document && !document->GetSourceURL().empty()
                          ? "@" + document->GetSourceURL()
                          : "=[Lua handler]";
  if (luaL_loadbufferx(
          state, function.data(), function.size(), source.c_str(), "t") !=
      LUA_OK) {
    CaptureLuaError(state);
    return nullptr;
  }
  if (!ProtectedLuaCall(state, 0, 1)) {
    return nullptr;
  }
  return RetainFunction(state, FindLuaHost(state), document);
}

Rml::EventListener* CreateLuaListener(lua_State* state,
                                      int index,
                                      Rml::Element* element) {
  auto host = FindLuaHost(state);
  if (!host) {
    luaL_error(state, "Expected a managed Lua state");
    return nullptr;
  }
  auto* document = element ? element->GetOwnerDocument() : nullptr;
  if (lua_isfunction(state, index)) {
    lua_pushvalue(state, index);
    return RetainFunction(state, host, document);
  }
  size_t length = 0;
  const auto* code = luaL_checklstring(state, index, &length);
  return host->CreateListener(Rml::String(code, length), document);
}

void ReleaseLuaHosts() {
  DrainLuaStates();
  ReleaseLuaVariantCallbackOwnership();
  ClearLuaFunctionVariantOwners();

  // Retain before closing: Lua GC may release native listeners or instancers.
  std::vector<std::shared_ptr<LuaHost>> owners;
  for (const auto& [state, weak] : Hosts()) {
    if (auto owner = weak.lock()) {
      owners.push_back(owner);
    }
  }
  Hosts().clear();
  for (const auto& owner : owners) {
    if (!owner->handle.IsEmpty()) {
      ClearLuaVariantOwner(owner->handle.Get(v8::Isolate::GetCurrent()));
    }

    auto* state = owner->state;
    owner->state = nullptr;
    CloseScope closing(state);
    lua_close(state);
  }
}

void DrainLuaStates() {
  while (!RetiredStates().empty()) {
    auto retired = std::move(RetiredStates());
    RetiredStates().clear();
    for (auto* state : retired) {
      CloseScope closing(state);
      lua_close(state);
    }
  }
}

NAN_MODULE_INIT(InitializeRmlLuaHosts) {
  SetRuntimeMethod<CreateHost>(target, "createLuaScriptHost");
  SetRuntimeMethod<Execute>(target, "executeLuaScript");
  SetRuntimeMethod<Global<false>>(target, "getLuaGlobal");
  SetRuntimeMethod<Global<true>>(target, "setLuaGlobal");
  SetRuntimeMethod<Call>(target, "callLuaFunction");
}

}  // namespace sfmlrmlui
