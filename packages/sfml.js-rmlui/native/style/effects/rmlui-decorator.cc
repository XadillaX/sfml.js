// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/effects/rmlui-decorator.h"

#include <algorithm>
#include <memory>
#include <utility>
#include <vector>

#include "native/rendering/geometry/rmlui-geometry.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/rendering/textures/rmlui-spritesheet.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-decorator-callbacks.h"
#include "native/style/properties/rmlui-property.h"
#include "native/style/properties/rmlui-style-sheet.h"

namespace sfmlrmlui {

struct DecoratorInterfaceState {
  const Rml::DecoratorInstancerInterface* value{nullptr};
  std::unique_ptr<Rml::DecoratorInstancerInterface> owned;
  std::shared_ptr<StyleSheetState> sheet;
  std::shared_ptr<RenderManagerState> manager;
  Rml::SharedPtr<const Rml::PropertySource> source;
  uint64_t generation{0};
};

namespace {

using InterfaceHandle = sfmljs::SharedHandle<DecoratorInterfaceState>;

struct DecoratorState {
  Rml::SharedPtr<const Rml::Decorator> value;
  std::shared_ptr<RenderManagerState> manager;
  uint64_t generation{0};
};

struct DecoratorDataState {
  ~DecoratorDataState() { Release(); }

  void Release() {
    // Clear first so nested release cannot free the same resource twice.
    if (const auto old = std::exchange(value, 0)) {
      owner->value->ReleaseElementData(old);
    }
  }

  Rml::DecoratorDataHandle value{0};
  std::shared_ptr<DecoratorState> owner;
  Rml::ObserverPtr<Rml::Element> element;
};

using DecoratorHandle = sfmljs::SharedHandle<DecoratorState>;
using DataHandle = sfmljs::SharedHandle<DecoratorDataState>;

template <typename T>
auto& Registry() {
  struct RegistryState {
    std::vector<std::weak_ptr<T>> values;
    size_t sweep_threshold{64};
  };
  static RegistryState registry;
  return registry;
}

template <typename T>
void Track(const std::shared_ptr<T>& state) {
  auto& registry = Registry<T>();
  if (registry.values.size() >= registry.sweep_threshold) {
    std::erase_if(registry.values,
                  [](const auto& weak) { return weak.expired(); });
    registry.sweep_threshold = std::max(size_t{64}, registry.values.size() * 2);
  }
  registry.values.emplace_back(state);
}

std::shared_ptr<DecoratorState> DecoratorOf(v8::Local<v8::Value> input) {
  auto* handle = DecoratorHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an owned decorator");
    return {};
  }
  auto state = handle->owner();
  if (!RuntimeReady()) {
    return {};
  }
  if (!state->value || state->generation != State().generation ||
      !state->manager || !state->manager->value) {
    Nan::ThrowError("Decorator is no longer valid");
    return {};
  }
  return state;
}

DecoratorDataState* DataOf(v8::Local<v8::Value> input) {
  auto* handle = DataHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected decorator element data");
    return nullptr;
  }
  return handle->owner().get();
}

bool CheckDataOwner(const DecoratorState& owner,
                    const DecoratorDataState& data) {
  if (data.owner->value != owner.value) {
    Nan::ThrowTypeError("Element data belongs to a different decorator");
    return false;
  }
  return true;
}

