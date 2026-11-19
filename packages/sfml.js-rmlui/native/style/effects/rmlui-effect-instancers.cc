// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/effects/rmlui-effect-instancers.h"

#include <RmlUi/Core/Factory.h>

#include <algorithm>
#include <memory>
#include <type_traits>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/fonts/rmlui-font-effect-callbacks.h"
#include "native/fonts/rmlui-font-effect.h"
#include "native/runtime/rmlui-callback-owners.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/effects/rmlui-decorator.h"
#include "native/style/effects/rmlui-filter.h"
#include "native/style/properties/rmlui-property-dictionary.h"
#include "native/style/properties/rmlui-property-specification.h"
#include "native/style/properties/rmlui-property.h"

namespace sfmlrmlui {
namespace {

template <typename T>
struct InstancerState {
  T* value{nullptr};
  std::shared_ptr<T> owned;
  v8::Global<v8::Object> handle;
  v8::Global<v8::Function> callback;
  uint64_t generation{0};
  bool registered{false};
  bool active{false};
};

template <typename T>
using InstancerHandle = sfmljs::SharedHandle<InstancerState<T>>;

template <typename T>
auto& Instancers() {
  static std::unordered_map<T*, std::weak_ptr<InstancerState<T>>> registry;
  return registry;
}

template <typename T>
auto& RegisteredInstancers() {
  static std::vector<std::shared_ptr<InstancerState<T>>> registry;
  return registry;
}

template <typename T>
std::shared_ptr<InstancerState<T>> InstancerOf(v8::Local<v8::Value> input) {
  auto* handle = InstancerHandle<T>::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected the matching typed effect instancer");
    return {};
  }
  auto state = handle->owner();
  if (!RuntimeReady()) {
    return {};
  }
  if (!state->value || state->generation != State().generation) {
    Nan::ThrowError("Effect instancer is no longer valid");
    return {};
  }
  return state;
}

template <typename T>
v8::Local<v8::Object> WrapState(std::shared_ptr<InstancerState<T>> state) {
  if (!state->handle.IsEmpty()) {
    return state->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = InstancerHandle<T>::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  if (!state->callback.IsEmpty() && state->callback.IsWeak()) {
    Nan::SetPrivate(handle,
                    Nan::New("rml.instancer.callback").ToLocalChecked(),
                    state->callback.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  return handle;
}

bool ReadString(v8::Local<v8::Value> input, Rml::String* result) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected an instancer string");
    return false;
  }
  Nan::Utf8String text(input);
  result->assign(*text, text.length());
  return true;
}

bool ReadName(v8::Local<v8::Value> input, Rml::String* result) {
  if (!ReadString(input, result)) {
    return false;
  }
  if (result->empty() || *result == "invalid") {
    Nan::ThrowRangeError("Instancer property name is empty or reserved");
    return false;
  }
  return true;
}

template <auto get>
NAN_METHOD(GetInstancer) {
  Rml::String name;
  if (ReadString(info[0], &name)) {
    info.GetReturnValue().Set(WrapEffectInstancer(get(name)));
  }
}

template <typename T, auto register_instancer>
NAN_METHOD(RegisterInstancer) {
  Rml::String name;
  if (!ReadName(info[0], &name)) {
    return;
  }
  auto state = InstancerOf<T>(info[1]);
  if (!state) {
    return;
  }
  register_instancer(name, state->value);
  // Upstream registrations are non-owning, and replacement does not release
  // earlier references held by already parsed declarations.
  if (!state->registered) {
    state->registered = true;
    if (!state->callback.IsEmpty() && state->callback.IsWeak()) {
      state->callback.ClearWeak();
      Nan::DeletePrivate(info[1].As<v8::Object>(),
                         Nan::New("rml.instancer.callback").ToLocalChecked())
          .FromJust();
    }
    RegisteredInstancers<T>().push_back(std::move(state));
  }
}

template <typename T>
NAN_METHOD(GetSpecification) {
  if (auto state = InstancerOf<T>(info[0])) {
    info.GetReturnValue().Set(WrapPropertySpecification(
        &state->value->GetPropertySpecification(), {}, state->owned));
  }
}

class InstancerCallbackScope final {
 public:
  explicit InstancerCallbackScope(bool* active) : active_(active) {
    *active_ = true;
    ++State().callback_depth;
    ++State().instancer_callback_depth;
  }
  ~InstancerCallbackScope() {
    --State().instancer_callback_depth;
    --State().callback_depth;
    *active_ = false;
  }

 private:
  bool* active_;
};

class JavaScriptFontEffectInstancer final : public Rml::FontEffectInstancer {
 public:
  using Rml::FontEffectInstancer::RegisterProperty;
  using Rml::FontEffectInstancer::RegisterShorthand;

  Rml::SharedPtr<Rml::FontEffect> InstanceFontEffect(
      const Rml::String& name,
      const Rml::PropertyDictionary& properties) override {
    auto owner = state.lock();
    if (!owner || !CanInvokeCallback() || owner->callback.IsEmpty()) {
      return {};
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    Rml::SharedPtr<Rml::FontEffect> result;
    if (owner->active) {
      Nan::ThrowError("Recursive font effect instancer callback");
    } else {
      InstancerCallbackScope callback_scope(&owner->active);
      v8::Local<v8::Value> arguments[] = {Nan::New(name).ToLocalChecked(),
                                          WrapPropertyDictionary(properties)};
      v8::Local<v8::Value> returned;
      RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
      if (owner->callback.Get(v8::Isolate::GetCurrent())
              ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 2, arguments)
              .ToLocal(&returned) &&
          !returned->IsNull()) {
        result = CloneFontEffect(returned);
        RetainFontEffectCallbacks(result.get());
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    return result;
  }

  std::weak_ptr<InstancerState<Rml::FontEffectInstancer>> state;
};

class JavaScriptFilterInstancer final : public Rml::FilterInstancer {
 public:
  using Rml::EffectSpecification::RegisterProperty;
  using Rml::EffectSpecification::RegisterShorthand;

  Rml::SharedPtr<Rml::Filter> InstanceFilter(
      const Rml::String& name,
      const Rml::PropertyDictionary& properties) override {
    auto owner = state.lock();
    if (!owner || !CanInvokeCallback() || owner->callback.IsEmpty()) {
      return {};
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    Rml::SharedPtr<Rml::Filter> result;
    if (owner->active) {
      Nan::ThrowError("Recursive filter instancer callback");
    } else {
      InstancerCallbackScope callback_scope(&owner->active);
      v8::Local<v8::Value> arguments[] = {Nan::New(name).ToLocalChecked(),
                                          WrapPropertyDictionary(properties)};
      v8::Local<v8::Value> returned;
      RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
      if (owner->callback.Get(v8::Isolate::GetCurrent())
              ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 2, arguments)
              .ToLocal(&returned) &&
          !returned->IsNull()) {
        CopyFilter(returned, &result);
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    return result;
  }

  std::weak_ptr<InstancerState<Rml::FilterInstancer>> state;
};

class JavaScriptDecoratorInstancer final : public Rml::DecoratorInstancer {
 public:
  using Rml::EffectSpecification::RegisterProperty;
  using Rml::EffectSpecification::RegisterShorthand;

  Rml::SharedPtr<Rml::Decorator> InstanceDecorator(
      const Rml::String& name,
      const Rml::PropertyDictionary& properties,
      const Rml::DecoratorInstancerInterface& active) override {
    auto owner = state.lock();
    if (!owner || !CanInvokeCallback() || owner->callback.IsEmpty()) {
      return {};
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    Rml::SharedPtr<Rml::Decorator> result;
    if (owner->active) {
      Nan::ThrowError("Recursive decorator instancer callback");
    } else {
      InstancerCallbackScope callback_scope(&owner->active);
      DecoratorInterfaceScope interface_scope(active);
      v8::Local<v8::Value> arguments[] = {Nan::New(name).ToLocalChecked(),
                                          WrapPropertyDictionary(properties),
                                          interface_scope.Wrap()};
      v8::Local<v8::Value> returned;
      RecordDiagnosticCallback(DiagnosticCallback::kInstancer);
      if (owner->callback.Get(v8::Isolate::GetCurrent())
              ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 3, arguments)
              .ToLocal(&returned) &&
          !returned->IsNull()) {
        CopyDecorator(returned, &active.GetRenderManager(), &result);
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
    return result;
  }

  std::weak_ptr<InstancerState<Rml::DecoratorInstancer>> state;
};

template <typename T, typename Implementation>
NAN_METHOD(CreateInstancer) {
  if (!info[0]->IsFunction()) {
    return Nan::ThrowTypeError("Expected an effect instancer callback");
  }
  auto owner = std::make_shared<InstancerState<T>>();
  auto instancer = std::make_shared<Implementation>();
  instancer->state = owner;
  owner->owned = instancer;
  owner->value = instancer.get();
  owner->generation = State().generation;
  owner->callback.Reset(v8::Isolate::GetCurrent(), info[0].As<v8::Function>());
  owner->callback.SetWeak();
  auto& registry = Instancers<T>();
  std::erase_if(registry,
                [](const auto& entry) { return entry.second.expired(); });
  registry[owner->value] = owner;
  info.GetReturnValue().Set(WrapState(std::move(owner)));
}

template <typename T>
std::shared_ptr<InstancerState<T>> MutableInstancer(
    v8::Local<v8::Value> handle) {
  auto state = InstancerOf<T>(handle);
  if (state && !state->owned) {
    Nan::ThrowTypeError("Built-in effect instancer is read-only");
    return {};
  }
  return state;
}

template <typename T, typename Implementation>
NAN_METHOD(RegisterProperty) {
  Rml::String name;
  Rml::String value;
  if (!ReadName(info[1], &name) || !ReadString(info[2], &value)) {
    return;
  }
  if constexpr (std::is_same_v<T, Rml::FontEffectInstancer>) {
    if (!info[3]->IsBoolean()) {
      return Nan::ThrowTypeError("Expected affects-generation boolean");
    }
  }
  auto state = MutableInstancer<T>(info[0]);
  if (!state) {
    return;
  }
  const auto& specification = state->value->GetPropertySpecification();
  if (const auto* existing = specification.GetProperty(name)) {
    info.GetReturnValue().Set(WrapPropertyDefinition(existing));
    return;
  }
  if (specification.GetProperty(static_cast<Rml::PropertyId>(
          static_cast<unsigned>(Rml::PropertyId::MaxNumIds) - 1))) {
    return Nan::ThrowRangeError("Maximum property capacity reached");
  }
  auto* instancer = static_cast<Implementation*>(state->owned.get());
  auto& definition = [&]() -> Rml::PropertyDefinition& {
    if constexpr (std::is_same_v<T, Rml::FontEffectInstancer>) {
      return instancer->RegisterProperty(name, value, info[3]->IsTrue());
    } else {
      return instancer->RegisterProperty(name, value);
    }
  }();
  auto handle = WrapMutablePropertyDefinition(&definition);
  State().property_definitions.at(&definition)->lifetime = state->owned;
  State().property_definitions.at(&definition)->callback_specification =
      &specification;
  info.GetReturnValue().Set(handle);
}

template <typename T, typename Implementation>
NAN_METHOD(RegisterShorthand) {
  Rml::String name;
  Rml::String properties;
  if (!ReadName(info[1], &name) || !ReadString(info[2], &properties)) {
    return;
  }
  if (!info[3]->IsUint32() ||
      Nan::To<uint32_t>(info[3]).FromJust() >
          static_cast<unsigned>(Rml::ShorthandType::Flex)) {
    return Nan::ThrowRangeError("Expected a ShorthandType");
  }
  auto state = MutableInstancer<T>(info[0]);
  if (!state) {
    return;
  }
  const auto type =
      static_cast<Rml::ShorthandType>(Nan::To<uint32_t>(info[3]).FromJust());
  const auto& specification = state->value->GetPropertySpecification();
  if (specification.GetShorthand(name) ||
      !ValidatePropertyShorthand(specification, properties, type)) {
    info.GetReturnValue().Set(0);
    return;
  }
  if (specification.GetShorthand(static_cast<Rml::ShorthandId>(
          static_cast<unsigned>(Rml::ShorthandId::MaxNumIds) - 1))) {
    return Nan::ThrowRangeError("Maximum shorthand capacity reached");
  }
  auto* instancer = static_cast<Implementation*>(state->owned.get());
  info.GetReturnValue().Set(static_cast<unsigned>(
      instancer->RegisterShorthand(name, properties, type)));
}

template <typename T>
NAN_METHOD(InstanceEffect) {
  Rml::String name;
  if (!ReadString(info[1], &name)) {
    return;
  }
  const Rml::DecoratorInstancerInterface* active = nullptr;
  if constexpr (std::is_same_v<T, Rml::DecoratorInstancer>) {
    active = DecoratorInterfaceOf(info[3]);
    if (!active) {
      return;
    }
  }
  auto state = InstancerOf<T>(info[0]);
  if (!state) {
    return;
  }
  auto* dictionary = PropertyDictionaryOf(info[2]);
  if (!dictionary) {
    return;
  }
  if (state->active) {
    return Nan::ThrowError("Recursive effect instancer callback");
  }
  const auto& specification = state->value->GetPropertySpecification();
  for (auto id : specification.GetRegisteredProperties()) {
    if (!dictionary->value.GetProperty(id)) {
      return Nan::ThrowTypeError("Effect is missing required properties");
    }
  }
  for (const auto& [id, property] : dictionary->value.GetProperties()) {
    if (!specification.GetProperty(id)) {
      return Nan::ThrowRangeError("Unknown instancer-local property id");
    }
    if (!ValidatePropertyStorage(property)) {
      return;
    }
  }
  // User callbacks receive a copy and cannot invalidate native iteration.
  const auto snapshot = dictionary->value;
  auto effect = [&] {
    if constexpr (std::is_same_v<T, Rml::FontEffectInstancer>) {
      return state->value->InstanceFontEffect(name, snapshot);
    } else if constexpr (std::is_same_v<T, Rml::DecoratorInstancer>) {
      return state->value->InstanceDecorator(name, snapshot, *active);
    } else {
      return state->value->InstanceFilter(name, snapshot);
    }
  }();
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (effect) {
    if constexpr (std::is_same_v<T, Rml::FontEffectInstancer>) {
      info.GetReturnValue().Set(WrapFontEffect(effect));
    } else if constexpr (std::is_same_v<T, Rml::DecoratorInstancer>) {
      info.GetReturnValue().Set(
          WrapDecorator(std::move(effect), &active->GetRenderManager()));
    } else {
      info.GetReturnValue().Set(WrapFilter(effect));
    }
  } else {
    info.GetReturnValue().SetNull();
  }
}

template <typename T>
void ReleaseInstancers() {
  for (auto& [pointer, weak] : Instancers<T>()) {
    if (auto state = weak.lock()) {
      if (!state->handle.IsEmpty()) {
        Nan::DeletePrivate(state->handle.Get(v8::Isolate::GetCurrent()),
                           Nan::New("rml.instancer.callback").ToLocalChecked())
            .FromJust();
        state->handle.Reset();
      }
      state->callback.Reset();
      state->owned.reset();
      state->value = nullptr;
      state->generation = 0;
    }
  }
  RegisteredInstancers<T>().clear();
  Instancers<T>().clear();
}

template <typename T>
void AppendInstancerOwners(CallbackOwnerSnapshots* snapshots) {
  for (const auto& [pointer, weak] : Instancers<T>()) {
    const auto state = weak.lock();
    if (!state || !state->value ||
        (!state->registered && state->handle.IsEmpty())) {
      continue;
    }
    auto& snapshot = snapshots->emplace_back();
    if (!state->registered) {
      snapshot.handle = state->handle.Get(v8::Isolate::GetCurrent());
    }
    AppendPropertyDefaults(state->value->GetPropertySpecification(), &snapshot);
  }
}

}  // namespace

void AppendInstancerCallbackOwners(CallbackOwnerSnapshots* snapshots) {
  AppendInstancerOwners<Rml::DecoratorInstancer>(snapshots);
  AppendInstancerOwners<Rml::FilterInstancer>(snapshots);
  AppendInstancerOwners<Rml::FontEffectInstancer>(snapshots);
}

template <typename T>
v8::Local<v8::Value> WrapEffectInstancer(T* pointer) {
  if (!pointer) {
    return Nan::Null();
  }
  auto& registry = Instancers<T>();
  auto state = registry[pointer].lock();
  if (!state) {
    std::erase_if(registry,
                  [](const auto& entry) { return entry.second.expired(); });
    state = std::make_shared<InstancerState<T>>();
    state->value = pointer;
    state->generation = State().generation;
    registry[pointer] = state;
  }
  return WrapState(std::move(state));
}

template <typename T>
bool ReadEffectInstancer(v8::Local<v8::Value> input, T** pointer) {
  if (input->IsNull()) {
    *pointer = nullptr;
    return true;
  }
  auto state = InstancerOf<T>(input);
  if (!state) {
    return false;
  }
  *pointer = state->value;
  return true;
}

template v8::Local<v8::Value> WrapEffectInstancer(Rml::DecoratorInstancer*);
template v8::Local<v8::Value> WrapEffectInstancer(Rml::FilterInstancer*);
template bool ReadEffectInstancer(v8::Local<v8::Value>,
                                  Rml::DecoratorInstancer**);
template bool ReadEffectInstancer(v8::Local<v8::Value>, Rml::FilterInstancer**);

void ReleaseEffectInstancers() {
  ReleaseInstancers<Rml::DecoratorInstancer>();
  ReleaseInstancers<Rml::FilterInstancer>();
  ReleaseInstancers<Rml::FontEffectInstancer>();
}

NAN_MODULE_INIT(InitializeRmlEffectInstancers) {
  using Factory = Rml::Factory;
  SetInstancerValueMethod<GetInstancer<&Factory::GetDecoratorInstancer>>(
      target, "getDecoratorInstancer");
  SetInstancerValueMethod<GetInstancer<&Factory::GetFilterInstancer>>(
      target, "getFilterInstancer");
  SetInstancerValueMethod<GetInstancer<&Factory::GetFontEffectInstancer>>(
      target, "getFontEffectInstancer");
  SetRuntimeMethod<RegisterInstancer<Rml::DecoratorInstancer,
                                     &Factory::RegisterDecoratorInstancer>,
                   true>(target, "registerDecoratorInstancer");
  SetRuntimeMethod<RegisterInstancer<Rml::FilterInstancer,
                                     &Factory::RegisterFilterInstancer>,
                   true>(target, "registerFilterInstancer");
  SetRuntimeMethod<RegisterInstancer<Rml::FontEffectInstancer,
                                     &Factory::RegisterFontEffectInstancer>,
                   true>(target, "registerFontEffectInstancer");
  SetInstancerValueMethod<GetSpecification<Rml::DecoratorInstancer>>(
      target, "decoratorInstancerSpecification");
  SetInstancerValueMethod<GetSpecification<Rml::FilterInstancer>>(
      target, "filterInstancerSpecification");
  SetInstancerValueMethod<GetSpecification<Rml::FontEffectInstancer>>(
      target, "fontEffectInstancerSpecification");
  SetRuntimeMethod<
      CreateInstancer<Rml::FontEffectInstancer, JavaScriptFontEffectInstancer>,
      true>(target, "createFontEffectInstancer");
  SetRuntimeMethod<
      RegisterProperty<Rml::FontEffectInstancer, JavaScriptFontEffectInstancer>,
      true>(target, "fontEffectInstancerRegisterProperty");
  SetRuntimeMethod<RegisterShorthand<Rml::FontEffectInstancer,
                                     JavaScriptFontEffectInstancer>,
                   true>(target, "fontEffectInstancerRegisterShorthand");
  SetInstancerValueMethod<InstanceEffect<Rml::FontEffectInstancer>>(
      target, "instanceFontEffect");
  SetRuntimeMethod<
      CreateInstancer<Rml::FilterInstancer, JavaScriptFilterInstancer>,
      true>(target, "createFilterInstancer");
  SetRuntimeMethod<
      RegisterProperty<Rml::FilterInstancer, JavaScriptFilterInstancer>,
      true>(target, "filterInstancerRegisterProperty");
  SetRuntimeMethod<
      RegisterShorthand<Rml::FilterInstancer, JavaScriptFilterInstancer>,
      true>(target, "filterInstancerRegisterShorthand");
  SetInstancerValueMethod<InstanceEffect<Rml::FilterInstancer>>(
      target, "instanceFilter");
  SetRuntimeMethod<
      CreateInstancer<Rml::DecoratorInstancer, JavaScriptDecoratorInstancer>,
      true>(target, "createDecoratorInstancer");
  SetRuntimeMethod<
      RegisterProperty<Rml::DecoratorInstancer, JavaScriptDecoratorInstancer>,
      true>(target, "decoratorInstancerRegisterProperty");
  SetRuntimeMethod<
      RegisterShorthand<Rml::DecoratorInstancer, JavaScriptDecoratorInstancer>,
      true>(target, "decoratorInstancerRegisterShorthand");
  SetInstancerValueMethod<InstanceEffect<Rml::DecoratorInstancer>>(
      target, "instanceDecorator");
}

}  // namespace sfmlrmlui
