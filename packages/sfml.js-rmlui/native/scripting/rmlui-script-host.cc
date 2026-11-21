// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/scripting/rmlui-script-host.h"

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/ElementInstancer.h>
#include <RmlUi/Core/EventListener.h>
#include <RmlUi/Core/Factory.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/events/rmlui-events.h"
#include "native/events/rmlui-listener-instancers.h"
#include "native/runtime/rmlui-context-instancers.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-host.h"
#include "native/scripting/lua/rmlui-lua-variant.h"
#include "vendor/rmlui/Source/Core/PluginRegistry.h"
#include "vendor/rmlui/Source/Core/StreamFile.h"

namespace sfmlrmlui {
namespace {

struct ScriptHost {
  v8::Global<v8::Array> callbacks;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
  size_t roots{0};
  bool allow_inline{false};
  bool allow_external{false};
  std::shared_ptr<LuaHost> lua;

  void Retain() {
    if (roots++ == 0 && callbacks.IsWeak()) {
      callbacks.ClearWeak();
    }
  }
  void Release() {
    if (--roots == 0 && !callbacks.IsEmpty()) {
      callbacks.SetWeak();
    }
  }
};

using ScriptHostHandle = sfmljs::SharedHandle<ScriptHost>;

auto& Hosts() {
  static std::vector<std::weak_ptr<ScriptHost>> hosts;
  return hosts;
}
auto& Selections() {
  static std::unordered_map<Rml::Context*, std::shared_ptr<ScriptHost>> hosts;
  return hosts;
}

class ScriptDocument;
auto& Documents() {
  static std::unordered_map<Rml::ElementDocument*, ScriptDocument*> values;
  return values;
}

v8::Local<v8::String> HostKey() {
  return Nan::New("rml.script.host.callbacks").ToLocalChecked();
}

class ScriptScope final {
 public:
  explicit ScriptScope(Rml::ElementDocument* document)
      : depth_(State().active_elements.size()) {
    State().active_elements.push_back(document);
    ++State().callback_depth;
  }
  ~ScriptScope() {
    --State().callback_depth;
    State().active_elements.resize(depth_);
  }

 private:
  size_t depth_;
};

class ScriptDocument final : public Rml::ElementDocument {
 public:
  ScriptDocument(const Rml::String& tag, std::shared_ptr<ScriptHost> host)
      : Rml::ElementDocument(tag), host_(std::move(host)) {
    host_->Retain();
    Documents().emplace(this, this);
  }
  ~ScriptDocument() override {
    Documents().erase(this);
    session_.Reset();
    document_handle_.Reset();
    host_->Release();
  }

  bool HasScriptErrorForBinding() const override { return failed_; }

  const std::shared_ptr<LuaHost>& GetLuaHostForBinding() const {
    return host_->lua;
  }

  void LoadInlineScript(const Rml::String& content,
                        const Rml::String& source,
                        int line) override {
    Execute(content, source, line, false);
  }

  void LoadExternalScript(const Rml::String& source) override {
    if (!host_->allow_external) {
      Fail("External scripts disabled");
      return;
    }
    // Read through the active RmlUi FileInterface, including custom roots.
    // StreamFile owns the handle on empty input and every error path.
    Rml::StreamFile stream;
    if (!stream.Open(source)) {
      Fail("Failed to open external script: " + source);
      return;
    }
    const size_t length = stream.Length();
    if (length > static_cast<size_t>(v8::String::kMaxLength)) {
      Fail("External script exceeds the host string limit");
      return;
    }
    Rml::String content(length, '\0');
    if (stream.Read(content.data(), length) != length ||
        stream.HasReadError()) {
      Fail("Failed to read external script: " + source);
      return;
    }
    Execute(content, source, 1, true);
  }

