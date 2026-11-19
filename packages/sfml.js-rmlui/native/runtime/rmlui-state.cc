// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/runtime/rmlui-state.h"

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Event.h>

#include <algorithm>
#include <utility>

#include "native/animation/rmlui-tween.h"
#include "native/animation/rmlui-value-callbacks.h"
#include "native/data/rmlui-data-factory.h"
#include "native/data/rmlui-data.h"
#include "native/dom/documents/rmlui-document-ownership.h"
#include "native/dom/documents/rmlui-xml.h"
#include "native/dom/elements/rmlui-element-instancers.h"
#include "native/dom/elements/rmlui-element-scroll.h"
#include "native/dom/elements/rmlui-element-style.h"
#include "native/events/rmlui-event-instancers.h"
#include "native/events/rmlui-events.h"
#include "native/events/rmlui-listener-instancers.h"
#include "native/fonts/rmlui-font-effect-callbacks.h"
#include "native/fonts/rmlui-font-engine.h"
#include "native/io/rmlui-file-interface.h"
#include "native/io/rmlui-stream.h"
#include "native/platform/ime/platform-text-input.h"
#include "native/platform/rmlui-system-interface.h"
#include "native/platform/rmlui-text-input.h"
#include "native/platform/system-interface-sfml.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/rendering/render-interface-sfml.h"
#include "native/rendering/textures/rmlui-resource-preload.h"
#include "native/rendering/textures/rmlui-resources.h"
#include "native/runtime/rmlui-context-instancers.h"
#include "native/runtime/rmlui-debugger.h"
#include "native/runtime/rmlui-parent-observers.h"
#include "native/runtime/rmlui-plugin.h"
#include "native/scripting/lua/rmlui-lua-host.h"
#include "native/scripting/lua/rmlui-lua-instancer.h"
#include "native/scripting/lua/rmlui-lua-variant.h"
#include "native/scripting/rmlui-script-host.h"
#include "native/scripting/rmlui-script-object.h"
#include "native/style/effects/rmlui-decorator-callbacks.h"
#include "native/style/effects/rmlui-effect-instancers.h"
#include "native/style/effects/rmlui-effect-values.h"
#include "native/style/effects/rmlui-filter-callbacks.h"
#include "native/style/properties/rmlui-property-dictionary.h"
#include "native/style/properties/rmlui-property-parser.h"
#include "native/style/properties/rmlui-property-specification.h"
#include "native/style/properties/rmlui-property.h"
#include "native/style/properties/rmlui-style-sheet.h"
#include "native/values/rmlui-owned-variant.h"
#include "native/values/rmlui-variant-objects.h"
#include "native/values/rmlui-variant-pointers.h"

