// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

// This small extension uses the already loaded package, not another runtime.
#include <RmlUi/Core/ElementInstancer.h>
#include <RmlUi/Core/StyleSheetTypes.h>
#include <dlfcn.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <memory>
#include <utility>

#include "native/runtime/rmlui-context-instancers.h"
#include "native/events/rmlui-event-instancers.h"
#include "native/events/rmlui-events.h"
#include "native/values/rmlui-owned-variant.h"
#include "native/style/properties/rmlui-property-dictionary.h"
#include "native/style/properties/rmlui-property.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/scripting/rmlui-script-object.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant-objects.h"
#include "native/values/rmlui-variant-pointers.h"
#include "native/values/rmlui-variant.h"

namespace {

struct Payload {
  int value{37};
};

struct OpaqueOwner {
  ~OpaqueOwner() { Expire(); }

  void Expire() {
    if (registration) {
      registration->Invalidate();
    }
    payload.reset();
  }

  std::unique_ptr<Payload> payload{std::make_unique<Payload>()};
  std::unique_ptr<sfmlrmlui::NativeObjectVariantOwner> registration;
  Rml::Variant value;
};

using OpaqueHandle = sfmljs::SharedHandle<OpaqueOwner>;

class ExternalElement final : public Rml::Element {
 public:
  explicit ExternalElement(const Rml::String& tag) : Rml::Element(tag) {}

  Rml::ScriptObject GetScriptObject() const override { return pointer_; }

  void ReplaceIdentity() { pointer_ = &replacement_; }

 private:
  inline static Payload shared_payload_;
  Payload replacement_;
  Rml::ScriptObject pointer_{&shared_payload_};
};

Rml::ElementPtr MakeElement() {
  static Rml::ElementInstancerGeneric<ExternalElement> allocator;
  auto element =
      allocator.InstanceElement(nullptr, "external-native-element", {});
  element->SetInstancer(&allocator);
  return element;
}

class NativeScript final : public Rml::ScriptInterface {
 public:
  Rml::ScriptObject GetScriptObject() const override {
    ++read_count_;
    return returns_null_ ? nullptr : const_cast<Payload*>(&payload_);
  }

  size_t TakeReadCount() { return std::exchange(read_count_, 0); }

  void SetReturnsNull(bool value) { returns_null_ = value; }

 protected:
  void Release() override { delete this; }

 private:
  Payload payload_;
  mutable size_t read_count_{0};
  bool returns_null_{false};
};

class ExternalContext final : public Rml::Context {
 public:
  using Rml::Context::Context;

  Rml::ScriptObject GetScriptObject() const override {
    return const_cast<Payload*>(&payload_);
  }

 protected:
  void Release() override { delete this; }

 private:
  Payload payload_;
};

class ExternalEvent final : public Rml::Event {
 public:
  Rml::ScriptObject GetScriptObject() const override {
    return const_cast<Payload*>(&payload_);
  }

 protected:
  void Release() override { delete this; }

 private:
  Payload payload_;
};

class ParameterEvent final : public Rml::Event {
 public:
  using Rml::Event::Event;

  void SetParameter(const Rml::Variant& value) { parameters["value"] = value; }

 protected:
  void Release() override { delete this; }
};

auto& NativeScriptOwner() {
  static std::unique_ptr<NativeScript> owner;
  return owner;
}

struct ScriptVariantSource {
  ~ScriptVariantSource() { Expire(); }

  void Expire() {
    if (registration) {
      registration->Invalidate();
    }

    script.reset();
  }

