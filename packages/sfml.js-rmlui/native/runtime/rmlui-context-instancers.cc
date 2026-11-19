// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/runtime/rmlui-context-instancers.h"

#include <RmlUi/Core/ContextInstancer.h>
#include <RmlUi/Core/Factory.h>
#include <RmlUi/Core/TextInputHandler.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/platform/rmlui-text-input.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/runtime/rmlui-parent-observers.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/rmlui-script-object.h"

namespace sfmlrmlui {
namespace {

struct InstancerState {
  std::unique_ptr<Rml::ContextInstancer> value;
  v8::Global<v8::Array> functions;
  uint64_t generation{0};
  size_t native_roots{0};
  bool registered{false};
  bool active{false};
};

using InstancerHandle = sfmljs::SharedHandle<InstancerState>;
using OwnershipHandle = sfmljs::SharedHandle<ContextOwnership>;

struct Allocation {
  Rml::Context* context{nullptr};
  std::vector<std::shared_ptr<InstancerState>> chain;
  v8::Global<v8::Object> owner_handle;
  size_t rooted_entries{0};
  bool pending{false};
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
  static std::unordered_map<Rml::Context*, std::shared_ptr<Allocation>> values;
  return values;
}

auto& ChangedAllocations() {
  static std::vector<std::shared_ptr<Allocation>> values;
  return values;
}

void QueueOwnership(const std::shared_ptr<Allocation>& allocation) {
  if (!allocation->pending) {
    allocation->pending = true;
    ChangedAllocations().push_back(allocation);
  }
}

auto& PendingReleases() {
  struct Notice {
    std::shared_ptr<InstancerState> owner;
    Rml::String name;
  };
  static std::vector<Notice> values;
  return values;
}

class InstancerCallbackScope final {
 public:
  explicit InstancerCallbackScope(InstancerState* owner) : owner_(owner) {
    owner_->active = true;
    ++State().callback_depth;
    ++State().instancer_callback_depth;
  }
  ~InstancerCallbackScope() {
    --State().instancer_callback_depth;
    --State().callback_depth;
    owner_->active = false;
  }

 private:
  InstancerState* owner_;
};

bool ReadString(v8::Local<v8::Value> input, Rml::String* output) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a context name string");
    return false;
  }
  Nan::Utf8String text(input);
  output->assign(*text, text.length());
  return true;
}

std::shared_ptr<InstancerState> InstancerOf(v8::Local<v8::Value> input) {
  auto* handle = InstancerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a ContextInstancer");
    return {};
  }
  auto owner = handle->owner();
  if (!RuntimeReady()) {
    return {};
  }
  if (!owner->value || owner->generation != State().generation) {
    Nan::ThrowError("Context instancer is no longer valid");
    return {};
  }
  return owner;
}

auto FindAllocation(Rml::Context* context) {
  return Allocations().find(context);
}

Rml::ContextPtr TakeCandidate(v8::Local<v8::Value> input,
                              const std::shared_ptr<InstancerState>& owner,
                              const Rml::String& name,
                              Rml::RenderManager* manager,
                              Rml::TextInputHandler* handler) {
  auto* context = ContextOf(input);
  if (!context) {
    return {};
  }
  auto ownership = State().contexts.at(context)->ownership.lock();
  const auto found = FindAllocation(context);
  if (!ownership || !ownership->value || found == Allocations().end()) {
    Nan::ThrowTypeError(
        "Context instancer must return an owned ContextInstancer allocation");
    return {};
  }
  if (context->GetName() != name) {
    Nan::ThrowTypeError("Context instancer returned a different context name");
    return {};
  }
  if (&context->GetRenderManager() != manager ||
      context->GetTextInputHandler() != handler) {
    Nan::ThrowTypeError(
        "Context instancer returned a different manager or input handler");
    return {};
  }
  found->second->chain.push_back(owner);
  QueueOwnership(found->second);
  State().data_ownership_dirty = true;
  ++State().ownership_revision;
  for (const auto& entry : found->second->chain) {
    if (entry->functions.IsWeak()) {
      entry->functions.ClearWeak();
    }
  }
  auto result = std::move(ownership->value);
  NotifyElementSubtreeOwnership(context->GetRootElement());
  return result;
}

