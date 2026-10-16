#include "exception-boundary.h"
#include "shared-handle.h"

#include <SFML/Config.hpp>
#include <SFML/System/String.hpp>
#include <SFML/System/Version.hpp>
#ifdef SFML_SYSTEM_ANDROID
#include <SFML/System/SuspendAwareClock.hpp>
#endif

#include <string>

namespace {

/** 将 JS UTF-16 索引转换为 SFML 码点索引，再查询对应边界。 */
NAN_METHOD(IsUnicodeBoundary) {
  if (!info[0]->IsString()) return Nan::ThrowTypeError("Expected a string");
  if (!info[1]->IsUint32()) {
    return Nan::ThrowRangeError("Expected a UTF-16 index within the string");
  }
  if (!info[2]->IsUint32() || Nan::To<std::uint32_t>(info[2]).FromJust() > 2) {
    return Nan::ThrowRangeError("Unknown Unicode boundary kind");
  }
  v8::String::Value input(info.GetIsolate(), info[0]);
  const auto position = Nan::To<std::uint32_t>(info[1]).FromJust();
  const auto length = static_cast<std::uint32_t>(input.length());
  if (position > length) {
    return Nan::ThrowRangeError("UTF-16 index is outside the string");
  }
  if (!position || position == length) {
    info.GetReturnValue().Set(true);
    return;
  }
  std::u32string points;
  points.reserve(length);
  std::size_t offset = 0;
  for (std::uint32_t i = 0; i < length; ++i) {
    if (i == position) offset = points.size();
    char32_t point = (*input)[i];
    if (point >= 0xd800 && point <= 0xdbff && i + 1 < length &&
        (*input)[i + 1] >= 0xdc00 && (*input)[i + 1] <= 0xdfff) {
      if (position == i + 1) {
        info.GetReturnValue().Set(false);
        return;
      }
      point = 0x10000 + (point - 0xd800) * 0x400 + (*input)[++i] - 0xdc00;
    } else if (point >= 0xd800 && point <= 0xdfff) {
      point = 0xfffd;
    }
    points.push_back(point);
  }
  const auto text = sf::String::fromUtf32(points.begin(), points.end());
  const auto kind = Nan::To<std::uint32_t>(info[2]).FromJust();
  info.GetReturnValue().Set(kind == 0 ? text.isGraphemeBoundary(offset)
      : kind == 1 ? text.isWordBoundary(offset) : text.isSentenceBoundary(offset));
}

NAN_METHOD(GetVersion) {
  // Own a copy so the backing store never exposes read-only library pages.
  auto value = std::make_shared<sf::Version>(sf::version());
  static_assert(offsetof(sf::Version, major) == 0);
  static_assert(offsetof(sf::Version, minor) == 1);
  static_assert(offsetof(sf::Version, patch) == 2);
  static_assert(offsetof(sf::Version, isRelease) == 3);
  static_assert(sizeof(bool) == 1);
  auto result = Nan::New<v8::Object>();
  Nan::Set(result, Nan::New("buffer").ToLocalChecked(),
           sfmljs::MapShared(info.GetIsolate(), value, value.get(), 4)).FromJust();
  Nan::Set(result, Nan::New("string").ToLocalChecked(),
           Nan::New(value->string.data(), static_cast<int>(value->string.size()))
               .ToLocalChecked()).FromJust();
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SuspendAwareClockNow) {
#ifdef SFML_SYSTEM_ANDROID
  info.GetReturnValue().Set(v8::BigInt::New(info.GetIsolate(),
      sf::SuspendAwareClock::now().time_since_epoch().count()));
#else
  sfmljs::ThrowError(
      "SuspendAwareClock is only supported by SFML on Android");
#endif
}

}  // namespace

NAN_MODULE_INIT(InitializeSystem) {
  sfmljs::SetMethod<IsUnicodeBoundary>(target, "isUnicodeBoundary");
  sfmljs::SetMethod<GetVersion>(target, "getVersion");
  sfmljs::SetMethod<SuspendAwareClockNow>(target, "suspendAwareClockNow");
}
