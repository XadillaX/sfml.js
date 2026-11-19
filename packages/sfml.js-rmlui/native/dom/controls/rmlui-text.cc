// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/ElementText.h>
#include <nan.h>

#include <limits>

#include "native/dom/elements/rmlui-element-access.h"
#include "native/runtime/rmlui-numbers.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

using Text = Rml::ElementText;

// Data properties avoid invoking inherited setters while native data is read.
void Output(v8::Local<v8::Object> object,
            const char* key,
            v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

NAN_METHOD(GenerateLine) {
  if (!info[1]->IsInt32()) {
    return Nan::ThrowTypeError("Expected an int32 UTF-8 byte offset");
  }
  float maximum_width = 0;
  if (info[2]->IsNumber() && Nan::To<double>(info[2]).FromJust() ==
                                 std::numeric_limits<double>::infinity()) {
    maximum_width = std::numeric_limits<float>::infinity();
  } else if (!ReadFiniteFloat(info[2], &maximum_width)) {
    return;
  }
  if (maximum_width < 0) {
    return Nan::ThrowRangeError("Maximum line width cannot be negative");
  }
  float right_spacing = 0;
  if (!ReadFiniteFloat(info[3], &right_spacing)) {
    return;
  }
  if (!info[4]->IsBoolean() || !info[5]->IsBoolean() || !info[6]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected boolean text formatting flags");
  }
  auto* text = ElementAs<Text>(info[0]);
  if (!text) {
    return;
  }
  const int offset = Nan::To<int>(info[1]).FromJust();
  const auto& source = text->GetText();
  if (offset < 0 || static_cast<size_t>(offset) > source.size() ||
      source.size() > static_cast<size_t>(std::numeric_limits<int>::max())) {
    return Nan::ThrowRangeError("UTF-8 byte offset is outside the text");
  }
  if (static_cast<size_t>(offset) < source.size() &&
      (static_cast<unsigned char>(source[offset]) & 0xc0) == 0x80) {
    return Nan::ThrowRangeError(
        "UTF-8 byte offset must be a character boundary");
  }
  Rml::String line;
  int length = 0;
  float width = 0;
  const bool reached_end = text->GenerateLine(line,
                                              length,
                                              width,
                                              offset,
                                              maximum_width,
                                              right_spacing,
                                              info[4]->IsTrue(),
                                              info[5]->IsTrue(),
                                              info[6]->IsTrue());
  auto result = Nan::New<v8::Object>();
  Output(result, "line", Nan::New(line).ToLocalChecked());
  Output(result, "lineLength", Nan::New(length));
  Output(result, "lineWidth", Nan::New(width));
  Output(result, "reachedEnd", Nan::New(reached_end));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(AddLine) {
  if (!info[1]->IsObject() || !info[2]->IsString()) {
    return Nan::ThrowTypeError("Expected a position object and line string");
  }
  auto position = info[1].As<v8::Object>();
  v8::Local<v8::Value> x;
  v8::Local<v8::Value> y;
  Rml::Vector2f point;
  // Read every accessor before resolving the borrowed native receiver.
  if (!Nan::Get(position, Nan::New("x").ToLocalChecked()).ToLocal(&x) ||
      !Nan::Get(position, Nan::New("y").ToLocalChecked()).ToLocal(&y) ||
      !ReadFiniteFloat(x, &point.x) || !ReadFiniteFloat(y, &point.y)) {
    return;
  }
  Nan::Utf8String line(info[2]);
  if (auto* text = ElementAs<Text>(info[0])) {
    text->AddLine(point, Rml::String(*line, line.length()));
  }
}

NAN_METHOD(GetLines) {
  if (auto* text = ElementAs<Text>(info[0])) {
    const auto& lines = text->GetLines();
    auto result = Nan::New<v8::Array>(static_cast<int>(lines.size()));
    for (size_t i = 0; i < lines.size(); ++i) {
      const auto& line = lines[i];
      auto position = Nan::New<v8::Object>();
      Output(position, "x", Nan::New(line.position.x));
      Output(position, "y", Nan::New(line.position.y));
      auto entry = Nan::New<v8::Object>();
      Output(entry, "text", Nan::New(line.text).ToLocalChecked());
      Output(entry, "position", position);
      Output(entry, "width", Nan::New(line.width));
      result
          ->CreateDataProperty(
              Nan::GetCurrentContext(), static_cast<uint32_t>(i), entry)
          .FromJust();
    }
    info.GetReturnValue().Set(result);
  }
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlText) {
  SetRuntimeMethod<ElementGet<Text, &Text::GetText>, true>(target, "getText");
  SetRuntimeMethod<ElementSetString<Text, &Text::SetText>>(target, "setText");
  SetRuntimeMethod<GenerateLine>(target, "generateTextLine");
  SetRuntimeMethod<ElementCall<Text, &Text::ClearLines>>(target,
                                                         "clearTextLines");
  SetRuntimeMethod<AddLine>(target, "addTextLine");
  SetRuntimeMethod<ElementCall<Text, &Text::SuppressAutoLayout>>(
      target, "suppressTextAutoLayout");
  SetRuntimeMethod<GetLines, true>(target, "getTextLines");
}

}  // namespace sfmlrmlui
