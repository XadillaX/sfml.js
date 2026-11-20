// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/textures/rmlui-resources.h"

#include <RmlUi/Core/Core.h>

#include <algorithm>
#include <unordered_map>
#include <utility>

#include "native/platform/system-interface-sfml.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/textures/rmlui-resource-preload.h"
#include "native/runtime/rmlui-context-instancers.h"
#include "native/runtime/rmlui-interop.h"

namespace sfmlrmlui {
namespace {

auto& InterfaceRegistry() {
  static std::unordered_map<Rml::RenderInterface*,
                            std::weak_ptr<RenderInterfaceState>>
      registry;
  return registry;
}

auto& SelectedInterface() {
  static std::shared_ptr<RenderInterfaceState> selected;
  return selected;
}

uint64_t InterfaceGeneration() {
  return State().generation + (State().initialized ? 0 : 1);
}

std::shared_ptr<RenderInterfaceState> FindInterface(
    Rml::RenderInterface* renderer) {
  const auto found = InterfaceRegistry().find(renderer);
  return found == InterfaceRegistry().end() ? nullptr : found->second.lock();
}

std::shared_ptr<RenderInterfaceState> MakeInterface(
    v8::Local<v8::Object> window_handle, sf::RenderWindow* window) {
  auto token = std::make_shared<RenderInterfaceState>();
  token->owned = std::make_shared<RenderInterfaceSFML>(
      &State().data_diagnostics, &State().callback_depth);
  token->owned->SetWindow(window);
  token->render_interface = token->owned.get();
  token->window = window;
  token->window_handle.Reset(v8::Isolate::GetCurrent(), window_handle);
  token->window_handle.SetWeak();
  token->generation = InterfaceGeneration();
  auto& registry = InterfaceRegistry();
  // Amortized cleanup runs on interface creation, never per frame.
  static size_t sweep_threshold = 64;
  if (registry.size() >= sweep_threshold) {
    std::erase_if(registry,
                  [](const auto& entry) { return entry.second.expired(); });
    sweep_threshold = std::max<size_t>(64, registry.size() * 2);
  }
  registry[token->render_interface] = token;
  ClaimRuntimeSetup();
  return token;
}

bool ReadOptionalInterface(v8::Local<v8::Value> value,
                           Rml::RenderInterface** renderer) {
  *renderer = nullptr;
  if (value->IsNullOrUndefined()) {
    return true;
  }
  *renderer = RenderInterfaceOf(value);
  return *renderer != nullptr;
}

Rml::RenderInterface* ElementRenderInterface(Rml::Element* element) {
  if (auto* context = element->GetContext()) {
    return State().contexts.at(context)->render_interface;
  }
  while (element->GetParentNode()) {
    element = element->GetParentNode();
  }
  std::vector<Rml::Element*> pending{element};
  while (!pending.empty()) {
    auto* current = pending.back();
    pending.pop_back();
    const auto found = State().render_origins.find(current);
    if (found != State().render_origins.end() && found->second.element) {
      return found->second.render_interface;
    }
    for (int i = 0; i < current->GetNumChildren(true); ++i) {
      pending.push_back(current->GetChild(i));
    }
  }
  return nullptr;
}

NAN_METHOD(CreateRenderInterface) {
  auto* window = GetRenderWindow(info[0]);
  if (!window) {
    return;
  }
  const auto token = MakeInterface(info[0].As<v8::Object>(), window);
  info.GetReturnValue().Set(WrapRenderInterface(token->render_interface));
}

NAN_METHOD(GetRenderInterface) {
  auto* renderer = Rml::GetRenderInterface();
  if (!renderer) {
    info.GetReturnValue().Set(Nan::Null());
  } else if (FindInterface(renderer)) {
    info.GetReturnValue().Set(WrapRenderInterface(renderer));
  } else {
    Nan::ThrowError("Native render interface is not owned by this binding");
  }
}

NAN_METHOD(SetRenderInterface) {
  if (State().initialized) {
    return Nan::ThrowError("Select a render interface before initialisation");
  }
  std::shared_ptr<RenderInterfaceState> token;
  if (!info[0]->IsNull()) {
    auto* renderer = RenderInterfaceOf(info[0]);
    if (!renderer) {
      return;
    }
    token = FindInterface(renderer);
  }
  ClaimRuntimeSetup();
  auto& selected = SelectedInterface();
  if (selected &&
      !State().render_interfaces.contains(selected->render_interface)) {
    selected->window_handle.SetWeak();
  }
  selected = std::move(token);
  if (selected) {
    selected->window_handle.ClearWeak();
  }
  Rml::SetRenderInterface(selected ? selected->render_interface : nullptr);
}

NAN_METHOD(GetContextRenderInterface) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(
        WrapRenderInterface(State().contexts.at(context)->render_interface));
  }
}

