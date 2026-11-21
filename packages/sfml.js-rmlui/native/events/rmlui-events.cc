// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/events/rmlui-events.h"

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Dictionary.h>
#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/Event.h>
#include <RmlUi/Core/EventListener.h>
#include <RmlUi/Core/Variant.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <memory>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/events/rmlui-listener-instancers.h"
#include "native/runtime/rmlui-callback-owners.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant-pointers.h"
#include "native/values/rmlui-variant.h"
#include "vendor/rmlui/Source/Core/EventDispatcher.h"
#include "vendor/rmlui/Source/Core/EventSpecification.h"

namespace sfmlrmlui {
namespace {

class JsEventListener;

struct ListenerKey {
  Rml::Element* element;
  Rml::EventId type;
  bool capture;
  int callback_hash;
  bool operator==(const ListenerKey&) const = default;
};

struct ListenerKeyHash {
  size_t operator()(const ListenerKey& key) const {
    return std::hash<Rml::Element*>{}(key.element) ^
           (static_cast<size_t>(key.type) << 1) ^ key.capture ^
           (static_cast<size_t>(key.callback_hash) << 8);
  }
};

using ListenerBuckets = std::
    unordered_map<ListenerKey, std::vector<JsEventListener*>, ListenerKeyHash>;

auto& ListenerIndex() {
  static ListenerBuckets index;
  return index;
}

auto& ChangedListeners() {
  static std::vector<std::shared_ptr<JsEventListener>> changed;
  return changed;
}

CallbackRootSlots& ListenerRoots() {
  static CallbackRootSlots roots("rml.detached.callbacks");
  return roots;
}

// A single upstream id is shared by string and numeric registration routes.
bool ReadEventId(v8::Local<v8::Value> value, Rml::EventId* id) {
  if (value->IsString()) {
    Nan::Utf8String text(value);
    *id = Rml::EventSpecificationInterface::GetIdOrInsert(
        Rml::String(*text, text.length()));
  } else if (value->IsUint32()) {
    const auto number = Nan::To<uint32_t>(value).FromJust();
    if (number >= static_cast<uint32_t>(Rml::EventId::MaxNumIds)) {
      Nan::ThrowRangeError("Event id is outside the native range");
      return false;
    }
    *id =
        Rml::EventSpecificationInterface::Get(static_cast<Rml::EventId>(number))
            .id;
  } else {
    Nan::ThrowTypeError("Expected an event name or registered event id");
    return false;
  }
  if (*id == Rml::EventId::Invalid) {
    Nan::ThrowRangeError("Event id is not registered");
    return false;
  }
  return true;
}

bool ReadDefaultActionPhase(v8::Local<v8::Value> input,
                            Rml::DefaultActionPhase* result) {
  if (!input->IsInt32()) {
    Nan::ThrowTypeError("Expected a default action phase");
    return false;
  }
  const int phase = Nan::To<int>(input).FromJust();
  if (phase != static_cast<int>(Rml::DefaultActionPhase::None) &&
      phase != static_cast<int>(Rml::DefaultActionPhase::Target) &&
      phase != static_cast<int>(Rml::DefaultActionPhase::TargetAndBubble)) {
    Nan::ThrowRangeError("Invalid default action phase");
    return false;
  }
  *result = static_cast<Rml::DefaultActionPhase>(phase);
  return true;
}

NAN_METHOD(RegisterEventType) {
  if (!info[0]->IsString() || !info[1]->IsBoolean() || !info[2]->IsBoolean()) {
    return Nan::ThrowTypeError(
        "Expected (type, interruptible, bubbles, phase)");
  }
  Rml::DefaultActionPhase phase;
  if (!ReadDefaultActionPhase(info[3], &phase)) {
    return;
  }
  Nan::Utf8String type(info[0]);
  const auto id = Rml::RegisterEventType(Rml::String(*type, type.length()),
                                         info[1]->IsTrue(),
                                         info[2]->IsTrue(),
                                         phase);
  info.GetReturnValue().Set(static_cast<uint32_t>(id));
}

class EventLease final {
 public:
  explicit EventLease(Rml::Event* event)
      : state_(std::make_shared<EventState>()) {
    state_->event = event;
    state_->generation = State().generation;
  }
  ~EventLease() { InvalidateEvent(state_.get()); }

