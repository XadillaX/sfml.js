// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/fonts/rmlui-font-engine.h"

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/FontEngineInterface.h>
#include <RmlUi/Core/StringUtilities.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <limits>
#include <memory>
#include <utility>
#include <vector>

#include "native/fonts/rmlui-font-custom.h"
#include "native/fonts/rmlui-font-effect.h"
#include "native/fonts/rmlui-font-handle.h"
#include "native/fonts/rmlui-font-measure.h"
#include "native/fonts/rmlui-fonts.h"
#include "native/rendering/geometry/rmlui-geometry.h"
#include "native/rendering/geometry/rmlui-mesh.h"
#include "native/rendering/manager/rmlui-render-manager.h"
#include "native/rendering/textures/rmlui-resource-preload.h"
#include "native/rendering/textures/rmlui-resources.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

struct EngineState {
  std::unique_ptr<Rml::FontEngineInterface> value;
  FontEngineKind kind{FontEngineKind::kFreeType};
  CustomFontEngine* custom{nullptr};
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};

using EngineHandle = sfmljs::SharedHandle<EngineState>;

struct EffectsState {
  Rml::FontEffectsHandle value{0};
  Rml::FontFaceHandle face{0};
  uint64_t generation{0};
  std::weak_ptr<EngineState> engine;
};

using EffectsHandle = sfmljs::SharedHandle<EffectsState>;

struct ShapeState {
  std::shared_ptr<const Rml::String> language;
  std::array<int32_t, 2> enums{0, 0};
  float spacing{0};
};

using ShapeHandle = sfmljs::SharedHandle<ShapeState>;

auto& Engines() {
  static std::vector<std::weak_ptr<EngineState>> engines;
  return engines;
}

auto& Selected() {
  static std::shared_ptr<EngineState> selected;
  return selected;
}

auto& SelectedHandle() {
  static v8::Global<v8::Object> handle;
  return handle;
}

uint64_t Generation() {
  return State().generation + (State().initialized ? 0 : 1);
}

void Own(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

bool ReadString(v8::Local<v8::Value> input, Rml::String* output) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a font string");
    return false;
  }

  Nan::Utf8String text(input);
  output->assign(*text, text.length());
  return true;
}

std::shared_ptr<EngineState> EngineOf(v8::Local<v8::Value> input,
                                      bool active = true) {
  auto* handle = EngineHandle::From(input);
  if (!handle) {
    return {};
  }

  const auto owner = handle->owner();
  if (!owner->value || owner->generation != Generation()) {
    Nan::ThrowError("Font engine interface is no longer valid");
    return {};
  }
  if (active && (!State().initialized || owner != Selected() ||
                 Rml::GetFontEngineInterface() != owner->value.get())) {
    Nan::ThrowError("Font operations require the selected active engine");
    return {};
  }
  return owner;
}

v8::Local<v8::Object> CreateEngine(
    v8::Local<v8::Array> functions = {},
    FontEngineKind kind = FontEngineKind::kFreeType) {
  ClaimRuntimeSetup();
  auto owner = std::make_shared<EngineState>();
  owner->kind = kind;
  // Construction never initializes the upstream global FontProvider.
  if (functions.IsEmpty()) {
    owner->value = CreateBuiltinFontEngine(kind);
  } else {
    auto custom = CreateCustomFontEngine(functions);
    owner->custom = custom.get();
    owner->value = std::move(custom);
  }

  owner->generation = Generation();
  const auto handle = EngineHandle::Create(owner);
  if (owner->custom) {
    owner->custom->Bind(handle);
  }

  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  static size_t threshold = 64;
  if (Engines().size() >= threshold) {
    std::erase_if(Engines(), [](const auto& weak) { return weak.expired(); });
    threshold = std::max<size_t>(64, Engines().size() * 2);
  }
  Engines().push_back(owner);
  return handle;
}

void Select(const std::shared_ptr<EngineState>& engine,
            v8::Local<v8::Object> handle) {
  Selected() = engine;
  SelectedHandle().Reset(v8::Isolate::GetCurrent(), handle);
  Rml::SetFontEngineInterface(engine->value.get());
}

