#ifndef SRC_RENDER_WINDOW_H_
#define SRC_RENDER_WINDOW_H_

#include <nan.h>

#include <SFML/Graphics/RenderWindow.hpp>
#include <SFML/Window/Event.hpp>

namespace node_sfml {
namespace render_window {

class RenderWindow : public Nan::ObjectWrap {
 public:
  static NAN_MODULE_INIT(Init);

  inline sf::RenderWindow* window() { return _window; }

 private:
  static NAN_METHOD(New);

  static NAN_METHOD(Create);
  static NAN_METHOD(Capture);
  static NAN_METHOD(Clear);
  static NAN_METHOD(Close);
  static NAN_METHOD(Display);
  static NAN_METHOD(DisplayAsync);
  static NAN_METHOD(DrawDrawable);
  static NAN_METHOD(IsOpen);
  static NAN_METHOD(PollEvent);
  static NAN_METHOD(GetSize);
  static NAN_METHOD(HasFocus);
  static NAN_METHOD(GetPosition);
  static NAN_METHOD(SetPosition);
  static NAN_METHOD(SetTitle);
  static NAN_METHOD(SetJoystickThreshold);
  static NAN_METHOD(SetIcon);
  static NAN_METHOD(GetSettings);
  static NAN_METHOD(RequestFocus);

#define PRIMITIVE_VALUES(V)                                                    \
  V(Visible, bool)                                                             \
  V(VerticalSyncEnabled, bool)                                                 \
  V(MouseCursorVisible, bool)                                                  \
  V(MouseCursorGrabbed, bool)                                                  \
  V(KeyRepeatEnabled, bool)                                                    \
  V(FramerateLimit, sf::Uint32)                                                \
  V(Active, bool)

#define DECLARE_PRIMITIVE_VALUE_NAN_METHOD(name, _)                            \
  static NAN_METHOD(Set##name);

  PRIMITIVE_VALUES(DECLARE_PRIMITIVE_VALUE_NAN_METHOD);

#undef DECLARE_PRIMITIVE_VALUE_NAN_METHOD

 private:
  RenderWindow();
  ~RenderWindow();

  // TODO(XadillaX): Support `ContextSettings`.
  RenderWindow(
      sf::VideoMode mode,
      v8::Local<v8::String> title,
      sf::Uint32 style = sf::Style::Default /* , */
      /* const sf::ContextSettings& settings = sf::ContextSettings() */);

 private:
  sf::RenderWindow* _window;
  sf::Event _event;
};

class AsyncRenderWindowDisplay : public Nan::AsyncWorker {
 public:
  AsyncRenderWindowDisplay(sf::RenderWindow* window, Nan::Callback* callback);
  void Execute();
  void HandleOKCallback();
  void HandleErrorCallback();

 private:
  sf::RenderWindow* window;
};

}  // namespace render_window
}  // namespace node_sfml

#endif  // SRC_RENDER_WINDOW_H_
