// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/geometry/rmlui-geometry.h"

#include <RmlUi/Core/Geometry.h>

#include <algorithm>
#include <memory>
#include <type_traits>
#include <utility>
#include <vector>

#include "native/dom/elements/rmlui-box.h"
#include "native/fonts/rmlui-font-glyph.h"
#include "native/rendering/geometry/rmlui-mesh.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

static_assert(static_cast<uint32_t>(Rml::Geometry::InvalidHandle()) ==
              4294967295u);

template <typename T>
struct ResourceState {
  // The resource must be destroyed before its manager.
  std::shared_ptr<RenderManagerState> manager;
  // Callback texture views retain unique ownership and verify release before
  // accessing an upstream database index that may already have been reused.
  std::shared_ptr<void> texture_owner;
  std::function<bool()> texture_valid;
  T value;
  uint64_t generation{0};
};

template <typename T>
using ResourceHandle = sfmljs::SharedHandle<ResourceState<T>>;

template <typename T>
struct Registry {
  std::vector<std::weak_ptr<ResourceState<T>>> values;
  size_t sweep_threshold{64};
};

template <typename T>
auto& Resources() {
  static Registry<T> registry;
  return registry;
}

template <typename T>
std::shared_ptr<ResourceState<T>> ResourceOf(v8::Local<v8::Value> input) {
  auto* handle = ResourceHandle<T>::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError(std::is_same_v<T, Rml::Geometry>
                            ? "Expected an owned geometry"
                            : "Expected a texture view");
    return {};
  }
  auto state = handle->owner();
  if (!RuntimeReady()) {
    return {};
  }
  if (state->generation != State().generation ||
      (state->manager && !state->manager->value) ||
      (state->texture_valid && !state->texture_valid())) {
    Nan::ThrowError("Geometry or texture is no longer valid");
    return {};
  }
  return state;
}

template <typename T>
v8::Local<v8::Object> WrapResource(T value, Rml::RenderManager* manager) {
  auto state = std::make_shared<ResourceState<T>>();
  state->value = std::move(value);
  if (manager) {
    state->manager = ShareRenderManager(manager);
  }
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

template <typename T>
NAN_METHOD(CreateResource) {
  info.GetReturnValue().Set(WrapResource(T{}, nullptr));
}

template <typename T>
NAN_METHOD(IsValid) {
  if (auto state = ResourceOf<T>(info[0])) {
    info.GetReturnValue().Set(static_cast<bool>(state->value));
  }
}

NAN_METHOD(MakeGeometry) {
  auto manager = RenderManagerOf(info[0]);
  if (!manager) {
    return;
  }
  Rml::Mesh mesh;
  if (TakeMesh(info[1], &mesh)) {
    info.GetReturnValue().Set(WrapResource(
        manager->value->MakeGeometry(std::move(mesh)), manager->value));
  }
}

NAN_METHOD(GetMesh) {
  if (auto state = ResourceOf<Rml::Geometry>(info[0])) {
    if (!state->value) {
      return Nan::ThrowError("Geometry is empty or released");
    }
    info.GetReturnValue().Set(WrapMesh(state->value.GetMesh()));
  }
}

NAN_METHOD(ReleaseGeometry) {
  if (!info[1]->IsUint32() || Nan::To<uint32_t>(info[1]).FromJust() > 1) {
    return Nan::ThrowRangeError("Expected a geometry release mode");
  }
  if (auto state = ResourceOf<Rml::Geometry>(info[0])) {
    auto mode = static_cast<Rml::Geometry::ReleaseMode>(
        Nan::To<uint32_t>(info[1]).FromJust());
    info.GetReturnValue().Set(WrapMesh(state->value.Release(mode)));
  }
}

NAN_METHOD(RenderGeometry) {
  Rml::Vector2f translation;
  if (!ReadBoxVector(info[1], &translation)) {
    return;
  }
  // Resolve every resource after accessors, which can shut down the runtime.
  auto state = ResourceOf<Rml::Geometry>(info[0]);
  if (!state) {
    return;
  }
  auto* manager = state->manager ? state->manager->value : nullptr;
  Rml::Texture texture;
  if (!info[2]->IsNullOrUndefined() &&
      !ReadTexture(info[2], manager, &texture)) {
    return;
  }
  const Rml::CompiledShader empty_shader;
  const auto* shader = &empty_shader;
  if (!info[3]->IsNullOrUndefined()) {
    shader = CompiledShaderOf(info[3], manager);
    if (!shader) {
      return;
    }
  }
  state->value.Render(translation, texture, *shader);
}

NAN_METHOD(LoadTexture) {
  if (!info[1]->IsString() || !info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected texture source and document path");
  }
  Nan::Utf8String source(info[1]);
  Nan::Utf8String path(info[2]);
  if (auto manager = RenderManagerOf(info[0])) {
    info.GetReturnValue().Set(WrapTexture(
        manager->value->LoadTexture(Rml::String(*source, source.length()),
                                    Rml::String(*path, path.length())),
        manager->value));
  }
}

NAN_METHOD(GetTextureDimensions) {
  if (auto state = ResourceOf<Rml::Texture>(info[0])) {
    info.GetReturnValue().Set(GlyphVectorToJs(state->value.GetDimensions()));
  }
}

NAN_METHOD(TextureEquals) {
  auto left = ResourceOf<Rml::Texture>(info[0]);
  if (!left) {
    return;
  }
  auto right = ResourceOf<Rml::Texture>(info[1]);
  if (left && right) {
    info.GetReturnValue().Set(left->value == right->value);
  }
}

template <typename T>
void ReleaseResources(bool unused_only) {
  auto& registry = Resources<T>();
  for (const auto& weak : registry.values) {
    if (auto state = weak.lock();
        state && (!unused_only || (state->manager && !state->manager->value))) {
      if constexpr (std::is_same_v<T, Rml::Geometry>) {
        state->value.Release(Rml::Geometry::ReleaseMode::ClearMesh);
      } else {
        state->value = {};
      }
      state->generation = 0;
    }
  }
  if (!unused_only) {
    registry.values.clear();
    registry.sweep_threshold = 64;
  }
}

}  // namespace

