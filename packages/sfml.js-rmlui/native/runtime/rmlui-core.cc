// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Log.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <string>

#include "native/fonts/rmlui-font-engine.h"
#include "native/io/rmlui-file-interface.h"
#include "native/platform/rmlui-system-interface.h"
#include "native/platform/rmlui-text-input.h"
#include "native/platform/system-interface-sfml.h"
#include "native/platform/window-density.h"
#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/textures/rmlui-resources.h"
#include "native/runtime/rmlui-interop.h"
#include "native/runtime/rmlui-parent-observers.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {

void InitialiseVectorModules();

namespace {

NAN_METHOD(Initialise) {
  auto& state = State();
  if (state.initialized) {
    info.GetReturnValue().Set(true);
    return;
  }

  auto* window = GetRenderWindow(info[0]);
  if (!window) {
    return;
  }
  if (!info[1]->IsUndefined() && !info[1]->IsString()) {
    return Nan::ThrowTypeError("Expected an optional file root string");
  }
  if (!info[2]->IsFalse() && !EnableHighDpi(window)) {
    return Nan::ThrowError(
        "SFML Retina support is unavailable. Rebuild sfml.js-rmlui "
        "to prepare its macOS SDK, then restart the process.");
  }
  std::string root_value;
  const std::string* root_option = nullptr;
  if (info[1]->IsString()) {
    Nan::Utf8String root(info[1]);
    root_value.assign(*root, root.length());
    root_option = &root_value;
  }
  if (!PrepareFileInterface(root_option)) {
    return;
  }

  PrepareSystemInterface(info[0].As<v8::Object>());
  if (!state.system_interface) {
    return;
  }
  PrepareRenderInterface(info[0].As<v8::Object>());

  Rml::SetSystemInterface(state.system_interface.get());
  Rml::SetFileInterface(state.file_interface.get());
  PrepareFontEngineInterface();
  state.initialized = Rml::Initialise();
  if (state.initialized) {
    InstallElementOwnershipNotifications();
    ClaimRuntime();
    InitialiseVectorModules();
    InstallTextInputNotifications();
    if (!state.callback_exception.IsEmpty()) {
      ShutdownRuntime();
    }
  } else {
    Rml::SetSystemInterface(nullptr);
    Rml::SetRenderInterface(nullptr);
    Rml::SetFileInterface(nullptr);
    ReleaseRenderInterfaceStates();
    ReleaseSystemInterfaceBindings();
    ReleaseFileInterfaceBindings();
    ReleaseFontEngineBindings();
  }
  info.GetReturnValue().Set(state.initialized);
}

NAN_METHOD(Shutdown) {
  ShutdownRuntime();
}

NAN_METHOD(GetVersion) {
  info.GetReturnValue().Set(Nan::New(Rml::GetVersion()).ToLocalChecked());
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlCore) {
  SetRuntimeMethod<Initialise, false, false>(target, "initialise");
  SetRuntimeMethod<Shutdown, false, false>(target, "shutdown");
  sfmljs::SetMethod<GetVersion>(target, "getVersion");
}

}  // namespace sfmlrmlui
