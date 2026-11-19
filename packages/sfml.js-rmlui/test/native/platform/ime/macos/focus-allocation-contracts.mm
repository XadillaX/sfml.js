// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#import <AppKit/AppKit.h>
#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/ElementDocument.h>
#include <RmlUi/Core/Elements/ElementFormControlInput.h>

#include <cassert>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <memory>
#include <new>
#include <string>

#include "native/platform/ime/platform-text-input.h"
#include "native/runtime/rmlui-state.h"
#include "test/native/platform/ime/macos/cocoa-keyboard-fixture.h"
#include <SFML/Window/VideoMode.hpp>

void PlatformFocusExceptionContracts(NSOpenGLView* surface,
                                     Rml::TextInputContext* first_input,
                                     Rml::ElementFormControlInput* first,
                                     Rml::TextInputContext* second_input,
                                     Rml::ElementFormControlInput* second);

namespace {

// Fault injection belongs to the focus operation's thread. Cocoa helper
// threads may allocate while activation contacts the text-services server.
thread_local size_t fail_after{0};
thread_local size_t failed_size{0};
thread_local size_t observed_allocations{0};
thread_local size_t observed_sizes[16]{};
sf::RenderWindow* fixture_window{nullptr};

NSOpenGLView* Surface(NSView* view) {
  if ([view isKindOfClass:NSOpenGLView.class]) {
    return static_cast<NSOpenGLView*>(view);
  }
  for (NSView* child in view.subviews) {
    if (auto* surface = Surface(child)) {
      return surface;
    }
  }
  return nil;
}

}  // namespace

void* operator new(size_t size) {
  if (fail_after && observed_allocations < 16) {
    observed_sizes[observed_allocations++] = size;
  }
  if (fail_after && --fail_after == 0) {
    failed_size = size;
    throw std::bad_alloc();
  }
  if (auto* pointer = std::malloc(size ? size : 1)) {
    return pointer;
  }
  throw std::bad_alloc();
}

void operator delete(void* pointer) noexcept {
  std::free(pointer);
}

void operator delete(void* pointer, size_t) noexcept {
  ::operator delete(pointer);
}

namespace v8::api_internal {

// The fixture stores empty registry handles only. A real V8 operation here
// would violate its standalone contract and must fail instead of being faked.
void DisposeGlobal(v8::internal::Address*) {
  assert(false && "Focus allocation fixture must not create V8 handles");
}

}  // namespace v8::api_internal

namespace sfmlrmlui {

// This standalone fixture needs only the context-to-window registry. It uses
// the real platform implementation and RmlUi widgets without a V8 environment.
RmlState::RmlState() = default;
RmlState::~RmlState() = default;

RmlState& State() {
  static RmlState state;
  return state;
}

sf::RenderWindow* RenderWindowFor(Rml::RenderInterface*) {
  return fixture_window;
}

}  // namespace sfmlrmlui

