// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/io/rmlui-file-interface.h"

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/Log.h>
#include <sfml-js-interop.h>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <limits>
#include <memory>
#include <unordered_map>
#include <utility>
#include <vector>

#include "native/io/file-interface-root.h"
#include "native/io/rmlui-stream.h"
#include "native/runtime/rmlui-state.h"
#include "native/values/rmlui-buffer.h"

namespace sfmlrmlui {
namespace {

enum Method { kOpen, kClose, kRead, kSeek, kTell, kLength, kLoad, kCount };
constexpr size_t kMaxBytes = std::numeric_limits<int>::max();

struct FileState;
struct OpenFile {
  std::weak_ptr<FileState> provider;
  std::shared_ptr<StreamState> stream;
  std::vector<Rml::byte> bytes;
  size_t position{0};
  Rml::FileHandle raw{0};
  Rml::FileHandle identity{0};
  bool closed{false};
  v8::Global<v8::Object> handle;
};
using FileHandle = sfmljs::SharedHandle<OpenFile>;

class FileCallbackScope final {
 public:
  FileCallbackScope() {
    ++State().callback_depth;
    ++State().stream_callback_depth;
  }
  ~FileCallbackScope() {
    --State().stream_callback_depth;
    --State().callback_depth;
  }
};

bool ReadCount(v8::Local<v8::Value> value, size_t limit, size_t* result) {
  if (!value->IsNumber()) {
    Nan::ThrowTypeError("Expected a numeric file byte count");
    return false;
  }
  const double count = Nan::To<double>(value).FromJust();
  if (!std::isfinite(count) || count < 0 || std::floor(count) != count ||
      count > static_cast<double>(limit)) {
    Nan::ThrowRangeError("Invalid file byte count");
    return false;
  }
  *result = static_cast<size_t>(count);
  return true;
}

bool ReadBytes(v8::Local<v8::Value> value, std::vector<Rml::byte>* bytes) {
  if (!value->IsUint8Array()) {
    Nan::ThrowTypeError("File callback must return Uint8Array or null");
    return false;
  }
  const auto view = value.As<v8::Uint8Array>();
  const auto buffer = view->Buffer();
  if (buffer->WasDetached() ||
      !IsFixedUnsharedBuffer(buffer->GetBackingStore())) {
    Nan::ThrowTypeError(
        "File bytes must have a fixed attached unshared buffer");
    return false;
  }
  const size_t count = view->ByteLength();
  if (count > kMaxBytes) {
    Nan::ThrowRangeError("File exceeds native byte range");
    return false;
  }
  bytes->resize(count);
  if (count) {
    const auto backing = buffer->GetBackingStore();
    std::memcpy(
        bytes->data(),
        static_cast<const Rml::byte*>(backing->Data()) + view->ByteOffset(),
        count);
  }
  return true;
}

bool ReadPath(v8::Local<v8::Value> value, Rml::String* path) {
  if (!value->IsString()) {
    Nan::ThrowTypeError("Expected a file path string");
    return false;
  }
  Nan::Utf8String text(value);
  path->assign(*text, text.length());
  if (path->find('\0') != Rml::String::npos) {
    Nan::ThrowTypeError("File path cannot contain a null byte");
    return false;
  }
  return true;
}

NAN_METHOD(IgnoreAsyncResult) {}

class CheckedFiles final : public Rml::FileInterface {
 public:
  CheckedFiles(const std::string& root,
               v8::Local<v8::Array> functions,
               bool root_enabled) {
    for (uint32_t i = 0; i < kCount; ++i) {
      if (Nan::Get(functions, i).ToLocalChecked()->IsFunction()) {
        methods_ |= 1u << i;
      }
    }
    if (!Has(kOpen)) {
      filesystem_ = std::make_unique<FileInterfaceRoot>(root, root_enabled);
    }
    functions_.Reset(v8::Isolate::GetCurrent(), functions);
    functions_.SetWeak();
  }
  ~CheckedFiles() override { CloseAll(false); }