void ReleaseAllocation(Rml::Context* context) {
  std::vector<std::shared_ptr<InstancerState>> chain;
  const auto found = FindAllocation(context);
  if (found != Allocations().end()) {
    // Erase before native teardown can collect another owner or reenter.
    chain = found->second->chain;
    found->second->context = nullptr;
    QueueOwnership(found->second);
    Allocations().erase(found);
    for (size_t i = chain.size(); i > 1; --i) {
      PendingReleases().push_back({chain[i - 1], context->GetName()});
    }
  }
  ReleaseContextDocuments(context);
  // Neither native destruction nor V8 finalizers may execute release JS.
  delete context;
  InvalidateContext(context);
}

class NativeContextInstancer final : public Rml::ContextInstancer {
 public:
  std::weak_ptr<InstancerState> state;

  Rml::ContextPtr InstanceContext(const Rml::String& name,
                                  Rml::RenderManager* manager,
                                  Rml::TextInputHandler* handler) override {
    auto owner = state.lock();
    if (!owner) {
      return {};
    }
    if (owner->functions.IsEmpty()) {
      Rml::ContextPtr result(new Rml::Context(name, manager, handler));
      result->SetInstancer(this);
      auto allocation = std::make_shared<Allocation>();
      allocation->context = result.get();
      allocation->chain.push_back(owner);
      Allocations().emplace(result.get(), allocation);
      return result;
    }
    if (!CanInvokeCallback()) {
      return {};
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    Rml::ContextPtr result;
    if (owner->active) {
      Nan::ThrowError("Recursive context instancer callback");
    } else {
      InstancerCallbackScope scope(owner.get());
      const auto functions = owner->functions.Get(v8::Isolate::GetCurrent());
      const auto callback = Nan::Get(functions, 0).ToLocalChecked();
      v8::Local<v8::Value> args[] = {Nan::New(name).ToLocalChecked(),
                                     WrapRenderManager(manager),
                                     WrapTextInputHandler(handler)};
      v8::Local<v8::Value> candidate;
      RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
      if (callback.As<v8::Function>()
              ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 3, args)
              .ToLocal(&candidate) &&
          !candidate->IsNull()) {
        result = TakeCandidate(candidate, owner, name, manager, handler);
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    return result;
  }

  void ReleaseContext(Rml::Context* context) override {
    ReleaseAllocation(context);
  }

 private:
  // Factory borrows this adapter; the binding normally destroys its unique
  // owner after shutdown. Preserve Releasable semantics for native callers.
  void Release() override {
    if (auto owner = state.lock()) {
      owner->value.release();
      owner->generation = 0;
    }
    delete this;
  }
};

std::shared_ptr<InstancerState>& ConstructorInstancer() {
  static std::shared_ptr<InstancerState> owner;
  return owner;
}

NAN_METHOD(ConstructContext) {
  Rml::String name;
  if (!ReadString(info[0], &name)) {
    return;
  }
  auto manager = RenderManagerOf(info[1]);
  Rml::TextInputHandler* handler;
  if (!manager || !ReadTextInputHandler(info[2], &handler)) {
    return;
  }
  auto& owner = ConstructorInstancer();
  if (!owner) {
    owner = std::make_shared<InstancerState>();
    auto adapter = std::make_unique<NativeContextInstancer>();
    adapter->state = owner;
    owner->value = std::move(adapter);
    owner->generation = State().generation;
    Instancers().push_back(owner);
  }
  auto context = owner->value->InstanceContext(name, manager->value, handler);
  if (State().callback_exception.IsEmpty() && context) {
    info.GetReturnValue().Set(
        WrapOwnedContext(std::move(context), std::move(manager)));
  }
}

NAN_METHOD(GetContextHandler) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(
        WrapTextInputHandler(context->GetTextInputHandler()));
  }
}

NAN_METHOD(CreateInstancer) {
  if ((!info[0]->IsUndefined() && !info[0]->IsFunction()) ||
      (!info[1]->IsUndefined() && !info[1]->IsFunction()) ||
      (info[0]->IsUndefined() && info[1]->IsFunction())) {
    return Nan::ThrowTypeError("Expected context instancer callbacks");
  }
  auto owner = std::make_shared<InstancerState>();
  auto adapter = std::make_unique<NativeContextInstancer>();
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
    Nan::SetPrivate(
        handle,
        Nan::New("rml.context.instancer.functions").ToLocalChecked(),
        functions)
        .FromJust();
  }
  static size_t sweep_threshold = 64;
  if (Instancers().size() >= sweep_threshold) {
    std::erase_if(Instancers(),
                  [](const auto& weak) { return weak.expired(); });
    sweep_threshold = std::max<size_t>(64, Instancers().size() * 2);
  }
  Instancers().push_back(owner);
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(RegisterInstancer) {
  if (auto owner = InstancerOf(info[0])) {
    if (!owner->registered) {
      owner->registered = true;
      ++owner->native_roots;
      Registrations().push_back(owner);
    }
    if (owner->functions.IsWeak()) {
      owner->functions.ClearWeak();
    }
    Rml::Factory::RegisterContextInstancer(owner->value.get());
  }
}