namespace sfmlrmlui {
namespace {

bool CheckOwner() {
  auto& state = State();
  auto* owner = state.owner_environment.load();
  // Do not read owner-only fields until the atomic environment check passes.
  if (owner &&
      (owner != node::GetCurrentEnvironment(Nan::GetCurrentContext()) ||
       state.owner_thread != std::this_thread::get_id() ||
       state.owner_isolate != v8::Isolate::GetCurrent())) {
    Nan::ThrowError("RmlUi requires its owning environment and thread");
    return false;
  }
  return true;
}

void CleanupRuntime(void* data) {
  auto& state = State();
  if (state.owner_environment.load() != data) {
    return;
  }
  // Foreign cleanup never waits for the owner. Owner cleanup must finish even
  // if an entry that began before ClaimRuntime is still releasing the lock.
  std::unique_lock lock(state.mutex);
  // Node cleanup hooks do not provide a HandleScope. Releasing private owner
  // edges needs the environment's context, but must never invoke user code.
  v8::HandleScope handles(state.owner_isolate);
  v8::Context::Scope context(
      node::GetMainContext(static_cast<node::Environment*>(data)));
  state.cleaning_up = true;
  ReleaseEventListeners();
  ShutdownRuntime();
  state.callback_exception.Reset();
  state.cleaning_up = false;
}

}  // namespace

RmlState::RmlState() = default;
RmlState::~RmlState() = default;

RmlState& State() {
  static RmlState state;
  return state;
}

RuntimeScope::RuntimeScope(bool require_initialized,
                           bool allow_callback,
                           bool allow_parser_callback,
                           bool allow_instancer_callback,
                           bool allow_effect_callback,
                           bool allow_texture_callback,
                           bool allow_text_input_callback,
                           bool allow_plugin_callback,
                           bool allow_xml_callback)
    : lock_(State().mutex, std::defer_lock) {
  if (!CheckOwner()) {
    return;
  }
  if (State().owner_environment.load() ==
      node::GetCurrentEnvironment(Nan::GetCurrentContext())) {
    // The owner may outlive a foreign entry that passed the precheck before
    // initialization claimed the runtime. Wait for that entry to reject.
    lock_.lock();
  } else {
    lock_.try_lock();
  }
  if (!lock_.owns_lock()) {
    Nan::ThrowError("RmlUi requires its owning environment and thread");
    return;
  }
  auto& state = State();
  if (!CheckOwner()) {
    return;
  }
  if (require_initialized && !RuntimeReady()) {
    return;
  }
  if (state.stream_callback_depth || state.system_callback_depth ||
      (state.xml_callback_depth && !allow_xml_callback) ||
      (state.plugin_callback_depth && !allow_plugin_callback) ||
      (state.text_input_callback_depth && !allow_text_input_callback) ||
      (state.texture_callback_depth && !allow_texture_callback) ||
      (state.callback_depth && !allow_callback) ||
      (state.parser_callback_depth && require_initialized &&
       !allow_parser_callback) ||
      (state.instancer_callback_depth && require_initialized &&
       !allow_instancer_callback) ||
      (state.effect_callback_depth && require_initialized &&
       !allow_effect_callback) ||
      (state.value_callback_depth && require_initialized)) {
    Nan::ThrowError("RmlUi mutation is not allowed during a callback");
    return;
  }
  if (state.cleaning_up) {
    Nan::ThrowError("RmlUi environment is cleaning up");
    return;
  }
  ++state.boundary_depth;
  element_depth_ = state.active_elements.size();
  entered_ = true;
}

RuntimeScope::~RuntimeScope() {
  if (!entered_) {
    return;
  }
  auto& state = State();
  state.active_elements.resize(element_depth_);
  if (state.boundary_depth == 1) {
    DrainElementScrollReleases();
    DrainVariantPointerOwners();
    DrainLuaStates();
    DrainPluginReleases();
    DrainListenerNotifications();
    DrainDataFactoryReleases();
    DrainEventInstancerReleases();
    DrainContextInstancerReleases();
    DrainTextInputDestroyCallbacks();
    DrainElementInstancerReleases();
    DrainDecoratorReleases();
    if (state.elements.size() >= state.element_sweep_threshold) {
      std::erase_if(state.elements,
                    [](const auto& entry) { return entry.second.expired(); });
      state.element_sweep_threshold =
          std::max<size_t>(64, state.elements.size() * 2);
    }
    std::erase_if(state.managed_non_dom,
                  [](const auto& entry) { return !entry.second; });
    std::erase_if(state.render_origins,
                  [](const auto& entry) { return !entry.second.element; });
    if (state.initialized) {
      RefreshElementOwnership();
    }
    if (state.initialized && state.listener_ownership_dirty) {
      RefreshEventListenerOwnership();
    }
    RefreshVariantElementOwnership();
    RefreshLuaVariantCallbackOwnership();
    RefreshTweenOwnership();
    RefreshFilterOwnership();
    RefreshDecoratorOwnership();
    RefreshFontEffectOwnership();
    RefreshElementInstancerOwnership();
    RefreshContextInstancerOwnership();
    RefreshTextInputOwnership();
    RefreshDataOwnership();
    RefreshDataFactoryOwnership();
    RefreshEventInstancerOwnership();
    RefreshTypedListenerOwnership();
    RefreshScriptObjectOwnership();
    state.active_data_variables.clear();
    state.active_element_owners.clear();
    if (!state.callback_exception.IsEmpty()) {
      auto exception = Nan::New(state.callback_exception);
      state.callback_exception.Reset();
      Nan::ThrowError(exception);
    }
  }
  --state.boundary_depth;
}

bool RuntimeReady() {
  if (!CheckOwner()) {
    return false;
  }
  if (!State().initialized) {
    Nan::ThrowError("RmlUi is not initialised");
    return false;
  }
  return true;
}

bool CanInvokeCallback() {
  const auto& state = State();
  if (!state.initialized || !state.boundary_depth || state.cleaning_up ||
      !state.callback_exception.IsEmpty()) {
    return false;
  }
  if (state.batching_render_interface) {
    state.batching_render_interface->FlushGeometry();
  }
  return true;
}

bool CanReplaceElementChildren(Rml::Element* element,
                               bool replace_internal_state) {
  const auto& state = State();
  // Replacing children must not invalidate another native call's receiver,
  // including a recursively entered mutation of the same receiver.
  for (size_t i = 0; i + 1 < state.active_elements.size(); ++i) {
    for (auto* node = state.active_elements[i]; node;
         node = node->GetParentNode()) {
      if (node == element) {
        Nan::ThrowError("RmlUi cannot replace an active native subtree");
        return false;
      }
    }
  }
  // An input type change destroys its internal widget even though the element
  // survives. A widget may still be executing after its change callback
  // returns. Other child replacement must preserve the raw event target itself.
  for (auto* target : state.event_elements) {
    auto* first = replace_internal_state
                      ? target
                      : (target ? target->GetParentNode() : nullptr);
    for (auto* node = first; node; node = node->GetParentNode()) {
      if (node == element) {
        Nan::ThrowError("RmlUi cannot destroy a target during a callback");
        return false;
      }
    }
  }
  return true;
}

bool IsContextRoot(Rml::Element* element) {
  for (const auto& [context, token] : State().contexts) {
    if (context->GetRootElement() == element) {
      return true;
    }
  }
  return false;
}

bool CanInsertElement(Rml::Element* parent,
                      Rml::Element* child,
                      size_t active_depth) {
  if (!CanModifyDocumentParent(parent, child)) {
    return false;
  }
  if (IsContextRoot(child)) {
    Nan::ThrowError("Context roots cannot be inserted as children");
    return false;
  }
  if (child->Contains(parent)) {
    Nan::ThrowError("RmlUi child insertion would create a cycle");
    return false;
  }
  if (!ShareElement(child)->owned || child->GetParentNode()) {
    Nan::ThrowError(
        "Expected a detached owned element; call removeChild first");
    return false;
  }
  return CanTransferBetweenRenderInterfaces(parent, child) &&
         CanTransferElement(child, active_depth) &&
         CanInsertDocumentTree(parent, child);
}

bool CanTransferElement(Rml::Element* element, size_t active_depth) {
  auto& state = State();
  for (size_t i = 0; i < active_depth; ++i) {
    if (element->Contains(state.active_elements[i])) {
      Nan::ThrowError("RmlUi cannot transfer an active native subtree");
      return false;
    }
  }
  bool retain_transfer = false;
  for (size_t i = 0; i < state.event_elements.size(); ++i) {
    auto* target = state.event_elements[i];
    if (element->Contains(target)) {
      const bool parameter_reference =
          std::find(state.transferable_event_references.begin(),
                    state.transferable_event_references.end(),
                    i) != state.transferable_event_references.end();
      if (element == target && parameter_reference) {
        retain_transfer = true;
        continue;
      }
      Nan::ThrowError("RmlUi cannot transfer a target during a callback");
      return false;
    }
  }
  RememberElementRenderInterface(element);
  if (retain_transfer) {
    // Prepare the strong V8 owner before removing native parent ownership.
    // Keeping only ElementState would lose its weak callback-owner edges.
    state.active_element_owners.emplace_back(v8::Isolate::GetCurrent(),
                                             WrapElement(element));
  }
  return true;
}

namespace {

Rml::Context* OwnedContextOf(Rml::Element* element) {
  if (auto* context = element->GetContext();
      context && IsOwnedContext(context)) {
    return context;
  }
  const auto found = State().context_roots.find(element);
  if (found != State().context_roots.end()) {
    if (auto token = found->second.lock();
        token && token->context && IsOwnedContext(token->context)) {
      return token->context;
    }
  }
  return nullptr;
}

}  // namespace

Rml::Element* DetachedOwnerOf(Rml::Element* element) {
  auto* root = element;
  while (root->GetParentNode()) {
    root = root->GetParentNode();
  }
  const auto found = State().elements.find(root);
  if (found != State().elements.end()) {
    if (auto token = found->second.lock(); token && token->owned) {
      return root;
    }
  }
  const auto context = State().context_roots.find(root);
  if (context != State().context_roots.end()) {
    if (auto token = context->second.lock();
        token && token->context && IsOwnedContext(token->context)) {
      return root;
    }
  }
  return nullptr;
}

namespace {

struct OwnershipSnapshot {
  std::shared_ptr<ElementState> token;
  v8::Local<v8::Object> handle;
};

void RefreshCallbackOwnership() {
  RefreshVariantElementOwnership();
  RefreshLuaVariantCallbackOwnership();
  RefreshEventListenerOwnership();
  RefreshDataFactoryOwnership();
  RefreshTweenOwnership();
  RefreshFilterOwnership();
  RefreshElementInstancerOwnership();
  RefreshContextInstancerOwnership();
  RefreshTextInputOwnership();
  RefreshDecoratorOwnership();
  RefreshFontEffectOwnership();
  RefreshScriptObjectOwnership();
}

void ApplyOwnershipEdges(const std::vector<OwnershipSnapshot>& snapshot) {
  const auto key = Nan::New("rml.detached.owner").ToLocalChecked();
  const auto context_key =
      Nan::New("rml.element.context.owner").ToLocalChecked();
  for (const auto& entry : snapshot) {
    auto* pointer = entry.token->element.get();
    if (!pointer) {
      ClearLuaVariantOwner(entry.handle);
    }

    auto* owner = pointer ? DetachedOwnerOf(pointer) : nullptr;
    Nan::SetPrivate(entry.handle,
                    key,
                    owner && owner != pointer
                        ? v8::Local<v8::Value>(WrapElement(owner))
                        : v8::Local<v8::Value>(Nan::Undefined()))
        .FromJust();
    auto* context = pointer ? OwnedContextOf(pointer) : nullptr;
    Nan::SetPrivate(entry.handle,
                    context_key,
                    context ? v8::Local<v8::Value>(WrapContext(context))
                            : v8::Local<v8::Value>(Nan::Undefined()))
        .FromJust();
  }
}

void SnapshotSubtree(Rml::Element* element,
                     std::vector<OwnershipSnapshot>* snapshot) {
  auto& state = State();
  state.data_diagnostics.Record(&DataDiagnostics::element_ownership_visits);
  const auto found = state.elements.find(element);
  if (found != state.elements.end()) {
    if (auto token = found->second.lock();
        token && token->element && !token->handle.IsEmpty()) {
      snapshot->push_back(
          {token, token->handle.Get(v8::Isolate::GetCurrent())});
    }
  }
  for (int i = 0; i < element->GetNumChildren(true); ++i) {
    SnapshotSubtree(element->GetChild(i), snapshot);
  }
}

void ObserveOwnershipVersions() {
  auto& state = State();
  state.element_ownership_topology =
      Rml::Element::GetTopologyVersionForBinding();
  state.element_ownership_revision = state.ownership_revision;
  state.data_diagnostics.Record(&DataDiagnostics::element_ownership_passes);
}

}  // namespace

void RefreshElementSubtreeOwnership(Rml::Element* element) {
  // Every prior arbitrary mutation is flushed before construction begins.
  // Capture versions before V8 allocation, so unrelated GC remains observable.
  ObserveOwnershipVersions();
  RefreshCallbackOwnership();
  std::vector<OwnershipSnapshot> snapshot;
  SnapshotSubtree(element, &snapshot);
  ApplyOwnershipEdges(snapshot);
}

void ReleaseDetachedElement(const std::shared_ptr<ElementState>& token) {
  RefreshElementOwnership();
  std::vector<OwnershipSnapshot> snapshot;
  SnapshotSubtree(token->element.get(), &snapshot);
  token->owned.reset();
  ObserveOwnershipVersions();
  RefreshCallbackOwnership();
  // Surviving child aliases are invalid, so remove their former owner edges.
  ApplyOwnershipEdges(snapshot);
}

void RefreshElementOwnership() {
  auto& state = State();
  const auto topology = Rml::Element::GetTopologyVersionForBinding();
  if (state.cleaning_up ||
      (state.element_ownership_topology == topology &&
       state.element_ownership_revision == state.ownership_revision)) {
    return;
  }
  // Save the observed versions before allocating. GC or nested release may
  // advance them during this pass and must remain visible to the next pass.
  state.element_ownership_topology = topology;
  state.element_ownership_revision = state.ownership_revision;
  state.data_diagnostics.Record(&DataDiagnostics::element_ownership_passes);
  // Promote attached callbacks before removing their old detached GC roots.
  RefreshCallbackOwnership();
  std::vector<OwnershipSnapshot> snapshot;
  snapshot.reserve(state.elements.size());
  for (const auto& [pointer, weak] : state.elements) {
    state.data_diagnostics.Record(&DataDiagnostics::element_ownership_visits);
    if (auto token = weak.lock();
        token && token->element && !token->handle.IsEmpty()) {
      snapshot.push_back({token, token->handle.Get(v8::Isolate::GetCurrent())});
    }
  }
  // WrapElement may create an owner wrapper and rehash the element registry.
  // Iterate the retained snapshot, never that registry across V8 allocation.
  ApplyOwnershipEdges(snapshot);
}

void RefreshElementCallbackEdges(
    const char* key,
    const std::unordered_map<Rml::Element*, v8::Local<v8::Array>>& edges,
    ElementCallbackRoots* previous) {
  if (edges.empty() && previous->empty()) {
    return;
  }
  struct RootSnapshot {
    std::shared_ptr<ElementState> token;
    v8::Local<v8::Object> handle;
    v8::Local<v8::Value> value;
  };
  std::vector<RootSnapshot> snapshot;
  ElementCallbackRoots next;
  auto* isolate = v8::Isolate::GetCurrent();
  // Obtain every old local handle before allocating keys or private edges.
  for (const auto& weak : *previous) {
    if (auto token = weak.lock(); token && !token->handle.IsEmpty() &&
                                  !edges.contains(token->element.get())) {
      snapshot.push_back({token, token->handle.Get(isolate), Nan::Undefined()});
    }
  }
  for (const auto& [element, value] : edges) {
    const auto found = State().elements.find(element);
    if (found == State().elements.end()) {
      continue;
    }
    if (auto token = found->second.lock();
        token && token->element && !token->handle.IsEmpty()) {
      snapshot.push_back({token, token->handle.Get(isolate), value});
      next.push_back(token);
    }
  }
  auto name = Nan::New(key).ToLocalChecked();
  for (const auto& root : snapshot) {
    Nan::SetPrivate(root.handle, name, root.value).FromJust();
  }
  *previous = std::move(next);
}

void CaptureCallbackException(v8::Local<v8::Value> exception) {
  if (State().callback_exception.IsEmpty()) {
    State().callback_exception.Reset(exception);
  }
}

void RegisterRuntimeCleanup() {
  node::AddEnvironmentCleanupHook(
      v8::Isolate::GetCurrent(),
      CleanupRuntime,
      node::GetCurrentEnvironment(Nan::GetCurrentContext()));
}

void ClaimRuntimeSetup() {
  auto& state = State();
  state.owner_isolate = v8::Isolate::GetCurrent();
  state.owner_thread = std::this_thread::get_id();
  state.owner_environment.store(
      node::GetCurrentEnvironment(Nan::GetCurrentContext()));
}

void ClaimRuntime() {
  ClaimRuntimeSetup();
  ++State().generation;
  ++State().font_generation;
}

void InvalidateContext(Rml::Context* context) {
  ReleasePlatformTextInputContext(context);
  ReleaseContextScriptHost(context);
  auto& contexts = State().contexts;
  const auto found = contexts.find(context);
  if (found != contexts.end()) {
    if (auto slot = found->second->variant_pointer.lock()) {
      *slot = nullptr;
      Rml::InvalidateCallbackResourcesForBinding();
    }

    RetireContextVariantOwners(found->second);
    State().context_roots.erase(found->second->root_element);
    InvalidateDataModels(found->second);
    found->second->context = nullptr;
    found->second->dimensions = {0, 0};
    found->second->input_ownership.reset();
    contexts.erase(found);
  }
}

void ReleaseContextDocuments(Rml::Context* context) {
  ReleaseDebuggerForContext(context);

  const auto found = State().contexts.find(context);
  if (found == State().contexts.end()) {
    return;
  }
  // A native destructor may erase other observers or collectable callbacks.
  auto documents = std::move(found->second->owned_documents);
  for (const auto& weak : documents) {
    if (auto token = weak.lock(); token && token->owned) {
      if (auto* document =
              rmlui_dynamic_cast<Rml::ElementDocument*>(token->owned.get())) {
        context->UnloadDocument(document);
      }
      token->owned.reset();
    }
  }
}

void ShutdownRuntime() {
  auto& state = State();
  if (!state.initialized) {
    // Core setters are legal before Initialise. Clear borrowed pointers before
    // destroying binding-owned setup state; Core's Shutdown is not legal here.
    ReleaseXMLBindings();
    Rml::SetTextInputHandler(nullptr);
    ReleaseTextInputBindings();
    Rml::SetSystemInterface(nullptr);
    ReleaseSystemInterfaceBindings();
    Rml::SetFileInterface(nullptr);
    ReleaseFileInterfaceBindings();
    Rml::SetRenderInterface(nullptr);
    ReleaseRenderInterfaceStates();
    ReleaseFontEngineBindings();
    ReleasePluginBindings();
    state.owner_isolate = nullptr;
    state.owner_thread = {};
    state.owner_environment.store(nullptr);
    return;
  }
  ShutdownResourcePreloads();
  ShutdownDebugger();

  // Remove contexts while callbacks may still safely read live unload targets.
  while (Rml::GetNumContexts() > 0) {
    auto* context = Rml::GetContext(0);
    const auto name = context->GetName();
    ReleaseContextDocuments(context);
    Rml::RemoveContext(name);
    InvalidateContext(context);
  }
  ReleaseOwnedContexts();
  // XML parsers borrow roots and registered handlers. Discard their parse
  // stacks before releasing detached elements or the upstream handler table.
  ReleaseXMLBindings();
  ReleaseElementScrollBindings();
  ReleaseDataRegisters();
  ReleaseOwnedEvents();
  DrainContextInstancerReleases();
  ReleaseEventListeners();
  // Clear callback arrays while their native effects are still discoverable.
  // Retained list/tree handles may otherwise outlive the last native owner.
  ReleaseFontEffectCallbacks();
  ReleaseDecoratorElementEdges();
  ReleaseOwnedDataFactoryInstances();
  // All observers and detached owned nodes must die before the upstream pool.
  for (auto& [pointer, weak] : state.elements) {
    if (auto element = weak.lock()) {
      if (!element->handle.IsEmpty()) {
        ClearLuaVariantOwner(element->handle.Get(v8::Isolate::GetCurrent()));
      }

      element->owned.reset();
      element->element.reset();
      element->handle.Reset();
    }
  }
  state.elements.clear();
  state.element_sweep_threshold = 64;
  DrainElementInstancerReleases();
  // Explicit shutdown delivers invalidated widget notices at this safe point.
  // Environment cleanup suppresses callbacks through CanInvokeCallback().
  DrainTextInputDestroyCallbacks();
  state.managed_non_dom.clear();
  state.render_origins.clear();
  ReleaseEffectValues();
  ReleaseKeyFrameResolvers();
  ReleasePropertyDictionaries();
  ReleasePropertyStates();
  ReleaseOwnedVariants();
  ReleasePropertySpecifications();
  ReleaseTweenCallbacks();
  ReleaseVariantElementOwnership();
  ReleaseStyleSheetBindings();
  // Font layers retain manager-specific native CallbackTexture entries.
  // Destroy these before binding-owned managers, after every element is gone.
  Rml::ReleaseFontResources();
  ++state.font_generation;
  ReleaseRenderManagerBindings(false);
  ReleaseStreamBindings();
  // Lua userdata and native listener closures hold ObserverPtrs. Release all
  // of them before Core destroys the observer pool, after native DOM teardown.
  ReleaseScriptHosts();
  ReleaseLuaHosts();
  ReleaseObjectVariants();
  ReleaseNativeScriptVariants();
  ReleaseScriptObjects();
  ReleaseTypedElementInstancers();
  ReleaseListenerInstancers();
  state.plugin_shutdown = true;
  Rml::Shutdown();
  state.plugin_shutdown = false;
  ReleasePluginBindings();
  ReleaseFontEngineBindings();
  ReleaseContextInstancers();
  ReleaseTextInputBindings();
  ReleaseEventInstancers();
  ReleaseDataFactoryInstancers();
  ReleaseLuaElementInstancers();
  ReleaseElementInstancers();
  ReleaseEffectInstancers();
  ReleasePropertyParsers();
  RemoveElementOwnershipNotifications();
  state.font_data.clear();
  state.render_interface.reset();
  ReleaseRenderInterfaceStates();
  ReleaseSystemInterfaceBindings();
  ReleaseFileInterfaceBindings();
  state.initialized = false;
  CancelDataDiagnostics();
  state.owner_isolate = nullptr;
  state.owner_thread = {};
  state.owner_environment.store(nullptr);
}

Rml::Context* ContextOf(v8::Local<v8::Value> value) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* handle = ContextHandle::From(value);
  if (!handle) {
    return nullptr;
  }
  const auto& token = handle->owner();
  if (!token->context || token->generation != State().generation) {
    Nan::ThrowError("RmlUi context is no longer valid");
    return nullptr;
  }
  return token->context;
}

