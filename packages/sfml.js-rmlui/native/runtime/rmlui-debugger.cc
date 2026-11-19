// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/runtime/rmlui-debugger.h"

#include <RmlUi/Debugger/Debugger.h>
#include <nan.h>

#include <array>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

// The runtime owns contexts. Every binding teardown visits the release hook.
Rml::Context* debugger_host = nullptr;
Rml::Context* debugger_target = nullptr;
std::array<Rml::ObserverPtr<Rml::Element>, 5> debugger_documents;
Rml::ObserverPtr<Rml::Element> debugger_hook;

Rml::ObserverPtr<Rml::Element> ObserveDocument(Rml::Context* context,
                                               const char* id) {
  auto* document = context ? context->GetDocument(id) : nullptr;
  return document ? document->GetObserverPtr()
                  : Rml::ObserverPtr<Rml::Element>();
}

NAN_METHOD(Initialise) {
  auto* context = ContextOf(info[0]);
  if (!context) {
    return;
  }

  const bool initialized = Rml::Debugger::Initialise(context);
  if (initialized) {
    debugger_host = context;
    debugger_target = context;
    debugger_hook = ObserveDocument(context, "rmlui-debug-hook");
    size_t index = 0;
    for (const auto* id : {"rmlui-debug-menu",
                           "rmlui-debug-info",
                           "rmlui-debug-log",
                           "rmlui-debug-log-beacon",
                           "rmlui-debug-data-models"}) {
      debugger_documents[index++] = ObserveDocument(context, id);
    }
  }
  info.GetReturnValue().Set(initialized);
}

NAN_METHOD(Shutdown) {
  ShutdownDebugger();
}

NAN_METHOD(SetContext) {
  auto* context = info[0]->IsNull() ? nullptr : ContextOf(info[0]);
  if (!context && !info[0]->IsNull()) {
    return;
  }

  const bool switched = Rml::Debugger::SetContext(context);
  if (switched) {
    debugger_target = context;
    debugger_hook = ObserveDocument(context, "rmlui-debug-hook");
  }
  info.GetReturnValue().Set(switched);
}

NAN_METHOD(SetVisible) {
  if (!info[0]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected a debugger visibility boolean");
  }

  Rml::Debugger::SetVisible(Nan::To<bool>(info[0]).FromJust());
}

NAN_METHOD(IsVisible) {
  info.GetReturnValue().Set(Rml::Debugger::IsVisible());
}

}  // namespace

void ShutdownDebugger() {
  if (!debugger_host) {
    return;
  }

  debugger_host = nullptr;
  debugger_target = nullptr;
  debugger_documents = {};
  debugger_hook.reset();
  Rml::Debugger::Shutdown();
}

bool CanUnloadDebuggerDocument(Rml::ElementDocument* document) {
  if (debugger_hook.get() == document) {
    Nan::ThrowError("Detach Debugger context before unloading its hook");
    return false;
  }

  for (const auto& element : debugger_documents) {
    if (element.get() == document) {
      Nan::ThrowError("Shut down Debugger before unloading its documents");
      return false;
    }
  }

  return true;
}

void ReleaseDebuggerForContext(Rml::Context* context) {
  if (context == debugger_host) {
    ShutdownDebugger();
  } else if (context == debugger_target) {
    Rml::Debugger::SetContext(nullptr);
    debugger_target = nullptr;
    debugger_hook.reset();
  }
}

NAN_MODULE_INIT(InitializeRmlDebugger) {
  SetRuntimeMethod<Initialise>(target, "debuggerInitialise");
  SetRuntimeMethod<Shutdown>(target, "debuggerShutdown");
  SetRuntimeMethod<SetContext>(target, "debuggerSetContext");
  SetRuntimeMethod<SetVisible>(target, "debuggerSetVisible");
  SetRuntimeMethod<IsVisible, true>(target, "debuggerIsVisible");
}

}  // namespace sfmlrmlui
