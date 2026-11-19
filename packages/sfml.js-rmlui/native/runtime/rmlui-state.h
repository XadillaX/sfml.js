// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_STATE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_STATE_H_

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Element.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/FileInterface.h>
#include <RmlUi/Core/ObserverPtr.h>
#include <nan.h>
#include <sfml-js-interop.h>

#include <atomic>
#include <cstddef>
#include <cstdint>
#include <memory>
#include <mutex>  // NOLINT(build/c++11)
#include <string>
#include <thread>  // NOLINT(build/c++11)
#include <unordered_map>
#include <vector>

#include "native/data/rmlui-data-diagnostics.h"
#include "native/runtime/rmlui-exports.h"

namespace sfmlrmlui {

class RenderInterfaceSFML;
class SystemInterfaceSFML;
struct ResourcePreloadState;
struct ContextState;
struct ContextOwnership;
struct ContextInputOwnership;
struct DataModelState;
struct DataRegisterState;
struct ElementState;
struct RenderInterfaceState;
struct PropertyState;
struct OwnedVariantState;
struct PropertyMetadata;
struct PropertyDefinitionState;
struct PropertyDictionaryState;
struct PropertySpecificationState;
struct EffectValueState;
struct FontEffectState;
class EditedFontEffect;

struct ElementRenderOrigin {
  Rml::ObserverPtr<Rml::Element> element;
  Rml::RenderInterface* render_interface{nullptr};
};

// Access only inside RuntimeScope (or the owner environment cleanup hook).
struct RmlState {
  RmlState();
  ~RmlState();
  std::recursive_mutex mutex;
  // The only state read before locking, to reject foreign environments without
  // letting their rejected calls contend with the owner or its cleanup hook.
  std::atomic<node::Environment*> owner_environment{nullptr};
  v8::Isolate* owner_isolate{nullptr};
  std::thread::id owner_thread;
  uint64_t generation{0};
  // Advances on runtime creation and every font-resource invalidation.
  uint64_t font_generation{0};
  unsigned boundary_depth{0};
  unsigned callback_depth{0};
  // Native data events may resize storage synchronously. Any intervening
  // value callback or other host callback removes that permission.
  unsigned data_event_callback_depth{0};
  unsigned data_value_callback_depth{0};
  DataDiagnostics data_diagnostics;
  // Value callbacks run inside animation iteration and may evaluate other
  // pure values, but must not reenter any DOM/runtime operation.
  unsigned value_callback_depth{0};
  // Stream callbacks may copy scratch bytes but cannot enter any native API.
  unsigned stream_callback_depth{0};
  // System utilities may return values, but cannot recursively enter bindings.
  unsigned system_callback_depth{0};
  // Property parsers may operate on copied Property values, but must not
  // reenter parsing, mutate parser vectors, or touch DOM/runtime objects.
  unsigned parser_callback_depth{0};
  // XML callbacks may inspect their own parse frame and delegate a node
  // handler. They cannot replace DOM roots, registries, streams, or parsers.
  unsigned xml_callback_depth{0};
  // Instancing may inspect copied values and create effects, but must not
  // reenter the document/style parser or mutate instancer registrations.
  unsigned instancer_callback_depth{0};
  // Rendering effects may inspect approved values and compile resources.
  // DOM/style mutation must not invalidate the active render traversal.
  unsigned effect_callback_depth{0};
  // CallbackTextureDatabase holds a resource entry across host callbacks.
  // Only the scoped texture submission interface may reenter native code.
  unsigned texture_callback_depth{0};
  // Only checked text-input reads and edits may reenter native focus handlers.
  unsigned text_input_callback_depth{0};
  // Plugin notifications may inspect live arguments and edit their registry,
  // but must not reenter DOM mutation, layout, input, or runtime destruction.
  unsigned plugin_callback_depth{0};
  bool plugin_shutdown{false};
  // Core supplies the manager before registering the newly created context.
  Rml::RenderInterface* instancing_render_interface{nullptr};
  // Borrowed only for the duration of the Native context render scope.
  RenderInterfaceSFML* batching_render_interface{nullptr};
  // Receivers held by active native calls, and raw targets held by Rml::Event.
  std::vector<Rml::Element*> active_elements;
  // Custom Child returns borrowed storage; retain V8 leases until the entire
  // outer native operation has finished, including subsequent host callbacks.
  std::vector<v8::Global<v8::Object>> active_data_variables;
  std::vector<Rml::Element*> event_elements;
  // Only the dragdrop parameter permits synchronous ownership transfer.
  // Each index belongs to one CallbackScope, never to an event receiver.
  std::vector<size_t> transferable_event_references;
  // Transfers retain the wrapper and its visible callback-owner edges until
  // the outer native operation has finished, including dragend dispatch.
  std::vector<v8::Global<v8::Object>> active_element_owners;
  // Opaque RTTI indices survive runtime restarts; guarded by the runtime mutex.
  // Class identifiers refer to static native storage, never to element memory.
  std::vector<Rml::ClassId> class_identifiers;
  bool cleaning_up{false};
  bool listener_ownership_dirty{false};
  bool data_ownership_dirty{false};
  bool data_factory_ownership_dirty{false};
  // Native parent changes and binding ownership transfers are independent.
  uint64_t ownership_revision{1};
  // Wrapper refresh versions are independent of incremental callback leases.
  uint64_t element_ownership_topology{0};
  uint64_t element_ownership_revision{0};
  uint64_t data_factory_ownership_topology{0};
  uint64_t data_factory_ownership_revision{0};
  Nan::Persistent<v8::Value> callback_exception;
  std::unordered_map<Rml::Context*, std::shared_ptr<ContextState>> contexts;
  std::unordered_map<Rml::Element*, std::weak_ptr<ContextState>> context_roots;
  std::vector<std::weak_ptr<DataRegisterState>> data_registers;
  std::unordered_map<Rml::Element*, std::weak_ptr<ElementState>> elements;
  size_t element_sweep_threshold{64};
  // Weak native observers distinguish JS-inserted non-DOM children from
  // widget internals whose raw pointers must remain owned by the widget.
  std::unordered_map<Rml::Element*, Rml::ObserverPtr<Rml::Element>>
      managed_non_dom;
  // Detached/reparented nodes may retain native resources in their original
  // manager. Weak observers retain provenance without rooting JS or the DOM.
  std::unordered_map<Rml::Element*, ElementRenderOrigin> render_origins;
  std::shared_ptr<SystemInterfaceSFML> system_interface;
  std::shared_ptr<RenderInterfaceSFML> render_interface;
  std::unordered_map<Rml::RenderInterface*,
                     std::shared_ptr<RenderInterfaceState>>
      render_interfaces;
  std::shared_ptr<Rml::FileInterface> file_interface;
  // Worker-safe root snapshot; workers never access the RmlUi file interface.
  std::string file_root;
  // Shutdown removes this generation's requests before releasing any owner.
  std::shared_ptr<ResourcePreloadState> resource_preloads;
  // Font engines borrow these immutable snapshots until after Rml::Shutdown.
  std::vector<std::vector<Rml::byte>> font_data;
  // Property copies may retain stylesheet resources. Clear before shutdown;
  // shared numeric metadata storage can then safely outlive the runtime.
  std::vector<std::weak_ptr<PropertyState>> properties;
  std::vector<std::weak_ptr<OwnedVariantState>> variants;
  size_t variant_sweep_threshold{64};
  std::vector<std::weak_ptr<PropertyMetadata>> property_metadata;
  size_t property_sweep_threshold{64};
  std::vector<std::weak_ptr<PropertyDictionaryState>> property_dictionaries;
  size_t dictionary_sweep_threshold{64};
  std::vector<std::weak_ptr<PropertySpecificationState>>
      property_specifications;
  size_t specification_sweep_threshold{64};
  std::vector<std::weak_ptr<EffectValueState>> effect_values;
  size_t effect_sweep_threshold{64};
  std::vector<std::weak_ptr<FontEffectState>> font_effects;
  size_t font_effect_sweep_threshold{64};
  std::unordered_map<const void*, std::weak_ptr<EditedFontEffect>>
      edited_font_effects;
  size_t edited_font_effect_sweep_threshold{64};
  std::unordered_map<const Rml::PropertyDefinition*,
                     std::shared_ptr<PropertyDefinitionState>>
      property_definitions;
  bool initialized{false};
};

SFML_RMLUI_API RmlState& State();

// Serializes native entry without waiting for a foreign worker. Reads and
// listener registration may reenter callbacks. Element mutations additionally
// protect receivers and event targets before replacing any child nodes.
class SFML_RMLUI_API RuntimeScope final {
 public:
  explicit RuntimeScope(bool require_initialized = true,
                        bool allow_callback = false,
                        bool allow_parser_callback = false,
                        bool allow_instancer_callback = false,
                        bool allow_effect_callback = false,
                        bool allow_texture_callback = false,
                        bool allow_text_input_callback = false,
                        bool allow_plugin_callback = false,
                        bool allow_xml_callback = false);
  ~RuntimeScope();
  explicit operator bool() const { return entered_; }