  void Bind(const std::shared_ptr<FileState>& owner,
            v8::Local<v8::Object> handle) {
    owner_ = owner;
    handle_.Reset(v8::Isolate::GetCurrent(), handle);
    handle_.SetWeak();
  }

  bool Custom() const { return filesystem_ == nullptr; }

  Rml::FileHandle Open(const Rml::String& path) override {
    Nan::HandleScope handles;
    auto file = std::make_shared<OpenFile>();
    file->provider = owner_;
    bool opened = false;
    v8::Local<v8::Value> source = Nan::Undefined();
    if (filesystem_) {
      file->raw = filesystem_->Open(path);
      opened = file->raw != 0;
    } else {
      v8::Local<v8::Value> arg = Nan::New(path).ToLocalChecked();
      Invoke(kOpen, 1, &arg, [&](v8::Local<v8::Value> value) {
        source = value;
        if (value->IsNull()) {
          return;
        }
        if (value->IsUint8Array()) {
          opened = ReadBytes(value, &file->bytes);
        } else {
          file->stream = ShareStream(value);
          if (file->stream && file->stream->kind == StreamKind::kFile) {
            Nan::ThrowTypeError(
                "File provider cannot return a StreamFile using itself");
          } else {
            opened = file->stream != nullptr;
          }
        }
      });
    }
    if (!opened || !State().callback_exception.IsEmpty()) {
      return 0;
    }
    if (next_identity_ == std::numeric_limits<Rml::FileHandle>::max()) {
      if (file->raw) {
        filesystem_->Close(file->raw);
      }
      CaptureCallbackException(Nan::RangeError("File identity exhausted"));
      return 0;
    }
    file->identity = ++next_identity_;
    auto token = FileHandle::Create(file);
    file->handle.Reset(v8::Isolate::GetCurrent(), token);
    file->handle.SetWeak();
    const auto provider = handle_.Get(v8::Isolate::GetCurrent());
    Nan::SetPrivate(
        token, Nan::New("rml.file.provider").ToLocalChecked(), provider)
        .FromJust();
    if (file->stream) {
      Nan::SetPrivate(
          token, Nan::New("rml.file.stream").ToLocalChecked(), source)
          .FromJust();
    }
    const auto roots = Roots();
    v8::Local<v8::Map> updated;
    if (!roots
             ->Set(Nan::GetCurrentContext(),
                   v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(),
                                               file->identity),
                   token)
             .ToLocal(&updated)) {
      if (file->raw) {
        filesystem_->Close(file->raw);
      }
      return 0;
    }
    files_.emplace(file->identity, file);
    return file->identity;
  }

  void Close(Rml::FileHandle identity) override {
    auto file = Find(identity);
    if (!file) {
      return;
    }
    // Remove from the native table before invoking a potentially failing hook.
    files_.erase(identity);
    if (file->raw) {
      filesystem_->Close(file->raw);
      file->raw = 0;
    } else if (Has(kClose)) {
      v8::Local<v8::Value> arg = Token(file);
      Invoke(kClose, 1, &arg, [](v8::Local<v8::Value>) {});
    }
    Invalidate(file);
  }

