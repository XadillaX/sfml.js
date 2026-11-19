// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_MEASURE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_MEASURE_H_

#include <nan.h>

#include <array>
#include <cstdint>
#include <memory>
#include <vector>

namespace sfmlrmlui {

// Fixed native allocations shared with JS. Never resize a mapped vector.
struct FontMeasureState {
  uint32_t capacity{0};
  uint32_t byte_capacity{0};
  std::vector<uint8_t> bytes;
  std::vector<uint32_t> offsets;
  std::vector<int32_t> widths;
};

// A provider's reusable callback workspace. V8 edges live only in the owning
// environment; escaped mapped arrays retain pure FontMeasureState allocations.
class FontMeasureWorkspace {
 public:
  v8::Local<v8::Object> Prepare(const uint8_t* bytes,
                                const uint32_t* offsets,
                                uint32_t count);
  bool Attached() const;
  void Reset();
  const std::shared_ptr<FontMeasureState>& storage() const { return storage_; }

 private:
  std::shared_ptr<FontMeasureState> storage_;
  v8::Global<v8::Object> object_;
  std::array<v8::Global<v8::ArrayBuffer>, 3> views_;
};

// Check original mapped views without re-reading mutable input bytes/offsets.
bool FontMeasureAttached(v8::Local<v8::Value> input);
// Validate every active UTF-8 slice before the first width is written.
std::shared_ptr<FontMeasureState> FontMeasureOf(v8::Local<v8::Value> input,
                                                uint32_t count);
void InitializeFontMeasureBuffer(v8::Local<v8::Object> target);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_FONTS_RMLUI_FONT_MEASURE_H_