  v8::Local<v8::Object> Handle() {
    if (!state_->handle.IsEmpty()) {
      return state_->handle.Get(v8::Isolate::GetCurrent());
    }
    auto handle = EventHandle::Create(state_);
    state_->handle.Reset(v8::Isolate::GetCurrent(), handle);
    state_->handle.SetWeak();
    return handle;
  }

 private:
  std::shared_ptr<EventState> state_;
};

bool HasDragElement(Rml::EventId id) {
  switch (id) {
    case Rml::EventId::Drag:
    case Rml::EventId::Dragstart:
    case Rml::EventId::Dragmove:
    case Rml::EventId::Dragover:
    case Rml::EventId::Dragout:
    case Rml::EventId::Dragdrop:
    case Rml::EventId::Dragend:
      return true;
    default:
      return false;
  }
}

v8::MaybeLocal<v8::Object> MarshalParameters(const Rml::Event& event) {
  auto result = Nan::New<v8::Object>();
  for (const auto& [name, variant] : event.GetParameters()) {
    v8::Local<v8::Value> converted;
    if (IsNativeDragElementParameter(event, name, variant)) {
      // Only Context::GenerateDragParameters produces this pointer contract.
      auto* element = static_cast<Rml::Element*>(variant.Get<void*>());

      Rml::Variant typed;
      ElementVariantFromNative(element, &typed);
      if (!VariantToJs(typed).ToLocal(&converted)) {
        return {};
      }
    } else if (!VariantToJs(variant).ToLocal(&converted)) {
      return {};
    }
    if (!result
             ->CreateDataProperty(Nan::GetCurrentContext(),
                                  Nan::New(name).ToLocalChecked(),
                                  converted)
             .FromMaybe(false)) {
      return {};
    }
  }
  return result;
}

// Accessed only by the owning runtime or its environment cleanup hook.
std::unordered_map<JsEventListener*, std::shared_ptr<JsEventListener>>&
Registry() {
  static std::unordered_map<JsEventListener*, std::shared_ptr<JsEventListener>>
      registry;
  return registry;
}

// RmlUi listener that forwards into a persistent JavaScript callback.
class JsEventListener final
    : public Rml::EventListener,
      public std::enable_shared_from_this<JsEventListener> {
 public:
  JsEventListener(Rml::Element* element,
                  v8::Local<v8::Function> callback,
                  Rml::EventId type,
                  bool capture)
      : element_(element->GetObserverPtr()),
        callback_(v8::Isolate::GetCurrent(), callback),
        type_(type),
        capture_(capture),
        callback_hash_(callback->GetIdentityHash()) {}

  void OnDetach(Rml::Element*) override {
    auto retained = shared_from_this();
    if (const auto found = ListenerIndex().find(key());
        found != ListenerIndex().end()) {
      std::erase(found->second, this);
      if (found->second.empty()) {
        ListenerIndex().erase(found);
      }
    }
    MarkChanged();
    element_.reset();
    callback_.Reset();
    Registry().erase(this);
  }

  void Detach() {
    if (element_) {
      element_->RemoveEventListener(type_, this, capture_);
    } else {
      OnDetach(nullptr);
    }
  }

  void ProcessEvent(Rml::Event& event) override {
    // Self-removal drops registry ownership, but not the active native frame.
    auto retained = shared_from_this();
    if (!element_ || !CanInvokeCallback()) {
      return;
    }
    Nan::HandleScope scope;
    CallbackScope callback_scope(event);
    Nan::TryCatch try_catch;
    Invoke(&event);
    if (try_catch.HasCaught()) {
      CaptureCallbackException(try_catch.Exception());
    }
  }

  void Invoke(Rml::Event* native_event) {
    auto& event = *native_event;
    auto local = callback_.Get(v8::Isolate::GetCurrent());
    if (local.IsEmpty()) {
      return;
    }

    EventLease lease(&event);
    v8::Local<v8::Object> object;
    if (!WrapEventData(event, lease.Handle()).ToLocal(&object)) {
      return;
    }

    v8::Local<v8::Value> argv[] = {object};
    RecordDiagnosticCallback(DiagnosticCallback::kEvent);
    Nan::Call(local, Nan::GetCurrentContext()->Global(), 1, argv);
  }

  bool Matches(Rml::Element* element,
               v8::Local<v8::Function> callback,
               Rml::EventId type,
               bool capture) const {
    return element_ == element && type == type_ && capture == capture_ &&
           callback == callback_.Get(v8::Isolate::GetCurrent());
  }

  Rml::Element* element() const { return element_.get(); }
  ListenerKey key() const {
    return {element_.get(), type_, capture_, callback_hash_};
  }
  v8::Local<v8::Function> callback() const {
    return callback_.Get(v8::Isolate::GetCurrent());
  }

  void SetDetached(bool detached) {
    if (detached && !callback_.IsWeak()) {
      callback_.SetWeak();
    } else if (!detached && callback_.IsWeak()) {
      callback_.ClearWeak();
    }
  }

  void MarkChanged() {
    if (!queued) {
      queued = true;
      ChangedListeners().push_back(shared_from_this());
    }
    State().listener_ownership_dirty = true;
  }

  CallbackRootSlot root_slot;
  bool queued{false};

 private:
  Rml::ObserverPtr<Rml::Element> element_;
  v8::Global<v8::Function> callback_;
  Rml::EventId type_;
  bool capture_;
  int callback_hash_;
};

std::shared_ptr<JsEventListener> FindListener(Rml::Element* element,
                                              v8::Local<v8::Function> callback,
                                              Rml::EventId type,
                                              bool capture) {
  const auto found = ListenerIndex().find(
      {element, type, capture, callback->GetIdentityHash()});
  if (found == ListenerIndex().end()) {
    return nullptr;
  }
  for (auto* listener : found->second) {
    State().data_diagnostics.Record(
        &DataDiagnostics::listener_lookup_comparisons);
    if (listener->Matches(element, callback, type, capture)) {
      return Registry().at(listener);
    }
  }
  return nullptr;
}

NAN_METHOD(AddEventListener) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  Rml::EventId type{};
  if (!ReadEventId(info[1], &type)) {
    return;
  }
  if (!info[2]->IsFunction()) {
    AddTypedEventListener(element, info[2], type, info[3]->IsTrue());
    return;
  }
  auto callback = Nan::To<v8::Function>(info[2]).ToLocalChecked();
  const bool capture = info[3]->IsBoolean() && info[3]->IsTrue();

