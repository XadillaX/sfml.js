// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/values/rmlui-owned-variant.h"

#include <algorithm>
#include <utility>

#include "native/animation/rmlui-animation-values.h"
#include "native/animation/rmlui-value-callbacks.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

void RefreshOwnedVariant(OwnedVariantState* state) {
  state->metadata->type = static_cast<uint32_t>(state->value.GetType());
  if (!state->handle.IsEmpty()) {
    RetainVariantCallbacks(state->handle.Get(v8::Isolate::GetCurrent()),
                           state->value);
  }
}

void InvalidateVariantMutation(const Rml::Variant& before,
                               const Rml::Variant& after) {
  if (Rml::HasCallbackResourcesForBinding(before) ||
      Rml::HasCallbackResourcesForBinding(after)) {
    Rml::InvalidateCallbackResourcesForBinding();
  }
}

NAN_METHOD(CreateOwnedVariant) {
  Rml::Variant value;
  if ((!info[0]->IsUndefined() && !VariantFromJs(info[0], &value)) ||
      !RuntimeReady()) {
    return;
  }
  info.GetReturnValue().Set(WrapOwnedVariant(std::move(value)));
}

template <bool move>
NAN_METHOD(CloneOwnedVariant) {
  auto* source = OwnedVariantOf(info[0]);
  if (!source) {
    return;
  }
  if constexpr (move) {
    Rml::Variant value(std::move(source->value));
    InvalidateVariantMutation(source->value, value);
    RefreshOwnedVariant(source);
    info.GetReturnValue().Set(WrapOwnedVariant(std::move(value)));
  } else {
    info.GetReturnValue().Set(WrapOwnedVariant(source->value));
  }
}

NAN_METHOD(AssignOwnedVariant) {
  // All accessors run before resolving the receiver's generation.
  Rml::Variant value;
  if (!VariantFromJs(info[1], &value)) {
    return;
  }
  auto* state = OwnedVariantOf(info[0]);
  if (!state) {
    return;
  }
  RebindVariantTweens(&value);
  InvalidateVariantMutation(state->value, value);
  state->value = value;
  RefreshOwnedVariant(state);
}

NAN_METHOD(MoveAssignOwnedVariant) {
  auto* source = OwnedVariantOf(info[1]);
  auto* target = OwnedVariantOf(info[0]);
  if (!source || !target || source == target) {
    return;
  }
  InvalidateVariantMutation(target->value, source->value);
  target->value = std::move(source->value);
  RefreshOwnedVariant(source);
  RefreshOwnedVariant(target);
}

NAN_METHOD(ClearOwnedVariant) {
  if (auto* state = OwnedVariantOf(info[0])) {
    InvalidateVariantMutation(state->value, Rml::Variant{});
    state->value.Clear();
    RefreshOwnedVariant(state);
  }
}

NAN_METHOD(OwnedVariantValue) {
  if (auto* state = OwnedVariantOf(info[0])) {
    const Rml::Variant value(state->value);
    v8::Local<v8::Value> output;
    if (VariantToJs(value).ToLocal(&output)) {
      info.GetReturnValue().Set(output);
    }
  }
}

NAN_METHOD(OwnedVariantReference) {
  if (!info[1]->IsUint32()) {
    return Nan::ThrowTypeError("Expected the exact Variant storage type");
  }
  if (auto* state = OwnedVariantOf(info[0])) {
    if (Nan::To<uint32_t>(info[1]).FromJust() != state->value.GetType()) {
      return Nan::ThrowTypeError(
          "Variant reference requires exact storage type");
    }
    // VariantToJs reads GetReference<T> for the exact storage type, and copies
    // native aggregate values into independent JavaScript output snapshots.
    const Rml::Variant value(state->value);
    v8::Local<v8::Value> output;
    if (VariantToJs(value).ToLocal(&output)) {
      info.GetReturnValue().Set(output);
    }
  }
}

template <bool report_success>
NAN_METHOD(GetOwnedVariant) {
  VariantSelector selector;
  if (!VariantSelectorFromJs(info[1], &selector)) {
    return;
  }
  auto* state = OwnedVariantOf(info[0]);
  if (!state) {
    return;
  }
  const Rml::Variant value(state->value);
  bool success = false;
  v8::Local<v8::Value> output;
  if (!ConvertVariantToJs(&value, selector, false, &success).ToLocal(&output)) {
    return;
  }
  if constexpr (report_success) {
    auto result = Nan::New<v8::Object>();
    Nan::DefineOwnProperty(
        result, Nan::New("success").ToLocalChecked(), Nan::New(success))
        .FromJust();
    Nan::DefineOwnProperty(result, Nan::New("value").ToLocalChecked(), output)
        .FromJust();
    info.GetReturnValue().Set(result);
  } else {
    info.GetReturnValue().Set(output);
  }
}

