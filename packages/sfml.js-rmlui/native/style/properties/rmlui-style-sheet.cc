// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/properties/rmlui-style-sheet.h"

#include <RmlUi/Core/StreamMemory.h>
#include <RmlUi/Core/StyleSheetContainer.h>
#include <RmlUi/Core/URL.h>

#include <algorithm>
#include <memory>
#include <utility>
#include <vector>

#include "native/io/rmlui-stream.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/rendering/textures/rmlui-spritesheet.h"
#include "native/runtime/rmlui-callback-owners.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-decorator.h"
#include "native/style/effects/rmlui-effect-instancers.h"
#include "native/style/effects/rmlui-effect-values.h"
#include "native/style/properties/rmlui-property-dictionary.h"
#include "native/style/properties/rmlui-property.h"
#include "vendor/rmlui/Source/Core/ElementDefinition.h"
#include "vendor/rmlui/Source/Core/StyleSheetFactory.h"

namespace sfmlrmlui {

struct StyleSheetContainerState {
  Rml::SharedPtr<Rml::StyleSheetContainer> value;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
  bool read_only{false};
};

struct StyleSheetState {
  std::unique_ptr<Rml::StyleSheet> owned;
  v8::Global<v8::Object> handle;
  std::shared_ptr<StyleSheetContainerState> container;
  uint64_t revision{0};
  uint64_t generation{0};
};

namespace {

using ContainerHandle = sfmljs::SharedHandle<StyleSheetContainerState>;
using SheetHandle = sfmljs::SharedHandle<StyleSheetState>;

template <typename Handle, typename T>
v8::Local<v8::Object> WrapTracked(const std::shared_ptr<T>& state) {
  auto handle = Handle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  return handle;
}

void ReleaseCacheEdges(v8::Global<v8::Object>* handle) {
  if (!handle->IsEmpty()) {
    auto object = handle->Get(v8::Isolate::GetCurrent());
    Nan::DeletePrivate(object,
                       Nan::New("rml.sheet.decorators").ToLocalChecked())
        .FromJust();
    Nan::DeletePrivate(object, Nan::New("rml.sheet.container").ToLocalChecked())
        .FromJust();
    handle->Reset();
  }
}

struct DefinitionState {
  Rml::SharedPtr<const Rml::ElementDefinition> value;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

using DefinitionHandle = sfmljs::SharedHandle<DefinitionState>;

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
  // A newly exposed wrapper becomes a JS owner of an existing native cache.
  Rml::InvalidateCallbackResourcesForBinding();
}

std::shared_ptr<StyleSheetContainerState> ContainerOf(
    v8::Local<v8::Value> input) {
  auto* handle = ContainerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a stylesheet container");
    return {};
  }
  auto state = handle->owner();
  if (!RuntimeReady()) {
    return {};
  }
  if (!state->value || state->generation != State().generation) {
    Nan::ThrowError("Stylesheet container is no longer valid");
    return {};
  }
  return state;
}

v8::Local<v8::Object> WrapContainer(
    Rml::SharedPtr<Rml::StyleSheetContainer> value, bool read_only = false) {
  auto state = std::make_shared<StyleSheetContainerState>();
  state->value = std::move(value);
  state->generation = State().generation;
  state->read_only = read_only;
  Track(state);
  return WrapTracked<ContainerHandle>(state);
}

bool CanAppend(const StyleSheetContainerState& state) {
  if (state.read_only) {
    Nan::ThrowTypeError("Cannot mutate a borrowed stylesheet container");
    return false;
  }
  if (state.value->GetCompiledStyleSheet()) {
    Nan::ThrowError("Cannot load or merge an already compiled container");
    return false;
  }
  return true;
}

NAN_METHOD(CreateContainer) {
  info.GetReturnValue().Set(
      WrapContainer(std::make_shared<Rml::StyleSheetContainer>()));
}

NAN_METHOD(LoadContainer) {
  if (!info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected stylesheet source URL");
  }
  if (!info[3]->IsInt32() || Nan::To<int32_t>(info[3]).FromJust() < 1) {
    return Nan::ThrowRangeError("Expected a positive begin line number");
  }
  auto state = ContainerOf(info[0]);
  if (!state || !CanAppend(*state)) {
    return;
  }
  if (!info[1]->IsString()) {
    auto stream = ShareStream(info[1]);
    if (stream) {
      info.GetReturnValue().Set(state->value->LoadStyleSheetContainer(
          stream->value.get(), Nan::To<int32_t>(info[3]).FromJust()));
    }
    return;
  }
  Nan::Utf8String text(info[1]);
  Nan::Utf8String url(info[2]);
  Rml::StreamMemory stream(reinterpret_cast<const Rml::byte*>(*text),
                           text.length());
  stream.SetSourceURL(Rml::URL(Rml::String(*url, url.length())));
  info.GetReturnValue().Set(state->value->LoadStyleSheetContainer(
      &stream, Nan::To<int32_t>(info[3]).FromJust()));
}

NAN_METHOD(UpdateContainer) {
  auto state = ContainerOf(info[0]);
  if (!state) {
    return;
  }
  if (state->read_only) {
    return Nan::ThrowTypeError("Cannot mutate a borrowed stylesheet container");
  }
  auto* context = ContextOf(info[1]);
  if (!context) {
    return;
  }
  const bool changed = state->value->UpdateCompiledStyleSheet(context);
  info.GetReturnValue().Set(changed);
}

v8::Local<v8::Value> WrapCompiledSheet(
    std::shared_ptr<StyleSheetContainerState> container) {
  if (!container->value->GetCompiledStyleSheet()) {
    return Nan::Null();
  }
  auto state = std::make_shared<StyleSheetState>();
  state->revision = container->value->GetCompiledStyleSheetRevision();
  state->container = std::move(container);
  state->generation = State().generation;
  Track(state);
  auto handle = WrapTracked<SheetHandle>(state);
  // Retain the wrapper as well as its C++ state so V8 sees cache ownership.
  if (!state->container->handle.IsEmpty()) {
    Nan::SetPrivate(handle,
                    Nan::New("rml.sheet.container").ToLocalChecked(),
                    state->container->handle.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  return handle;
}

NAN_METHOD(GetCompiledSheet) {
  if (auto container = ContainerOf(info[0])) {
    info.GetReturnValue().Set(WrapCompiledSheet(std::move(container)));
  }
}

NAN_METHOD(GetDocumentContainer) {
  if (auto* document = DocumentOf(info[0])) {
    auto value = document->GetStyleSheetContainerShared();
    info.GetReturnValue().Set(
        value ? v8::Local<v8::Value>(WrapContainer(std::move(value), true))
              : v8::Local<v8::Value>(Nan::Null()));
  }
}

NAN_METHOD(GetElementStyleSheet) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto* document = element->GetOwnerDocument();
  auto value = document ? document->GetStyleSheetContainerShared() : nullptr;
  if (!value) {
    info.GetReturnValue().SetNull();
    return;
  }
  auto container = std::make_shared<StyleSheetContainerState>();
  container->value = std::move(value);
  container->generation = State().generation;
  container->read_only = true;
  Track(container);
  // Internal container states need a visible owner for their inactive caches.
  WrapTracked<ContainerHandle>(container);
  info.GetReturnValue().Set(WrapCompiledSheet(std::move(container)));
}

NAN_METHOD(SetDocumentContainer) {
  std::shared_ptr<StyleSheetContainerState> container;
  if (!info[1]->IsNull()) {
    container = ContainerOf(info[1]);
    if (!container) {
      return;
    }
  }
  if (auto* document = DocumentOf(info[0])) {
    document->SetStyleSheetContainer(container ? container->value : nullptr);
  }
}

NAN_METHOD(ReloadDocumentStyleSheet) {
  if (auto* document = DocumentOf(info[0])) {
    document->ReloadStyleSheet();
  }
}

template <bool merge>
NAN_METHOD(CombineContainers) {
  auto first = ContainerOf(info[0]);
  if (!first) {
    return;
  }
  auto second = ContainerOf(info[1]);
  if (!second) {
    return;
  }
  if constexpr (merge) {
    if (!CanAppend(*first)) {
      return;
    }
    if (first->value == second->value) {
      return Nan::ThrowTypeError("Cannot merge a container into itself");
    }
    first->value->MergeStyleSheetContainer(*second->value);
  } else {
    info.GetReturnValue().Set(WrapContainer(
        first->value->CombineStyleSheetContainer(*second->value)));
  }
}

Rml::StyleSheet* MutableSheet(const StyleSheetState& state) {
  if (!state.owned) {
    Nan::ThrowTypeError("Mutation requires an owned, not borrowed, stylesheet");
    return nullptr;
  }
  return state.owned.get();
}

template <bool merge>
NAN_METHOD(CombineSheets) {
  auto first = ShareStyleSheet(info[0]);
  if (!first) {
    return;
  }
  auto second = ShareStyleSheet(info[1]);
  if (!second) {
    return;
  }
  if constexpr (merge) {
    auto* target = MutableSheet(*first);
    if (!target) {
      return;
    }
    if (target == StyleSheetValue(*second)) {
      return Nan::ThrowTypeError("Cannot merge a stylesheet into itself");
    }
    target->MergeStyleSheet(*StyleSheetValue(*second));
  } else {
    auto result = std::make_shared<StyleSheetState>();
    result->owned =
        StyleSheetValue(*first)->CombineStyleSheet(*StyleSheetValue(*second));
    result->generation = State().generation;
    Track(result);
    info.GetReturnValue().Set(WrapTracked<SheetHandle>(result));
  }
}

NAN_METHOD(BuildNodeIndex) {
  auto state = ShareStyleSheet(info[0]);
  if (!state) {
    return;
  }
  if (auto* sheet = MutableSheet(*state)) {
    sheet->BuildNodeIndex();
  }
}

NAN_METHOD(GetElementDefinition) {
  auto state = ShareStyleSheet(info[0]);
  if (!state) {
    return;
  }
  auto* element = ElementOf(info[1]);
  if (!element) {
    return;
  }
  auto definition = StyleSheetValue(*state)->GetElementDefinition(element);
  if (!definition) {
    info.GetReturnValue().SetNull();
    return;
  }
  auto result = std::make_shared<DefinitionState>();
  result->value = std::move(definition);
  result->generation = State().generation;
  Track(result);
  info.GetReturnValue().Set(WrapTracked<DefinitionHandle>(result));
}

NAN_METHOD(InstanceDecorators) {
  Rml::Variant input;
  Rml::SharedPtr<const Rml::PropertySource> source;
  if (!info[2]->IsObject()) {
    return Nan::ThrowTypeError("Expected decorator declarations");
  }
  if (!EffectValueFromJs(
          info[2].As<v8::Object>(), Rml::Variant::DECORATORSPTR, &input) ||
      !ReadPropertySource(info[3], &source)) {
    return;
  }
  auto state = ShareStyleSheet(info[0]);
  if (!state) {
    return;
  }
  auto manager = RenderManagerOf(info[1]);
  if (!manager) {
    return;
  }
  // Instancers can inspect their input, but cannot mutate the live list.
  const auto declarations = *input.Get<Rml::DecoratorsPtr>();
  const auto& instances = StyleSheetValue(*state)->InstanceDecorators(
      *manager->value, declarations, source.get());
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  auto result = Nan::New<v8::Array>(instances.size());
  for (uint32_t i = 0; i < instances.size(); ++i) {
    result
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             i,
                             WrapDecorator(instances[i], manager->value))
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

const Rml::ElementDefinition* DefinitionOf(v8::Local<v8::Value> input) {
  auto* handle = DefinitionHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an element definition");
    return nullptr;
  }
  const auto& state = *handle->owner();
  if (!state.value || state.generation != State().generation) {
    Nan::ThrowError("Element definition is no longer valid");
    return nullptr;
  }
  return state.value.get();
}

template <bool custom>
NAN_METHOD(GetDefinitionProperty) {
  Rml::PropertyId id{};
  if constexpr (custom) {
    if (!info[1]->IsString()) {
      return Nan::ThrowTypeError("Expected a custom property name");
    }
  } else if (!ReadPropertyId(info[1], &id)) {
    return;
  }
  const auto* definition = DefinitionOf(info[0]);
  if (!definition) {
    return;
  }
  const Rml::Property* property;
  if constexpr (custom) {
    Nan::Utf8String name(info[1]);
    property = definition->GetCustomProperty(Rml::String(*name, name.length()));
  } else {
    property = definition->GetProperty(id);
  }
  info.GetReturnValue().Set(property
                                ? v8::Local<v8::Value>(WrapProperty(*property))
                                : v8::Local<v8::Value>(Nan::Null()));
}

NAN_METHOD(GetDefinitionProperties) {
  if (const auto* definition = DefinitionOf(info[0])) {
    info.GetReturnValue().Set(
        WrapPropertyDictionary(definition->GetProperties()));
  }
}

NAN_METHOD(GetDefinitionPropertyIds) {
  if (const auto* definition = DefinitionOf(info[0])) {
    auto result = Nan::New<v8::Array>();
    for (auto id : definition->GetPropertyIds()) {
      result
          ->CreateDataProperty(Nan::GetCurrentContext(),
                               result->Length(),
                               Nan::New(static_cast<int>(id)))
          .FromJust();
    }
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(GetSprite) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a sprite name");
  }
  if (auto state = ShareStyleSheet(info[0])) {
    Nan::Utf8String name(info[1]);
    info.GetReturnValue().Set(WrapSprite(
        StyleSheetValue(*state)->GetSprite(Rml::String(*name, name.length()))));
  }
}

void SetField(v8::Local<v8::Object> object,
              const char* name,
              v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

NAN_METHOD(GetNamedDecorator) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a decorator name");
  }
  auto state = ShareStyleSheet(info[0]);
  if (!state) {
    return;
  }
  Nan::Utf8String name(info[1]);
  const auto* value = StyleSheetValue(*state)->GetNamedDecorator(
      Rml::String(*name, name.length()));
  if (!value) {
    info.GetReturnValue().SetNull();
    return;
  }
  auto result = Nan::New<v8::Object>();
  SetField(result, "type", Nan::New(value->type).ToLocalChecked());
  SetField(result, "instancer", WrapEffectInstancer(value->instancer));
  SetField(result, "properties", WrapPropertyDictionary(value->properties));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetKeyframes) {
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected a keyframes name");
  }
  auto state = ShareStyleSheet(info[0]);
  if (!state) {
    return;
  }
  Nan::Utf8String name(info[1]);
  const auto* value =
      StyleSheetValue(*state)->GetKeyframes(Rml::String(*name, name.length()));
  if (!value) {
    info.GetReturnValue().SetNull();
    return;
  }
  auto ids = Nan::New<v8::Array>(value->property_ids.size());
  auto blocks = Nan::New<v8::Array>(value->blocks.size());
  for (uint32_t i = 0; i < value->property_ids.size(); ++i) {
    ids->CreateDataProperty(Nan::GetCurrentContext(),
                            i,
                            Nan::New(static_cast<int>(value->property_ids[i])))
        .FromJust();
  }
  for (uint32_t i = 0; i < value->blocks.size(); ++i) {
    const auto& block = value->blocks[i];
    auto wrapped = Nan::New<v8::Object>();
    SetField(wrapped, "normalizedTime", Nan::New(block.normalized_time));
    SetField(wrapped, "properties", WrapPropertyDictionary(block.properties));
    blocks->CreateDataProperty(Nan::GetCurrentContext(), i, wrapped).FromJust();
  }
  auto result = Nan::New<v8::Object>();
  SetField(result, "propertyIds", ids);
  SetField(result, "blocks", blocks);
  info.GetReturnValue().Set(result);
}

}  // namespace

