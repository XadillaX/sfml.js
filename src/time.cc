#include "time.h"

namespace node_sfml {
namespace time {

using v8::BigInt;
using v8::Context;
using v8::Function;
using v8::FunctionTemplate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;

Nan::Persistent<Function> constructor;

NAN_MODULE_INIT(Time::Init) {
  Local<String> name = Nan::New("Time").ToLocalChecked();

  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  Nan::SetPrototypeMethod(tpl, "asSeconds", AsSeconds);
  Nan::SetPrototypeMethod(tpl, "asMilliseconds", AsMilliseconds);
  Nan::SetPrototypeMethod(tpl, "asMicroseconds", AsMicroseconds);

  tpl->SetClassName(name);
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Function> func = Nan::GetFunction(tpl).ToLocalChecked();
  constructor.Reset(func);

  Nan::Set(target, name, func);

  {
    Local<Object> new_time_type = Nan::New<Object>();

#define SET_NEW_TIME_TYPE(V)                                                   \
  V(kSeconds)                                                                  \
  V(kMilliseconds)                                                             \
  V(kMicroseconds)

#define SET_PER_NEW_TIME_TYPE(name)                                            \
  Nan::Set(new_time_type,                                                      \
           Nan::New(#name).ToLocalChecked(),                                   \
           Nan::New(NewTimeType::name));

    SET_NEW_TIME_TYPE(SET_PER_NEW_TIME_TYPE)

#undef SET_PER_NEW_TIME_TYPE
#undef SET_NEW_TIME_TYPE

    Nan::Set(func, Nan::New("NewTimeType").ToLocalChecked(), new_time_type);
  }
}

NAN_METHOD(Time::New) {
  Time* time = nullptr;

  if (info.Length() == 0) {
    time = new Time();
    time->Wrap(info.This());
    info.GetReturnValue().Set(info.This());
    return;
  }

  if (!info[0]->IsUint32()) {
    Nan::ThrowTypeError("Unexpected new time type.");
    return;
  }

  sf::Uint32 new_type = Nan::To<sf::Uint32>(info[0]).FromJust();
  if (new_type >= NewTimeType::kCount) {
    Nan::ThrowRangeError("Unexpected new time type range");
    return;
  }

#define SWITCH_VAL                                                             \
  switch (new_type) {                                                          \
    case NewTimeType::kSeconds: {                                              \
      time = new Time(sf::seconds(val));                                       \
      break;                                                                   \
    }                                                                          \
                                                                               \
    case NewTimeType::kMilliseconds: {                                         \
      time = new Time(sf::milliseconds(val));                                  \
      break;                                                                   \
    }                                                                          \
                                                                               \
    case NewTimeType::kMicroseconds: {                                         \
      time = new Time(sf::microseconds(val));                                  \
      break;                                                                   \
    }                                                                          \
                                                                               \
    default:                                                                   \
      break;                                                                   \
  }                                                                            \
                                                                               \
  time->Wrap(info.This());                                                     \
  info.GetReturnValue().Set(info.This());                                      \
  return

  Local<Context> context = info.GetIsolate()->GetCurrentContext();
  if (info[1]->IsBigInt()) {
    Local<BigInt> big_int = info[1]->ToBigInt(context).ToLocalChecked();
    sf::Int64 val = big_int->Int64Value();
    SWITCH_VAL;
  } else if (info[1]->IsInt32()) {
    // `float` patch
    if (new_type == NewTimeType::kSeconds) {
      Local<Number> num = Nan::To<Number>(info[1]).ToLocalChecked();
      double val = num->NumberValue(context).ToChecked();
      time = new Time(sf::seconds(static_cast<float>(val)));
      time->Wrap(info.This());
      info.GetReturnValue().Set(info.This());
      return;
    }

    Local<v8::Int32> int_val = Nan::To<v8::Int32>(info[1]).ToLocalChecked();
    sf::Int32 val = int_val->Int32Value(context).FromJust();
    SWITCH_VAL;
  } else if (info[1]->IsNumber()) {
    Local<Number> num = Nan::To<Number>(info[1]).ToLocalChecked();
    double val = num->NumberValue(context).ToChecked();
    SWITCH_VAL;
  }

#undef SWITCH_VAL

  Nan::ThrowTypeError("Unexpected time value type.");
  return;
}

NAN_METHOD(Time::AsSeconds) {
  Time* time = Nan::ObjectWrap::Unwrap<Time>(info.Holder());
  info.GetReturnValue().Set(time->_time.asSeconds());
}

NAN_METHOD(Time::AsMilliseconds) {
  Time* time = Nan::ObjectWrap::Unwrap<Time>(info.Holder());
  info.GetReturnValue().Set(time->_time.asMilliseconds());
}

NAN_METHOD(Time::AsMicroseconds) {
  Time* time = Nan::ObjectWrap::Unwrap<Time>(info.Holder());
  Local<BigInt> big_int =
      BigInt::New(info.GetIsolate(), time->_time.asMicroseconds());
  info.GetReturnValue().Set(big_int);
}

Time::Time() {}
Time::Time(const sf::Time& src) {
  memcpy(&_time, &src, sizeof(sf::Time));
}
Time::~Time() {}

}  // namespace time
}  // namespace node_sfml
