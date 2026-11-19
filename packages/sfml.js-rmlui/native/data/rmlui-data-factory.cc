// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/data/rmlui-data-factory.h"

#include <RmlUi/Core/Factory.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <cmath>
#include <memory>
#include <type_traits>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/data/rmlui-data.h"
#include "native/runtime/rmlui-state.h"
#include "third_party/rmlui/Source/Core/DataController.h"
#include "third_party/rmlui/Source/Core/DataModel.h"
#include "third_party/rmlui/Source/Core/DataView.h"

namespace Rml {
// Package-internal queries patched into the actual pinned Factory registry.
bool SfmlJsHasDataViewInstancer(const String& name);
bool SfmlJsHasDataControllerInstancer(const String& name);
}  // namespace Rml

namespace sfmlrmlui {
namespace {

struct InstanceState {
  bool is_view{false};
  bool custom{false};
  bool initialized{false};
  bool initialization_attempted{false};
  bool observes_release{false};
  Rml::DataView* view{nullptr};
  Rml::DataController* controller{nullptr};
  Rml::DataViewPtr owned_view;
  Rml::DataControllerPtr owned_controller;
  std::shared_ptr<DataCallbacks> callbacks;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};

  Rml::Element* Element() const {
    return is_view ? view->GetElement() : controller->GetElement();
  }
  bool Live() const {
    return generation == State().generation &&
           (is_view ? view != nullptr : controller != nullptr);
  }
  bool Valid() const {
    return Live() && (is_view ? view->IsValid() : controller->IsValid());
  }
};

struct InstancerState {
  bool is_view{false};
  std::unique_ptr<Rml::DataViewInstancer> view;
  std::unique_ptr<Rml::DataControllerInstancer> controller;
  std::shared_ptr<DataCallbacks> callbacks;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

using InstanceHandle = sfmljs::SharedHandle<InstanceState>;
using InstancerHandle = sfmljs::SharedHandle<InstancerState>;

auto& Instances() {
  static std::vector<std::weak_ptr<InstanceState>> values;
  return values;
}
auto& Instancers() {
  static std::vector<std::weak_ptr<InstancerState>> values;
  return values;
}
auto& TransferredInstances() {
  static std::unordered_map<Rml::Releasable*, std::shared_ptr<InstanceState>>
      values;
  return values;
}
auto& RegisteredInstancers() {
  static std::vector<std::shared_ptr<InstancerState>> values;
  return values;
}
auto& PendingReleases() {
  static std::vector<std::shared_ptr<InstanceState>> values;
  return values;
}

ElementCallbackRoots& CallbackRoots() {
  static ElementCallbackRoots roots;
  return roots;
}

v8::Local<v8::String> FunctionsKey() {
  return Nan::New("rml.data.factory.functions").ToLocalChecked();
}

std::shared_ptr<InstanceState> InstanceOf(v8::Local<v8::Value> input,
                                          bool view,
                                          bool require_element = true) {
  auto* handle = InstanceHandle::TryFrom(input);
  if (!handle || handle->owner()->is_view != view) {
    Nan::ThrowTypeError(view ? "Expected a DataView"
                             : "Expected a DataController");
    return {};
  }
  auto owner = handle->owner();
  if (!owner->Live() || (require_element && !owner->Valid())) {
    Nan::ThrowError("RmlUi data instance is no longer valid");
    return {};
  }
  return owner;
}

std::shared_ptr<InstancerState> InstancerOf(v8::Local<v8::Value> input,
                                            bool view) {
  auto* handle = InstancerHandle::TryFrom(input);
  if (!handle || handle->owner()->is_view != view) {
    Nan::ThrowTypeError(view ? "Expected a DataViewInstancer"
                             : "Expected a DataControllerInstancer");
    return {};
  }
  auto owner = handle->owner();
  if (owner->generation != State().generation ||
      (view ? !owner->view : !owner->controller)) {
    Nan::ThrowError("RmlUi data instancer is no longer valid");
    return {};
  }
  return owner;
}

v8::Local<v8::Object> WrapInstance(
    const std::shared_ptr<InstanceState>& owner) {
  if (!owner->handle.IsEmpty()) {
    return owner->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = InstanceHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  if (owner->callbacks) {
    Nan::SetPrivate(handle, FunctionsKey(), DataCallbackArray(owner->callbacks))
        .FromJust();
  }
  return handle;
}

std::shared_ptr<DataModelState> ModelStateOf(const Rml::DataModel& model) {
  return DataModelFromPointer(&model);
}

bool ReadString(v8::Local<v8::Value> input, Rml::String* output) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a data factory string");
    return false;
  }
  Nan::Utf8String text(input);
  output->assign(*text, text.length());
  return true;
}

bool ReadBoolean(v8::Local<v8::Value> input, bool* result) {
  if (!input->IsBoolean()) {
    Nan::ThrowTypeError("Data callback must return a boolean");
    return false;
  }
  *result = input->IsTrue();
  return true;
}

class InstanceCallbackScope final {
 public:
  explicit InstanceCallbackScope(Rml::Element* element)
      : depth_(State().event_elements.size()) {
    State().event_elements.push_back(element);
  }
  ~InstanceCallbackScope() { State().event_elements.resize(depth_); }