  size_t Read(void* output, size_t size, Rml::FileHandle identity) override {
    auto file = Find(identity);
    if (!file) {
      return 0;
    }
    if (file->raw) {
      return filesystem_->Read(output, size, file->raw);
    }
    if (Has(kRead)) {
      Nan::HandleScope handles;
      const auto buffer = v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), size);
      const auto view = v8::Uint8Array::New(buffer, 0, size);
      v8::Local<v8::Value> args[] = {
          view, Nan::New(static_cast<double>(size)), Token(file)};
      size_t count = 0;
      Invoke(kRead, 3, args, [&](v8::Local<v8::Value> value) {
        if (buffer->WasDetached() || view->ByteLength() != size) {
          Nan::ThrowTypeError("File read callback detached its scratch buffer");
        } else if (ReadCount(value, size, &count) && count) {
          std::memcpy(output, buffer->GetBackingStore()->Data(), count);
        }
      });
      return State().callback_exception.IsEmpty() ? count : 0;
    }
    if (file->stream) {
      return file->stream->value->Read(output, size);
    }
    const size_t count = std::min(size, file->bytes.size() - file->position);
    if (count) {
      std::memcpy(output, file->bytes.data() + file->position, count);
    }
    file->position += count;
    return count;
  }

  bool Seek(Rml::FileHandle identity,
            StreamOffset offset,
            int origin) override {
    auto file = Find(identity);
    if (!file) {
      return false;
    }
    if (file->raw) {
      return filesystem_->Seek(file->raw, offset, origin);
    }
    if (Has(kSeek)) {
      v8::Local<v8::Value> args[] = {
          Token(file), Nan::New(static_cast<double>(offset)), Nan::New(origin)};
      bool result = false;
      Invoke(kSeek, 3, args, [&](v8::Local<v8::Value> value) {
        if (!value->IsBoolean()) {
          Nan::ThrowTypeError("File seek callback must return a boolean");
        } else {
          result = value->IsTrue();
        }
      });
      return result;
    }
    if (file->stream) {
      return file->stream->value->Seek(offset, origin);
    }
    const double base = origin == SEEK_SET   ? 0
                        : origin == SEEK_CUR ? file->position
                                             : file->bytes.size();
    const double position = base + static_cast<double>(offset);
    if (position < 0 || position > file->bytes.size()) {
      return false;
    }
    file->position = static_cast<size_t>(position);
    return true;
  }

  size_t Tell(Rml::FileHandle identity) override {
    auto file = Find(identity);
    if (!file) {
      return 0;
    }
    if (file->raw) {
      return filesystem_->Tell(file->raw);
    }
    if (Has(kTell)) {
      return Count(kTell, file);
    }
    return file->stream ? file->stream->value->Tell() : file->position;
  }

  size_t Length(Rml::FileHandle identity) override {
    auto file = Find(identity);
    if (!file) {
      return 0;
    }
    if (file->raw) {
      return filesystem_->Length(file->raw);
    }
    if (Has(kLength)) {
      return Count(kLength, file);
    }
    if (Has(kTell) || Has(kSeek)) {
      return Rml::FileInterface::Length(identity);
    }
    return file->stream ? file->stream->value->Length() : file->bytes.size();
  }

  bool LoadFile(const Rml::String& path, Rml::String& output) override {
    if (Has(kLoad)) {
      v8::Local<v8::Value> arg = Nan::New(path).ToLocalChecked();
      bool result = false;
      Invoke(kLoad, 1, &arg, [&](v8::Local<v8::Value> value) {
        if (value->IsNull()) {
          return;
        }
        std::vector<Rml::byte> bytes;
        if (ReadBytes(value, &bytes)) {
          output.assign(bytes.begin(), bytes.end());
          result = true;
        }
      });
      return result;
    }
    const auto file = Open(path);
    if (!file) {
      return false;
    }
    const size_t length = Length(file);
    if (length > kMaxBytes) {
      CaptureCallbackException(
          Nan::RangeError("File exceeds native byte range"));
      Close(file);
      return false;
    }
    output.assign(length, '\0');
    const size_t read = Read(output.data(), length, file);
    if (read != length) {
      Rml::Log::Message(Rml::Log::LT_WARNING,
                        "Could only read %zu of %zu bytes from file %s",
                        read,
                        length,
                        path.c_str());
    }
    Close(file);
    // Preserve the upstream default: warning plus zero-filled unread bytes.
    return State().callback_exception.IsEmpty();
  }

  std::shared_ptr<OpenFile> Find(Rml::FileHandle identity) const {
    const auto found = files_.find(identity);
    return found == files_.end() ? nullptr : found->second;
  }

  void CloseAll(bool invoke_callbacks) {
    while (!files_.empty()) {
      const auto file = files_.begin()->second;
      if (invoke_callbacks) {
        Close(file->identity);
      } else {
        if (file->raw) {
          filesystem_->Close(file->raw);
        }
        file->closed = true;
        file->raw = 0;
        files_.erase(file->identity);
      }
    }
  }

 private:
  bool Has(Method method) const { return (methods_ & (1u << method)) != 0; }

  v8::Local<v8::Map> Roots() const {
    return Nan::GetPrivate(handle_.Get(v8::Isolate::GetCurrent()),
                           Nan::New("rml.file.open").ToLocalChecked())
        .ToLocalChecked()
        .As<v8::Map>();
  }

  static v8::Local<v8::Object> Token(const std::shared_ptr<OpenFile>& file) {
    return file->handle.Get(v8::Isolate::GetCurrent());
  }

  void Invalidate(const std::shared_ptr<OpenFile>& file) {
    file->closed = true;
    file->stream.reset();
    // A retained closed token must not keep the file's allocation alive.
    std::vector<Rml::byte>().swap(file->bytes);
    if (!handle_.IsEmpty()) {
      Roots()
          ->Delete(Nan::GetCurrentContext(),
                   v8::BigInt::NewFromUnsigned(v8::Isolate::GetCurrent(),
                                               file->identity))
          .FromJust();
    }
    if (!file->handle.IsEmpty()) {
      const auto token = Token(file);
      Nan::DeletePrivate(token, Nan::New("rml.file.provider").ToLocalChecked())
          .FromJust();
      Nan::DeletePrivate(token, Nan::New("rml.file.stream").ToLocalChecked())
          .FromJust();
      file->handle.Reset();
    }
  }

  size_t Count(Method method, const std::shared_ptr<OpenFile>& file) {
    size_t result = 0;
    v8::Local<v8::Value> arg = Token(file);
    Invoke(method, 1, &arg, [&](v8::Local<v8::Value> value) {
      ReadCount(value, kMaxBytes, &result);
    });
    return result;
  }

  template <typename Visitor>
  void Invoke(Method method,
              int count,
              v8::Local<v8::Value>* args,
              const Visitor& visitor) {
    auto& state = State();
    if (functions_.IsEmpty() || state.cleaning_up || !state.boundary_depth ||
        !state.callback_exception.IsEmpty() ||
        (state.initialized && !CanInvokeCallback())) {
      return;
    }
    Nan::TryCatch caught;
    FileCallbackScope scope;
    const auto function =
        Nan::Get(functions_.Get(v8::Isolate::GetCurrent()), method)
            .ToLocalChecked()
            .As<v8::Function>();
    v8::Local<v8::Value> result;
    RecordDiagnosticCallback(DiagnosticCallback::kFile);
    if (function->Call(Nan::GetCurrentContext(), Nan::Undefined(), count, args)
            .ToLocal(&result)) {
      if (result->IsPromise()) {
        const auto ignore =
            Nan::GetFunction(Nan::New<v8::FunctionTemplate>(IgnoreAsyncResult))
                .ToLocalChecked();
        v8::Local<v8::Promise> ignored;
        if (result.As<v8::Promise>()
                ->Catch(Nan::GetCurrentContext(), ignore)
                .ToLocal(&ignored)) {
          Nan::ThrowTypeError("File callbacks must be synchronous");
        }
      } else {
        visitor(result);
      }
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }

  std::unique_ptr<FileInterfaceRoot> filesystem_;
  std::unordered_map<Rml::FileHandle, std::shared_ptr<OpenFile>> files_;
  std::weak_ptr<FileState> owner_;
  v8::Global<v8::Object> handle_;
  v8::Global<v8::Array> functions_;
  Rml::FileHandle next_identity_{0};
  uint32_t methods_{0};
};