NAN_METHOD(GenerateElementData) {
  if (!info[2]->IsUint32() ||
      Nan::To<uint32_t>(info[2]).FromJust() >
          static_cast<unsigned>(Rml::BoxArea::Content)) {
    return Nan::ThrowRangeError("Expected a concrete BoxArea");
  }
  auto owner = DecoratorOf(info[0]);
  if (!owner) {
    return;
  }
  auto* element = ElementOf(info[1]);
  if (!element) {
    return;
  }
  if (element->GetRenderManager() != owner->manager->value) {
    return Nan::ThrowError("Element belongs to a different render manager");
  }
  auto data = std::make_shared<DecoratorDataState>();
  data->owner = owner;
  data->element = element->GetObserverPtr();
  data->value = owner->value->GenerateElementData(
      element,
      static_cast<Rml::BoxArea>(Nan::To<uint32_t>(info[2]).FromJust()));
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (!data->value) {
    info.GetReturnValue().SetNull();
    return;
  }
  Track(data);
  auto handle = DataHandle::Create(data);
  BindDecoratorData(handle, owner->value.get(), data->value);
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(CreateDecorator) {
  if (!info[1]->IsFunction() || !info[2]->IsFunction() ||
      !info[3]->IsFunction()) {
    return Nan::ThrowTypeError("Expected decorator virtual callbacks");
  }
  auto manager = RenderManagerOf(info[0]);
  if (!manager) {
    return;
  }
  auto functions = Nan::New<v8::Array>(3);
  for (uint32_t i = 0; i < 3; ++i) {
    functions->CreateDataProperty(Nan::GetCurrentContext(), i, info[i + 1])
        .FromJust();
  }
  info.GetReturnValue().Set(
      WrapDecorator(CreateDecoratorCallbacks(functions), manager->value));
}

template <int operation>
NAN_METHOD(TextureOperation) {
  if constexpr (operation == 2) {
    if (!info[1]->IsInt32()) {
      return Nan::ThrowTypeError("Expected an integer texture index");
    }
  }
  auto state = DecoratorOf(info[0]);
  if (!state) {
    return;
  }
  Rml::Texture texture;
  if constexpr (operation == 0) {
    if (!ReadTexture(info[1], state->manager->value, &texture)) {
      return;
    }
  }
  int result = 0;
  v8::Local<v8::Value> texture_handle = info[1];
  const int index = operation == 2 ? Nan::To<int>(info[1]).FromJust() : 0;
  if (!DecoratorTextureOperation(state->value.get(),
                                 operation,
                                 index,
                                 &texture,
                                 &result,
                                 &texture_handle)) {
    return;
  }
  if constexpr (operation == 2) {
    info.GetReturnValue().Set(texture_handle->IsObject()
                                  ? texture_handle
                                  : v8::Local<v8::Value>(WrapTexture(
                                        texture, state->manager->value)));
  } else {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(RenderElement) {
  auto owner = DecoratorOf(info[0]);
  if (!owner) {
    return;
  }
  auto* data = DataOf(info[2]);
  if (!data || !CheckDataOwner(*owner, *data)) {
    return;
  }
  if (!data->value) {
    return Nan::ThrowError("Decorator element data has been released");
  }
  auto* element = ElementOf(info[1]);
  if (!element) {
    return;
  }
  if (data->element.get() != element) {
    return Nan::ThrowTypeError("Decorator data belongs to a different element");
  }
  if (element->GetRenderManager() != owner->manager->value) {
    return Nan::ThrowError("Element belongs to a different render manager");
  }
  owner->value->RenderElement(element, data->value);
}

NAN_METHOD(ReleaseElementData) {
  auto owner = DecoratorOf(info[0]);
  if (!owner) {
    return;
  }
  auto* data = DataOf(info[1]);
  if (data && CheckDataOwner(*owner, *data)) {
    data->Release();
  }
}

NAN_METHOD(DataIsValid) {
  if (auto* data = DataOf(info[0])) {
    info.GetReturnValue().Set(data->value != 0);
  }
}

NAN_METHOD(GetSprite) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a sprite name");
  }
  Nan::Utf8String name(info[1]);
  if (const auto* active = DecoratorInterfaceOf(info[0])) {
    // Copy all metadata before a later insertion can invalidate the pointer.
    info.GetReturnValue().Set(
        WrapSprite(active->GetSprite(Rml::String(*name, name.length()))));
  }
}

NAN_METHOD(CreateInterface) {
  Rml::SharedPtr<const Rml::PropertySource> source;
  if (!ReadPropertySource(info[2], &source)) {
    return;
  }
  auto manager = RenderManagerOf(info[0]);
  if (!manager) {
    return;
  }
  auto sheet = ShareStyleSheet(info[1]);
  if (!sheet) {
    return;
  }
  auto state = std::make_shared<DecoratorInterfaceState>();
  state->manager = std::move(manager);
  state->sheet = std::move(sheet);
  state->source = std::move(source);
  state->owned = std::make_unique<Rml::DecoratorInstancerInterface>(
      *state->manager->value,
      *StyleSheetValue(*state->sheet),
      state->source.get());
  state->value = state->owned.get();
  state->generation = State().generation;
  auto handle = InterfaceHandle::Create(std::move(state));
  Nan::SetPrivate(
      handle, Nan::New("rml.decorator.sheet").ToLocalChecked(), info[1])
      .FromJust();
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(GetTexture) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a texture filename");
  }
  Nan::Utf8String filename(info[1]);
  if (const auto* active = DecoratorInterfaceOf(info[0])) {
    info.GetReturnValue().Set(WrapTexture(
        active->GetTexture(Rml::String(*filename, filename.length())),
        &active->GetRenderManager()));
  }
}

NAN_METHOD(GetRenderManager) {
  if (const auto* active = DecoratorInterfaceOf(info[0])) {
    info.GetReturnValue().Set(WrapRenderManager(&active->GetRenderManager()));
  }
}

}  // namespace