 private:
  size_t depth_;
};

bool InitializeCallback(const std::weak_ptr<InstanceState>& weak,
                        Rml::DataModel* model,
                        Rml::Element* element,
                        const Rml::String& expression,
                        const Rml::String& modifier) {
  const auto owner = weak.lock();
  if (!owner || !CanInvokeCallback()) {
    return false;
  }
  Nan::HandleScope scope;
  const auto model_owner = ModelStateOf(*model);
  if (!model_owner) {
    return false;
  }
  InstanceCallbackScope active(element);
  v8::Local<v8::Value> argv[] = {WrapDataModel(model_owner),
                                 WrapElement(element),
                                 Nan::New(expression).ToLocalChecked(),
                                 Nan::New(modifier).ToLocalChecked()};
  bool initialized = false;
  InvokeDataCallback(owner->callbacks, 0, 4, argv, [&](auto result) {
    return ReadBoolean(result, &initialized);
  });
  owner->initialized = initialized;
  return initialized;
}

void OnNativeRelease(Rml::Releasable* value,
                     const std::weak_ptr<InstanceState>& weak) {
  if (auto owner = weak.lock()) {
    State().data_factory_ownership_dirty = true;
    owner->view = nullptr;
    owner->controller = nullptr;
    if (!State().cleaning_up && owner->callbacks &&
        !owner->callbacks->functions.IsEmpty()) {
      if (owner->callbacks->functions.IsWeak()) {
        owner->callbacks->functions.ClearWeak();
      }
      PendingReleases().push_back(owner);
    }
    TransferredInstances().erase(value);
  }
}

class NativeView final : public Rml::DataView {
 public:
  NativeView(Rml::Element* element,
             int offset,
             std::weak_ptr<InstanceState> owner)
      : Rml::DataView(element, offset), owner_(std::move(owner)) {}

  bool Initialize(Rml::DataModel& model,
                  Rml::Element* element,
                  const Rml::String& expression,
                  const Rml::String& modifier) override {
    return InitializeCallback(owner_, &model, element, expression, modifier);
  }

  bool Update(Rml::DataModel& model) override {
    auto owner = owner_.lock();
    if (!owner || !CanInvokeCallback()) {
      return false;
    }
    Nan::HandleScope scope;
    const auto current = ModelStateOf(model);
    if (!current) {
      return false;
    }
    InstanceCallbackScope active(GetElement());
    v8::Local<v8::Value> argument = WrapDataModel(current);
    bool changed = false;
    InvokeDataCallback(owner->callbacks, 1, 1, &argument, [&](auto result) {
      return ReadBoolean(result, &changed);
    });
    return changed;
  }

  Rml::StringList GetVariableNameList() const override {
    Rml::StringList names;
    if (auto owner = owner_.lock()) {
      InstanceCallbackScope active(GetElement());
      InvokeDataCallback(owner->callbacks, 2, 0, nullptr, [&](auto result) {
        if (!result->IsArray()) {
          Nan::ThrowTypeError("Data variable names must be a string array");
          return false;
        }
        auto array = result.template As<v8::Array>();
        for (uint32_t i = 0; i < array->Length(); ++i) {
          v8::Local<v8::Value> value;
          Rml::String name;
          if (!Nan::Get(array, i).ToLocal(&value) ||
              !ReadString(value, &name)) {
            return false;
          }
          names.push_back(std::move(name));
        }
        return true;
      });
    }
    return names;
  }