void AppendStyleSheetCallbackOwners(CallbackOwnerSnapshots* snapshots) {
  auto* isolate = v8::Isolate::GetCurrent();
  for (const auto& weak : Registry<StyleSheetState>().values) {
    if (const auto state = weak.lock(); state && !state->handle.IsEmpty()) {
      auto& snapshot = snapshots->emplace_back();
      snapshot.handle = state->handle.Get(isolate);
      if (state->owned) {
        state->owned->AppendCallbackProperties(snapshot.dictionaries);
      } else if (state->container && state->container->value) {
        state->container->value->AppendCallbackProperties(
            snapshot.dictionaries);
      }
    }
  }
  for (const auto& weak : Registry<StyleSheetContainerState>().values) {
    if (const auto state = weak.lock();
        state && state->value && !state->handle.IsEmpty()) {
      auto& snapshot = snapshots->emplace_back();
      snapshot.handle = state->handle.Get(isolate);
      state->value->AppendCallbackProperties(snapshot.dictionaries);
    }
  }
  for (const auto& weak : Registry<DefinitionState>().values) {
    if (const auto state = weak.lock();
        state && state->value && !state->handle.IsEmpty()) {
      auto& snapshot = snapshots->emplace_back();
      snapshot.handle = state->handle.Get(isolate);
      snapshot.dictionaries.push_back(state->value->GetProperties());
    }
  }
  Rml::StyleSheetFactory::AppendCallbackProperties(
      snapshots->emplace_back().dictionaries);
}

