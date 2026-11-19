// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/io/rmlui-stream.h"

#include <RmlUi/Core/StreamMemory.h>

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstring>
#include <limits>
#include <utility>

#include "native/io/rmlui-stream-callbacks.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-buffer.h"
#include "third_party/rmlui/Source/Core/StreamFile.h"

namespace sfmlrmlui {
namespace {

using StreamHandle = sfmljs::SharedHandle<StreamState>;
constexpr size_t kMaxBatch = std::numeric_limits<int>::max();

std::vector<std::weak_ptr<StreamState>>& Streams() {
  static std::vector<std::weak_ptr<StreamState>> streams;
  return streams;
}

void Track(const std::shared_ptr<StreamState>& state) {
  static size_t threshold = 64;
  if (Streams().size() >= threshold) {
    std::erase_if(Streams(), [](const auto& weak) { return weak.expired(); });
    threshold = std::max(size_t{64}, Streams().size() * 2);
  }
  Streams().push_back(state);
}

bool ReadSize(v8::Local<v8::Value> input, size_t* result) {
  if (!input->IsNumber()) {
    Nan::ThrowTypeError("Expected a numeric byte count or size");
    return false;
  }
  const double count = Nan::To<double>(input).FromJust();
  if (!std::isfinite(count) || std::floor(count) != count || count < 0 ||
      count > kMaxBatch) {
    Nan::ThrowRangeError("Byte count or size exceeds native batch range");
    return false;
  }
  *result = static_cast<size_t>(count);
  return true;
}

bool ReadURL(v8::Local<v8::Value> input, Rml::String* result) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a stream source URL string");
    return false;
  }
  Nan::Utf8String text(input);
  result->assign(*text, text.length());
  if (result->find('\0') != Rml::String::npos) {
    Nan::ThrowTypeError("Stream source URL cannot contain a null byte");
    return false;
  }
  return true;
}

struct ByteView {
  std::shared_ptr<v8::BackingStore> backing;
  Rml::byte* data{nullptr};
  size_t length{0};
};

bool ReadView(v8::Local<v8::Value> input, ByteView* result) {
  if (!input->IsUint8Array()) {
    Nan::ThrowTypeError("Expected a Uint8Array stream buffer");
    return false;
  }
  const auto view = input.As<v8::Uint8Array>();
  const auto buffer = view->Buffer();
  if (buffer->WasDetached()) {
    Nan::ThrowTypeError("Stream buffer is detached");
    return false;
  }
  result->backing = buffer->GetBackingStore();
  if (!IsFixedUnsharedBuffer(result->backing)) {
    Nan::ThrowTypeError("Stream buffer must be fixed and unshared");
    return false;
  }
  result->length = view->ByteLength();
  if (result->length > kMaxBatch) {
    Nan::ThrowRangeError("Stream buffer exceeds native batch range");
    return false;
  }
  result->data = static_cast<Rml::byte*>(result->backing->Data());
  if (result->data) {
    result->data += view->ByteOffset();
  }
  return true;
}

v8::Local<v8::Uint8Array> CopyBytes(const void* bytes, size_t count) {
  const auto buffer = v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), count);
  if (count) {
    std::memcpy(buffer->GetBackingStore()->Data(), bytes, count);
  }
  return v8::Uint8Array::New(buffer, 0, count);
}

bool Writable(const StreamState& state) {
  if (state.read_only) {
    Nan::ThrowTypeError("Cannot write or resize a read-only stream");
    return false;
  }
  return true;
}

Rml::StreamMemory* MemoryOf(const StreamState& state) {
  if (state.kind != StreamKind::kMemory) {
    Nan::ThrowTypeError("Operation requires a memory stream");
    return nullptr;
  }
  return static_cast<Rml::StreamMemory*>(state.value.get());
}

v8::Local<v8::Object> WrapStream(const std::shared_ptr<StreamState>& state) {
  state->generation = State().generation;
  auto result = StreamHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), result);
  state->handle.SetWeak();
  Track(state);
  return result;
}