  std::unique_ptr<NativeScript> script{std::make_unique<NativeScript>()};
  std::unique_ptr<sfmlrmlui::NativeScriptVariantOwner> registration;
  Rml::Variant value;
};

using ScriptVariantHandle = sfmljs::SharedHandle<ScriptVariantSource>;

NAN_METHOD(OpenNative) {
  Nan::Utf8String path(info[0]);
  if (!dlopen(*path, RTLD_NOW | RTLD_GLOBAL)) {
    Nan::ThrowError(dlerror());
  }
}

NAN_METHOD(CreateOpaque) {
  auto owner = std::make_shared<OpaqueOwner>();
  owner->registration = sfmlrmlui::RegisterNativeObjectVariant(
      owner->payload.get(), info[0].As<v8::Object>());
  if (!owner->registration) {
    return;
  }

  owner->registration->SetVariant(&owner->value);
  auto handle = OpaqueHandle::Create(owner);
  auto snapshot = sfmlrmlui::WrapOwnedVariant(owner->value);
  Nan::SetPrivate(
      handle, Nan::New("external.native.value").ToLocalChecked(), snapshot)
      .FromJust();
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(CopyOpaque) {
  auto* handle = OpaqueHandle::From(info[0]);
  if (handle) {
    info.GetReturnValue().Set(
        sfmlrmlui::WrapOwnedVariant(handle->owner()->value));
  }
}

NAN_METHOD(ReadRawOpaque) {
  Payload payload;
  v8::Local<v8::Value> result;
  if (sfmlrmlui::VariantToJs(Rml::Variant(static_cast<void*>(&payload)))
          .ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(ReadOpaque) {
  auto* handle = OpaqueHandle::From(info[0]);
  if (!handle) {
    return;
  }

  v8::Local<v8::Value> result;
  if (sfmlrmlui::VariantToJs(handle->owner()->value).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(ExpireOpaque) {
  if (auto* handle = OpaqueHandle::From(info[0])) {
    handle->owner()->Expire();
  }
}

NAN_METHOD(CheckOpaqueAddress) {
  auto* handle = OpaqueHandle::From(info[0]);
  if (handle) {
    info.GetReturnValue().Set(handle->owner()->value.GetReference<void*>() ==
                              handle->owner()->payload.get());
  }
}

NAN_METHOD(CreateScriptElement) {
  auto element = MakeElement();
  const auto pointer = element->GetScriptObject();
  if (!sfmlrmlui::RegisterNativeScriptObject(
          element.get(), pointer, info[0].As<v8::Object>())) {
    return;
  }

  auto handle = sfmlrmlui::WrapOwnedElement(std::move(element));
  sfmlrmlui::RefreshScriptObjectOwnership();
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(CreateRawScriptElement) {
  info.GetReturnValue().Set(sfmlrmlui::WrapOwnedElement(MakeElement()));
}

NAN_METHOD(RegisterScriptElement) {
  auto* element = sfmlrmlui::ElementOf(info[0]);
  if (element) {
    sfmlrmlui::RegisterNativeScriptObject(
        element, element->GetScriptObject(), info[1].As<v8::Object>());
    sfmlrmlui::RefreshScriptObjectOwnership();
  }
}

NAN_METHOD(ReplaceScriptIdentity) {
  auto* element = sfmlrmlui::ElementOf(info[0]);
  if (element) {
    static_cast<ExternalElement*>(element)->ReplaceIdentity();
  }
}

NAN_METHOD(RegisterWrongScriptIdentity) {
  auto* element = sfmlrmlui::ElementOf(info[0]);
  Payload wrong;
  if (element) {
    sfmlrmlui::RegisterNativeScriptObject(
        element, &wrong, info[1].As<v8::Object>());
  }
}

NAN_METHOD(ReadScriptElement) {
  auto* element = sfmlrmlui::ElementOf(info[0]);
  if (!element) {
    return;
  }

  v8::Local<v8::Value> result;
  if (sfmlrmlui::ReadScriptObject(element).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(CreateNativeScript) {
  auto script = std::make_unique<NativeScript>();
  if (!sfmlrmlui::RegisterNativeScriptObject(
          script.get(), script->GetScriptObject(), info[0].As<v8::Object>())) {
    return;
  }

  NativeScriptOwner() = std::move(script);
  sfmlrmlui::RefreshScriptObjectOwnership();
}

NAN_METHOD(CreateScriptContext) {
  auto* parent = sfmlrmlui::ContextOf(info[0]);
  if (!parent) {
    return;
  }

  auto manager = sfmlrmlui::ShareRenderManager(&parent->GetRenderManager());
  Rml::ContextPtr context(
      new ExternalContext("external-script-context", manager->value, nullptr));
  if (!sfmlrmlui::RegisterNativeScriptObject(context.get(),
                                             context->GetScriptObject(),
                                             info[1].As<v8::Object>(),
                                             context->GetRootElement())) {
    return;
  }

  info.GetReturnValue().Set(
      sfmlrmlui::WrapOwnedContext(std::move(context), std::move(manager)));
  sfmlrmlui::RefreshScriptObjectOwnership();
}

NAN_METHOD(CreateScriptEvent) {
  auto* root = sfmlrmlui::ElementOf(info[0]);
  if (!root) {
    return;
  }

  Rml::EventPtr event(new ExternalEvent());
  if (!sfmlrmlui::RegisterNativeScriptObject(event.get(),
                                             event->GetScriptObject(),
                                             info[1].As<v8::Object>(),
                                             root)) {
    return;
  }

  v8::Local<v8::Object> result;
  if (sfmlrmlui::WrapOwnedEvent(std::move(event)).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }

  sfmlrmlui::RefreshScriptObjectOwnership();
}

NAN_METHOD(ReadNativeScript) {
  v8::Local<v8::Value> result;
  if (sfmlrmlui::ReadScriptObject(NativeScriptOwner().get()).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(ReleaseNativeScript) {
  NativeScriptOwner().reset();
  sfmlrmlui::RefreshScriptObjectOwnership();
}

NAN_METHOD(TakeNativeScriptReadCount) {
  info.GetReturnValue().Set(
      static_cast<double>(NativeScriptOwner()->TakeReadCount()));
}

NAN_METHOD(SetNativeScriptNull) {
  NativeScriptOwner()->SetReturnsNull(Nan::To<bool>(info[0]).FromJust());
}

NAN_METHOD(UnregisterNativeScript) {
  auto* script = NativeScriptOwner().get();
  const bool registered = script->GetScriptObjectForBinding() != nullptr;
  script->SetScriptObjectForBinding(nullptr, {});
  sfmlrmlui::RefreshScriptObjectOwnership();
  info.GetReturnValue().Set(registered);
}

NAN_METHOD(RegisterNativeScript) {
  auto* script = NativeScriptOwner().get();
  sfmlrmlui::RegisterNativeScriptObject(
      script, script->GetScriptObject(), info[0].As<v8::Object>());
  sfmlrmlui::RefreshScriptObjectOwnership();
}

NAN_METHOD(ReadExpiredRawScriptVariant) {
  auto script = std::make_unique<NativeScript>();
  Rml::Variant value(static_cast<Rml::ScriptInterface*>(script.get()));
  script.reset();

  v8::Local<v8::Value> result;
  if (sfmlrmlui::VariantToJs(value).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(ReadExpiredUnregisteredScriptGuard) {
  auto script = std::make_unique<NativeScript>();
  auto slot = std::make_shared<Rml::ScriptInterface*>(script.get());
  Rml::Variant value;
  value.SetScriptInterfaceForBinding(slot);
  script.reset();

  v8::Local<v8::Value> result;
  if (sfmlrmlui::VariantToJs(value).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

Rml::Variant ExpiredScriptParameter(bool guarded) {
  auto script = std::make_unique<NativeScript>();
  Rml::Variant value;
  if (guarded) {
    value.SetScriptInterfaceForBinding(
        std::make_shared<Rml::ScriptInterface*>(script.get()));
  } else {
    value = static_cast<Rml::ScriptInterface*>(script.get());
  }

  script.reset();
  return value;
}

NAN_METHOD(CreateEventWithExpiredScriptParameter) {
  Rml::Dictionary parameters;
  parameters["value"] = ExpiredScriptParameter(info[0]->IsTrue());
  Rml::EventPtr event(new ParameterEvent(
      nullptr, Rml::EventId::Click, "click", parameters, true));

  v8::Local<v8::Object> result;
  if (sfmlrmlui::WrapOwnedEvent(std::move(event)).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(CreateParameterizedEvent) {
  auto* value = sfmlrmlui::OwnedVariantOf(info[0]);
  if (!value) {
    return;
  }

  Rml::Dictionary parameters;
  parameters["value"] = value->value;
  Rml::EventPtr event(new ParameterEvent(
      nullptr, Rml::EventId::Click, "click", parameters, true));

  v8::Local<v8::Object> result;
  if (sfmlrmlui::WrapOwnedEvent(std::move(event)).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(CreateEventWithUnregisteredDragParameter) {
  auto script = std::make_unique<NativeScript>();
  Rml::Dictionary parameters;
  parameters["drag_element"] = static_cast<void*>(script.get());
  script.reset();

  Rml::EventPtr event(new ParameterEvent(
      nullptr, Rml::EventId::Click, "click", parameters, true));
  v8::Local<v8::Object> result;
  if (sfmlrmlui::WrapOwnedEvent(std::move(event)).ToLocal(&result)) {
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(SetExpiredEventScriptParameter) {
  auto* event = sfmlrmlui::EventOf(info[0]);
  if (!event) {
    return;
  }

  static_cast<ParameterEvent*>(event)->SetParameter(
      ExpiredScriptParameter(info[1]->IsTrue()));
}

NAN_METHOD(SetExpiredVariantScriptValue) {
  if (auto* state = sfmlrmlui::OwnedVariantOf(info[0])) {
    state->value = ExpiredScriptParameter(info[1]->IsTrue());
  }
}

NAN_METHOD(SetExpiredPropertyScriptValue) {
  if (auto* state = sfmlrmlui::PropertyOf(info[0])) {
    state->value.value = ExpiredScriptParameter(info[1]->IsTrue());
  }
}

Rml::Variant ExpiredSerializationPointer(int kind) {
  if (kind < 2) {
    return ExpiredScriptParameter(kind == 1);
  }

  auto payload = std::make_unique<Payload>();
  Rml::Variant value;
  if (kind == 2) {
    value = static_cast<void*>(payload.get());
  } else {
    value.SetOpaquePointerForBinding(std::make_shared<void*>(payload.get()));
  }

  payload.reset();
  return value;
}

Rml::Variant SerializationValue(int pointer_kind, int list_kind, bool cached) {
  auto pointer = ExpiredSerializationPointer(pointer_kind);
  if (list_kind == 0) {
    return pointer;
  }

  Rml::Property property;
  property.value = std::move(pointer);
  Rml::PropertyDictionary properties;
  properties.SetProperty(static_cast<Rml::PropertyId>(1), property);

  if (list_kind == 1) {
    auto list = std::make_shared<Rml::DecoratorDeclarationList>();
    list->value = cached ? "cached-native-text" : "";
    list->list.push_back({"image",
                          Rml::Factory::GetDecoratorInstancer("image"),
                          std::move(properties),
                          Rml::BoxArea::Auto});
    return Rml::Variant(Rml::DecoratorsPtr(std::move(list)));
  }

  auto list = std::make_shared<Rml::FilterDeclarationList>();
  list->value = cached ? "cached-native-text" : "";
  list->list.push_back({"blur",
                        Rml::Factory::GetFilterInstancer("blur"),
                        std::move(properties)});
  return Rml::Variant(Rml::FiltersPtr(std::move(list)));
}

NAN_METHOD(SetPropertySerializationValue) {
  if (auto* state = sfmlrmlui::PropertyOf(info[0])) {
    state->value.value = SerializationValue(Nan::To<int>(info[1]).FromJust(),
                                            Nan::To<int>(info[2]).FromJust(),
                                            info[3]->IsTrue());
  }
}

NAN_METHOD(CopySerializationPropertyToDictionary) {
  auto* property = sfmlrmlui::PropertyOf(info[0]);
  auto* dictionary = sfmlrmlui::PropertyDictionaryOf(info[1]);
  if (property && dictionary) {
    dictionary->value.SetProperty(static_cast<Rml::PropertyId>(1),
                                  property->value);
  }
}

NAN_METHOD(CopySerializationPropertyToVariant) {
  auto* property = sfmlrmlui::PropertyOf(info[0]);
  auto* variant = sfmlrmlui::OwnedVariantOf(info[1]);
  if (property && variant) {
    variant->value = property->value.value;
  }
}

NAN_METHOD(SetExpiredElementScriptAttribute) {
  if (auto* element = sfmlrmlui::ElementOf(info[0])) {
    element->SetAttribute("value", ExpiredScriptParameter(info[1]->IsTrue()));
  }
}

NAN_METHOD(CreateScriptVariant) {
  auto source = std::make_shared<ScriptVariantSource>();
  source->registration = sfmlrmlui::RegisterNativeScriptVariant(
      source->script.get(), info[0].As<v8::Object>());
  if (!source->registration) {
    return;
  }

  source->registration->SetVariant(&source->value);
  auto handle = ScriptVariantHandle::Create(source);
  auto snapshot = sfmlrmlui::WrapOwnedVariant(source->value);

  Nan::SetPrivate(
      handle, Nan::New("external.native.script").ToLocalChecked(), snapshot)
      .FromJust();
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(CopyScriptVariant) {
  if (auto* handle = ScriptVariantHandle::From(info[0])) {
    info.GetReturnValue().Set(
        sfmlrmlui::WrapOwnedVariant(handle->owner()->value));
  }
}

NAN_METHOD(ExpireScriptVariant) {
  if (auto* handle = ScriptVariantHandle::From(info[0])) {
    handle->owner()->Expire();
  }
}

NAN_METHOD(CheckScriptVariantAddress) {
  if (auto* handle = ScriptVariantHandle::From(info[0])) {
    const auto& source = handle->owner();
    info.GetReturnValue().Set(
        source->value.GetReference<Rml::ScriptInterface*>() ==
        source->script.get());
  }
}

NAN_METHOD(TakeScriptVariantReadCount) {
  if (auto* handle = ScriptVariantHandle::From(info[0])) {
    info.GetReturnValue().Set(
        static_cast<double>(handle->owner()->script->TakeReadCount()));
  }
}

NAN_MODULE_INIT(Initialize) {
  Nan::SetMethod(target, "openNative", OpenNative);
  sfmlrmlui::SetRuntimeMethod<CreateOpaque>(target, "createOpaque");
  sfmlrmlui::SetRuntimeMethod<CopyOpaque>(target, "copyOpaque");
  sfmlrmlui::SetRuntimeMethod<ReadOpaque>(target, "readOpaque");
  sfmlrmlui::SetRuntimeMethod<ReadRawOpaque>(target, "readRawOpaque");
  sfmlrmlui::SetRuntimeMethod<ExpireOpaque>(target, "expireOpaque");
  sfmlrmlui::SetRuntimeMethod<CheckOpaqueAddress>(target, "checkOpaqueAddress");
  sfmlrmlui::SetRuntimeMethod<CreateScriptElement>(target,
                                                   "createScriptElement");
  sfmlrmlui::SetRuntimeMethod<CreateRawScriptElement>(target,
                                                      "createRawScriptElement");
  sfmlrmlui::SetRuntimeMethod<RegisterScriptElement>(target,
                                                     "registerScriptElement");
  sfmlrmlui::SetRuntimeMethod<ReplaceScriptIdentity>(target,
                                                     "replaceScriptIdentity");
  sfmlrmlui::SetRuntimeMethod<RegisterWrongScriptIdentity>(
      target, "registerWrongScriptIdentity");
  sfmlrmlui::SetRuntimeMethod<ReadScriptElement>(target, "readScriptElement");
  sfmlrmlui::SetRuntimeMethod<CreateNativeScript>(target, "createNativeScript");
  sfmlrmlui::SetRuntimeMethod<CreateScriptContext>(target,
                                                   "createScriptContext");
  sfmlrmlui::SetRuntimeMethod<CreateScriptEvent>(target, "createScriptEvent");
  sfmlrmlui::SetRuntimeMethod<ReadNativeScript>(target, "readNativeScript");
  sfmlrmlui::SetRuntimeMethod<ReleaseNativeScript>(target,
                                                   "releaseNativeScript");
  sfmlrmlui::SetRuntimeMethod<TakeNativeScriptReadCount>(
      target, "takeNativeScriptReadCount");
  sfmlrmlui::SetRuntimeMethod<SetNativeScriptNull>(target,
                                                   "setNativeScriptNull");
  sfmlrmlui::SetRuntimeMethod<UnregisterNativeScript>(target,
                                                      "unregisterNativeScript");
  sfmlrmlui::SetRuntimeMethod<RegisterNativeScript>(target,
                                                    "registerNativeScript");
  sfmlrmlui::SetRuntimeMethod<ReadExpiredRawScriptVariant>(
      target, "readExpiredRawScriptVariant");
  sfmlrmlui::SetRuntimeMethod<ReadExpiredUnregisteredScriptGuard>(
      target, "readExpiredUnregisteredScriptGuard");
  sfmlrmlui::SetRuntimeMethod<CreateEventWithExpiredScriptParameter>(
      target, "createEventWithExpiredScriptParameter");
  sfmlrmlui::SetRuntimeMethod<CreateParameterizedEvent>(
      target, "createParameterizedEvent");
  sfmlrmlui::SetRuntimeMethod<CreateEventWithUnregisteredDragParameter>(
      target, "createEventWithUnregisteredDragParameter");
  sfmlrmlui::SetRuntimeMethod<SetExpiredEventScriptParameter>(
      target, "setExpiredEventScriptParameter");
  sfmlrmlui::SetRuntimeMethod<SetExpiredVariantScriptValue>(
      target, "setExpiredVariantScriptValue");
  sfmlrmlui::SetRuntimeMethod<SetExpiredPropertyScriptValue>(
      target, "setExpiredPropertyScriptValue");
  sfmlrmlui::SetRuntimeMethod<SetPropertySerializationValue>(
      target, "setPropertySerializationValue");
  sfmlrmlui::SetRuntimeMethod<CopySerializationPropertyToDictionary>(
      target, "copySerializationPropertyToDictionary");
  sfmlrmlui::SetRuntimeMethod<CopySerializationPropertyToVariant>(
      target, "copySerializationPropertyToVariant");
  sfmlrmlui::SetRuntimeMethod<SetExpiredElementScriptAttribute>(
      target, "setExpiredElementScriptAttribute");
  sfmlrmlui::SetRuntimeMethod<CreateScriptVariant>(target,
                                                   "createScriptVariant");
  sfmlrmlui::SetRuntimeMethod<CopyScriptVariant>(target, "copyScriptVariant");
  sfmlrmlui::SetRuntimeMethod<ExpireScriptVariant>(target,
                                                   "expireScriptVariant");
  sfmlrmlui::SetRuntimeMethod<CheckScriptVariantAddress>(
      target, "checkScriptVariantAddress");
  sfmlrmlui::SetRuntimeMethod<TakeScriptVariantReadCount>(
      target, "takeScriptVariantReadCount");
}

}  // namespace

NAN_MODULE_WORKER_ENABLED(external_variant_adapters, Initialize)