  if (FindListener(element, callback, type, capture)) {
    return;
  }
  auto listener =
      std::make_shared<JsEventListener>(element, callback, type, capture);
  Registry().emplace(listener.get(), listener);
  ListenerIndex()[listener->key()].push_back(listener.get());
  try {
    element->AddEventListener(type, listener.get(), capture);
    listener->MarkChanged();
    RefreshEventListenerOwnership(false);
  } catch (...) {
    listener->Detach();
    Registry().erase(listener.get());
    throw;
  }
}

NAN_METHOD(RemoveEventListener) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  Rml::EventId type{};
  if (!ReadEventId(info[1], &type)) {
    return;
  }
  if (!info[2]->IsFunction()) {
    RemoveTypedEventListener(element, info[2], type, info[3]->IsTrue());
    return;
  }
  auto callback = Nan::To<v8::Function>(info[2]).ToLocalChecked();
  const bool capture = info[3]->IsBoolean() && info[3]->IsTrue();

  if (auto listener = FindListener(element, callback, type, capture)) {
    listener->Detach();
    RefreshEventListenerOwnership(false);
  }
}

NAN_METHOD(DispatchEvent) {
  const size_t active_depth = State().active_elements.size();
  Rml::Dictionary parameters;
  if (!DictionaryFromJs(info[2], &parameters)) {
    return;
  }
  // Variant accessors may remove this element or its context. Resolve only
  // after every user property read and element-parameter check has finished.
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  Rml::EventId type{};
  if (!ReadEventId(info[1], &type)) {
    return;
  }
  if (type == Rml::EventId::Dragdrop) {
    // Parameter conversion resolves guarded slots after every JS accessor.
    // Preserve all outer receivers and all ordinary parameter references;
    // CallbackScope tracks the draggable node separately from its receiver.
    State().active_elements.resize(active_depth);
    for (const auto& [name, value] : parameters) {
      if (name != "drag_element") {
        if (auto* parameter = GuardedElementVariantPointer(value)) {
          State().active_elements.push_back(parameter);
        }
      }
    }
    State().active_elements.push_back(element);
  }
  if (info[3]->IsUndefined() && info[4]->IsUndefined()) {
    info.GetReturnValue().Set(element->DispatchEvent(type, parameters));
  } else if (info[3]->IsBoolean() && info[4]->IsBoolean()) {
    // RmlUi's explicit-flag overload takes a name. Copy it before callbacks
    // can grow the upstream specification vector during nested registration.
    const auto name = Rml::EventSpecificationInterface::Get(type).type;
    info.GetReturnValue().Set(element->DispatchEvent(
        name, parameters, info[3]->IsTrue(), info[4]->IsTrue()));
  } else {
    Nan::ThrowTypeError("Expected interruptible and bubbles booleans");
  }
}