bool ReadShape(v8::Local<v8::Value> input, ShapeState* output) {
  if (input->IsNull()) {
    return true;
  }

  auto* handle = ShapeHandle::From(input);
  if (!handle) {
    return false;
  }

  *output = *handle->owner();
  if (output->enums[0] < 0 || output->enums[0] > 2) {
    Nan::ThrowRangeError("Invalid text shaping direction");
    return false;
  }
  if (output->enums[1] < 0 || output->enums[1] > 2) {
    Nan::ThrowRangeError("Invalid text shaping font kerning");
    return false;
  }
  if (!std::isfinite(output->spacing) ||
      static_cast<double>(output->spacing) < std::numeric_limits<int>::min() ||
      static_cast<double>(output->spacing) > std::numeric_limits<int>::max()) {
    Nan::ThrowRangeError("Text shaping letter spacing must fit finite int32");
    return false;
  }
  return true;
}

Rml::TextShapingContext ShapeOf(const ShapeState& value) {
  static const Rml::String kEmptyLanguage;
  return {value.language ? *value.language : kEmptyLanguage,
          static_cast<Rml::Style::Direction>(value.enums[0]),
          static_cast<Rml::Style::FontKerning>(value.enums[1]),
          value.spacing};
}

bool ReadFace(v8::Local<v8::Value> input, Rml::FontFaceHandle* face) {
  if (!ReadFontFace(input, face)) {
    return false;
  }
  if (!*face) {
    Nan::ThrowTypeError("Expected a nonnull font face handle");
    return false;
  }
  return true;
}

bool ReadPrior(v8::Local<v8::Value> input, Rml::Character* character) {
  if (!input->IsUint32() || Nan::To<uint32_t>(input).FromJust() > 0x10ffff) {
    Nan::ThrowRangeError("Expected a Unicode prior character");
    return false;
  }

  *character = static_cast<Rml::Character>(Nan::To<uint32_t>(input).FromJust());
  return true;
}

NAN_METHOD(Measure) {
  ShapeState shaping;
  Rml::Character prior;
  if (!ReadShape(info[3], &shaping) || !ReadPrior(info[4], &prior)) {
    return;
  }
  if (!info[5]->IsUint32()) {
    return Nan::ThrowRangeError("Font measurement count must be uint32");
  }

  const uint32_t count = Nan::To<uint32_t>(info[5]).FromJust();
  const auto buffer = FontMeasureOf(info[2], count);
  const auto engine = EngineOf(info[0]);
  Rml::FontFaceHandle face;
  if (!buffer || !engine || !ReadFace(info[1], &face)) {
    return;
  }

  const auto context = ShapeOf(shaping);
  if (engine->custom) {
    engine->custom->Measure(face, buffer, count, context, prior, info[2]);
    State().data_diagnostics.Record(&DataDiagnostics::font_measure_rows, count);
    return;
  }

  const auto* bytes = reinterpret_cast<const char*>(buffer->bytes.data());
  for (uint32_t i = 0; i < count; ++i) {
    const Rml::StringView string{bytes + buffer->offsets[i],
                                 bytes + buffer->offsets[i + 1]};
    buffer->widths[i] =
        engine->value->GetStringWidth(face, string, context, prior);
  }
  State().data_diagnostics.Record(&DataDiagnostics::font_measure_rows, count);
}

v8::Local<v8::Object> WrapMetrics(Rml::FontMetrics value) {
  auto owner = std::make_shared<Rml::FontMetrics>(value);
  auto result = Nan::New<v8::Object>();
  static_assert(sizeof(int) == sizeof(int32_t));
  static_assert(sizeof(bool) == sizeof(uint8_t));
  static_assert(offsetof(Rml::FontMetrics, underline_thickness) -
                    offsetof(Rml::FontMetrics, ascent) ==
                5 * sizeof(float));

  auto size = sfmljs::MapShared(
      v8::Isolate::GetCurrent(), owner, &owner->size, sizeof(int));
  auto values = sfmljs::MapShared(
      v8::Isolate::GetCurrent(), owner, &owner->ascent, 6 * sizeof(float));
  auto flags = sfmljs::MapShared(
      v8::Isolate::GetCurrent(), owner, &owner->has_ellipsis, sizeof(bool));

  Own(result, "sizeView", v8::Int32Array::New(size, 0, 1));
  Own(result, "values", v8::Float32Array::New(values, 0, 6));
  Own(result, "flags", v8::Uint8Array::New(flags, 0, 1));
  return result;
}