NAN_METHOD(CreateMemory) {
  auto state = std::make_shared<StreamState>();
  if (info[0]->IsUndefined()) {
    state->value = std::make_unique<Rml::StreamMemory>();
  } else if (info[0]->IsUint8Array()) {
    ByteView input;
    if (!ReadView(info[0], &input)) {
      return;
    }
    // Even empty borrowed streams need valid pointer arithmetic upstream.
    state->storage.resize(std::max(size_t{1}, input.length));
    if (input.length) {
      std::memcpy(state->storage.data(), input.data, input.length);
    }
    state->value = std::make_unique<Rml::StreamMemory>(state->storage.data(),
                                                       input.length);
    state->read_only = true;
  } else {
    size_t count;
    if (!ReadSize(info[0], &count)) {
      return;
    }
    state->value =
        std::make_unique<Rml::StreamMemory>(std::max(size_t{1}, count));
  }
  info.GetReturnValue().Set(WrapStream(state));
}

NAN_METHOD(CreateFile) {
  auto state = std::make_shared<StreamState>();
  state->kind = StreamKind::kFile;
  state->read_only = true;
  state->value = std::make_unique<Rml::StreamFile>();
  info.GetReturnValue().Set(WrapStream(state));
}

NAN_METHOD(CreateCustom) {
  Rml::String url;
  if (!ReadURL(info[1], &url)) {
    return;
  }
  if (!info[2]->IsInt32() || Nan::To<int>(info[2]).FromJust() < 0 ||
      Nan::To<int>(info[2]).FromJust() > 15) {
    return Nan::ThrowRangeError("Invalid stream mode");
  }
  v8::Local<v8::Array> callbacks;
  if (!ReadStreamCallbacks(info[0]).ToLocal(&callbacks) || !RuntimeReady()) {
    return;
  }
  // Accessor callbacks may have restarted the runtime. Claim the generation
  // only after their complete snapshot, never before resolving callbacks.
  auto state = std::make_shared<StreamState>();
  state->kind = StreamKind::kCustom;
  state->value = MakeCallbackStream(
      callbacks, Rml::URL(url), Nan::To<int>(info[2]).FromJust());
  const auto handle = WrapStream(state);
  Nan::SetPrivate(
      handle, Nan::New("rml.stream.callbacks").ToLocalChecked(), callbacks)
      .FromJust();
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(OpenFile) {
  Rml::String path;
  if (!ReadURL(info[1], &path)) {
    return;
  }
  auto state = ShareStream(info[0], false);
  if (!state) {
    return;
  }
  if (state->kind != StreamKind::kFile) {
    return Nan::ThrowTypeError("Operation requires a file stream");
  }
  // Upstream Open sets mode before closing the previous handle. Close first
  // so reopening preserves MODE_READ and cannot retain stale file metadata.
  state->value->Close();
  state->opened = static_cast<Rml::StreamFile*>(state->value.get())->Open(path);
  if (!state->opened) {
    state->value->Close();
  }
  info.GetReturnValue().Set(state->opened);
}

NAN_METHOD(CloseStream) {
  if (auto state = ShareStream(info[0], false)) {
    state->value->Close();
    state->opened = false;
  }
}

template <auto method>
NAN_METHOD(QueryStream) {
  if (auto state = ShareStream(info[0])) {
    const auto result = (state->value.get()->*method)();
    if (State().callback_exception.IsEmpty()) {
      if constexpr (std::is_same_v<decltype(result), const bool>) {
        info.GetReturnValue().Set(result);
      } else {
        info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
      }
    }
  }
}

NAN_METHOD(WriteReady) {
  if (auto state = ShareStream(info[0], false)) {
    const bool ready = !state->read_only && state->value->IsWriteReady();
    info.GetReturnValue().Set(ready);
  }
}

NAN_METHOD(GetURL) {
  if (auto state = ShareStream(info[0], false)) {
    info.GetReturnValue().Set(
        Nan::New(state->value->GetSourceURL().GetURL()).ToLocalChecked());
  }
}

NAN_METHOD(SetURL) {
  Rml::String url;
  if (!ReadURL(info[1], &url)) {
    return;
  }
  if (auto state = ShareStream(info[0])) {
    if (auto* memory = MemoryOf(*state)) {
      memory->SetSourceURL(Rml::URL(url));
    }
  }
}

NAN_METHOD(GetMode) {
  if (auto state = ShareStream(info[0], false)) {
    info.GetReturnValue().Set(state->value->GetStreamMode());
  }
}

NAN_METHOD(SeekStream) {
  if (!info[1]->IsNumber()) {
    return Nan::ThrowTypeError("Expected a numeric stream offset");
  }
  const double offset = Nan::To<double>(info[1]).FromJust();
  if (!std::isfinite(offset) || std::floor(offset) != offset ||
      std::abs(offset) > 9007199254740991.0 ||
      offset < static_cast<double>(std::numeric_limits<StreamOffset>::min()) ||
      offset > static_cast<double>(std::numeric_limits<StreamOffset>::max())) {
    return Nan::ThrowRangeError("Stream offset exceeds native range");
  }
  if (!info[2]->IsInt32() || Nan::To<int>(info[2]).FromJust() < SEEK_SET ||
      Nan::To<int>(info[2]).FromJust() > SEEK_END) {
    return Nan::ThrowRangeError("Invalid stream seek origin");
  }
  auto state = ShareStream(info[0]);
  if (!state) {
    return;
  }
  const int origin = Nan::To<int>(info[2]).FromJust();
  if (state->kind == StreamKind::kMemory) {
    const double target = origin == SEEK_SET ? offset
                          : origin == SEEK_CUR
                              ? state->value->Tell() + offset
                              : state->value->Length() - offset;
    if (target < 0 || target > state->value->Length()) {
      info.GetReturnValue().Set(false);
      return;
    }
  }
  info.GetReturnValue().Set(
      state->value->Seek(static_cast<StreamOffset>(offset), origin));
}

bool CountForView(v8::Local<v8::Value> input, size_t length, size_t* count) {
  *count = length;
  if (!input->IsUndefined() && !ReadSize(input, count)) {
    return false;
  }
  if (*count > length) {
    Nan::ThrowRangeError("Byte count exceeds stream buffer bounds");
    return false;
  }
  return true;
}

size_t Remaining(const StreamState& state) {
  const size_t length = state.value->Length();
  if (!State().callback_exception.IsEmpty()) {
    return 0;
  }
  const size_t position = state.value->Tell();
  return length - std::min(length, position);
}

size_t CopyStream(const StreamState& source,
                  const StreamState& target,
                  size_t count) {
  if (&source == &target) {
    Nan::ThrowTypeError("Cannot copy a stream into itself");
    return 0;
  }
  if (!Writable(target)) {
    return 0;
  }
  if (target.kind == StreamKind::kMemory &&
      count > kMaxBatch - target.value->Length()) {
    Nan::ThrowRangeError("Copy exceeds memory stream capacity range");
    return 0;
  }
  Rml::byte buffer[1024];
  size_t copied = 0;
  while (copied < count && State().callback_exception.IsEmpty()) {
    const size_t read =
        source.value->Read(buffer, std::min(sizeof(buffer), count - copied));
    if (!read || !State().callback_exception.IsEmpty()) {
      break;
    }
    target.value->Write(buffer, read);
    // Native Read(Stream*) counts source bytes even on short writes.
    copied += read;
  }
  return copied;
}

NAN_METHOD(ReadStream) {
  const bool peek = info[3]->IsTrue();
  ByteView output;
  size_t count;
  const bool allocate = info[1]->IsNumber();
  const bool view = info[1]->IsUint8Array();
  if (allocate) {
    if (!ReadSize(info[1], &count)) {
      return;
    }
  } else if (view && (!ReadView(info[1], &output) ||
                      !CountForView(info[2], output.length, &count))) {
    return;
  }
  if (!allocate && !view && !info[1]->IsObject()) {
    return Nan::ThrowTypeError("Expected a byte count, Uint8Array or stream");
  }
  auto state = ShareStream(info[0]);
  if (!state) {
    return;
  }
  if (!allocate && !view) {
    if (peek) {
      return Nan::ThrowTypeError("Peek requires a byte count or Uint8Array");
    }
    auto destination = ShareStream(info[1]);
    if (!destination) {
      return;
    }
    if (info[2]->IsUndefined()) {
      count = std::min(kMaxBatch, Remaining(*state));
    } else if (!ReadSize(info[2], &count)) {
      return;
    }
    if (!State().callback_exception.IsEmpty()) {
      return;
    }
    info.GetReturnValue().Set(
        Nan::New(static_cast<double>(CopyStream(*state, *destination, count))));
    return;
  }
  // Read into owned scratch even for a caller view. A custom callback may
  // detach a destination captured by its closure while native parsing runs.
  if (state->kind != StreamKind::kCustom) {
    count = std::min(count, Remaining(*state));
  }
  std::vector<Rml::byte> scratch(std::max(size_t{1}, count));
  const size_t read = count ? (peek ? state->value->Peek(scratch.data(), count)
                                    : state->value->Read(scratch.data(), count))
                            : 0;
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (allocate) {
    info.GetReturnValue().Set(CopyBytes(scratch.data(), read));
  } else {
    // Revalidate the original view after any stream callback.
    if (!ReadView(info[1], &output) || read > output.length) {
      return;
    }
    if (read) {
      std::memcpy(output.data, scratch.data(), read);
    }
    info.GetReturnValue().Set(Nan::New(static_cast<double>(read)));
  }
}

NAN_METHOD(WriteStream) {
  if (!info[3]->IsInt32() || Nan::To<int>(info[3]).FromJust() < 0 ||
      Nan::To<int>(info[3]).FromJust() > 3) {
    return Nan::ThrowTypeError("Invalid stream write operation");
  }
  const int operation = Nan::To<int>(info[3]).FromJust();
  std::vector<Rml::byte> bytes;
  size_t count = 0;
  const bool view = info[1]->IsUint8Array();
  const bool text = info[1]->IsString();
  if (view) {
    ByteView input;
    if (!ReadView(info[1], &input) ||
        !CountForView(info[2], input.length, &count)) {
      return;
    }
    bytes.resize(std::max(size_t{1}, count));
    if (count) {
      std::memcpy(bytes.data(), input.data, count);
    }
  } else if (text) {
    Nan::Utf8String input(info[1]);
    size_t length = input.length();
    if (operation == 3) {
      length = std::strlen(*input);
    }
    if (!CountForView(info[2], length, &count)) {
      return;
    }
    bytes.assign(reinterpret_cast<Rml::byte*>(*input),
                 reinterpret_cast<Rml::byte*>(*input) + count);
    bytes.resize(std::max(size_t{1}, bytes.size()));
  }
  auto state = ShareStream(info[0]);
  if (!state || !Writable(*state)) {
    return;
  }
  if (!view && !text) {
    if (operation) {
      return Nan::ThrowTypeError("Push requires a string or Uint8Array");
    }
    auto source = ShareStream(info[1]);
    if (!source) {
      return;
    }
    if (info[2]->IsUndefined()) {
      count = std::min(kMaxBatch, Remaining(*source));
    } else if (!ReadSize(info[2], &count)) {
      return;
    }
    if (!State().callback_exception.IsEmpty()) {
      return;
    }
    info.GetReturnValue().Set(
        Nan::New(static_cast<double>(CopyStream(*source, *state, count))));
    return;
  }
  if (state->kind == StreamKind::kMemory &&
      count > kMaxBatch - state->value->Length()) {
    return Nan::ThrowRangeError("Write exceeds memory stream capacity range");
  }
  size_t wrote = 0;
  if (count) {
    if (operation == 1) {
      wrote = state->value->PushFront(bytes.data(), count);
    } else if (operation == 2) {
      wrote = state->value->PushBack(bytes.data(), count);
    } else {
      wrote = state->value->Write(bytes.data(), count);
    }
  }
  info.GetReturnValue().Set(Nan::New(static_cast<double>(wrote)));
}

NAN_METHOD(ResizeStream) {
  size_t count;
  if (!ReadSize(info[1], &count)) {
    return;
  }
  if (!info[2]->IsInt32() || Nan::To<int>(info[2]).FromJust() < 0 ||
      Nan::To<int>(info[2]).FromJust() > 3) {
    return Nan::ThrowTypeError("Invalid stream resize operation");
  }
  const int operation = Nan::To<int>(info[2]).FromJust();
  size_t offset = 0;
  if (operation == 3 && !ReadSize(info[3], &offset)) {
    return;
  }
  auto state = ShareStream(info[0]);
  if (!state || !Writable(*state)) {
    return;
  }
  const size_t length = state->value->Length();
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (operation == 0) {
    info.GetReturnValue().Set(
        Nan::New(static_cast<double>(state->value->Truncate(count))));
    return;
  }
  if (operation == 2) {
    info.GetReturnValue().Set(Nan::New(
        static_cast<double>(state->value->PopBack(std::min(count, length)))));
    return;
  }
  if (state->kind == StreamKind::kCustom && operation == 1) {
    info.GetReturnValue().Set(Nan::New(
        static_cast<double>(state->value->PopFront(std::min(count, length)))));
    return;
  }
  auto* memory = MemoryOf(*state);
  if (!memory) {
    return;
  }
  if (offset > length) {
    return Nan::ThrowRangeError("Erase offset exceeds stream range");
  }
  count = std::min(count, length - offset);
  const size_t position = memory->Tell();
  // Native Erase does not repair the cursor, and PopFront subtracts before
  // clamping. Use safe Erase then a checked absolute seek.
  memory->Erase(offset, count);
  const size_t next = operation == 1 ? position - std::min(position, count)
                                     : std::min(position, length - count);
  memory->Seek(static_cast<StreamOffset>(next), SEEK_SET);
  if (operation == 1) {
    info.GetReturnValue().Set(Nan::New(static_cast<double>(count)));
  }
}

NAN_METHOD(RawStream) {
  if (auto state = ShareStream(info[0])) {
    if (auto* memory = MemoryOf(*state)) {
      info.GetReturnValue().Set(
          CopyBytes(memory->RawStream(), memory->Length()));
    }
  }
}

}  // namespace

