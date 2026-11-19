// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/runtime/rmlui-plugin.h"

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Plugin.h>
#include <sfml-js-interop.h>

#include <array>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

enum Method {
  kEventClasses,
  kInitialise,
  kShutdown,
  kContextCreate,
  kContextDestroy,
  kDocumentOpen,
  kDocumentLoad,
  kDocumentUnload,
  kElementCreate,
  kElementDestroy,
  kDataModelCreate,
  kDataModelDestroy,
  kCount,
};

struct PluginState : std::enable_shared_from_this<PluginState> {
  std::unique_ptr<Rml::Plugin> value;
  v8::Global<v8::Array> functions;
  std::array<bool, kCount> methods{};
  uint64_t generation{0};
  int event_classes{Rml::Plugin::EVT_ALL};
  bool alive{true};
  bool registered{false};
  bool registering{false};
  bool unregistering{false};
  bool cancelled{false};
  bool capture_mask{false};
};
using PluginHandle = sfmljs::SharedHandle<PluginState>;

auto& Plugins() {
  static std::vector<std::weak_ptr<PluginState>> values;
  return values;
}
auto& Registrations() {
  static std::unordered_map<PluginState*, std::shared_ptr<PluginState>> values;
  return values;
}
auto& Retired() {
  static std::vector<std::shared_ptr<PluginState>> values;
  return values;
}
uint64_t Generation() {
  return State().generation + (State().initialized ? 0 : 1);
}

// Each invocation owns separate argument handles. Nested notification calls
// cannot revive or invalidate another invocation's borrowed handles.
class PluginCallbackScope final {
 public:
  PluginCallbackScope() {
    ++State().callback_depth;
    ++State().plugin_callback_depth;
  }
  ~PluginCallbackScope() {
    if (element_) {
      element_->element.reset();
    }
    if (context_) {
      context_->context = nullptr;
      context_->dimensions = {0, 0};
    }
    --State().plugin_callback_depth;
    --State().callback_depth;
  }
  v8::Local<v8::Object> Context(Rml::Context* context) {
    // Model lookup and numeric views use the canonical Native context state.
    // Its alias is separate and is invalidated at the end of this callback.
    WrapContext(context);
    context_ = std::make_shared<ContextState>();
    context_->context = context;
    context_->generation = State().generation;
    context_->name = context->GetName();
    context_->dimensions = context->GetDimensions();
    return ContextHandle::Create(context_);
  }
  v8::Local<v8::Object> Element(Rml::Element* element) {
    element_ = std::make_shared<ElementState>();
    element_->element = element->GetObserverPtr();
    element_->generation = State().generation;
    return ElementHandle::Create(element_);
  }

 private:
  std::shared_ptr<ContextState> context_;
  std::shared_ptr<ElementState> element_;
};

NAN_METHOD(IgnoreAsyncResult) {}

class NativePlugin final : public Rml::Plugin {
 public:
  explicit NativePlugin(PluginState* owner) : owner_(owner) {}

  int GetEventClasses() override {
    if (owner_->capture_mask) {
      owner_->capture_mask = false;
      Invoke(kEventClasses);
    }
    return owner_->event_classes;
  }
  void OnInitialise() override { Invoke(kInitialise); }
  void OnShutdown() override {
    // Core already removed the registry entry. Remove the binding root before
    // invoking JS so recursive self-removal is an idempotent no-op.
    auto owner = owner_->shared_from_this();
    owner->registered = false;
    const auto found = Registrations().find(owner.get());
    if (found != Registrations().end()) {
      Retired().push_back(std::move(found->second));
      Registrations().erase(found);
    }
    owner->unregistering = true;
    Invoke(kShutdown);
    owner->unregistering = false;
  }
  void OnContextCreate(Rml::Context* context) override {
    Invoke(kContextCreate, context);
  }
  void OnContextDestroy(Rml::Context* context) override {
    Invoke(kContextDestroy, context);
  }
  void OnDocumentOpen(Rml::Context* context, const Rml::String& path) override {
    Invoke(kDocumentOpen, context, nullptr, &path);
  }
  void OnDocumentLoad(Rml::ElementDocument* document) override {
    Invoke(kDocumentLoad, nullptr, document);
  }
  void OnDocumentUnload(Rml::ElementDocument* document) override {
    Invoke(kDocumentUnload, nullptr, document);
  }
  void OnElementCreate(Rml::Element* element) override {
    Invoke(kElementCreate, nullptr, element);
  }
  void OnElementDestroy(Rml::Element* element) override {
    Invoke(kElementDestroy, nullptr, element);
  }
  void OnDataModelCreate(Rml::Context* context,
                         const Rml::String& name) override {
    Invoke(kDataModelCreate, context, nullptr, &name);
  }
  void OnDataModelDestroy(Rml::Context* context,
                          const Rml::String& name) override {
    Invoke(kDataModelDestroy, context, nullptr, &name);
  }