DecoratorInterfaceScope::DecoratorInterfaceScope(
    const Rml::DecoratorInstancerInterface& value)
    : state_(std::make_shared<DecoratorInterfaceState>()) {
  state_->value = &value;
  state_->generation = State().generation;
}

DecoratorInterfaceScope::~DecoratorInterfaceScope() {
  state_->value = nullptr;
}

v8::Local<v8::Object> DecoratorInterfaceScope::Wrap() const {
  return InterfaceHandle::Create(state_);
}

const Rml::DecoratorInstancerInterface* DecoratorInterfaceOf(
    v8::Local<v8::Value> input) {
  auto* handle = InterfaceHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a scoped decorator instancer interface");
    return nullptr;
  }
  const auto& state = handle->owner();
  if (!RuntimeReady()) {
    return nullptr;
  }
  if (!state->value || state->generation != State().generation) {
    Nan::ThrowError("Decorator instancer interface scope is no longer active");
    return nullptr;
  }
  if (state->owned) {
    if (!state->manager->value) {
      Nan::ThrowError(
          "Decorator instancer interface manager is no longer valid");
      return nullptr;
    }
    if (!StyleSheetValue(*state->sheet)) {
      return nullptr;
    }
  }
  return state->value;
}

v8::Local<v8::Object> WrapDecorator(Rml::SharedPtr<const Rml::Decorator> value,
                                    Rml::RenderManager* manager) {
  auto state = std::make_shared<DecoratorState>();
  state->value = std::move(value);
  state->manager = ShareRenderManager(manager);
  state->generation = State().generation;
  Track(state);
  auto handle = DecoratorHandle::Create(state);
  BindDecoratorCallbacks(handle, state->value.get());
  return handle;
}

bool CopyDecorator(v8::Local<v8::Value> input,
                   Rml::RenderManager* manager,
                   Rml::SharedPtr<Rml::Decorator>* result) {
  auto state = DecoratorOf(input);
  if (!state) {
    return false;
  }
  if (state->manager->value != manager) {
    Nan::ThrowError("Decorator belongs to a different render manager");
    return false;
  }
  // RmlUi stores const views of mutable instancer results in its cache.
  *result = std::const_pointer_cast<Rml::Decorator>(state->value);
  RetainDecoratorCallbacks(state->value.get());
  return true;
}

void ReleaseDecoratorManagerData(Rml::RenderManager* manager) {
  for (const auto& weak : Registry<DecoratorDataState>().values) {
    if (auto data = weak.lock();
        data && data->owner->manager->value == manager) {
      data->Release();
    }
  }
  DrainDecoratorReleases();
}

void ReleaseDecoratorBindings(bool unused_only) {
  // Raw per-element handles contain Geometry objects which refer to the
  // original manager. Release those before either decorator or manager dies.
  for (const auto& weak : Registry<DecoratorDataState>().values) {
    if (auto data = weak.lock();
        data && (!unused_only || !data->owner->manager->value)) {
      data->Release();
    }
  }
  if (!unused_only) {
    ReleaseDecoratorCallbacks();
  }
  for (const auto& weak : Registry<DecoratorState>().values) {
    if (auto state = weak.lock();
        state && (!unused_only || !state->manager->value)) {
      state->value.reset();
      state->generation = 0;
    }
  }
  if (!unused_only) {
    Registry<DecoratorDataState>() = {};
    Registry<DecoratorState>() = {};
  }
}

NAN_MODULE_INIT(InitializeRmlDecorator) {
  SetInstancerValueMethod<CreateDecorator>(target, "createDecorator");
  SetInstancerValueMethod<TextureOperation<0>>(target, "decoratorAddTexture");
  SetInstancerValueMethod<TextureOperation<1>>(target,
                                               "decoratorGetNumTextures");
  SetInstancerValueMethod<TextureOperation<2>>(target, "decoratorGetTexture");
  SetInstancerValueMethod<CreateInterface>(target, "createDecoratorInterface");
  SetEffectMethod<GenerateElementData>(target, "decoratorGenerateElementData");
  SetEffectMethod<RenderElement>(target, "decoratorRenderElement");
  SetEffectMethod<ReleaseElementData>(target, "decoratorReleaseElementData");
  SetEffectMethod<DataIsValid>(target, "decoratorDataIsValid");
  SetInstancerValueMethod<GetSprite>(target, "decoratorInterfaceGetSprite");
  SetInstancerValueMethod<GetTexture>(target, "decoratorInterfaceGetTexture");
  SetInstancerValueMethod<GetRenderManager>(
      target, "decoratorInterfaceGetRenderManager");
}

}  // namespace sfmlrmlui
