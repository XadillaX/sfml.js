// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <cmath>
#include <limits>
#include <string>

#include "native/events/rmlui-event-bridge.h"
#include "native/platform/ime/platform-text-input.h"
#include "native/platform/rmlui-platform-sfml.h"
#include "native/platform/rmlui-text-input.h"
#include "native/platform/system-interface-sfml.h"
#include "native/platform/window-density.h"
#include "native/rendering/layers/render-session.h"
#include "native/rendering/manager/rmlui-render-layers.h"
#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/textures/rmlui-resources.h"
#include "native/runtime/rmlui-context-instancers.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

class ContextRenderScope final {
 public:
  explicit ContextRenderScope(Rml::RenderInterface* renderer)
      : previous_(State().instancing_render_interface) {
    State().instancing_render_interface = renderer;
  }
  ~ContextRenderScope() { State().instancing_render_interface = previous_; }

 private:
  Rml::RenderInterface* previous_;
};

void UpdateDensity(Rml::Context* context) {
  if (!State().contexts.at(context)->automatic_density) {
    return;
  }
  context->SetDensityIndependentPixelRatio(WindowDensity(
      RenderWindowFor(State().contexts.at(context)->render_interface)));
}

bool ReadDimensions(v8::Local<v8::Value> width,
                    v8::Local<v8::Value> height,
                    Rml::Vector2i* dimensions) {
  if (!width->IsInt32() || !height->IsInt32() ||
      Nan::To<int>(width).FromJust() < 0 ||
      Nan::To<int>(height).FromJust() < 0) {
    Nan::ThrowRangeError("Expected nonnegative int32 dimensions");
    return false;
  }
  *dimensions = {Nan::To<int>(width).FromJust(),
                 Nan::To<int>(height).FromJust()};
  return true;
}

NAN_METHOD(CreateContext) {
  if (!info[0]->IsString()) {
    return Nan::ThrowTypeError("Expected a context name");
  }
  Nan::Utf8String name(info[0]);
  Rml::Vector2i dimensions;
  if (!ReadDimensions(info[1], info[2], &dimensions)) {
    return;
  }

  auto* renderer = Rml::GetRenderInterface();
  if (!info[3]->IsNullOrUndefined()) {
    renderer = RenderInterfaceOf(info[3]);
    if (!renderer) {
      return;
    }
  }
  ContextRenderScope render_scope(renderer);
  Rml::TextInputHandler* handler = nullptr;
  if (!info[4]->IsNullOrUndefined() &&
      !ReadTextInputHandler(info[4], &handler)) {
    return;
  }
  if (!RetainRenderInterface(renderer)) {
    return;
  }
  auto* context = Rml::CreateContext(
      std::string(*name, name.length()), dimensions, renderer, handler);
  if (context == nullptr) {
    if (!State().callback_exception.IsEmpty()) {
      return;
    }
    return Nan::ThrowError("Failed to create RmlUi context");
  }
  info.GetReturnValue().Set(WrapContext(context));
  State().contexts.at(context)->render_interface = renderer;
  TrackContextTextInputHandler(State().contexts.at(context));
  UpdateDensity(context);
}

NAN_METHOD(RemoveContext) {
  Rml::Context* context = nullptr;
  if (info[0]->IsString()) {
    Nan::Utf8String name(info[0]);
    context = Rml::GetContext(Rml::String(*name, name.length()));
    if (!context) {
      info.GetReturnValue().Set(false);
      return;
    }
  } else {
    context = ContextOf(info[0]);
  }
  if (!context) {
    return;
  }
  if (IsOwnedContext(context)) {
    info.GetReturnValue().Set(ReleaseOwnedContext(context));
    return;
  }
  const auto name = context->GetName();
  ReleaseContextDocuments(context);
  const bool removed = Rml::RemoveContext(name);
  if (removed) {
    InvalidateContext(context);
  }
  info.GetReturnValue().Set(removed);
}

