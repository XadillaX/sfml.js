// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/events/rmlui-listener-instancers.h"

#include <RmlUi/Core/EventListener.h>
#include <RmlUi/Core/EventListenerInstancer.h>
#include <RmlUi/Core/Factory.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-callback-owners.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-variant.h"

namespace sfmlrmlui {
namespace {

struct Attachment {
  Rml::ObserverPtr<Rml::Element> element;
  Rml::String id;
  Rml::String tag;
  CallbackRootSlot root_slot;
  bool attached{true};
  bool native_owned{false};
};

struct ListenerState {
  ~ListenerState();
  std::unique_ptr<Rml::EventListener> value;
  v8::Global<v8::Array> functions;
  v8::Global<v8::Object> handle;
  std::function<void(Rml::Event*)> native_callback;
  std::shared_ptr<LuaHost> lua_host;
  std::unordered_map<Rml::Element*, std::vector<std::shared_ptr<Attachment>>>
      attachments;
  std::vector<std::shared_ptr<Attachment>> changes;
  size_t native_attachments{0};
  unsigned pending_notifications{0};
  bool queued{false};
  uint64_t generation{0};
  unsigned active{0};
};

struct InstancerState {
  std::unique_ptr<Rml::EventListenerInstancer> value;
  v8::Global<v8::Function> callback;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
  bool active{false};
};

struct Notification {
  std::shared_ptr<ListenerState> owner;
  Rml::String id;
  Rml::String tag;
  unsigned index;
};

using ListenerHandle = sfmljs::SharedHandle<ListenerState>;
using InstancerHandle = sfmljs::SharedHandle<InstancerState>;

auto& Listeners() {
  static std::unordered_map<Rml::EventListener*, std::weak_ptr<ListenerState>>
      values;
  return values;
}
auto& Instancers() {
  static std::vector<std::weak_ptr<InstancerState>> values;
  return values;
}
auto& AttachedListeners() {
  static std::unordered_map<Rml::EventListener*, std::shared_ptr<ListenerState>>
      values;
  return values;
}
auto& ChangedListeners() {
  static std::vector<std::shared_ptr<ListenerState>> values;
  return values;
}
auto& Notifications() {
  static std::vector<Notification> values;
  return values;
}
auto& Registration() {
  static std::shared_ptr<InstancerState> value;
  return value;
}

CallbackRootSlots& CallbackRoots() {
  static CallbackRootSlots roots("rml.detached.typed.listeners");
  return roots;
}

ListenerState::~ListenerState() {
  if (value) {
    Listeners().erase(value.get());
  }
}

void MarkChanged(const std::shared_ptr<ListenerState>& owner) {
  if (!owner->queued) {
    owner->queued = true;
    ChangedListeners().push_back(owner);
  }

  if (owner->lua_host) {
    Rml::InvalidateCallbackResourcesForBinding();
  }
}

v8::Local<v8::String> CallbackKey() {
  return Nan::New("rml.listener.functions").ToLocalChecked();
}

std::shared_ptr<ListenerState> ListenerOf(v8::Local<v8::Value> input) {
  auto* handle = ListenerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an EventListener");
    return {};
  }
  auto owner = handle->owner();
  if (!owner->value || owner->generation != State().generation) {
    Nan::ThrowError("Event listener is no longer valid");
    return {};
  }
  return owner;
}

std::shared_ptr<InstancerState> InstancerOf(v8::Local<v8::Value> input) {
  auto* handle = InstancerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an EventListenerInstancer");
    return {};
  }
  auto owner = handle->owner();
  if (!owner->value || owner->generation != State().generation) {
    Nan::ThrowError("Event listener instancer is no longer valid");
    return {};
  }
  return owner;
}