struct FileState {
  std::shared_ptr<CheckedFiles> value;
  std::string root;
  bool root_enabled{true};
  v8::Global<v8::Object> handle;
  uint64_t generation{0};
};
using ProviderHandle = sfmljs::SharedHandle<FileState>;

auto& Providers() {
  static std::vector<std::weak_ptr<FileState>> providers;
  return providers;
}
auto& Selected() {
  static std::shared_ptr<FileState> selected;
  return selected;
}
auto& SelectedHandle() {
  static v8::Global<v8::Object> handle;
  return handle;
}
uint64_t Generation() {
  return State().generation + (State().initialized ? 0 : 1);
}
std::shared_ptr<FileState> ProviderOf(v8::Local<v8::Value> input) {
  auto* handle = ProviderHandle::From(input);
  if (!handle) {
    return {};
  }
  auto owner = handle->owner();
  if (!owner->value || owner->generation != Generation()) {
    Nan::ThrowError("File interface is no longer valid");
    return {};
  }
  return owner;
}
std::shared_ptr<OpenFile> FileOf(v8::Local<v8::Value> input,
                                 const std::shared_ptr<FileState>& provider) {
  auto* handle = FileHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a native file handle");
    return {};
  }
  const auto file = handle->owner();
  if (file->closed) {
    Nan::ThrowError("File handle is closed");
    return {};
  }
  if (file->provider.lock() != provider) {
    Nan::ThrowTypeError("File handle belongs to another interface");
    return {};
  }
  return file;
}