NAN_METHOD(GetContext) {
  Rml::Context* context = nullptr;
  if (info[0]->IsString()) {
    Nan::Utf8String name(info[0]);
    context = Rml::GetContext(Rml::String(*name, name.length()));
  } else if (info[0]->IsInt32()) {
    context = Rml::GetContext(Nan::To<int>(info[0]).FromJust());
  } else {
    return Nan::ThrowTypeError("Expected a context name or int32 index");
  }
  info.GetReturnValue().Set(context ? v8::Local<v8::Value>(WrapContext(context))
                                    : v8::Local<v8::Value>(Nan::Null()));
}

NAN_METHOD(GetNumContexts) {
  info.GetReturnValue().Set(Rml::GetNumContexts());
}

NAN_METHOD(GetContextName) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(Nan::New(context->GetName()).ToLocalChecked());
  }
}

NAN_METHOD(GetRootElement) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(WrapElement(context->GetRootElement()));
  }
}

NAN_METHOD(SetDimensions) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  Rml::Vector2i dimensions;
  if (!ReadDimensions(info[1], info[2], &dimensions)) {
    return;
  }
  // Resize listeners synchronously observe the new dimensions.
  State().contexts.at(context)->dimensions = dimensions;
  context->SetDimensions(dimensions);
  State().contexts.at(context)->dimensions = context->GetDimensions();
}

NAN_METHOD(ViewDimensions) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  // Callback aliases own their numeric mirror; expiry zeros only that alias.
  const auto& state = ContextHandle::From(info[0])->owner();
  state->dimensions = context->GetDimensions();
  auto result = sfmljs::NumericFields()
                    .Add("width", state->dimensions.x, "i32")
                    .Add("height", state->dimensions.y, "i32")
                    .Map(state);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(EnableMouseCursor) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  if (!info[1]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected (context, boolean)");
  }
  context->EnableMouseCursor(info[1]->IsTrue());
}

NAN_METHOD(Update) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  DrainPlatformTextInput(context);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  UpdateDensity(context);
  info.GetReturnValue().Set(context->Update());
}

NAN_METHOD(GetDensityIndependentPixelRatio) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  info.GetReturnValue().Set(context->GetDensityIndependentPixelRatio());
}

NAN_METHOD(SetDensityIndependentPixelRatio) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  auto& token = State().contexts.at(context);
  if (info[1]->IsNull()) {
    token->automatic_density = true;
    UpdateDensity(context);
    return;
  }
  if (!info[1]->IsNumber()) {
    return Nan::ThrowTypeError("Expected a positive density ratio or null");
  }
  const double ratio = Nan::To<double>(info[1]).FromJust();
  if (!std::isfinite(ratio) || ratio > std::numeric_limits<float>::max() ||
      !(static_cast<float>(ratio) > 0)) {
    return Nan::ThrowRangeError(
        "Density ratio must be a positive finite float");
  }
  token->automatic_density = false;
  context->SetDensityIndependentPixelRatio(static_cast<float>(ratio));
}

NAN_METHOD(RequestNextUpdate) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  if (!info[1]->IsNumber()) {
    return Nan::ThrowTypeError("Expected a nonnegative update delay");
  }
  const double delay = Nan::To<double>(info[1]).FromJust();
  if (std::isnan(delay) || delay < 0) {
    return Nan::ThrowRangeError("Update delay must be nonnegative");
  }
  context->RequestNextUpdate(delay);
}

NAN_METHOD(GetNextUpdateDelay) {
  if (auto* context = ContextOf(info[0])) {
    info.GetReturnValue().Set(context->GetNextUpdateDelay());
  }
}

NAN_METHOD(ActivateTheme) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  if (!info[1]->IsString() || !info[2]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected (context, name, activate)");
  }
  Nan::Utf8String name(info[1]);
  context->ActivateTheme(std::string(*name, name.length()), info[2]->IsTrue());
}

NAN_METHOD(IsThemeActive) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  if (!info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected (context, name)");
  }
  Nan::Utf8String name(info[1]);
  info.GetReturnValue().Set(
      context->IsThemeActive(std::string(*name, name.length())));
}