NAN_METHOD(Create) {
  if (info[0]->IsUndefined() || info[0]->IsNull()) {
    info.GetReturnValue().Set(CreateEngine());
    return;
  }
  if (info[0]->IsString()) {
    Rml::String name;
    if (!ReadString(info[0], &name)) {
      return;
    }
    for (const auto kind : {FontEngineKind::kFreeType,
                            FontEngineKind::kHarfBuzz,
                            FontEngineKind::kBitmap}) {
      if (name != FontEngineName(kind)) {
        continue;
      }
      if (!FontBackendSupport(kind).compiled) {
        return Nan::ThrowError("Requested font engine is not compiled");
      }
      info.GetReturnValue().Set(CreateEngine({}, kind));
      return;
    }
    return Nan::ThrowTypeError("Unknown builtin font engine");
  }
  if (!info[0]->IsArray() || info[0].As<v8::Array>()->Length() != 14) {
    return Nan::ThrowTypeError("Expected fourteen optional font callbacks");
  }

  auto functions = Nan::New<v8::Array>(14);
  for (uint32_t i = 0; i < 14; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(info[0].As<v8::Array>(), i).ToLocal(&value)) {
      return;
    }
    if (!value->IsUndefined() && !value->IsFunction()) {
      return Nan::ThrowTypeError("Expected optional font callbacks");
    }
    functions->CreateDataProperty(Nan::GetCurrentContext(), i, value)
        .FromJust();
  }
  info.GetReturnValue().Set(CreateEngine(functions, FontEngineKind::kCustom));
}

NAN_METHOD(GetKind) {
  if (const auto engine = EngineOf(info[0], false)) {
    info.GetReturnValue().Set(
        Nan::New(FontEngineName(engine->kind)).ToLocalChecked());
  }
}

NAN_METHOD(RegisterLanguage) {
  if (State().initialized) {
    return Nan::ThrowError("Register font languages before initialization");
  }
  Rml::String language;
  Rml::String script;
  Rml::String direction;
  if (!ReadString(info[1], &language) || !ReadString(info[2], &script) ||
      !ReadString(info[3], &direction)) {
    return;
  }
  const auto letter = [](unsigned char c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
  };
  if (language.empty() || language.front() == '-' || language.back() == '-' ||
      language.find("--") != Rml::String::npos ||
      !std::all_of(language.begin(), language.end(), [&](unsigned char c) {
        return letter(c) || (c >= '0' && c <= '9') || c == '-';
      })) {
    return Nan::ThrowTypeError("Expected a language tag");
  }
  if (script.size() != 4 ||
      !std::all_of(script.begin(), script.end(), letter)) {
    return Nan::ThrowTypeError("Expected a four-letter ISO15924 script");
  }
  if (direction != "ltr" && direction != "rtl") {
    return Nan::ThrowTypeError("Expected ltr or rtl font language direction");
  }
  if (const auto engine = EngineOf(info[0], false)) {
    if (engine->kind != FontEngineKind::kHarfBuzz) {
      return Nan::ThrowTypeError("Language registration requires HarfBuzz");
    }
    RegisterFontLanguage(
        engine->value.get(), language, script, direction == "rtl");
  }
}

NAN_METHOD(CreateFace) {
  const auto engine = EngineOf(info[0], false);
  if (!engine) {
    return;
  }
  if (!engine->custom) {
    return Nan::ThrowTypeError(
        "Font face registration requires a custom engine");
  }
  engine->custom->CreateFace(info);
}

NAN_METHOD(Get) {
  const auto* installed = Rml::GetFontEngineInterface();
  if (!installed) {
    return info.GetReturnValue().Set(Nan::Null());
  }
  if (!Selected() || installed != Selected()->value.get()) {
    return Nan::ThrowError("Installed font engine is not binding-owned");
  }
  info.GetReturnValue().Set(SelectedHandle().Get(v8::Isolate::GetCurrent()));
}

NAN_METHOD(Set) {
  if (State().initialized) {
    return Nan::ThrowError("Set font engine before initialization");
  }
  if (info[0]->IsNull()) {
    Rml::SetFontEngineInterface(nullptr);
    SelectedHandle().Reset();
    Selected().reset();
  } else if (auto owner = EngineOf(info[0], false)) {
    Select(owner, info[0].As<v8::Object>());
  }
}

NAN_METHOD(Load) {
  if (EngineOf(info[0])) {
    LoadFontSource(info, 1);
  }
}

