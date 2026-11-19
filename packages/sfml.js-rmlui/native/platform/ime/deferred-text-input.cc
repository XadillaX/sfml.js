// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/platform/ime/deferred-text-input.h"

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/ObserverPtr.h>

#include <algorithm>
#include <utility>

#include "native/platform/rmlui-platform-sfml.h"
#include <SFML/System/String.hpp>

namespace sfmlrmlui::ime {
namespace {

constexpr uint64_t kDeferredInputDomain = 0x726d6c696d653032;

Rml::String Text(char32_t character) {
  const auto utf8 = sf::String(character).toUtf8();
  return {utf8.begin(), utf8.end()};
}

}  // namespace

struct DeferredTextInput::ForwardedInput {
  std::weak_ptr<const int> owner;
  Rml::Context* context{nullptr};
  Rml::ObserverPtr<Rml::Element> root;
  bool consumed{false};
};

void DeferredTextInput::Activate(std::shared_ptr<TextInputSession> session) {
  if (closed_ || session_ == session) {
    return;
  }
  if (session_) {
    session_->Cancel();
  }
  std::erase_if(pending_, [](const auto& entry) { return !entry.event; });
  session_ = std::move(session);
}

void DeferredTextInput::Deactivate(bool destroyed) {
  if (session_) {
    if (destroyed) {
      session_->Invalidate();
    } else {
      session_->Cancel();
    }
  }
  session_.reset();
  if (draining_) {
    std::erase_if(pending_, [](const auto& entry) { return !entry.event; });
  } else {
    pending_.clear();
  }
}

void DeferredTextInput::Submit(std::function<void(TextInputSession&)> edit) {
  if (!closed_ && session_) {
    pending_.push_back({session_, std::move(edit), {}, {}, false});
  }
}

void DeferredTextInput::Mark(Rml::String text, CodePointRange selection) {
  Submit([text = std::move(text), selection](auto& session) {
    session.Mark(text, selection);
  });
}

void DeferredTextInput::SetCompositionCaret(int position, bool wrap_down) {
  Submit([position, wrap_down](auto& session) {
    session.SetCompositionCaret(position, wrap_down);
  });
}

std::optional<LayoutCaret> DeferredTextInput::MoveCompositionCaret(
    const Rml::String& text,
    int position,
    bool wrap_down,
    LineMovement movement,
    std::optional<float> ideal) const {
  // Access copied fields only. In particular, valid() dereferences an element
  // and must not be called from an OS callback.
  if (!session_ || !session_->layout() || !session_->composition()) {
    return {};
  }
  const auto range = *session_->composition();
  const auto& snapshot = session_->text();
  const int first = Rml::StringUtilities::ConvertCharacterOffsetToByteOffset(
      snapshot, range.start);
  const int last = Rml::StringUtilities::ConvertCharacterOffsetToByteOffset(
      snapshot, range.end);
  if (snapshot.compare(first, last - first, text) != 0) {
    return {};
  }
  auto result = session_->layout()->Move(
      range.start + position, wrap_down, range, movement, ideal);
  if (result) {
    result->position -= range.start;
  }
  return result;
}

void DeferredTextInput::Commit(Rml::String text) {
  Submit([text = std::move(text)](auto& session) { session.Insert(text); });
}

void DeferredTextInput::Cancel() {
  Submit([](auto& session) { session.Cancel(); });
}

void DeferredTextInput::Close() {
  // Called from the OS pump. Cancellation waits for the next runtime entry.
  closed_ = true;
  pending_.clear();
}

void DeferredTextInput::Fail(std::exception_ptr error) {
  if (!failure_) {
    failure_ = std::move(error);
  }
}

std::shared_ptr<sfmljs::interop::WindowEventSource> DeferredTextInput::Event(
    const sf::Event& event, bool handled_by_ime) {
  if (closed_ || !session_ ||
      (!event.is<sf::Event::KeyPressed>() &&
       !event.is<sf::Event::TextEntered>())) {
    return {};
  }
  auto forwarded = std::make_shared<ForwardedInput>();
  forwarded->owner = identity_;
  auto source = std::make_shared<sfmljs::interop::WindowEventSource>(
      sfmljs::interop::WindowEventSource{kDeferredInputDomain, forwarded});
  pending_.push_back(
      {session_, {}, event, std::move(forwarded), handled_by_ime});
  return source;
}

void DeferredTextInput::Apply(PendingInput entry) {
  // Keys may switch the focused context; subsequent native keys follow it.
  // Preedit edits remain bound to the session that captured them.
  if (!session_ || !session_->valid() ||
      (!entry.event && entry.session != session_)) {
    return;
  }
  auto active = session_;
  active->Refresh();
  if (entry.event) {
    auto* context = active->element()->GetContext();
    entry.source->context = context;
    entry.source->root = context->GetRootElement()->GetObserverPtr();
    entry.source->consumed = true;
    if (!entry.handled_by_ime) {
      if (const auto* text = entry.event->getIf<sf::Event::TextEntered>()) {
        if (text->unicode >= 32 || text->unicode == U'\r' ||
            text->unicode == U'\n') {
          active->Insert(Text(text->unicode == U'\r' ? U'\n' : text->unicode));
        }
      } else {
        platform::InputHandler(context, *entry.event);
      }
    }
  } else {
    entry.edit(*active);
  }
  if (session_ == active && active->valid()) {
    active->Refresh();
  }
}

void DeferredTextInput::Drain(const std::function<bool()>& can_continue) {
  if (draining_) {
    return;
  }
  if (failure_) {
    std::rethrow_exception(std::exchange(failure_, {}));
  }
  if (closed_) {
    Deactivate(false);
    return;
  }
  draining_ = true;
  try {
    while (!pending_.empty() && can_continue()) {
      auto entry = std::move(pending_.front());
      pending_.pop_front();
      Apply(std::move(entry));
    }
  } catch (...) {
    draining_ = false;
    throw;
  }
  draining_ = false;
}

bool DeferredTextInput::Consume(
    Rml::Context* context,
    const sf::Event& event,
    const std::shared_ptr<sfmljs::interop::WindowEventSource>& source) const {
  if (!source || source->domain != kDeferredInputDomain) {
    return false;
  }
  const auto forwarded =
      std::static_pointer_cast<ForwardedInput>(source->payload);
  return forwarded && forwarded->owner.lock() == identity_ &&
         forwarded->consumed && forwarded->root &&
         (event.is<sf::Event::KeyPressed>() ||
          (event.is<sf::Event::TextEntered>() &&
           forwarded->context == context));
}

}  // namespace sfmlrmlui::ime
