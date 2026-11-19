// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/fonts/rmlui-fonts.h"

#include <RmlUi/Core/Core.h>
#include <nan.h>

#include "native/rendering/textures/rmlui-resource-preload.h"
#include "native/rendering/textures/rmlui-resources.h"
#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

struct FontArguments {
  Rml::Style::FontStyle style{Rml::Style::FontStyle::Normal};
  Rml::Style::FontWeight weight{Rml::Style::FontWeight::Auto};
  bool fallback{false};
  int face_index{0};
};

bool ReadFontArguments(const Nan::FunctionCallbackInfo<v8::Value>& info,
                       bool named,
                       int offset,
                       FontArguments* result) {
  if (named) {
    if (!info[offset + 2]->IsInt32()) {
      Nan::ThrowTypeError("Expected a FontStyle");
      return false;
    }
    const int style = Nan::To<int>(info[offset + 2]).FromJust();
    if (style < 0 || style > 1) {
      Nan::ThrowRangeError("Expected FontStyle.Normal or FontStyle.Italic");
      return false;
    }
    result->style = static_cast<Rml::Style::FontStyle>(style);
  }

  const auto weight = info[offset + (named ? 3 : 2)];
  if (!weight->IsUndefined()) {
    if (!weight->IsInt32()) {
      Nan::ThrowTypeError("Expected an integer font weight");
      return false;
    }
    const int value = Nan::To<int>(weight).FromJust();
    if (value < 0 || value > 1000) {
      Nan::ThrowRangeError("Expected font weight Auto (0) or 1 through 1000");
      return false;
    }
    result->weight = static_cast<Rml::Style::FontWeight>(value);
  }
  const auto fallback = info[offset + (named ? 4 : 1)];
  if (!fallback->IsUndefined()) {
    if (!fallback->IsBoolean()) {
      Nan::ThrowTypeError("Expected a fallback boolean");
      return false;
    }
    result->fallback = fallback->IsTrue();
  }
  const auto face_index = info[offset + (named ? 5 : 3)];
  if (!face_index->IsUndefined()) {
    if (!face_index->IsInt32() || Nan::To<int>(face_index).FromJust() < 0) {
      Nan::ThrowRangeError("Expected a nonnegative int32 font face index");
      return false;
    }
    result->face_index = Nan::To<int>(face_index).FromJust();
  }
  return true;
}

NAN_METHOD(LoadFontFace) {
  LoadFontSource(info);
}

NAN_METHOD(ReleaseFontResources) {
  if (!CanReleaseGlobalResources()) {
    return;
  }
  ++State().font_generation;
  InvalidateResourcePreloads(nullptr, nullptr, true);
  Rml::ReleaseFontResources();
}

static_assert(static_cast<int>(Rml::Style::FontStyle::Normal) == 0);
static_assert(static_cast<int>(Rml::Style::FontStyle::Italic) == 1);
static_assert(static_cast<int>(Rml::Style::FontWeight::Auto) == 0);
static_assert(static_cast<int>(Rml::Style::FontWeight::Normal) == 400);
static_assert(static_cast<int>(Rml::Style::FontWeight::Bold) == 700);

}  // namespace

void LoadFontSource(const Nan::FunctionCallbackInfo<v8::Value>& info,
                    int offset) {
  if (!info[offset]->IsString() && !info[offset]->IsUint8Array()) {
    return Nan::ThrowTypeError("Expected a font path or Uint8Array");
  }
  const bool named = info[offset + 1]->IsString();
  if (!named && !info[offset]->IsString()) {
    return Nan::ThrowTypeError("Memory fonts require a family and style");
  }
  FontArguments options;
  if (!ReadFontArguments(info, named, offset, &options)) {
    return;
  }

  Rml::String family;
  if (named) {
    Nan::Utf8String value(info[offset + 1]);
    family.assign(*value, value.length());
  }
  if (info[offset]->IsString()) {
    State().data_diagnostics.Record(
        &DataDiagnostics::resource_main_thread_reads);
    Nan::Utf8String value(info[offset]);
    const Rml::String path(*value, value.length());
    const bool loaded =
        named ? Rml::LoadFontFace(path,
                                  family,
                                  options.style,
                                  options.weight,
                                  options.fallback,
                                  options.face_index)
              : Rml::LoadFontFace(
                    path, options.fallback, options.weight, options.face_index);
    info.GetReturnValue().Set(loaded);
    return;
  }

  const auto view = info[offset].As<v8::Uint8Array>();
  const auto buffer = view->Buffer();
  if (buffer->WasDetached()) {
    return Nan::ThrowTypeError("Cannot load a detached font buffer");
  }
  if (buffer->GetBackingStore()->IsShared()) {
    return Nan::ThrowTypeError("Cannot load a shared font buffer");
  }
  // Native font engines borrow bytes until Shutdown. Copy only the view, not
  // its backing buffer. Retain before calling the engine: a failed collection
  // load may already have registered some faces and kept pointers to the data.
  auto& bytes = State().font_data.emplace_back(view->ByteLength());
  view->CopyContents(bytes.data(), bytes.size());
  info.GetReturnValue().Set(Rml::LoadFontFace({bytes.data(), bytes.size()},
                                              family,
                                              options.style,
                                              options.weight,
                                              options.fallback,
                                              options.face_index));
}

NAN_MODULE_INIT(InitializeRmlFonts) {
  SetRuntimeMethod<LoadFontFace>(target, "loadFontFace");
  SetRuntimeMethod<ReleaseFontResources>(target, "releaseFontResources");
}

}  // namespace sfmlrmlui