NAN_METHOD(GetFace) {
  Rml::String family;
  if (!ReadString(info[1], &family)) {
    return;
  }
  if (!info[2]->IsInt32() || Nan::To<int>(info[2]).FromJust() < 0 ||
      Nan::To<int>(info[2]).FromJust() > 1 || !info[3]->IsInt32() ||
      Nan::To<int>(info[3]).FromJust() < 1 ||
      Nan::To<int>(info[3]).FromJust() > 1000 || !info[4]->IsInt32() ||
      Nan::To<int>(info[4]).FromJust() <= 0 ||
      Nan::To<int>(info[4]).FromJust() >
          (std::numeric_limits<int>::max() >> 6)) {
    return Nan::ThrowRangeError("Invalid font style, weight or size");
  }
  if (auto engine = EngineOf(info[0])) {
    const auto face = engine->value->GetFontFaceHandle(
        Rml::StringUtilities::ToLower(family),
        static_cast<Rml::Style::FontStyle>(Nan::To<int>(info[2]).FromJust()),
        static_cast<Rml::Style::FontWeight>(Nan::To<int>(info[3]).FromJust()),
        Nan::To<int>(info[4]).FromJust());
    v8::Local<v8::Value> token;
    if (WrapFontFace(face, State().font_generation).ToLocal(&token)) {
      info.GetReturnValue().Set(token);
    }
  }
}

NAN_METHOD(Metrics) {
  const auto engine = EngineOf(info[0]);
  Rml::FontFaceHandle face;
  if (engine && ReadFace(info[1], &face)) {
    info.GetReturnValue().Set(WrapMetrics(engine->value->GetFontMetrics(face)));
  }
}

NAN_METHOD(PrepareEffects) {
  if (!info[2]->IsArray()) {
    return Nan::ThrowTypeError("Expected a font effect list");
  }

  Rml::FontEffectList effects;
  const auto list = info[2].As<v8::Array>();
  effects.reserve(list->Length());
  for (uint32_t i = 0; i < list->Length(); ++i) {
    v8::Local<v8::Value> effect;
    Rml::SharedPtr<const Rml::FontEffect> native;
    if (!Nan::Get(list, i).ToLocal(&effect) ||
        !CopyFontEffect(effect, &native)) {
      return;
    }
    effects.push_back(std::move(native));
  }

  const auto engine = EngineOf(info[0]);
  Rml::FontFaceHandle face;
  if (!engine || !ReadFace(info[1], &face)) {
    return;
  }

  auto owner = std::make_shared<EffectsState>();
  owner->value = engine->value->PrepareFontEffects(face, effects);
  owner->face = face;
  owner->generation = State().font_generation;
  owner->engine = engine;
  info.GetReturnValue().Set(EffectsHandle::Create(owner));
}

template <bool bulk>
NAN_METHOD(Widths) {
  std::vector<Rml::String> strings;
  if constexpr (bulk) {
    if (!info[2]->IsArray()) {
      return Nan::ThrowTypeError("Expected a list of font strings");
    }
    const auto list = info[2].As<v8::Array>();
    strings.resize(list->Length());
    for (uint32_t i = 0; i < list->Length(); ++i) {
      v8::Local<v8::Value> text;
      if (!Nan::Get(list, i).ToLocal(&text) || !ReadString(text, &strings[i])) {
        return;
      }
    }
  } else {
    strings.resize(1);
    if (!ReadString(info[2], &strings[0])) {
      return;
    }
  }

  ShapeState shaping;
  Rml::Character prior;
  if (!ReadShape(info[3], &shaping) || !ReadPrior(info[4], &prior)) {
    return;
  }

  const auto engine = EngineOf(info[0]);
  Rml::FontFaceHandle face;
  if (!engine || !ReadFace(info[1], &face)) {
    return;
  }

  const auto context = ShapeOf(shaping);
  if constexpr (bulk) {
    auto output = std::make_shared<std::vector<int32_t>>(strings.size());
    if (engine->custom) {
      auto buffer = std::make_shared<FontMeasureState>();
      buffer->offsets.push_back(0);
      for (const auto& text : strings) {
        if (text.size() >
            std::numeric_limits<uint32_t>::max() - buffer->bytes.size()) {
          return Nan::ThrowRangeError("Bulk font text exceeds uint32");
        }
        buffer->bytes.insert(buffer->bytes.end(), text.begin(), text.end());
        buffer->offsets.push_back(buffer->bytes.size());
      }
      buffer->bytes.resize(std::max<size_t>(1, buffer->bytes.size()));
      buffer->widths.resize(strings.size());
      if (!engine->custom->Measure(
              face, buffer, strings.size(), context, prior, Nan::Null())) {
        return;
      }
      *output = std::move(buffer->widths);
    } else {
      for (size_t i = 0; i < strings.size(); ++i) {
        (*output)[i] =
            engine->value->GetStringWidth(face, strings[i], context, prior);
      }
    }

    const auto buffer = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                          output,
                                          output->data(),
                                          output->size() * sizeof(int32_t));
    info.GetReturnValue().Set(v8::Int32Array::New(buffer, 0, output->size()));
  } else {
    info.GetReturnValue().Set(
        engine->value->GetStringWidth(face, strings[0], context, prior));
  }
}