  void Release() override {
    OnNativeRelease(this, owner_);
    delete this;
  }

 private:
  std::weak_ptr<InstanceState> owner_;
};

class NativeController final : public Rml::DataController {
 public:
  NativeController(Rml::Element* element, std::weak_ptr<InstanceState> owner)
      : Rml::DataController(element), owner_(std::move(owner)) {}

  bool Initialize(Rml::DataModel& model,
                  Rml::Element* element,
                  const Rml::String& expression,
                  const Rml::String& modifier) override {
    return InitializeCallback(owner_, &model, element, expression, modifier);
  }

  void Release() override {
    OnNativeRelease(this, owner_);
    delete this;
  }

 private:
  std::weak_ptr<InstanceState> owner_;
};

class NativeViewRelay final : public Rml::DataView {
 public:
  NativeViewRelay(Rml::DataViewPtr value, std::weak_ptr<InstanceState> owner)
      : Rml::DataView(value->GetElement(), 0),
        value_(std::move(value)),
        owner_(std::move(owner)) {
    // Reparenting after original instancing must preserve its cached order
    // without passing an out-of-range offset to the protected constructor.
    SetSortOrderForBinding(value_->GetSortOrder());
  }

  bool Initialize(Rml::DataModel& model,
                  Rml::Element* element,
                  const Rml::String& expression,
                  const Rml::String& modifier) override {
    const bool result =
        value_->Initialize(model, element, expression, modifier);
    if (auto owner = owner_.lock()) {
      owner->initialized = result;
    }
    return result;
  }
  bool Update(Rml::DataModel& model) override { return value_->Update(model); }
  Rml::StringList GetVariableNameList() const override {
    return value_->GetVariableNameList();
  }
  void Release() override {
    OnNativeRelease(this, owner_);
    delete this;
  }

 private:
  Rml::DataViewPtr value_;
  std::weak_ptr<InstanceState> owner_;
};

class NativeControllerRelay final : public Rml::DataController {
 public:
  NativeControllerRelay(Rml::DataControllerPtr value,
                        std::weak_ptr<InstanceState> owner)
      : Rml::DataController(value->GetElement()),
        value_(std::move(value)),
        owner_(std::move(owner)) {}

  bool Initialize(Rml::DataModel& model,
                  Rml::Element* element,
                  const Rml::String& expression,
                  const Rml::String& modifier) override {
    const bool result =
        value_->Initialize(model, element, expression, modifier);
    if (auto owner = owner_.lock()) {
      owner->initialized = result;
    }
    return result;
  }
  void Release() override {
    OnNativeRelease(this, owner_);
    delete this;
  }

 private:
  Rml::DataControllerPtr value_;
  std::weak_ptr<InstanceState> owner_;
};

template <bool view>
auto Allocate(const std::weak_ptr<InstancerState>& weak,
              Rml::Element* element) {
  using Pointer =
      std::conditional_t<view, Rml::DataViewPtr, Rml::DataControllerPtr>;
  Pointer result;
  auto owner = weak.lock();
  if (!owner || !CanInvokeCallback()) {
    return result;
  }
  Nan::HandleScope scope;
  v8::Local<v8::Value> argument = WrapElement(element);
  ++State().instancer_callback_depth;
  InvokeDataCallback(owner->callbacks, 0, 1, &argument, [&](auto input) {
    if (input->IsNull()) {
      return true;
    }
    auto candidate = InstanceOf(input, view);
    if (!candidate) {
      return false;
    }
    if (candidate->callbacks && candidate->callbacks->active) {
      Nan::ThrowError("Cannot transfer an active data instance");
      return false;
    }
    if (candidate->Element() != element) {
      Nan::ThrowError("Data instance must belong to the requesting element");
      return false;
    }
    if (candidate->initialization_attempted || candidate->initialized) {
      Nan::ThrowError("Return an uninitialized data instance to an instancer");
      return false;
    }
    if constexpr (view) {
      if (!candidate->owned_view) {
        Nan::ThrowError("Data view ownership has already transferred to Core");
        return false;
      }
      if (!candidate->custom && !candidate->observes_release) {
        candidate->owned_view.reset(
            new NativeViewRelay(std::move(candidate->owned_view), candidate));
        candidate->view = candidate->owned_view.get();
        candidate->observes_release = true;
      }
      result = std::move(candidate->owned_view);
    } else {
      if (!candidate->owned_controller) {
        Nan::ThrowError(
            "Data controller ownership has already transferred to Core");
        return false;
      }
      if (!candidate->custom && !candidate->observes_release) {
        candidate->owned_controller.reset(new NativeControllerRelay(
            std::move(candidate->owned_controller), candidate));
        candidate->controller = candidate->owned_controller.get();
        candidate->observes_release = true;
      }
      result = std::move(candidate->owned_controller);
    }
    // Core receives a unique releaser pointer. Keep the borrowed facade and
    // callbacks alive until native Release. Delegated defaults keep their
    // actual implementation and unique releaser behind an observing relay.
    if (candidate->callbacks && candidate->callbacks->functions.IsWeak()) {
      candidate->callbacks->functions.ClearWeak();
    }
    TransferredInstances().insert_or_assign(result.get(), candidate);
    State().data_factory_ownership_dirty = true;
    return true;
  });
  --State().instancer_callback_depth;
  return result;
}

class NativeViewInstancer final : public Rml::DataViewInstancer {
 public:
  explicit NativeViewInstancer(std::weak_ptr<InstancerState> owner)
      : owner_(std::move(owner)) {}
  Rml::DataViewPtr InstanceView(Rml::Element* element) override {
    return Allocate<true>(owner_, element);
  }