void PlatformFocusAllocationContracts(
    Rml::Context* first_context,
    const std::function<Rml::TextInputContext*()>& active_input) {
  using sfmlrmlui::PlatformTextInputFocus;
  using sfmlrmlui::State;

  sf::RenderWindow window(sf::VideoMode({320, 200}), "Focus allocation");
  fixture_window = &window;
  auto* native_window =
      static_cast<NSWindow*>(static_cast<id>(window.getNativeHandle()));
  auto* surface = Surface(native_window.contentView);
  assert(surface);
  sfmlrmlui::test::CocoaKeyboardFixture keyboard(surface);

  auto* first_document = first_context->LoadDocumentFromMemory(
      "<rml><body><input id='first' value='first'/></body></rml>");
  assert(first_document);
  first_document->Show();
  auto* first = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
      first_document->GetElementById("first"));
  assert(first && first->Focus());
  auto* first_input = active_input();

  auto* second_context = Rml::CreateContext("focus-allocation", {320, 200});
  assert(second_context);
  auto* second_document = second_context->LoadDocumentFromMemory(
      "<rml><body><input id='second'/></body></rml>");
  assert(second_document);
  second_document->Show();
  auto* second = rmlui_dynamic_cast<Rml::ElementFormControlInput*>(
      second_document->GetElementById("second"));
  assert(second);
  second->SetValue(std::string(256, 'B'));
  assert(second->Focus());
  auto* second_input = active_input();
  assert(first_input && second_input && first_input != second_input);

  for (auto* context : {first_context, second_context}) {
    auto token = std::make_shared<sfmlrmlui::ContextState>();
    token->context = context;
    State().contexts.emplace(context, std::move(token));
  }
  PlatformTextInputFocus(first_input, first, true);
  NSResponder* client = surface.nextResponder;
  assert([client conformsToProtocol:@protocol(NSTextInputClient)]);

  auto fail_focus = [&](size_t allocation, NSString* expected) {
    bool failed = false;
    failed_size = 0;
    observed_allocations = 0;
    fail_after = allocation;
    try {
      PlatformTextInputFocus(second_input, second, true);
    } catch (const std::bad_alloc&) {
      failed = true;
    }
    fail_after = 0;
    if (!failed || failed_size == 0) {
      std::cerr << "Focus allocation diagnostic: requested=" << allocation
                << " observed=" << observed_allocations
                << " key_window=" << native_window.isKeyWindow
                << " first_length=" << first->GetValue().size()
                << " second_length=" << second->GetValue().size() << " sizes=";
      for (size_t i = 0; i < observed_allocations; ++i) {
        std::cerr << observed_sizes[i] << ",";
      }
      std::cerr << "\n";
    }
    assert(failed && failed_size > 0);
    assert(surface.nextResponder == client);
    id<NSTextInputClient> active = static_cast<id<NSTextInputClient>>(client);
    NSRange actual;
    auto* snapshot = [active
        attributedSubstringForProposedRange:NSMakeRange(0, expected.length)
                                actualRange:&actual];
    assert([snapshot.string isEqualToString:expected]);
    assert(NSEqualRanges(actual, NSMakeRange(0, expected.length)));
    PlatformTextInputFocus(first_input, first, true);
    assert(surface.nextResponder == client);
    std::cout << "PASS focus allocation " << allocation
              << " preserves the active Cocoa session\n";
  };

  // Fail the session block, its widget snapshot, then Cocoa's UTF-16 snapshot.
  for (const size_t allocation : {size_t{1}, size_t{2}, size_t{3}}) {
    fail_focus(allocation, @"first");
  }

  // A long previous widget also allocates while cancellation reads its value.
  // Those failures must preserve both its responder and visible Cocoa text.
  first->SetValue(std::string(256, 'A'));
  PlatformTextInputFocus(second_input, second, true);
  PlatformTextInputFocus(first_input, first, true);
  NSString* expected = [@"" stringByPaddingToLength:256
                                         withString:@"A"
                                    startingAtIndex:0];
  for (size_t allocation = 1; allocation <= 6; ++allocation) {
    fail_focus(allocation, expected);
  }

  PlatformFocusExceptionContracts(
      surface, first_input, first, second_input, second);

  PlatformTextInputFocus(second_input, second, true);
  id<NSTextInputClient> active =
      static_cast<id<NSTextInputClient>>(surface.nextResponder);
  [active insertText:@"中" replacementRange:NSMakeRange(NSNotFound, 0)];
  sfmlrmlui::DrainPlatformTextInput(second_context);
  assert(second->GetValue() == "中" + std::string(256, 'B'));

  sfmlrmlui::ReleasePlatformTextInput();
  State().contexts.clear();
  first_document->Close();
  first_context->Update();
  second_document->Close();
  second_context->Update();
  assert(Rml::RemoveContext("focus-allocation"));
  window.close();
  fixture_window = nullptr;
}