v8::Local<v8::Object> Create(const std::string& root,
                             v8::Local<v8::Array> functions,
                             bool root_enabled = true) {
  ClaimRuntimeSetup();
  auto owner = std::make_shared<FileState>();
  owner->value = std::make_shared<CheckedFiles>(root, functions, root_enabled);
  owner->root = root;
  owner->root_enabled = root_enabled;
  owner->generation = Generation();
  auto handle = ProviderHandle::Create(owner);
  Nan::SetPrivate(
      handle, Nan::New("rml.file.functions").ToLocalChecked(), functions)
      .FromJust();
  Nan::SetPrivate(handle,
                  Nan::New("rml.file.open").ToLocalChecked(),
                  v8::Map::New(v8::Isolate::GetCurrent()))
      .FromJust();
  owner->handle.Reset(v8::Isolate::GetCurrent(), handle);
  owner->handle.SetWeak();
  owner->value->Bind(owner, handle);
  static size_t threshold = 64;
  if (Providers().size() >= threshold) {
    std::erase_if(Providers(), [](const auto& weak) { return weak.expired(); });
    threshold = std::max<size_t>(64, Providers().size() * 2);
  }
  Providers().push_back(owner);
  return handle;
}

void Select(const std::shared_ptr<FileState>& owner,
            v8::Local<v8::Object> handle) {
  Selected() = owner;
  SelectedHandle().Reset(v8::Isolate::GetCurrent(), handle);
  State().file_interface = owner->value;
  State().file_root = owner->root;
  Rml::SetFileInterface(owner->value.get());
}