  Rml::EventListener* CreateListener(const Rml::String& name) {
    if (!CanInvokeCallback()) {
      return nullptr;
    }
    if (host_->lua) {
      auto* result = host_->lua->CreateListener(name, this);
      failed_ = failed_ || !State().callback_exception.IsEmpty();
      return result;
    }
    if (host_->callbacks.IsEmpty()) {
      return nullptr;
    }
    Nan::HandleScope handles;
    auto callbacks = host_->callbacks.Get(v8::Isolate::GetCurrent());
    auto callback = Nan::Get(callbacks, 1).ToLocalChecked();
    if (!callback->IsFunction()) {
      return nullptr;
    }
    // Resolve and compile once during instancing. Steady event dispatch uses
    // the existing typed listener and performs one host callback.
    ScriptScope script(this);
    Nan::TryCatch caught;
    v8::Local<v8::Value> argv[] = {DocumentHandle(),
                                   Nan::New(name).ToLocalChecked()};
    v8::Local<v8::Value> result;
    Rml::EventListener* listener = nullptr;
    if (Nan::Call(callback.As<v8::Function>(),
                  Nan::GetCurrentContext()->Global(),
                  2,
                  argv)
            .ToLocal(&result) &&
        result->IsObject()) {
      auto record = result.As<v8::Object>();
      v8::Local<v8::Value> callback_value;
      v8::Local<v8::Value> session;
      if (Nan::Get(record, Nan::New("callback").ToLocalChecked())
              .ToLocal(&callback_value) &&
          Nan::Get(record, Nan::New("session").ToLocalChecked())
              .ToLocal(&session) &&
          callback_value->IsFunction() && session->IsObject()) {
        session_.Reset(v8::Isolate::GetCurrent(), session.As<v8::Object>());
        listener =
            CreateCapturedEventListener(callback_value.As<v8::Function>());
      }
    }
    if (caught.HasCaught()) {
      failed_ = true;
      CaptureCallbackException(caught.Exception());
    }
    return listener;
  }

 private:
  v8::Local<v8::Object> DocumentHandle() {
    if (document_handle_.IsEmpty()) {
      document_handle_.Reset(v8::Isolate::GetCurrent(), WrapDocument(this));
    }
    return document_handle_.Get(v8::Isolate::GetCurrent());
  }

  void Fail(const Rml::String& message) {
    failed_ = true;
    CaptureCallbackException(Nan::Error(Nan::New(message).ToLocalChecked()));
  }

  void Execute(const Rml::String& content,
               const Rml::String& source,
               int line,
               bool external) {
    if (failed_ || !CanInvokeCallback()) {
      return;
    }
    if (!external && !host_->allow_inline) {
      Fail("Inline scripts disabled");
      return;
    }
    if (host_->lua) {
      ScriptScope references(this);
      failed_ = !host_->lua->Execute(content, source, line, this);
      return;
    }
    if (host_->callbacks.IsEmpty()) {
      return;
    }
    Nan::HandleScope handles;
    auto callbacks = host_->callbacks.Get(v8::Isolate::GetCurrent());
    auto callback = Nan::Get(callbacks, 0).ToLocalChecked();
    ScriptScope references(this);
    Nan::TryCatch caught;
    v8::Local<v8::Value> argv[] = {DocumentHandle(),
                                   WrapContext(GetContext()),
                                   Nan::New(content).ToLocalChecked(),
                                   Nan::New(source).ToLocalChecked(),
                                   Nan::New(line),
                                   Nan::New(external)};
    RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
    v8::Local<v8::Value> result;
    if (Nan::Call(callback.As<v8::Function>(),
                  Nan::GetCurrentContext()->Global(),
                  6,
                  argv)
            .ToLocal(&result) &&
        result->IsObject()) {
      session_.Reset(v8::Isolate::GetCurrent(), result.As<v8::Object>());
    }
    if (caught.HasCaught()) {
      failed_ = true;
      CaptureCallbackException(caught.Exception());
    }
  }