 private:
  std::unique_lock<std::recursive_mutex> lock_;
  size_t element_depth_{0};
  bool entered_{false};
};

// Later event bindings use this same scope and exception channel.
class CallbackScope final {
 public:
  explicit CallbackScope(const Rml::Event& event);
  ~CallbackScope();

 private:
  size_t event_depth_;
  size_t transfer_depth_;
};

bool RuntimeReady();
bool CanInvokeCallback();
bool CanReplaceElementChildren(Rml::Element* element,
                               bool replace_internal_state = false);
bool IsContextRoot(Rml::Element* element);
bool CanTransferElement(Rml::Element* element, size_t active_depth);
bool CanInsertElement(Rml::Element* parent,
                      Rml::Element* child,
                      size_t active_depth);
// Detached descendants anchor their owning root through V8-visible edges.
// This retains native trees without hiding JS callback cycles from the GC.
Rml::Element* DetachedOwnerOf(Rml::Element* element);
void RefreshElementOwnership();
SFML_RMLUI_API void CaptureCallbackException(v8::Local<v8::Value> exception);
void RegisterRuntimeCleanup();
// Called under RuntimeScope before storing setup-time native/V8 state.
// Successful initialization adopts that state by advancing its generation.
void ClaimRuntimeSetup();
void ClaimRuntime();
void ShutdownRuntime();
void ReleaseEventListeners();

template <Nan::FunctionCallback callback,
          bool allow_callback = false,
          bool require_initialized = true,
          bool allow_parser_callback = false,
          bool allow_instancer_callback = false,
          bool allow_effect_callback = false,
          bool allow_texture_callback = false,
          bool allow_plugin_callback = false,
          bool allow_xml_callback = false>
void RuntimeBoundary(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  RuntimeScope scope(require_initialized,
                     allow_callback,
                     allow_parser_callback,
                     allow_instancer_callback,
                     allow_effect_callback,
                     allow_texture_callback,
                     false,
                     allow_plugin_callback,
                     allow_xml_callback);
  if (scope) {
    State().data_diagnostics.Record(&DataDiagnostics::runtime_entries);
    Nan::TryCatch caught;
    try {
      callback(info);
    } catch (...) {
      if (caught.HasCaught()) {
        CaptureCallbackException(caught.Exception());
      }
      // A native constructor may unwind after a host allocator failed.
      // Preserve that first host exception for the scope's safe boundary.
      if (State().callback_exception.IsEmpty()) {
        throw;
      }
    }
    if (caught.HasCaught()) {
      if (State().boundary_depth == 1) {
        // Ownership refresh reads V8 private fields. Preserve direct host
        // errors before those reads, just as native callback errors are saved.
        CaptureCallbackException(caught.Exception());
      } else {
        // Nested calls must still throw to the currently executing JS caller.
        caught.ReThrow();
      }
    }
  }
}

template <Nan::FunctionCallback callback,
          bool allow_callback = false,
          bool require_initialized = true,
          bool allow_parser_callback = false,
          bool allow_instancer_callback = false,
          bool allow_effect_callback = false,
          bool allow_texture_callback = false,
          bool allow_plugin_callback = false,
          bool allow_xml_callback = false>
void SetRuntimeMethod(v8::Local<v8::Object> target, const char* name) {
  sfmljs::SetMethod<RuntimeBoundary<callback,
                                    allow_callback,
                                    require_initialized,
                                    allow_parser_callback,
                                    allow_instancer_callback,
                                    allow_effect_callback,
                                    allow_texture_callback,
                                    allow_plugin_callback,
                                    allow_xml_callback>>(target, name);
}

// Only XML parser controls and native handler delegation use this boundary.
template <Nan::FunctionCallback callback, bool require_initialized = true>
void SetXMLMethod(v8::Local<v8::Object> target, const char* name) {
  SetRuntimeMethod<callback,
                   true,
                   require_initialized,
                   false,
                   false,
                   false,
                   false,
                   false,
                   true>(target, name);
}

// Only explicitly audited reads may run in a Plugin notification.
template <Nan::FunctionCallback callback, bool require_initialized = true>
void SetPluginReadMethod(v8::Local<v8::Object> target, const char* name) {
  SetRuntimeMethod<callback,
                   true,
                   require_initialized,
                   false,
                   false,
                   false,
                   false,
                   true>(target, name);
}

// Copied values are safe during instancing; parsing and registry mutation
// are deliberately excluded. Properties additionally allow parser callbacks.
template <Nan::FunctionCallback callback,
          bool allow_parser_callback = false,
          bool allow_plugin_callback = false,
          bool allow_xml_callback = false>
void SetInstancerValueMethod(v8::Local<v8::Object> target, const char* name) {
  SetRuntimeMethod<callback,
                   true,
                   true,
                   allow_parser_callback,
                   true,
                   true,
                   false,
                   allow_plugin_callback,
                   allow_xml_callback>(target, name);
}

// Operations safe while a native effect is compiling or rendering.
template <Nan::FunctionCallback callback>
void SetEffectMethod(v8::Local<v8::Object> target, const char* name) {
  SetRuntimeMethod<callback, true, true, false, false, true>(target, name);
}

// RmlUi owns contexts. The runtime retains this token even if all JS wrappers
// are collected. Removal zeros mapped dimensions and invalidates all aliases.
struct ContextState {
  Rml::Context* context{nullptr};
  std::weak_ptr<Rml::ScriptInterface*> variant_pointer;
  // Index key only. Never dereference after native destruction.
  Rml::Element* root_element{nullptr};
  Rml::RenderInterface* render_interface{nullptr};
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
  std::string name;
  bool automatic_density{true};
  // Owned mirror of public Context::GetDimensions(); survives destruction.
  Rml::Vector2i dimensions{0, 0};
  // Factory documents and detached trees with nested documents borrow context.
  // Destroy those owned trees before context and render manager can disappear.
  std::vector<std::weak_ptr<ElementState>> owned_documents;
  std::weak_ptr<ContextOwnership> ownership;
  std::shared_ptr<ContextInputOwnership> input_ownership;
  std::shared_ptr<DataRegisterState> data_register;
  std::unordered_map<std::string, std::shared_ptr<DataModelState>> data_models;
};

using ContextHandle = sfmljs::SharedHandle<ContextState>;

// Borrowed nodes observe actual native destruction. For detached nodes, owned
// holds native ownership until a later DOM binding transfers it to a parent.
struct ElementState {
  Rml::ObserverPtr<Rml::Element> element;
  // Aliased lifetime slot, shared only by persistent pointer Variants.
  std::weak_ptr<Rml::ScriptInterface*> variant_pointer;
  Rml::ElementPtr owned;
  // Phantom weak handle: identity is stable while reachable, without rooting
  // the JS wrapper or retaining an otherwise unreferenced detached node.
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

using ElementHandle = sfmljs::SharedHandle<ElementState>;

// Construction/release cannot reparent unrelated live trees. Update only the
// affected subtree and leave global refresh available for arbitrary DOM edits.
void RefreshElementSubtreeOwnership(Rml::Element* element);
void ReleaseDetachedElement(const std::shared_ptr<ElementState>& token);

// Maintain only roots which have had this callback edge. Strong local handles
// protect the previous and current snapshots across V8 allocation/GC.
using ElementCallbackRoots = std::vector<std::weak_ptr<ElementState>>;
void RefreshElementCallbackEdges(
    const char* key,
    const std::unordered_map<Rml::Element*, v8::Local<v8::Array>>& edges,
    ElementCallbackRoots* previous);

// Checked accessors require a RuntimeScope. Failure sets a JS error.
SFML_RMLUI_API Rml::Context* ContextOf(v8::Local<v8::Value> value);
v8::Local<v8::Object> WrapContext(Rml::Context* context);
Rml::Element* ElementOf(v8::Local<v8::Value> value);
Rml::ElementDocument* DocumentOf(v8::Local<v8::Value> value);
std::shared_ptr<ElementState> ShareElement(Rml::Element* element);
v8::Local<v8::Object> WrapElement(Rml::Element* element);
v8::Local<v8::Value> WrapNullableElement(Rml::Element* element);
v8::Local<v8::Object> WrapOwnedElement(Rml::ElementPtr element);
v8::Local<v8::Object> WrapDocument(Rml::ElementDocument* document);
void InvalidateContext(Rml::Context* context);
void ReleaseContextDocuments(Rml::Context* context);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_STATE_H_
