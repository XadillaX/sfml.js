// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/effects/rmlui-filter.h"

#include <algorithm>
#include <cmath>
#include <memory>
#include <utility>
#include <vector>

#include "native/dom/elements/rmlui-box.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-filter-callbacks.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

struct FilterState {
  Rml::SharedPtr<Rml::Filter> value;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

using FilterHandle = sfmljs::SharedHandle<FilterState>;

struct FilterRegistry {
  std::vector<std::weak_ptr<FilterState>> values;
  size_t sweep_threshold{64};
};

FilterRegistry& Filters() {
  static FilterRegistry registry;
  return registry;
}

FilterState* FilterOf(v8::Local<v8::Value> input) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* handle = FilterHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an owned filter");
    return nullptr;
  }
  auto* state = handle->owner().get();
  if (!state->value || state->generation != State().generation) {
    Nan::ThrowError("Filter is no longer valid");
    return nullptr;
  }
  return state;
}

NAN_METHOD(CreateFilter) {
  if (!info[0]->IsFunction() ||
      (!info[1]->IsUndefined() && !info[1]->IsFunction())) {
    return Nan::ThrowTypeError("Expected filter callbacks");
  }
  info.GetReturnValue().Set(
      WrapFilter(CreateFilterCallbacks(info[0].As<v8::Function>(), info[1])));
}

NAN_METHOD(ExtendInkOverflow) {
  Rml::Rectanglef value;
  if (!ReadFilterRectangle(info[2], &value)) {
    return;
  }
  auto* state = FilterOf(info[0]);
  if (!state) {
    return;
  }
  auto* element = ElementOf(info[1]);
  if (!element) {
    return;
  }
  state->value->ExtendInkOverflow(element, value);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (!std::isfinite(value.p0.x) || !std::isfinite(value.p0.y) ||
      !std::isfinite(value.p1.x) || !std::isfinite(value.p1.y)) {
    return Nan::ThrowRangeError("Filter overflow exceeds finite float bounds");
  }
  info.GetReturnValue().Set(WrapFilterRectangle(value));
}

NAN_METHOD(CompileFilter) {
  auto* state = FilterOf(info[0]);
  if (!state) {
    return;
  }
  auto* element = ElementOf(info[1]);
  if (!element) {
    return;
  }
  auto* manager = element->GetRenderManager();
  if (!manager) {
    return Nan::ThrowError("Filter compilation requires a render manager");
  }
  auto resource = state->value->CompileFilter(element);
  if (State().callback_exception.IsEmpty()) {
    info.GetReturnValue().Set(WrapCompiledFilter(std::move(resource), manager));
  }
}

}  // namespace

bool ReadFilterRectangle(v8::Local<v8::Value> input, Rml::Rectanglef* value) {
  if (!input->IsObject()) {
    Nan::ThrowTypeError("Expected a rectangle with p0 and p1");
    return false;
  }
  v8::Local<v8::Value> p0;
  v8::Local<v8::Value> p1;
  const auto object = input.As<v8::Object>();
  return Nan::Get(object, Nan::New("p0").ToLocalChecked()).ToLocal(&p0) &&
         Nan::Get(object, Nan::New("p1").ToLocalChecked()).ToLocal(&p1) &&
         ReadBoxVector(p0, &value->p0) && ReadBoxVector(p1, &value->p1);
}

v8::Local<v8::Object> WrapFilterRectangle(const Rml::Rectanglef& value) {
  auto result = Nan::New<v8::Object>();
  for (const auto& [name, vector] :
       {std::pair{"p0", value.p0}, std::pair{"p1", value.p1}}) {
    result
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             Nan::New(name).ToLocalChecked(),
                             VariantToJs(Rml::Variant(vector)).ToLocalChecked())
        .FromJust();
  }
  return result;
}

v8::Local<v8::Object> WrapFilter(const Rml::SharedPtr<Rml::Filter>& value) {
  auto state = std::make_shared<FilterState>();
  state->value = DetachFilterCallbacks(value);
  state->generation = State().generation;
  auto& registry = Filters();
  if (registry.values.size() >= registry.sweep_threshold) {
    std::erase_if(registry.values,
                  [](const auto& weak) { return weak.expired(); });
    registry.sweep_threshold = std::max(size_t{64}, registry.values.size() * 2);
  }
  registry.values.emplace_back(state);
  auto handle = FilterHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  BindFilterCallbacks(handle, state->value);
  return handle;
}

bool CopyFilter(v8::Local<v8::Value> handle,
                Rml::SharedPtr<Rml::Filter>* result) {
  auto* state = FilterOf(handle);
  if (!state) {
    return false;
  }
  *result = RetainFilterCallbacks(state->value);
  return true;
}

void ReleaseFilters() {
  ReleaseFilterCallbacks();
  for (const auto& weak : Filters().values) {
    if (auto state = weak.lock()) {
      if (!state->handle.IsEmpty()) {
        Nan::DeletePrivate(state->handle.Get(v8::Isolate::GetCurrent()),
                           Nan::New("rml.filter.callbacks").ToLocalChecked())
            .FromJust();
        state->handle.Reset();
      }
      state->value.reset();
      state->generation = 0;
    }
  }
  Filters().values.clear();
  Filters().sweep_threshold = 64;
}

NAN_MODULE_INIT(InitializeRmlFilter) {
  SetInstancerValueMethod<CreateFilter>(target, "createFilter");
  SetEffectMethod<CompileFilter>(target, "filterCompileFilter");
  SetEffectMethod<ExtendInkOverflow>(target, "filterExtendInkOverflow");
}

}  // namespace sfmlrmlui