template <bool use_factory>
NAN_METHOD(InstanceContext) {
  constexpr int start = use_factory ? 0 : 1;
  Rml::String name;
  if (!ReadString(info[start], &name)) {
    return;
  }
  auto manager = RenderManagerOf(info[start + 1]);
  Rml::TextInputHandler* handler;
  if (!manager || !ReadTextInputHandler(info[start + 2], &handler)) {
    return;
  }
  Rml::ContextPtr context;
  if constexpr (use_factory) {
    context = Rml::Factory::InstanceContext(name, manager->value, handler);
  } else {
    auto owner = InstancerOf(info[0]);
    if (!owner) {
      return;
    }
    if (owner->active) {
      return Nan::ThrowError("Recursive context instancer callback");
    }
    context = owner->value->InstanceContext(name, manager->value, handler);
  }
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  info.GetReturnValue().Set(context
                                ? v8::Local<v8::Value>(WrapOwnedContext(
                                      std::move(context), std::move(manager)))
                                : v8::Local<v8::Value>(Nan::Null()));
}

NAN_METHOD(ReleaseContext) {
  auto owner = InstancerOf(info[0]);
  auto* context = owner ? ContextOf(info[1]) : nullptr;
  if (!context) {
    return;
  }
  if (!IsOwnedContext(context)) {
    return Nan::ThrowTypeError(
        "Cannot release a registered or borrowed context");
  }
  const auto found = FindAllocation(context);
  if (found == Allocations().end() || found->second->chain.back() != owner) {
    return Nan::ThrowTypeError("Context was allocated by another instancer");
  }
  ReleaseOwnedContext(context);
}

}  // namespace

ContextOwnership::~ContextOwnership() {
  if (value) {
    auto* context = value.get();
    ReleaseContextDocuments(value.get());
    value.reset();
    InvalidateContext(context);
  }
}

bool IsOwnedContext(Rml::Context* context) {
  const auto found = State().contexts.find(context);
  if (found == State().contexts.end()) {
    return false;
  }
  auto owner = found->second->ownership.lock();
  return owner && owner->value;
}

bool ReleaseOwnedContext(Rml::Context* context) {
  auto owner = State().contexts.at(context)->ownership.lock();
  if (!owner || !owner->value) {
    return false;
  }
  ReleaseContextDocuments(context);
  owner->value.reset();
  InvalidateContext(context);
  return true;
}

v8::Local<v8::Object> WrapOwnedContext(
    Rml::ContextPtr context, std::shared_ptr<RenderManagerState> manager) {
  auto owner = std::make_shared<ContextOwnership>();
  owner->value = std::move(context);
  owner->manager = std::move(manager);
  auto handle = WrapContext(owner->value.get());
  const auto token = State().contexts.at(owner->value.get());
  token->ownership = owner;
  TrackContextTextInputHandler(token);
  State().data_ownership_dirty = true;
  ++State().ownership_revision;
  NotifyElementSubtreeOwnership(owner->value->GetRootElement());
  const auto allocation = FindAllocation(owner->value.get());
  if (allocation != Allocations().end()) {
    QueueOwnership(allocation->second);
  }
  token->render_interface = owner->manager->render_interface;
  // Bare Factory creation retains native dimensions (0, 0) and explicit DPI.
  token->automatic_density = false;
  Nan::SetPrivate(handle,
                  Nan::New("rml.context.ownership").ToLocalChecked(),
                  OwnershipHandle::Create(std::move(owner)))
      .FromJust();
  BindOwnedContextScriptObject(token->context, handle);
  return handle;
}

void ReleaseOwnedContexts() {
  std::vector<std::shared_ptr<ContextOwnership>> owners;
  for (const auto& [context, token] : State().contexts) {
    if (auto owner = token->ownership.lock(); owner && owner->value) {
      owners.push_back(std::move(owner));
    }
  }
  for (const auto& owner : owners) {
    ReleaseOwnedContext(owner->value.get());
  }
}

