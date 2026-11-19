// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/dom/elements/rmlui-element-scroll.h"

#include <RmlUi/Core/ElementScroll.h>
#include <nan.h>

#include <algorithm>
#include <memory>
#include <vector>

#include "native/runtime/rmlui-parent-observers.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-numeric-value.h"

namespace sfmlrmlui {
namespace {

struct ScrollState;

auto& DestroyedScrolls() {
  static std::vector<std::weak_ptr<ScrollState>> values;
  return values;
}

struct ScrollState final : ElementOwnershipObserver {
  void OnOwnershipChange(bool destroying) override {
    if (destroying) {
      // WidgetScroll removes listeners from its children in its destructor.
      // The existing notice runs before Element destroys any of those nodes.
      value.reset();
      // V8 owner edges must be cleared later, outside the native notice.
      DestroyedScrolls().push_back(self);
    }
  }

  void Release() {
    UnbindElementOwnershipObserver(this);
    value.reset();
    if (!handle.IsEmpty()) {
      Nan::SetPrivate(handle.Get(v8::Isolate::GetCurrent()),
                      Nan::New("rml.scroll.host").ToLocalChecked(),
                      Nan::Undefined())
          .FromJust();
    }
    handle.Reset();
    host.reset();
    generation = 0;
  }

  // Field order ensures widget teardown precedes the last detached host lease.
  std::shared_ptr<ElementState> host;
  std::unique_ptr<Rml::ElementScroll> value;
  v8::Global<v8::Object> handle;
  std::weak_ptr<ScrollState> self;
  uint64_t generation{0};
};

using ScrollHandle = sfmljs::SharedHandle<ScrollState>;

auto& Scrolls() {
  static std::vector<std::weak_ptr<ScrollState>> values;
  return values;
}

auto& PendingReleases() {
  static std::vector<ScrollState*> values;
  return values;
}

size_t sweep_threshold = 64;

void RetireScroll(ScrollState* state) {
  if (state->value || state->host) {
    PendingReleases().push_back(state);
  } else {
    delete state;
  }
}

struct ScrollReceiver {
  Rml::Element* element{nullptr};
  Rml::ElementScroll* scroll{nullptr};
};

ScrollReceiver ScrollOf(v8::Local<v8::Value> input) {
  if (auto* handle = ScrollHandle::TryFrom(input)) {
    const auto& state = handle->owner();
    if (state->generation != State().generation || !state->host ||
        !state->host->element || !state->value) {
      Nan::ThrowError("ElementScroll is no longer valid");
      return {};
    }
    auto* element = state->host->element.get();
    State().active_elements.push_back(element);
    return {element, state->value.get()};
  }
  if (auto* element = ElementOf(input)) {
    return {element, element->GetElementScroll()};
  }
  return {};
}

NAN_METHOD(CreateElementScroll) {
  auto* element = ElementOf(info[0]);
  if (!element) {
    return;
  }
  auto state = std::shared_ptr<ScrollState>(new ScrollState, RetireScroll);
  state->self = state;
  state->host = ShareElement(element);
  state->value = std::make_unique<Rml::ElementScroll>(element);
  state->generation = State().generation;
  BindElementOwnershipObserver(element, state.get());
  auto& scrolls = Scrolls();
  if (scrolls.size() >= sweep_threshold) {
    std::erase_if(scrolls, [](const auto& weak) { return weak.expired(); });
    sweep_threshold = std::max(size_t{64}, scrolls.size() * 2);
  }
  scrolls.emplace_back(state);
  auto handle = ScrollHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), handle);
  state->handle.SetWeak();
  // This visible edge retains detached host callbacks without a native V8 root.
  Nan::SetPrivate(handle, Nan::New("rml.scroll.host").ToLocalChecked(), info[0])
      .FromJust();
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(ReleaseElementScroll) {
  auto* handle = ScrollHandle::TryFrom(info[0]);
  if (!handle) {
    return Nan::ThrowTypeError("Expected an independently owned ElementScroll");
  }
  const auto receiver = ScrollOf(info[0]);
  if (!receiver.scroll || !CanReplaceElementChildren(receiver.element, true)) {
    return;
  }
  handle->owner()->Release();
}

bool ReadOrientation(v8::Local<v8::Value> input,
                     Rml::ElementScroll::Orientation* result) {
  if (input->IsInt32()) {
    const int number = Nan::To<int>(input).FromJust();
    if (number == Rml::ElementScroll::VERTICAL ||
        number == Rml::ElementScroll::HORIZONTAL) {
      *result = static_cast<Rml::ElementScroll::Orientation>(number);
      return true;
    }
  }
  Nan::ThrowRangeError("Invalid scrollbar orientation");
  return false;
}

NAN_METHOD(GetElementScroll) {
  if (auto* element = ElementOf(info[0])) {
    info.GetReturnValue().Set(WrapElement(element));
  }
}

template <auto method>
NAN_METHOD(ScrollOperation) {
  if (const auto receiver = ScrollOf(info[0]); receiver.scroll) {
    (receiver.scroll->*method)();
  }
}

template <auto method>
NAN_METHOD(ScrollOrientationOperation) {
  Rml::ElementScroll::Orientation orientation;
  if (!ReadOrientation(info[1], &orientation)) {
    return;
  }
  if (const auto receiver = ScrollOf(info[0]); receiver.scroll) {
    (receiver.scroll->*method)(orientation);
  }
}

NAN_METHOD(EnableScrollbar) {
  Rml::ElementScroll::Orientation orientation;
  float width;
  if (!ReadOrientation(info[1], &orientation) ||
      !ReadFiniteNumericFloat(info[2], &width)) {
    return;
  }
  if (width < 0) {
    return Nan::ThrowRangeError("Scrollbar element width must be nonnegative");
  }
  const auto receiver = ScrollOf(info[0]);
  if (!receiver.scroll || !CanReplaceElementChildren(receiver.element, true)) {
    return;
  }
  receiver.scroll->EnableScrollbar(orientation, width);
}

NAN_METHOD(GetScrollbar) {
  Rml::ElementScroll::Orientation orientation;
  if (!ReadOrientation(info[1], &orientation)) {
    return;
  }
  if (const auto receiver = ScrollOf(info[0]); receiver.scroll) {
    info.GetReturnValue().Set(
        WrapNullableElement(receiver.scroll->GetScrollbar(orientation)));
  }
}

NAN_METHOD(GetScrollbarSize) {
  Rml::ElementScroll::Orientation orientation;
  if (!ReadOrientation(info[1], &orientation)) {
    return;
  }
  if (const auto receiver = ScrollOf(info[0]); receiver.scroll) {
    info.GetReturnValue().Set(receiver.scroll->GetScrollbarSize(orientation));
  }
}

NAN_METHOD(FormatScrollbars) {
  const auto receiver = ScrollOf(info[0]);
  if (receiver.scroll && CanReplaceElementChildren(receiver.element, true)) {
    receiver.scroll->FormatScrollbars();
  }
}

}  // namespace