void VisitStyleSheetDecoratorOwners(
    const std::function<void(v8::Local<v8::Object>,
                             const Rml::DecoratorPtrList&)>& visitor) {
  Rml::DecoratorPtrList instances;
  for (const auto& weak : Registry<StyleSheetState>().values) {
    if (auto state = weak.lock(); state && !state->handle.IsEmpty()) {
      instances.clear();
      if (state->owned) {
        state->owned->AppendCachedDecorators(instances);
      } else if (state->container && state->container->value) {
        // Even an expired compiled view still owns its native container.
        state->container->value->AppendCachedDecorators(instances);
      }
      visitor(state->handle.Get(v8::Isolate::GetCurrent()), instances);
    }
  }
  for (const auto& weak : Registry<StyleSheetContainerState>().values) {
    if (auto state = weak.lock(); state && !state->handle.IsEmpty()) {
      instances.clear();
      if (state->value) {
        state->value->AppendCachedDecorators(instances);
      }
      visitor(state->handle.Get(v8::Isolate::GetCurrent()), instances);
    }
  }
  // A document removed from the native tree is owned by its JS token.
  // Keep its caches visible to V8, including decorators with no element data.
  for (const auto& [pointer, weak] : State().elements) {
    const auto token = weak.lock();
    if (!token || !token->element || token->handle.IsEmpty() ||
        pointer->GetOwnerDocument() != pointer) {
      continue;
    }
    instances.clear();
    if (const auto* container =
            pointer->GetOwnerDocument()->GetStyleSheetContainer();
        token->owned && container) {
      container->AppendCachedDecorators(instances);
    }
    visitor(token->handle.Get(v8::Isolate::GetCurrent()), instances);
  }
  instances.clear();
  Rml::StyleSheetFactory::AppendCachedDecorators(instances);
  for (const auto& [context, token] : State().contexts) {
    for (int i = 0; i < context->GetNumDocuments(); ++i) {
      if (const auto* container =
              context->GetDocument(i)->GetStyleSheetContainer()) {
        container->AppendCachedDecorators(instances);
      }
    }
  }
  visitor({}, instances);
}

