#include "joystick.h"

namespace node_sfml {
namespace gen {
extern void InitJoystickAxis();
}  // namespace gen

namespace joystick {

using std::map;
using std::string;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;
using v8::Value;

NAN_MODULE_INIT(Init) {
  gen::InitJoystickAxis();

  Nan::SetMethod(target, "joystickIsConnected", IsConnected);
  Nan::SetMethod(target, "joystickGetButtonCount", GetButtonCount);
  Nan::SetMethod(target, "joystickHasAxis", HasAxis);
  Nan::SetMethod(target, "joystickIsButtonPressed", IsButtonPressed);
  Nan::SetMethod(target, "joystickGetAxisPosition", GetAxisPosition);
  Nan::SetMethod(target, "joystickGetIdentification", GetIdentification);
  Nan::SetMethod(target, "joystickUpdate", Update);

  Local<Object> axis = Nan::New<Object>();
  for (auto it = gen::joystick_axis_atoi.begin();
       it != gen::joystick_axis_atoi.end();
       it++) {
    Nan::Set(axis,
             Nan::New<String>(it->first).ToLocalChecked(),
             Nan::New(it->second));
  }

  Nan::Set(target, Nan::New<String>("joystickAxis").ToLocalChecked(), axis);
}

NAN_METHOD(IsConnected) {
  if (info.Length() != 1) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }

  sf::Uint32 joystick_id =
      Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  info.GetReturnValue().Set(sf::Joystick::isConnected(joystick_id));
}

NAN_METHOD(GetButtonCount) {
  if (info.Length() != 1) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }

  sf::Uint32 joystick_id =
      Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  info.GetReturnValue().Set(sf::Joystick::getButtonCount(joystick_id));
}

NAN_METHOD(HasAxis) {
  if (info.Length() != 2) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }

  sf::Uint32 joystick_id =
      Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  sf::Joystick::Axis axis = static_cast<sf::Joystick::Axis>(
      Nan::To<sf::Int32>(info[1].As<v8::Int32>()).FromJust());
  info.GetReturnValue().Set(sf::Joystick::hasAxis(joystick_id, axis));
}

NAN_METHOD(IsButtonPressed) {
  if (info.Length() != 2) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }

  sf::Uint32 joystick_id =
      Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  sf::Uint32 button = Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  info.GetReturnValue().Set(sf::Joystick::isButtonPressed(joystick_id, button));
}

NAN_METHOD(GetAxisPosition) {
  if (info.Length() != 2) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }

  sf::Uint32 joystick_id =
      Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  sf::Joystick::Axis axis = static_cast<sf::Joystick::Axis>(
      Nan::To<sf::Int32>(info[1].As<v8::Int32>()).FromJust());
  info.GetReturnValue().Set(sf::Joystick::getAxisPosition(joystick_id, axis));
}

NAN_METHOD(GetIdentification) {
  if (info.Length() != 1) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }

  sf::Uint32 joystick_id =
      Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  sf::Joystick::Identification identification =
      sf::Joystick::getIdentification(joystick_id);

  std::basic_string<sf::Uint16> name = identification.name.toUtf16();
  Local<String> v8_name =
      Nan::New<String>(name.c_str(), name.size()).ToLocalChecked();

  Local<Object> ret = Nan::New<Object>();
  Nan::Set(ret, Nan::New<String>("name").ToLocalChecked(), v8_name);
  Nan::Set(ret,
           Nan::New<String>("vendorId").ToLocalChecked(),
           Nan::New(identification.vendorId));
  Nan::Set(ret,
           Nan::New<String>("productId").ToLocalChecked(),
           Nan::New(identification.productId));
  info.GetReturnValue().Set(ret);
}

NAN_METHOD(Update) {
  sf::Joystick::update();
}

}  // namespace joystick
}  // namespace node_sfml