v8::Local<v8::Object> WrapContext(Rml::Context* context) {
  auto& token = State().contexts[context];
  if (!token) {
    token = std::make_shared<ContextState>();
    token->context = context;
    token->root_element = context->GetRootElement();
    State().context_roots[token->root_element] = token;
    token->generation = State().generation;
    token->name = context->GetName();
    token->dimensions = context->GetDimensions();
  }
  if (!token->handle.IsEmpty()) {
    return token->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = ContextHandle::Create(token);
  token->handle.Reset(v8::Isolate::GetCurrent(), handle);
  token->handle.SetWeak();
  return handle;
}

Rml::Element* ElementOf(v8::Local<v8::Value> value) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* handle = ElementHandle::From(value);
  if (!handle) {
    return nullptr;
  }
  const auto& token = handle->owner();
  if (token->generation != State().generation || !token->element) {
    Nan::ThrowError("RmlUi element is no longer valid");
    return nullptr;
  }
  auto* element = token->element.get();
  State().active_elements.push_back(element);
  return element;
}

Rml::ElementDocument* DocumentOf(v8::Local<v8::Value> value) {
  auto* element = ElementOf(value);
  if (!element) {
    return nullptr;
  }
  auto* document = rmlui_dynamic_cast<Rml::ElementDocument*>(element);
  if (!document) {
    Nan::ThrowTypeError("Expected a RmlUi document");
  }
  return document;
}

