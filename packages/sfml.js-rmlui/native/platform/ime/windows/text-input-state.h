// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_WINDOWS_TEXT_INPUT_STATE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_WINDOWS_TEXT_INPUT_STATE_H_

#include <windows.h>
// IMM32 declarations require the Win32 handle and scalar types above.
#include <imm.h>

#include <memory>

#include "native/platform/ime/deferred-text-input.h"
#include "native/platform/ime/native-text-input.h"
#include "native/platform/ime/windows/composition-delivery.h"

namespace sfmlrmlui::ime::windows {

// The pump retains this native state through its callback owner. It never
// stores a widget pointer; only the deferred queue owns editing sessions.
struct TextInputState {
  HWND window{nullptr};
  DeferredTextInput queue;
  CompositionDelivery delivery;
  bool accepting{false};
  bool composing{false};
  bool attached{false};
};

// ImmGetContext borrows a window context. Release it on every exit, including
// UTF16 allocation or deferred-queue failure.
class InputContext final {
 public:
  explicit InputContext(HWND window);
  ~InputContext();
  InputContext(const InputContext&) = delete;
  InputContext& operator=(const InputContext&) = delete;
  HIMC get() const { return context_; }

 private:
  HWND window_;
  HIMC context_;
};

void ReadComposition(TextInputState* state, LPARAM flags);
void CancelComposition(TextInputState* state);
bool AttachInput(const std::shared_ptr<TextInputState>& state);

class Win32TextInput final : public NativeTextInput {
 public:
  explicit Win32TextInput(HWND window);
  ~Win32TextInput() override;
  bool Attach();
  void Activate(std::shared_ptr<TextInputSession> session) override;
  void Deactivate(bool destroyed) override;
  void SetCaret(Rml::Rectanglef bounds) override;
  void Drain(const std::function<bool()>& can_continue) override;
  bool Consume(Rml::Context* context,
               const sf::Event& event,
               const std::shared_ptr<sfmljs::interop::WindowEventSource>&
                   source) override;
  bool MatchesWindow(sf::RenderWindow* window) const override;

 private:
  std::shared_ptr<TextInputState> state_;
};

}  // namespace sfmlrmlui::ime::windows

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_WINDOWS_TEXT_INPUT_STATE_H_
