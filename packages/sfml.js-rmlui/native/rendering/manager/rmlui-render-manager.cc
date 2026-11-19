// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/manager/rmlui-render-manager.h"

#include <algorithm>
#include <cmath>
#include <memory>
#include <type_traits>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/rendering/geometry/rmlui-geometry.h"
#include "native/rendering/manager/rmlui-render-layers.h"
#include "native/rendering/manager/rmlui-render-state.h"
#include "native/rendering/textures/rmlui-callback-texture.h"
#include "native/rendering/textures/rmlui-resources.h"
#include "native/rendering/textures/rmlui-texture-source.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-decorator.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

using ManagerState = RenderManagerState;

using ManagerHandle = sfmljs::SharedHandle<ManagerState>;

auto& Managers() {
  static std::unordered_map<Rml::RenderManager*, std::weak_ptr<ManagerState>>
      registry;
  return registry;
}

auto& OwnedManagers() {
  // Native font layers cache glyph callback textures per manager. They are
  // not JS resources and may outlive the last context or manager wrapper.
  static std::vector<std::shared_ptr<ManagerState>> values;
  return values;
}

template <typename T>
struct ResourceState {
  // Destroy the unique resource before its manager lease.
  std::shared_ptr<ManagerState> manager;
  T value;
  uint64_t generation{0};
  bool transferred{false};
};

template <typename T>
using ResourceHandle = sfmljs::SharedHandle<ResourceState<T>>;

template <typename T>
struct ResourceRegistry {
  std::vector<std::weak_ptr<ResourceState<T>>> values;
  size_t sweep_threshold{64};
};

template <typename T>
auto& Resources() {
  static ResourceRegistry<T> registry;
  return registry;
}

struct FilterListState {
  std::vector<std::shared_ptr<ResourceState<Rml::CompiledFilter>>> values;
  uint64_t generation{0};
};

using FilterListHandle = sfmljs::SharedHandle<FilterListState>;

std::shared_ptr<ManagerState> ShareManager(Rml::RenderManager* manager) {
  auto& registry = Managers();
  const auto found = registry.find(manager);
  if (found != registry.end()) {
    if (auto state = found->second.lock()) {
      return state;
    }
  }
  // Dead manager keys are retained only until the next acquisition.
  std::erase_if(registry,
                [](const auto& entry) { return entry.second.expired(); });
  auto state = std::make_shared<ManagerState>();
  state->value = manager;
  state->generation = State().generation;
  state->render_interface = State().instancing_render_interface;
  for (const auto& [context, token] : State().contexts) {
    if (&context->GetRenderManager() == manager) {
      state->render_interface = token->render_interface;
      break;
    }
  }
  registry[manager] = state;
  return state;
}

std::shared_ptr<ManagerState> ManagerOf(v8::Local<v8::Value> input) {
  auto* handle = ManagerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a render manager");
    return {};
  }
  auto state = handle->owner();
  if (!RuntimeReady()) {
    return {};
  }
  if (!state->value || state->generation != State().generation) {
    Nan::ThrowError("Render manager is no longer valid");
    return {};
  }
  return state;
}

template <typename T>
std::shared_ptr<ResourceState<T>> ResourceOf(v8::Local<v8::Value> input) {
  auto* handle = ResourceHandle<T>::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError(std::is_same_v<T, Rml::CompiledFilter>
                            ? "Expected a compiled filter"
                            : "Expected a compiled shader");
    return {};
  }
  auto state = handle->owner();
  if (!RuntimeReady()) {
    return {};
  }
  if (state->generation != State().generation ||
      (state->manager && !state->manager->value)) {
    Nan::ThrowError("Compiled resource is no longer valid");
    return {};
  }
  return state;
}