NAN_METHOD(CreateFileInterface) {
  Rml::String root;
  if (!ReadPath(info[0], &root)) {
    return;
  }
  if (!info[1]->IsArray() || info[1].As<v8::Array>()->Length() != kCount) {
    return Nan::ThrowTypeError("Expected seven file callbacks");
  }
  auto functions = Nan::New<v8::Array>(kCount);
  for (uint32_t i = 0; i < kCount; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(info[1].As<v8::Array>(), i).ToLocal(&value)) {
      return;
    }
    if (!value->IsUndefined() && !value->IsFunction()) {
      return Nan::ThrowTypeError("Expected optional file callbacks");
    }
    functions->CreateDataProperty(Nan::GetCurrentContext(), i, value)
        .FromJust();
  }
  info.GetReturnValue().Set(Create(root, functions));
}
NAN_METHOD(GetFileInterface) {
  const auto* installed = Rml::GetFileInterface();
  if (!installed) {
    info.GetReturnValue().Set(Nan::Null());
    return;
  }
  if (!Selected() || installed != Selected()->value.get()) {
    return Nan::ThrowError("Installed file interface is not binding-owned");
  }
  info.GetReturnValue().Set(SelectedHandle().Get(v8::Isolate::GetCurrent()));
}
NAN_METHOD(SetFileInterface) {
  if (State().initialized) {
    return Nan::ThrowError("Set file interface before initialization");
  }
  if (info[0]->IsNull()) {
    Rml::SetFileInterface(nullptr);
    State().file_interface.reset();
    State().file_root.clear();
    SelectedHandle().Reset();
    Selected().reset();
  } else if (auto owner = ProviderOf(info[0])) {
    Select(owner, info[0].As<v8::Object>());
  }
}
NAN_METHOD(Open) {
  Rml::String path;
  if (!ReadPath(info[1], &path)) {
    return;
  }
  if (auto owner = ProviderOf(info[0])) {
    const auto id = owner->value->Open(path);
    if (id) {
      info.GetReturnValue().Set(
          owner->value->Find(id)->handle.Get(v8::Isolate::GetCurrent()));
    } else {
      info.GetReturnValue().Set(Nan::Null());
    }
  }
}
NAN_METHOD(Close) {
  if (auto owner = ProviderOf(info[0])) {
    if (auto file = FileOf(info[1], owner)) {
      owner->value->Close(file->identity);
    }
  }
}
template <bool length>
NAN_METHOD(Query) {
  if (auto owner = ProviderOf(info[0])) {
    if (auto file = FileOf(info[1], owner)) {
      const auto result = length ? owner->value->Length(file->identity)
                                 : owner->value->Tell(file->identity);
      info.GetReturnValue().Set(Nan::New(static_cast<double>(result)));
    }
  }
}
NAN_METHOD(Seek) {
  if (!info[2]->IsNumber() || !info[3]->IsInt32()) {
    return Nan::ThrowTypeError("Expected file offset and seek origin");
  }
  const double offset = Nan::To<double>(info[2]).FromJust();
  const int origin = Nan::To<int>(info[3]).FromJust();
  if (!std::isfinite(offset) || std::floor(offset) != offset ||
      offset < std::numeric_limits<StreamOffset>::min() ||
      offset >=
          -static_cast<double>(std::numeric_limits<StreamOffset>::min()) ||
      origin < SEEK_SET || origin > SEEK_END) {
    return Nan::ThrowRangeError("Invalid native file offset or seek origin");
  }
  if (auto owner = ProviderOf(info[0])) {
    if (auto file = FileOf(info[1], owner)) {
      info.GetReturnValue().Set(owner->value->Seek(
          file->identity, static_cast<StreamOffset>(offset), origin));
    }
  }
}
NAN_METHOD(Read) {
  if (!info[1]->IsUint8Array()) {
    return Nan::ThrowTypeError("Expected a Uint8Array file output");
  }
  const auto view = info[1].As<v8::Uint8Array>();
  const auto buffer = view->Buffer();
  if (buffer->WasDetached() ||
      !IsFixedUnsharedBuffer(buffer->GetBackingStore())) {
    return Nan::ThrowTypeError(
        "File output must be fixed attached and unshared");
  }
  size_t count;
  if (!ReadCount(info[2], std::min(view->ByteLength(), kMaxBytes), &count)) {
    return;
  }
  auto owner = ProviderOf(info[0]);
  if (!owner) {
    return;
  }
  auto file = FileOf(info[3], owner);
  if (!file) {
    return;
  }
  // A retained fixed backing stays valid even if a host callback detaches its
  // JS view. Custom reads already use independent callback scratch storage;
  // ordinary native byte/file reads need no intermediate buffer allocation.
  const auto backing = buffer->GetBackingStore();
  Rml::byte empty = 0;
  auto* output = static_cast<Rml::byte*>(backing->Data());
  output = output ? output + view->ByteOffset() : &empty;
  const size_t read = owner->value->Read(output, count, file->identity);
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (buffer->WasDetached() || view->ByteLength() < count) {
    return Nan::ThrowTypeError("File callback detached its caller output");
  }
  if (read > count) {
    return Nan::ThrowRangeError("File returned an oversized read");
  }
  info.GetReturnValue().Set(Nan::New(static_cast<double>(read)));
}
NAN_METHOD(LoadFile) {
  Rml::String path;
  if (!ReadPath(info[1], &path)) {
    return;
  }
  if (auto owner = ProviderOf(info[0])) {
    Rml::String bytes;
    if (!owner->value->LoadFile(path, bytes)) {
      info.GetReturnValue().Set(Nan::Null());
      return;
    }
    const auto buffer =
        v8::ArrayBuffer::New(v8::Isolate::GetCurrent(), bytes.size());
    if (!bytes.empty()) {
      std::memcpy(
          buffer->GetBackingStore()->Data(), bytes.data(), bytes.size());
    }
    info.GetReturnValue().Set(v8::Uint8Array::New(buffer, 0, bytes.size()));
  }
}

}  // namespace