NAN_METHOD(OwnedVariantElement) {
  if (auto* state = OwnedVariantOf(info[0])) {
    v8::Local<v8::Value> element;
    if (ElementVariantToJs(state->value).ToLocal(&element)) {
      info.GetReturnValue().Set(element);
    }
  }
}

template <bool negate>
NAN_METHOD(CompareOwnedVariant) {
  auto* left = OwnedVariantOf(info[0]);
  auto* right = OwnedVariantOf(info[1]);
  if (left && right) {
    info.GetReturnValue().Set(negate ? left->value != right->value
                                     : left->value == right->value);
  }
}

}  // namespace

OwnedVariantState* OwnedVariantOf(v8::Local<v8::Value> handle) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* checked = OwnedVariantHandle::From(handle);
  if (!checked) {
    return nullptr;
  }
  auto* state = checked->owner().get();
  if (state->generation != State().generation) {
    Nan::ThrowError("Variant is no longer valid");
    return nullptr;
  }
  return state;
}

v8::Local<v8::Object> WrapOwnedVariant(Rml::Variant value) {
  auto owner = std::make_shared<OwnedVariantState>();
  RebindVariantTweens(&value);
  owner->value = std::move(value);
  owner->metadata = std::make_shared<VariantMetadata>();
  owner->generation = State().generation;
  auto& variants = State().variants;
  if (variants.size() >= State().variant_sweep_threshold) {
    std::erase_if(variants, [](const auto& weak) { return weak.expired(); });
    State().variant_sweep_threshold = std::max(size_t{64}, variants.size() * 2);
  }
  variants.emplace_back(owner);
  auto handle = OwnedVariantHandle::Create(owner);
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  RefreshOwnedVariant(owner.get());
  auto result = Nan::New<v8::Object>();
  Nan::DefineOwnProperty(result, Nan::New("handle").ToLocalChecked(), handle)
      .FromJust();
  const auto buffer = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                        owner->metadata,
                                        &owner->metadata->type,
                                        sizeof(owner->metadata->type));
  Nan::DefineOwnProperty(result,
                         Nan::New("typeView").ToLocalChecked(),
                         v8::Uint32Array::New(buffer, 0, 1))
      .FromJust();
  return result;
}

void ReleaseOwnedVariants() {
  for (const auto& weak : State().variants) {
    if (auto state = weak.lock()) {
      state->value.Clear();
      RefreshOwnedVariant(state.get());
      state->generation = 0;
    }
  }
  State().variants.clear();
  State().variant_sweep_threshold = 64;
}

NAN_MODULE_INIT(InitializeRmlOwnedVariant) {
  SetInstancerValueMethod<CreateOwnedVariant, true>(target, "createVariant");
  SetInstancerValueMethod<CloneOwnedVariant<false>, true>(target,
                                                          "cloneVariant");
  SetInstancerValueMethod<CloneOwnedVariant<true>, true>(target, "moveVariant");
  SetInstancerValueMethod<AssignOwnedVariant, true>(target, "assignVariant");
  SetInstancerValueMethod<MoveAssignOwnedVariant, true>(target,
                                                        "moveAssignVariant");
  SetInstancerValueMethod<ClearOwnedVariant, true>(target, "clearVariant");
  SetInstancerValueMethod<OwnedVariantValue, true>(target, "variantValue");
  SetInstancerValueMethod<OwnedVariantReference, true>(target,
                                                       "variantReference");
  SetInstancerValueMethod<GetOwnedVariant<false>, true>(target, "variantGet");
  SetInstancerValueMethod<GetOwnedVariant<true>, true>(target,
                                                       "variantGetInto");
  SetInstancerValueMethod<OwnedVariantElement, true>(target, "variantElement");
  SetInstancerValueMethod<CompareOwnedVariant<false>, true>(target,
                                                            "variantEquals");
  SetInstancerValueMethod<CompareOwnedVariant<true>, true>(target,
                                                           "variantNotEquals");
}

}  // namespace sfmlrmlui
