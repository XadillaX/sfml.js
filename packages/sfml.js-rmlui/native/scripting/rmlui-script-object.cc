// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/scripting/rmlui-script-object.h"

#include <memory>
#include <unordered_map>

#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-callback-leases.h"
#include "native/runtime/rmlui-context-instancers.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

struct ScriptObjectRecord;

auto& Records() {
  static std::unordered_map<Rml::ScriptInterface*,
                            std::weak_ptr<ScriptObjectRecord>>
      records;
  return records;
}

// The native ScriptInterface owns this record or its element lease. Detached
// private owner edges keep the weak V8 value alive, including closure cycles.
struct ScriptObjectRecord {
  ~ScriptObjectRecord() {
    const auto found = Records().find(script);
    if (found != Records().end()) {
      const auto current = found->second.lock();
      if (!current || current.get() == this) {
        Records().erase(found);
      }
    }
  }

  Rml::ScriptInterface* script{nullptr};
  Rml::ScriptObject pointer{nullptr};
  bool native_adapter{false};
  v8::Global<v8::Object> object;
  uint64_t generation{0};
  size_t native_roots{0};
};

using ScriptObjectOwners = CallbackLeaseOwners<ScriptObjectRecord,
                                               v8::Object,
                                               &ScriptObjectRecord::object>;

ScriptObjectOwners& Owners() {
  static ScriptObjectOwners owners("rml.detached.script.objects");
  return owners;
}

constexpr const char* kEventObjectKey = "rml.event.script.object";

std::shared_ptr<ScriptObjectRecord> RecordOf(Rml::ScriptInterface* script,
                                             Rml::ScriptObject value) {
  if (!value) {
    return {};
  }

  const auto found = Records().find(script);
  if (value != script->GetScriptObjectForBinding() ||
      found == Records().end()) {
    Nan::ThrowTypeError(
        "Native script object requires its registered script adapter");
    return {};
  }

  const auto record = found->second.lock();
  if (!record || record->pointer != value ||
      record->generation != State().generation || record->object.IsEmpty()) {
    Nan::ThrowError("Native script object is no longer valid");
    return {};
  }

  return record;
}

bool CanSetObject(Rml::ScriptInterface* script, v8::Local<v8::Value> value) {
  if (!value->IsNull() && !value->IsObject()) {
    Nan::ThrowTypeError("Expected a script object or null");
    return false;
  }

  const auto found = Records().find(script);
  const auto record = found == Records().end() ? nullptr : found->second.lock();
  if ((record && record->native_adapter) ||
      script->GetScriptObject() != script->GetScriptObjectForBinding()) {
    Nan::ThrowTypeError(
        "Native script object requires its registered script adapter");
    return false;
  }

  return true;
}

std::shared_ptr<ScriptObjectRecord> MakeRecord(Rml::ScriptInterface* script,
                                               v8::Local<v8::Value> value) {
  auto record = std::make_shared<ScriptObjectRecord>();
  record->script = script;
  record->pointer = record.get();
  record->generation = State().generation;
  record->object.Reset(v8::Isolate::GetCurrent(), value.As<v8::Object>());
  Records().insert_or_assign(script, record);
  return record;
}

NAN_METHOD(SetElementScriptObject) {
  auto* element = ElementOf(info[0]);
  if (!element || !CanSetObject(element, info[1])) {
    return;
  }

  if (info[1]->IsNull()) {
    element->SetScriptObjectForBinding(nullptr, {});
    return;
  }

  auto record = MakeRecord(element, info[1]);
  auto lease = Owners().Add(record, element);
  element->SetScriptObjectForBinding(record.get(), std::move(lease));
}

NAN_METHOD(SetEventScriptObject) {
  auto* event = EventOf(info[0]);
  if (!event || !CanSetObject(event, info[1])) {
    return;
  }

  if (info[1]->IsNull()) {
    event->SetScriptObjectForBinding(nullptr, {});
    ClearEventScriptObjectEdge(info[0].As<v8::Object>());
    return;
  }

  auto record = MakeRecord(event, info[1]);
  event->SetScriptObjectForBinding(record.get(), record);
  // A dispatch event is native-owned until destruction, independently of its
  // successive expiring listener handles. Only owned EventPtr facades go weak.
  if (EventHandle::From(info[0])->owner()->owned) {
    BindOwnedEventScriptObject(event, info[0].As<v8::Object>());
  }
}

