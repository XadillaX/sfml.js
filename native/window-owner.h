#pragma once

#include "shared-handle.h"
#include <SFML/Window/Cursor.hpp>
#include <SFML/Window/Window.hpp>
#include <deque>
#include <memory>

namespace sfmljs {

enum class WindowNotification { Create, Resize };
using WindowNotifications = std::deque<WindowNotification>;

// Both kinds of window borrow their cursor until the OS window is closed.
template <typename Base>
class OwnedWindow : public Base {
 public:
  std::shared_ptr<sf::Cursor> cursor;
  WindowNotifications notifications;
  ~OwnedWindow() override { close(); }
  void close() override {
    // No notification from the closed generation can reach a later JS call.
    notifications.clear();
    Base::close();
    cursor.reset();
  }
  void CloseBeforeThreadExit() { close(); }

 protected:
  void onCreate() override {
    Base::onCreate();
    notifications.push_back(WindowNotification::Create);
  }
  void onResize() override {
    Base::onResize();
    notifications.push_back(WindowNotification::Resize);
  }
};

inline v8::Local<v8::String> WindowCursorKey() {
  return Nan::New("sfml.window.cursor").ToLocalChecked();
}

inline v8::Local<v8::String> WindowNotificationsKey() {
  return Nan::New("sfml.window.notifications").ToLocalChecked();
}

template <typename T>
v8::Local<v8::Object> MakeWindowHandle(const std::shared_ptr<T>& owner) {
  auto handle = SharedHandle<sf::Window>::Create(owner);
  // This member pointer stays valid for as long as the owning handle exists.
  Nan::SetPrivate(handle, WindowCursorKey(),
                   Nan::New<v8::External>(&owner->cursor)).FromJust();
  Nan::SetPrivate(handle, WindowNotificationsKey(),
                   Nan::New<v8::External>(&owner->notifications)).FromJust();
  return handle;
}

inline WindowNotifications* GetWindowNotifications(v8::Local<v8::Value> value) {
  if (!SharedHandle<sf::Window>::From(value)) return nullptr;
  auto slot = Nan::GetPrivate(value.As<v8::Object>(),
                             WindowNotificationsKey()).ToLocalChecked();
  if (!slot->IsExternal()) {
    Nan::ThrowTypeError("Expected an owned window handle");
    return nullptr;
  }
  return static_cast<WindowNotifications*>(
      slot.As<v8::External>()->Value());
}

inline void RetainWindowCursor(v8::Local<v8::Object> handle,
                               std::shared_ptr<sf::Cursor> cursor) {
  auto slot = Nan::GetPrivate(handle, WindowCursorKey()).ToLocalChecked();
  if (!slot->IsExternal()) {
    return Nan::ThrowTypeError("Expected an owned window handle");
  }
  *static_cast<std::shared_ptr<sf::Cursor>*>(
      slot.As<v8::External>()->Value()) = std::move(cursor);
}

}  // namespace sfmljs
