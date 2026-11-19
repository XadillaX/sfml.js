// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/fonts/rmlui-font-glyph.h"

#include <sfml-js-interop.h>

#include <cstdint>
#include <cstring>
#include <limits>
#include <memory>

#include "native/data/rmlui-data-diagnostics.h"

namespace sfmlrmlui {
namespace {

// Keep the owning glyph separate so replacing an allocation cannot invalidate
// WeakCopy pointers or exported views. Native unique_ptr owns every byte.
struct GlyphBitmap {
  Rml::FontGlyph owner;
  size_t size{0};
};

struct GlyphState {
  Rml::FontGlyph value;
  std::shared_ptr<GlyphBitmap> bitmap;
  bool owns_bitmap{false};
};

using GlyphHandle = sfmljs::SharedHandle<GlyphState>;

void Own(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

v8::Local<v8::Object> WrapGlyph(const std::shared_ptr<GlyphState>& owner) {
  auto result = Nan::New<v8::Object>();
  Own(result, "handle", GlyphHandle::Create(owner));
  auto map = [&](const char* name, void* data, size_t count) {
    auto buffer = sfmljs::MapShared(
        v8::Isolate::GetCurrent(), owner, data, count * sizeof(int32_t));
    Own(result, name, v8::Int32Array::New(buffer, 0, count));
  };
  static_assert(sizeof(Rml::ColorFormat) == sizeof(int32_t));
  static_assert(sizeof(Rml::Vector2i) == 2 * sizeof(int32_t));
  map("bearingView", &owner->value.bearing, 2);
  map("advanceView", &owner->value.advance, 1);
  map("bitmapDimensionsView", &owner->value.bitmap_dimensions, 2);
  map("colorFormatView", &owner->value.color_format, 1);
  return result;
}

NAN_METHOD(CreateFontGlyph) {
  info.GetReturnValue().Set(WrapGlyph(std::make_shared<GlyphState>()));
}

NAN_METHOD(WeakCopyFontGlyph) {
  auto* checked = GlyphHandle::From(info[0]);
  if (!checked) {
    return;
  }
  auto result = std::make_shared<GlyphState>();
  result->value = checked->owner()->value.WeakCopy();
  result->bitmap = checked->owner()->bitmap;
  info.GetReturnValue().Set(WrapGlyph(result));
}

NAN_METHOD(GetGlyphBitmap) {
  auto* checked = GlyphHandle::From(info[0]);
  if (!checked) {
    return;
  }
  const auto& state = checked->owner();
  const auto& bitmap = state->bitmap;
  if (!bitmap || (info[1]->IsTrue() && !state->owns_bitmap)) {
    return info.GetReturnValue().Set(Nan::Null());
  }
  auto buffer = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                  bitmap,
                                  bitmap->owner.bitmap_owned_data.get(),
                                  bitmap->size);
  info.GetReturnValue().Set(v8::Uint8Array::New(buffer, 0, bitmap->size));
}

NAN_METHOD(SetGlyphBitmap) {
  auto* checked = GlyphHandle::From(info[0]);
  if (!checked) {
    return;
  }
  auto& state = *checked->owner();
  if (info[1]->IsNull()) {
    state.value.bitmap_data = nullptr;
    state.bitmap.reset();
    state.owns_bitmap = false;
    return;
  }
  if (!info[1]->IsUint8Array()) {
    return Nan::ThrowTypeError("Expected glyph bitmap Uint8Array or null");
  }
  const auto view = info[1].As<v8::Uint8Array>();
  const auto buffer = view->Buffer();
  if (buffer->WasDetached()) {
    return Nan::ThrowTypeError("Cannot copy a detached glyph bitmap");
  }
  if (buffer->GetBackingStore()->IsShared()) {
    return Nan::ThrowTypeError("Cannot copy a shared glyph bitmap");
  }
  auto bitmap = std::make_shared<GlyphBitmap>();
  bitmap->size = view->ByteLength();
  bitmap->owner.bitmap_owned_data = std::make_unique<Rml::byte[]>(bitmap->size);
  view->CopyContents(bitmap->owner.bitmap_owned_data.get(), bitmap->size);
  state.value.bitmap_data = bitmap->owner.bitmap_owned_data.get();
  state.bitmap = std::move(bitmap);
  state.owns_bitmap = true;
}

}  // namespace

bool ReadGlyphDestination(v8::Local<v8::Value> input,
                          v8::Local<v8::Value> dimensions,
                          v8::Local<v8::Value> stride,
                          GlyphDestination* result) {
  if (!ReadGlyphVector(dimensions, &result->dimensions) ||
      !ValidateGlyphDimensions(result->dimensions)) {
    return false;
  }
  if (!stride->IsInt32() ||
      Nan::To<int>(stride).FromJust() < result->dimensions.x * 4) {
    Nan::ThrowRangeError("Glyph destination stride is too small");
    return false;
  }
  result->stride = Nan::To<int>(stride).FromJust();
  if (!input->IsUint8Array()) {
    Nan::ThrowTypeError("Expected a glyph destination Uint8Array");
    return false;
  }
  const auto view = input.As<v8::Uint8Array>();
  const auto buffer = view->Buffer();
  if (buffer->WasDetached()) {
    Nan::ThrowTypeError("Cannot write a detached glyph buffer");
    return false;
  }
  result->backing = buffer->GetBackingStore();
  if (result->backing->IsShared()) {
    Nan::ThrowTypeError("Cannot write a shared glyph buffer");
    return false;
  }
  const auto size = result->dimensions;
  const int64_t bytes =
      size.x && size.y ? int64_t{size.y - 1} * result->stride + size.x * 4 : 0;
  if (bytes > std::numeric_limits<int>::max() ||
      static_cast<uint64_t>(bytes) > view->ByteLength()) {
    Nan::ThrowRangeError("Glyph destination buffer is too small");
    return false;
  }
  result->size = static_cast<size_t>(bytes);
  // An empty backing store can have a null Data(); do not offset it.
  result->data = bytes ? static_cast<Rml::byte*>(result->backing->Data()) +
                             view->ByteOffset()
                       : nullptr;
  return true;
}

bool ValidateGlyphDimensions(Rml::Vector2i dimensions) {
  // Native filters index and multiply with signed int, including RGBA stride.
  constexpr auto limit = std::numeric_limits<int>::max() / 4;
  if (dimensions.x < 0 || dimensions.y < 0 || dimensions.x > limit ||
      dimensions.y > limit || int64_t{dimensions.x} * dimensions.y > limit) {
    Nan::ThrowRangeError("Glyph dimensions exceed native bitmap bounds");
    return false;
  }
  return true;
}

const Rml::FontGlyph* FontGlyphOf(v8::Local<v8::Value> handle,
                                  bool require_bitmap) {
  auto* checked = GlyphHandle::From(handle);
  if (!checked) {
    return nullptr;
  }
  const auto& state = *checked->owner();
  const auto& glyph = state.value;
  if (glyph.color_format != Rml::ColorFormat::A8 &&
      glyph.color_format != Rml::ColorFormat::RGBA8) {
    Nan::ThrowRangeError("Expected glyph color format A8 or RGBA8");
    return nullptr;
  }
  if (!ValidateGlyphDimensions(glyph.bitmap_dimensions)) {
    return nullptr;
  }
  const auto bytes = size_t{static_cast<unsigned>(glyph.bitmap_dimensions.x)} *
                     glyph.bitmap_dimensions.y *
                     (glyph.color_format == Rml::ColorFormat::A8 ? 1 : 4);
  if (require_bitmap && bytes &&
      (!state.bitmap || state.bitmap->size < bytes)) {
    Nan::ThrowRangeError(
        "Glyph bitmap is missing or smaller than its dimensions");
    return nullptr;
  }
  return &glyph;
}

bool ReadGlyphVector(v8::Local<v8::Value> input, Rml::Vector2i* result) {
  if (!input->IsObject()) {
    Nan::ThrowTypeError("Expected glyph vector with int32 x and y");
    return false;
  }
  auto object = input.As<v8::Object>();
  v8::Local<v8::Value> x;
  v8::Local<v8::Value> y;
  if (!Nan::Get(object, Nan::New("x").ToLocalChecked()).ToLocal(&x) ||
      !Nan::Get(object, Nan::New("y").ToLocalChecked()).ToLocal(&y)) {
    return false;
  }
  if (!x->IsInt32() || !y->IsInt32()) {
    Nan::ThrowRangeError("Expected glyph vector with int32 x and y");
    return false;
  }
  *result = {Nan::To<int>(x).FromJust(), Nan::To<int>(y).FromJust()};
  return true;
}

v8::Local<v8::Object> GlyphVectorToJs(Rml::Vector2i value) {
  auto result = Nan::New<v8::Object>();
  Own(result, "x", Nan::New(value.x));
  Own(result, "y", Nan::New(value.y));
  return result;
}

bool SnapshotFontGlyph(v8::Local<v8::Value> handle, Rml::FontGlyph* result) {
  const auto* glyph = FontGlyphOf(handle, false);
  if (!glyph || (glyph->bitmap_data && !FontGlyphOf(handle, true))) {
    return false;
  }
  *result = glyph->WeakCopy();
  if (glyph->bitmap_data) {
    const size_t bytes = size_t(glyph->bitmap_dimensions.x) *
                         glyph->bitmap_dimensions.y *
                         (glyph->color_format == Rml::ColorFormat::A8 ? 1 : 4);
    result->bitmap_owned_data = std::make_unique<Rml::byte[]>(bytes);
    if (bytes) {
      RecordDiagnosticGlyphCopy(bytes);
      std::memcpy(result->bitmap_owned_data.get(), glyph->bitmap_data, bytes);
    }
    result->bitmap_data = result->bitmap_owned_data.get();
  }
  return true;
}

v8::Local<v8::Object> WrapFontGlyphSnapshot(const Rml::FontGlyph& glyph) {
  auto state = std::make_shared<GlyphState>();
  state->value = glyph.WeakCopy();
  if (glyph.bitmap_data) {
    auto bitmap = std::make_shared<GlyphBitmap>();
    bitmap->size = size_t(glyph.bitmap_dimensions.x) *
                   glyph.bitmap_dimensions.y *
                   (glyph.color_format == Rml::ColorFormat::A8 ? 1 : 4);
    bitmap->owner.bitmap_owned_data =
        std::make_unique<Rml::byte[]>(bitmap->size);
    if (bitmap->size) {
      RecordDiagnosticGlyphCopy(bitmap->size);
      std::memcpy(bitmap->owner.bitmap_owned_data.get(),
                  glyph.bitmap_data,
                  bitmap->size);
    }
    state->value.bitmap_data = bitmap->owner.bitmap_owned_data.get();
    state->bitmap = std::move(bitmap);
    state->owns_bitmap = true;
  }
  return WrapGlyph(state);
}

NAN_MODULE_INIT(InitializeRmlFontGlyph) {
  sfmljs::SetMethod<CreateFontGlyph>(target, "createFontGlyph");
  sfmljs::SetMethod<WeakCopyFontGlyph>(target, "weakCopyFontGlyph");
  sfmljs::SetMethod<GetGlyphBitmap>(target, "getGlyphBitmap");
  sfmljs::SetMethod<SetGlyphBitmap>(target, "setGlyphBitmap");
}

}  // namespace sfmlrmlui