v8::Local<v8::Object> WrapListener(
    const std::shared_ptr<ListenerState>& owner) {
  if (!owner->handle.IsEmpty()) {
    return owner->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = ListenerHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  if (!owner->functions.IsEmpty()) {
    Nan::SetPrivate(
        handle, CallbackKey(), owner->functions.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  return handle;
}

void QueueNotification(const std::shared_ptr<ListenerState>& owner,
                       const Attachment& attachment,
                       unsigned index) {
  // Destructors only copy values. User code runs after the native frame and
  // never receives a pointer to a partially destroyed element.
  if (!State().cleaning_up && !owner->functions.IsEmpty()) {
    if (owner->functions.IsWeak()) {
      owner->functions.ClearWeak();
    }
    ++owner->pending_notifications;
    Notifications().push_back({owner, attachment.id, attachment.tag, index});
    MarkChanged(owner);
  }
}

class NativeListener final : public Rml::EventListener {
 public:
  std::weak_ptr<ListenerState> owner;

  void OnAttach(Rml::Element* element) override {
    if (auto state = owner.lock()) {
      auto attachment = std::make_shared<Attachment>();
      attachment->element = element->GetObserverPtr();
      attachment->id = element->GetId();
      attachment->tag = element->GetTagName();
      state->attachments[element].push_back(attachment);
      state->changes.push_back(attachment);
      AttachedListeners().insert_or_assign(this, state);
      QueueNotification(state, *attachment, 1);
      MarkChanged(state);
    }
  }

  void OnDetach(Rml::Element* element) override {
    if (auto state = owner.lock()) {
      const auto found = state->attachments.find(element);
      if (found != state->attachments.end()) {
        auto attachment = found->second.back();
        found->second.pop_back();
        if (found->second.empty()) {
          state->attachments.erase(found);
        }
        attachment->attached = false;
        state->changes.push_back(attachment);
        QueueNotification(state, *attachment, 2);
      }
      if (state->attachments.empty()) {
        AttachedListeners().erase(this);
      }
      MarkChanged(state);
    }
  }

  void ProcessEvent(Rml::Event& event) override {
    auto retained = owner.lock();
    if (!retained || retained->attachments.empty()) {
      return;
    }
    Invoke(retained, &event);
  }

  static void Invoke(const std::shared_ptr<ListenerState>& retained,
                     Rml::Event* event) {
    if (!CanInvokeCallback()) {
      return;
    }
    if (retained->native_callback) {
      ++retained->active;
      CallbackScope references(*event);
      retained->native_callback(event);
      --retained->active;
      return;
    }
    if (retained->functions.IsEmpty()) {
      return;
    }
    Nan::HandleScope scope;
    const auto functions = retained->functions.Get(v8::Isolate::GetCurrent());
    if (functions.IsEmpty()) {
      return;
    }
    const auto callback = Nan::Get(functions, 0).ToLocalChecked();
    if (!callback->IsFunction()) {
      return;
    }
    ++retained->active;
    CallbackScope references(*event);
    Nan::TryCatch caught;
    InvokeEventCallback(event, callback.As<v8::Function>());
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    --retained->active;
  }
};

class NativeInstancer final : public Rml::EventListenerInstancer {
 public:
  std::weak_ptr<InstancerState> owner;

  Rml::EventListener* InstanceEventListener(const Rml::String& value,
                                            Rml::Element* element) override {
    auto retained = owner.lock();
    if (!retained || !CanInvokeCallback()) {
      return nullptr;
    }
    if (retained->active) {
      Nan::ThrowError("Recursive event listener instancer");
      return nullptr;
    }
    Nan::HandleScope scope;
    const auto callback = retained->callback.Get(v8::Isolate::GetCurrent());
    if (callback.IsEmpty()) {
      return nullptr;
    }
    retained->active = true;
    ++State().callback_depth;
    ++State().instancer_callback_depth;
    Nan::TryCatch caught;
    v8::Local<v8::Value> argv[] = {Nan::New(value).ToLocalChecked(),
                                   WrapElement(element)};
    v8::Local<v8::Value> result;
    std::shared_ptr<ListenerState> candidate;
    RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
    if (Nan::Call(callback, Nan::GetCurrentContext()->Global(), 2, argv)
            .ToLocal(&result) &&
        !result->IsNull()) {
      candidate = ListenerOf(result);
      if (candidate) {
        // RmlUi returns a raw unowned pointer. Bridge the gap until OnAttach
        // or the explicit factory result establishes its ownership graph.
        if (candidate->functions.IsWeak()) {
          candidate->functions.ClearWeak();
        }
        MarkChanged(candidate);
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    --State().instancer_callback_depth;
    --State().callback_depth;
    retained->active = false;
    return candidate ? candidate->value.get() : nullptr;
  }
};

NAN_METHOD(CreateListener) {
  if (!info[0]->IsFunction() ||
      (!info[1]->IsUndefined() && !info[1]->IsFunction()) ||
      (!info[2]->IsUndefined() && !info[2]->IsFunction())) {
    return Nan::ThrowTypeError("Expected event listener callbacks");
  }
  auto owner = std::make_shared<ListenerState>();
  auto adapter = std::make_unique<NativeListener>();
  adapter->owner = owner;
  owner->value = std::move(adapter);
  owner->generation = State().generation;
  auto functions = Nan::New<v8::Array>(3);
  for (unsigned i = 0; i < 3; ++i) {
    Nan::Set(functions, i, info[i]).FromJust();
  }
  owner->functions.Reset(v8::Isolate::GetCurrent(), functions);
  Listeners().emplace(owner->value.get(), owner);
  MarkChanged(owner);
  info.GetReturnValue().Set(WrapListener(owner));
}

NAN_METHOD(CreateInstancer) {
  if (!info[0]->IsFunction()) {
    return Nan::ThrowTypeError("Expected event listener instancer callback");
  }
  auto owner = std::make_shared<InstancerState>();
  auto adapter = std::make_unique<NativeInstancer>();
  adapter->owner = owner;
  owner->value = std::move(adapter);
  owner->generation = State().generation;
  owner->callback.Reset(v8::Isolate::GetCurrent(), info[0].As<v8::Function>());
  owner->callback.SetWeak();
  auto handle = InstancerHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  Nan::SetPrivate(handle, CallbackKey(), info[0]).FromJust();
  Instancers().push_back(owner);
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(RegisterInstancer) {
  auto owner = info[0]->IsNull() ? nullptr : InstancerOf(info[0]);
  if (!info[0]->IsNull() && !owner) {
    return;
  }
  if (owner && owner->callback.IsWeak()) {
    owner->callback.ClearWeak();
  }
  Rml::Factory::RegisterEventListenerInstancer(owner ? owner->value.get()
                                                     : nullptr);
  const auto previous = Registration();
  Registration() = owner;
  if (previous && previous != owner && !previous->callback.IsEmpty() &&
      !previous->callback.IsWeak()) {
    previous->callback.SetWeak();
  }
}

template <bool factory>
NAN_METHOD(InstanceListener) {
  constexpr unsigned offset = factory ? 0 : 1;
  std::shared_ptr<InstancerState> instancer;
  if constexpr (!factory) {
    instancer = InstancerOf(info[0]);
    if (!instancer) {
      return;
    }
  }
  if (!info[offset]->IsString()) {
    return Nan::ThrowTypeError("Expected an inline listener value");
  }
  auto* element = ElementOf(info[offset + 1]);
  if (!element) {
    return;
  }
  Nan::Utf8String text(info[offset]);
  const Rml::String value(*text, text.length());
  auto* listener =
      factory ? Rml::Factory::InstanceEventListener(value, element)
              : instancer->value->InstanceEventListener(value, element);
  if (!listener) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  if (const auto found = Listeners().find(listener);
      found != Listeners().end()) {
    if (auto owner = found->second.lock()) {
      info.GetReturnValue().Set(WrapListener(owner));
      return;
    }
  }
  Nan::ThrowError("Factory returned an unsupported native listener");
}

NAN_METHOD(ProcessEvent) {
  auto listener = ListenerOf(info[0]);
  auto* event = EventOf(info[1]);
  if (!listener || !event) {
    return;
  }
  auto owner = EventHandle::From(info[1])->owner();
  if (listener->active || owner->processing_listener ||
      owner->processing_default_action) {
    return Nan::ThrowError("Event listener processing is already active");
  }
  std::vector<v8::Local<v8::Object>> roots;
  CallbackScope references(*event);
  if (owner->current_reference) {
    roots.push_back(WrapElement(owner->current_reference->get()));
  }
  for (const auto& reference : owner->references) {
    roots.push_back(WrapElement(reference.get()));
    State().event_elements.push_back(reference.get());
  }
  owner->processing_listener = true;
  NativeListener::Invoke(listener, event);
  owner->processing_listener = false;
}

NAN_METHOD(NotifyHook) {
  auto owner = ListenerOf(info[0]);
  auto* element = ElementOf(info[1]);
  if (!owner || !element) {
    return;
  }
  // Manual hook invocation delivers the native hook, but does not forge an
  // EventDispatcher registration that could later leave a dangling pointer.
  Attachment attachment;
  attachment.element = element->GetObserverPtr();
  attachment.id = element->GetId();
  attachment.tag = element->GetTagName();
  QueueNotification(owner, attachment, info[2]->IsTrue() ? 1 : 2);
}

NAN_METHOD(ReleaseListener) {
  auto owner = ListenerOf(info[0]);
  if (!owner) {
    return;
  }
  if (owner->active) {
    return Nan::ThrowError("Cannot release an active event listener");
  }
  if (!owner->attachments.empty()) {
    return Nan::ThrowError("Detach all listener attachments before release");
  }
  Listeners().erase(owner->value.get());
  owner->value.reset();
  owner->native_callback = {};
  MarkChanged(owner);
  // Already queued detach notifications still retain their callbacks until
  // the boundary drains them, after which the stale handle sheds its edges.
}

}  // namespace

Rml::EventListener* CreateCapturedEventListener(
    v8::Local<v8::Function> callback) {
  auto owner = std::make_shared<ListenerState>();
  auto adapter = std::make_unique<NativeListener>();
  adapter->owner = owner;
  owner->value = std::move(adapter);
  owner->generation = State().generation;
  auto functions = Nan::New<v8::Array>(3);
  Nan::Set(functions, 0, callback).FromJust();
  owner->functions.Reset(v8::Isolate::GetCurrent(), functions);
  auto* result = owner->value.get();
  Listeners().emplace(result, owner);
  // Retain the unowned factory result until OnAttach or a JS facade takes it.
  MarkChanged(owner);
  return result;
}

Rml::EventListener* CreateNativeEventListener(
    std::function<void(Rml::Event*)> callback,
    std::shared_ptr<LuaHost> lua_host) {
  auto owner = std::make_shared<ListenerState>();
  auto adapter = std::make_unique<NativeListener>();
  adapter->owner = owner;
  owner->value = std::move(adapter);
  owner->generation = State().generation;
  owner->native_callback = std::move(callback);
  owner->lua_host = std::move(lua_host);
  auto* result = owner->value.get();
  Listeners().emplace(result, owner);
  MarkChanged(owner);
  return result;
}

void AppendLuaListenerVariantOwners(LuaVariantOwnerCollector* collector) {
  for (const auto& [pointer, weak] : Listeners()) {
    const auto listener = weak.lock();
    if (!listener || !listener->lua_host) {
      continue;
    }

    if (!listener->handle.IsEmpty()) {
      AppendLuaVariantOwner(listener->lua_host,
                            listener->handle.Get(v8::Isolate::GetCurrent()),
                            collector);
    }

    for (const auto& [element, attachments] : listener->attachments) {
      AppendLuaVariantElementOwner(listener->lua_host, element, collector);
    }
  }
}

void AddTypedEventListener(Rml::Element* element,
                           v8::Local<v8::Value> input,
                           Rml::EventId id,
                           bool capture) {
  if (auto owner = ListenerOf(input)) {
    element->AddEventListener(id, owner->value.get(), capture);
  }
}

void RemoveTypedEventListener(Rml::Element* element,
                              v8::Local<v8::Value> input,
                              Rml::EventId id,
                              bool capture) {
  if (auto owner = ListenerOf(input)) {
    element->RemoveEventListener(id, owner->value.get(), capture);
  }
}

void DrainListenerNotifications() {
  while (!Notifications().empty()) {
    auto notices = std::move(Notifications());
    Notifications().clear();
    for (const auto& notice : notices) {
      --notice.owner->pending_notifications;
      MarkChanged(notice.owner);
      if (!CanInvokeCallback() || notice.owner->functions.IsEmpty()) {
        continue;
      }
      const auto functions =
          notice.owner->functions.Get(v8::Isolate::GetCurrent());
      const auto callback = Nan::Get(functions, notice.index).ToLocalChecked();
      if (!callback->IsFunction()) {
        continue;
      }
      auto snapshot = Nan::New<v8::Object>();
      Nan::Set(snapshot,
               Nan::New("id").ToLocalChecked(),
               Nan::New(notice.id).ToLocalChecked())
          .FromJust();
      Nan::Set(snapshot,
               Nan::New("tagName").ToLocalChecked(),
               Nan::New(notice.tag).ToLocalChecked())
          .FromJust();
      ++State().callback_depth;
      ++notice.owner->active;
      Nan::TryCatch caught;
      v8::Local<v8::Value> argv[] = {snapshot};
      RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
      Nan::Call(callback.As<v8::Function>(),
                Nan::GetCurrentContext()->Global(),
                1,
                argv);
      if (caught.HasCaught()) {
        CaptureCallbackException(caught.Exception());
      }
      --notice.owner->active;
      --State().callback_depth;
    }
  }
}

void RefreshTypedListenerOwnership() {
  if (State().cleaning_up) {
    return;
  }
  const auto topology = Rml::Element::GetTopologyVersionForBinding();
  static uint64_t observed_topology{0};
  static uint64_t observed_revision{0};
  const bool rebuild = observed_topology != topology ||
                       observed_revision != State().ownership_revision;
  observed_topology = topology;
  observed_revision = State().ownership_revision;
  if (!rebuild && ChangedListeners().empty()) {
    return;
  }
  auto listeners = std::move(ChangedListeners());
  ChangedListeners().clear();
  for (const auto& owner : listeners) {
    owner->queued = false;
  }
  if (rebuild) {
    // Keep all callbacks alive while their previous private roots are cleared.
    for (const auto& [pointer, weak] : Listeners()) {
      if (auto owner = weak.lock()) {
        if (!owner->functions.IsEmpty() && owner->functions.IsWeak()) {
          owner->functions.ClearWeak();
        }
        if (!owner->queued) {
          owner->queued = true;
          listeners.push_back(owner);
        }
      }
    }
    // The initial changed list may also contain released, unindexed owners.
    std::unordered_map<ListenerState*, bool> visited;
    std::erase_if(listeners, [&visited](const auto& owner) {
      return !visited.emplace(owner.get(), true).second;
    });
    for (const auto& owner : listeners) {
      owner->native_attachments = 0;
      for (const auto& attachment : owner->changes) {
        attachment->root_slot = {};
        attachment->native_owned = false;
      }
      owner->changes.clear();
      for (const auto& [element, attachments] : owner->attachments) {
        for (const auto& attachment : attachments) {
          attachment->root_slot = {};
          attachment->native_owned = false;
          owner->changes.push_back(attachment);
        }
      }
      owner->queued = false;
    }
    CallbackRoots().Clear();
  }
  for (const auto& owner : listeners) {
    State().data_diagnostics.Record(
        &DataDiagnostics::typed_listener_ownership_visits);
    auto changes = std::move(owner->changes);
    owner->changes.clear();
    const auto functions = owner->functions.Get(v8::Isolate::GetCurrent());
    for (const auto& attachment : changes) {
      State().data_diagnostics.Record(
          &DataDiagnostics::typed_listener_ownership_visits);
      CallbackRoots().Remove(&attachment->root_slot);
      if (attachment->native_owned) {
        --owner->native_attachments;
        attachment->native_owned = false;
      }
      if (!attachment->attached || !attachment->element ||
          functions.IsEmpty()) {
        continue;
      }
      if (auto* root = DetachedOwnerOf(attachment->element.get())) {
        attachment->root_slot = CallbackRoots().Add(root, functions);
      } else {
        attachment->native_owned = true;
        ++owner->native_attachments;
      }
    }
    if (!owner->value && owner->pending_notifications == 0) {
      if (!owner->handle.IsEmpty()) {
        Nan::SetPrivate(owner->handle.Get(v8::Isolate::GetCurrent()),
                        CallbackKey(),
                        Nan::Undefined())
            .FromJust();
      }
      owner->functions.Reset();
    } else if (!owner->functions.IsEmpty()) {
      if (owner->native_attachments || owner->pending_notifications) {
        if (owner->functions.IsWeak()) {
          owner->functions.ClearWeak();
        }
      } else if (!owner->functions.IsWeak()) {
        owner->functions.SetWeak();
      }
    }
  }
}

void ReleaseListenerInstancers() {
  CallbackRoots().Clear();
  // Called after Core shutdown has detached all dispatchers.
  Notifications().clear();
  ChangedListeners().clear();
  Registration().reset();
  // Destructing an owner erases its weak index; retain all owners first.
  std::vector<std::shared_ptr<ListenerState>> listeners;
  for (const auto& [pointer, weak] : Listeners()) {
    if (auto owner = weak.lock()) {
      listeners.push_back(owner);
    }
  }
  for (const auto& owner : listeners) {
    owner->attachments.clear();
    owner->changes.clear();
    owner->value.reset();
    owner->native_callback = {};
    owner->lua_host.reset();
    owner->functions.Reset();
    if (!owner->handle.IsEmpty()) {
      ClearLuaVariantOwner(owner->handle.Get(v8::Isolate::GetCurrent()));

      Nan::SetPrivate(owner->handle.Get(v8::Isolate::GetCurrent()),
                      CallbackKey(),
                      Nan::Undefined())
          .FromJust();
      owner->handle.Reset();
    }
  }
  AttachedListeners().clear();
  for (const auto& weak : Instancers()) {
    if (auto owner = weak.lock()) {
      owner->value.reset();
      owner->callback.Reset();
      if (!owner->handle.IsEmpty()) {
        Nan::SetPrivate(owner->handle.Get(v8::Isolate::GetCurrent()),
                        CallbackKey(),
                        Nan::Undefined())
            .FromJust();
        owner->handle.Reset();
      }
    }
  }
  Listeners().clear();
  Instancers().clear();
}

NAN_MODULE_INIT(InitializeRmlListenerInstancers) {
  SetInstancerValueMethod<CreateListener>(target, "createEventListener");
  SetRuntimeMethod<CreateInstancer>(target, "createEventListenerInstancer");
  SetRuntimeMethod<RegisterInstancer>(target,
                                      "factoryRegisterEventListenerInstancer");
  SetRuntimeMethod<InstanceListener<true>>(target,
                                           "factoryInstanceEventListener");
  SetInstancerValueMethod<InstanceListener<false>>(
      target, "eventListenerInstancerInstance");
  SetRuntimeMethod<ProcessEvent, true>(target, "eventListenerProcessEvent");
  SetRuntimeMethod<NotifyHook, true>(target, "eventListenerNotifyHook");
  SetRuntimeMethod<ReleaseListener, true>(target, "releaseEventListener");
}

}  // namespace sfmlrmlui