  std::shared_ptr<ScriptHost> host_;
  // Native owns the VM session. Retaining an expired Document facade cannot
  // keep its script globals alive after this native document is destroyed.
  v8::Global<v8::Object> session_;
  v8::Global<v8::Object> document_handle_;
  bool failed_{false};
};

class ScriptDocumentInstancer final : public Rml::ElementInstancer {
 public:
  Rml::ElementPtr InstanceElement(Rml::Element*,
                                  const Rml::String&,
                                  const Rml::XMLAttributes&) override {
    return nullptr;
  }
  void ReleaseElement(Rml::Element* element) override { delete element; }
};

ScriptDocumentInstancer& DocumentInstancer() {
  static ScriptDocumentInstancer instancer;
  return instancer;
}

bool RouteDocument(Rml::Context* context,
                   const Rml::String& tag,
                   Rml::ElementPtr& result) {  // NOLINT(runtime/references)
  const auto found = Selections().find(context);
  if (found == Selections().end()) {
    return false;
  }
  auto* document = new ScriptDocument(tag, found->second);
  document->SetInstancer(&DocumentInstancer());
  result.reset(document);
  Rml::PluginRegistry::NotifyElementCreate(document);
  return true;
}

bool RouteListener(const Rml::String& name,
                   Rml::Element* element,
                   Rml::EventListener*& result) {  // NOLINT(runtime/references)
  auto* document = element->GetOwnerDocument();
  if (!document) {
    // Factory applies initial attributes before appending the element. Borrow
    // only the parent paired with this exact element in the scoped operation.
    auto* scope = Rml::Factory::AttributeScopeForBinding::Slot();
    if (scope && scope->element == element && scope->parent) {
      document = scope->parent->GetOwnerDocument();
    }
  }
  const auto found = Documents().find(document);
  if (found == Documents().end()) {
    return false;
  }
  result = found->second->CreateListener(name);
  return true;
}

NAN_METHOD(CreateScriptHost) {
  if (!info[0]->IsFunction() || !info[1]->IsFunction() ||
      !info[2]->IsBoolean() || !info[3]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected captured script host callbacks");
  }
  auto owner = std::make_shared<ScriptHost>();
  owner->generation = State().generation;
  owner->allow_inline = info[2]->IsTrue();
  owner->allow_external = info[3]->IsTrue();
  auto functions = Nan::New<v8::Array>(2);
  Nan::Set(functions, 0, info[0]).FromJust();
  Nan::Set(functions, 1, info[1]).FromJust();
  owner->callbacks.Reset(v8::Isolate::GetCurrent(), functions);
  owner->callbacks.SetWeak();
  auto handle = ScriptHostHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  Nan::SetPrivate(handle, HostKey(), functions).FromJust();
  Hosts().push_back(owner);
  Rml::Factory::DocumentRouterSlotForBinding() = RouteDocument;
  Rml::Factory::ListenerRouterSlotForBinding() = RouteListener;
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(SetScriptHost) {
  std::shared_ptr<ScriptHost> owner;
  if (!info[1]->IsNull()) {
    auto* handle = ScriptHostHandle::TryFrom(info[1]);
    if (handle) {
      owner = handle->owner();
      if (owner->generation != State().generation ||
          owner->callbacks.IsEmpty()) {
        return Nan::ThrowError("Document script host is no longer valid");
      }
    } else {
      auto lua = LuaHostOf(info[1]);
      if (!lua) {
        return;
      }
      owner = std::make_shared<ScriptHost>();
      owner->generation = State().generation;
      owner->allow_inline = lua->allow_inline;
      owner->allow_external = lua->allow_external;
      owner->lua = std::move(lua);
    }
  }
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  if (owner) {
    owner->Retain();
  }
  ReleaseContextScriptHost(context);
  if (owner) {
    Selections().emplace(context, std::move(owner));
  }
  Rml::Factory::DocumentRouterSlotForBinding() = RouteDocument;
  Rml::Factory::ListenerRouterSlotForBinding() = RouteListener;
}

NAN_METHOD(LoadInlineScript) {
  if (!info[1]->IsString() || !info[2]->IsString() || !info[3]->IsInt32() ||
      Nan::To<int>(info[3]).FromJust() < 1) {
    return Nan::ThrowTypeError(
        "Expected script source, path and positive line");
  }
  auto* document = DocumentOf(info[0]);
  if (!document) {
    return;
  }
  Nan::Utf8String content(info[1]);
  Nan::Utf8String path(info[2]);
  const Rml::String source(*path, path.length());
  if (source.find('\0') != Rml::String::npos) {
    return Nan::ThrowTypeError("Script source path cannot contain a null byte");
  }
  document->LoadInlineScript(Rml::String(*content, content.length()),
                             source,
                             Nan::To<int>(info[3]).FromJust());
}

NAN_METHOD(LoadExternalScript) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an external script path");
  }
  auto* document = DocumentOf(info[0]);
  if (!document) {
    return;
  }
  Nan::Utf8String path(info[1]);
  const Rml::String source(*path, path.length());
  if (source.find('\0') != Rml::String::npos) {
    return Nan::ThrowTypeError("Script source path cannot contain a null byte");
  }
  document->LoadExternalScript(source);
}

}  // namespace

