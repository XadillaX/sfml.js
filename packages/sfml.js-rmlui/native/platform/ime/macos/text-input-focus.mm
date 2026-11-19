// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <algorithm>
#include <utility>

#import "native/platform/ime/macos/text-input-client.h"

@implementation SFMLRmlTextInputClient (Focus)  // NOLINT

- (void)activate:
    (std::shared_ptr<sfmlrmlui::ime::TextInputSession>)next_session {
  if (closed || !surface.window) {
    return;
  }
  sfmlrmlui::ime::CocoaTextSnapshot snapshot(*next_session);
  const auto previous_session = session;
  std::unique_ptr<NSString, sfmlrmlui::ime::CocoaTextRelease> previous_text(
      [text retain]);
  const NSRange previous_selection = selection;
  const NSRange previous_marked = marked;
  const BOOL previous_accepting = accepting;
  NSResponder* previous_surface_responder = surface.nextResponder;
  NSResponder* previous_next_responder = self.nextResponder;
  const bool switching = previous_session && previous_session != next_session;
  bool activated = false;

  @try {
    if (switching) {
      // Cocoa may synchronously unmark while switching. Keep those callbacks
      // from committing the old widget, and retain pending keys until success.
      accepting = NO;
      [input_context discardMarkedText];
      [input_context deactivate];
    }
    session = std::move(next_session);
    [self applySnapshot:std::move(snapshot)];
    accepting = YES;
    if (surface.nextResponder != self) {
      self.nextResponder = surface.nextResponder;
      surface.nextResponder = self;
    }
    if (surface.window.isKeyWindow) {
      [input_context activate];
    }
    if (switching) {
      previous_session->Cancel();
      if (draining) {
        std::erase_if(pending,
                      [](const auto& entry) { return !entry.key_event; });
      } else {
        pending.clear();
      }
    }
    activated = true;
  } @finally {
    // Covers both Objective-C exceptions and C++ allocation failures. The
    // platform registry still owns this old session until Activate returns.
    if (!activated) {
      session = previous_session;
      [text release];
      text = previous_text.release();
      selection = previous_selection;
      marked = previous_marked;
      accepting = previous_accepting;
      surface.nextResponder = previous_surface_responder;
      self.nextResponder = previous_next_responder;
    }
  }
}

- (void)deactivate:(BOOL)destroyed {
  const BOOL previous_accepting = accepting;
  bool deactivated = false;
  accepting = NO;
  @try {
    // Discard callbacks cannot turn cancellation into a commit. Stage Cocoa
    // operations before touching the widget or retiring its pending events.
    [input_context discardMarkedText];
    [input_context deactivate];
    if (session) {
      if (destroyed) {
        session->Invalidate();
      } else {
        session->Cancel();
      }
    }
    deactivated = true;
  } @finally {
    if (!deactivated) {
      accepting = previous_accepting;
    }
  }
  if (draining) {
    std::erase_if(pending, [](const auto& entry) { return !entry.key_event; });
  } else {
    pending.clear();
  }
  session.reset();
  marked = NSMakeRange(NSNotFound, 0);
  if (surface.nextResponder == self) {
    surface.nextResponder = self.nextResponder;
  }
  self.nextResponder = nil;
}

@end