void RefreshContextInstancerOwnership() {
  if (State().cleaning_up || ChangedAllocations().empty()) {
    return;
  }
  RecordDiagnosticOwnership(DiagnosticOwnership::kContextInstancer);
  auto allocations = std::move(ChangedAllocations());
  ChangedAllocations().clear();
  std::unordered_map<InstancerState*, std::shared_ptr<InstancerState>> changed;
  for (const auto& allocation : allocations) {
    allocation->pending = false;
    for (const auto& instancer : allocation->chain) {
      changed.emplace(instancer.get(), instancer);
      if (!instancer->functions.IsEmpty() && instancer->functions.IsWeak()) {
        instancer->functions.ClearWeak();
      }
    }
  }
  const auto key = Nan::New("rml.context.instancer.owners").ToLocalChecked();
  for (const auto& allocation : allocations) {
    RecordDiagnosticLeaseVisit(DiagnosticOwnership::kContextInstancer);
    for (size_t i = 0; i < allocation->rooted_entries; ++i) {
      --allocation->chain[i]->native_roots;
    }
    allocation->rooted_entries = 0;
    // Keep the old local wrapper alive until every replacement edge is ready.
    v8::Local<v8::Object> previous;
    if (!allocation->owner_handle.IsEmpty()) {
      previous = allocation->owner_handle.Get(v8::Isolate::GetCurrent());
    }
    allocation->owner_handle.Reset();
    const bool live =
        allocation->context && State().contexts.contains(allocation->context);
    v8::Local<v8::Object> handle;
    if (live && IsOwnedContext(allocation->context)) {
      handle = WrapContext(allocation->context);
      auto functions = Nan::New<v8::Array>();
      for (const auto& instancer : allocation->chain) {
        if (!instancer->functions.IsEmpty()) {
          Nan::Set(functions,
                   functions->Length(),
                   instancer->functions.Get(v8::Isolate::GetCurrent()))
              .FromJust();
        }
      }
      Nan::SetPrivate(handle, key, functions).FromJust();
      allocation->owner_handle.Reset(v8::Isolate::GetCurrent(), handle);
      allocation->owner_handle.SetWeak();
    } else if (live) {
      for (const auto& instancer : allocation->chain) {
        ++instancer->native_roots;
      }
      allocation->rooted_entries = allocation->chain.size();
    }
    if (!previous.IsEmpty() && previous != handle) {
      Nan::SetPrivate(previous, key, Nan::Undefined()).FromJust();
    }
  }
  for (const auto& [pointer, instancer] : changed) {
    if (!instancer->functions.IsEmpty() && !instancer->native_roots &&
        !instancer->functions.IsWeak()) {
      instancer->functions.SetWeak();
    }
  }
}

void DrainContextInstancerReleases() {
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
        InstancerCallbackScope scope(notice.owner.get());
        auto snapshot = Nan::New<v8::Object>();
        Nan::Set(snapshot,
                 Nan::New("name").ToLocalChecked(),
                 Nan::New(notice.name).ToLocalChecked())
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

void ReleaseContextInstancers() {
  PendingReleases().clear();
  ChangedAllocations().clear();
  for (const auto& weak : Instancers()) {
    if (auto owner = weak.lock()) {
      owner->functions.Reset();
      owner->value.reset();
      owner->generation = 0;
    }
  }
  Registrations().clear();
  Instancers().clear();
  ConstructorInstancer().reset();
  Allocations().clear();
}

NAN_MODULE_INIT(InitializeRmlContextInstancers) {
  SetInstancerValueMethod<ConstructContext>(target, "constructContext");
  SetInstancerValueMethod<GetContextHandler>(target,
                                             "getContextTextInputHandler");
  SetRuntimeMethod<CreateInstancer>(target, "createContextInstancer");
  SetRuntimeMethod<RegisterInstancer>(target,
                                      "factoryRegisterContextInstancer");
  SetRuntimeMethod<InstanceContext<true>>(target, "factoryInstanceContext");
  SetInstancerValueMethod<InstanceContext<false>>(
      target, "contextInstancerInstanceContext");
  SetRuntimeMethod<ReleaseContext>(target, "contextInstancerReleaseContext");
}

}  // namespace sfmlrmlui