NAN_METHOD(SetContextScriptObject) {
  auto* context = ContextOf(info[0]);
  if (!context || !CanSetObject(context, info[1])) {
    return;
  }

  if (info[1]->IsNull()) {
    context->SetScriptObjectForBinding(nullptr, {});
    Nan::SetPrivate(info[0].As<v8::Object>(),
                    Nan::New("rml.context.script.root").ToLocalChecked(),
                    Nan::Undefined())
        .FromJust();
    return;
  }

  auto record = MakeRecord(context, info[1]);
  auto lease = Owners().Add(record, context->GetRootElement());
  context->SetScriptObjectForBinding(record.get(), std::move(lease));
  BindOwnedContextScriptObject(context, info[0].As<v8::Object>());
}

NAN_METHOD(ReleaseScriptContext) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }

  if (!IsOwnedContext(context)) {
    return Nan::ThrowTypeError(
        "Expected an independently owned context; remove registered contexts");
  }

  ReleaseOwnedContext(context);
}

}  // namespace

bool RegisterNativeScriptObject(Rml::ScriptInterface* script,
                                Rml::ScriptObject pointer,
                                v8::Local<v8::Object> object,
                                Rml::Element* ownership_root) {
  if (!script || !pointer || !State().initialized || State().cleaning_up ||
      script->GetScriptObject() != pointer) {
    Nan::ThrowTypeError(
        "Native script adapter must match its authoritative object");
    return false;
  }

  auto record = MakeRecord(script, object);
  record->pointer = pointer;
  record->native_adapter = true;
  if (!ownership_root) {
    ownership_root = rmlui_dynamic_cast<Rml::Element*>(script);
  }

  // The base class owns the lease even when a subclass overrides its getter.
  // Destruction releases it exactly once; no registry key dereferences a
  // deleted interface. Existing owner queues handle attached/detached changes.
  auto lease = Owners().Add(record, ownership_root, !ownership_root);
  script->SetScriptObjectForBinding(pointer, std::move(lease));
  return true;
}

v8::MaybeLocal<v8::Value> ReadScriptObject(Rml::ScriptInterface* script) {
  const auto pointer = script->GetScriptObject();
  if (!pointer) {
    return Nan::Null();
  }

  if (const auto record = RecordOf(script, pointer)) {
    return record->object.Get(v8::Isolate::GetCurrent());
  }

  return {};
}

void RefreshScriptObjectOwnership() {
  Owners().Refresh(DiagnosticOwnership::kScriptObject);
}

void BindOwnedContextScriptObject(Rml::Context* context,
                                  v8::Local<v8::Object> handle) {
  if (context->GetScriptObjectForBinding() && IsOwnedContext(context)) {
    Nan::SetPrivate(handle,
                    Nan::New("rml.context.script.root").ToLocalChecked(),
                    WrapElement(context->GetRootElement()))
        .FromJust();
  }
}

void BindOwnedEventScriptObject(Rml::Event* event,
                                v8::Local<v8::Object> handle) {
  const auto pointer = event->GetScriptObject();
  if (!pointer) {
    return;
  }

  if (const auto record = RecordOf(event, pointer)) {
    Nan::SetPrivate(handle,
                    Nan::New(kEventObjectKey).ToLocalChecked(),
                    record->object.Get(v8::Isolate::GetCurrent()))
        .FromJust();
    if (!record->object.IsWeak()) {
      record->object.SetWeak();
    }
  }
}

void PromoteEventScriptObject(Rml::Event* event) {
  const auto record = RecordOf(event, event->GetScriptObject());
  if (record && record->object.IsWeak()) {
    record->object.ClearWeak();
  }
}

void ClearEventScriptObjectEdge(v8::Local<v8::Object> handle) {
  Nan::SetPrivate(
      handle, Nan::New(kEventObjectKey).ToLocalChecked(), Nan::Undefined())
      .FromJust();
}

void ReleaseScriptObjects() {
  Owners().Clear();

  for (const auto& [pointer, weak] : Records()) {
    if (auto record = weak.lock()) {
      record->object.Reset();
      record->generation = 0;
    }
  }

  Records().clear();
}

NAN_MODULE_INIT(InitializeRmlScriptObjects) {
  SetInstancerValueMethod<SetElementScriptObject>(target,
                                                  "setElementScriptObject");
  SetInstancerValueMethod<SetEventScriptObject>(target, "setEventScriptObject");
  SetInstancerValueMethod<SetContextScriptObject>(target,
                                                  "setContextScriptObject");
  SetRuntimeMethod<ReleaseScriptContext>(target, "releaseScriptContext");
}

}  // namespace sfmlrmlui
