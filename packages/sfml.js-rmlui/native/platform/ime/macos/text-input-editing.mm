// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <utility>

#import "native/platform/ime/macos/text-input-client.h"

namespace {

std::u16string Utf16(NSString* text) {
  std::u16string value(text.length, u'\0');
  [text getCharacters:reinterpret_cast<unichar*>(value.data())
                range:NSMakeRange(0, text.length)];
  return value;
}

NSString* PlainText(id value) {
  if ([value isKindOfClass:NSString.class]) {
    return static_cast<NSString*>(value);
  }
  if ([value isKindOfClass:NSAttributedString.class]) {
    return static_cast<NSAttributedString*>(value).string;
  }
  return nil;
}

Rml::String Utf8(NSString* text) {
  NSData* data = [text dataUsingEncoding:NSUTF8StringEncoding];
  return data ? Rml::String(static_cast<const char*>(data.bytes), data.length)
              : Rml::String{};
}

std::optional<sfmlrmlui::ime::CodePointRange> Replacement(NSString* text,
                                                          NSRange range) {
  if (range.location == NSNotFound) {
    return std::nullopt;
  }
  return sfmlrmlui::ime::FromUtf16(Utf16(text), range.location, range.length);
}

NSRange CocoaRange(std::u16string_view text,
                   sfmlrmlui::ime::CodePointRange range) {
  const auto converted = sfmlrmlui::ime::ToUtf16(text, range);
  return NSMakeRange(converted.location, converted.length);
}

}  // namespace

namespace sfmlrmlui::ime {

void CocoaTextRelease::operator()(NSString* value) const {
  [value release];
}

CocoaTextSnapshot::CocoaTextSnapshot(const TextInputSession& session) {
  const auto& snapshot = session.text();
  text.reset([[NSString alloc] initWithBytes:snapshot.data()
                                      length:snapshot.size()
                                    encoding:NSUTF8StringEncoding]);
  if (!text) {
    text.reset([@"" retain]);
  }
  const auto utf16 = Utf16(text.get());
  selection = CocoaRange(utf16, session.selection());
  const auto composition = session.composition();
  marked = composition ? CocoaRange(utf16, *composition)
                       : NSMakeRange(NSNotFound, 0);
}

}  // namespace sfmlrmlui::ime

@implementation SFMLRmlTextInputClient (Editing)  // NOLINT

- (void)syncSnapshot {
  if (!session) {
    return;
  }
  [self applySnapshot:sfmlrmlui::ime::CocoaTextSnapshot(*session)];
}

- (void)applySnapshot:(sfmlrmlui::ime::CocoaTextSnapshot)snapshot {  // NOLINT
  [text release];
  text = snapshot.text.release();
  selection = snapshot.selection;
  marked = snapshot.marked;
}

- (void)replaceSnapshot:(NSString*)replacement range:(NSRange)range {  // NOLINT
  const auto utf16 = Utf16(text);
  range = CocoaRange(
      utf16, sfmlrmlui::ime::FromUtf16(utf16, range.location, range.length));
  NSMutableString* value = [text mutableCopy];
  [value replaceCharactersInRange:range withString:replacement];
  [text release];
  text = value;
  selection = NSMakeRange(range.location + replacement.length, 0);
}

- (BOOL)hasMarkedText {
  return accepting && marked.location != NSNotFound && marked.length > 0;
}

- (NSRange)markedRange {
  return accepting ? marked : NSMakeRange(NSNotFound, 0);
}

- (NSRange)selectedRange {
  return accepting ? selection : NSMakeRange(NSNotFound, 0);
}