Rml::Geometry* GeometryOf(v8::Local<v8::Value> input,
                          Rml::RenderManager* manager,
                          bool require_valid) {
  auto state = ResourceOf<Rml::Geometry>(input);
  if (!state) {
    return nullptr;
  }
  if (require_valid && !state->value) {
    Nan::ThrowError("Geometry is empty or released");
    return nullptr;
  }
  if (manager && (!state->manager || state->manager->value != manager)) {
    Nan::ThrowError("Geometry belongs to a different render manager");
    return nullptr;
  }
  return &state->value;
}

v8::Local<v8::Object> WrapGeometrySnapshot(const Rml::Geometry& geometry,
                                           Rml::RenderManager* manager) {
  if (!manager || !geometry) {
    return WrapResource(Rml::Geometry{}, manager);
  }
  return WrapResource(manager->MakeGeometry(Rml::Mesh(geometry.GetMesh())),
                      manager);
}

v8::Local<v8::Object> WrapTexture(Rml::Texture value,
                                  Rml::RenderManager* manager,
                                  std::shared_ptr<void> owner,
                                  std::function<bool()> valid,
                                  v8::Local<v8::Value> edge) {
  auto handle = WrapResource(value, manager);
  auto state = ResourceHandle<Rml::Texture>::TryFrom(handle)->owner();
  state->texture_owner = std::move(owner);
  state->texture_valid = std::move(valid);
  if (!edge.IsEmpty()) {
    Nan::SetPrivate(
        handle, Nan::New("rml.texture.owner").ToLocalChecked(), edge)
        .FromJust();
  }
  return handle;
}

bool ReadTexture(v8::Local<v8::Value> input,
                 Rml::RenderManager* manager,
                 Rml::Texture* result) {
  auto state = ResourceOf<Rml::Texture>(input);
  if (!state) {
    return false;
  }
  if (state->value && (!state->manager || state->manager->value != manager)) {
    Nan::ThrowError("Texture belongs to a different render manager");
    return false;
  }
  *result = state->value;
  return true;
}

void ReleaseGeometryBindings(bool unused_only) {
  ReleaseResources<Rml::Geometry>(unused_only);
  ReleaseResources<Rml::Texture>(unused_only);
}

NAN_MODULE_INIT(InitializeRmlGeometry) {
  SetInstancerValueMethod<CreateResource<Rml::Geometry>>(target,
                                                         "createGeometry");
  SetInstancerValueMethod<CreateResource<Rml::Texture>>(target,
                                                        "createTexture");
  SetInstancerValueMethod<MakeGeometry>(target, "makeGeometry");
  SetInstancerValueMethod<LoadTexture>(target, "loadRenderTexture");
  SetInstancerValueMethod<GetTextureDimensions>(target, "textureGetDimensions");
  SetInstancerValueMethod<TextureEquals>(target, "textureEquals");
  SetInstancerValueMethod<IsValid<Rml::Geometry>>(target, "geometryIsValid");
  SetInstancerValueMethod<IsValid<Rml::Texture>>(target, "textureIsValid");
  SetInstancerValueMethod<GetMesh>(target, "geometryGetMesh");
  SetInstancerValueMethod<ReleaseGeometry>(target, "releaseGeometry");
  SetEffectMethod<RenderGeometry>(target, "renderGeometry");
}

}  // namespace sfmlrmlui