bool HasCustomFileInterface() {
  return Selected() && Selected()->value->Custom();
}

bool HasRootFileInterface() {
  return Selected() && Selected()->root_enabled && !Selected()->value->Custom();
}

bool PrepareFileInterface(const std::string* root) {
  if (root && root->find('\0') != std::string::npos) {
    Nan::ThrowTypeError("File root cannot contain a null byte");
    return false;
  }
  if (Selected()) {
    if (root && (Selected()->value->Custom() || Selected()->root != *root)) {
      Nan::ThrowError("fileRoot conflicts with the selected file interface");
      return false;
    }
    return true;
  }
  auto functions = Nan::New<v8::Array>(kCount);
  for (uint32_t i = 0; i < kCount; ++i) {
    functions->CreateDataProperty(Nan::GetCurrentContext(), i, Nan::Undefined())
        .FromJust();
  }
  auto handle = Create(root ? *root : "", functions, root != nullptr);
  Select(ProviderOf(handle), handle);
  return true;
}

void ReleaseFileInterfaceBindings() {
  std::vector<std::shared_ptr<FileState>> owners;
  for (const auto& weak : Providers()) {
    if (auto owner = weak.lock()) {
      owners.push_back(std::move(owner));
    }
  }
  for (const auto& owner : owners) {
    owner->value->CloseAll(true);
    owner->value.reset();
    owner->generation = 0;
    if (!owner->handle.IsEmpty()) {
      const auto handle = owner->handle.Get(v8::Isolate::GetCurrent());
      Nan::DeletePrivate(handle,
                         Nan::New("rml.file.functions").ToLocalChecked())
          .FromJust();
      Nan::DeletePrivate(handle, Nan::New("rml.file.open").ToLocalChecked())
          .FromJust();
      owner->handle.Reset();
    }
  }
  Providers().clear();
  SelectedHandle().Reset();
  Selected().reset();
  State().file_interface.reset();
  State().file_root.clear();
}

NAN_MODULE_INIT(InitializeRmlFileInterface) {
  SetRuntimeMethod<CreateFileInterface, false, false>(target,
                                                      "createFileInterface");
  SetRuntimeMethod<GetFileInterface, false, false>(target, "getFileInterface");
  SetRuntimeMethod<SetFileInterface, false, false>(target, "setFileInterface");
  SetRuntimeMethod<Open, false, false>(target, "fileOpen");
  SetRuntimeMethod<Close, false, false>(target, "fileClose");
  SetRuntimeMethod<Read, false, false>(target, "fileRead");
  SetRuntimeMethod<Seek, false, false>(target, "fileSeek");
  SetRuntimeMethod<Query<false>, false, false>(target, "fileTell");
  SetRuntimeMethod<Query<true>, false, false>(target, "fileLength");
  SetRuntimeMethod<LoadFile, false, false>(target, "fileLoad");
}

}  // namespace sfmlrmlui
