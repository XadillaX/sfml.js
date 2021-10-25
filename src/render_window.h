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

  static NAN_METHOD(Clear);
  static NAN_METHOD(Close);
  static NAN_METHOD(Display);
  static NAN_METHOD(DrawDrawable);
  static NAN_METHOD(IsOpen);
  static NAN_METHOD(PollEvent);
  static NAN_METHOD(GetSize);

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

}  // namespace render_window
}  // namespace node_sfml

#endif  // SRC_RENDER_WINDOW_H_
