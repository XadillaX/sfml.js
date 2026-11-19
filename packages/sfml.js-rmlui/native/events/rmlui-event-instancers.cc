// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/events/rmlui-event-instancers.h"

#include <RmlUi/Core/EventInstancer.h>
#include <RmlUi/Core/Factory.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/rmlui-script-object.h"
#include "native/values/rmlui-variant-pointers.h"
#include "native/values/rmlui-variant.h"
#include "third_party/rmlui/Source/Core/EventSpecification.h"

namespace sfmlrmlui {
namespace {

struct InstancerState {
  std::unique_ptr<Rml::EventInstancer> value;
  v8::Global<v8::Array> functions;
  uint64_t generation{0};
  bool registered{false};
  bool active{false};
  bool ownership_pending{false};
};

using InstancerHandle = sfmljs::SharedHandle<InstancerState>;

struct Allocation {
  Rml::Event* event{nullptr};
  std::vector<std::shared_ptr<InstancerState>> chain;
};

struct ReleaseNotice {
  std::shared_ptr<InstancerState> owner;
  Rml::String type;
  Rml::EventId id;
};

auto& Instancers() {
  static std::vector<std::weak_ptr<InstancerState>> values;
  return values;
}

auto& Registrations() {
  static std::vector<std::shared_ptr<InstancerState>> values;
  return values;
}

auto& Allocations() {
  static std::unordered_map<Rml::Event*, Allocation> values;
  return values;
}

auto& OwnedEvents() {
  static std::vector<std::weak_ptr<EventState>> values;
  return values;
}

auto& PendingReleases() {
  static std::vector<ReleaseNotice> values;
  return values;
}

auto FindAllocation(Rml::Event* event) {
  return Allocations().find(event);
}

auto& ChangedInstancers() {
  static std::vector<std::weak_ptr<InstancerState>> values;
  return values;
}

void QueueOwnership(const std::shared_ptr<InstancerState>& owner) {
  if (!owner->ownership_pending) {
    owner->ownership_pending = true;
    ChangedInstancers().push_back(owner);
  }
}

template <typename T>
void AppendWeak(std::vector<std::weak_ptr<T>>* values,
                const std::shared_ptr<T>& value) {
  static size_t sweep_threshold = 64;
  if (values->size() >= sweep_threshold) {
    std::erase_if(*values, [](const auto& weak) { return weak.expired(); });
    sweep_threshold = std::max<size_t>(64, values->size() * 2);
  }
  values->push_back(value);
}

void ClearEventCallbackEdges(const std::shared_ptr<EventState>& owner) {
  if (owner->handle.IsEmpty()) {
    return;
  }
  const auto handle = owner->handle.Get(v8::Isolate::GetCurrent());
  ClearEventScriptObjectEdge(handle);
  Nan::SetPrivate(handle,
                  Nan::New("rml.event.instancer.functions").ToLocalChecked(),
                  Nan::Undefined())
      .FromJust();
  owner->handle.Reset();
}

class InstancerCallbackScope final {
 public:
  explicit InstancerCallbackScope(InstancerState& owner) : owner_(owner) {
    owner_.active = true;
    ++State().callback_depth;
    ++State().instancer_callback_depth;
  }
  ~InstancerCallbackScope() {
    --State().instancer_callback_depth;
    --State().callback_depth;
    owner_.active = false;
  }

 private:
  InstancerState& owner_;
};

std::shared_ptr<InstancerState> InstancerOf(v8::Local<v8::Value> input) {
  auto* handle = InstancerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an EventInstancer");
    return {};
  }
  const auto owner = handle->owner();
  if (!owner->value || owner->generation != State().generation) {
    Nan::ThrowError("Event instancer is no longer valid");
    return {};
  }
  return owner;
}

void ReleaseAllocation(Rml::Event* event) {
  const auto found = FindAllocation(event);
  if (found != Allocations().end()) {
    const auto chain = found->second.chain;
    Allocations().erase(found);
    for (size_t i = chain.size(); i > 1; --i) {
      QueueOwnership(chain[i - 1]);
      PendingReleases().push_back(
          {chain[i - 1], event->GetType(), event->GetId()});
    }
  }
  delete event;
}

class NativeEvent final : public Rml::Event {
 public:
  using Rml::Event::Event;

