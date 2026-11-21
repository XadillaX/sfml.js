// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/runtime/rmlui-callback-owners.h"

#include <RmlUi/Core/StyleSheetContainer.h>
#include <RmlUi/Core/StyleSheetSpecification.h>

#include <unordered_set>

#include "native/runtime/rmlui-context-instancers.h"
#include "native/runtime/rmlui-state.h"
#include "native/scripting/lua/rmlui-lua-variant.h"
#include "native/style/properties/rmlui-property-dictionary.h"
#include "native/style/properties/rmlui-property-specification.h"
#include "native/style/properties/rmlui-property.h"
#include "native/values/rmlui-owned-variant.h"
#include "vendor/rmlui/Source/Core/ElementStyle.h"

namespace sfmlrmlui {

bool CallbackResourceGate::Changed() {
  const auto resources = Rml::GetCallbackResourceVersionForBinding();
  const auto topology = Rml::Element::GetTopologyVersionForBinding();
  const auto ownership = State().ownership_revision;
  if (resources_ == resources && topology_ == topology &&
      ownership_ == ownership) {
    return false;
  }
  // Store before allocating: a nested finalizer remains dirty.
  resources_ = resources;
  topology_ = topology;
  ownership_ = ownership;
  return true;
}

void CallbackResourceGate::Reset() {
  resources_ = 0;
  topology_ = 0;
  ownership_ = 0;
}

struct CallbackRootArray {
  Rml::Element* element{nullptr};
  std::weak_ptr<ElementState> owner;
  v8::Global<v8::Array> array;
  std::vector<uint32_t> available;
  uint32_t length{0};
  uint32_t used{0};
};

CallbackRootSlot CallbackRootSlots::Add(Rml::Element* element,
                                        v8::Local<v8::Value> callback) {
  auto handle = WrapElement(element);
  auto token = ShareElement(element);
  auto& root = roots_[element];
  if (!root || root->owner.lock() != token || root->array.IsEmpty()) {
    root = std::make_shared<CallbackRootArray>();
    root->element = element;
    root->owner = token;
    auto array = Nan::New<v8::Array>();
    Nan::SetPrivate(handle, Nan::New(key_).ToLocalChecked(), array).FromJust();
    root->array.Reset(v8::Isolate::GetCurrent(), array);
    root->array.SetWeak();
  }
  uint32_t index;
  if (root->available.empty()) {
    index = root->length++;
  } else {
    index = root->available.back();
    root->available.pop_back();
  }
  Nan::Set(root->array.Get(v8::Isolate::GetCurrent()), index, callback)
      .FromJust();
  ++root->used;
  return {root, index};
}

bool CallbackRootSlots::HasOwner(const CallbackRootSlot& slot,
                                 Rml::Element* element) const {
  if (!slot.root || slot.root->element != element ||
      slot.root->array.IsEmpty()) {
    return false;
  }
  const auto owner = slot.root->owner.lock();
  return owner && owner->element.get() == element;
}

void CallbackRootSlots::Remove(CallbackRootSlot* slot) {
  auto root = std::move(slot->root);
  if (!root) {
    return;
  }
  if (!root->array.IsEmpty() && !State().cleaning_up) {
    Nan::Set(root->array.Get(v8::Isolate::GetCurrent()),
             slot->index,
             Nan::Undefined())
        .FromJust();
  }
  root->available.push_back(slot->index);
  if (--root->used != 0) {
    return;
  }
  const auto found = roots_.find(root->element);
  if (found != roots_.end() && found->second == root) {
    if (auto owner = root->owner.lock(); owner && owner->element) {
      if (!owner->handle.IsEmpty() && !State().cleaning_up) {
        Nan::SetPrivate(owner->handle.Get(v8::Isolate::GetCurrent()),
                        Nan::New(key_).ToLocalChecked(),
                        Nan::Undefined())
            .FromJust();
      }
    }
    roots_.erase(found);
  }
  root->array.Reset();
}

void CallbackRootSlots::Clear() {
  std::vector<v8::Local<v8::Object>> handles;
  for (const auto& [element, root] : roots_) {
    if (auto owner = root->owner.lock();
        owner && !owner->handle.IsEmpty() && !State().cleaning_up) {
      handles.push_back(owner->handle.Get(v8::Isolate::GetCurrent()));
    }
    root->array.Reset();
  }
  roots_.clear();
  if (!handles.empty()) {
    const auto key = Nan::New(key_).ToLocalChecked();
    for (const auto handle : handles) {
      Nan::SetPrivate(handle, key, Nan::Undefined()).FromJust();
    }
  }
}

namespace {

void AppendTree(Rml::Element* root, CallbackOwnerSnapshot* snapshot) {
  std::vector<Rml::Element*> pending{root};
  while (!pending.empty()) {
    auto* element = pending.back();
    pending.pop_back();
    State().data_diagnostics.Record(&DataDiagnostics::callback_snapshot_visits);
    element->GetStyle()->AppendCallbackProperties(snapshot->dictionaries);
    for (const auto& [name, value] : element->GetAttributes()) {
      if (Rml::HasCallbackResourcesForBinding(value)) {
        snapshot->values.push_back(value);
      }
    }
    if (element->GetOwnerDocument() == element) {
      if (const auto* sheet =
              element->GetOwnerDocument()->GetStyleSheetContainer()) {
        sheet->AppendCallbackProperties(snapshot->dictionaries);
      }
    }
    for (int i = 0; i < element->GetNumChildren(true); ++i) {
      pending.push_back(element->GetChild(i));
    }
  }
}

void AppendDefinition(const Rml::PropertyDefinition* definition,
                      CallbackOwnerSnapshot* snapshot) {
  if (!definition) {
    return;
  }
  const auto& value = definition->GetDefaultValue()->value;
  if (Rml::HasCallbackResourcesForBinding(value)) {
    snapshot->values.push_back(value);
  }
  const auto found = State().property_definitions.find(definition);
  if (found != State().property_definitions.end()) {
    const auto& state = *found->second;
    if (state.specification) {
      AppendPropertyDefaults(*state.specification, snapshot);
    } else if (state.callback_specification) {
      AppendPropertyDefaults(*state.callback_specification, snapshot);
    }
  }
}

}  // namespace

void AppendPropertyDefaults(const Rml::PropertySpecification& specification,
                            CallbackOwnerSnapshot* snapshot) {
  for (auto id : specification.GetRegisteredProperties()) {
    const auto& value = specification.GetProperty(id)->GetDefaultValue()->value;
    if (Rml::HasCallbackResourcesForBinding(value)) {
      snapshot->values.push_back(value);
    }
  }
}

CallbackOwnerSnapshots SnapshotCallbackOwners() {
  CallbackOwnerSnapshots result;
  auto* isolate = v8::Isolate::GetCurrent();
  AppendStyleSheetCallbackOwners(&result);
  AppendInstancerCallbackOwners(&result);
  AppendEffectValueCallbackOwners(&result);
  for (const auto& weak : State().property_specifications) {
    if (const auto state = weak.lock();
        state && state->value && !state->handle.IsEmpty()) {
      auto& snapshot = result.emplace_back();
      snapshot.handle = state->handle.Get(isolate);
      AppendPropertyDefaults(*state->value, &snapshot);
    }
  }
  for (const auto& [pointer, state] : State().property_definitions) {
    if (state->definition && !state->handle.IsEmpty()) {
      auto& snapshot = result.emplace_back();
      snapshot.handle = state->handle.Get(isolate);
      AppendDefinition(state->definition, &snapshot);
    }
  }
  // Property metadata exposes its definition even after the original
  // specification wrapper dies. Its default values belong to that owner too.
  for (const auto& weak : State().properties) {
    if (const auto state = weak.lock(); state && !state->handle.IsEmpty()) {
      auto& snapshot = result.emplace_back();
      snapshot.handle = state->handle.Get(isolate);
      AppendDefinition(state->value.definition, &snapshot);
      if (Rml::HasCallbackResourcesForBinding(state->value.value)) {
        snapshot.values.push_back(state->value.value);
      }
    }
  }
  for (const auto& weak : State().variants) {
    if (const auto state = weak.lock(); state && !state->handle.IsEmpty()) {
      auto& snapshot = result.emplace_back();
      snapshot.handle = state->handle.Get(isolate);
      if (Rml::HasCallbackResourcesForBinding(state->value)) {
        snapshot.values.push_back(state->value);
      }
    }
  }
  for (const auto& weak : State().property_dictionaries) {
    if (const auto state = weak.lock(); state && !state->handle.IsEmpty()) {
      auto& snapshot = result.emplace_back();
      snapshot.handle = state->handle.Get(isolate);
      snapshot.dictionaries.push_back(state->value);
    }
  }
  for (const auto& [pointer, weak] : State().elements) {
    if (const auto token = weak.lock();
        token && token->element && !token->handle.IsEmpty()) {
      auto& snapshot = result.emplace_back();
      snapshot.handle = token->handle.Get(isolate);
      if (token->owned) {
        AppendTree(pointer, &snapshot);
      }
    }
  }
  Rml::Vector<Rml::Element*> native_trees;

  for (const auto& [context, token] : State().contexts) {
    Rml::Vector<Rml::Element*> trees;
    context->AppendOwnedElementRoots(trees);

    if (IsOwnedContext(context)) {
      // Independent contexts are owned through their collectible JS handle,
      // including document attributes that refer back to their own context.
      if (token->handle.IsEmpty()) {
        continue;
      }

      auto& snapshot = result.emplace_back();
      snapshot.handle = token->handle.Get(isolate);
      for (auto* root : trees) {
        AppendTree(root, &snapshot);
      }
    } else {
      native_trees.insert(native_trees.end(), trees.begin(), trees.end());
    }
  }

  auto& roots = result.emplace_back();
  for (auto* root : native_trees) {
    AppendTree(root, &roots);
  }

  AppendPropertyDefaults(
      Rml::StyleSheetSpecification::GetPropertySpecification(), &roots);
  AppendLuaVariantCallbackOwners(&result);

  // Default metadata can carry callbacks through a copied dictionary.
  for (auto& snapshot : result) {
    std::unordered_set<const Rml::PropertyDefinition*> visited;
    const auto append = [&](const auto& properties) {
      for (const auto& [id, property] : properties) {
        if (visited.insert(property.definition).second) {
          AppendDefinition(property.definition, &snapshot);
        }
        if (Rml::HasCallbackResourcesForBinding(property.value)) {
          snapshot.values.push_back(property.value);
        }
      }
    };
    for (const auto& dictionary : snapshot.dictionaries) {
      append(dictionary.GetProperties());
      append(dictionary.GetCustomProperties());
      append(dictionary.GetVarShorthands());
    }
  }
  return result;
}

}  // namespace sfmlrmlui