void DrainElementScrollReleases() {
  while (!PendingReleases().empty()) {
    auto pending = std::move(PendingReleases());
    PendingReleases().clear();
    for (auto* state : pending) {
      state->Release();
      delete state;
    }
  }
  auto destroyed = std::move(DestroyedScrolls());
  DestroyedScrolls().clear();
  for (const auto& weak : destroyed) {
    if (auto state = weak.lock()) {
      state->Release();
    }
  }
}

void ReleaseElementScrollBindings() {
  for (const auto& weak : Scrolls()) {
    if (auto state = weak.lock()) {
      state->Release();
    }
  }
  Scrolls().clear();
  sweep_threshold = 64;
  DrainElementScrollReleases();
}

NAN_MODULE_INIT(InitializeRmlElementScroll) {
  SetRuntimeMethod<CreateElementScroll>(target, "createElementScroll");
  SetRuntimeMethod<ReleaseElementScroll>(target, "releaseElementScroll");
  SetRuntimeMethod<GetElementScroll, true>(target, "elementGetScroll");
  SetRuntimeMethod<ScrollOperation<&Rml::ElementScroll::Update>>(
      target, "scrollUpdate");
  SetRuntimeMethod<EnableScrollbar>(target, "scrollEnableScrollbar");
  SetRuntimeMethod<
      ScrollOrientationOperation<&Rml::ElementScroll::DisableScrollbar>>(
      target, "scrollDisableScrollbar");
  SetRuntimeMethod<
      ScrollOrientationOperation<&Rml::ElementScroll::UpdateScrollbar>>(
      target, "scrollUpdateScrollbar");
  SetRuntimeMethod<GetScrollbar, true>(target, "scrollGetScrollbar");
  SetRuntimeMethod<GetScrollbarSize, true>(target, "scrollGetScrollbarSize");
  SetRuntimeMethod<FormatScrollbars>(target, "scrollFormatScrollbars");
  SetRuntimeMethod<ScrollOperation<&Rml::ElementScroll::UpdateProperties>>(
      target, "scrollUpdateProperties");
}

}  // namespace sfmlrmlui