 private:
  std::weak_ptr<InstancerState> owner_;
};

class NativeControllerInstancer final : public Rml::DataControllerInstancer {
 public:
  explicit NativeControllerInstancer(std::weak_ptr<InstancerState> owner)
      : owner_(std::move(owner)) {}
  Rml::DataControllerPtr InstanceController(Rml::Element* element) override {
    return Allocate<false>(owner_, element);
  }

 private:
  std::weak_ptr<InstancerState> owner_;
};

template <bool view>
NAN_METHOD(CreateInstance) {
  if (!info[1]->IsFunction() ||
      (view && (!info[2]->IsFunction() || !info[3]->IsFunction())) ||
      (!info[4]->IsUndefined() && !info[4]->IsFunction())) {
    return Nan::ThrowTypeError("Expected data instance callbacks");
  }
  int offset = 0;
  if constexpr (view) {
    const double input = Nan::To<double>(info[5]).FromMaybe(1000);
    if (!info[5]->IsNumber() || !std::isfinite(input) || input < -1000 ||
        input > 999 || input != std::trunc(input)) {
      return Nan::ThrowRangeError(
          "Data view sort offset must be an integer in [-1000, 999]");
    }
    offset = static_cast<int>(input);
  }
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto owner = std::make_shared<InstanceState>();
  owner->is_view = view;
  owner->custom = true;
  owner->generation = State().generation;
  owner->callbacks = std::make_shared<DataCallbacks>();
  owner->callbacks->diagnostic_category = DiagnosticCallback::kDataFactory;
  for (unsigned i = 1; i <= 4; ++i) {
    AddDataCallback(owner->callbacks, info[i]);
  }
  if constexpr (view) {
    owner->owned_view.reset(new NativeView(element, offset, owner));
    owner->view = owner->owned_view.get();
  } else {
    owner->owned_controller.reset(new NativeController(element, owner));
    owner->controller = owner->owned_controller.get();
  }
  Instances().push_back(owner);
  State().data_factory_ownership_dirty = true;
  info.GetReturnValue().Set(WrapInstance(owner));
}

template <bool view>
NAN_METHOD(CreateInstancer) {
  if (!info[0]->IsFunction()) {
    return Nan::ThrowTypeError("Expected a data instancer callback");
  }
  auto owner = std::make_shared<InstancerState>();
  owner->is_view = view;
  owner->generation = State().generation;
  owner->callbacks = std::make_shared<DataCallbacks>();
  owner->callbacks->diagnostic_category = DiagnosticCallback::kDataFactory;
  AddDataCallback(owner->callbacks, info[0]);
  if constexpr (view) {
    owner->view = std::make_unique<NativeViewInstancer>(owner);
  } else {
    owner->controller = std::make_unique<NativeControllerInstancer>(owner);
  }
  auto handle = InstancerHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  Nan::SetPrivate(handle, FunctionsKey(), DataCallbackArray(owner->callbacks))
      .FromJust();
  owner->callbacks->functions.SetWeak();
  Instancers().push_back(owner);
  info.GetReturnValue().Set(handle);
}

template <bool view>
NAN_METHOD(RegisterInstancer) {
  Rml::String name;
  if (!ReadString(info[1], &name)) {
    return;
  }
  auto owner = InstancerOf(info[0], view);
  if (!owner) {
    return;
  }
  const bool exists = view ? Rml::SfmlJsHasDataViewInstancer(name)
                           : Rml::SfmlJsHasDataControllerInstancer(name);
  if constexpr (view) {
    if (!info[2]->IsBoolean()) {
      return Nan::ThrowTypeError("Expected a structural-view boolean");
    }
    Rml::Factory::RegisterDataViewInstancer(
        owner->view.get(), name, info[2]->IsTrue());
  } else {
    Rml::Factory::RegisterDataControllerInstancer(owner->controller.get(),
                                                  name);
  }
  if (!exists) {
    if (owner->callbacks->functions.IsWeak()) {
      owner->callbacks->functions.ClearWeak();
    }
    RegisteredInstancers().push_back(owner);
  }
}

template <bool view, bool factory>
NAN_METHOD(Instance) {
  Rml::String name;
  std::shared_ptr<InstancerState> instancer;
  if constexpr (factory) {
    if (!ReadString(info[0], &name)) {
      return;
    }
  } else {
    instancer = InstancerOf(info[0], view);
    if (!instancer) {
      return;
    }
  }
  auto* element = ElementOf(info[1]);
  if (!element) {
    return;
  }
  using Pointer =
      std::conditional_t<view, Rml::DataViewPtr, Rml::DataControllerPtr>;
  Pointer value;
  if constexpr (view) {
    value = factory ? Rml::Factory::InstanceDataView(name, element)
                    : instancer->view->InstanceView(element);
  } else {
    value = factory ? Rml::Factory::InstanceDataController(name, element)
                    : instancer->controller->InstanceController(element);
  }
  if (!value || !State().callback_exception.IsEmpty()) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  auto found = TransferredInstances().find(value.get());
  std::shared_ptr<InstanceState> owner;
  if (found != TransferredInstances().end()) {
    owner = found->second;
    TransferredInstances().erase(found);
  } else {
    owner = std::make_shared<InstanceState>();
    owner->is_view = view;
    owner->generation = State().generation;
    Instances().push_back(owner);
  }
  if constexpr (view) {
    owner->view = value.get();
    owner->owned_view = std::move(value);
  } else {
    owner->controller = value.get();
    owner->owned_controller = std::move(value);
  }
  State().data_factory_ownership_dirty = true;
  info.GetReturnValue().Set(WrapInstance(owner));
}

template <bool view>
NAN_METHOD(IsValid) {
  auto* handle = InstanceHandle::TryFrom(info[0]);
  if (!handle || handle->owner()->is_view != view) {
    return Nan::ThrowTypeError("Expected a data instance");
  }
  info.GetReturnValue().Set(handle->owner()->Valid());
}

template <bool view>
NAN_METHOD(GetElement) {
  if (auto owner = InstanceOf(info[0], view, false)) {
    info.GetReturnValue().Set(WrapNullableElement(owner->Element()));
  }
}

template <bool view>
NAN_METHOD(InitializeInstance) {
  Rml::String expression;
  Rml::String modifier;
  if (!ReadString(info[3], &expression) || !ReadString(info[4], &modifier)) {
    return;
  }
  auto owner = InstanceOf(info[0], view);
  auto model = DataModelOf(info[1]);
  auto* element = ElementOf(info[2]);
  if (!owner || !model || !element) {
    return;
  }
  if (owner->initialization_attempted || owner->initialized) {
    return Nan::ThrowError("Data instance is already initialized");
  }
  if (owner->Element() != element) {
    return Nan::ThrowError(
        "Data instance must initialize with its attached element");
  }
  owner->initialization_attempted = true;
  const bool result = view ? owner->view->Initialize(
                                 *model->value, element, expression, modifier)
                           : owner->controller->Initialize(
                                 *model->value, element, expression, modifier);
  owner->initialized = result;
  info.GetReturnValue().Set(result);
}

NAN_METHOD(UpdateView) {
  auto owner = InstanceOf(info[0], true);
  auto model = DataModelOf(info[1]);
  if (!owner || !model) {
    return;
  }
  if (!owner->custom && !owner->initialized) {
    return Nan::ThrowError(
        "Initialize the native data view before updating it");
  }
  InstanceCallbackScope active(owner->Element());
  info.GetReturnValue().Set(owner->view->Update(*model->value));
}

NAN_METHOD(VariableNames) {
  auto owner = InstanceOf(info[0], true);
  if (!owner) {
    return;
  }
  if (!owner->custom && !owner->initialized) {
    return Nan::ThrowError(
        "Initialize the native data view before reading dependencies");
  }
  auto names = owner->view->GetVariableNameList();
  auto result = Nan::New<v8::Array>(static_cast<int>(names.size()));
  for (uint32_t i = 0; i < names.size(); ++i) {
    Nan::Set(result, i, Nan::New(names[i]).ToLocalChecked()).FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SortOrder) {
  if (auto owner = InstanceOf(info[0], true, false)) {
    info.GetReturnValue().Set(owner->view->GetSortOrder());
  }
}

template <bool view>
NAN_METHOD(ReleaseInstance) {
  auto owner = InstanceOf(info[0], view, false);
  if (!owner) {
    return;
  }
  if (State().callback_depth ||
      (owner->callbacks && owner->callbacks->active)) {
    return Nan::ThrowError("Cannot release a data instance during a callback");
  }
  if (view ? !owner->owned_view : !owner->owned_controller) {
    return Nan::ThrowError(
        "Data instance ownership belongs to the native model");
  }
  owner->owned_view.reset();
  owner->owned_controller.reset();
  owner->view = nullptr;
  owner->controller = nullptr;
  State().data_factory_ownership_dirty = true;
}

void ClearFunctions(const std::shared_ptr<InstanceState>& owner) {
  if (!owner->handle.IsEmpty()) {
    Nan::SetPrivate(owner->handle.Get(v8::Isolate::GetCurrent()),
                    FunctionsKey(),
                    Nan::Undefined())
        .FromJust();
  }
  if (owner->callbacks) {
    owner->callbacks->functions.Reset();
  }
}

}  // namespace

void DrainDataFactoryReleases() {
  while (!PendingReleases().empty()) {
    auto notices = std::move(PendingReleases());
    PendingReleases().clear();
    for (const auto& owner : notices) {
      if (CanInvokeCallback()) {
        InvokeDataCallback(
            owner->callbacks, 3, 0, nullptr, [](auto) { return true; });
      }
      ClearFunctions(owner);
    }
  }
}

void RefreshDataFactoryOwnership() {
  auto& state = State();
  const auto topology = Rml::Element::GetTopologyVersionForBinding();
  if (state.cleaning_up ||
      (!state.data_factory_ownership_dirty &&
       state.data_factory_ownership_topology == topology &&
       state.data_factory_ownership_revision == state.ownership_revision)) {
    return;
  }
  // Clear before the snapshot; finalizers and releases during allocation can
  // dirty the registry again and must not be swallowed at the end of the pass.
  state.data_factory_ownership_dirty = false;
  state.data_factory_ownership_topology = topology;
  state.data_factory_ownership_revision = state.ownership_revision;
  state.data_diagnostics.Record(&DataDiagnostics::ownership_passes);
  std::vector<std::shared_ptr<InstanceState>> snapshot;
  for (const auto& weak : Instances()) {
    State().data_diagnostics.Record(
        &DataDiagnostics::ownership_instance_visits);
    if (auto owner = weak.lock()) {
      snapshot.push_back(owner);
    }
  }
  std::unordered_map<Rml::Element*, v8::Local<v8::Array>> edges;
  std::unordered_map<Rml::Element*, v8::Local<v8::Object>> roots;
  for (const auto& owner : snapshot) {
    if (!owner->Live() || !owner->callbacks ||
        owner->callbacks->functions.IsEmpty()) {
      continue;
    }
    auto functions = DataCallbackArray(owner->callbacks);
    bool native_root = false;
    const bool transferred = !owner->owned_view && !owner->owned_controller;
    if (transferred && owner->Valid()) {
      if (auto* root = DetachedOwnerOf(owner->Element())) {
        roots.try_emplace(root, WrapElement(root));
        auto& array = edges[root];
        if (array.IsEmpty()) {
          array = Nan::New<v8::Array>();
        }
        Nan::Set(array, array->Length(), functions).FromJust();
      } else {
        native_root = true;
      }
    }
    if (native_root && owner->callbacks->functions.IsWeak()) {
      owner->callbacks->functions.ClearWeak();
    } else if (!native_root && !owner->callbacks->functions.IsWeak()) {
      owner->callbacks->functions.SetWeak();
    }
  }
  RefreshElementCallbackEdges(
      "rml.data.factory.edges", edges, &CallbackRoots());
  std::erase_if(Instances(), [](const auto& weak) { return weak.expired(); });
  std::erase_if(Instancers(), [](const auto& weak) { return weak.expired(); });
}

void ReleaseOwnedDataFactoryInstances() {
  auto instances = Instances();
  for (const auto& weak : instances) {
    if (auto owner = weak.lock();
        owner && (owner->owned_view || owner->owned_controller)) {
      owner->owned_controller.reset();
      owner->owned_view.reset();
      owner->view = nullptr;
      owner->controller = nullptr;
      ClearFunctions(owner);
    }
  }
}

void ReleaseDataFactoryInstancers() {
  CallbackRoots().clear();
  DrainDataFactoryReleases();
  for (const auto& weak : Instances()) {
    if (auto owner = weak.lock()) {
      ClearFunctions(owner);
      owner->view = nullptr;
      owner->controller = nullptr;
    }
  }
  TransferredInstances().clear();
  for (const auto& weak : Instancers()) {
    if (auto owner = weak.lock()) {
      owner->view.reset();
      owner->controller.reset();
      owner->callbacks->functions.Reset();
      if (!owner->handle.IsEmpty()) {
        Nan::SetPrivate(owner->handle.Get(v8::Isolate::GetCurrent()),
                        FunctionsKey(),
                        Nan::Undefined())
            .FromJust();
      }
    }
  }
  RegisteredInstancers().clear();
  Instancers().clear();
  Instances().clear();
}

NAN_MODULE_INIT(InitializeRmlDataFactory) {
  SetInstancerValueMethod<CreateInstance<true>>(target, "createDataView");
  SetInstancerValueMethod<CreateInstance<false>>(target,
                                                 "createDataController");
  SetRuntimeMethod<CreateInstancer<true>>(target, "createDataViewInstancer");
  SetRuntimeMethod<CreateInstancer<false>>(target,
                                           "createDataControllerInstancer");
  SetRuntimeMethod<RegisterInstancer<true>>(target,
                                            "factoryRegisterDataViewInstancer");
  SetRuntimeMethod<RegisterInstancer<false>>(
      target, "factoryRegisterDataControllerInstancer");
  SetInstancerValueMethod<Instance<true, true>>(target,
                                                "factoryInstanceDataView");
  SetInstancerValueMethod<Instance<false, true>>(
      target, "factoryInstanceDataController");
  SetInstancerValueMethod<Instance<true, false>>(target,
                                                 "dataViewInstancerInstance");
  SetInstancerValueMethod<Instance<false, false>>(
      target, "dataControllerInstancerInstance");
  SetInstancerValueMethod<IsValid<true>>(target, "dataViewIsValid");
  SetInstancerValueMethod<IsValid<false>>(target, "dataControllerIsValid");
  SetInstancerValueMethod<GetElement<true>>(target, "dataViewGetElement");
  SetInstancerValueMethod<GetElement<false>>(target,
                                             "dataControllerGetElement");
  SetRuntimeMethod<InitializeInstance<true>, true>(target,
                                                   "dataViewInitialize");
  SetRuntimeMethod<InitializeInstance<false>, true>(target,
                                                    "dataControllerInitialize");
  SetRuntimeMethod<UpdateView, true>(target, "dataViewUpdate");
  SetRuntimeMethod<VariableNames, true>(target, "dataViewVariableNames");
  SetInstancerValueMethod<SortOrder>(target, "dataViewSortOrder");
  SetRuntimeMethod<ReleaseInstance<true>, true>(target, "releaseDataView");
  SetRuntimeMethod<ReleaseInstance<false>, true>(target,
                                                 "releaseDataController");
}

}  // namespace sfmlrmlui
