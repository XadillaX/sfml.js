// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/rendering/textures/rmlui-texture-source.h"

#include <algorithm>
#include <memory>
#include <utility>
#include <vector>

#include "native/rendering/geometry/rmlui-geometry.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

struct SourceState {
  Rml::String source;
  Rml::String document_path;
  std::vector<std::shared_ptr<RenderManagerState>> managers;
  // Destroy cached texture views before releasing their manager leases.
  std::unique_ptr<Rml::TextureSource> value;
  uint64_t generation{0};
};

using SourceHandle = sfmljs::SharedHandle<SourceState>;

auto& Sources() {
  static std::vector<std::weak_ptr<SourceState>> sources;
  return sources;
}

SourceState* SourceOf(v8::Local<v8::Value> input) {
  auto* handle = SourceHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a texture source");
    return nullptr;
  }
  auto* state = handle->owner().get();
  if (state->generation != State().generation) {
    Nan::ThrowError("Texture source is no longer valid");
    return nullptr;
  }
  return state;
}

v8::Local<v8::Object> CreateSource(Rml::String source,
                                   Rml::String document_path) {
  auto state = std::make_shared<SourceState>();
  state->source = std::move(source);
  state->document_path = std::move(document_path);
  state->generation = State().generation;
  std::erase_if(Sources(), [](const auto& value) { return value.expired(); });
  Sources().push_back(state);
  return SourceHandle::Create(std::move(state));
}

NAN_METHOD(CreateTextureSource) {
  if (!info[0]->IsString() || !info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected texture source and document path");
  }
  Nan::Utf8String source(info[0]);
  Nan::Utf8String path(info[1]);
  info.GetReturnValue().Set(CreateSource(Rml::String(*source, source.length()),
                                         Rml::String(*path, path.length())));
}

NAN_METHOD(GetTexture) {
  auto* source = SourceOf(info[0]);
  auto manager = RenderManagerOf(info[1]);
  if (!source || !manager) {
    return;
  }
  if (!source->value) {
    source->value = std::make_unique<Rml::TextureSource>(source->source,
                                                         source->document_path);
  }
  if (std::find(source->managers.begin(), source->managers.end(), manager) ==
      source->managers.end()) {
    source->managers.push_back(manager);
  }
  info.GetReturnValue().Set(
      WrapTexture(source->value->GetTexture(*manager->value), manager->value));
}

template <bool definition>
NAN_METHOD(GetSource) {
  if (auto* source = SourceOf(info[0])) {
    const auto& text = definition ? source->document_path : source->source;
    info.GetReturnValue().Set(Nan::New(text).ToLocalChecked());
  }
}

}  // namespace

v8::Local<v8::Object> WrapTextureSource(const Rml::TextureSource& source) {
  return CreateSource(source.GetSource(), source.GetDefinitionSource());
}

void ReleaseTextureSourceBindings(bool unused_only) {
  for (const auto& weak : Sources()) {
    auto state = weak.lock();
    if (!state) {
      continue;
    }
    const bool invalid_manager =
        std::any_of(state->managers.begin(),
                    state->managers.end(),
                    [](const auto& manager) { return !manager->value; });
    if (!unused_only || invalid_manager) {
      // TextureSource offers no cache eviction. Recreate it lazily, before a
      // manager address can be reused; returned Texture handles own leases.
      state->value.reset();
      state->managers.clear();
    }
    if (!unused_only) {
      state->generation = 0;
    }
  }
  std::erase_if(Sources(), [](const auto& value) { return value.expired(); });
  if (!unused_only) {
    Sources().clear();
  }
}

NAN_MODULE_INIT(InitializeRmlTextureSource) {
  SetInstancerValueMethod<CreateTextureSource>(target, "createTextureSource");
  SetInstancerValueMethod<GetTexture>(target, "textureSourceGetTexture");
  SetInstancerValueMethod<GetSource<false>>(target, "textureSourceGetSource");
  SetInstancerValueMethod<GetSource<true>>(target,
                                           "textureSourceGetDefinitionSource");
}

}  // namespace sfmlrmlui
