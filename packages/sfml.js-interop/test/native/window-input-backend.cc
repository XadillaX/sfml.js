// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <cassert>
#include <iostream>

#include <SFML/System/Time.hpp>
#include <SFML/Window/WindowBase.hpp>

#if defined(_WIN32)
#include <windows.h>
// IMM constants depend on the Win32 declarations above.
#include <imm.h>
#elif defined(__linux__)
#include <X11/Xlib.h>
#include <X11/keysym.h>
#endif

#if __has_include("window-input-backend.h")
#include "window-input-backend.h"
#endif

#if defined(_WIN32)
namespace {

LPARAM observed_ime_flags = 0;

LRESULT CALLBACK InputSurface(HWND handle,
                              UINT message,
                              WPARAM wparam,
                              LPARAM lparam) {
  if (message == WM_IME_SETCONTEXT) {
    observed_ime_flags = lparam;
    return 0;
  }
  return DefWindowProcW(handle, message, wparam, lparam);
}

void CompositionUiContract() {
  WNDCLASSW surface{};
  surface.lpfnWndProc = InputSurface;
  surface.hInstance = GetModuleHandleW(nullptr);
  surface.lpszClassName = L"SFML input protocol fixture";
  assert(RegisterClassW(&surface));
  HWND handle = CreateWindowW(surface.lpszClassName,
                              L"Input protocol",
                              WS_OVERLAPPEDWINDOW,
                              0,
                              0,
                              80,
                              80,
                              nullptr,
                              nullptr,
                              surface.hInstance,
                              nullptr);
  assert(handle);
  sf::WindowBase window(handle);
  sfmljs::interop::WindowInputCallbacks callbacks;
  callbacks.owner = std::make_shared<int>(1);
  callbacks.event = [](const auto&, const sf::Event&) {
    return std::shared_ptr<void>{};
  };
  callbacks.native = [](const auto&, void* payload, bool entering) {
    auto* message = static_cast<sfmljs::interop::WindowInputMessage*>(payload);
    if (entering && message->message == WM_IME_SETCONTEXT) {
      message->lparam &= ~static_cast<LPARAM>(ISC_SHOWUICOMPOSITIONWINDOW);
    }
  };
  assert(sfmljs::interop::detail::RegisterWindowInput(
      reinterpret_cast<uintptr_t>(handle), &callbacks));
  SendMessageW(handle, WM_IME_SETCONTEXT, TRUE, ISC_SHOWUIALL);
  assert((observed_ime_flags & ISC_SHOWUICOMPOSITIONWINDOW) == 0);
  assert((observed_ime_flags & ISC_SHOWUICANDIDATEWINDOW) ==
         ISC_SHOWUICANDIDATEWINDOW);
  std::cout << "PASS actual native procedure preserves candidate UI flags\n";
  assert(sfmljs::interop::detail::RegisterWindowInput(
      reinterpret_cast<uintptr_t>(handle), nullptr));
  SendMessageW(handle, WM_IME_SETCONTEXT, TRUE, ISC_SHOWUIALL);
  assert(observed_ime_flags == static_cast<LPARAM>(ISC_SHOWUIALL));
  std::cout << "PASS native composition presentation restores on detach\n";
  window.close();
  assert(DestroyWindow(handle));
  assert(UnregisterClassW(surface.lpszClassName, surface.hInstance));
}

}  // namespace
#endif

int main() {
#if __has_include("window-input-backend.h")
  const auto& backend = sfmljs::interop::detail::EventSourceBackend();
  assert(backend.set && backend.take && backend.attach);
  std::cout << "PASS loaded SFML Window exports the input protocol\n";
  assert(!backend.attach(0, nullptr));
  std::cout << "PASS unknown native handles reject input attachment\n";
  auto source = std::static_pointer_cast<void>(std::make_shared<int>(17));
  backend.set(&source);
  std::shared_ptr<void> polled;
  backend.take(&polled);
  assert(!polled);
  backend.set(&polled);
  std::cout << "PASS capture does not invent a polled event source\n";

#if defined(_WIN32) || defined(__linux__)
  struct HostInput {
    int depth{0};
    int captures{0};
    bool closed{false};
    void* display{nullptr};
  };
  auto host = std::make_shared<HostInput>();
  sf::WindowBase window(sf::VideoMode({80, 80}), "Native input contracts");
  window.setVisible(false);
  while (window.pollEvent()) {
    backend.take(&polled);
  }
#if defined(_WIN32)
  const auto handle = reinterpret_cast<uintptr_t>(window.getNativeHandle());
#else
  const auto handle = static_cast<uintptr_t>(window.getNativeHandle());
#endif
  sfmljs::interop::WindowInputCallbacks callbacks;
  callbacks.owner = host;
  callbacks.native = [](const auto& owner, void*, bool entering) {
    auto state = std::static_pointer_cast<HostInput>(owner);
    state->depth += entering ? 1 : -1;
  };
  callbacks.event = [](const auto& owner, const sf::Event&) {
    auto state = std::static_pointer_cast<HostInput>(owner);
    assert(state->depth > 0);
    return std::static_pointer_cast<void>(
        std::make_shared<int>(++state->captures));
  };
  callbacks.closed = [](const auto& owner) {
    std::static_pointer_cast<HostInput>(owner)->closed = true;
  };
  callbacks.configure = [](const auto& owner, void* display, void*, void* ic) {
    std::static_pointer_cast<HostInput>(owner)->display = display;
    return ic;
  };
  assert(backend.attach(handle, &callbacks));
  std::cout << "PASS native host accepts only its live input client\n";
  for (int index = 0; index < 2; ++index) {
#if defined(_WIN32)
    SendMessageW(window.getNativeHandle(), WM_CHAR, U'中', 0);
#else
    // Use the actual connection exposed by SFML, never another X display.
    auto* display = static_cast<Display*>(host->display);
    assert(display);
    XEvent key{};
    key.xkey.type = KeyPress;
    key.xkey.display = display;
    key.xkey.window = window.getNativeHandle();
    key.xkey.root = DefaultRootWindow(display);
    key.xkey.keycode = XKeysymToKeycode(display, XK_A);
    key.xkey.same_screen = True;
    assert(XSendEvent(display, key.xkey.window, False, KeyPressMask, &key));
    XFlush(display);
#endif
  }
  int received = 0;
  int previous = 0;
  while (received < 2) {
    const auto event = window.waitEvent(sf::milliseconds(500));
    assert(event);
    backend.take(&polled);
#if defined(_WIN32)
    const bool target = event->is<sf::Event::TextEntered>();
#else
    const bool target = event->is<sf::Event::KeyPressed>();
#endif
    if (target) {
      assert(polled);
      const int serial = *std::static_pointer_cast<int>(polled);
      assert(serial > previous);
      previous = serial;
      ++received;
    }
  }
  assert(host->depth == 0);
  std::cout << "PASS identical native events keep distinct queue sources\n";
  const std::weak_ptr<void> lifetime = polled;
  polled.reset();
  assert(lifetime.expired());
  assert(backend.attach(handle, nullptr));
  assert(backend.attach(handle, &callbacks));
  std::cout << "PASS delivered sources release independently of attachment\n";
  window.close();
  assert(host->closed && !backend.attach(handle, &callbacks));
  std::cout << "PASS native window close retires its callback registry\n";
#if defined(_WIN32)
  CompositionUiContract();
#endif
#endif
#else
  assert(false && "loaded SFML input backend is not implemented");
#endif
}
