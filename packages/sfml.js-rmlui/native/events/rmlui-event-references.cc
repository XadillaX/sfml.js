// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Dictionary.h>
#include <RmlUi/Core/Event.h>
#include <RmlUi/Core/Variant.h>

#include "native/events/rmlui-events.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

Rml::Element* DragParameter(const Rml::Event& event) {
  const auto* value = Rml::GetIf(event.GetParameters(), "drag_element");
  if (!value) {
    return nullptr;
  }
  if (IsNativeDragElementParameter(event, "drag_element", *value)) {
    return static_cast<Rml::Element*>(value->Get<void*>());
  }
  return GuardedElementVariantPointer(*value);
}

}  // namespace

CallbackScope::CallbackScope(const Rml::Event& event)
    : event_depth_(State().event_elements.size()),
      transfer_depth_(State().transferable_event_references.size()) {
  auto& state = State();
  auto* dragged = DragParameter(event);
  const bool transferable = dragged && event.GetId() == Rml::EventId::Dragdrop;

  // Allocate before publishing any references, so construction failure leaves
  // the outer callback's reference stack and mutation permissions unchanged.
  state.event_elements.reserve(event_depth_ + (dragged ? 3 : 2));
  state.transferable_event_references.reserve(transfer_depth_ +
                                              (transferable ? 1 : 0));
  state.event_elements.push_back(event.GetTargetElement());
  state.event_elements.push_back(event.GetCurrentElement());
  if (dragged) {
    if (transferable) {
      state.transferable_event_references.push_back(
          state.event_elements.size());
    }
    state.event_elements.push_back(dragged);
  }
  ++state.callback_depth;
}

CallbackScope::~CallbackScope() {
  auto& state = State();
  state.event_elements.resize(event_depth_);
  state.transferable_event_references.resize(transfer_depth_);
  --state.callback_depth;
}

}  // namespace sfmlrmlui
