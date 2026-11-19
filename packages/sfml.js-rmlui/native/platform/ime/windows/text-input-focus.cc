// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <window-input-backend.h>

#include <algorithm>
#include <cmath>
#include <limits>
#include <utility>

#include "native/platform/ime/windows/text-input-state.h"

namespace sfmlrmlui::ime::windows {
namespace {

LONG Coordinate(float value) {
  return static_cast<LONG>(
      std::clamp(std::round(static_cast<double>(value)),
                 static_cast<double>(std::numeric_limits<LONG>::min()),
                 static_cast<double>(std::numeric_limits<LONG>::max())));
}

}  // namespace

Win32TextInput::Win32TextInput(HWND window)
    : state_(std::make_shared<TextInputState>()) {
  state_->window = window;
}

Win32TextInput::~Win32TextInput() {
  // Runtime shutdown deactivates before destruction. If attachment itself
  // failed, do not detach a client that already belongs to this window.
  if (state_->attached && state_->window) {
    sfmljs::interop::detail::RegisterWindowInput(
        reinterpret_cast<uintptr_t>(state_->window), nullptr);
  }
}

bool Win32TextInput::Attach() {
  return AttachInput(state_);
}

void Win32TextInput::Activate(std::shared_ptr<TextInputSession> session) {
  if (!state_->window) {
    return;
  }
  CancelComposition(state_.get());
  state_->queue.Activate(std::move(session));
  state_->accepting = true;
  if (GetFocus() == state_->window) {
    // Activation can happen after the native window already gained focus.
    // Reapply its presentation flags through the actual SFML/native scope.
    SendMessageW(state_->window, WM_IME_SETCONTEXT, TRUE, ISC_SHOWUIALL);
  }
}

void Win32TextInput::Deactivate(bool destroyed) {
  CancelComposition(state_.get());
  state_->accepting = false;
  state_->queue.Deactivate(destroyed);
  if (state_->window && GetFocus() == state_->window) {
    SendMessageW(state_->window, WM_IME_SETCONTEXT, TRUE, ISC_SHOWUIALL);
  }
}

void Win32TextInput::SetCaret(Rml::Rectanglef bounds) {
  if (!state_->accepting || !bounds.Valid() || !std::isfinite(bounds.Left()) ||
      !std::isfinite(bounds.Top()) || !std::isfinite(bounds.Right()) ||
      !std::isfinite(bounds.Bottom())) {
    return;
  }
  InputContext context(state_->window);
  if (!context.get()) {
    return;
  }
  const RECT caret{Coordinate(bounds.Left()),
                   Coordinate(bounds.Top()),
                   Coordinate(bounds.Right()),
                   Coordinate(bounds.Bottom())};
  CANDIDATEFORM candidate{};
  candidate.dwStyle = CFS_EXCLUDE;
  candidate.ptCurrentPos = {caret.left, caret.bottom};
  candidate.rcArea = caret;
  ImmSetCandidateWindow(context.get(), &candidate);
  COMPOSITIONFORM composition{};
  composition.dwStyle = CFS_POINT;
  composition.ptCurrentPos = {caret.left, caret.top};
  ImmSetCompositionWindow(context.get(), &composition);
}

void Win32TextInput::Drain(const std::function<bool()>& can_continue) {
  state_->queue.Drain(can_continue);
}

bool Win32TextInput::Consume(
    Rml::Context* context,
    const sf::Event& event,
    const std::shared_ptr<sfmljs::interop::WindowEventSource>& source) {
  return state_->queue.Consume(context, event, source);
}

bool Win32TextInput::MatchesWindow(sf::RenderWindow* window) const {
  return state_->window && window &&
         window->getNativeHandle() == state_->window;
}

}  // namespace sfmlrmlui::ime::windows

namespace sfmlrmlui::ime {

std::unique_ptr<NativeTextInput> NativeTextInput::Create(
    sf::RenderWindow* window) {
  if (!window || !window->isOpen()) {
    return {};
  }
  auto adapter =
      std::make_unique<windows::Win32TextInput>(window->getNativeHandle());
  return adapter->Attach() ? std::move(adapter) : nullptr;
}

}  // namespace sfmlrmlui::ime
