// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/dom/elements/rmlui-element-instancers.h"

#include <RmlUi/Core/ElementInstancer.h>
#include <RmlUi/Core/ElementText.h>
#include <RmlUi/Core/Elements/ElementForm.h>
#include <RmlUi/Core/Elements/ElementFormControl.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>
#include <RmlUi/Core/Elements/ElementFormControlSelect.h>
#include <RmlUi/Core/Elements/ElementFormControlTextArea.h>
#include <RmlUi/Core/Elements/ElementProgress.h>
#include <RmlUi/Core/Elements/ElementTabSet.h>
#include <RmlUi/Core/Factory.h>
#include <RmlUi/Lottie/ElementLottie.h>
#include <RmlUi/SVG/ElementSVG.h>
#include <nan.h>

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/animation/rmlui-animation-values.h"
#include "native/runtime/rmlui-callback-leases.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-instancer.h"
#include "native/scripting/lua/rmlui-lua-variant.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

struct InstancerState {
  ~InstancerState();
  Rml::ElementInstancer* value{nullptr};
  std::shared_ptr<Rml::ElementInstancer> owned;
  v8::Global<v8::Object> handle;
  v8::Global<v8::Array> functions;
  uint64_t generation{0};
  size_t native_roots{0};
  bool registered{false};
  bool active{false};
  bool observes_release{false};
  bool tracks_allocations{false};
};

using InstancerHandle = sfmljs::SharedHandle<InstancerState>;
using InstancerOwners =
    CallbackLeaseOwners<InstancerState, v8::Array, &InstancerState::functions>;

auto& Owners() {
  static InstancerOwners owners("rml.detached.element.instancers");
  return owners;
}

class ElementInstancerRelay final : public Rml::ElementInstancer {
 public:
  explicit ElementInstancerRelay(Rml::Element* element) : element_(element) {}
  Rml::ElementPtr InstanceElement(
      Rml::Element* parent,
      const Rml::String& tag,
      const Rml::XMLAttributes& attributes) override;
  void ReleaseElement(Rml::Element* element) override;

 private:
  Rml::Element* element_;
};

struct Allocation {
  Rml::ObserverPtr<Rml::Element> element;
  // Last entry releases first. Delegation preserves pooled native allocators
  // and composes nested JS instancers without guessing the dynamic subtype.
  std::vector<std::shared_ptr<InstancerState>> chain;
  std::vector<std::shared_ptr<InstancerOwners::Lease>> leases;
  std::shared_ptr<ElementInstancerRelay> relay;
  bool pending_release{false};
};

auto& Instancers() {
  static std::unordered_map<Rml::ElementInstancer*,
                            std::weak_ptr<InstancerState>>
      values;
  return values;
}

InstancerState::~InstancerState() {
  const auto found = Instancers().find(value);
  if (found != Instancers().end() && found->second.expired()) {
    Instancers().erase(found);
  }
}

auto& RegisteredInstancers() {
  static std::vector<std::shared_ptr<InstancerState>> values;
  return values;
}

auto& TypedInstancers() {
  static std::unordered_map<Rml::String, std::shared_ptr<InstancerState>>
      values;
  return values;
}

template <typename Allocator>
std::shared_ptr<InstancerState> MakeTypedInstancer() {
  auto owner = std::make_shared<InstancerState>();
  owner->owned = std::make_shared<Allocator>();
  owner->value = owner->owned.get();
  owner->generation = State().generation;
  Instancers()[owner->value] = owner;
  return owner;
}