std::shared_ptr<ElementState> ShareElement(Rml::Element* element) {
  auto& state = State();
  auto& weak = state.elements[element];
  if (auto existing = weak.lock()) {
    if (existing->element) {
      return existing;
    }
    // Allocator address reuse must not strand an old observer across shutdown.
    existing->element.reset();
  }
  auto token = std::make_shared<ElementState>();
  token->element = element->GetObserverPtr();
  token->generation = state.generation;
  weak = token;
  return token;
}

v8::Local<v8::Object> WrapElement(Rml::Element* element) {
  auto token = ShareElement(element);
  if (!token->handle.IsEmpty()) {
    return token->handle.Get(v8::Isolate::GetCurrent());
  }
  auto handle = ElementHandle::Create(token);
  token->handle.Reset(v8::Isolate::GetCurrent(), handle);
  token->handle.SetWeak();
  // Borrowed descendants of independently owned contexts keep the context
  // alive through a visible edge, allowing listener/context cycles to collect.
  if (auto* context = OwnedContextOf(element)) {
    Nan::SetPrivate(handle,
                    Nan::New("rml.element.context.owner").ToLocalChecked(),
                    WrapContext(context))
        .FromJust();
  }
  if (auto* owner = DetachedOwnerOf(element); owner && owner != element) {
    Nan::SetPrivate(handle,
                    Nan::New("rml.detached.owner").ToLocalChecked(),
                    WrapElement(owner))
        .FromJust();
  }
  return handle;
}