const Rml::StyleSheet* StyleSheetValue(const StyleSheetState& state) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  if (state.generation != State().generation ||
      (!state.owned &&
       (!state.container || !state.container->value ||
        state.revision !=
            state.container->value->GetCompiledStyleSheetRevision()))) {
    Nan::ThrowError("Stylesheet is no longer valid");
    return nullptr;
  }
  return state.owned ? state.owned.get()
                     : state.container->value->GetCompiledStyleSheet();
}

v8::Local<v8::Object> WrapStyleSheetContainer(
    Rml::SharedPtr<Rml::StyleSheetContainer> value) {
  return WrapContainer(std::move(value));
}

std::shared_ptr<StyleSheetState> ShareStyleSheet(v8::Local<v8::Value> input) {
  auto* handle = SheetHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a stylesheet");
    return {};
  }
  auto state = handle->owner();
  return StyleSheetValue(*state) ? state : nullptr;
}

void ReleaseStyleSheetBindings() {
  for (const auto& weak : Registry<DefinitionState>().values) {
    if (auto state = weak.lock()) {
      state->value.reset();
      state->handle.Reset();
      state->generation = 0;
    }
  }
  for (const auto& weak : Registry<StyleSheetState>().values) {
    if (auto state = weak.lock()) {
      ReleaseCacheEdges(&state->handle);
      state->owned.reset();
      state->container.reset();
      state->generation = 0;
    }
  }
  for (const auto& weak : Registry<StyleSheetContainerState>().values) {
    if (auto state = weak.lock()) {
      ReleaseCacheEdges(&state->handle);
      state->value.reset();
      state->generation = 0;
    }
  }
  Registry<StyleSheetState>() = {};
  Registry<StyleSheetContainerState>() = {};
  Registry<DefinitionState>() = {};
}