NAN_METHOD(Generate) {
  Rml::String string;
  ShapeState shaping;
  if (!ReadString(info[4], &string) || !ReadShape(info[9], &shaping)) {
    return;
  }
  if (!info[5]->IsNumber() || !info[6]->IsNumber() || !info[7]->IsUint32() ||
      !info[8]->IsNumber()) {
    return Nan::ThrowTypeError("Expected position, packed colour and opacity");
  }

  const Rml::Vector2f position{
      static_cast<float>(Nan::To<double>(info[5]).FromJust()),
      static_cast<float>(Nan::To<double>(info[6]).FromJust())};
  const float opacity = static_cast<float>(Nan::To<double>(info[8]).FromJust());
  if (!std::isfinite(position.x) || !std::isfinite(position.y) ||
      !std::isfinite(opacity) || opacity < 0 || opacity > 1) {
    return Nan::ThrowRangeError("Invalid font position or opacity");
  }

  const uint32_t rgba = Nan::To<uint32_t>(info[7]).FromJust();
  const Rml::ColourbPremultiplied colour{static_cast<Rml::byte>(rgba),
                                         static_cast<Rml::byte>(rgba >> 8),
                                         static_cast<Rml::byte>(rgba >> 16),
                                         static_cast<Rml::byte>(rgba >> 24)};
  if (colour.red > colour.alpha || colour.green > colour.alpha ||
      colour.blue > colour.alpha) {
    return Nan::ThrowRangeError("Expected a premultiplied font colour");
  }

  const auto engine = EngineOf(info[0]);
  const auto manager = RenderManagerOf(info[1]);
  Rml::FontFaceHandle face;
  if (!engine || !manager || !ReadFace(info[2], &face)) {
    return;
  }

  Rml::FontEffectsHandle effects = 0;
  if (!info[3]->IsNull()) {
    auto* checked = EffectsHandle::From(info[3]);
    if (!checked) {
      return;
    }
    const auto& value = *checked->owner();
    if (value.generation != State().font_generation ||
        value.engine.lock() != engine || value.face != face) {
      return Nan::ThrowError("Font effects handle is no longer valid");
    }
    effects = value.value;
  }

  const auto shaping_context = ShapeOf(shaping);
  if (engine->kind == FontEngineKind::kFreeType ||
      engine->kind == FontEngineKind::kHarfBuzz) {
    // Core normally measures before generating text. Direct public generation
    // must also discover cold glyphs before the upstream layer atlas is built.
    engine->value->GetStringWidth(
        face, string, shaping_context, Rml::Character::Null);
  }

  Rml::TexturedMeshList meshes;
  const int width = engine->value->GenerateString(*manager->value,
                                                  face,
                                                  effects,
                                                  string,
                                                  position,
                                                  colour,
                                                  opacity,
                                                  shaping_context,
                                                  meshes);
  auto list = Nan::New<v8::Array>(meshes.size());
  const uint64_t generation = State().font_generation;
  const int version = engine->custom ? 0 : engine->value->GetVersion(face);
  const std::weak_ptr<EngineState> weak_engine = engine;
  for (uint32_t i = 0; i < meshes.size(); ++i) {
    auto item = Nan::New<v8::Object>();
    Own(item, "mesh", WrapMesh(std::move(meshes[i].mesh)));
    Own(item,
        "texture",
        WrapTexture(meshes[i].texture,
                    manager->value,
                    engine,
                    [generation, version, face, weak_engine] {
                      const auto owner = weak_engine.lock();
                      return generation == State().font_generation && owner &&
                             owner->value &&
                             (owner->custom ||
                              owner->value->GetVersion(face) == version);
                    }));
    list->CreateDataProperty(Nan::GetCurrentContext(), i, item).FromJust();
  }

  auto result = Nan::New<v8::Object>();
  Own(result, "width", Nan::New(width));
  Own(result, "meshes", list);
  info.GetReturnValue().Set(result);
}

NAN_METHOD(Version) {
  const auto engine = EngineOf(info[0]);
  Rml::FontFaceHandle face;
  if (engine && ReadFace(info[1], &face)) {
    info.GetReturnValue().Set(engine->value->GetVersion(face));
  }
}

