#include "shared-handle.h"
#include "exception-boundary.h"
#include "context-settings.h"
#include "time-value.h"
#include "window-event.h"
#include "window-owner.h"

#include <SFML/Window/Cursor.hpp>
#include <SFML/Window/Window.hpp>
#include <SFML/Window/VideoMode.hpp>
#include <SFML/System/String.hpp>
#include <limits>
#include <string>
#include <type_traits>

namespace {

using WindowHandle = sfmljs::SharedHandle<sf::Window>;
using CursorHandle = sfmljs::SharedHandle<sf::Cursor>;

using OwnedWindow = sfmljs::OwnedWindow<sf::Window>;

template <typename T>
T NativePointer(std::uint64_t value) {
  if constexpr (std::is_pointer_v<T>) return reinterpret_cast<T>(value);
  else return static_cast<T>(value);
}

template <typename T>
v8::Local<v8::BigInt> PointerValue(v8::Isolate* isolate, T value) {
  if constexpr (std::is_pointer_v<T>) {
    return v8::BigInt::NewFromUnsigned(isolate,
        reinterpret_cast<std::uintptr_t>(value));
  } else return v8::BigInt::NewFromUnsigned(isolate, value);
}

bool ReadPointer(v8::Local<v8::Value> value, std::uint64_t& output) {
  bool lossless = false;
  if (value->IsBigInt()) output = value.As<v8::BigInt>()->Uint64Value(&lossless);
  if (!lossless || output > std::numeric_limits<std::uintptr_t>::max()) {
    Nan::ThrowRangeError("Expected a native pointer represented by a bigint");
    return false;
  }
  return true;
}

sf::String WindowTitle(v8::Local<v8::Value> value) {
  Nan::Utf8String title(value);
  return sf::String::fromUtf8(*title, *title + title.length());
}

bool ReadSize(v8::Local<v8::Value> x, v8::Local<v8::Value> y, sf::Vector2u& size) {
  if (!x->IsUint32() || !y->IsUint32()) {
    Nan::ThrowRangeError("Expected positive integer window dimensions");
    return false;
  }
  size = {Nan::To<std::uint32_t>(x).FromJust(),
          Nan::To<std::uint32_t>(y).FromJust()};
  if (!size.x || !size.y) {
    Nan::ThrowRangeError("Expected positive integer window dimensions");
    return false;
  }
  return true;
}

const std::uint8_t* Pixels(v8::Local<v8::Value> value, sf::Vector2u size) {
  if (!value->IsUint8Array()) {
    Nan::ThrowTypeError("Expected RGBA bytes");
    return nullptr;
  }
  auto bytes = value.As<v8::Uint8Array>();
  if (static_cast<std::uint64_t>(size.x) * size.y > bytes->ByteLength() / 4) {
    Nan::ThrowRangeError("Insufficient RGBA bytes");
    return nullptr;
  }
  return static_cast<const std::uint8_t*>(
      bytes->Buffer()->GetBackingStore()->Data()) + bytes->ByteOffset();
}

NAN_METHOD(CreateSfmlWindow) {
  info.GetReturnValue().Set(
      sfmljs::MakeWindowHandle(std::make_shared<OwnedWindow>()));
}

NAN_METHOD(OpenWindow) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  sf::Vector2u size;
  if (!ReadSize(info[1], info[2], size)) return;
  if (!info[3]->IsString()) return Nan::ThrowTypeError("Expected a window title");
  if (!info[4]->IsUint32() || !info[5]->IsUint32() || !info[6]->IsUint32()) {
    return Nan::ThrowTypeError("Expected video mode, style and state");
  }
  const auto style = Nan::To<std::uint32_t>(info[5]).FromJust();
  const auto state = Nan::To<std::uint32_t>(info[6]).FromJust();
  if ((style & ~sf::Style::Default) || state > 1) {
    return Nan::ThrowRangeError("Invalid window style or state");
  }
  sf::ContextSettings settings;
  if (!sfmljs::ReadContextSettings(info[7], settings)) return;
  auto* notifications = sfmljs::GetWindowNotifications(info[0]);
  if (!notifications) return;
  notifications->clear();
  try {
    window->owner()->create(
        sf::VideoMode(size, Nan::To<std::uint32_t>(info[4]).FromJust()),
        WindowTitle(info[3]), style, static_cast<sf::State>(state), settings);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(OpenWindowHandle) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  std::uint64_t handle{};
  if (!ReadPointer(info[1], handle)) return;
  if (!handle) return Nan::ThrowRangeError("Expected a nonzero window handle");
  sf::ContextSettings settings;
  if (!sfmljs::ReadContextSettings(info[2], settings)) return;
  auto* notifications = sfmljs::GetWindowNotifications(info[0]);
  if (!notifications) return;
  notifications->clear();
  try {
    window->owner()->create(NativePointer<sf::WindowHandle>(handle), settings);
  } catch (const std::exception& error) {
    sfmljs::ThrowError(error.what());
  }
}

NAN_METHOD(CloseWindow) {
  auto* window = WindowHandle::From(info[0]);
  if (window) window->owner()->close();
}

NAN_METHOD(TakeWindowNotification) {
  auto* notifications = sfmljs::GetWindowNotifications(info[0]);
  if (!notifications || notifications->empty()) return;
  const auto notification = notifications->front();
  // Consume before calling any JS hook, including one which throws or reenters.
  notifications->pop_front();
  info.GetReturnValue().Set(Nan::New(
      notification == sfmljs::WindowNotification::Create
          ? "create" : "resize").ToLocalChecked());
}

NAN_METHOD(IsWindowOpen) {
  auto* window = WindowHandle::From(info[0]);
  if (window) info.GetReturnValue().Set(window->owner()->isOpen());
}

NAN_METHOD(GetWindowSize) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  const auto size = window->owner()->getSize();
  auto result = Nan::New<v8::Array>(2);
  Nan::Set(result, 0, Nan::New(size.x)).FromJust();
  Nan::Set(result, 1, Nan::New(size.y)).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetWindowPosition) {
  auto* window = WindowHandle::From(info[0]);
  if (window) info.GetReturnValue().Set(
      sfmljs::EventValue(window->owner()->getPosition()));
}

