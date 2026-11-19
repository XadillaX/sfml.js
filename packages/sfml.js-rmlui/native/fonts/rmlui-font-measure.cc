// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/fonts/rmlui-font-measure.h"

#include <sfml-js-interop.h>

#include <algorithm>
#include <array>
#include <limits>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

// Only the owning environment's wrapper holds V8 handles. Escaped/transferred
// backing stores retain pure native storage, whose deleter can run elsewhere.
struct MeasureBinding {
  std::shared_ptr<FontMeasureState> storage;
  std::array<v8::Global<v8::ArrayBuffer>, 3> views;
};
using MeasureHandle = sfmljs::SharedHandle<MeasureBinding>;

// Reject noncanonical encodings, surrogates and split multibyte characters.
bool ValidUtf8(const uint8_t* begin, const uint8_t* end) {
  while (begin < end) {
    const uint8_t lead = *begin++;
    if (lead < 0x80) {
      continue;
    }
    unsigned remaining;
    uint32_t codepoint;
    uint32_t minimum;
    if (lead >= 0xc2 && lead <= 0xdf) {
      remaining = 1;
      codepoint = lead & 0x1f;
      minimum = 0x80;
    } else if (lead >= 0xe0 && lead <= 0xef) {
      remaining = 2;
      codepoint = lead & 0x0f;
      minimum = 0x800;
    } else if (lead >= 0xf0 && lead <= 0xf4) {
      remaining = 3;
      codepoint = lead & 0x07;
      minimum = 0x10000;
    } else {
      return false;
    }
    if (static_cast<size_t>(end - begin) < remaining) {
      return false;
    }
    for (unsigned i = 0; i < remaining; ++i) {
      const uint8_t byte = *begin++;
      if ((byte & 0xc0) != 0x80) {
        return false;
      }
      codepoint = (codepoint << 6) | (byte & 0x3f);
    }
    if (codepoint < minimum || codepoint > 0x10ffff ||
        (codepoint >= 0xd800 && codepoint <= 0xdfff)) {
      return false;
    }
  }
  return true;
}

void Own(v8::Local<v8::Object> object,
         const char* key,
         v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

NAN_METHOD(Create) {
  if (!info[0]->IsUint32() || !info[1]->IsUint32() ||
      Nan::To<uint32_t>(info[0]).FromJust() >
          static_cast<uint32_t>(std::numeric_limits<int32_t>::max()) ||
      Nan::To<uint32_t>(info[1]).FromJust() >
          static_cast<uint32_t>(std::numeric_limits<int32_t>::max())) {
    return Nan::ThrowRangeError("Font measurement capacity must fit uint31");
  }
  auto owner = std::make_shared<FontMeasureState>();
  owner->capacity = Nan::To<uint32_t>(info[0]).FromJust();
  owner->byte_capacity = Nan::To<uint32_t>(info[1]).FromJust();
  // The sentinel allocations give empty StringViews a valid data pointer.
  owner->bytes.resize(std::max<uint32_t>(1, owner->byte_capacity));
  owner->offsets.resize(static_cast<size_t>(owner->capacity) + 1);
  owner->widths.resize(std::max<uint32_t>(1, owner->capacity));
  auto binding = std::make_shared<MeasureBinding>();
  binding->storage = owner;
  auto result = Nan::New<v8::Object>();
  Own(result, "handle", MeasureHandle::Create(binding));
  auto bytes = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                 owner,
                                 owner->bytes.data(),
                                 owner->byte_capacity);
  auto offsets = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                   owner,
                                   owner->offsets.data(),
                                   owner->offsets.size() * sizeof(uint32_t));
  auto widths = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                  owner,
                                  owner->widths.data(),
                                  owner->capacity * sizeof(int32_t));
  const std::array<v8::Local<v8::ArrayBuffer>, 3> views{bytes, offsets, widths};
  for (size_t i = 0; i < views.size(); ++i) {
    binding->views[i].Reset(v8::Isolate::GetCurrent(), views[i]);
    binding->views[i].SetWeak();
  }
  Own(result, "bytes", v8::Uint8Array::New(bytes, 0, owner->byte_capacity));
  Own(result,
      "offsets",
      v8::Uint32Array::New(offsets, 0, owner->offsets.size()));
  Own(result, "widths", v8::Int32Array::New(widths, 0, owner->capacity));
  State().data_diagnostics.Record(
      &DataDiagnostics::font_measure_storage_allocations, 5);
  info.GetReturnValue().Set(result);
}

}  // namespace

