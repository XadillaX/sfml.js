// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_MACOS_TEXT_INPUT_SNAPSHOT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_MACOS_TEXT_INPUT_SNAPSHOT_H_

#import <AppKit/AppKit.h>

#include <memory>

#include "native/platform/ime/text-input-session.h"

namespace sfmlrmlui::ime {

struct CocoaTextRelease {
  void operator()(NSString* value) const;
};

// Prepare the text and all UTF-16 ranges before changing the active client.
// Owned Cocoa storage also releases correctly when C++ allocation fails.
struct CocoaTextSnapshot {
  explicit CocoaTextSnapshot(const TextInputSession& session);

  std::unique_ptr<NSString, CocoaTextRelease> text;
  NSRange selection;
  NSRange marked;
};

}  // namespace sfmlrmlui::ime

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_PLATFORM_IME_MACOS_TEXT_INPUT_SNAPSHOT_H_
