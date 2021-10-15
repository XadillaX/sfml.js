#include "keyboard.h"

namespace node_sfml {
namespace gen {
extern void InitKeyCode();
}  // namespace gen

namespace keyboard {

using std::map;
using std::string;
using v8::Local;
using v8::String;

NAN_MODULE_INIT(Init) {
  gen::InitKeyCode();

  Nan::SetMethod(target, "isKeyPressed", IsKeyPressed);
  Nan::SetMethod(
      target, "setVirtualKeyboardVisible", SetVirtualKeyboardVisible);
}

NAN_METHOD(IsKeyPressed) {
  if (info[0]->IsInt32()) {
    sf::Int32 code = Nan::To<sf::Int32>(info[0]).FromJust();
    if (code >= sf::Keyboard::KeyCount || code < sf::Keyboard::Unknown) {
      Nan::ThrowRangeError("Out of key count.");
      return;
    }

    info.GetReturnValue().Set(
        sf::Keyboard::isKeyPressed(static_cast<sf::Keyboard::Key>(code)));
    return;
  }

  Local<String> v8_key_str = info[0].As<String>();
  Nan::Utf8String key_str_utf8(v8_key_str);

  map<string, int>::iterator code_it = gen::keycode_atoi.find(*key_str_utf8);
  if (code_it == gen::keycode_atoi.end()) {
    Nan::ThrowRangeError("No such key.");
    return;
  }

  info.GetReturnValue().Set(sf::Keyboard::isKeyPressed(
      static_cast<sf::Keyboard::Key>(code_it->second)));
}

NAN_METHOD(SetVirtualKeyboardVisible) {
  sf::Keyboard::setVirtualKeyboardVisible(Nan::To<bool>(info[0]).FromJust());
}

}  // namespace keyboard
}  // namespace node_sfml