NAN_METHOD(GetEventDispatcher) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(WrapElement(element));
  }
}

NAN_METHOD(DetachAllEvents) {
  if (auto* element = ElementOf(info[0])) {
    // Upstream also walks non-DOM children and detaches native widget
    // listeners. OnDetach only updates ownership or queues notifications;
    // no user callback runs until the outer RuntimeScope has unwound.
    element->GetEventDispatcher()->DetachAllEvents();
    RefreshEventListenerOwnership(false);
  }
}

NAN_METHOD(DispatcherDispatchEvent) {
  if (!info[1]->IsUint32() ||
      Nan::To<uint32_t>(info[1]).FromJust() >=
          static_cast<uint32_t>(Rml::EventId::MaxNumIds)) {
    return Nan::ThrowRangeError("Event id is outside the native range");
  }
  if (!info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected an explicit event type");
  }
  if (!info[4]->IsBoolean() || !info[5]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected interruptible and bubbles booleans");
  }
  Rml::DefaultActionPhase phase;
  if (!ReadDefaultActionPhase(info[6], &phase)) {
    return;
  }
  Nan::Utf8String type(info[2]);
  const Rml::String name(*type, type.length());
  const auto id =
      static_cast<Rml::EventId>(Nan::To<uint32_t>(info[1]).FromJust());
  Rml::Dictionary parameters;
  if (!DictionaryFromJs(info[3], &parameters)) {
    return;
  }
  // Conversion may invoke user getters and remove the receiver. Resolve
  // only afterwards, and retain the explicit name across nested registry
  // changes. Static dispatch deliberately does not borrow registry flags.
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(
        Rml::EventDispatcher::DispatchEvent(element,
                                            id,
                                            name,
                                            parameters,
                                            info[4]->IsTrue(),
                                            info[5]->IsTrue(),
                                            phase));
  }
}

NAN_METHOD(Click) {
  if (auto* element = ElementOf(info[0])) {
    element->Click();
  }
}

class DefaultActionScope final {
 public:
  explicit DefaultActionScope(EventState& state) : state_(state) {
    state_.processing_default_action = true;
  }
  ~DefaultActionScope() { state_.processing_default_action = false; }

 private:
  EventState& state_;
};

