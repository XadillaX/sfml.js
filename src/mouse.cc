#include "mouse.h"
#include "render_window.h"
#include "vector2-inl.h"

namespace node_sfml {
namespace gen {
extern void InitMouseButton();
}  // namespace gen

namespace mouse {

using std::map;
using std::string;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;

NAN_MODULE_INIT(Init) {
  gen::InitMouseButton();

  Nan::SetMethod(target, "isButtonPressed", IsButtonPressed);
  Nan::SetMethod(target, "getPosition", GetPosition);
  Nan::SetMethod(target, "setPosition", SetPosition);
}

NAN_METHOD(IsButtonPressed) {
  if (info[0]->IsInt32()) {
    sf::Int32 code = Nan::To<sf::Int32>(info[0]).FromJust();
    if (code >= sf::Mouse::Button::ButtonCount || code < 0) {
      Nan::ThrowRangeError("Out of button range.");
      return;
    }

    info.GetReturnValue().Set(
        sf::Mouse::isButtonPressed(static_cast<sf::Mouse::Button>(code)));
    return;
  }

  Local<String> v8_button_str = info[0].As<String>();
  Nan::Utf8String button_str_utf8(v8_button_str);

  map<string, int>::iterator code_it =
      gen::mouse_button_atoi.find(*button_str_utf8);
  if (code_it == gen::mouse_button_atoi.end()) {
    Nan::ThrowRangeError("No such button.");
    return;
  }

  info.GetReturnValue().Set(sf::Mouse::isButtonPressed(
      static_cast<sf::Mouse::Button>(code_it->second)));
}

NAN_METHOD(GetPosition) {
  sf::Vector2i pos;
  if (info.Length() == 0) {
    pos = sf::Mouse::getPosition();
  } else {
    Local<Object> window_object = info[0].As<Object>();
    render_window::RenderWindow* render_window =
        Nan::ObjectWrap::Unwrap<render_window::RenderWindow>(window_object);
    sf::RenderWindow* window = render_window->window();

    pos = sf::Mouse::getPosition(*window);
  }

  Nan::TryCatch try_catch;
  MaybeLocal<Object> ret =
      vector2::Vector2I::NewRealInstance(info.GetIsolate(), pos);
  if (ret.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

NAN_METHOD(SetPosition) {
  vector2::Vector2I* pos =
      Nan::ObjectWrap::Unwrap<vector2::Vector2I>(info[0].As<Object>());

  if (info.Length() <= 1) {
    sf::Mouse::setPosition(pos->vector2());
  } else {
    Local<Object> window_object = info[1].As<Object>();
    render_window::RenderWindow* render_window =
        Nan::ObjectWrap::Unwrap<render_window::RenderWindow>(window_object);
    sf::RenderWindow* window = render_window->window();
    sf::Mouse::setPosition(pos->vector2(), *window);
  }
}

}  // namespace mouse
}  // namespace node_sfml
