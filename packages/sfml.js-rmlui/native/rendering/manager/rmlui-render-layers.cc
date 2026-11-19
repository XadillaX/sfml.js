// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/manager/rmlui-render-layers.h"

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/rendering/manager/rmlui-render-state.h"
#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/textures/rmlui-resources.h"

namespace sfmlrmlui {
namespace {

struct LayerState {
  std::shared_ptr<RenderManagerState> manager;
  Rml::LayerHandle value{0};
  uint64_t serial{0};
  v8::Global<v8::Object> handle;
};

using LayerHandle = sfmljs::SharedHandle<LayerState>;

struct LayerFrame {
  Rml::LayerHandle value;
  uint64_t serial;
  unsigned effect_depth;
};

struct LayerStack {
  std::shared_ptr<RenderManagerState> manager;
  std::vector<LayerFrame> pushed;
};

auto& Stacks() {
  static std::unordered_map<Rml::RenderManager*, LayerStack> stacks;
  return stacks;
}

auto& Layers() {
  static std::unordered_map<Rml::RenderManager*,
                            std::vector<std::weak_ptr<LayerState>>>
      layers;
  return layers;
}

RenderInterfaceSFML* Renderer(const RenderManagerState& manager) {
  if (manager.render_interface == State().render_interface.get()) {
    return State().render_interface.get();
  }
  const auto found = State().render_interfaces.find(manager.render_interface);
  if (found != State().render_interfaces.end() && found->second->owned) {
    return found->second->owned.get();
  }
  Nan::ThrowError("Render manager has no supported live renderer");
  return nullptr;
}

v8::Local<v8::Object> WrapLayer(
    const std::shared_ptr<RenderManagerState>& manager,
    Rml::LayerHandle value) {
  auto* renderer = Renderer(*manager);
  if (!renderer) {
    return Nan::New<v8::Object>();
  }
  const uint64_t serial = renderer->GetLayerSerial(value);
  std::erase_if(Layers(), [](const auto& entry) {
    return std::all_of(entry.second.begin(),
                       entry.second.end(),
                       [](const auto& weak) { return weak.expired(); });
  });
  auto& entries = Layers()[manager->value];
  std::erase_if(entries, [](const auto& weak) { return weak.expired(); });
  for (const auto& weak : entries) {
    auto state = weak.lock();
    if (state && state->value == value && state->serial == serial &&
        !state->handle.IsEmpty()) {
      return state->handle.Get(v8::Isolate::GetCurrent());
    }
  }
  auto state = std::make_shared<LayerState>();
  state->manager = manager;
  state->value = value;
  state->serial = serial;
  auto handle = LayerHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  entries.push_back(state);
  return handle;
}

bool ReadLayer(v8::Local<v8::Value> input,
               const std::shared_ptr<RenderManagerState>& manager,
               Rml::LayerHandle* result) {
  auto* handle = LayerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a checked layer handle");
    return false;
  }
  const auto& state = *handle->owner();
  if (!state.manager->value ||
      state.manager->generation != State().generation) {
    Nan::ThrowError("Layer handle is no longer valid");
    return false;
  }
  if (state.manager != manager) {
    Nan::ThrowError("Layer belongs to a different render manager");
    return false;
  }
  auto* renderer = Renderer(*manager);
  if (!renderer) {
    return false;
  }
  if (state.value && (!state.serial ||
                      renderer->GetLayerSerial(state.value) != state.serial)) {
    Nan::ThrowError("Layer handle is no longer active");
    return false;
  }
  *result = state.value;
  return true;
}

bool CheckActiveTarget(const RenderManagerState& manager) {
  auto* renderer = Renderer(manager);
  if (!renderer) {
    return false;
  }
  if (renderer->GetActiveLayer() != manager.value->GetTopLayer()) {
    Nan::ThrowError("A different render manager has an active layer");
    return false;
  }
  return true;
}

NAN_METHOD(PushLayer) {
  auto manager = RenderManagerOf(info[0]);
  if (!manager || !CheckActiveTarget(*manager)) {
    return;
  }
  const auto value = manager->value->PushLayer();
  auto& stack = Stacks()[manager->value];
  stack.manager = manager;
  stack.pushed.push_back({value,
                          Renderer(*manager)->GetLayerSerial(value),
                          State().effect_callback_depth});
  info.GetReturnValue().Set(WrapLayer(manager, value));
}

NAN_METHOD(PopLayer) {
  auto manager = RenderManagerOf(info[0]);
  if (!manager || !CheckActiveTarget(*manager)) {
    return;
  }
  const auto found = Stacks().find(manager->value);
  const auto value = manager->value->GetTopLayer();
  if (!value || found == Stacks().end() || found->second.pushed.empty() ||
      found->second.pushed.back().value != value ||
      found->second.pushed.back().serial !=
          Renderer(*manager)->GetLayerSerial(value)) {
    return Nan::ThrowError("No binding-owned layer to pop; layer stack empty");
  }
  if (State().effect_callback_depth &&
      found->second.pushed.back().effect_depth !=
          State().effect_callback_depth) {
    return Nan::ThrowError(
        "Cannot pop a layer owned by another callback scope");
  }
  manager->value->PopLayer();
  found->second.pushed.pop_back();
  if (found->second.pushed.empty()) {
    Stacks().erase(found);
  }
}

template <bool next>
NAN_METHOD(GetLayer) {
  auto manager = RenderManagerOf(info[0]);
  if (!manager) {
    return;
  }
  if constexpr (next) {
    if (!manager->value->GetTopLayer()) {
      return Nan::ThrowError("Layer stack is empty");
    }
  }
  info.GetReturnValue().Set(WrapLayer(
      manager,
      next ? manager->value->GetNextLayer() : manager->value->GetTopLayer()));
}

NAN_METHOD(CompositeLayers) {
  auto manager = RenderManagerOf(info[0]);
  if (!manager || !CheckActiveTarget(*manager)) {
    return;
  }
  Rml::LayerHandle source = 0;
  Rml::LayerHandle destination = 0;
  if (!ReadLayer(info[1], manager, &source) ||
      !ReadLayer(info[2], manager, &destination)) {
    return;
  }
  if (!info[3]->IsInt32() || Nan::To<int32_t>(info[3]).FromJust() < 0 ||
      Nan::To<int32_t>(info[3]).FromJust() > 1) {
    return Nan::ThrowRangeError("Expected BlendMode Blend or Replace");
  }
  std::vector<Rml::CompiledFilterHandle> filters;
  if (!ReadFilterHandles(info[4], manager->value, &filters)) {
    return;
  }
  manager->value->CompositeLayers(
      source,
      destination,
      static_cast<Rml::BlendMode>(Nan::To<int32_t>(info[3]).FromJust()),
      filters);
}

NAN_METHOD(SaveMask) {
  auto manager = RenderManagerOf(info[0]);
  if (manager && CheckActiveTarget(*manager)) {
    info.GetReturnValue().Set(WrapCompiledFilter(
        manager->value->SaveLayerAsMaskImage(), manager->value));
  }
}

}  // namespace