v8::Local<v8::Object> FontMeasureWorkspace::Prepare(const uint8_t* bytes,
                                                    const uint32_t* offsets,
                                                    uint32_t count) {
  const auto maximum =
      static_cast<uint32_t>(std::numeric_limits<int32_t>::max());
  const uint32_t length = offsets[count];
  if (count > maximum || length > maximum) {
    Nan::ThrowRangeError("Packed font measurement capacity must fit uint31");
    return {};
  }
  if (!Attached() || count > storage_->capacity ||
      length > storage_->byte_capacity) {
    const auto grow = [](uint32_t current, uint32_t required) {
      uint64_t capacity = std::max<uint32_t>(16, current);
      while (capacity < required) {
        capacity *= 2;
      }
      return static_cast<uint32_t>(
          std::min<uint64_t>(capacity, std::numeric_limits<int32_t>::max()));
    };
    auto owner = std::make_shared<FontMeasureState>();
    owner->capacity = grow(storage_ ? storage_->capacity : 0, count);
    owner->byte_capacity = grow(storage_ ? storage_->byte_capacity : 0, length);
    owner->bytes.resize(owner->byte_capacity);
    owner->offsets.resize(static_cast<size_t>(owner->capacity) + 1);
    owner->widths.resize(owner->capacity);
    auto object = Nan::New<v8::Object>();
    auto byte_view = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                       owner,
                                       owner->bytes.data(),
                                       owner->bytes.size());
    auto offset_view =
        sfmljs::MapShared(v8::Isolate::GetCurrent(),
                          owner,
                          owner->offsets.data(),
                          owner->offsets.size() * sizeof(uint32_t));
    auto width_view = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                        owner,
                                        owner->widths.data(),
                                        owner->widths.size() * sizeof(int32_t));
    const std::array<v8::Local<v8::ArrayBuffer>, 3> views{
        byte_view, offset_view, width_view};
    for (size_t i = 0; i < views.size(); ++i) {
      views_[i].Reset(v8::Isolate::GetCurrent(), views[i]);
      views_[i].SetWeak();
    }
    Own(object,
        "bytes",
        v8::Uint8Array::New(byte_view, 0, owner->byte_capacity));
    Own(object,
        "offsets",
        v8::Uint32Array::New(offset_view, 0, owner->offsets.size()));
    Own(object, "widths", v8::Int32Array::New(width_view, 0, owner->capacity));
    object
        ->SetIntegrityLevel(Nan::GetCurrentContext(),
                            v8::IntegrityLevel::kFrozen)
        .FromJust();
    object_.Reset(v8::Isolate::GetCurrent(), object);
    object_.SetWeak();
    storage_ = std::move(owner);
    State().data_diagnostics.Record(
        &DataDiagnostics::font_measure_storage_allocations, 5);
  }
  std::copy_n(bytes, length, storage_->bytes.begin());
  std::copy_n(
      offsets, static_cast<size_t>(count) + 1, storage_->offsets.begin());
  std::fill_n(storage_->widths.begin(), count, 0);
  State().data_diagnostics.Record(
      &DataDiagnostics::font_measure_copied_bytes,
      length + (static_cast<uint64_t>(count) + 1) * sizeof(uint32_t));
  return object_.Get(v8::Isolate::GetCurrent());
}

bool FontMeasureWorkspace::Attached() const {
  if (!storage_ || object_.IsEmpty()) {
    return false;
  }
  for (const auto& view : views_) {
    if (view.IsEmpty() || view.Get(v8::Isolate::GetCurrent())->WasDetached()) {
      return false;
    }
  }
  return true;
}

void FontMeasureWorkspace::Reset() {
  object_.Reset();
  for (auto& view : views_) {
    view.Reset();
  }
  storage_.reset();
}

bool FontMeasureAttached(v8::Local<v8::Value> input) {
  auto* handle = MeasureHandle::From(input);
  if (!handle) {
    return false;
  }
  const auto binding = handle->owner();
  for (const auto& view : binding->views) {
    if (view.IsEmpty() || view.Get(v8::Isolate::GetCurrent())->WasDetached()) {
      Nan::ThrowTypeError("Font measurement storage is detached or expired");
      return false;
    }
  }
  return true;
}

std::shared_ptr<FontMeasureState> FontMeasureOf(v8::Local<v8::Value> input,
                                                uint32_t count) {
  auto* handle = MeasureHandle::From(input);
  if (!handle) {
    return {};
  }
  const auto binding = handle->owner();
  for (const auto& view : binding->views) {
    if (view.IsEmpty() || view.Get(v8::Isolate::GetCurrent())->WasDetached()) {
      Nan::ThrowTypeError(
          "Font measurement buffer view is detached or expired");
      return {};
    }
  }
  const auto owner = binding->storage;
  if (count > owner->capacity) {
    Nan::ThrowRangeError("Font measurement count exceeds capacity");
    return {};
  }
  if (owner->offsets[0] != 0) {
    Nan::ThrowRangeError("Font measurement offsets must start at zero");
    return {};
  }
  for (uint32_t i = 0; i < count; ++i) {
    const uint32_t begin = owner->offsets[i];
    const uint32_t end = owner->offsets[i + 1];
    if (begin > end || end > owner->byte_capacity) {
      Nan::ThrowRangeError("Font measurement offsets exceed ordered bounds");
      return {};
    }
    if (!ValidUtf8(owner->bytes.data() + begin, owner->bytes.data() + end)) {
      Nan::ThrowRangeError("Font measurement slice must contain valid UTF-8");
      return {};
    }
  }
  return owner;
}

void InitializeFontMeasureBuffer(v8::Local<v8::Object> target) {
  SetRuntimeMethod<Create, true, false>(target, "createFontMeasureBuffer");
}

}  // namespace sfmlrmlui