NAN_METHOD(Render) {
  auto* context = ContextOf(info[0]);
  if (!context || !CanPrepareRender(&context->GetRenderManager())) {
    return;
  }
  RenderSession session(static_cast<RenderInterfaceSFML*>(
                            State().contexts.at(context)->render_interface),
                        &context->GetRenderManager());
  const bool rendered = context->Render();
  if (rendered && State().callback_exception.IsEmpty()) {
    session.Commit();
  }
  info.GetReturnValue().Set(rendered);
}

NAN_METHOD(ProcessEvent) {
  if (!ContextOf(info[0])) {
    return;
  }
  std::optional<sf::Event> event;
  {
    // Preserve getter errors instead of replacing them with conversion errors.
    Nan::TryCatch try_catch;
    event = BuildWindowEvent(info[1]);
    if (try_catch.HasCaught()) {
      try_catch.ReThrow();
      return;
    }
  }
  // Event data may contain getters that remove or replace this context.
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  if (!event) {
    info.GetReturnValue().Set(true);
    return;
  }
  DrainPlatformTextInput(context);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  context = ContextOf(info[0]);
  if (!context) {
    return;
  }
  const auto source = sfmljs::interop::ReadWindowEventSource(info[1], *event);
  if (ConsumePlatformTextInput(context, *event, source)) {
    info.GetReturnValue().Set(false);
    return;
  }
  // SFML's Cocoa hidden text view emits UTF16 units. The native IME bridge
  // discards its duplicate stream before scalar validation; unowned malformed
  // events still fail instead of entering RmlUi with a surrogate code point.
  if (const auto* text = event->getIf<sf::Event::TextEntered>()) {
    if (text->unicode >= 0xd800 && text->unicode <= 0xdfff) {
      return Nan::ThrowTypeError("Invalid TextEntered event");
    }
  }
  if (const auto* resized = event->getIf<sf::Event::Resized>()) {
    const Rml::Vector2i dimensions{static_cast<int>(resized->size.x),
                                   static_cast<int>(resized->size.y)};
    State().contexts.at(context)->dimensions = dimensions;
    context->SetDimensions(dimensions);
    State().contexts.at(context)->dimensions = context->GetDimensions();
    UpdateDensity(context);
  }
  const bool propagating = platform::InputHandler(context, *event);
  info.GetReturnValue().Set(propagating);
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlContext) {
  SetRuntimeMethod<CreateContext>(target, "createContext");
  SetRuntimeMethod<RemoveContext>(target, "removeContext");
  SetRuntimeMethod<GetContext, true>(target, "getContext");
  SetRuntimeMethod<GetNumContexts, true>(target, "getNumContexts");
  SetPluginReadMethod<GetContextName>(target, "getContextName");
  SetRuntimeMethod<GetRootElement, true>(target, "getRootElement");
  SetRuntimeMethod<SetDimensions>(target, "setDimensions");
  SetPluginReadMethod<ViewDimensions>(target, "viewDimensions");
  SetRuntimeMethod<EnableMouseCursor>(target, "enableMouseCursor");
  SetRuntimeMethod<ActivateTheme>(target, "activateTheme");
  SetRuntimeMethod<IsThemeActive, true>(target, "isThemeActive");
  SetRuntimeMethod<Update>(target, "update");
  SetRuntimeMethod<GetDensityIndependentPixelRatio, true>(
      target, "getDensityIndependentPixelRatio");
  SetRuntimeMethod<SetDensityIndependentPixelRatio>(
      target, "setDensityIndependentPixelRatio");
  SetRuntimeMethod<RequestNextUpdate, true>(target, "requestNextUpdate");
  SetRuntimeMethod<GetNextUpdateDelay, true>(target, "getNextUpdateDelay");
  SetRuntimeMethod<Render>(target, "render");
  SetRuntimeMethod<ProcessEvent>(target, "processEvent");
}

}  // namespace sfmlrmlui