std::shared_ptr<InstancerState> TypedInstancer(const Rml::String& type) {
  const auto found = TypedInstancers().find(type);
  if (found != TypedInstancers().end()) {
    return found->second;
  }
  std::shared_ptr<InstancerState> owner;
  if (type == "Element") {
    owner = MakeTypedInstancer<Rml::ElementInstancerElement>();
  } else if (type == "ElementText") {
    owner = MakeTypedInstancer<Rml::ElementInstancerText>();
  } else if (type == "Document") {
    owner = MakeTypedInstancer<
        Rml::ElementInstancerGeneric<Rml::ElementDocument>>();
  } else if (type == "ElementForm") {
    owner =
        MakeTypedInstancer<Rml::ElementInstancerGeneric<Rml::ElementForm>>();
  } else if (type == "ElementFormControlInput") {
    owner = MakeTypedInstancer<
        Rml::ElementInstancerGeneric<Rml::ElementFormControlInput>>();
  } else if (type == "ElementFormControlSelect") {
    owner = MakeTypedInstancer<
        Rml::ElementInstancerGeneric<Rml::ElementFormControlSelect>>();
  } else if (type == "ElementFormControlTextArea") {
    owner = MakeTypedInstancer<
        Rml::ElementInstancerGeneric<Rml::ElementFormControlTextArea>>();
  } else if (type == "ElementProgress") {
    owner = MakeTypedInstancer<
        Rml::ElementInstancerGeneric<Rml::ElementProgress>>();
  } else if (type == "ElementSVG") {
    owner = MakeTypedInstancer<Rml::ElementInstancerGeneric<Rml::ElementSVG>>();
  } else if (type == "ElementLottie") {
    owner =
        MakeTypedInstancer<Rml::ElementInstancerGeneric<Rml::ElementLottie>>();
  } else if (type == "ElementTabSet") {
    owner =
        MakeTypedInstancer<Rml::ElementInstancerGeneric<Rml::ElementTabSet>>();
  } else if (type == "ElementFormControl") {
    Nan::ThrowTypeError("ElementFormControl is an abstract native class");
    return {};
  } else {
    Nan::ThrowTypeError("Expected a concrete native Element class");
    return {};
  }
  TypedInstancers().emplace(type, owner);
  return owner;
}

auto& Allocations() {
  static std::unordered_map<Rml::Element*, Allocation> values;
  return values;
}

auto& PendingReleases() {
  struct Notice {
    std::shared_ptr<InstancerState> instancer;
    Rml::String tag;
    Rml::XMLAttributes attributes;
  };
  static std::vector<Notice> values;
  return values;
}

class InstancerCallbackScope final {
 public:
  explicit InstancerCallbackScope(InstancerState* state) : state_(state) {
    state_->active = true;
    ++State().callback_depth;
    ++State().instancer_callback_depth;
  }
  ~InstancerCallbackScope() {
    --State().instancer_callback_depth;
    --State().callback_depth;
    state_->active = false;
  }

 private:
  InstancerState* state_;
};

bool ReadString(v8::Local<v8::Value> input, Rml::String* output) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected an element instancer string");
    return false;
  }
  Nan::Utf8String text(input);
  output->assign(*text, text.length());
  return true;
}

std::shared_ptr<InstancerState> InstancerOf(v8::Local<v8::Value> input) {
  auto* handle = InstancerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an ElementInstancer");
    return {};
  }
  auto owner = handle->owner();
  if (!RuntimeReady()) {
    return {};
  }
  if (!owner->value || owner->generation != State().generation) {
    Nan::ThrowError("Element instancer is no longer valid");
    return {};
  }
  return owner;
}