- (void)setMarkedText:(id)value
        selectedRange:(NSRange)selected
     replacementRange:(NSRange)replacement {
  NSString* replacement_text = PlainText(value);
  if (!accepting || !replacement_text) {
    return;
  }
  const auto utf8 = Utf8(replacement_text);
  const auto relative_selection = sfmlrmlui::ime::FromUtf16(
      Utf16(replacement_text), selected.location, selected.length);
  const auto range = Replacement(text, replacement);
  auto active_session = session;
  [self submit:[active_session, utf8, relative_selection, range] {
    active_session->Mark(utf8, relative_selection, range);
  }];
  if (!draining) {
    const NSRange replaced =
        replacement.location != NSNotFound
            ? replacement
            : (marked.location != NSNotFound ? marked : selection);
    const auto utf16 = Utf16(text);
    const NSRange safe = CocoaRange(
        utf16,
        sfmlrmlui::ime::FromUtf16(utf16, replaced.location, replaced.length));
    [self replaceSnapshot:replacement_text range:safe];
    marked = NSMakeRange(safe.location, replacement_text.length);
    const NSRange relative =
        CocoaRange(Utf16(replacement_text), relative_selection);
    selection = NSMakeRange(safe.location + relative.location, relative.length);
  }
}

- (void)insertText:(id)value replacementRange:(NSRange)replacement {
  NSString* replacement_text = PlainText(value);
  if (!accepting || !replacement_text) {
    return;
  }
  const auto utf8 = Utf8(replacement_text);
  const auto range = Replacement(text, replacement);
  auto active_session = session;
  [self submit:[active_session, utf8, range] {
    active_session->Insert(utf8, range);
  }];
  if (!draining) {
    const NSRange replaced =
        replacement.location != NSNotFound
            ? replacement
            : (marked.location != NSNotFound ? marked : selection);
    [self replaceSnapshot:replacement_text range:replaced];
    marked = NSMakeRange(NSNotFound, 0);
  }
}

- (void)unmarkText {
  auto active_session = session;
  if (active_session) {
    [self submit:[active_session] { active_session->Unmark(); }];
    if (!draining) {
      marked = NSMakeRange(NSNotFound, 0);
    }
  }
}

- (NSArray<NSAttributedStringKey>*)validAttributesForMarkedText {
  return @[];
}

- (NSAttributedString*)  // NOLINT(readability/casting)
    attributedSubstringForProposedRange:(NSRange)range  // NOLINT
                            actualRange:(NSRangePointer)actual {
  if (!accepting || range.location == NSNotFound ||
      range.location > text.length) {
    if (actual) {
      *actual = NSMakeRange(NSNotFound, 0);
    }
    return nil;
  }
  const auto utf16 = Utf16(text);
  range = CocoaRange(
      utf16, sfmlrmlui::ime::FromUtf16(utf16, range.location, range.length));
  if (actual) {
    *actual = range;
  }
  return [[[NSAttributedString alloc]
      initWithString:[text substringWithRange:range]] autorelease];
}

- (void)setCaret:(Rml::Rectanglef)bounds {
  if (caret == bounds) {
    return;
  }
  caret = bounds;
  [input_context invalidateCharacterCoordinates];
}

- (NSRect)firstRectForCharacterRange:(NSRange)range
                         actualRange:(NSRangePointer)actual {
  if (actual) {
    *actual = accepting ? selection : NSMakeRange(NSNotFound, 0);
  }
  (void)range;
  if (!accepting || !surface.window || !caret.Valid()) {
    return NSZeroRect;
  }
  // RmlUi supplies backing pixels with a top-left origin. Cocoa uses view
  // points and then window/screen coordinates; each conversion occurs once.
  const CGFloat density = surface.wantsBestResolutionOpenGLSurface
                              ? surface.window.backingScaleFactor
                              : 1.;
  const CGFloat height = caret.Height() / density;
  NSRect rectangle = NSMakeRect(caret.Left() / density,
                                caret.Top() / density,
                                caret.Width() / density,
                                height);
  if (!surface.isFlipped) {
    rectangle.origin.y = NSHeight(surface.bounds) - rectangle.origin.y - height;
  }
  return [surface.window convertRectToScreen:[surface convertRect:rectangle
                                                           toView:nil]];
}

- (NSUInteger)characterIndexForPoint:(NSPoint)point {
  if (!accepting) {
    return NSNotFound;
  }
  const NSRect rectangle = [self firstRectForCharacterRange:selection
                                                actualRange:nullptr];
  return NSPointInRect(point, NSInsetRect(rectangle, -4., -4.))
             ? selection.location
             : NSNotFound;
}

@end
