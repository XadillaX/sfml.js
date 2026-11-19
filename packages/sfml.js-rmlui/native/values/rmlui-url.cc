// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/URL.h>
#include <sfml-js-interop.h>

#include <limits>
#include <memory>

#include "native/values/rmlui-string.h"

namespace sfmlrmlui {
namespace {

using URLHandle = sfmljs::SharedHandle<Rml::URL>;

NAN_METHOD(CreateURL) {
  Rml::String value;
  if (!ReadString(info[0], &value)) {
    return;
  }

  info.GetReturnValue().Set(
      URLHandle::Create(std::make_shared<Rml::URL>(value)));
}

template <auto getter>
NAN_METHOD(GetURLString) {
  if (auto* handle = URLHandle::From(info[0])) {
    info.GetReturnValue().Set(WriteString((handle->owner().get()->*getter)()));
  }
}

template <auto setter>
NAN_METHOD(SetURLString) {
  Rml::String value;
  if (!ReadString(info[1], &value)) {
    return;
  }

  if (auto* handle = URLHandle::From(info[0])) {
    info.GetReturnValue().Set((handle->owner().get()->*setter)(value));
  }
}

NAN_METHOD(GetPort) {
  if (auto* handle = URLHandle::From(info[0])) {
    info.GetReturnValue().Set(Nan::New(handle->owner()->GetPort()));
  }
}

NAN_METHOD(SetPort) {
  int64_t port = 0;
  if (!ReadStringInteger(info[1],
                         std::numeric_limits<int32_t>::min(),
                         std::numeric_limits<int32_t>::max(),
                         &port)) {
    return;
  }

  if (auto* handle = URLHandle::From(info[0])) {
    info.GetReturnValue().Set(handle->owner()->SetPort(static_cast<int>(port)));
  }
}

NAN_METHOD(GetParameters) {
  auto* handle = URLHandle::From(info[0]);
  if (!handle) {
    return;
  }

  auto result = Nan::New<v8::Object>();
  for (const auto& [key, value] : handle->owner()->GetParameters()) {
    result
        ->CreateDataProperty(
            Nan::GetCurrentContext(), WriteString(key), WriteString(value))
        .FromJust();
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(SetParameter) {
  Rml::String name;
  Rml::String value;
  if (!ReadString(info[1], &name) || !ReadString(info[2], &value)) {
    return;
  }

  if (auto* handle = URLHandle::From(info[0])) {
    handle->owner()->SetParameter(name, value);
  }
}

NAN_METHOD(SetParameters) {
  if (!info[1]->IsObject() || info[1]->IsArray()) {
    return Nan::ThrowTypeError("Expected a string parameter object");
  }
  auto object = info[1].As<v8::Object>();
  v8::Local<v8::Array> keys;
  if (!object->GetOwnPropertyNames(Nan::GetCurrentContext()).ToLocal(&keys)) {
    return;
  }

  // Accessors can call back into the URL. Gather and validate first so failures
  // never apply a partially parsed map or retain a raw receiver across JS.
  Rml::URL::Parameters parameters;
  for (uint32_t i = 0; i < keys->Length(); ++i) {
    v8::Local<v8::Value> key;
    v8::Local<v8::Value> value;
    Rml::String name;
    Rml::String text;
    if (!Nan::Get(keys, i).ToLocal(&key) ||
        !Nan::Get(object, key).ToLocal(&value) || !ReadString(key, &name) ||
        !ReadString(value, &text)) {
      return;
    }
    parameters.emplace(std::move(name), std::move(text));
  }

  if (auto* handle = URLHandle::From(info[0])) {
    handle->owner()->SetParameters(parameters);
  }
}

NAN_METHOD(ClearParameters) {
  if (auto* handle = URLHandle::From(info[0])) {
    handle->owner()->ClearParameters();
  }
}

NAN_METHOD(URLLessThan) {
  auto* lhs = URLHandle::From(info[0]);
  if (!lhs) {
    return;
  }
  auto* rhs = URLHandle::From(info[1]);
  if (rhs) {
    info.GetReturnValue().Set(*lhs->owner() < *rhs->owner());
  }
}

template <auto operation>
NAN_METHOD(URLCodec) {
  Rml::String value;
  if (ReadString(info[0], &value)) {
    info.GetReturnValue().Set(WriteString(operation(value)));
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlURL) {
  SetStringMethod<CreateURL>(target, "createURL");
  SetStringMethod<GetURLString<&Rml::URL::GetURL>>(target, "urlGetURL");
  SetStringMethod<SetURLString<&Rml::URL::SetURL>>(target, "urlSetURL");
  SetStringMethod<GetURLString<&Rml::URL::GetProtocol>>(target,
                                                        "urlGetProtocol");
  SetStringMethod<SetURLString<&Rml::URL::SetProtocol>>(target,
                                                        "urlSetProtocol");
  SetStringMethod<GetURLString<&Rml::URL::GetLogin>>(target, "urlGetLogin");
  SetStringMethod<SetURLString<&Rml::URL::SetLogin>>(target, "urlSetLogin");
  SetStringMethod<GetURLString<&Rml::URL::GetPassword>>(target,
                                                        "urlGetPassword");
  SetStringMethod<SetURLString<&Rml::URL::SetPassword>>(target,
                                                        "urlSetPassword");
  SetStringMethod<GetURLString<&Rml::URL::GetHost>>(target, "urlGetHost");
  SetStringMethod<SetURLString<&Rml::URL::SetHost>>(target, "urlSetHost");
  SetStringMethod<GetPort>(target, "urlGetPort");
  SetStringMethod<SetPort>(target, "urlSetPort");
  SetStringMethod<GetURLString<&Rml::URL::GetPath>>(target, "urlGetPath");
  SetStringMethod<SetURLString<&Rml::URL::SetPath>>(target, "urlSetPath");
  SetStringMethod<SetURLString<&Rml::URL::PrefixPath>>(target, "urlPrefixPath");
  SetStringMethod<GetURLString<&Rml::URL::GetFileName>>(target,
                                                        "urlGetFileName");
  SetStringMethod<SetURLString<&Rml::URL::SetFileName>>(target,
                                                        "urlSetFileName");
  SetStringMethod<GetURLString<&Rml::URL::GetExtension>>(target,
                                                         "urlGetExtension");
  SetStringMethod<SetURLString<&Rml::URL::SetExtension>>(target,
                                                         "urlSetExtension");
  SetStringMethod<GetURLString<&Rml::URL::GetPathedFileName>>(
      target, "urlGetPathedFileName");
  SetStringMethod<GetURLString<&Rml::URL::GetQueryString>>(target,
                                                           "urlGetQueryString");
  SetStringMethod<GetParameters>(target, "urlGetParameters");
  SetStringMethod<SetParameter>(target, "urlSetParameter");
  SetStringMethod<SetParameters>(target, "urlSetParameters");
  SetStringMethod<ClearParameters>(target, "urlClearParameters");
  SetStringMethod<URLLessThan>(target, "urlLessThan");
  SetStringMethod<URLCodec<Rml::URL::UrlEncode>>(target, "urlEncode");
  SetStringMethod<URLCodec<Rml::URL::UrlDecode>>(target, "urlDecode");
}

}  // namespace sfmlrmlui
