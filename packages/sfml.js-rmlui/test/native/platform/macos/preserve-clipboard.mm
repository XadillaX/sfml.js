// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#import <AppKit/AppKit.h>

#include <iostream>

namespace {

NSArray<NSPasteboardItem*>* Snapshot(NSPasteboard* pasteboard) {
  auto* items = [NSMutableArray array];
  for (NSPasteboardItem* item in pasteboard.pasteboardItems) {
    auto* copy = [[[NSPasteboardItem alloc] init] autorelease];
    for (NSPasteboardType type in item.types) {
      NSData* data = [item dataForType:type];
      if (!data || ![copy setData:data forType:type]) {
        return nil;
      }
    }
    [items addObject:copy];
  }
  return items;
}

bool Restore(NSPasteboard* pasteboard, NSArray<NSPasteboardItem*>* snapshot) {
  [pasteboard clearContents];
  if (snapshot.count && ![pasteboard writeObjects:snapshot]) {
    return false;
  }
  NSArray<NSPasteboardItem*>* current = pasteboard.pasteboardItems;
  if (current.count != snapshot.count) {
    return false;
  }
  for (NSUInteger index = 0; index < snapshot.count; ++index) {
    NSPasteboardItem* expected = snapshot[index];
    NSPasteboardItem* actual = current[index];
    if (![[NSSet setWithArray:expected.types]
            isEqualToSet:[NSSet setWithArray:actual.types]]) {
      return false;
    }
    for (NSPasteboardType type in expected.types) {
      if (![[expected dataForType:type]
              isEqualToData:[actual dataForType:type]]) {
        return false;
      }
    }
  }
  return true;
}

}  // namespace

int main(int argc, const char* argv[]) {
  if (argc < 2) {
    std::cerr << "Expected a child executable and arguments\n";
    return 2;
  }

  @autoreleasepool {
    NSPasteboard* pasteboard = NSPasteboard.generalPasteboard;
    NSArray<NSPasteboardItem*>* snapshot = Snapshot(pasteboard);
    if (!snapshot) {
      std::cerr << "Cannot preserve every clipboard representation\n";
      return 2;
    }

    NSTask* task = [[[NSTask alloc] init] autorelease];
    task.executableURL = [NSURL fileURLWithPath:@(argv[1])];
    auto* arguments = [NSMutableArray array];
    for (int index = 2; index < argc; ++index) {
      [arguments addObject:@(argv[index])];
    }
    task.arguments = arguments;
    auto* environment = [NSProcessInfo.processInfo.environment mutableCopy];
    environment[@"SFML_RMLUI_CLIPBOARD_PRESERVED"] = @"1";
    task.environment = environment;
    [environment release];

    NSError* error = nil;
    const BOOL launched = [task launchAndReturnError:&error];
    if (launched) {
      [task waitUntilExit];
    }
    if (!Restore(pasteboard, snapshot)) {
      std::cerr << "Clipboard restoration verification failed\n";
      return 2;
    }
    if (!launched) {
      std::cerr << "Could not launch clipboard test subprocess\n";
      return 2;
    }
    return task.terminationReason == NSTaskTerminationReasonExit
               ? task.terminationStatus
               : 128 + task.terminationStatus;
  }
}