template <typename T>
v8::Local<v8::Object> WrapResource(T value, Rml::RenderManager* manager) {
  auto state = std::make_shared<ResourceState<T>>();
  if (manager) {
    state->manager = ShareManager(manager);
  }
  state->value = std::move(value);
  state->generation = State().generation;
  auto& registry = Resources<T>();
  if (registry.values.size() >= registry.sweep_threshold) {
    std::erase_if(registry.values,
                  [](const auto& entry) { return entry.expired(); });
    registry.sweep_threshold = std::max(size_t{64}, registry.values.size() * 2);
  }
  registry.values.emplace_back(state);
  return ResourceHandle<T>::Create(std::move(state));
}

FilterListState* FilterListOf(v8::Local<v8::Value> input) {
  auto* handle = FilterListHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a filter handle list");
    return nullptr;
  }
  auto* state = handle->owner().get();
  if (state->generation != State().generation) {
    Nan::ThrowError("Filter handle list is no longer valid");
    return nullptr;
  }
  return state;
}

bool ReadParameters(v8::Local<v8::Value> input, Rml::Dictionary* result) {
  if (!DictionaryFromJs(input, result)) {
    return false;
  }
  for (const auto& [name, value] : *result) {
    switch (value.GetType()) {
      case Rml::Variant::NONE:
      case Rml::Variant::BOOL:
      case Rml::Variant::BYTE:
      case Rml::Variant::CHAR:
      case Rml::Variant::FLOAT:
      case Rml::Variant::DOUBLE:
      case Rml::Variant::INT:
      case Rml::Variant::UINT:
      case Rml::Variant::INT64:
      case Rml::Variant::UINT64:
      case Rml::Variant::STRING:
      case Rml::Variant::VECTOR2:
      case Rml::Variant::VECTOR3:
      case Rml::Variant::VECTOR4:
      case Rml::Variant::COLOURB:
      case Rml::Variant::COLOURF:
      case Rml::Variant::COLORSTOPLIST:
        break;
      default:
        Nan::ThrowTypeError("Expected scalar, vector, colour or colour-stop "
                            "render parameters");
        return false;
    }
  }
  return true;
}

bool CheckFilterParameters(const Rml::String& name,
                           const Rml::Dictionary& parameters) {
  if (IsColorFilterName(name)) {
    if (!CompileColorFilter(name, parameters)) {
      Nan::ThrowTypeError("Expected finite value filter parameter");
      return false;
    }
    return true;
  }
  if (name != "blur" && name != "drop-shadow") {
    return true;
  }
  const auto sigma = parameters.find("sigma");
  float value;
  if (sigma == parameters.end() || !sigma->second.GetInto(value) ||
      !std::isfinite(value)) {
    Nan::ThrowTypeError("Expected finite sigma filter parameter");
    return false;
  }
  if (name == "drop-shadow") {
    const auto offset = parameters.find("offset");
    const auto colour = parameters.find("color");
    if (offset == parameters.end() ||
        offset->second.GetType() != Rml::Variant::VECTOR2 ||
        colour == parameters.end() ||
        colour->second.GetType() != Rml::Variant::COLOURB) {
      Nan::ThrowTypeError("Expected drop-shadow offset vector and color bytes");
      return false;
    }
  }
  return true;
}

NAN_METHOD(CreateManager) {
  auto* renderer = RenderInterfaceOf(info[0]);
  if (!renderer) {
    return;
  }
  if (!RetainRenderInterface(renderer)) {
    return;
  }
  auto owned = std::make_unique<Rml::RenderManager>(renderer);
  auto state = ShareManager(owned.get());
  state->owned = std::move(owned);
  state->render_interface = renderer;
  OwnedManagers().push_back(state);
  info.GetReturnValue().Set(WrapRenderManager(state->value));
}

NAN_METHOD(GetContextManager) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(WrapRenderManager(&context->GetRenderManager()));
  }
}

NAN_METHOD(GetElementManager) {
  if (auto* element = ElementOf(info[0])) {
    if (auto* manager = element->GetRenderManager()) {
      info.GetReturnValue().Set(WrapRenderManager(manager));
    } else {
      info.GetReturnValue().Set(Nan::Null());
    }
  }
}

template <typename T>
NAN_METHOD(CreateResource) {
  info.GetReturnValue().Set(WrapResource(T{}, nullptr));
}