NAN_METHOD(GetWindowNativeHandle) {
  auto* window = WindowHandle::From(info[0]);
  if (window) info.GetReturnValue().Set(
      PointerValue(info.GetIsolate(), window->owner()->getNativeHandle()));
}

NAN_METHOD(HasWindowFocus) {
  auto* window = WindowHandle::From(info[0]);
  if (window) info.GetReturnValue().Set(window->owner()->hasFocus());
}

NAN_METHOD(GetWindowSettings) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  // A Window may recreate its context; each published settings snapshot owns
  // its entire native struct independently of the replaceable GL context.
  auto settings =
      std::make_shared<sf::ContextSettings>(window->owner()->getSettings());
  info.GetReturnValue().Set(
      sfmljs::MapContextSettings(info.GetIsolate(), settings, *settings));
}

NAN_METHOD(WindowCommand) {
  auto* handle = WindowHandle::From(info[0]);
  if (!handle) return;
  auto& window = *handle->owner();
  if (!info[1]->IsString()) return Nan::ThrowTypeError("Expected command");
  const std::string command(*Nan::Utf8String(info[1]));
  if (command == "position") {
    if (!info[2]->IsInt32() || !info[3]->IsInt32()) {
      return Nan::ThrowTypeError("Expected integer coordinates");
    }
    window.setPosition({Nan::To<int>(info[2]).FromJust(),
                        Nan::To<int>(info[3]).FromJust()});
  } else if (command == "size" || command == "minimumSize" ||
             command == "maximumSize") {
    std::optional<sf::Vector2u> size;
    if (!info[2]->IsUndefined() || command == "size") {
      sf::Vector2u value;
      if (!ReadSize(info[2], info[3], value)) return;
      size = value;
    }
    if (command == "size") window.setSize(*size);
    else if (command == "minimumSize") window.setMinimumSize(size);
    else window.setMaximumSize(size);
  } else if (command == "title") {
    if (!info[2]->IsString()) return Nan::ThrowTypeError("Expected title");
    window.setTitle(WindowTitle(info[2]));
  } else if (command == "focus") {
    window.requestFocus();
  } else if (command == "joystickThreshold") {
    if (!info[2]->IsNumber()) return Nan::ThrowTypeError("Expected threshold");
    window.setJoystickThreshold(Nan::To<double>(info[2]).FromJust());
  } else if (command == "framerateLimit") {
    if (!info[2]->IsUint32()) return Nan::ThrowRangeError("Expected frame limit");
    window.setFramerateLimit(Nan::To<std::uint32_t>(info[2]).FromJust());
  } else {
    if (!info[2]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
    const bool value = info[2]->IsTrue();
    if (command == "visible") window.setVisible(value);
    else if (command == "cursorVisible") window.setMouseCursorVisible(value);
    else if (command == "cursorGrabbed") window.setMouseCursorGrabbed(value);
    else if (command == "keyRepeat") window.setKeyRepeatEnabled(value);
    else if (command == "verticalSync") window.setVerticalSyncEnabled(value);
    else Nan::ThrowTypeError("Unknown window command");
  }
}

NAN_METHOD(PollWindowEvent) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  if (auto event = window->owner()->pollEvent()) {
    info.GetReturnValue().Set(sfmljs::WindowEvent(*event));
  }
}

