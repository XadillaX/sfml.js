// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Context.h>

#include <string_view>

#import "native/platform/ime/macos/text-input-client.h"

namespace {

struct Command {
  std::string_view selector;
  Rml::Input::KeyIdentifier key;
  int modifiers{0};
};

constexpr Command kCommands[] = {
    {"deleteBackward:", Rml::Input::KI_BACK},
    {"deleteForward:", Rml::Input::KI_DELETE},
    {"deleteWordBackward:", Rml::Input::KI_BACK, Rml::Input::KM_CTRL},
    {"deleteWordForward:", Rml::Input::KI_DELETE, Rml::Input::KM_CTRL},
    {"moveLeft:", Rml::Input::KI_LEFT},
    {"moveRight:", Rml::Input::KI_RIGHT},
    {"moveUp:", Rml::Input::KI_UP},
    {"moveDown:", Rml::Input::KI_DOWN},
    {"moveWordLeft:", Rml::Input::KI_LEFT, Rml::Input::KM_CTRL},
    {"moveWordRight:", Rml::Input::KI_RIGHT, Rml::Input::KM_CTRL},
    {"moveToBeginningOfLine:", Rml::Input::KI_HOME},
    {"moveToEndOfLine:", Rml::Input::KI_END},
    {"moveToBeginningOfDocument:", Rml::Input::KI_HOME, Rml::Input::KM_CTRL},
    {"moveToEndOfDocument:", Rml::Input::KI_END, Rml::Input::KM_CTRL},
    {"moveLeftAndModifySelection:", Rml::Input::KI_LEFT, Rml::Input::KM_SHIFT},
    {"moveRightAndModifySelection:",
     Rml::Input::KI_RIGHT,
     Rml::Input::KM_SHIFT},
    {"moveUpAndModifySelection:", Rml::Input::KI_UP, Rml::Input::KM_SHIFT},
    {"moveDownAndModifySelection:", Rml::Input::KI_DOWN, Rml::Input::KM_SHIFT},
    {"moveWordLeftAndModifySelection:",
     Rml::Input::KI_LEFT,
     Rml::Input::KM_CTRL | Rml::Input::KM_SHIFT},
    {"moveWordRightAndModifySelection:",
     Rml::Input::KI_RIGHT,
     Rml::Input::KM_CTRL | Rml::Input::KM_SHIFT},
    {"moveToBeginningOfLineAndModifySelection:",
     Rml::Input::KI_HOME,
     Rml::Input::KM_SHIFT},
    {"moveToEndOfLineAndModifySelection:",
     Rml::Input::KI_END,
     Rml::Input::KM_SHIFT},
    {"moveToBeginningOfDocumentAndModifySelection:",
     Rml::Input::KI_HOME,
     Rml::Input::KM_CTRL | Rml::Input::KM_SHIFT},
    {"moveToEndOfDocumentAndModifySelection:",
     Rml::Input::KI_END,
     Rml::Input::KM_CTRL | Rml::Input::KM_SHIFT},
    {"pageUp:", Rml::Input::KI_PRIOR},
    {"pageDown:", Rml::Input::KI_NEXT},
    {"insertNewline:", Rml::Input::KI_RETURN},
    {"insertLineBreak:", Rml::Input::KI_RETURN},
    {"insertTab:", Rml::Input::KI_TAB},
    {"insertBacktab:", Rml::Input::KI_TAB, Rml::Input::KM_SHIFT},
    {"selectAll:", Rml::Input::KI_A, Rml::Input::KM_CTRL},
    {"copy:", Rml::Input::KI_C, Rml::Input::KM_CTRL},
    {"cut:", Rml::Input::KI_X, Rml::Input::KM_CTRL},
    {"paste:", Rml::Input::KI_V, Rml::Input::KM_CTRL},
};

}  // namespace

@implementation SFMLRmlTextInputClient (Commands)  // NOLINT

- (void)doCommandBySelector:(SEL)selector {
  if (!accepting || !session) {
    return;
  }
  auto active_session = session;
  const std::string_view name(sel_getName(selector));
  if (name == "cancelOperation:") {
    [self submit:[active_session] { active_session->Cancel(); }];
    return;
  }
  for (const auto& command : kCommands) {
    if (name == command.selector) {
      const int command_modifiers =
          (modifiers & ~(Rml::Input::KM_ALT | Rml::Input::KM_META)) |
          command.modifiers;
      [self submit:[active_session, command, command_modifiers] {
        if (active_session->valid()) {
          active_session->element()->GetContext()->ProcessKeyDown(
              command.key, command_modifiers);
          active_session->Refresh();
        }
      }];
      return;
    }
  }
  [self.nextResponder doCommandBySelector:selector];
}

@end