template <typename T>
NAN_METHOD(CompileResource) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a render resource name");
  }
  Nan::Utf8String text(info[1]);
  const Rml::String name(*text, text.length());
  Rml::Dictionary parameters;
  if (!ReadParameters(info[2], &parameters)) {
    return;
  }
  // Accessors in the dictionary may remove contexts or restart the runtime.
  auto manager = ManagerOf(info[0]);
  if (!manager) {
    return;
  }
  if constexpr (std::is_same_v<T, Rml::CompiledFilter>) {
    if (CheckFilterParameters(name, parameters)) {
      info.GetReturnValue().Set(WrapResource(
          manager->value->CompileFilter(name, parameters), manager->value));
    }
  } else {
    info.GetReturnValue().Set(WrapResource(
        manager->value->CompileShader(name, parameters), manager->value));
  }
}

template <typename T>
NAN_METHOD(ResourceIsValid) {
  if (auto state = ResourceOf<T>(info[0])) {
    info.GetReturnValue().Set(static_cast<bool>(state->value));
  }
}

template <typename T>
NAN_METHOD(ReleaseResource) {
  if (auto state = ResourceOf<T>(info[0])) {
    state->value.Release();
  }
}

NAN_METHOD(CreateFilterList) {
  auto state = std::make_shared<FilterListState>();
  state->generation = State().generation;
  info.GetReturnValue().Set(FilterListHandle::Create(std::move(state)));
}

NAN_METHOD(AppendFilter) {
  auto filter = ResourceOf<Rml::CompiledFilter>(info[0]);
  auto* list = FilterListOf(info[1]);
  if (filter && list && filter->value) {
    list->values.push_back(std::move(filter));
  }
}

NAN_METHOD(FilterListSize) {
  if (auto* list = FilterListOf(info[0])) {
    info.GetReturnValue().Set(static_cast<double>(list->values.size()));
  }
}

NAN_METHOD(ClearFilterList) {
  if (auto* list = FilterListOf(info[0])) {
    list->values.clear();
  }
}

template <typename T>
void ReleaseResources(bool unused_only) {
  auto& registry = Resources<T>();
  for (const auto& weak : registry.values) {
    if (auto state = weak.lock();
        state && (!unused_only || (state->manager && !state->manager->value))) {
      state->value.Release();
      state->generation = 0;
    }
  }
  if (!unused_only) {
    registry.values.clear();
    registry.sweep_threshold = 64;
  }
}

}  // namespace

std::shared_ptr<RenderManagerState> ShareRenderManager(
    Rml::RenderManager* manager) {
  return ShareManager(manager);
}

std::shared_ptr<RenderManagerState> RenderManagerOf(
    v8::Local<v8::Value> input) {
  return ManagerOf(input);
}

const Rml::CompiledShader* CompiledShaderOf(v8::Local<v8::Value> input,
                                            Rml::RenderManager* manager) {
  auto state = ResourceOf<Rml::CompiledShader>(input);
  if (!state) {
    return nullptr;
  }
  if (state->value && (!state->manager || state->manager->value != manager)) {
    Nan::ThrowError("Shader belongs to a different render manager");
    return nullptr;
  }
  return &state->value;
}

