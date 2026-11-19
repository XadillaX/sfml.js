// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_X11_TEXT_INPUT_STATE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_X11_TEXT_INPUT_STATE_H_

#include <X11/Xlib.h>
// Xlib macros collide with SFML/RmlUi enums and V8/NAN declarations.
#undef None
#undef Always
#undef True
#undef False
#undef Status

#include <locale.h>

#include <memory>
#include <vector>

#include "native/platform/ime/native-text-input.h"
#include "native/platform/ime/x11/preedit-buffer.h"

namespace sfmlrmlui::ime::x11 {

struct TextInputState {
  struct Delivery {
    const void* identity;
    bool filtered{false};
  };
  ~TextInputState();

  ::Window window{0};
  Display* display{nullptr};
  XIC context{nullptr};
  locale_t locale{nullptr};
  DeferredTextInput queue;
  PreeditBuffer preedit;
  // Installed only while the owning runtime interprets this native delivery.
  void (*flush)(DeferredTextInput*) = nullptr;
  bool (*can_continue)() = nullptr;
  std::vector<Delivery> deliveries;
  XIMCallback start{};
  XIMCallback done{};
  XIMCallback draw{};
  XIMCallback caret{};
  bool accepting{false};
  bool attached{false};
};

XIC CreateInputContext(TextInputState* state, Display* display, XIM method);
void CancelComposition(TextInputState* state);
bool AttachInput(const std::shared_ptr<TextInputState>& state);

class X11TextInput final : public NativeTextInput {
 public:
  explicit X11TextInput(::Window window);
  ~X11TextInput() override;
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

}  // namespace sfmlrmlui::ime::x11

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_X11_TEXT_INPUT_STATE_H_