NAN_METHOD(Release) {
  if (!EngineOf(info[0]) || !CanReleaseGlobalResources()) {
    return;
  }

  ++State().font_generation;
  InvalidateResourcePreloads(nullptr, nullptr, true);
  Rml::ReleaseFontResources();
}

NAN_METHOD(CreateShape) {
  auto owner = std::make_shared<ShapeState>();
  auto language = std::make_shared<Rml::String>();
  if (!ReadString(info[0], language.get())) {
    return;
  }

  owner->language = std::move(language);
  auto result = Nan::New<v8::Object>();
  Own(result, "handle", ShapeHandle::Create(owner));
  auto enums = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                 owner,
                                 owner->enums.data(),
                                 sizeof(owner->enums));
  auto values = sfmljs::MapShared(
      v8::Isolate::GetCurrent(), owner, &owner->spacing, sizeof(float));

  Own(result, "enums", v8::Int32Array::New(enums, 0, 2));
  Own(result, "values", v8::Float32Array::New(values, 0, 1));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GetLanguage) {
  if (auto* handle = ShapeHandle::From(info[0])) {
    info.GetReturnValue().Set(
        Nan::New(*handle->owner()->language).ToLocalChecked());
  }
}

NAN_METHOD(SetLanguage) {
  Rml::String language;
  if (ReadString(info[1], &language)) {
    if (auto* handle = ShapeHandle::From(info[0])) {
      handle->owner()->language =
          std::make_shared<const Rml::String>(std::move(language));
    }
  }
}

}  // namespace

void PrepareFontEngineInterface() {
  if (!Selected()) {
    const auto handle = CreateEngine();
    Select(EngineHandle::From(handle)->owner(), handle);
  }
}

const char* SelectedFontEngineName() {
  return Selected() ? FontEngineName(Selected()->kind) : nullptr;
}

void ReleaseFontEngineBindings() {
  Rml::SetFontEngineInterface(nullptr);
  for (const auto& weak : Engines()) {
    if (auto owner = weak.lock()) {
      if (owner->custom && !owner->handle.IsEmpty()) {
        const auto handle = owner->handle.Get(v8::Isolate::GetCurrent());
        for (const char* name : {"rml.font.functions",
                                 "rml.font.faces",
                                 "rml.font.effects",
                                 "rml.font.measure"}) {
          Nan::DeletePrivate(handle, Nan::New(name).ToLocalChecked())
              .FromJust();
        }
      }
      owner->value.reset();
      owner->custom = nullptr;
      owner->handle.Reset();
    }
  }
  Engines().clear();

  SelectedHandle().Reset();
  Selected().reset();
}

NAN_MODULE_INIT(InitializeRmlFontEngine) {
  InitializeFontMeasureBuffer(target);
  SetRuntimeMethod<Create, false, false>(target, "createFontEngineInterface");
  SetRuntimeMethod<GetKind, true, false>(target, "fontEngineGetKind");
  SetRuntimeMethod<RegisterLanguage, false, false>(
      target, "fontEngineRegisterLanguage");
  SetRuntimeMethod<CreateFace, true, false>(target, "fontEngineCreateFace");
  SetRuntimeMethod<Get, false, false>(target, "getFontEngineInterface");
  SetRuntimeMethod<Set, false, false>(target, "setFontEngineInterface");
  SetRuntimeMethod<Load>(target, "fontEngineLoadFontFace");
  SetRuntimeMethod<GetFace>(target, "fontEngineGetFace");
  SetRuntimeMethod<Metrics>(target, "fontEngineGetMetrics");
  SetRuntimeMethod<PrepareEffects>(target, "fontEnginePrepareEffects");
  SetRuntimeMethod<Widths<false>>(target, "fontEngineGetWidth");
  SetRuntimeMethod<Widths<true>>(target, "fontEngineGetWidths");
  SetRuntimeMethod<Measure>(target, "fontEngineMeasureStrings");
  SetRuntimeMethod<Generate>(target, "fontEngineGenerateString");
  SetRuntimeMethod<Version>(target, "fontEngineGetVersion");
  SetRuntimeMethod<Release>(target, "fontEngineReleaseResources");
  SetRuntimeMethod<CreateShape, true, false>(target,
                                             "createTextShapingContext");
  SetRuntimeMethod<GetLanguage, true, false>(target, "shapingGetLanguage");
  SetRuntimeMethod<SetLanguage, true, false>(target, "shapingSetLanguage");
}

}  // namespace sfmlrmlui