NAN_METHOD(GetTextureSourceList) {
  const auto sources = Rml::GetTextureSourceList();
  auto result = Nan::New<v8::Array>(sources.size());
  for (size_t i = 0; i < sources.size(); ++i) {
    Nan::Set(result, i, Nan::New(sources[i]).ToLocalChecked()).FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(ReleaseTextures) {
  Rml::RenderInterface* renderer = nullptr;
  if (ReadOptionalInterface(info[0], &renderer)) {
    InvalidateResourcePreloads(
        static_cast<RenderInterfaceSFML*>(renderer), nullptr, false);
    Rml::ReleaseTextures(renderer);
  }
}

NAN_METHOD(ReleaseTexture) {
  if (!info[0]->IsString()) {
    return Nan::ThrowTypeError("Expected a texture source string");
  }
  Rml::RenderInterface* renderer = nullptr;
  if (!ReadOptionalInterface(info[1], &renderer)) {
    return;
  }
  Nan::Utf8String source(info[0]);
  const std::string path(*source, source.length());
  Rml::String resolved = path;
  const auto sources = Rml::GetTextureSourceList();
  // Source-list entries already contain the host's canonical path. Do not
  // join them twice, and preserve RenderManager's special '?' texture sources.
  if (!path.empty() && path[0] != '?' &&
      std::find(sources.begin(), sources.end(), path) == sources.end()) {
    Rml::GetSystemInterface()->JoinPath(resolved, "", path);
    if (!State().callback_exception.IsEmpty()) {
      return;
    }
  }
  InvalidateResourcePreloads(
      static_cast<RenderInterfaceSFML*>(renderer), &path, false);
  if (resolved != path) {
    // Preparations retain the caller's source; loaded handles use JoinPath.
    // Clear both keys so the next load cannot recover an invalidated preload.
    InvalidateResourcePreloads(
        static_cast<RenderInterfaceSFML*>(renderer), &resolved, false);
  }
  info.GetReturnValue().Set(Rml::ReleaseTexture(resolved, renderer));
}

NAN_METHOD(ReleaseCompiledGeometry) {
  Rml::RenderInterface* renderer = nullptr;
  if (ReadOptionalInterface(info[0], &renderer)) {
    Rml::ReleaseCompiledGeometry(renderer);
  }
}

NAN_METHOD(ReleaseRenderManagers) {
  if (!CanReleaseGlobalResources()) {
    return;
  }
  ++State().font_generation;
  InvalidateResourcePreloads(nullptr, nullptr, false);
  InvalidateResourcePreloads(nullptr, nullptr, true);
  ReleaseRenderManagerBindings(true);
  Rml::ReleaseRenderManagers();
}

}  // namespace

bool CanReleaseGlobalResources() {
  // Upstream resource invalidation visits registered Core contexts only.
  // Independently owned contexts must release their fonts and geometry first.
  for (const auto& [context, token] : State().contexts) {
    if (IsOwnedContext(context)) {
      Nan::ThrowError("Release owned contexts before releasing global "
                      "font resources or render managers");
      return false;
    }
  }
  // Detached trees retain font handles and Geometry/CallbackTexture resources,
  // but upstream invalidation visits only the context-owned trees.
  for (const auto& [pointer, weak] : State().elements) {
    if (auto token = weak.lock(); token && token->owned) {
      Nan::ThrowError("Reattach or collect detached elements before releasing "
                      "font resources or render managers");
      return false;
    }
  }
  return true;
}

void PrepareRenderInterface(v8::Local<v8::Object> window_handle) {
  auto& selected = SelectedInterface();
  if (!selected) {
    selected = MakeInterface(window_handle, GetRenderWindow(window_handle));
  }
  State().render_interface = selected->owned;
  RetainRenderInterface(selected->render_interface);
  Rml::SetRenderInterface(selected->render_interface);
}

bool RetainRenderInterface(Rml::RenderInterface* renderer) {
  const auto token = FindInterface(renderer);
  if (!token || !token->render_interface ||
      token->generation != InterfaceGeneration()) {
    Nan::ThrowError("RmlUi render interface is no longer valid");
    return false;
  }
  token->window_handle.ClearWeak();
  State().render_interfaces.emplace(renderer, token);
  return true;
}

void ReleaseRenderInterfaceStates() {
  State().render_interface.reset();
  for (auto& [pointer, weak] : InterfaceRegistry()) {
    if (auto token = weak.lock()) {
      token->render_interface = nullptr;
      token->owned.reset();
      token->window = nullptr;
      if (!token->handle.IsEmpty()) {
        Nan::SetPrivate(token->handle.Get(v8::Isolate::GetCurrent()),
                        Nan::New("rml.render.window").ToLocalChecked(),
                        Nan::Undefined())
            .FromJust();
      }
      token->handle.Reset();
      token->window_handle.Reset();
    }
  }
  InterfaceRegistry().clear();
  State().render_interfaces.clear();
  SelectedInterface().reset();
}

Rml::RenderInterface* RenderInterfaceOf(v8::Local<v8::Value> value) {
  auto* handle = RenderInterfaceHandle::From(value);
  if (!handle) {
    return nullptr;
  }
  const auto& token = handle->owner();
  if (!token->render_interface || token->generation != InterfaceGeneration()) {
    Nan::ThrowError("RmlUi render interface is no longer valid");
    return nullptr;
  }
  return token->render_interface;
}

v8::Local<v8::Object> WrapRenderInterface(Rml::RenderInterface* renderer) {
  const auto token = FindInterface(renderer);
  if (!token) {
    Nan::ThrowError("Native render interface is not owned by this binding");
    return Nan::New<v8::Object>();
  }
  if (!token->handle.IsEmpty()) {
    return token->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = RenderInterfaceHandle::Create(token);
  Nan::SetPrivate(handle,
                  Nan::New("rml.render.window").ToLocalChecked(),
                  token->window_handle.Get(v8::Isolate::GetCurrent()))
      .FromJust();
  token->handle.Reset(v8::Isolate::GetCurrent(), handle);
  token->handle.SetWeak();
  return handle;
}

sf::RenderWindow* RenderWindowFor(Rml::RenderInterface* renderer) {
  const auto token = FindInterface(renderer);
  return token ? token->window : nullptr;
}

bool CanTransferBetweenRenderInterfaces(Rml::Element* parent,
                                        Rml::Element* child) {
  auto* destination = ElementRenderInterface(parent);
  auto* origin = ElementRenderInterface(child);
  if (destination && origin && destination != origin) {
    Nan::ThrowError("Cannot move elements between different render interfaces; "
                    "clone the subtree to create independent resources");
    return false;
  }
  return true;
}

void RememberElementRenderInterface(Rml::Element* element) {
  auto* renderer = ElementRenderInterface(element);
  if (!renderer) {
    return;
  }
  std::vector<Rml::Element*> pending{element};
  while (!pending.empty()) {
    auto* current = pending.back();
    pending.pop_back();
    State().render_origins[current] = {current->GetObserverPtr(), renderer};
    for (int i = 0; i < current->GetNumChildren(true); ++i) {
      pending.push_back(current->GetChild(i));
    }
  }
}

NAN_MODULE_INIT(InitializeRmlResources) {
  SetRuntimeMethod<CreateRenderInterface, false, false>(
      target, "createRenderInterface");
  SetRuntimeMethod<GetRenderInterface, true, false>(target,
                                                    "getRenderInterface");
  SetRuntimeMethod<SetRenderInterface, false, false>(target,
                                                     "setRenderInterface");
  SetRuntimeMethod<GetContextRenderInterface, true>(
      target, "getContextRenderInterface");
  SetRuntimeMethod<GetTextureSourceList, true>(target, "getTextureSourceList");
  SetRuntimeMethod<ReleaseTexture>(target, "releaseTexture");
  SetRuntimeMethod<ReleaseTextures>(target, "releaseTextures");
  SetRuntimeMethod<ReleaseCompiledGeometry>(target, "releaseCompiledGeometry");
  SetRuntimeMethod<ReleaseRenderManagers>(target, "releaseRenderManagers");
}

}  // namespace sfmlrmlui
