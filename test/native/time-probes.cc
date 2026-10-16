#include "../../native/time-value.h"
#include "value-oracle.h"

#include <SFML/System/Clock.hpp>
#include <cmath>
#include <limits>

namespace {

void SetTime(v8::Local<v8::Object> object, const char* key, sf::Time value) {
  Nan::Set(object, Nan::New(key).ToLocalChecked(),
           sfmljs::WriteTime(v8::Isolate::GetCurrent(), value)).FromJust();
}

NAN_METHOD(InspectTime) {
  sf::Time value;
  if (!sfmljs::ReadTime(info[0], value)) return;
  auto result = Nan::New<v8::Object>();
  sfmljs::Set(result, "seconds", value.asSeconds());
  sfmljs::Set(result, "milliseconds", value.asMilliseconds());
  SetTime(result, "microseconds", value);
  SetTime(result, "duration", sf::Time(value.toDuration()));
  SetTime(result, "zero", sf::Time::Zero);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(TimeFromSeconds) {
  if (!info[0]->IsNumber()) return Nan::ThrowTypeError("Expected a number");
  const float amount = static_cast<float>(Nan::To<double>(info[0]).FromJust());
  const float count = amount * 1000000.f;
  // Casting an out-of-range float to int64 in SFML would be undefined.
  if (!std::isfinite(count) || static_cast<double>(count) < -0x1p63 ||
      static_cast<double>(count) >= 0x1p63) {
    return Nan::ThrowRangeError("Seconds exceed the int64 domain");
  }
  info.GetReturnValue().Set(sfmljs::WriteTime(info.GetIsolate(),
                                            sf::seconds(amount)));
}

NAN_METHOD(TimeFromMilliseconds) {
  if (!info[0]->IsNumber()) return Nan::ThrowTypeError("Expected a number");
  const double amount = std::trunc(Nan::To<double>(info[0]).FromJust());
  if (!std::isfinite(amount) ||
      amount < std::numeric_limits<std::int32_t>::min() ||
      amount > std::numeric_limits<std::int32_t>::max()) {
    return Nan::ThrowRangeError("Milliseconds exceed the int32 domain");
  }
  info.GetReturnValue().Set(sfmljs::WriteTime(info.GetIsolate(),
      sf::milliseconds(static_cast<std::int32_t>(amount))));
}

template <typename Scalar>
void Evaluate(const Nan::FunctionCallbackInfo<v8::Value>& info,
              sf::Time lhs, sf::Time rhs, Scalar scalar) {
  auto result = Nan::New<v8::Object>();
  SetTime(result, "add", lhs + rhs);
  SetTime(result, "subtract", lhs - rhs);
  SetTime(result, "negate", -lhs);
  SetTime(result, "multiply", lhs * scalar);
  SetTime(result, "leftMultiply", scalar * lhs);
  SetTime(result, "divide", lhs / scalar);
  SetTime(result, "modulo", lhs % rhs);
  auto value = lhs;
  SetTime(result, "addAssign", value += rhs);
  value = lhs;
  SetTime(result, "subtractAssign", value -= rhs);
  value = lhs;
  SetTime(result, "multiplyAssign", value *= scalar);
  value = lhs;
  SetTime(result, "divideAssign", value /= scalar);
  value = lhs;
  SetTime(result, "moduloAssign", value %= rhs);
  sfmljs::Set(result, "ratio", lhs / rhs);
  sfmljs::Set(result, "equal", lhs == rhs);
  sfmljs::Set(result, "notEqual", lhs != rhs);
  sfmljs::Set(result, "less", lhs < rhs);
  sfmljs::Set(result, "lessEqual", lhs <= rhs);
  sfmljs::Set(result, "greater", lhs > rhs);
  sfmljs::Set(result, "greaterEqual", lhs >= rhs);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(EvaluateTime) {
  sf::Time lhs, rhs;
  if (!sfmljs::ReadTime(info[0], lhs) || !sfmljs::ReadTime(info[1], rhs)) return;
  // Keep every intermediate inside the defined C++ arithmetic domain.
  if (std::abs(static_cast<double>(lhs.asMicroseconds())) > 1e12 ||
      std::abs(static_cast<double>(rhs.asMicroseconds())) > 1e12 ||
      rhs == sf::Time::Zero) {
    return Nan::ThrowRangeError("Time oracle operands are outside its domain");
  }
  if (info[2]->IsBigInt()) {
    sf::Time scalar;
    if (!sfmljs::ReadTime(info[2], scalar)) return;
    const auto count = scalar.asMicroseconds();
    if (count == 0 || count < -100000 || count > 100000) {
      return Nan::ThrowRangeError("Time oracle integer scalar is out of range");
    }
    Evaluate(info, lhs, rhs, count);
  } else if (info[2]->IsNumber()) {
    const float scalar = static_cast<float>(Nan::To<double>(info[2]).FromJust());
    if (!std::isfinite(scalar) || std::abs(scalar) < 1e-4f ||
        std::abs(scalar) > 1e4f) {
      return Nan::ThrowRangeError("Time oracle float scalar is out of range");
    }
    Evaluate(info, lhs, rhs, scalar);
  } else {
    Nan::ThrowTypeError("Expected a number or bigint scalar");
  }
}

NAN_METHOD(ClockStates) {
  sf::Clock clock;
  auto states = Nan::New<v8::Array>();
  std::uint32_t index = 0;
  const auto record = [&] {
    Nan::Set(states, index++, Nan::New(clock.isRunning())).FromJust();
  };
  record();
  clock.stop();
  record();
  clock.stop();
  record();
  clock.start();
  record();
  clock.start();
  record();
  static_cast<void>(clock.reset());
  record();
  static_cast<void>(clock.restart());
  record();
  info.GetReturnValue().Set(states);
}

}  // namespace

NAN_MODULE_INIT(InitializeTimeProbes) {
  Nan::SetMethod(target, "inspectTime", InspectTime);
  Nan::SetMethod(target, "timeFromSeconds", TimeFromSeconds);
  Nan::SetMethod(target, "timeFromMilliseconds", TimeFromMilliseconds);
  Nan::SetMethod(target, "evaluateTime", EvaluateTime);
  Nan::SetMethod(target, "clockStates", ClockStates);
}
