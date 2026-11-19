// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/style/properties/rmlui-property-parser.h"

#include <RmlUi/Core/PropertyParser.h>
#include <RmlUi/Core/StyleSheetSpecification.h>

#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/animation/rmlui-animation-values.h"
#include "native/animation/rmlui-value-callbacks.h"
#include "native/fonts/rmlui-font-effect-callbacks.h"
#include "native/runtime/rmlui-state.h"
#include "native/style/properties/rmlui-property.h"

namespace sfmlrmlui {
namespace {

class ParserCallbackScope final {
 public:
  ParserCallbackScope() {
    ++State().callback_depth;
    ++State().parser_callback_depth;
  }
  ~ParserCallbackScope() {
    --State().parser_callback_depth;
    --State().callback_depth;
  }
};

class JavaScriptPropertyParser final : public Rml::PropertyParser {
 public:
  bool ParseValue(Rml::Property& property,
                  const Rml::String& value,
                  const Rml::ParameterMap& parameters) const override {
    if (!CanInvokeCallback() || function.IsEmpty()) {
      return false;
    }
    Nan::HandleScope handles;
    Nan::TryCatch caught;
    ParserCallbackScope callback_scope;
    auto snapshot = WrapProperty(property);
    auto mapped = Nan::New<v8::Object>();
    for (const auto& [name, number] : parameters) {
      mapped
          ->CreateDataProperty(Nan::GetCurrentContext(),
                               Nan::New(name).ToLocalChecked(),
                               Nan::New(number))
          .FromJust();
    }
    v8::Local<v8::Value> arguments[] = {
        snapshot, Nan::New(value).ToLocalChecked(), mapped};
    v8::Local<v8::Value> returned;
    bool result = false;
    RecordDiagnosticCallback(DiagnosticCallback::kParser);
    if (function.Get(v8::Isolate::GetCurrent())
            ->Call(Nan::GetCurrentContext(), Nan::Undefined(), 3, arguments)
            .ToLocal(&returned)) {
      if (!returned->IsBoolean()) {
        Nan::ThrowTypeError("Property parser must return a boolean");
      } else {
        auto handle = Nan::Get(snapshot, Nan::New("handle").ToLocalChecked())
                          .ToLocalChecked();
        Rml::Property parsed;
        if (CopyProperty(handle, &parsed) && ValidatePropertyStorage(parsed)) {
          RetainNativeVariantTweens(&parsed.value);
          RetainFontEffectValueCallbacks(parsed.value);
          property = std::move(parsed);
          result = returned->IsTrue();
        }
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
      return false;
    }
    return result;
  }

  v8::Global<v8::Function> function;
};

struct ParserState {
  Rml::PropertyParser* value{nullptr};
  std::shared_ptr<JavaScriptPropertyParser> owned;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

using ParserHandle = sfmljs::SharedHandle<ParserState>;

// The weak registry allows unregistered JS callback cycles to be collected.
// Only successfully registered native parsers root their callback until
// shutdown.
std::unordered_map<Rml::PropertyParser*, std::weak_ptr<ParserState>>&
Parsers() {
  static std::unordered_map<Rml::PropertyParser*, std::weak_ptr<ParserState>>
      parsers;
  return parsers;
}

std::vector<std::shared_ptr<ParserState>>& RegisteredParsers() {
  static std::vector<std::shared_ptr<ParserState>> parsers;
  return parsers;
}

v8::Local<v8::Object> WrapParser(std::shared_ptr<ParserState> state) {
  if (!state->handle.IsEmpty()) {
    return state->handle.Get(v8::Isolate::GetCurrent());
  }
  auto result = ParserHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), result);
  state->handle.SetWeak();
  if (state->owned && !state->owned->function.IsEmpty() &&
      state->owned->function.IsWeak()) {
    Nan::SetPrivate(result,
                    Nan::New("rml.parser.callback").ToLocalChecked(),
                    state->owned->function.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  return result;
}

std::shared_ptr<ParserState> ParserOf(v8::Local<v8::Value> handle) {
  auto* checked = ParserHandle::From(handle);
  if (!checked) {
    return {};
  }
  auto state = checked->owner();
  if (!state->value || state->generation != State().generation) {
    Nan::ThrowError("PropertyParser is no longer valid");
    return {};
  }
  return state;
}

bool ReadParserName(v8::Local<v8::Value> input, Rml::String* name) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a parser name");
    return false;
  }
  Nan::Utf8String text(input);
  name->assign(*text, text.length());
  return true;
}

NAN_METHOD(CreateParser) {
  if (!info[0]->IsFunction()) {
    return Nan::ThrowTypeError("Expected a property parser callback");
  }
  auto state = std::make_shared<ParserState>();
  state->owned = std::make_shared<JavaScriptPropertyParser>();
  state->owned->function.Reset(v8::Isolate::GetCurrent(),
                               info[0].As<v8::Function>());
  state->owned->function.SetWeak();
  state->value = state->owned.get();
  state->generation = State().generation;
  std::erase_if(Parsers(),
                [](const auto& entry) { return entry.second.expired(); });
  Parsers()[state->value] = state;
  info.GetReturnValue().Set(WrapParser(std::move(state)));
}

NAN_METHOD(RegisterParser) {
  Rml::String name;
  if (!ReadParserName(info[0], &name)) {
    return;
  }
  if (name.empty()) {
    return Nan::ThrowRangeError("Parser name cannot be empty");
  }
  auto state = ParserOf(info[1]);
  if (!state) {
    return;
  }
  if (Rml::StyleSheetSpecification::GetParser(name)) {
    info.GetReturnValue().Set(false);
    return;
  }
  const bool registered =
      Rml::StyleSheetSpecification::RegisterParser(name, state->value);
  if (registered) {
    if (state->owned && state->owned->function.IsWeak()) {
      state->owned->function.ClearWeak();
      if (!state->handle.IsEmpty()) {
        Nan::DeletePrivate(state->handle.Get(v8::Isolate::GetCurrent()),
                           Nan::New("rml.parser.callback").ToLocalChecked())
            .FromJust();
      }
    }
    RegisteredParsers().push_back(std::move(state));
  }
  info.GetReturnValue().Set(registered);
}

NAN_METHOD(GetParser) {
  Rml::String name;
  if (!ReadParserName(info[0], &name)) {
    return;
  }
  auto* value = Rml::StyleSheetSpecification::GetParser(name);
  if (!value) {
    info.GetReturnValue().SetNull();
    return;
  }
  auto state = Parsers()[value].lock();
  if (!state) {
    state = std::make_shared<ParserState>();
    state->value = value;
    state->generation = State().generation;
    Parsers()[value] = state;
  }
  info.GetReturnValue().Set(WrapParser(std::move(state)));
}

bool ReadParameters(v8::Local<v8::Value> input, Rml::ParameterMap* result) {
  if (!input->IsObject() || input->IsArray()) {
    Nan::ThrowTypeError("Expected a parser parameter record");
    return false;
  }
  auto object = input.As<v8::Object>();
  v8::Local<v8::Array> keys;
  if (!object
           ->GetOwnPropertyNames(Nan::GetCurrentContext(),
                                 v8::SKIP_SYMBOLS,
                                 v8::KeyConversionMode::kConvertToString)
           .ToLocal(&keys)) {
    return false;
  }
  for (uint32_t i = 0; i < keys->Length(); ++i) {
    v8::Local<v8::Value> key;
    v8::Local<v8::Value> value;
    if (!Nan::Get(keys, i).ToLocal(&key) ||
        !Nan::Get(object, key).ToLocal(&value)) {
      return false;
    }
    int number;
    if (!ReadPropertyInteger(value, &number)) {
      return false;
    }
    Nan::Utf8String name(key);
    (*result)[Rml::String(*name, name.length())] = number;
  }
  return true;
}

NAN_METHOD(ParseValue) {
  Rml::String text;
  Rml::ParameterMap parameters;
  if (!ReadParserName(info[2], &text) ||
      !ReadParameters(info[3], &parameters)) {
    return;
  }
  auto parser = ParserOf(info[0]);
  Rml::Property value;
  if (!parser || !CopyProperty(info[1], &value)) {
    return;
  }
  const bool result = parser->value->ParseValue(value, text, parameters);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  auto* output = PropertyOf(info[1]);
  RebindVariantTweens(&value.value);
  output->value = std::move(value);
  UpdatePropertyMetadata(output);
  RetainVariantCallbacks(info[1].As<v8::Object>(), output->value.value);
  info.GetReturnValue().Set(result);
}

}  // namespace

void ReleasePropertyParsers() {
  for (auto& [pointer, weak] : Parsers()) {
    if (auto state = weak.lock()) {
      if (!state->handle.IsEmpty()) {
        Nan::DeletePrivate(state->handle.Get(v8::Isolate::GetCurrent()),
                           Nan::New("rml.parser.callback").ToLocalChecked())
            .FromJust();
        state->handle.Reset();
      }
      if (state->owned) {
        state->owned->function.Reset();
      }
      state->value = nullptr;
      state->owned.reset();
      state->generation = 0;
    }
  }
  RegisteredParsers().clear();
  Parsers().clear();
}

NAN_MODULE_INIT(InitializeRmlPropertyParser) {
  SetRuntimeMethod<CreateParser, true>(target, "createPropertyParser");
  SetRuntimeMethod<RegisterParser, true>(target, "styleRegisterParser");
  SetRuntimeMethod<GetParser, true>(target, "styleGetParser");
  SetRuntimeMethod<ParseValue, true>(target, "parserParseValue");
}

}  // namespace sfmlrmlui