NAN_METHOD(WaitWindowEvent) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  sf::Time timeout;
  if (!sfmljs::ReadTime(info[1], timeout)) return;
  if (auto event = window->owner()->waitEvent(timeout)) {
    info.GetReturnValue().Set(sfmljs::WindowEvent(*event));
  }
}

NAN_METHOD(SetWindowIcon) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  sf::Vector2u size;
  if (!ReadSize(info[1], info[2], size)) return;
  const auto* pixels = Pixels(info[3], size);
  if (pixels) window->owner()->setIcon(size, pixels);
}

NAN_METHOD(SetWindowCursor) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  auto* cursor = CursorHandle::From(info[1]);
  if (!cursor) return;
  window->owner()->setMouseCursor(*cursor->owner());
  sfmljs::RetainWindowCursor(info[0].As<v8::Object>(), cursor->owner());
}

NAN_METHOD(CreateSystemCursor) {
  if (!info[0]->IsUint32() ||
      Nan::To<std::uint32_t>(info[0]).FromJust() >
          static_cast<unsigned int>(sf::Cursor::Type::NotAllowed)) {
    return Nan::ThrowRangeError("Unknown cursor type");
  }
  if (auto cursor = sf::Cursor::createFromSystem(
          static_cast<sf::Cursor::Type>(Nan::To<int>(info[0]).FromJust()))) {
    info.GetReturnValue().Set(
        CursorHandle::Create(std::make_shared<sf::Cursor>(std::move(*cursor))));
  }
}

NAN_METHOD(CreatePixelCursor) {
  sf::Vector2u size;
  if (!ReadSize(info[1], info[2], size)) return;
  if (!info[3]->IsUint32() || !info[4]->IsUint32()) {
    return Nan::ThrowTypeError("Expected cursor hotspot");
  }
  const sf::Vector2u hotspot{Nan::To<std::uint32_t>(info[3]).FromJust(),
                            Nan::To<std::uint32_t>(info[4]).FromJust()};
  if (hotspot.x >= size.x || hotspot.y >= size.y) {
    return Nan::ThrowRangeError("Cursor hotspot is outside the cursor");
  }
  const auto* pixels = Pixels(info[0], size);
  if (!pixels) return;
  if (auto cursor = sf::Cursor::createFromPixels(pixels, size, hotspot)) {
    info.GetReturnValue().Set(
        CursorHandle::Create(std::make_shared<sf::Cursor>(std::move(*cursor))));
  }
}

v8::Local<v8::Array> VideoModeValue(sf::VideoMode mode) {
  auto result = Nan::New<v8::Array>(3);
  Nan::Set(result, 0, Nan::New(mode.size.x)).FromJust();
  Nan::Set(result, 1, Nan::New(mode.size.y)).FromJust();
  Nan::Set(result, 2, Nan::New(mode.bitsPerPixel)).FromJust();
  return result;
}

NAN_METHOD(GetDesktopVideoMode) {
  info.GetReturnValue().Set(VideoModeValue(sf::VideoMode::getDesktopMode()));
}

