// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Core.h>
#include <nan.h>

#include <cstring>

#include "native/fonts/rmlui-font-engine.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

void Put(v8::Local<v8::Object> object,
         const char* name,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(name).ToLocalChecked(), value)
      .FromJust();
}

void Flag(v8::Local<v8::Object> object, const char* name, bool value) {
  Put(object, name, Nan::New(value));
}

NAN_METHOD(GetCapabilities) {
  const bool initialized = State().initialized;
  const char* selected = SelectedFontEngineName();
  auto result = Nan::New<v8::Object>();
  Put(result, "rmluiVersion", Nan::New(Rml::GetVersion()).ToLocalChecked());
  Flag(result, "initialized", initialized);
  Put(result,
      "selectedFontEngine",
      selected ? Nan::New(selected).ToLocalChecked().As<v8::Value>()
               : Nan::Null().As<v8::Value>());

  auto modules = Nan::New<v8::Object>();
  // These modules are linked unconditionally. "Available" means that their
  // runtime entry points can be used, not that a debugger or Lua host exists.
  for (const char* name : {"debugger", "svg", "lottie", "lua"}) {
    auto module = Nan::New<v8::Object>();
    Flag(module, "compiled", true);
    Flag(module, "available", initialized);
    Put(modules, name, module);
  }
  Put(result, "modules", modules);

  auto fonts = Nan::New<v8::Object>();
  for (const auto kind : {FontEngineKind::kFreeType,
                          FontEngineKind::kHarfBuzz,
                          FontEngineKind::kBitmap}) {
    const char* name = FontEngineName(kind);
    const auto features = FontBackendSupport(kind);
    auto font = Nan::New<v8::Object>();
    Flag(font, "compiled", features.compiled);
    Flag(font,
         "available",
         features.compiled && initialized && selected &&
             std::strcmp(selected, name) == 0);
    Flag(font, "memoryLoading", features.memory_loading);
    Flag(font, "effects", features.effects);
    Flag(font, "shaping", features.shaping);
    Flag(font, "kerningControl", features.kerning_control);
    Flag(font, "priorCharacter", features.prior_character);
    Flag(font, "letterSpacing", features.letter_spacing);
    Flag(font, "scalable", features.scalable);
    Flag(font, "strictFamilyMatching", features.strict_family_matching);
    Put(fonts, name, font);
  }
  Put(result, "fonts", fonts);
  info.GetReturnValue().Set(result);
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlCapabilities) {
  SetRuntimeMethod<GetCapabilities, true, false>(target, "getCapabilities");
}

}  // namespace sfmlrmlui
