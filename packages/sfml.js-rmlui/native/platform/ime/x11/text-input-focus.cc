// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <window-input-backend.h>

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <limits>
#include <utility>

#include "native/platform/ime/x11/text-input-state.h"

namespace sfmlrmlui::ime::x11 {
namespace {

int16_t Coordinate(float value) {
  return static_cast<int16_t>(
      std::clamp(std::round(static_cast<double>(value)),
                 static_cast<double>(std::numeric_limits<int16_t>::min()),
                 static_cast<double>(std::numeric_limits<int16_t>::max())));
}

}  // namespace

X11TextInput::X11TextInput(::Window window)
    : state_(std::make_shared<TextInputState>()) {
  state_->window = window;
}

X11TextInput::~X11TextInput() {
  if (state_->attached && state_->window) {
    // Restoration may be rejected by the XIM. The registry then retains this
    // inactive callback owner until its host destroys the XIC and window.
    sfmljs::interop::detail::RegisterWindowInput(
        static_cast<uintptr_t>(state_->window), nullptr);
  }
}

bool X11TextInput::Attach() {
  const bool attached = AttachInput(state_);
  if (!attached) {
    // Surface captured configuration failures at this runtime entry.
    state_->queue.Drain([] { return true; });
  }
  return attached;
}

void X11TextInput::Activate(std::shared_ptr<TextInputSession> session) {
  if (!state_->window) {
    return;
  }
  CancelComposition(state_.get());
  session->EnableLayoutCapture();
  state_->queue.Activate(std::move(session));
  state_->accepting = true;
}

void X11TextInput::Deactivate(bool destroyed) {
  CancelComposition(state_.get());
  state_->accepting = false;
  state_->queue.Deactivate(destroyed);
}

void X11TextInput::SetCaret(Rml::Rectanglef bounds) {
  if (!state_->accepting || !state_->context || !bounds.Valid() ||
      !std::isfinite(bounds.Left()) || !std::isfinite(bounds.Bottom())) {
    return;
  }
  XPoint spot{Coordinate(bounds.Left()), Coordinate(bounds.Bottom())};
  const auto preedit = XVaCreateNestedList(0, XNSpotLocation, &spot, nullptr);
  if (preedit) {
    // Engines supporting callback-style spot updates place their candidate UI
    // here. Style support and physical placement need actual IME validation.
    XSetICValues(state_->context, XNPreeditAttributes, preedit, nullptr);
    XFree(preedit);
  }
}

void X11TextInput::Drain(const std::function<bool()>& can_continue) {
  state_->queue.Drain(can_continue);
}

bool X11TextInput::Consume(
    Rml::Context* context,
    const sf::Event& event,
    const std::shared_ptr<sfmljs::interop::WindowEventSource>& source) {
  return state_->queue.Consume(context, event, source);
}

bool X11TextInput::MatchesWindow(sf::RenderWindow* window) const {
  return state_->window && window &&
         window->getNativeHandle() == state_->window;
}

}  // namespace sfmlrmlui::ime::x11

namespace sfmlrmlui::ime {

std::unique_ptr<NativeTextInput> NativeTextInput::Create(
    sf::RenderWindow* window) {
  if (!window || !window->isOpen()) {
    return {};
  }
  auto adapter = std::make_unique<x11::X11TextInput>(window->getNativeHandle());
  return adapter->Attach() ? std::move(adapter) : nullptr;
}

}  // namespace sfmlrmlui::ime