NAN_METHOD(ProcessDefaultAction) {
  auto* event = EventOf(info[1]);
  if (!event) {
    return;
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  // Native widget hooks assume the dispatcher established this relationship.
  // In particular, document keyboard navigation walks the target's ancestors.
  if (event->GetCurrentElement() != element) {
    return Nan::ThrowError(
        "Default action requires the event's current element");
  }
  auto& lease = *EventHandle::From(info[1])->owner();
  if (lease.processing_default_action || lease.processing_listener) {
    return Nan::ThrowError("RmlUi default action is already active");
  }
  DefaultActionScope scope(lease);
  CallbackScope references(*event);
  std::vector<v8::Local<v8::Object>> roots;
  if (lease.current_reference) {
    roots.push_back(WrapElement(lease.current_reference->get()));
  }
  for (const auto& reference : lease.references) {
    if (!reference) {
      return Nan::ThrowError("RmlUi event references a destroyed element");
    }
    roots.push_back(WrapElement(reference.get()));
    State().event_elements.push_back(reference.get());
  }
  element->ProcessDefaultAction(*event);
}

NAN_METHOD(GetEventPropagation) {
  if (auto* event = EventOf(info[0])) {
    info.GetReturnValue().Set(info[1]->IsTrue()
                                  ? event->IsImmediatePropagating()
                                  : event->IsPropagating());
  }
}

NAN_METHOD(GetEventParameter) {
  // Reject expired leases before executing any user default-value accessor.
  if (!EventOf(info[0])) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an event parameter name");
  }
  Nan::Utf8String name(info[1]);
  const Rml::String key(*name, name.length());
  VariantSelector fallback;
  if (!VariantSelectorFromJs(info[2], &fallback)) {
    return;
  }
  // Default accessors can dispatch nested events. Re-resolve the lease only
  // after conversion, before borrowing its current projected parameters.
  auto* event = EventOf(info[0]);
  if (!event) {
    return;
  }
  v8::Local<v8::Value> converted;
  if (ConvertVariantToJs(Rml::GetIf(event->GetParameters(), key), fallback)
          .ToLocal(&converted)) {
    info.GetReturnValue().Set(converted);
  }
}

NAN_METHOD(GetEventElementParameter) {
  auto* event = EventOf(info[0]);
  if (!event) {
    return;
  }

  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an event parameter name");
  }

  auto* fallback = info[2]->IsNull() ? nullptr : ElementOf(info[2]);
  if (!info[2]->IsNull() && !fallback) {
    return;
  }

  Nan::Utf8String name(info[1]);
  const Rml::String key(*name, name.length());
  const auto* value = Rml::GetIf(event->GetParameters(), key);
  auto* result = fallback;
  if (value && value->GetType() == Rml::Variant::SCRIPTINTERFACE) {
    // A successful null pointer conversion replaces the fallback. Resolve
    // non-null values only through the registered element lifetime slot.
    auto* script = value->GetReference<Rml::ScriptInterface*>();
    result = GuardedElementVariantPointer(*value);
    if (script && !result) {
      return Nan::ThrowTypeError(
          "Event parameter requires its registered native element");
    }
  } else if (value && value->GetType() == Rml::Variant::VOIDPTR) {
    if (!IsNativeDragElementParameter(*event, key, *value)) {
      return Nan::ThrowTypeError(
          "Pointer Variant requires a typed pointer adapter");
    }
    // This exact upstream contract is also used by MarshalParameters.
    result = static_cast<Rml::Element*>(value->Get<void*>());
  }

  info.GetReturnValue().Set(WrapNullableElement(result));
}

NAN_METHOD(StopEventPropagation) {
  if (auto* event = EventOf(info[0])) {
    if (info[1]->IsTrue()) {
      event->StopImmediatePropagation();
    } else {
      event->StopPropagation();
    }
  }
}

NAN_METHOD(SetEventPhase) {
  if (!info[1]->IsInt32()) {
    return Nan::ThrowTypeError("Expected an event phase");
  }
  const int phase = Nan::To<int>(info[1]).FromJust();
  if (phase != 0 && phase != 1 && phase != 2 && phase != 4) {
    return Nan::ThrowRangeError("Invalid event phase");
  }
  if (auto* event = EventOf(info[0])) {
    event->SetPhase(static_cast<Rml::EventPhase>(phase));
  }
}