 private:
  // A directly allocated event has no Factory-assigned private instancer.
  // The release chain also covers later transfer through upstream Factory.
  void Release() override { ReleaseAllocation(this); }
};

v8::MaybeLocal<v8::Object> WrapOwnedEventImpl(Rml::EventPtr event) {
  auto owner = std::make_shared<EventState>();
  owner->event = event.get();
  owner->owned = std::move(event);
  owner->generation = State().generation;
  auto* target = owner->event->GetTargetElement();
  if (target) {
    owner->references.push_back(target->GetObserverPtr());
  }
  if (auto* current = owner->event->GetCurrentElement()) {
    owner->current_reference = current->GetObserverPtr();
  }
  for (const auto& [key, value] : owner->event->GetParameters()) {
    Rml::Element* element = nullptr;
    if (value.GetType() == Rml::Variant::SCRIPTINTERFACE) {
      element = GuardedElementVariantPointer(value);
    } else if (IsNativeDragElementParameter(*owner->event, key, value)) {
      element = static_cast<Rml::Element*>(value.Get<void*>());
    }
    if (element) {
      owner->references.push_back(element->GetObserverPtr());
    }
  }
  auto handle = EventHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  auto functions = Nan::New<v8::Array>();
  const auto found = FindAllocation(owner->event);
  if (found != Allocations().end()) {
    for (const auto& entry : found->second.chain) {
      if (!entry->functions.IsEmpty()) {
        Nan::Set(functions,
                 functions->Length(),
                 entry->functions.Get(v8::Isolate::GetCurrent()))
            .FromJust();
      }
    }
  }
  Nan::SetPrivate(handle,
                  Nan::New("rml.event.instancer.functions").ToLocalChecked(),
                  functions)
      .FromJust();
  AppendWeak(&OwnedEvents(), owner);
  BindOwnedEventScriptObject(owner->event, handle);
  return WrapEventData(*owner->event, handle);
}

NAN_METHOD(CreateDefaultEvent) {
  v8::Local<v8::Object> wrapped;
  if (WrapOwnedEvent(Rml::EventPtr(new NativeEvent())).ToLocal(&wrapped)) {
    info.GetReturnValue().Set(wrapped);
  }
}

Rml::EventPtr TakeCandidate(v8::Local<v8::Value> input,
                            const std::shared_ptr<InstancerState>& instancer,
                            Rml::Element* target,
                            Rml::EventId id,
                            const Rml::String& type,
                            bool interruptible) {
  auto* event = EventOf(input);
  if (!event) {
    return {};
  }
  auto owner = EventHandle::From(input)->owner();
  const auto found = FindAllocation(event);
  if (!owner->owned || found == Allocations().end()) {
    Nan::ThrowTypeError(
        "Event instancer must return an owned EventInstancer allocation");
    return {};
  }
  if (owner->processing_default_action || owner->processing_listener) {
    Nan::ThrowError("Cannot transfer an active default action event");
    return {};
  }
  if (event->GetTargetElement() != target || event->GetId() != id ||
      event->GetType() != type || event->IsInterruptible() != interruptible) {
    Nan::ThrowTypeError("Event instancer returned different event arguments");
    return {};
  }
  found->second.chain.push_back(instancer);
  for (const auto& entry : found->second.chain) {
    if (entry->functions.IsWeak()) {
      entry->functions.ClearWeak();
    }
    QueueOwnership(entry);
  }
  PromoteEventScriptObject(event);
  InvalidateEvent(owner.get());
  owner->references.clear();
  owner->current_reference.reset();
  ClearEventCallbackEdges(owner);
  return std::move(owner->owned);
}

class NativeEventInstancer final : public Rml::EventInstancer {
 public:
  std::weak_ptr<InstancerState> state;