v8::Local<v8::Value> WrapNullableElement(Rml::Element* element) {
  return element ? v8::Local<v8::Value>(WrapElement(element))
                 : v8::Local<v8::Value>(Nan::Null());
}

namespace {

// Upstream SetParent(nullptr) preserves raw layout parent pointers. An owned
// detached tree can outlive the old document, so drop outgoing layout links.
// Internal links remain valid because ownership keeps the entire tree alive.
void ResetDetachedOffsets(Rml::Element* root, Rml::Element* element) {
  auto* offset_parent = element->GetOffsetParent();
  if (offset_parent && !root->Contains(offset_parent)) {
    element->SetOffset({}, nullptr);
  }
  for (int i = 0; i < element->GetNumChildren(true); ++i) {
    ResetDetachedOffsets(root, element->GetChild(i));
  }
}

}  // namespace

v8::Local<v8::Object> WrapOwnedElement(Rml::ElementPtr element) {
  ResetDetachedOffsets(element.get(), element.get());
  auto token = ShareElement(element.get());
  token->owned = std::move(element);
  ++State().ownership_revision;
  return WrapElement(token->element.get());
}

v8::Local<v8::Object> WrapDocument(Rml::ElementDocument* document) {
  return WrapElement(document);
}

}  // namespace sfmlrmlui