void AppendScriptLuaVariantOwners(LuaVariantOwnerCollector* collector) {
  const auto append = [&](Rml::Context* context,
                          Rml::ElementDocument* document,
                          const std::shared_ptr<LuaHost>& host) {
    if (!host) {
      return;
    }

    v8::Local<v8::Object> handle;
    if (document) {
      const auto owner = ShareElement(document);
      if (owner->owned) {
        if (owner->handle.IsEmpty()) {
          return;
        }
        handle = owner->handle.Get(v8::Isolate::GetCurrent());
      }
    }

    if (handle.IsEmpty() && context && IsOwnedContext(context)) {
      const auto found = State().contexts.find(context);
      if (found == State().contexts.end() || found->second->handle.IsEmpty()) {
        return;
      }
      handle = found->second->handle.Get(v8::Isolate::GetCurrent());
    }

    AppendLuaVariantOwner(host, handle, collector);
  };

  for (const auto& [context, host] : Selections()) {
    append(context, nullptr, host->lua);
  }
  for (const auto& [document, script] : Documents()) {
    append(document->GetContext(), document, script->GetLuaHostForBinding());
  }
}

void ReleaseContextScriptHost(Rml::Context* context) {
  const auto found = Selections().find(context);
  if (found != Selections().end()) {
    found->second->Release();
    Selections().erase(found);
    Rml::InvalidateCallbackResourcesForBinding();
  }
}

void SelectContextLuaHost(Rml::Context* context,
                          const std::shared_ptr<LuaHost>& host) {
  if (!host || !host->state || host->generation != State().generation) {
    return;
  }
  auto owner = std::make_shared<ScriptHost>();
  owner->generation = host->generation;
  owner->allow_inline = host->allow_inline;
  owner->allow_external = host->allow_external;
  owner->lua = host;
  owner->Retain();
  ReleaseContextScriptHost(context);
  Selections().emplace(context, std::move(owner));
  Rml::Factory::DocumentRouterSlotForBinding() = RouteDocument;
  Rml::Factory::ListenerRouterSlotForBinding() = RouteListener;
}

void ReleaseScriptHosts() {
  for (const auto& [context, host] : Selections()) {
    host->Release();
  }
  Selections().clear();
  for (const auto& weak : Hosts()) {
    if (auto owner = weak.lock()) {
      owner->callbacks.Reset();
      if (!owner->handle.IsEmpty()) {
        Nan::SetPrivate(owner->handle.Get(v8::Isolate::GetCurrent()),
                        HostKey(),
                        Nan::Undefined())
            .FromJust();
        owner->handle.Reset();
      }
    }
  }
  Hosts().clear();
  Rml::Factory::DocumentRouterSlotForBinding() = nullptr;
  Rml::Factory::ListenerRouterSlotForBinding() = nullptr;
}

NAN_MODULE_INIT(InitializeRmlScriptHosts) {
  SetRuntimeMethod<CreateScriptHost>(target, "createDocumentScriptHost");
  SetRuntimeMethod<SetScriptHost>(target, "setDocumentScriptHost");
  SetRuntimeMethod<LoadInlineScript>(target, "loadDocumentInlineScript");
  SetRuntimeMethod<LoadExternalScript>(target, "loadDocumentExternalScript");
}

}  // namespace sfmlrmlui
