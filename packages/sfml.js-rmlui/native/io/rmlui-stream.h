// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_IO_RMLUI_STREAM_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_IO_RMLUI_STREAM_H_

#include <RmlUi/Core/Stream.h>
#include <nan.h>

#include <cstdint>
#include <memory>
#include <vector>

namespace sfmlrmlui {

enum class StreamKind { kMemory, kFile, kCustom };

// Native Seek takes C long, whose width differs between Windows and Unix.
using StreamOffset = long;  // NOLINT(runtime/int)

// Storage precedes value so a borrowed StreamMemory dies before its bytes.
struct StreamState {
  std::vector<Rml::byte> storage;
  std::unique_ptr<Rml::Stream> value;
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
  StreamKind kind{StreamKind::kMemory};
  bool read_only{false};
  bool opened{false};
};

std::shared_ptr<StreamState> ShareStream(v8::Local<v8::Value> input,
                                         bool require_open = true);
void ReleaseStreamBindings();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_IO_RMLUI_STREAM_H_
