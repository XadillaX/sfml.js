// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/imgui-glyph-fields.h"

#include <nan.h>
#include <sfml-js-interop.h>

#include <cmath>

#include "native/cimgui.h"

namespace sfmlimgui {
namespace {

enum class GlyphBitfield { Colored, Visible, Codepoint };

template <GlyphBitfield field>
NAN_METHOD(ReadGlyphBitfield) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImFontGlyph>::From(info.Data());
  if (!handle) return;
  const auto& glyph = *handle->owner();
  if constexpr (field == GlyphBitfield::Colored) {
    info.GetReturnValue().Set(Nan::New(glyph.Colored));
  } else if constexpr (field == GlyphBitfield::Visible) {
    info.GetReturnValue().Set(Nan::New(glyph.Visible));
  } else {
    info.GetReturnValue().Set(Nan::New(glyph.Codepoint));
  }
}

template <GlyphBitfield field>
NAN_METHOD(WriteGlyphBitfield) {
  auto* handle = sfmljs::SharedHandle<cimgui::ImFontGlyph>::From(info.Data());
  if (!handle) return;
  if (!info[0]->IsNumber()) {
    Nan::ThrowTypeError("Glyph bitfield value must be a number");
    return;
  }
  const double number = info[0].As<v8::Number>()->Value();
  constexpr unsigned int maximum =
      field == GlyphBitfield::Codepoint ? 0x3fffffffU : 1U;
  if (!std::isfinite(number) || std::trunc(number) != number || number < 0 ||
      number > maximum) {
    Nan::ThrowRangeError(
        field == GlyphBitfield::Codepoint
            ? "Codepoint must be an integer between 0 and 0x3fffffff"
            : "Colored and Visible must be 0 or 1");
    return;
  }
  auto& glyph = *handle->owner();
  const auto value = static_cast<unsigned int>(number);
  if constexpr (field == GlyphBitfield::Colored) {
    glyph.Colored = value;
  } else if constexpr (field == GlyphBitfield::Visible) {
    glyph.Visible = value;
  } else {
    glyph.Codepoint = value;
  }
}

template <GlyphBitfield field>
void AddGlyphBitfield(v8::Local<v8::Object> result,
                      const char* name,
                      v8::Local<v8::Value> handle) {
  // Callback data retains the SharedHandle even when JS copies the descriptor.
  auto getter = Nan::GetFunction(Nan::New<v8::FunctionTemplate>(
                                     ReadGlyphBitfield<field>, handle))
                    .ToLocalChecked();
  auto setter = Nan::GetFunction(Nan::New<v8::FunctionTemplate>(
                                     WriteGlyphBitfield<field>, handle))
                    .ToLocalChecked();
  result->SetAccessorProperty(
      Nan::New(name).ToLocalChecked(), getter, setter, v8::DontDelete);
}

}  // namespace

v8::Local<v8::Object> FontGlyphBitfields(v8::Local<v8::Value> handle) {
  auto result = Nan::New<v8::Object>();
  AddGlyphBitfield<GlyphBitfield::Colored>(result, "Colored", handle);
  AddGlyphBitfield<GlyphBitfield::Visible>(result, "Visible", handle);
  AddGlyphBitfield<GlyphBitfield::Codepoint>(result, "Codepoint", handle);
  return result;
}

}  // namespace sfmlimgui
