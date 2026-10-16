#include "../../native/shared-handle.h"
#include "../../native/window-event.h"
#include "../../native/texture-resource.h"
#include <SFML/Window/Cursor.hpp>
#include <SFML/Window/Context.hpp>
#include <SFML/Window/VideoMode.hpp>
#include <SFML/Window/Window.hpp>
#define GL_SILENCE_DEPRECATION
#include <SFML/OpenGL.hpp>
#include <vector>

namespace {

std::weak_ptr<sf::Cursor> watchedCursor;

#ifdef _WIN32
// Use a genuine external control: wrapping an SFML HWND twice recursively
// chains SFML's Win32 window procedure back to itself.
struct WindowHost {
  HWND handle{};
  ~WindowHost() { if (handle) DestroyWindow(handle); }
};

NAN_METHOD(CreateWindowHost) {
  auto owner = std::make_shared<WindowHost>();
  owner->handle = CreateWindowExW(0, L"STATIC", L"SFML external host",
      WS_POPUP | WS_VISIBLE, 0, 0, Nan::To<int>(info[0]).FromJust(),
      Nan::To<int>(info[1]).FromJust(), nullptr, nullptr,
      GetModuleHandleW(nullptr), nullptr);
  if (!owner->handle) return Nan::ThrowError("Cannot create external window");
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("handle").ToLocalChecked(),
      v8::BigInt::NewFromUnsigned(info.GetIsolate(),
          reinterpret_cast<std::uintptr_t>(owner->handle))).FromJust();
  Nan::Set(result, Nan::New("owner").ToLocalChecked(),
      sfmljs::SharedHandle<WindowHost>::Create(owner)).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(CloseWindowHost) {
  auto* host = sfmljs::SharedHandle<WindowHost>::From(info[0]);
  if (!host || !host->owner()->handle) return;
  DestroyWindow(host->owner()->handle);
  host->owner()->handle = nullptr;
}
#endif

NAN_METHOD(WatchCursor) {
  auto* cursor = sfmljs::SharedHandle<sf::Cursor>::From(info[0]);
  if (cursor) watchedCursor = cursor->owner();
}

NAN_METHOD(IsWatchedCursorAlive) {
  info.GetReturnValue().Set(!watchedCursor.expired());
}

NAN_METHOD(WindowEventFixtures) {
  const std::vector<sf::Event> events{
      sf::Event::Closed{},
      sf::Event::Resized{{800, 600}},
      sf::Event::FocusLost{},
      sf::Event::FocusGained{},
      sf::Event::TextEntered{U'\U0001F642'},
      sf::Event::KeyPressed{sf::Keyboard::Key::Unknown, sf::Keyboard::Scan::A,
                            true, false, true, false},
      sf::Event::KeyReleased{sf::Keyboard::Key::Escape, sf::Keyboard::Scan::Escape,
                             false, true, false, true},
      sf::Event::MouseWheelScrolled{sf::Mouse::Wheel::Horizontal, -1.5f, {-12, 34}},
      sf::Event::MouseButtonPressed{sf::Mouse::Button::Extra1, {-1, 2}},
      sf::Event::MouseButtonReleased{sf::Mouse::Button::Extra2, {3, -4}},
      sf::Event::MouseMoved{{-5, 6}},
      sf::Event::MouseMovedRaw{{-7, 8}},
      sf::Event::MouseEntered{},
      sf::Event::MouseLeft{},
      sf::Event::JoystickButtonPressed{2, 17},
      sf::Event::JoystickButtonReleased{3, 18},
      sf::Event::JoystickMoved{4, sf::Joystick::Axis::PovY, -37.5f},
      sf::Event::JoystickConnected{5},
      sf::Event::JoystickDisconnected{6},
      sf::Event::TouchBegan{1, {-9, 10}},
      sf::Event::TouchMoved{2, {11, -12}},
      sf::Event::TouchEnded{3, {-13, 14}},
      sf::Event::SensorChanged{sf::Sensor::Type::Gyroscope, {1.25f, -2.5f, 3.75f}},
  };
  auto result = Nan::New<v8::Array>(events.size());
  for (std::uint32_t i = 0; i < events.size(); ++i) {
    Nan::Set(result, i, sfmljs::WindowEvent(events[i])).FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(CompareVideoModes) {
  for (int i = 0; i < 6; ++i) {
    if (!info[i]->IsUint32()) return Nan::ThrowTypeError("Expected mode fields");
  }
  const sf::VideoMode a({Nan::To<unsigned>(info[0]).FromJust(),
                         Nan::To<unsigned>(info[1]).FromJust()},
                        Nan::To<unsigned>(info[2]).FromJust());
  const sf::VideoMode b({Nan::To<unsigned>(info[3]).FromJust(),
                         Nan::To<unsigned>(info[4]).FromJust()},
                        Nan::To<unsigned>(info[5]).FromJust());
  const bool values[]{a == b, a != b, a < b, a > b, a <= b, a >= b};
  auto result = Nan::New<v8::Array>(6);
  for (std::uint32_t i = 0; i < 6; ++i) {
    Nan::Set(result, i, Nan::New(values[i])).FromJust();
  }
  info.GetReturnValue().Set(result);
}

// Demo presentation only: leave event polling and display() to the JS Window.
NAN_METHOD(DrawWindowTexture) {
  auto* window = sfmljs::SharedHandle<sf::Window>::From(info[0]);
  if (!window) return;
  auto texture = sfmljs::ReadTexture(info[1]);
  if (!texture) return;
  if (!window->owner()->setActive()) return Nan::ThrowError("Inactive window");
#define GL_FUNCTION(name) \
  const auto name = reinterpret_cast<decltype(&::name)>( \
      sf::Context::getFunction(#name));
  GL_FUNCTION(glViewport)
  GL_FUNCTION(glDisable)
  GL_FUNCTION(glEnable)
  GL_FUNCTION(glMatrixMode)
  GL_FUNCTION(glLoadIdentity)
  GL_FUNCTION(glColor4f)
  GL_FUNCTION(glBegin)
  GL_FUNCTION(glTexCoord2f)
  GL_FUNCTION(glVertex2f)
  GL_FUNCTION(glEnd)
#undef GL_FUNCTION
  using BindFramebuffer = void (*)(GLenum, GLuint);
  auto bindFramebuffer = reinterpret_cast<BindFramebuffer>(
      sf::Context::getFunction("glBindFramebuffer"));
  if (!bindFramebuffer) bindFramebuffer = reinterpret_cast<BindFramebuffer>(
      sf::Context::getFunction("glBindFramebufferEXT"));
  // RenderTexture can reuse the window context and leave its FBO bound.
  if (bindFramebuffer) bindFramebuffer(0x8D40 /* GL_FRAMEBUFFER */, 0);
  const auto size = window->owner()->getSize();
  glViewport(0, 0, size.x, size.y);
  glDisable(GL_DEPTH_TEST);
  glDisable(GL_SCISSOR_TEST);
  glDisable(GL_CULL_FACE);
  glDisable(GL_BLEND);
  glEnable(GL_TEXTURE_2D);
  glMatrixMode(GL_PROJECTION);
  glLoadIdentity();
  glMatrixMode(GL_MODELVIEW);
  glLoadIdentity();
  sf::Texture::bind(texture.get());
  glColor4f(1, 1, 1, 1);
  glBegin(GL_TRIANGLE_STRIP);
  glTexCoord2f(0, 0); glVertex2f(-1, 1);
  glTexCoord2f(1, 0); glVertex2f(1, 1);
  glTexCoord2f(0, 1); glVertex2f(-1, -1);
  glTexCoord2f(1, 1); glVertex2f(1, -1);
  glEnd();
  sf::Texture::bind(nullptr);
}

}  // namespace

NAN_MODULE_INIT(InitializeWindowProbes) {
#ifdef _WIN32
  Nan::SetMethod(target, "createWindowHost", CreateWindowHost);
  Nan::SetMethod(target, "closeWindowHost", CloseWindowHost);
#endif
  Nan::SetMethod(target, "drawWindowTexture", DrawWindowTexture);
  Nan::SetMethod(target, "watchCursor", WatchCursor);
  Nan::SetMethod(target, "isWatchedCursorAlive", IsWatchedCursorAlive);
  Nan::SetMethod(target, "windowEventFixtures", WindowEventFixtures);
  Nan::SetMethod(target, "compareVideoModes", CompareVideoModes);
}
