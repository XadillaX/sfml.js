// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/animation/rmlui-value-callbacks.h"

#include <RmlUi/Core/PropertyDefinition.h>
#include <RmlUi/Core/PropertyDictionary.h>
#include <RmlUi/Core/StyleSheetTypes.h>

#include <unordered_set>
#include <utility>
#include <vector>

#include "native/animation/rmlui-animation-values.h"
#include "native/fonts/rmlui-font-effect-callbacks.h"
#include "native/fonts/rmlui-font-effect.h"
#include "native/runtime/rmlui-callback-owners.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant-objects.h"
#include "native/values/rmlui-variant-pointers.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

struct VariantElementOwners {
  CallbackResourceGate gate;
  // Only actual runtime-owned DOM/default values root their targets.
  // Detached and copied owners receive private edges and remain collectible.
  v8::Global<v8::Array> native_roots;
  bool active{false};
};

VariantElementOwners& ElementOwners() {
  static VariantElementOwners owners;
  return owners;
}

template <typename List>
void AppendDeclarations(const Rml::SharedPtr<const List>& list,
                        std::unordered_set<const void*>* visited,
                        std::vector<Rml::Variant>* pending) {
  if (!list || !visited->insert(list.get()).second) {
    return;
  }
  const auto append = [pending, visited](const auto& properties) {
    for (const auto& [id, property] : properties) {
      pending->push_back(property.value);
      if (property.definition && visited->insert(property.definition).second) {
        pending->push_back(property.definition->GetDefaultValue()->value);
      }
    }
  };
  for (const auto& declaration : list->list) {
    append(declaration.properties.GetProperties());
    append(declaration.properties.GetCustomProperties());
    append(declaration.properties.GetVarShorthands());
  }
}

void Append(v8::Local<v8::Array> array, v8::Local<v8::Object> value) {
  array->CreateDataProperty(Nan::GetCurrentContext(), array->Length(), value)
      .FromJust();
}

}  // namespace

void VisitCallbackValues(
    const Rml::Variant& value,
    const std::function<void(const Rml::Variant&)>& visitor) {
  std::vector<Rml::Variant> pending{value};
  std::unordered_set<const void*> visited;
  while (!pending.empty()) {
    auto current = std::move(pending.back());
    pending.pop_back();
    visitor(current);
    if (current.GetType() == Rml::Variant::DECORATORSPTR) {
      AppendDeclarations(current.Get<Rml::DecoratorsPtr>(), &visited, &pending);
    } else if (current.GetType() == Rml::Variant::FILTERSPTR) {
      AppendDeclarations(current.Get<Rml::FiltersPtr>(), &visited, &pending);
    }
  }
}

void RetainVariantCallbacks(v8::Local<v8::Object> owner,
                            const Rml::Variant& value) {
  auto handles = Nan::New<v8::Array>();
  v8::Local<v8::Array> elements;
  std::unordered_set<const Rml::FontEffect*> effects;

  VisitCallbackValues(value, [&](const Rml::Variant& current) {
    if (current.HasGuardedScriptInterfaceForBinding() ||
        current.HasGuardedOpaquePointerForBinding()) {
      v8::Local<v8::Object> target;
      const auto resolved = current.HasGuardedOpaquePointerForBinding()
                                ? ObjectVariantOwner(current)
                                : ScriptVariantOwner(current);
      if (resolved.ToLocal(&target)) {
        if (elements.IsEmpty()) {
          elements = Nan::New<v8::Array>();
        }
        Append(elements, target);
      }
    } else if (current.GetType() == Rml::Variant::FONTEFFECTSPTR) {
      const auto list = current.Get<Rml::FontEffectsPtr>();
      if (!list) {
        return;
      }
      for (const auto& effect : list->list) {
        const auto* implementation = FontEffectImplementation(effect.get());
        if (IsCustomFontEffect(implementation) &&
            effects.insert(implementation).second) {
          auto handle = Nan::New<v8::Object>();
          BindFontEffectCallbacks(handle, implementation);
          Append(handles, handle);
        }
      }
    } else if (current.GetType() == Rml::Variant::ANIMATIONLIST ||
               current.GetType() == Rml::Variant::TRANSITIONLIST) {
      auto handle = Nan::New<v8::Object>();
      RetainVariantTweens(handle, current);
      Append(handles, handle);
    }
  });

  Nan::SetPrivate(
      owner, Nan::New("rml.value.callbacks").ToLocalChecked(), handles)
      .FromJust();

  const auto key = Nan::New("rml.owner.element.values").ToLocalChecked();
  if (elements.IsEmpty()) {
    Nan::DeletePrivate(owner, key).FromJust();
  } else {
    Nan::SetPrivate(owner, key, elements).FromJust();
  }
}

void RefreshVariantElementOwnership() {
  auto& owners = ElementOwners();
  const bool active = HasElementVariantLifetimes() ||
                      HasNonElementVariantLifetimes() ||
                      HasObjectVariantLifetimes();
  if (State().cleaning_up || !State().initialized ||
      (!active && !owners.active) || !owners.gate.Changed()) {
    return;
  }

  owners.active = active;
  // Resolve all native weak owners before allocating any V8 arrays.
  const auto snapshots = SnapshotCallbackOwners();
  v8::Local<v8::Array> roots;
  const auto key = Nan::New("rml.owner.element.values").ToLocalChecked();

  for (const auto& snapshot : snapshots) {
    v8::Local<v8::Array> handles;
    std::unordered_set<const void*> visited;

    for (const auto& value : snapshot.values) {
      VisitCallbackValues(value, [&](const Rml::Variant& current) {
        const bool opaque = current.HasGuardedOpaquePointerForBinding();
        if (!opaque && !current.HasGuardedScriptInterfaceForBinding()) {
          return;
        }

        const void* slot;
        bool live;
        if (opaque) {
          const auto& pointer = current.GetReference<void*>();
          slot = &pointer;
          live = pointer != nullptr;
        } else {
          const auto& pointer = current.GetReference<Rml::ScriptInterface*>();
          slot = &pointer;
          live = pointer != nullptr;
        }

        v8::Local<v8::Object> target;
        if (!live || !visited.insert(slot).second) {
          return;
        }

        const auto resolved =
            opaque ? ObjectVariantOwner(current) : ScriptVariantOwner(current);
        if (resolved.ToLocal(&target)) {
          if (handles.IsEmpty()) {
            if (snapshot.handle.IsEmpty()) {
              if (roots.IsEmpty()) {
                roots = Nan::New<v8::Array>();
              }
              handles = roots;
            } else {
              handles = Nan::New<v8::Array>();
            }
          }
          Append(handles, target);
        }
      });
    }

    if (!snapshot.handle.IsEmpty()) {
      if (handles.IsEmpty()) {
        Nan::DeletePrivate(snapshot.handle, key).FromJust();
      } else {
        Nan::SetPrivate(snapshot.handle, key, handles).FromJust();
      }
    }
  }

  if (roots.IsEmpty()) {
    owners.native_roots.Reset();
  } else {
    owners.native_roots.Reset(v8::Isolate::GetCurrent(), roots);
  }
}

void ReleaseVariantElementOwnership() {
  DrainVariantPointerOwners();

  auto& owners = ElementOwners();
  owners.gate.Reset();
  owners.native_roots.Reset();
  owners.active = false;
}

}  // namespace sfmlrmlui