NAN_METHOD(SetEventCurrentElement) {
  auto* event = EventOf(info[0]);
  if (!event) {
    return;
  }
  auto* element = info[1]->IsNull() ? nullptr : ElementOf(info[1]);
  if (!info[1]->IsNull() && !element) {
    return;
  }
  auto owner = EventHandle::From(info[0])->owner();
  if (owner->owned) {
    // The current element is independent of the optional target and any
    // parameter references. Replacement must stop observing its old node.
    if (element) {
      owner->current_reference = element->GetObserverPtr();
    } else {
      owner->current_reference.reset();
    }
  }
  event->SetCurrentElement(element);
  if (!owner->owned && element) {
    State().event_elements.push_back(element);
  }
  info.GetReturnValue().Set(WrapNullableElement(element));
}

NAN_METHOD(SnapshotEvent) {
  auto* event = EventOf(info[0]);
  if (!event) {
    return;
  }

  v8::Local<v8::Object> snapshot;
  if (WrapEventData(*event, info[0].As<v8::Object>()).ToLocal(&snapshot)) {
    info.GetReturnValue().Set(snapshot);
  }
}

}  // namespace

bool IsNativeDragElementParameter(const Rml::Event& event,
                                  const Rml::String& key,
                                  const Rml::Variant& value) {
  return value.GetType() == Rml::Variant::VOIDPTR &&
         !value.HasGuardedOpaquePointerForBinding() && key == "drag_element" &&
         HasDragElement(event.GetId());
}

void InvokeEventCallback(Rml::Event* event, v8::Local<v8::Function> callback) {
  EventLease lease(event);
  v8::Local<v8::Object> object;
  if (WrapEventData(*event, lease.Handle()).ToLocal(&object)) {
    v8::Local<v8::Value> argv[] = {object};
    RecordDiagnosticCallback(DiagnosticCallback::kEvent);
    Nan::Call(callback, Nan::GetCurrentContext()->Global(), 1, argv);
  }
}

Rml::Event* EventOf(v8::Local<v8::Value> value) {
  auto* handle = EventHandle::From(value);
  if (!handle) {
    return nullptr;
  }
  const auto& owner = handle->owner();
  if (!owner->event || owner->generation != State().generation) {
    Nan::ThrowError("RmlUi event callback has expired or event is invalid");
    return nullptr;
  }
  if (owner->current_reference && !*owner->current_reference) {
    Nan::ThrowError("RmlUi event references a destroyed element");
    return nullptr;
  }
  for (const auto& reference : owner->references) {
    if (!reference) {
      Nan::ThrowError("RmlUi event references a destroyed element");
      return nullptr;
    }
  }
  return owner->event;
}

