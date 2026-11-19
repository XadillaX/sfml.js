// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_CUSTOM_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_CUSTOM_H_

#include <RmlUi/Core/FontEngineInterface.h>
#include <nan.h>

#include <cstdint>
#include <memory>

namespace sfmlrmlui {

struct FontMeasureState;

// Explicit customization boundary; the default engine never enters this path.
class CustomFontEngine : public Rml::FontEngineInterface {
 public:
  virtual void Bind(v8::Local<v8::Object> handle) = 0;
  virtual void CreateFace(const Nan::FunctionCallbackInfo<v8::Value>& info) = 0;
  virtual bool Measure(Rml::FontFaceHandle face,
                       const std::shared_ptr<FontMeasureState>& buffer,
                       uint32_t count,
                       const Rml::TextShapingContext& shaping,
                       Rml::Character prior,
                       v8::Local<v8::Value> source) = 0;
};

std::unique_ptr<CustomFontEngine> CreateCustomFontEngine(
    v8::Local<v8::Array> functions);
// Resolve canonical callback tokens without exposing native addresses to JS.
v8::MaybeLocal<v8::Value> CustomFontFaceToJs(Rml::FontFaceHandle face);
bool IsCustomFontFace(v8::Local<v8::Value> input);
bool ReadCustomFontFace(v8::Local<v8::Value> input,
                        Rml::FontFaceHandle* face,
                        uint64_t* generation = nullptr);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_CUSTOM_H_