 private:
  void Invoke(Method method,
              Rml::Context* context = nullptr,
              Rml::Element* element = nullptr,
              const Rml::String* text = nullptr) {
    // Missing hooks remain an entirely Native no-op, including high-volume
    // element creation/destruction under an All subscription.
    if (!owner_->methods[method]) {
      return;
    }
    const auto owner = owner_->shared_from_this();
    auto& state = State();
    // Setup-time masks/initialisation also run before State.initialized is set.
    if (!state.boundary_depth || state.cleaning_up || !owner->alive ||
        !state.callback_exception.IsEmpty() || owner->functions.IsEmpty()) {
      return;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    auto table = owner->functions.Get(v8::Isolate::GetCurrent());
    v8::Local<v8::Value> function;
    if (!Nan::Get(table, method).ToLocal(&function) ||
        !function->IsFunction()) {
      if (caught.HasCaught()) {
        CaptureCallbackException(caught.Exception());
      }
      return;
    }
    if (state.batching_render_interface) {
      // Use the common barrier, without requiring initialization for masks.
      CanInvokeCallback();
    }
    PluginCallbackScope scope;
    std::array<v8::Local<v8::Value>, 2> arguments;
    int count = 0;
    if (context) {
      arguments[count++] = scope.Context(context);
    } else if (element) {
      arguments[count++] = scope.Element(element);
    }
    if (text) {
      arguments[count++] = Nan::New(*text).ToLocalChecked();
    }
    RecordDiagnosticCallback(DiagnosticCallback::kPlugin);
    v8::Local<v8::Value> result;
    if (!Nan::Call(function.As<v8::Function>(), table, count, arguments.data())
             .ToLocal(&result)) {
      if (caught.HasCaught()) {
        CaptureCallbackException(caught.Exception());
      }
      return;
    }
    if (result->IsPromise()) {
      auto ignore =
          Nan::GetFunction(Nan::New<v8::FunctionTemplate>(IgnoreAsyncResult))
              .ToLocalChecked();
      result.As<v8::Promise>()
          ->Then(Nan::GetCurrentContext(), ignore, ignore)
          .ToLocalChecked();
    }
    if (method == kEventClasses) {
      if (!result->IsInt32() || Nan::To<int>(result).FromJust() < 0 ||
          (Nan::To<int>(result).FromJust() & ~Rml::Plugin::EVT_ALL)) {
        Nan::ThrowRangeError(
            "Plugin event classes must be an integer mask 0..15");
      } else {
        owner->event_classes = Nan::To<int>(result).FromJust();
      }
    } else if (!result->IsUndefined()) {
      Nan::ThrowTypeError(
          "Plugin notifications must return undefined synchronously");
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }
  PluginState* owner_;
};

std::shared_ptr<PluginState> PluginOf(v8::Local<v8::Value> value) {
  auto* handle = PluginHandle::TryFrom(value);
  if (!handle) {
    Nan::ThrowTypeError("Expected a Plugin");
    return {};
  }
  auto owner = handle->owner();
  if (!owner->alive || owner->generation != Generation()) {
    Nan::ThrowError("Plugin is no longer valid");
    return {};
  }
  return owner;
}

bool CanEditRegistry() {
  const auto& state = State();
  if (state.parser_callback_depth || state.instancer_callback_depth ||
      state.effect_callback_depth || state.value_callback_depth ||
      state.texture_callback_depth || state.text_input_callback_depth) {
    Nan::ThrowError(
        "Plugin registry mutation is not allowed during this callback");
    return false;
  }
  return true;
}

NAN_METHOD(CreatePlugin) {
  if (!CanEditRegistry()) {
    return;
  }
  if (State().plugin_shutdown) {
    return Nan::ThrowError("Cannot create a Plugin during runtime shutdown");
  }
  if (!info[0]->IsArray() || info[0].As<v8::Array>()->Length() != kCount) {
    return Nan::ThrowTypeError("Expected the captured Plugin callback table");
  }
  auto input = info[0].As<v8::Array>();
  auto functions = Nan::New<v8::Array>(kCount);
  std::array<bool, kCount> methods{};
  for (uint32_t i = 0; i < kCount; ++i) {
    v8::Local<v8::Value> function;
    if (!Nan::Get(input, i).ToLocal(&function)) {
      return;
    }
    if (!function->IsUndefined() && !function->IsFunction()) {
      return Nan::ThrowTypeError("Plugin callbacks must be functions");
    }
    Nan::Set(functions, i, function).FromJust();
    methods[i] = function->IsFunction();
  }
  functions
      ->SetIntegrityLevel(Nan::GetCurrentContext(), v8::IntegrityLevel::kFrozen)
      .FromJust();
  ClaimRuntimeSetup();
  auto owner = std::make_shared<PluginState>();
  owner->methods = methods;
  owner->generation = Generation();
  owner->value = std::make_unique<NativePlugin>(owner.get());
  auto handle = PluginHandle::Create(owner);
  Nan::SetPrivate(
      handle, Nan::New("rml.plugin.callbacks").ToLocalChecked(), functions)
      .FromJust();
  owner->functions.Reset(v8::Isolate::GetCurrent(), functions);
  owner->functions.SetWeak();
  Plugins().push_back(owner);
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(RegisterPlugin) {
  if (!CanEditRegistry()) {
    return;
  }
  auto owner = PluginOf(info[0]);
  if (!owner) {
    return;
  }
  if (State().plugin_shutdown) {
    return Nan::ThrowError("Cannot register a Plugin during runtime shutdown");
  }
  if (owner->registering || owner->unregistering) {
    return Nan::ThrowError("Plugin registration is already changing");
  }
  if (owner->registered) {
    return Nan::ThrowError("Plugin is already registered");
  }
  owner->registered = true;
  owner->registering = true;
  owner->cancelled = false;
  owner->capture_mask = true;
  owner->event_classes = Rml::Plugin::EVT_ALL;
  owner->functions.ClearWeak();
  Registrations().emplace(owner.get(), owner);
  Rml::RegisterPlugin(owner->value.get());
  owner->registering = false;
  if (owner->cancelled || !State().callback_exception.IsEmpty()) {
    Rml::UnregisterPlugin(owner->value.get());
    owner->registered = false;
    const auto found = Registrations().find(owner.get());
    if (found != Registrations().end()) {
      Retired().push_back(std::move(found->second));
      Registrations().erase(found);
    }
  }
}

NAN_METHOD(UnregisterPlugin) {
  if (!CanEditRegistry()) {
    return;
  }
  auto owner = PluginOf(info[0]);
  if (!owner) {
    return;
  }
  if (owner->registering) {
    const bool removed = !owner->cancelled;
    owner->cancelled = true;
    info.GetReturnValue().Set(removed);
    return;
  }
  if (!owner->registered || owner->unregistering) {
    info.GetReturnValue().Set(false);
    return;
  }
  owner->registered = false;
  owner->unregistering = true;
  Retired().push_back(owner);
  Registrations().erase(owner.get());
  Rml::UnregisterPlugin(owner->value.get());
  owner->unregistering = false;
  info.GetReturnValue().Set(true);
}

}  // namespace

void DrainPluginReleases() {
  for (const auto& owner : Retired()) {
    if (!owner->registered && !owner->functions.IsEmpty() &&
        !owner->functions.IsWeak()) {
      owner->functions.SetWeak();
    }
  }
  Retired().clear();
}

void ReleasePluginBindings() {
  for (const auto& weak : Plugins()) {
    if (auto owner = weak.lock()) {
      Rml::UnregisterPlugin(owner->value.get());
      owner->registered = false;
      owner->alive = false;
      owner->functions.Reset();
    }
  }
  Registrations().clear();
  Retired().clear();
  Plugins().clear();
}

NAN_MODULE_INIT(InitializeRmlPlugins) {
  SetRuntimeMethod<CreatePlugin, true, false, false, false, false, false, true>(
      target, "createPlugin");
  SetRuntimeMethod<RegisterPlugin,
                   true,
                   false,
                   false,
                   false,
                   false,
                   false,
                   true>(target, "registerPlugin");
  SetRuntimeMethod<UnregisterPlugin,
                   true,
                   false,
                   false,
                   false,
                   false,
                   false,
                   true>(target, "unregisterPlugin");
}

}  // namespace sfmlrmlui