v8::MaybeLocal<v8::Object> WrapEventData(const Rml::Event& event,
                                         v8::Local<v8::Object> handle) {
  auto object = Nan::New<v8::Object>();
  auto put = [&](const char* key, v8::Local<v8::Value> value) {
    return object
        ->CreateDataProperty(
            Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
        .FromMaybe(false);
  };
  auto* target = event.GetTargetElement();
  if (!put("handle", handle) ||
      !put("type", Nan::New(event.GetType()).ToLocalChecked()) ||
      !put("target", WrapNullableElement(target)) ||
      !put("targetId",
           Nan::New(target ? target->GetId() : "").ToLocalChecked()) ||
      !put("currentTarget", WrapNullableElement(event.GetCurrentElement())) ||
      !put("id", Nan::New(static_cast<int>(event.GetId()))) ||
      !put("phase", Nan::New(static_cast<int>(event.GetPhase()))) ||
      !put("isInterruptible", Nan::New(event.IsInterruptible()))) {
    return {};
  }
  v8::Local<v8::Object> parameters;
  v8::Local<v8::Value> screen_position;
  if (!MarshalParameters(event).ToLocal(&parameters) ||
      !VariantToJs(Rml::Variant(event.GetUnprojectedMouseScreenPos()))
           .ToLocal(&screen_position) ||
      !put("parameters", parameters) ||
      !put("unprojectedMouseScreenPosition", screen_position)) {
    return {};
  }
  return object;
}

void RefreshEventListenerOwnership(bool allow_rebuild) {
  const auto topology = Rml::Element::GetTopologyVersionForBinding();
  static uint64_t observed_topology{0};
  static uint64_t observed_revision{0};
  const bool rebuild =
      allow_rebuild && (observed_topology != topology ||
                        observed_revision != State().ownership_revision);
  if (allow_rebuild) {
    observed_topology = topology;
    observed_revision = State().ownership_revision;
  }
  if (rebuild) {
    // Typed-listener edges may themselves be the last owners of this subtree.
    // Promote attached JS callbacks before either family clears old roots.
    for (const auto& [pointer, listener] : Registry()) {
      listener->SetDetached(false);
    }
  }
  if (allow_rebuild) {
    RefreshTypedListenerOwnership();
  }
  if (!rebuild && !State().listener_ownership_dirty) {
    return;
  }
  State().listener_ownership_dirty = false;
  auto changed = std::move(ChangedListeners());
  ChangedListeners().clear();
  for (const auto& listener : changed) {
    listener->queued = false;
  }
  State().data_diagnostics.Record(&DataDiagnostics::listener_ownership_passes);
  if (rebuild) {
    // Promote every live callback before clearing former detached-root edges.
    // V8 allocations may detach unrelated listeners, so retain a snapshot.
    for (const auto& listener : changed) {
      listener->root_slot = {};
    }
    changed.clear();
    for (const auto& [pointer, listener] : Registry()) {
      listener->root_slot = {};
      changed.push_back(listener);
    }
    ListenerRoots().Clear();
  }
  for (const auto& listener : changed) {
    State().data_diagnostics.Record(
        &DataDiagnostics::listener_ownership_visits);
    auto callback = listener->callback();
    ListenerRoots().Remove(&listener->root_slot);
    if (State().cleaning_up || !listener->element() || callback.IsEmpty()) {
      continue;
    }
    if (auto* owner = DetachedOwnerOf(listener->element())) {
      listener->root_slot = ListenerRoots().Add(owner, callback);
      listener->SetDetached(true);
    } else {
      listener->SetDetached(false);
    }
  }
}

void ReleaseEventListeners() {
  while (!Registry().empty()) {
    auto listener = Registry().begin()->second;
    listener->Detach();
  }
  RefreshEventListenerOwnership();
  ListenerRoots().Clear();
  ListenerIndex().clear();
}

NAN_MODULE_INIT(InitializeRmlEvents) {
  SetRuntimeMethod<RegisterEventType, true>(target, "registerEventType");
  SetRuntimeMethod<AddEventListener, true>(target, "addEventListener");
  SetRuntimeMethod<RemoveEventListener, true>(target, "removeEventListener");
  SetRuntimeMethod<DispatchEvent, true>(target, "dispatchEvent");
  SetRuntimeMethod<GetEventDispatcher, true>(target,
                                             "elementGetEventDispatcher");
  SetRuntimeMethod<DetachAllEvents, true>(target, "dispatcherDetachAllEvents");
  SetRuntimeMethod<DispatcherDispatchEvent, true>(target,
                                                  "dispatcherDispatchEvent");
  SetRuntimeMethod<Click, true>(target, "click");
  SetRuntimeMethod<ProcessDefaultAction, true>(target, "processDefaultAction");
  SetRuntimeMethod<GetEventPropagation, true, false>(target,
                                                     "getEventPropagation");
  SetRuntimeMethod<GetEventParameter, true, false>(target, "getEventParameter");
  SetRuntimeMethod<GetEventElementParameter, true, false>(
      target, "getEventElementParameter");
  SetRuntimeMethod<StopEventPropagation, true, false>(target,
                                                      "stopEventPropagation");
  SetRuntimeMethod<SetEventPhase, true, false>(target, "setEventPhase");
  SetRuntimeMethod<SetEventCurrentElement, true, false>(
      target, "setEventCurrentElement");
  SetRuntimeMethod<SnapshotEvent, true, false>(target, "snapshotEvent");
}

}  // namespace sfmlrmlui
