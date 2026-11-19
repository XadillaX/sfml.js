// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/effects/rmlui-filter-callbacks.h"

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/rendering/manager/rmlui-render-layers.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/runtime/rmlui-callback-leases.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-filter.h"

namespace sfmlrmlui {
namespace {

struct FilterCallbacks {
  v8::Global<v8::Array> functions;
  bool active{false};
  uint32_t native_roots{0};
};

class NativeFilterLease;
class JavaScriptFilter;

auto& Callbacks() {
  static std::vector<std::weak_ptr<FilterCallbacks>> values;
  return values;
}

auto& Leases() {
  static std::unordered_map<const Rml::Filter*,
                            std::weak_ptr<NativeFilterLease>>
      values;
  return values;
}

auto& CustomFilters() {
  static std::unordered_map<const Rml::Filter*, std::weak_ptr<JavaScriptFilter>>
      values;
  return values;
}

using FilterOwners = CallbackLeaseOwners<FilterCallbacks,
                                         v8::Array,
                                         &FilterCallbacks::functions>;

FilterOwners& Owners() {
  static FilterOwners owners("rml.detached.filters");
  return owners;
}

class EffectCallbackScope final {
 public:
  explicit EffectCallbackScope(FilterCallbacks* callbacks,
                               Nan::TryCatch* caught)
      : callbacks_(callbacks), caught_(caught) {
    callbacks_->active = true;
    ++State().callback_depth;
    ++State().effect_callback_depth;
  }
  ~EffectCallbackScope() {
    RestoreRenderCallbackLayers(caught_->HasCaught());
    --State().effect_callback_depth;
    --State().callback_depth;
    callbacks_->active = false;
  }

 private:
  FilterCallbacks* callbacks_;
  Nan::TryCatch* caught_;
};

class JavaScriptFilter final : public Rml::Filter {
 public:
  explicit JavaScriptFilter(std::shared_ptr<FilterCallbacks> callbacks)
      : callbacks(std::move(callbacks)) {}

  ~JavaScriptFilter() override { CustomFilters().erase(this); }

