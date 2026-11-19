// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_DEFERRED_TEXT_INPUT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_DEFERRED_TEXT_INPUT_H_

#include <window-event-source.h>

#include <deque>
#include <exception>
#include <functional>
#include <memory>
#include <optional>

#include "native/platform/ime/text-input-session.h"

namespace sfmlrmlui::ime {

// Windows/X11 callbacks copy state here. Only Drain and explicit runtime
// activation/deactivation touch widgets; queued sources die with their events.
class DeferredTextInput final {
 public:
  const std::shared_ptr<TextInputSession>& active_session() const {
    return session_;
  }
  void Activate(std::shared_ptr<TextInputSession> session);
  void Deactivate(bool destroyed);
  void Mark(Rml::String text, CodePointRange selection);
  void SetCompositionCaret(int position, bool wrap_down);
  std::optional<LayoutCaret> MoveCompositionCaret(
      const Rml::String& text,
      int position,
      bool wrap_down,
      LineMovement movement,
      std::optional<float> ideal) const;
  void Commit(Rml::String text);
  void Cancel();
  void Close();
  void Fail(std::exception_ptr error);
  void Drain(const std::function<bool()>& can_continue);
  std::shared_ptr<sfmljs::interop::WindowEventSource> Event(
      const sf::Event& event, bool handled_by_ime);
  bool Consume(
      Rml::Context* context,
      const sf::Event& event,
      const std::shared_ptr<sfmljs::interop::WindowEventSource>& source) const;

 private:
  struct ForwardedInput;
  struct PendingInput {
    std::shared_ptr<TextInputSession> session;
    std::function<void(TextInputSession&)> edit;
    std::optional<sf::Event> event;
    std::shared_ptr<ForwardedInput> source;
    bool handled_by_ime{false};
  };

  void Submit(std::function<void(TextInputSession&)> edit);
  void Apply(PendingInput entry);

  std::shared_ptr<const int> identity_{std::make_shared<const int>(0)};
  std::shared_ptr<TextInputSession> session_;
  std::deque<PendingInput> pending_;
  std::exception_ptr failure_;
  bool draining_{false};
  bool closed_{false};
};

}  // namespace sfmlrmlui::ime

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_DEFERRED_TEXT_INPUT_H_