NAN_MODULE_INIT(InitializeRmlStyleSheet) {
  SetRuntimeMethod<GetDocumentContainer, true>(
      target, "documentGetStyleSheetContainer");
  SetRuntimeMethod<GetElementStyleSheet, true>(target, "elementGetStyleSheet");
  // The original demo parses a new independent sheet and swaps its sandbox
  // sheet during a change event. Parsing/effect/provider callbacks remain
  // excluded, and CanAppend still rejects borrowed or compiled containers.
  SetRuntimeMethod<SetDocumentContainer, true>(
      target, "documentSetStyleSheetContainer");
  SetRuntimeMethod<ReloadDocumentStyleSheet>(target,
                                             "documentReloadStyleSheet");
  SetRuntimeMethod<CreateContainer, true>(target, "createStyleSheetContainer");
  SetRuntimeMethod<LoadContainer, true>(target, "loadStyleSheetContainer");
  SetRuntimeMethod<UpdateContainer>(target, "updateCompiledStyleSheet");
  SetInstancerValueMethod<GetCompiledSheet>(target, "getCompiledStyleSheet");
  SetRuntimeMethod<CombineContainers<false>, true>(
      target, "combineStyleSheetContainer");
  SetRuntimeMethod<CombineContainers<true>>(target, "mergeStyleSheetContainer");
  SetRuntimeMethod<CombineSheets<false>>(target, "combineStyleSheet");
  SetRuntimeMethod<CombineSheets<true>>(target, "mergeStyleSheet");
  SetRuntimeMethod<BuildNodeIndex>(target, "styleSheetBuildNodeIndex");
  SetRuntimeMethod<GetElementDefinition, true>(
      target, "styleSheetGetElementDefinition");
  SetRuntimeMethod<InstanceDecorators>(target, "styleSheetInstanceDecorators");
  SetInstancerValueMethod<GetDefinitionProperty<false>>(
      target, "elementDefinitionGetProperty");
  SetInstancerValueMethod<GetDefinitionProperty<true>>(
      target, "elementDefinitionGetCustomProperty");
  SetInstancerValueMethod<GetDefinitionProperties>(
      target, "elementDefinitionGetProperties");
  SetInstancerValueMethod<GetDefinitionPropertyIds>(
      target, "elementDefinitionGetPropertyIds");
  SetInstancerValueMethod<GetSprite>(target, "styleSheetGetSprite");
  SetInstancerValueMethod<GetNamedDecorator>(target,
                                             "styleSheetGetNamedDecorator");
  SetInstancerValueMethod<GetKeyframes>(target, "styleSheetGetKeyframes");
}

}  // namespace sfmlrmlui
