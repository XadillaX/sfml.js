// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/fonts/rmlui-font-effect.h"

#include <algorithm>
#include <cstdint>
#include <limits>
#include <memory>

#include "native/fonts/rmlui-font-effect-callbacks.h"
#include "native/fonts/rmlui-font-glyph.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {

struct FontEffectState {
  Rml::SharedPtr<const Rml::FontEffect> value;
  uint64_t generation{0};
};

// Copy metadata without casting away const or losing a derived effect's
// virtual behavior. Flatten delegates so repeated edits cannot grow a chain.
class EditedFontEffect final : public Rml::FontEffect {
 public:
  explicit EditedFontEffect(
      const Rml::SharedPtr<const Rml::FontEffect>& source) {
    const auto found = State().edited_font_effects.find(source.get());
    const auto edited = found == State().edited_font_effects.end()
                            ? nullptr
                            : found->second.lock();
    delegate_ = edited ? edited->delegate_ : source;
    SetColour(source->GetColour());
    SetLayer(source->GetLayer());
    SetFingerprint(source->GetFingerprint());
  }

  bool HasUniqueTexture() const override {
    return delegate_->HasUniqueTexture();
  }

  bool GetGlyphMetrics(Rml::Vector2i& origin,
                       Rml::Vector2i& dimensions,
                       const Rml::FontGlyph& glyph) const override {
    return delegate_->GetGlyphMetrics(origin, dimensions, glyph);
  }

  void GenerateGlyphTexture(Rml::byte* destination,
                            Rml::Vector2i dimensions,
                            int stride,
                            const Rml::FontGlyph& glyph) const override {
    delegate_->GenerateGlyphTexture(destination, dimensions, stride, glyph);
  }

  const Rml::FontEffect* Implementation() const { return delegate_.get(); }

 private:
  Rml::SharedPtr<const Rml::FontEffect> delegate_;
};