  Rml::CompiledFilter CompileFilter(Rml::Element* element) const override {
    Rml::CompiledFilter result;
    if (!CanInvokeCallback() || callbacks->functions.IsEmpty()) {
      return result;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    if (callbacks->active) {
      Nan::ThrowError("Recursive filter callback");
    } else {
      EffectCallbackScope scope(callbacks.get(), &caught);
      v8::Local<v8::Value> argument = WrapElement(element);
      v8::Local<v8::Value> returned;
      if (Invoke(0, 1, &argument).ToLocal(&returned)) {
        TakeCompiledFilter(returned, element->GetRenderManager(), &result);
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    return result;
  }

  void ExtendInkOverflow(Rml::Element* element,
                         Rml::Rectanglef& overflow) const override {
    if (!CanInvokeCallback() || callbacks->functions.IsEmpty()) {
      return;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    const auto functions = callbacks->functions.Get(v8::Isolate::GetCurrent());
    if (Nan::Get(functions, 1).ToLocalChecked()->IsUndefined()) {
      return;
    }
    if (callbacks->active) {
      Nan::ThrowError("Recursive filter callback");
    } else {
      EffectCallbackScope scope(callbacks.get(), &caught);
      v8::Local<v8::Value> arguments[] = {WrapElement(element),
                                          WrapFilterRectangle(overflow)};
      v8::Local<v8::Value> returned;
      if (Invoke(1, 2, arguments).ToLocal(&returned)) {
        Rml::Rectanglef copy;
        if (ReadFilterRectangle(returned, &copy)) {
          overflow = copy;
        }
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }

  std::shared_ptr<FilterCallbacks> callbacks;

 private:
  v8::MaybeLocal<v8::Value> Invoke(uint32_t index,
                                   int count,
                                   v8::Local<v8::Value>* arguments) const {
    const auto functions = callbacks->functions.Get(v8::Isolate::GetCurrent());
    const auto function = Nan::Get(functions, index).ToLocalChecked();
    if (function->IsUndefined()) {
      return Nan::Undefined();
    }
    RecordDiagnosticCallback(DiagnosticCallback::kFilter);
    return function.As<v8::Function>()->Call(
        Nan::GetCurrentContext(), Nan::Undefined(), count, arguments);
  }
};

// One lease per native instancing result, even when a factory reuses the same
// JS Filter for several elements. A direct JS instance gets no native lease.
class NativeFilterLease final : public Rml::Filter {
 public:
  explicit NativeFilterLease(std::shared_ptr<JavaScriptFilter> value)
      : value(std::move(value)),
        ownership(Owners().Add(this->value->callbacks, nullptr)) {}

  ~NativeFilterLease() override { Leases().erase(this); }

  Rml::CompiledFilter CompileFilter(Rml::Element* target) const override {
    Owners().Bind(ownership, target);
    return value->CompileFilter(target);
  }

  void ExtendInkOverflow(Rml::Element* target,
                         Rml::Rectanglef& overflow) const override {
    Owners().Bind(ownership, target);
    value->ExtendInkOverflow(target, overflow);
  }

  std::shared_ptr<JavaScriptFilter> value;
  std::shared_ptr<FilterOwners::Lease> ownership;
};

}  // namespace

Rml::SharedPtr<Rml::Filter> CreateFilterCallbacks(
    v8::Local<v8::Function> compile, v8::Local<v8::Value> overflow) {
  auto record = std::make_shared<FilterCallbacks>();
  auto functions = Nan::New<v8::Array>(2);
  functions->CreateDataProperty(Nan::GetCurrentContext(), 0, compile)
      .FromJust();
  functions->CreateDataProperty(Nan::GetCurrentContext(), 1, overflow)
      .FromJust();
  record->functions.Reset(v8::Isolate::GetCurrent(), functions);
  record->functions.SetWeak();
  static size_t sweep_threshold = 64;
  if (Callbacks().size() >= sweep_threshold) {
    std::erase_if(Callbacks(),
                  [](const auto& entry) { return entry.expired(); });
    sweep_threshold = std::max<size_t>(64, Callbacks().size() * 2);
  }
  Callbacks().push_back(record);
  auto filter = std::make_shared<JavaScriptFilter>(std::move(record));
  CustomFilters()[filter.get()] = filter;
  return filter;
}

Rml::SharedPtr<Rml::Filter> DetachFilterCallbacks(
    const Rml::SharedPtr<Rml::Filter>& value) {
  const auto found = Leases().find(value.get());
  if (found != Leases().end()) {
    if (auto lease = found->second.lock()) {
      return lease->value;
    }
  }
  return value;
}

Rml::SharedPtr<Rml::Filter> RetainFilterCallbacks(
    const Rml::SharedPtr<Rml::Filter>& value) {
  const auto found = CustomFilters().find(DetachFilterCallbacks(value).get());
  const auto filter =
      found != CustomFilters().end() ? found->second.lock() : nullptr;
  if (!filter) {
    return value;
  }
  auto lease = std::make_shared<NativeFilterLease>(filter);
  // Bridge the interval between InstanceFilter and CompileFilter within
  // ElementEffects::RenderEffects, including GC in intervening callbacks.
  if (filter->callbacks->functions.IsWeak()) {
    filter->callbacks->functions.ClearWeak();
  }
  Leases()[lease.get()] = lease;
  return lease;
}

void BindFilterCallbacks(v8::Local<v8::Object> handle,
                         const Rml::SharedPtr<Rml::Filter>& value) {
  const auto found = CustomFilters().find(value.get());
  if (found != CustomFilters().end()) {
    const auto filter = found->second.lock();
    if (!filter) {
      return;
    }
    Nan::SetPrivate(handle,
                    Nan::New("rml.filter.callbacks").ToLocalChecked(),
                    filter->callbacks->functions.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
}

void RefreshFilterOwnership() {
  Owners().Refresh(DiagnosticOwnership::kFilter);
}

void ReleaseFilterCallbacks() {
  Owners().Clear();
  for (const auto& weak : Callbacks()) {
    if (auto record = weak.lock()) {
      if (!record->functions.IsEmpty()) {
        auto functions = record->functions.Get(v8::Isolate::GetCurrent());
        for (uint32_t i = 0; i < 2; ++i) {
          functions
              ->CreateDataProperty(
                  Nan::GetCurrentContext(), i, Nan::Undefined())
              .FromJust();
        }
      }
      record->functions.Reset();
    }
  }
  Callbacks().clear();
  Leases().clear();
  CustomFilters().clear();
}

}  // namespace sfmlrmlui
