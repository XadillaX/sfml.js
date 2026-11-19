// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_CALLBACK_OWNERS_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_CALLBACK_OWNERS_H_

#include <RmlUi/Core/PropertyDictionary.h>
#include <RmlUi/Core/PropertySpecification.h>
#include <nan.h>

#include <cstdint>
#include <memory>
#include <unordered_map>
#include <vector>

namespace sfmlrmlui {

struct CallbackRootArray;

// Stable runtime queries must not copy dictionaries or walk the DOM.
// The native version changes at actual resource/style/default mutations.
class CallbackResourceGate {
 public:
  bool Changed();
  void Reset();

 private:
  uint64_t resources_{0};
  uint64_t topology_{0};
  uint64_t ownership_{0};
};

// A native slot never owns its JS array or the detached element wrapper.
struct CallbackRootSlot {
  std::shared_ptr<CallbackRootArray> root;
  uint32_t index{0};
};

// Update only the affected private-array slot at a safe runtime boundary.
// Native detach hooks queue removals; they must not allocate V8 objects.
class CallbackRootSlots {
 public:
  explicit CallbackRootSlots(const char* key) : key_(key) {}
  CallbackRootSlot Add(Rml::Element* element, v8::Local<v8::Value> callback);
  bool HasOwner(const CallbackRootSlot& slot, Rml::Element* element) const;
  void Remove(CallbackRootSlot* slot);
  void Clear();

 private:
  const char* key_;
  std::unordered_map<Rml::Element*, std::shared_ptr<CallbackRootArray>> roots_;
};

// Resolve every weak handle and copy native data before allocating in V8.
// Empty handles represent native roots; other owners receive private JS edges.
struct CallbackOwnerSnapshot {
  v8::Local<v8::Object> handle;
  Rml::Vector<Rml::PropertyDictionary> dictionaries;
  std::vector<Rml::Variant> values;
};

using CallbackOwnerSnapshots = std::vector<CallbackOwnerSnapshot>;

void AppendPropertyDefaults(const Rml::PropertySpecification& specification,
                            CallbackOwnerSnapshot* snapshot);
void AppendStyleSheetCallbackOwners(CallbackOwnerSnapshots* snapshots);
void AppendInstancerCallbackOwners(CallbackOwnerSnapshots* snapshots);
void AppendEffectValueCallbackOwners(CallbackOwnerSnapshots* snapshots);
CallbackOwnerSnapshots SnapshotCallbackOwners();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_CALLBACK_OWNERS_H_