NAN_METHOD(GetFullscreenVideoModes) {
  const auto& modes = sf::VideoMode::getFullscreenModes();
  auto result = Nan::New<v8::Array>(modes.size());
  for (std::uint32_t i = 0; i < modes.size(); ++i) {
    Nan::Set(result, i, VideoModeValue(modes[i])).FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(IsVideoModeValid) {
  for (int i = 0; i < 3; ++i) {
    if (!info[i]->IsUint32()) return Nan::ThrowRangeError("Invalid video mode");
  }
  info.GetReturnValue().Set(sf::VideoMode(
      {Nan::To<std::uint32_t>(info[0]).FromJust(),
       Nan::To<std::uint32_t>(info[1]).FromJust()},
      Nan::To<std::uint32_t>(info[2]).FromJust()).isValid());
}

NAN_METHOD(CreateWindowVulkanSurface) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  std::uint64_t instance{}, allocator{};
  if (!ReadPointer(info[1], instance) || !ReadPointer(info[2], allocator)) return;
  if (!instance) return Nan::ThrowRangeError("Expected a nonzero VkInstance");
  VkSurfaceKHR surface{};
  if (window->owner()->createVulkanSurface(
          NativePointer<VkInstance>(instance), surface,
          NativePointer<const VkAllocationCallbacks*>(allocator))) {
    info.GetReturnValue().Set(PointerValue(info.GetIsolate(), surface));
  }
}

NAN_METHOD(SetWindowActive) {
  auto* window = WindowHandle::From(info[0]);
  if (!window) return;
  if (!info[1]->IsBoolean()) return Nan::ThrowTypeError("Expected a boolean");
  info.GetReturnValue().Set(window->owner()->setActive(info[1]->IsTrue()));
}

NAN_METHOD(DisplayWindow) {
  auto* window = WindowHandle::From(info[0]);
  if (window) window->owner()->display();
}

}  // namespace

NAN_MODULE_INIT(InitializeWindow) {
  sfmljs::SetMethod<CreateSfmlWindow>(target, "createWindow");
  sfmljs::SetMethod<OpenWindow>(target, "openWindow");
  sfmljs::SetMethod<OpenWindowHandle>(target, "openWindowHandle");
  sfmljs::SetMethod<CloseWindow>(target, "closeWindow");
  sfmljs::SetMethod<TakeWindowNotification>(target, "takeWindowNotification");
  sfmljs::SetMethod<IsWindowOpen>(target, "isWindowOpen");
  sfmljs::SetMethod<GetWindowSize>(target, "getWindowSize");
  sfmljs::SetMethod<SetWindowActive>(target, "setWindowActive");
  sfmljs::SetMethod<DisplayWindow>(target, "displayWindow");
  sfmljs::SetMethod<WindowCommand>(target, "windowCommand");
  sfmljs::SetMethod<GetWindowPosition>(target, "getWindowPosition");
  sfmljs::SetMethod<GetWindowSettings>(target, "getWindowSettings");
  sfmljs::SetMethod<GetWindowNativeHandle>(target, "getWindowNativeHandle");
  sfmljs::SetMethod<HasWindowFocus>(target, "hasWindowFocus");
  sfmljs::SetMethod<PollWindowEvent>(target, "pollWindowEvent");
  sfmljs::SetMethod<WaitWindowEvent>(target, "waitWindowEvent");
  sfmljs::SetMethod<SetWindowIcon>(target, "setWindowIcon");
  sfmljs::SetMethod<SetWindowCursor>(target, "setWindowCursor");
  sfmljs::SetMethod<CreateSystemCursor>(target, "createSystemCursor");
  sfmljs::SetMethod<CreatePixelCursor>(target, "createPixelCursor");
  sfmljs::SetMethod<GetDesktopVideoMode>(target, "getDesktopVideoMode");
  sfmljs::SetMethod<GetFullscreenVideoModes>(target, "getFullscreenVideoModes");
  sfmljs::SetMethod<IsVideoModeValid>(target, "isVideoModeValid");
  sfmljs::SetMethod<CreateWindowVulkanSurface>(target, "createWindowVulkanSurface");
}