std::shared_ptr<StreamState> ShareStream(v8::Local<v8::Value> input,
                                         bool require_open) {
  auto* handle = StreamHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a RmlUi stream");
    return {};
  }
  auto state = handle->owner();
  if (!state->value || state->generation != State().generation) {
    Nan::ThrowError("Stream is no longer valid for this runtime generation");
    return {};
  }
  if (require_open && state->kind == StreamKind::kFile && !state->opened) {
    Nan::ThrowError("File stream is closed; open it before use");
    return {};
  }
  return state;
}

void ReleaseStreamBindings() {
  for (const auto& weak : Streams()) {
    if (auto state = weak.lock()) {
      if (!state->handle.IsEmpty()) {
        Nan::DeletePrivate(state->handle.Get(v8::Isolate::GetCurrent()),
                           Nan::New("rml.stream.callbacks").ToLocalChecked())
            .FromJust();
        state->handle.Reset();
      }
      // Custom destruction never invokes JS. File destruction must precede
      // Rml::Shutdown, which invalidates the installed FileInterface.
      state->value.reset();
      state->storage.clear();
      state->generation = 0;
      state->opened = false;
    }
  }
  Streams().clear();
}

NAN_MODULE_INIT(InitializeRmlStream) {
  SetRuntimeMethod<CreateMemory, true>(target, "createStreamMemory");
  SetRuntimeMethod<CreateFile, true>(target, "createStreamFile");
  SetRuntimeMethod<CreateCustom, true>(target, "createStream");
  SetRuntimeMethod<OpenFile, true>(target, "streamOpen");
  SetRuntimeMethod<CloseStream, true>(target, "streamClose");
  SetRuntimeMethod<QueryStream<&Rml::Stream::Length>, true>(target,
                                                            "streamLength");
  SetRuntimeMethod<QueryStream<&Rml::Stream::Tell>, true>(target, "streamTell");
  SetRuntimeMethod<QueryStream<&Rml::Stream::IsEOS>, true>(target,
                                                           "streamIsEOS");
  SetRuntimeMethod<QueryStream<&Rml::Stream::IsReadReady>, true>(
      target, "streamIsReadReady");
  SetRuntimeMethod<WriteReady, true>(target, "streamIsWriteReady");
  SetRuntimeMethod<GetMode, true>(target, "streamGetMode");
  SetRuntimeMethod<GetURL, true>(target, "streamGetSourceURL");
  SetRuntimeMethod<SetURL, true>(target, "streamSetSourceURL");
  SetRuntimeMethod<SeekStream, true>(target, "streamSeek");
  SetRuntimeMethod<ReadStream, true>(target, "streamRead");
  SetRuntimeMethod<WriteStream, true>(target, "streamWrite");
  SetRuntimeMethod<ResizeStream, true>(target, "streamResize");
  SetRuntimeMethod<RawStream, true>(target, "streamRaw");
}

}  // namespace sfmlrmlui