  Rml::EventPtr InstanceEvent(Rml::Element* target,
                              Rml::EventId id,
                              const Rml::String& type,
                              const Rml::Dictionary& parameters,
                              bool interruptible) override {
    const auto owner = state.lock();
    if (!owner) {
      return {};
    }
    if (owner->functions.IsEmpty()) {
      Rml::EventPtr result(
          new NativeEvent(target, id, type, parameters, interruptible));
      Allocations().emplace(result.get(), Allocation{result.get(), {owner}});
      return result;
    }
    if (!CanInvokeCallback()) {
      return {};
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    Rml::EventPtr result;
    if (owner->active) {
      Nan::ThrowError("Recursive event instancer callback");
    } else {
      InstancerCallbackScope scope(*owner);
      Rml::Event snapshot(target, id, type, parameters, interruptible);
      CallbackScope references(snapshot);
      v8::Local<v8::Object> data;
      if (WrapEventData(snapshot, Nan::New<v8::Object>()).ToLocal(&data)) {
        const auto functions = owner->functions.Get(v8::Isolate::GetCurrent());
        const auto callback = Nan::Get(functions, 0).ToLocalChecked();
        v8::Local<v8::Value> args[] = {
            WrapElement(target),
            Nan::New(static_cast<int>(id)),
            Nan::New(type).ToLocalChecked(),
            Nan::Get(data, Nan::New("parameters").ToLocalChecked())
                .ToLocalChecked(),
            Nan::New(interruptible)};
        v8::Local<v8::Value> candidate;
        RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
        if (callback.As<v8::Function>()
                ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 5, args)
                .ToLocal(&candidate) &&
            !candidate->IsNull()) {
          result =
              TakeCandidate(candidate, owner, target, id, type, interruptible);
        }
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    return result;
  }

  void ReleaseEvent(Rml::Event* event) override { ReleaseAllocation(event); }

 private:
  void Release() override {
    if (auto owner = state.lock()) {
      owner->value.release();
      owner->generation = 0;
    }
    delete this;
  }
};

NAN_METHOD(CreateInstancer) {
  if ((!info[0]->IsUndefined() && !info[0]->IsFunction()) ||
      (!info[1]->IsUndefined() && !info[1]->IsFunction()) ||
      (info[0]->IsUndefined() && info[1]->IsFunction())) {
    return Nan::ThrowTypeError("Expected event instancer callbacks");
  }
  auto owner = std::make_shared<InstancerState>();
  auto adapter = std::make_unique<NativeEventInstancer>();
  adapter->state = owner;
  owner->value = std::move(adapter);
  owner->generation = State().generation;
  auto handle = InstancerHandle::Create(owner);
  if (info[0]->IsFunction()) {
    auto functions = Nan::New<v8::Array>(2);
    Nan::Set(functions, 0, info[0]).FromJust();
    Nan::Set(functions, 1, info[1]).FromJust();
    owner->functions.Reset(v8::Isolate::GetCurrent(), functions);
    owner->functions.SetWeak();
    Nan::SetPrivate(handle,
                    Nan::New("rml.event.instancer.functions").ToLocalChecked(),
                    functions)
        .FromJust();
  }
  AppendWeak(&Instancers(), owner);
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(RegisterInstancer) {
  if (auto owner = InstancerOf(info[0])) {
    owner->registered = true;
    if (owner->functions.IsWeak()) {
      owner->functions.ClearWeak();
    }
    Registrations().push_back(owner);
    Rml::Factory::RegisterEventInstancer(owner->value.get());
  }
}

template <bool use_factory>
NAN_METHOD(InstanceEvent) {
  constexpr int start = use_factory ? 0 : 1;
  if (!info[start + 1]->IsUint32() || !info[start + 2]->IsString() ||
      !info[start + 4]->IsBoolean()) {
    return Nan::ThrowTypeError(
        "Expected (target, event id, type, parameters, interruptible)");
  }
  const auto number = Nan::To<uint32_t>(info[start + 1]).FromJust();
  if (number >= static_cast<uint32_t>(Rml::EventId::MaxNumIds) ||
      Rml::EventSpecificationInterface::Get(static_cast<Rml::EventId>(number))
              .id == Rml::EventId::Invalid) {
    return Nan::ThrowRangeError("Event id is not registered");
  }
  Rml::Dictionary parameters;
  if (!DictionaryFromJs(info[start + 3], &parameters)) {
    return;
  }
  auto* target = ElementOf(info[start]);
  if (!target) {
    return;
  }
  const auto id = static_cast<Rml::EventId>(number);
  Nan::Utf8String text(info[start + 2]);
  const Rml::String type(*text, text.length());
  const bool interruptible = info[start + 4]->IsTrue();
  Rml::EventPtr event;
  if constexpr (use_factory) {
    event = Rml::Factory::InstanceEvent(
        target, id, type, parameters, interruptible);
  } else {
    const auto owner = InstancerOf(info[0]);
    if (!owner) {
      return;
    }
    if (owner->active) {
      return Nan::ThrowError("Recursive event instancer callback");
    }
    event = owner->value->InstanceEvent(
        target, id, type, parameters, interruptible);
  }
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (!event) {
    return info.GetReturnValue().Set(Nan::Null());
  }
  v8::Local<v8::Object> wrapped;
  if (WrapOwnedEvent(std::move(event)).ToLocal(&wrapped)) {
    info.GetReturnValue().Set(wrapped);
  }
}

NAN_METHOD(ReleaseEvent) {
  auto instancer = InstancerOf(info[0]);
  auto* handle = instancer ? EventHandle::From(info[1]) : nullptr;
  if (!handle) {
    return;
  }
  const auto owner = handle->owner();
  if (!owner->owned || owner->generation != State().generation) {
    return Nan::ThrowTypeError("Expected a live owned event");
  }
  if (owner->processing_default_action || owner->processing_listener) {
    return Nan::ThrowError("Cannot release an active default action event");
  }
  const auto found = FindAllocation(owner->owned.get());
  if (found == Allocations().end() || found->second.chain.back() != instancer) {
    return Nan::ThrowTypeError("Event was allocated by another instancer");
  }
  // Release must remain possible when observed target/parameter nodes died.
  InvalidateEvent(owner.get());
  owner->references.clear();
  owner->current_reference.reset();
  owner->owned.reset();
  ClearEventCallbackEdges(owner);
}

NAN_METHOD(ReleaseOwnedEvent) {
  auto* handle = EventHandle::From(info[0]);
  if (!handle) {
    return;
  }
  const auto owner = handle->owner();
  if (!owner->owned || owner->generation != State().generation) {
    return Nan::ThrowTypeError("Expected a live owned event");
  }
  if (owner->processing_default_action || owner->processing_listener) {
    return Nan::ThrowError("Cannot release an active default action event");
  }
  InvalidateEvent(owner.get());
  owner->references.clear();
  owner->current_reference.reset();
  owner->owned.reset();
  ClearEventCallbackEdges(owner);
}

}  // namespace

v8::MaybeLocal<v8::Object> WrapOwnedEvent(Rml::EventPtr event) {
  return WrapOwnedEventImpl(std::move(event));
}

void RefreshEventInstancerOwnership() {
  if (State().cleaning_up || ChangedInstancers().empty()) {
    return;
  }
  RecordDiagnosticOwnership(DiagnosticOwnership::kEventInstancer);
  auto changed = std::move(ChangedInstancers());
  ChangedInstancers().clear();
  for (const auto& weak : changed) {
    RecordDiagnosticLeaseVisit(DiagnosticOwnership::kEventInstancer);
    if (auto owner = weak.lock()) {
      owner->ownership_pending = false;
      if (!owner->functions.IsEmpty() && !owner->registered &&
          !owner->functions.IsWeak()) {
        owner->functions.SetWeak();
      }
    }
  }
}

void DrainEventInstancerReleases() {
  while (!PendingReleases().empty()) {
    auto notices = std::move(PendingReleases());
    PendingReleases().clear();
    for (const auto& notice : notices) {
      if (!CanInvokeCallback() || notice.owner->functions.IsEmpty()) {
        continue;
      }
      Nan::HandleScope handles;
      Nan::TryCatch caught;
      const auto functions =
          notice.owner->functions.Get(v8::Isolate::GetCurrent());
      const auto callback = Nan::Get(functions, 1).ToLocalChecked();
      if (callback->IsFunction()) {
        InstancerCallbackScope scope(*notice.owner);
        auto snapshot = Nan::New<v8::Object>();
        Nan::Set(snapshot,
                 Nan::New("type").ToLocalChecked(),
                 Nan::New(notice.type).ToLocalChecked())
            .FromJust();
        Nan::Set(snapshot,
                 Nan::New("id").ToLocalChecked(),
                 Nan::New(static_cast<int>(notice.id)))
            .FromJust();
        v8::Local<v8::Value> argument = snapshot;
        v8::Local<v8::Value> ignored;
        RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
        const bool called =
            callback.As<v8::Function>()
                ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 1, &argument)
                .ToLocal(&ignored);
        (void)called;
      }
      if (caught.HasCaught()) {
        CaptureCallbackException(caught.Exception());
      }
    }
  }
}

void ReleaseOwnedEvents() {
  const auto events = OwnedEvents();
  for (const auto& weak : events) {
    if (auto owner = weak.lock()) {
      InvalidateEvent(owner.get());
      owner->references.clear();
      owner->current_reference.reset();
      owner->owned.reset();
      ClearEventCallbackEdges(owner);
    }
  }
  OwnedEvents().clear();
  DrainEventInstancerReleases();
}

void ReleaseEventInstancers() {
  ChangedInstancers().clear();
  PendingReleases().clear();
  for (const auto& weak : Instancers()) {
    if (auto owner = weak.lock()) {
      owner->functions.Reset();
      owner->value.reset();
      owner->generation = 0;
    }
  }
  Registrations().clear();
  Instancers().clear();
  Allocations().clear();
}

NAN_MODULE_INIT(InitializeRmlEventInstancers) {
  SetInstancerValueMethod<CreateDefaultEvent>(target, "createDefaultEvent");
  SetRuntimeMethod<CreateInstancer>(target, "createEventInstancer");
  SetRuntimeMethod<RegisterInstancer>(target, "factoryRegisterEventInstancer");
  SetRuntimeMethod<InstanceEvent<true>>(target, "factoryInstanceEvent");
  SetInstancerValueMethod<InstanceEvent<false>>(target,
                                                "eventInstancerInstanceEvent");
  SetRuntimeMethod<ReleaseEvent, true>(target, "eventInstancerReleaseEvent");
  SetRuntimeMethod<ReleaseOwnedEvent, true>(target, "releaseOwnedEvent");
}

}  // namespace sfmlrmlui