v8::Local<v8::Object> WrapRenderManager(Rml::RenderManager* manager) {
  auto state = ShareManager(manager);
  if (!state->handle.IsEmpty()) {
    return state->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = ManagerHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  return handle;
}

v8::Local<v8::Object> WrapCompiledFilter(Rml::CompiledFilter value,
                                         Rml::RenderManager* manager) {
  return WrapResource(std::move(value), manager);
}

bool TakeCompiledFilter(v8::Local<v8::Value> input,
                        Rml::RenderManager* manager,
                        Rml::CompiledFilter* result) {
  auto state = ResourceOf<Rml::CompiledFilter>(input);
  if (!state) {
    return false;
  }
  if (state->transferred) {
    Nan::ThrowError("Compiled filter has already been transferred");
    return false;
  }
  if (state->value && (!state->manager || state->manager->value != manager)) {
    Nan::ThrowError("Compiled filter belongs to a different render manager");
    return false;
  }
  *result = std::move(state->value);
  state->transferred = true;
  return true;
}

bool ReadFilterHandles(v8::Local<v8::Value> input,
                       Rml::RenderManager* manager,
                       std::vector<Rml::CompiledFilterHandle>* result) {
  if (input->IsNullOrUndefined()) {
    return true;
  }
  auto* list = FilterListOf(input);
  if (!list) {
    return false;
  }
  for (const auto& filter : list->values) {
    if (filter->generation != State().generation || !filter->value) {
      Nan::ThrowError("Filter list contains an empty or released filter");
      return false;
    }
    if (!filter->manager || filter->manager->value != manager) {
      Nan::ThrowError("Filter belongs to a different render manager");
      return false;
    }
    filter->value.AddHandleTo(*result);
  }
  return true;
}

void ReleaseRenderManagerBindings(bool unused_only) {
  std::vector<std::shared_ptr<ManagerState>> released;
  for (const auto& [pointer, weak] : Managers()) {
    auto state = weak.lock();
    if (!state) {
      continue;
    }
    if (unused_only && (state->owned ||
                        std::any_of(State().contexts.begin(),
                                    State().contexts.end(),
                                    [pointer](const auto& entry) {
                                      return &entry.first->GetRenderManager() ==
                                             pointer;
                                    }))) {
      continue;
    }
    ReleaseDecoratorManagerData(state->value);
    ClearRenderLayers(state.get());
    ClearRenderClipStorage(state.get());
    state->value = nullptr;
    state->generation = 0;
    released.push_back(std::move(state));
  }
  // The unique resources still store their original native manager pointers.
  // Managers remain alive until all their resources have been released.
  ReleaseResources<Rml::CompiledFilter>(unused_only);
  ReleaseResources<Rml::CompiledShader>(unused_only);
  ReleaseDecoratorBindings(unused_only);
  ReleaseGeometryBindings(unused_only);
  ReleaseTextureSourceBindings(unused_only);
  ReleaseCallbackTextureBindings(unused_only);
  for (const auto& state : released) {
    state->owned.reset();
  }
  std::erase_if(Managers(), [](const auto& entry) {
    auto state = entry.second.lock();
    return !state || !state->value;
  });
  if (!unused_only) {
    OwnedManagers().clear();
  }
}

NAN_MODULE_INIT(InitializeRmlRenderManager) {
  SetRuntimeMethod<CreateManager>(target, "createRenderManager");
  SetRuntimeMethod<GetContextManager, true>(target, "getContextRenderManager");
  SetEffectMethod<GetElementManager>(target, "getElementRenderManager");
  SetInstancerValueMethod<CreateResource<Rml::CompiledFilter>>(
      target, "createCompiledFilter");
  SetInstancerValueMethod<CreateResource<Rml::CompiledShader>>(
      target, "createCompiledShader");
  SetEffectMethod<CompileResource<Rml::CompiledFilter>>(target,
                                                        "compileRenderFilter");
  SetEffectMethod<CompileResource<Rml::CompiledShader>>(target,
                                                        "compileRenderShader");
  SetEffectMethod<ResourceIsValid<Rml::CompiledFilter>>(
      target, "compiledFilterIsValid");
  SetEffectMethod<ResourceIsValid<Rml::CompiledShader>>(
      target, "compiledShaderIsValid");
  SetEffectMethod<ReleaseResource<Rml::CompiledFilter>>(
      target, "releaseCompiledFilter");
  SetEffectMethod<ReleaseResource<Rml::CompiledShader>>(
      target, "releaseCompiledShader");
  SetRenderStateMethod<CreateFilterList>(target, "createFilterHandleList");
  SetRenderStateMethod<AppendFilter>(target, "appendCompiledFilter");
  SetRenderStateMethod<FilterListSize, true>(target, "filterHandleListSize");
  SetRenderStateMethod<ClearFilterList>(target, "clearFilterHandleList");
}

}  // namespace sfmlrmlui
