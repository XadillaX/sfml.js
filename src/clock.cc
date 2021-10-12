#include "clock.h"
#include "time.h"

namespace node_sfml {
namespace clock {

using v8::Function;
using v8::FunctionTemplate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::String;

Nan::Persistent<Function> constructor;

NAN_MODULE_INIT(Clock::Init) {
  Local<String> name = Nan::New("Clock").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "getElapsedTime", GetElapsedTime);
  Nan::SetPrototypeMethod(tpl, "restart", Restart);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);
}

NAN_METHOD(Clock::New) {
  Clock* clock = new Clock();
  clock->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(Clock::GetElapsedTime) {
  Clock* clock = Nan::ObjectWrap::Unwrap<Clock>(info.Holder());
  sf::Time time = clock->getElapsedTime();
  Nan::TryCatch try_catch;
  MaybeLocal<Object> time_wrap =
      time::Time::NewInstance(info.GetIsolate(), time);
  if (time_wrap.IsEmpty()) {
    try_catch.ReThrow();
    return;
  }

  info.GetReturnValue().Set(time_wrap.ToLocalChecked());
}

NAN_METHOD(Clock::Restart) {
  Clock* clock = Nan::ObjectWrap::Unwrap<Clock>(info.Holder());
  clock->restart();
}

Clock::Clock() {}
Clock::~Clock() {}

}  // namespace clock
}  // namespace node_sfml
