#include "touch.h"
#include "render_window.h"
#include "vector2-inl.h"

namespace node_sfml {
namespace touch {

using std::map;
using std::string;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;
using v8::Value;

NAN_MODULE_INIT(Init) {
  Nan::SetMethod(target, "touchIsDown", IsDown);
  Nan::SetMethod(target, "touchGetPosition", GetPosition);
}

NAN_METHOD(IsDown) {
  sf::Uint32 finger = Nan::To<sf::Uint32>(info[0]).FromJust();

  info.GetReturnValue().Set(
      sf::Touch::isDown(finger));
  return;
}

NAN_METHOD(GetPosition) {
  sf::Uint32 finger = Nan::To<sf::Uint32>(info[0]).FromJust();
  sf::Vector2i pos;
  if (info.Length() == 1) {
    pos = sf::Touch::getPosition(finger);
  } else {
    Local<Object> window_object = info[1].As<Object>();
    render_window::RenderWindow* render_window =
        Nan::ObjectWrap::Unwrap<render_window::RenderWindow>(window_object);
    sf::RenderWindow* window = render_window->window();

    pos = sf::Touch::getPosition(finger, *window);
  }

  Nan::TryCatch try_catch;
  MaybeLocal<Value> ret =
      vector2::Vector2I::NewRealInstance(info.GetIsolate(), pos);
  if (ret.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(ret.ToLocalChecked());
}

}  // namespace touch
}  // namespace node_sfml
