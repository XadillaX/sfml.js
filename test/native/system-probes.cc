#include "../../native/exception-boundary.h"
#include "../../native/time-value.h"

#include <SFML/Config.hpp>
#include <SFML/System/SuspendAwareClock.hpp>
#include <SFML/System/TimeoutWithPredicate.hpp>
#include <SFML/System/Version.hpp>

#include <functional>

namespace {

NAN_METHOD(InspectVersion) {
  const auto& version = sf::version();
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("major").ToLocalChecked(),
      Nan::New(static_cast<int>(version.major))).FromJust();
  Nan::Set(result, Nan::New("minor").ToLocalChecked(),
      Nan::New(static_cast<int>(version.minor))).FromJust();
  Nan::Set(result, Nan::New("patch").ToLocalChecked(),
      Nan::New(static_cast<int>(version.patch))).FromJust();
  Nan::Set(result, Nan::New("isRelease").ToLocalChecked(),
      Nan::New(version.isRelease)).FromJust();
  Nan::Set(result, Nan::New("string").ToLocalChecked(),
      Nan::New(version.string.data(), static_cast<int>(version.string.size()))
          .ToLocalChecked()).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(InspectTimeoutWithPredicate) {
  if (!info[0]->IsBigInt() && !info[0]->IsFunction() && !info[0]->IsNull()) {
    return Nan::ThrowTypeError("Expected a duration, predicate or null");
  }
  sf::Time duration;
  if (info[0]->IsBigInt() && !sfmljs::ReadTime(info[0], duration)) return;
  sf::Time period;
  if (!info[1]->IsUndefined() && !sfmljs::ReadTime(info[1], period)) return;

  int calls = 0;
  bool failed = false;
  std::function<bool()> predicate;
  if (info[0]->IsFunction()) {
    predicate = [&] {
      ++calls;
      v8::Local<v8::Value> value;
      if (!info[0].As<v8::Function>()->Call(
              Nan::GetCurrentContext(), Nan::Undefined(), 0, nullptr)
               .ToLocal(&value)) {
        failed = true;
        return false;
      }
      return value->BooleanValue(info.GetIsolate());
    };
  }
  const auto source = [&] {
    if (info[0]->IsBigInt()) return sf::TimeoutWithPredicate(duration);
    if (info[1]->IsUndefined()) return sf::TimeoutWithPredicate(predicate);
    return sf::TimeoutWithPredicate(predicate, period);
  }();
  const sf::TimeoutWithPredicate copy(source);
  const auto& timeout = Nan::To<bool>(info[2]).FromMaybe(false) ? copy : source;
  const auto& storedPredicate = timeout.getPredicate();
  const auto& storedPeriod = timeout.getPeriod();
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("period").ToLocalChecked(),
           sfmljs::WriteTime(info.GetIsolate(), storedPeriod)).FromJust();
  Nan::Set(result, Nan::New("hasPredicate").ToLocalChecked(),
           Nan::New(static_cast<bool>(storedPredicate))).FromJust();
  Nan::Set(result, Nan::New("stableGetters").ToLocalChecked(),
           Nan::New(&storedPredicate == &timeout.getPredicate() &&
                    &storedPeriod == &timeout.getPeriod())).FromJust();
  Nan::Set(result, Nan::New("callsBefore").ToLocalChecked(),
           Nan::New(calls)).FromJust();
  auto evaluations = Nan::New<v8::Array>(3);
  for (std::uint32_t i = 0; i < 3; ++i) {
    const bool value = storedPredicate();
    if (failed) return;  // Preserve the original pending JS exception.
    Nan::Set(evaluations, i, Nan::New(value)).FromJust();
  }
  Nan::Set(result, Nan::New("results").ToLocalChecked(), evaluations).FromJust();
  Nan::Set(result, Nan::New("callsAfter").ToLocalChecked(),
           Nan::New(calls)).FromJust();
  info.GetReturnValue().Set(result);
}

#ifdef SFML_SYSTEM_ANDROID
NAN_METHOD(SuspendAwareClockOracle) {
  info.GetReturnValue().Set(v8::BigInt::New(info.GetIsolate(),
      sf::SuspendAwareClock::now().time_since_epoch().count()));
}
#endif

}  // namespace

NAN_MODULE_INIT(InitializeSystemProbes) {
  sfmljs::SetMethod<InspectVersion>(target, "inspectVersion");
  sfmljs::SetMethod<InspectTimeoutWithPredicate>(
      target, "inspectTimeoutWithPredicate");
  Nan::Set(target, Nan::New("suspendAwareClockSteady").ToLocalChecked(),
           Nan::New(sf::SuspendAwareClock::is_steady)).FromJust();
#ifdef SFML_SYSTEM_ANDROID
  constexpr bool supported = true;
  sfmljs::SetMethod<SuspendAwareClockOracle>(target, "suspendAwareClockOracle");
#else
  constexpr bool supported = false;
#endif
  Nan::Set(target, Nan::New("suspendAwareClockSupported").ToLocalChecked(),
           Nan::New(supported)).FromJust();
}