bool CanRenderToManager(Rml::RenderManager* manager) {
  return CheckActiveTarget(*ShareRenderManager(manager));
}

bool CanPrepareRender(Rml::RenderManager* manager) {
  if (manager->GetTopLayer()) {
    Nan::ThrowError("Render layer stack must be balanced before PrepareRender");
    return false;
  }
  auto state = ShareRenderManager(manager);
  auto* renderer = Renderer(*state);
  if (!renderer) {
    return false;
  }
  if (renderer->GetActiveLayer()) {
    Nan::ThrowError("A different render manager has an active layer");
    return false;
  }
  return true;
}

void ClearRenderLayers(RenderManagerState* manager) {
  const auto found = Stacks().find(manager->value);
  if (found != Stacks().end()) {
    auto* renderer = Renderer(*manager);
    while (!found->second.pushed.empty()) {
      const auto frame = found->second.pushed.back();
      const auto value = frame.value;
      const auto serial = frame.serial;
      if (renderer && renderer->GetActiveLayer() == value &&
          renderer->GetLayerSerial(value) == serial &&
          manager->value->GetTopLayer() == value) {
        manager->value->PopLayer();
      }
      found->second.pushed.pop_back();
    }
    Stacks().erase(found);
  }
  Layers().erase(manager->value);
}

void RestoreRenderCallbackLayers(bool exception_pending) {
  bool unbalanced = false;
  for (auto it = Stacks().begin(); it != Stacks().end();) {
    auto& stack = it->second;
    auto* renderer = Renderer(*stack.manager);
    while (!stack.pushed.empty() &&
           stack.pushed.back().effect_depth == State().effect_callback_depth) {
      const auto frame = stack.pushed.back();
      if (renderer && renderer->GetActiveLayer() == frame.value &&
          renderer->GetLayerSerial(frame.value) == frame.serial &&
          stack.manager->value->GetTopLayer() == frame.value) {
        stack.manager->value->PopLayer();
      }
      stack.pushed.pop_back();
      unbalanced = true;
    }
    if (stack.pushed.empty()) {
      it = Stacks().erase(it);
    } else {
      ++it;
    }
  }
  if (unbalanced && !exception_pending) {
    CaptureCallbackException(
        Nan::Error("Unbalanced render layers in callback"));
  }
}

NAN_MODULE_INIT(InitializeRmlRenderLayers) {
  SetRenderStateMethod<PushLayer>(target, "renderManagerPushLayer");
  SetRenderStateMethod<PopLayer>(target, "renderManagerPopLayer");
  SetRenderStateMethod<GetLayer<false>, true>(target,
                                              "renderManagerGetTopLayer");
  SetRenderStateMethod<GetLayer<true>, true>(target,
                                             "renderManagerGetNextLayer");
  SetRenderStateMethod<CompositeLayers>(target, "renderManagerCompositeLayers");
  SetRenderStateMethod<SaveMask>(target, "renderManagerSaveLayerAsMaskImage");
}

}  // namespace sfmlrmlui
