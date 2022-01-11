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

  Nan::SetMethod(target, "isConnected", IsConnected);
  Nan::SetMethod(target, "getButtonCount", GetButtonCount);
  Nan::SetMethod(target, "hasAxis", HasAxis);
  Nan::SetMethod(target, "isButtonPressed", IsButtonPressed);
  Nan::SetMethod(target, "getAxisPosition", GetAxisPosition);
  Nan::SetMethod(target, "getIdentification", GetIdentification);
  Nan::SetMethod(target, "update", Update);

  
  Local<Object> axis = Nan::New<Object>();
  for (auto it = gen::joystick_axis_atoi.begin(); it != gen::joystick_axis_atoi.end();
       it++) {
    Nan::Set(axis,
             Nan::New<String>(it->first).ToLocalChecked(),
             Nan::New(it->second));
  }

  Nan::Set(target, Nan::New<String>("Axis").ToLocalChecked(), axis);
}

NAN_METHOD(IsConnected) {
  if (info.Length() != 1) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }
  
  auto joystickId = Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  info.GetReturnValue().Set(sf::Joystick::isConnected(joystickId));
}

NAN_METHOD(GetButtonCount) {
  if (info.Length() != 1) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }
  
  auto joystickId = Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  info.GetReturnValue().Set(sf::Joystick::getButtonCount(joystickId));
}

NAN_METHOD(HasAxis) {
  if (info.Length() != 2) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }
  
  auto joystickId = Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  auto axis = static_cast<sf::Joystick::Axis>(Nan::To<sf::Int32>(info[1].As<v8::Int32>()).FromJust());
  info.GetReturnValue().Set(sf::Joystick::hasAxis(joystickId, axis));
}

NAN_METHOD(IsButtonPressed) {
  if (info.Length() != 2) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }
  
  auto joystickId = Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  auto button = Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  info.GetReturnValue().Set(sf::Joystick::isButtonPressed(joystickId, button));
}

NAN_METHOD(GetAxisPosition) {
  if (info.Length() != 2) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }
  
  auto joystickId = Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  auto axis = static_cast<sf::Joystick::Axis>(Nan::To<sf::Int32>(info[1].As<v8::Int32>()).FromJust());
  info.GetReturnValue().Set(sf::Joystick::getAxisPosition(joystickId, axis));
}

NAN_METHOD(GetIdentification) {
  if (info.Length() != 1) {
    Nan::ThrowError("Invalid arguments count.");
    return;
  }
  
  auto joystickId = Nan::To<sf::Uint32>(info[0].As<v8::Uint32>()).FromJust();
  auto identification = sf::Joystick::getIdentification(joystickId);

  Local<Object> ret = Nan::New<Object>();
  Nan::Set(ret,
           Nan::New<String>("name").ToLocalChecked(),
           Nan::New<String>(identification.name).ToLocalChecked());
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

}  // namespace mouse
}  // namespace node_sfml