namespace {

using FontEffectHandle = sfmljs::SharedHandle<FontEffectState>;

class FontEffectAccess final : public Rml::FontEffect {
 public:
  using Rml::FontEffect::FillColorValuesFromAlpha;
};

void Own(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

FontEffectState* EffectOf(v8::Local<v8::Value> handle) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* checked = FontEffectHandle::TryFrom(handle);
  if (!checked) {
    Nan::ThrowTypeError("Expected an owned font effect");
    return nullptr;
  }
  auto* state = checked->owner().get();
  if (state->generation != State().generation || !state->value) {
    Nan::ThrowError("Font effect is no longer valid");
    return nullptr;
  }
  return state;
}

bool ReadField(v8::Local<v8::Value> value, Rml::String* field) {
  if (!value->IsString()) {
    Nan::ThrowTypeError("Expected a font effect field");
    return false;
  }
  Nan::Utf8String text(value);
  field->assign(*text, text.length());
  return true;
}

std::shared_ptr<EditedFontEffect> CopyEffectMetadata(
    const Rml::SharedPtr<const Rml::FontEffect>& source) {
  auto result = std::make_shared<EditedFontEffect>(source);
  auto& edits = State().edited_font_effects;
  if (edits.size() >= State().edited_font_effect_sweep_threshold) {
    std::erase_if(edits,
                  [](const auto& entry) { return entry.second.expired(); });
    State().edited_font_effect_sweep_threshold =
        std::max(size_t{64}, edits.size() * 2);
  }
  edits[result.get()] = result;
  return result;
}

NAN_METHOD(CreateFontEffect) {
  if (info[0]->IsUndefined()) {
    info.GetReturnValue().Set(
        WrapFontEffect(std::make_shared<Rml::FontEffect>()));
    return;
  }
  if (!info[0]->IsArray() || info[0].As<v8::Array>()->Length() != 3) {
    return Nan::ThrowTypeError("Expected font effect callbacks");
  }
  auto input = info[0].As<v8::Array>();
  auto functions = Nan::New<v8::Array>(3);
  for (uint32_t i = 0; i < 3; ++i) {
    v8::Local<v8::Value> function;
    if (!Nan::Get(input, i).ToLocal(&function)) {
      return;
    }
    if (!function->IsUndefined() && !function->IsFunction()) {
      return Nan::ThrowTypeError("Expected optional font effect callbacks");
    }
    functions->CreateDataProperty(Nan::GetCurrentContext(), i, function)
        .FromJust();
  }
  if (RuntimeReady()) {
    info.GetReturnValue().Set(
        WrapFontEffect(CreateFontEffectCallbacks(functions)));
  }
}

NAN_METHOD(ReadFontEffect) {
  Rml::String field;
  if (!ReadField(info[1], &field)) {
    return;
  }
  auto* state = EffectOf(info[0]);
  if (!state) {
    return;
  }
  // Metadata edits during callbacks can replace the facade's shared pointer.
  const auto retained = state->value;
  const auto& value = *retained;
  if (field == "hasUniqueTexture") {
    info.GetReturnValue().Set(value.HasUniqueTexture());
  } else if (field == "colour") {
    info.GetReturnValue().Set(
        VariantToJs(Rml::Variant(value.GetColour())).ToLocalChecked());
  } else if (field == "layer") {
    info.GetReturnValue().Set(static_cast<int>(value.GetLayer()));
  } else if (field == "fingerprint") {
    info.GetReturnValue().Set(v8::BigInt::NewFromUnsigned(
        v8::Isolate::GetCurrent(), value.GetFingerprint()));
  } else {
    Nan::ThrowTypeError("Unknown font effect field");
  }
}

NAN_METHOD(WriteFontEffect) {
  Rml::String field;
  if (!ReadField(info[1], &field)) {
    return;
  }
  Rml::Variant colour;
  int layer = 0;
  uint64_t fingerprint = 0;
  if (field == "colour") {
    if (!VariantFromJs(info[2], &colour)) {
      return;
    }
    if (colour.GetType() != Rml::Variant::COLOURB) {
      return Nan::ThrowTypeError("Expected a colourb font effect colour");
    }
  } else if (field == "layer") {
    if (!info[2]->IsInt32() || (layer = Nan::To<int>(info[2]).FromJust()) < 0 ||
        layer > 1) {
      return Nan::ThrowRangeError("Expected font effect layer Back or Front");
    }
  } else if (field == "fingerprint") {
    bool lossless = false;
    if (info[2]->IsBigInt()) {
      fingerprint = info[2].As<v8::BigInt>()->Uint64Value(&lossless);
    }
    if (!lossless || fingerprint > std::numeric_limits<size_t>::max()) {
      return Nan::ThrowRangeError("Expected a size_t font effect fingerprint");
    }
  } else {
    return Nan::ThrowTypeError("Unknown writable font effect field");
  }
  // Colour conversion can invoke user getters and restart the runtime.
  auto* state = EffectOf(info[0]);
  if (!state) {
    return;
  }
  auto result = CopyEffectMetadata(state->value);
  if (field == "colour") {
    result->SetColour(colour.Get<Rml::Colourb>());
  } else if (field == "layer") {
    result->SetLayer(static_cast<Rml::FontEffect::Layer>(layer));
  } else {
    result->SetFingerprint(static_cast<size_t>(fingerprint));
  }
  state->value = std::move(result);
  BindFontEffectCallbacks(info[0].As<v8::Object>(), state->value.get());
}

NAN_METHOD(GetGlyphMetrics) {
  Rml::Vector2i origin;
  Rml::Vector2i dimensions;
  if ((!info[2]->IsUndefined() && !ReadGlyphVector(info[2], &origin)) ||
      (!info[3]->IsUndefined() && !ReadGlyphVector(info[3], &dimensions))) {
    return;
  }
  const auto* glyph = FontGlyphOf(info[1], false);
  if (!glyph) {
    return;
  }
  auto* state = EffectOf(info[0]);
  if (!state) {
    return;
  }
  if (info[3]->IsUndefined()) {
    dimensions = glyph->bitmap_dimensions;
  }
  if (!ValidateGlyphDimensions(dimensions)) {
    return;
  }
  const auto value = state->value;
  bool supported;
  if (IsCustomFontEffect(value.get())) {
    Rml::FontGlyph snapshot;
    if (!SnapshotFontGlyph(info[1], &snapshot)) {
      return;
    }
    supported = value->GetGlyphMetrics(origin, dimensions, snapshot);
  } else {
    // Built-ins translate origins; isolate that translation to avoid overflow.
    Rml::Vector2i offset;
    supported = value->GetGlyphMetrics(offset, dimensions, *glyph);
    const int64_t x = int64_t{origin.x} + offset.x;
    const int64_t y = int64_t{origin.y} + offset.y;
    if (x < std::numeric_limits<int>::min() ||
        x > std::numeric_limits<int>::max() ||
        y < std::numeric_limits<int>::min() ||
        y > std::numeric_limits<int>::max()) {
      return Nan::ThrowRangeError("Glyph origin exceeds native int32 bounds");
    }
    origin = {static_cast<int>(x), static_cast<int>(y)};
  }
  if (!ValidateGlyphDimensions(dimensions)) {
    return;
  }
  auto result = Nan::New<v8::Object>();
  Own(result, "supported", Nan::New(supported));
  Own(result, "origin", GlyphVectorToJs(origin));
  Own(result, "dimensions", GlyphVectorToJs(dimensions));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(GenerateGlyphTexture) {
  GlyphDestination destination;
  if (!ReadGlyphDestination(info[1], info[2], info[3], &destination)) {
    return;
  }
  const auto* glyph = FontGlyphOf(info[4], destination.size != 0);
  if (!glyph) {
    return;
  }
  auto* state = EffectOf(info[0]);
  if (!state) {
    return;
  }
  if (!destination.size) {
    return;
  }
  const size_t source_bytes =
      size_t(glyph->bitmap_dimensions.x) * glyph->bitmap_dimensions.y *
      (glyph->color_format == Rml::ColorFormat::A8 ? 1 : 4);
  const auto src = reinterpret_cast<uintptr_t>(glyph->bitmap_data);
  const auto dst = reinterpret_cast<uintptr_t>(destination.data);
  if (source_bytes && src < dst + destination.size &&
      dst < src + source_bytes) {
    return Nan::ThrowTypeError("Glyph source and destination buffers overlap");
  }
  const auto value = state->value;
  Rml::FontGlyph snapshot;
  if (IsCustomFontEffect(value.get())) {
    if (!SnapshotFontGlyph(info[4], &snapshot)) {
      return;
    }
    GenerateCustomFontGlyphTexture(
        value.get(), destination, snapshot, info[1].As<v8::Uint8Array>());
  } else {
    value->GenerateGlyphTexture(
        destination.data, destination.dimensions, destination.stride, *glyph);
  }
}

NAN_METHOD(FillColorValuesFromAlpha) {
  GlyphDestination destination;
  if (ReadGlyphDestination(info[0], info[1], info[2], &destination) &&
      destination.size) {
    FontEffectAccess::FillColorValuesFromAlpha(
        destination.data, destination.dimensions, destination.stride);
  }
}

}  // namespace

v8::Local<v8::Object> WrapFontEffect(
    const Rml::SharedPtr<const Rml::FontEffect>& value) {
  auto state = std::make_shared<FontEffectState>();
  state->value = value;
  state->generation = State().generation;
  auto& effects = State().font_effects;
  if (effects.size() >= State().font_effect_sweep_threshold) {
    std::erase_if(effects, [](const auto& weak) { return weak.expired(); });
    State().font_effect_sweep_threshold =
        std::max(size_t{64}, effects.size() * 2);
  }
  effects.emplace_back(state);
  auto result = FontEffectHandle::Create(std::move(state));
  BindFontEffectCallbacks(result, value.get());
  return result;
}

bool CopyFontEffect(v8::Local<v8::Value> handle,
                    Rml::SharedPtr<const Rml::FontEffect>* result) {
  auto* state = EffectOf(handle);
  if (!state) {
    return false;
  }
  *result = state->value;
  return true;
}

void ReleaseFontEffects() {
  ReleaseFontEffectCallbacks();
  for (auto& weak : State().font_effects) {
    if (auto state = weak.lock()) {
      state->value.reset();
      state->generation = 0;
    }
  }
  State().font_effects.clear();
  State().font_effect_sweep_threshold = 64;
  State().edited_font_effects.clear();
  State().edited_font_effect_sweep_threshold = 64;
}

const Rml::FontEffect* FontEffectImplementation(const Rml::FontEffect* value) {
  const auto found = State().edited_font_effects.find(value);
  if (found != State().edited_font_effects.end()) {
    if (const auto edited = found->second.lock()) {
      return edited->Implementation();
    }
  }
  return value;
}

Rml::SharedPtr<Rml::FontEffect> CloneFontEffect(v8::Local<v8::Value> handle) {
  auto* state = EffectOf(handle);
  return state ? CopyEffectMetadata(state->value) : nullptr;
}

NAN_MODULE_INIT(InitializeRmlFontEffect) {
  sfmljs::SetMethod<FillColorValuesFromAlpha>(target,
                                              "fillColorValuesFromAlpha");
  SetInstancerValueMethod<CreateFontEffect, true>(target, "createFontEffect");
  SetInstancerValueMethod<ReadFontEffect, true>(target, "readFontEffect");
  SetInstancerValueMethod<WriteFontEffect, true>(target, "writeFontEffect");
  SetInstancerValueMethod<GetGlyphMetrics>(target, "getGlyphMetrics");
  SetInstancerValueMethod<GenerateGlyphTexture>(target, "generateGlyphTexture");
}

}  // namespace sfmlrmlui