v8::Local<v8::Object> WrapInstancer(
    const std::shared_ptr<InstancerState>& owner) {
  if (!owner->handle.IsEmpty()) {
    return owner->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = InstancerHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  if (LuaHostForElementInstancer(owner->value)) {
    Rml::InvalidateCallbackResourcesForBinding();
  }
  if (!owner->functions.IsEmpty()) {
    Nan::SetPrivate(
        handle,
        Nan::New("rml.element.instancer.functions").ToLocalChecked(),
        owner->functions.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  return handle;
}

v8::MaybeLocal<v8::Object> AttributesToJs(
    const Rml::XMLAttributes& attributes) {
  // Copy first: producing Variant wrappers allocates and can trigger GC.
  const auto snapshot = attributes;
  auto result = Nan::New<v8::Object>();
  for (const auto& [name, value] : snapshot) {
    v8::Local<v8::Value> converted;
    if (!VariantToJs(value).ToLocal(&converted) ||
        !result
             ->CreateDataProperty(Nan::GetCurrentContext(),
                                  Nan::New(name).ToLocalChecked(),
                                  converted)
             .FromMaybe(false)) {
      return {};
    }
  }
  return result;
}

Rml::ElementPtr TakeCandidate(v8::Local<v8::Value> input,
                              const std::shared_ptr<InstancerState>& owner) {
  auto* handle = ElementHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError(
        "Element instancer must return an owned Element or null");
    return {};
  }
  auto token = handle->owner();
  if (token->generation != State().generation || !token->element) {
    Nan::ThrowError("Element instancer returned an invalid element");
    return {};
  }
  auto* element = token->element.get();
  if (!token->owned || element->GetParentNode()) {
    Nan::ThrowTypeError("Element instancer requires a detached owned element");
    return {};
  }
  const auto found = Allocations().find(element);
  if (found == Allocations().end() || !found->second.element ||
      found->second.pending_release) {
    Nan::ThrowTypeError(
        "Return an element allocated by a native constructor or instancer");
    return {};
  }
  if (!CanTransferElement(element, State().active_elements.size())) {
    return {};
  }
  found->second.chain.push_back(owner);
  found->second.leases.push_back(Owners().Add(owner, element));
  // Keep callbacks alive between this return and parser insertion/wrapping.
  if (owner->functions.IsWeak()) {
    owner->functions.ClearWeak();
  }
  return std::move(token->owned);
}

void ObserveRelease(const std::shared_ptr<InstancerState>& owner,
                    const Rml::String& tag,
                    const Rml::XMLAttributes& values) {
  if (CanInvokeCallback() && !owner->functions.IsEmpty()) {
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    const auto functions = owner->functions.Get(v8::Isolate::GetCurrent());
    const auto callback = Nan::Get(functions, 1).ToLocalChecked();
    if (callback->IsFunction()) {
      InstancerCallbackScope scope(owner.get());
      auto snapshot = Nan::New<v8::Object>();
      v8::Local<v8::Object> attributes;
      if (AttributesToJs(values).ToLocal(&attributes)) {
        snapshot
            ->CreateDataProperty(Nan::GetCurrentContext(),
                                 Nan::New("tagName").ToLocalChecked(),
                                 Nan::New(tag).ToLocalChecked())
            .FromJust();
        snapshot
            ->CreateDataProperty(Nan::GetCurrentContext(),
                                 Nan::New("attributes").ToLocalChecked(),
                                 attributes)
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
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }
}

void TrackAllocation(Rml::Element* element,
                     const std::shared_ptr<InstancerState>& owner) {
  Allocation allocation;
  allocation.element = element->GetObserverPtr();
  allocation.chain.push_back(owner);
  if (!owner->functions.IsEmpty()) {
    allocation.leases.push_back(Owners().Add(owner, element));
  }
  allocation.relay = std::make_shared<ElementInstancerRelay>(element);
  // Upstream SetInstancer keeps the FIRST pointer, including across delegation.
  // The relay is therefore installed before exposing a newly allocated node.
  element->SetInstancer(allocation.relay.get());
  Allocations()[element] = std::move(allocation);
}

// Pure virtual values execute entirely in Native. The attribute is owned by
// the element, so data-attr bindings and cloned attributes use the same state.
class AttributeFormControl final : public Rml::ElementFormControl {
 public:
  AttributeFormControl(const Rml::String& tag,
                       const Rml::String& value_attribute)
      : Rml::ElementFormControl(tag), value_attribute_(value_attribute) {}

  Rml::String GetValue() const override {
    return GetAttribute<Rml::String>(value_attribute_, "");
  }

  void SetValue(const Rml::String& value) override {
    SetAttribute(value_attribute_, value);
  }

 private:
  Rml::String value_attribute_;
};

class AttributeFormControlInstancer final : public Rml::ElementInstancer {
 public:
  AttributeFormControlInstancer(const std::shared_ptr<InstancerState>& state,
                                Rml::String value_attribute)
      : state_(state), value_attribute_(std::move(value_attribute)) {}

  Rml::ElementPtr InstanceElement(Rml::Element*,
                                  const Rml::String& tag,
                                  const Rml::XMLAttributes&) override {
    auto owner = state_.lock();
    if (!owner) {
      return {};
    }
    Rml::ElementPtr element(new AttributeFormControl(tag, value_attribute_));
    // Factory/parser paths also enter here. Install provenance exactly once,
    // before Factory's first-only SetInstancer and attribute application.
    TrackAllocation(element.get(), owner);
    return element;
  }

  void ReleaseElement(Rml::Element* element) override {
    delete static_cast<AttributeFormControl*>(element);
  }

 private:
  std::weak_ptr<InstancerState> state_;
  Rml::String value_attribute_;
};

void ReleaseAllocation(Rml::Element* element) {
  const auto found = Allocations().find(element);
  if (found == Allocations().end()) {
    return;
  }
  // Hold the relay across its own ReleaseElement call and allocator callbacks.
  const auto relay = found->second.relay;
  auto chain = found->second.chain;
  found->second.pending_release = true;
  for (size_t i = chain.size(); i > 1; --i) {
    if (chain[i - 1]->observes_release) {
      PendingReleases().push_back(
          {chain[i - 1], element->GetTagName(), element->GetAttributes()});
    }
  }
  Allocations().erase(element);
  // Never call JS from a native destructor, even if GC happens inside an
  // active native callback. Native destruction retains upstream timing.
  chain.front()->value->ReleaseElement(element);
}

Rml::ElementPtr ElementInstancerRelay::InstanceElement(
    Rml::Element* parent,
    const Rml::String& tag,
    const Rml::XMLAttributes& attributes) {
  // Native attribute controls clone their original concrete implementation.
  // Replaying a JS delegate can select a different attribute key later.
  const auto chain = Allocations().at(element_).chain;
  if (chain.front()->tracks_allocations) {
    auto element =
        chain.front()->value->InstanceElement(parent, tag, attributes);
    if (element) {
      auto& allocation = Allocations().at(element.get());
      for (size_t i = 1; i < chain.size(); ++i) {
        allocation.chain.push_back(chain[i]);
        allocation.leases.push_back(Owners().Add(chain[i], element.get()));
        if (chain[i]->functions.IsWeak()) {
          chain[i]->functions.ClearWeak();
        }
      }
    }
    return element;
  }
  const auto owner = chain.back();
  auto element = owner->value->InstanceElement(parent, tag, attributes);
  if (element && owner->functions.IsEmpty() && !owner->tracks_allocations) {
    TrackAllocation(element.get(), owner);
  }
  return element;
}

void ElementInstancerRelay::ReleaseElement(Rml::Element* element) {
  ReleaseAllocation(element);
}

class JavaScriptElementInstancer final : public Rml::ElementInstancer {
 public:
  Rml::ElementPtr InstanceElement(
      Rml::Element* parent,
      const Rml::String& tag,
      const Rml::XMLAttributes& attributes) override {
    auto owner = state.lock();
    if (!owner || !CanInvokeCallback() || owner->functions.IsEmpty()) {
      return {};
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    Rml::ElementPtr result;
    if (owner->active) {
      Nan::ThrowError("Recursive element instancer callback");
    } else {
      InstancerCallbackScope scope(owner.get());
      const auto functions = owner->functions.Get(v8::Isolate::GetCurrent());
      v8::Local<v8::Object> copied;
      if (AttributesToJs(attributes).ToLocal(&copied)) {
        v8::Local<v8::Value> arguments[] = {WrapNullableElement(parent),
                                            Nan::New(tag).ToLocalChecked(),
                                            copied};
        v8::Local<v8::Value> returned;
        RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
        if (Nan::Get(functions, 0)
                .ToLocalChecked()
                .As<v8::Function>()
                ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 3, arguments)
                .ToLocal(&returned) &&
            !returned->IsNull()) {
          result = TakeCandidate(returned, owner);
        }
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    return result;
  }

  void ReleaseElement(Rml::Element* element) override {
    ReleaseAllocation(element);
  }

  std::weak_ptr<InstancerState> state;
};

NAN_METHOD(CreateInstancer) {
  if (!info[0]->IsFunction() ||
      (!info[1]->IsUndefined() && !info[1]->IsFunction())) {
    return Nan::ThrowTypeError("Expected element instancer callbacks");
  }
  auto owner = std::make_shared<InstancerState>();
  auto instancer = std::make_shared<JavaScriptElementInstancer>();
  instancer->state = owner;
  owner->value = instancer.get();
  owner->owned = std::move(instancer);
  owner->generation = State().generation;
  owner->observes_release = info[1]->IsFunction();
  auto functions = Nan::New<v8::Array>(2);
  functions->CreateDataProperty(Nan::GetCurrentContext(), 0, info[0])
      .FromJust();
  functions->CreateDataProperty(Nan::GetCurrentContext(), 1, info[1])
      .FromJust();
  owner->functions.Reset(v8::Isolate::GetCurrent(), functions);
  owner->functions.SetWeak();
  std::erase_if(Instancers(),
                [](const auto& entry) { return entry.second.expired(); });
  Instancers()[owner->value] = owner;
  info.GetReturnValue().Set(WrapInstancer(owner));
}

NAN_METHOD(CreateFormControlInstancer) {
  Rml::String value_attribute;
  if (!ReadString(info[0], &value_attribute)) {
    return;
  }
  if (value_attribute.empty() ||
      value_attribute.find('\0') != Rml::String::npos) {
    return Nan::ThrowTypeError(
        "Expected a non-empty value attribute without null characters");
  }
  auto owner = std::make_shared<InstancerState>();
  owner->owned = std::make_shared<AttributeFormControlInstancer>(
      owner, std::move(value_attribute));
  owner->value = owner->owned.get();
  owner->generation = State().generation;
  owner->tracks_allocations = true;
  Instancers()[owner->value] = owner;
  info.GetReturnValue().Set(WrapInstancer(owner));
}

NAN_METHOD(GetInstancer) {
  Rml::String name;
  if (!ReadString(info[0], &name)) {
    return;
  }
  auto* pointer = Rml::Factory::GetElementInstancer(name);
  if (!pointer) {
    info.GetReturnValue().SetNull();
    return;
  }
  auto owner = Instancers()[pointer].lock();
  if (!owner) {
    owner = std::make_shared<InstancerState>();
    owner->value = pointer;
    owner->owned = RetainLuaElementInstancer(pointer);
    owner->tracks_allocations = owner->owned != nullptr;
    owner->generation = State().generation;
    Instancers()[pointer] = owner;
  }
  info.GetReturnValue().Set(WrapInstancer(owner));
}

NAN_METHOD(RegisterInstancer) {
  Rml::String name;
  if (!ReadString(info[0], &name)) {
    return;
  }
  if (info[1]->IsNull()) {
    Rml::Factory::RegisterElementInstancer(name, nullptr);
    NotifyLuaInstancerRegistration(name, nullptr);
    return;
  }
  auto owner = InstancerOf(info[1]);
  if (!owner) {
    return;
  }
  Rml::Factory::RegisterElementInstancer(name, owner->value);
  NotifyLuaInstancerRegistration(name, owner->value);
  if (!owner->registered) {
    owner->registered = true;
    ++owner->native_roots;
    if (!owner->functions.IsEmpty() && owner->functions.IsWeak()) {
      owner->functions.ClearWeak();
    }
    RegisteredInstancers().push_back(std::move(owner));
  }
}

NAN_METHOD(InstanceElement) {
  Rml::String tag;
  Rml::XMLAttributes attributes;
  if (!ReadString(info[2], &tag) ||
      !ReadElementAttributes(info[3], &attributes)) {
    return;
  }
  auto owner = InstancerOf(info[0]);
  auto* parent = info[1]->IsNull() ? nullptr : ElementOf(info[1]);
  if (!owner || (!parent && !info[1]->IsNull())) {
    return;
  }
  if (owner->active) {
    return Nan::ThrowError("Recursive element instancer callback");
  }
  RefreshElementOwnership();
  auto element = owner->value->InstanceElement(parent, tag, attributes);
  if (element && owner->functions.IsEmpty() && !owner->tracks_allocations) {
    TrackAllocation(element.get(), owner);
  }
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (!element) {
    info.GetReturnValue().SetNull();
    return;
  }
  RebindClonedElementTweens(element.get());
  auto* pointer = element.get();
  auto handle = WrapOwnedElement(std::move(element));
  RefreshElementSubtreeOwnership(pointer);
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(ConstructElement) {
  const auto generation = State().generation;
  if (!info[3]->IsBigInt() ||
      info[3].As<v8::BigInt>()->Uint64Value() != generation) {
    return Nan::ThrowError("Runtime changed while reading element attributes");
  }
  Rml::String type;
  Rml::String tag;
  Rml::XMLAttributes attributes;
  if (!ReadString(info[0], &type) || !ReadString(info[1], &tag) ||
      !ReadElementAttributes(info[2], &attributes) || !RuntimeReady()) {
    return;
  }
  if (generation != State().generation) {
    return Nan::ThrowError("Runtime changed while reading element attributes");
  }
  RefreshElementOwnership();
  auto owner = TypedInstancer(type);
  if (!owner) {
    return;
  }
  auto element = owner->value->InstanceElement(nullptr, tag, attributes);
  if (!element) {
    return Nan::ThrowError("Failed to instance native element");
  }
  // Establish release provenance before attributes can build child widgets or
  // invoke host instancers. Failure unwinds through the original allocator.
  TrackAllocation(element.get(), owner);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  for (auto& [name, value] : attributes) {
    RebindVariantTweens(&value, element.get());
  }
  // Even the empty map initializes Input's native default text implementation.
  element->SetAttributes(attributes);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  auto* pointer = element.get();
  auto handle = WrapOwnedElement(std::move(element));
  RefreshElementSubtreeOwnership(pointer);
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(GetConstructionGeneration) {
  info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(
      v8::Isolate::GetCurrent(), State().generation));
}

std::shared_ptr<ElementState> DetachedElement(v8::Local<v8::Value> value) {
  auto* handle = ElementHandle::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a detached owned element");
    return {};
  }
  auto token = handle->owner();
  if (!token->element || token->generation != State().generation) {
    Nan::ThrowError("Element is no longer valid");
    return {};
  }
  auto* element = token->element.get();
  if (!token->owned || element->GetParentNode()) {
    Nan::ThrowTypeError("Expected a detached owned element");
    return {};
  }
  return token;
}

NAN_METHOD(ReleaseElement) {
  auto owner = InstancerOf(info[0]);
  if (!owner) {
    return;
  }
  auto token = DetachedElement(info[1]);
  if (!token) {
    return;
  }
  auto* element = token->element.get();
  const auto found = Allocations().find(element);
  if (found == Allocations().end() &&
      LuaInstancerOwnsElement(owner->value, element)) {
    if (CanTransferElement(element, State().active_elements.size())) {
      ReleaseDetachedElement(token);
    }
    return;
  }
  if (found == Allocations().end() || found->second.chain.empty() ||
      found->second.chain.back() != owner) {
    return Nan::ThrowTypeError("Element belongs to another instancer");
  }
  if (!CanTransferElement(element, State().active_elements.size())) {
    return;
  }
  ReleaseDetachedElement(token);
}

NAN_METHOD(ReleaseOwnedElement) {
  auto token = DetachedElement(info[0]);
  if (token && CanTransferElement(token->element.get(),
                                  State().active_elements.size())) {
    ReleaseDetachedElement(token);
  }
}

}  // namespace

void DrainElementInstancerReleases() {
  while (!PendingReleases().empty()) {
    auto pending = std::move(PendingReleases());
    PendingReleases().clear();
    for (const auto& notice : pending) {
      ObserveRelease(notice.instancer, notice.tag, notice.attributes);
    }
  }
}

void RefreshElementInstancerOwnership() {
  Owners().Refresh(DiagnosticOwnership::kElementInstancer);
}

void AppendElementInstancerLuaVariantOwners(
    LuaVariantOwnerCollector* collector) {
  for (const auto& [pointer, weak] : Instancers()) {
    const auto instancer = weak.lock();
    const auto host = LuaHostForElementInstancer(pointer);
    if (instancer && host && !instancer->handle.IsEmpty()) {
      AppendLuaVariantOwner(
          host, instancer->handle.Get(v8::Isolate::GetCurrent()), collector);
    }
  }
}

void ReleaseTypedElementInstancers() {
  for (const auto& [type, owner] : TypedInstancers()) {
    Instancers().erase(owner->value);
    owner->owned.reset();
    owner->value = nullptr;
    owner->generation = 0;
  }
  TypedInstancers().clear();
}

void ReleaseElementInstancers() {
  DrainElementInstancerReleases();
  Owners().Clear();
  for (const auto& [pointer, weak] : Instancers()) {
    if (auto owner = weak.lock()) {
      if (!owner->functions.IsEmpty()) {
        auto functions = owner->functions.Get(v8::Isolate::GetCurrent());
        for (uint32_t i = 0; i < 2; ++i) {
          functions
              ->CreateDataProperty(
                  Nan::GetCurrentContext(), i, Nan::Undefined())
              .FromJust();
        }
      }
      owner->functions.Reset();
      if (!owner->handle.IsEmpty()) {
        ClearLuaVariantOwner(owner->handle.Get(v8::Isolate::GetCurrent()));
      }

      owner->handle.Reset();
      owner->owned.reset();
      owner->value = nullptr;
      owner->generation = 0;
    }
  }
  Allocations().clear();
  RegisteredInstancers().clear();
  TypedInstancers().clear();
  Instancers().clear();
}

NAN_MODULE_INIT(InitializeRmlElementInstancers) {
  SetRuntimeMethod<GetConstructionGeneration, true, true, false, true>(
      target, "getElementConstructionGeneration");
  SetRuntimeMethod<ConstructElement, true, true, false, true>(
      target, "constructElement");
  SetRuntimeMethod<ReleaseOwnedElement>(target, "releaseOwnedElement");
  SetRuntimeMethod<CreateInstancer, true>(target, "createElementInstancer");
  SetRuntimeMethod<CreateFormControlInstancer, true>(
      target, "createFormControlInstancer");
  SetRuntimeMethod<GetInstancer, true, true, false, true>(
      target, "factoryGetElementInstancer");
  SetRuntimeMethod<RegisterInstancer>(target,
                                      "factoryRegisterElementInstancer");
  SetRuntimeMethod<InstanceElement, true, true, false, true>(
      target, "elementInstancerInstanceElement");
  SetRuntimeMethod<ReleaseElement>(target, "elementInstancerReleaseElement");
}

}  // namespace sfmlrmlui
