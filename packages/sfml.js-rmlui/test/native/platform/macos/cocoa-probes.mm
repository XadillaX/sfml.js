// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#import <AppKit/AppKit.h>
#import <objc/runtime.h>
#include <sfml-js-interop.h>

#include <cassert>
#include <cstdint>
#include <memory>

namespace {

using ClientHandle = sfmljs::SharedHandle<NSResponder>;
using SourceWatch =
    sfmljs::SharedHandle<std::weak_ptr<sfmljs::interop::WindowEventSource>>;

BOOL FailInputContextEvent(id context, SEL, NSEvent*) {
  object_setClass(context, class_getSuperclass(object_getClass(context)));
  @throw [NSException exceptionWithName:@"SFMLRmlInputContextFailure"  // NOLINT
                                 reason:@"Injected Cocoa input exception"
                               userInfo:nil];
}

NSOpenGLView* Surface(NSView* view) {
  if ([view isKindOfClass:NSOpenGLView.class]) {
    return static_cast<NSOpenGLView*>(view);
  }
  for (NSView* child in view.subviews) {
    if (auto* found = Surface(child)) {
      return found;
    }
  }
  return nil;
}

NSOpenGLView* WindowSurface(v8::Local<v8::Value> handle) {
  auto* window = sfmljs::interop::RenderWindowFrom(handle);
  if (!window) {
    return nil;
  }
  if (!window->isOpen()) {
    Nan::ThrowError("Probe requires an open window");
    return nil;
  }
  id native = static_cast<id>(window->getNativeHandle());
  NSView* content = [native isKindOfClass:NSWindow.class]
                        ? static_cast<NSWindow*>(native).contentView
                        : static_cast<NSView*>(native);
  auto* view = Surface(content);
  if (!view) {
    Nan::ThrowError("Probe requires an SFML Cocoa surface");
  }
  return view;
}

id<NSTextInputClient> Client(v8::Local<v8::Value> handle) {
  auto* wrapped = ClientHandle::From(handle);
  if (!wrapped) {
    return nil;
  }
  return static_cast<id<NSTextInputClient>>(wrapped->owner().get());
}

NAN_METHOD(RetainClient) {
  auto* view = WindowSurface(info[0]);
  if (!view) {
    return;
  }
  NSResponder* client = view.nextResponder;
  if (![client conformsToProtocol:@protocol(NSTextInputClient)]) {
    return Nan::ThrowError("Window has no native text input client");
  }
  auto owner = std::shared_ptr<NSResponder>(
      [client retain], [](NSResponder* retained) { [retained release]; });
  info.GetReturnValue().Set(ClientHandle::Create(std::move(owner)));
}

NAN_METHOD(CaretRectangle) {
  auto client = Client(info[0]);
  if (!client) {
    return;
  }
  NSRange actual;
  const NSRect rectangle = [client firstRectForCharacterRange:NSMakeRange(0, 0)
                                                  actualRange:&actual];
  auto result = Nan::New<v8::Array>(4);
  const double values[] = {rectangle.origin.x,
                           rectangle.origin.y,
                           rectangle.size.width,
                           rectangle.size.height};
  for (uint32_t i = 0; i < 4; ++i) {
    Nan::Set(result, i, Nan::New(values[i])).FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(InputState) {
  auto client = Client(info[0]);
  if (!client) {
    return;
  }
  auto* context = [static_cast<NSResponder*>(client) inputContext];
  auto result = Nan::New<v8::Object>();
  NSString* selected = context.selectedKeyboardInputSource;
  Nan::Set(result, Nan::New("selected").ToLocalChecked(),
           Nan::New(selected ? selected.UTF8String : "").ToLocalChecked());
  Nan::Set(result, Nan::New("marked").ToLocalChecked(),
           Nan::New([client hasMarkedText] == YES));
  Nan::Set(result, Nan::New("current").ToLocalChecked(),
           Nan::New(context == NSTextInputContext.currentInputContext));
  NSString* locales = context.allowedInputSourceLocales.description;
  Nan::Set(result, Nan::New("allowedLocales").ToLocalChecked(),
           Nan::New(locales ? locales.UTF8String : "").ToLocalChecked());
  info.GetReturnValue().Set(result);
}

NAN_METHOD(MarkText) {
  auto client = Client(info[0]);
  if (!client || !info[1]->IsString()) {
    return;
  }
  Nan::Utf8String value(info[1]);
  NSString* text = [[NSString alloc] initWithBytes:*value
                                            length:value.length()
                                          encoding:NSUTF8StringEncoding];
  [client setMarkedText:text
          selectedRange:NSMakeRange(text.length, 0)
       replacementRange:NSMakeRange(NSNotFound, 0)];
  [text release];
}

NAN_METHOD(InsertText) {
  auto client = Client(info[0]);
  if (!client || !info[1]->IsString()) {
    return;
  }
  Nan::Utf8String value(info[1]);
  NSString* text = [[NSString alloc] initWithBytes:*value
                                            length:value.length()
                                          encoding:NSUTF8StringEncoding];
  [client insertText:text replacementRange:NSMakeRange(NSNotFound, 0)];
  [text release];
}

NAN_METHOD(SendKey) {
  auto* view = WindowSurface(info[0]);
  if (!view) {
    return;
  }
  if (!info[1]->IsString() || !info[2]->IsUint32() ||
      Nan::To<uint32_t>(info[2]).FromJust() > UINT16_MAX) {
    return Nan::ThrowTypeError("Expected characters and a Cocoa key code");
  }
  Nan::Utf8String value(info[1]);
  NSString* text = [[NSString alloc] initWithBytes:*value
                                            length:value.length()
                                          encoding:NSUTF8StringEncoding];
  NSEvent* event = [NSEvent
                 keyEventWithType:NSEventTypeKeyDown
                         location:NSZeroPoint
                    modifierFlags:0
                        timestamp:NSProcessInfo.processInfo.systemUptime
                     windowNumber:view.window.windowNumber
                          context:nil
                       characters:text
      charactersIgnoringModifiers:text
                        isARepeat:NO
                          keyCode:static_cast<uint16_t>(
                                      Nan::To<uint32_t>(info[2]).FromJust())];
  [view keyDown:event];
  [text release];
}

NAN_METHOD(WatchAKeySource) {
  const sf::Event key =
      sf::Event::KeyPressed{sf::Keyboard::Key::A, sf::Keyboard::Scan::A};
  auto source = sfmljs::interop::ReadWindowEventSource(info[0], key);
  if (!source) {
    return Nan::ThrowError("Probe expected a captured native A key");
  }
  info.GetReturnValue().Set(SourceWatch::Create(
      std::make_shared<std::weak_ptr<sfmljs::interop::WindowEventSource>>(
          source)));
}

NAN_METHOD(SourceAlive) {
  const auto* watch = SourceWatch::From(info[0]);
  if (watch) {
    info.GetReturnValue().Set(!watch->owner()->expired());
  }
}

NAN_METHOD(FailNextInputContextEvent) {
  auto* wrapped = ClientHandle::From(info[0]);
  if (!wrapped) {
    return;
  }
  auto* context = [wrapped->owner().get() inputContext];
  if (!context) {
    return Nan::ThrowError("Probe requires a native input context");
  }
  const Class base = object_getClass(context);
  Class subclass = objc_getClass("SFMLRmlFailingInputContext");
  if (!subclass) {
    subclass = objc_allocateClassPair(base, "SFMLRmlFailingInputContext", 0);
    const Method method =
        class_getInstanceMethod(base, @selector(handleEvent:));
    assert(subclass && method);
    class_addMethod(subclass,
                    @selector(handleEvent:),
                    reinterpret_cast<IMP>(FailInputContextEvent),
                    method_getTypeEncoding(method));
    objc_registerClassPair(subclass);
  }
  // Change only this test object's class; the override restores it before
  // throwing. No system class or another window's input context is modified.
  object_setClass(context, subclass);
}

NAN_MODULE_INIT(Initialize) {
  Nan::SetMethod(target, "retainClient", RetainClient);
  Nan::SetMethod(target, "caretRectangle", CaretRectangle);
  Nan::SetMethod(target, "inputState", InputState);
  Nan::SetMethod(target, "markText", MarkText);
  Nan::SetMethod(target, "insertText", InsertText);
  Nan::SetMethod(target, "sendKey", SendKey);
  Nan::SetMethod(target, "watchAKeySource", WatchAKeySource);
  Nan::SetMethod(target, "sourceAlive", SourceAlive);
  Nan::SetMethod(
      target, "failNextInputContextEvent", FailNextInputContextEvent);
}

}  // namespace

NODE_MODULE(cocoa_probes, Initialize)
