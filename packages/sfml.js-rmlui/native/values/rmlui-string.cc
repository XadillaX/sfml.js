// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/values/rmlui-string.h"

#include <sfml-js-interop.h>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <limits>
#include <memory>
#include <utility>
#include <vector>

namespace sfmlrmlui {

bool ReadString(v8::Local<v8::Value> input, Rml::String* result) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a string");
    return false;
  }

  Nan::Utf8String text(input);
  result->assign(*text, text.length());
  RecordDiagnosticString(&DataDiagnostics::string_input_copied_bytes,
                         text.length());
  return true;
}

bool ReadStringInteger(v8::Local<v8::Value> input,
                       double minimum,
                       double maximum,
                       int64_t* result) {
  if (!input->IsNumber()) {
    Nan::ThrowTypeError("Expected an integer");
    return false;
  }

  const double number = Nan::To<double>(input).FromJust();
  if (!std::isfinite(number) || std::floor(number) != number ||
      number < minimum || number > maximum) {
    Nan::ThrowRangeError("Integer is outside the native string range");
    return false;
  }

  *result = static_cast<int64_t>(number);
  return true;
}

v8::Local<v8::String> WriteString(const Rml::String& value) {
  return Nan::New(value.data(), static_cast<int>(value.size()))
      .ToLocalChecked();
}

namespace {

struct StringStorage {
  Rml::String bytes;
};

struct StringIndex {
  std::vector<int32_t> offsets;
  std::vector<uint32_t> characters;
};

struct StringViewState {
  std::shared_ptr<StringStorage> storage;
  size_t offset{0};
  size_t length{0};
  std::unique_ptr<StringIndex> index;

  Rml::StringView view() const {
    return Rml::StringView(storage->bytes, offset, length);
  }

  const StringIndex& GetIndex() {
    if (!index) {
      auto pending = std::make_unique<StringIndex>();
      const auto value = view();
      for (Rml::StringIteratorU8 iterator(value); iterator; ++iterator) {
        pending->offsets.push_back(static_cast<int32_t>(iterator.offset()));
        pending->characters.push_back(static_cast<uint32_t>(*iterator));
      }
      pending->offsets.push_back(static_cast<int32_t>(length));
      RecordDiagnosticString(&DataDiagnostics::string_index_builds);
      RecordDiagnosticString(
          &DataDiagnostics::string_index_bytes,
          pending->offsets.capacity() * sizeof(int32_t) +
              pending->characters.capacity() * sizeof(uint32_t));
      index = std::move(pending);
    }

    return *index;
  }
};

using StringViewHandle = sfmljs::SharedHandle<StringViewState>;

void SetData(v8::Local<v8::Object> object,
             const char* key,
             v8::Local<v8::Value> value) {
  object
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

bool ReadText(v8::Local<v8::Value> input, Rml::String* result) {
  if (auto* handle = StringViewHandle::TryFrom(input)) {
    *result = static_cast<Rml::String>(handle->owner()->view());
    return true;
  }

  return ReadString(input, result);
}

NAN_METHOD(CreateStringView) {
  auto state = std::make_shared<StringViewState>();
  if (auto* source = StringViewHandle::TryFrom(info[0])) {
    state->storage = source->owner()->storage;
    state->offset = source->owner()->offset;
    state->length = source->owner()->length;
  } else {
    state->storage = std::make_shared<StringStorage>();
    if (!ReadString(info[0], &state->storage->bytes)) {
      return;
    }
    state->length = state->storage->bytes.size();
  }

  int64_t offset = 0;
  int64_t count = static_cast<int64_t>(state->length);
  if (!ReadStringInteger(info[1], 0, state->length, &offset)) {
    return;
  }
  if (!info[2]->IsUndefined() &&
      !ReadStringInteger(
          info[2], 0, std::numeric_limits<int32_t>::max(), &count)) {
    return;
  }

  state->offset += static_cast<size_t>(offset);
  state->length = std::min(static_cast<size_t>(count),
                           state->length - static_cast<size_t>(offset));

  auto result = Nan::New<v8::Object>();
  SetData(result, "handle", StringViewHandle::Create(state));
  SetData(result, "length", Nan::New(static_cast<uint32_t>(state->length)));
  info.GetReturnValue().Set(result);
}

NAN_METHOD(StringViewText) {
  if (auto* handle = StringViewHandle::From(info[0])) {
    info.GetReturnValue().Set(
        WriteString(static_cast<Rml::String>(handle->owner()->view())));
  }
}

NAN_METHOD(StringViewBytes) {
  auto* handle = StringViewHandle::From(info[0]);
  if (!handle) {
    return;
  }

  const auto value = handle->owner()->view();
  auto storage =
      std::make_shared<std::vector<uint8_t>>(value.begin(), value.end());
  RecordDiagnosticString(&DataDiagnostics::string_output_allocations);
  RecordDiagnosticString(&DataDiagnostics::string_output_bytes, value.size());
  auto buffer = sfmljs::MapShared(
      v8::Isolate::GetCurrent(), storage, storage->data(), storage->size());
  info.GetReturnValue().Set(v8::Uint8Array::New(buffer, 0, storage->size()));
}

NAN_METHOD(StringViewIndex) {
  auto* handle = StringViewHandle::From(info[0]);
  if (!handle) {
    return;
  }

  // Export an independent snapshot; host writes cannot corrupt cached lookup.
  auto snapshot = std::make_shared<StringIndex>(handle->owner()->GetIndex());
  RecordDiagnosticString(&DataDiagnostics::string_output_allocations, 2);
  RecordDiagnosticString(&DataDiagnostics::string_output_bytes,
                         snapshot->offsets.size() * sizeof(int32_t) +
                             snapshot->characters.size() * sizeof(uint32_t));
  auto* isolate = v8::Isolate::GetCurrent();
  auto offsets = sfmljs::MapShared(isolate,
                                   snapshot,
                                   snapshot->offsets.data(),
                                   snapshot->offsets.size() * sizeof(int32_t));
  auto characters =
      sfmljs::MapShared(isolate,
                        snapshot,
                        snapshot->characters.data(),
                        snapshot->characters.size() * sizeof(uint32_t));

  auto result = Nan::New<v8::Object>();
  SetData(result,
          "offsets",
          v8::Int32Array::New(offsets, 0, snapshot->offsets.size()));
  SetData(result,
          "characters",
          v8::Uint32Array::New(characters, 0, snapshot->characters.size()));
  const auto value = handle->owner()->view();
  const bool continuation =
      !value.empty() && (static_cast<uint8_t>(*value.begin()) & 0xc0) == 0x80;
  SetData(result, "startsWithContinuation", Nan::New(continuation));
  info.GetReturnValue().Set(result);
}

struct OffsetView {
  std::shared_ptr<v8::BackingStore> storage;
  int32_t* data{nullptr};
  size_t length{0};
};

bool ReadOffsets(v8::Local<v8::Value> input, OffsetView* result) {
  if (!input->IsInt32Array()) {
    Nan::ThrowTypeError("Expected an Int32Array offset buffer");
    return false;
  }

  auto view = input.As<v8::Int32Array>();
  auto buffer = view->Buffer();
  if (buffer->WasDetached()) {
    Nan::ThrowRangeError("Offset buffer is detached");
    return false;
  }
  result->storage = buffer->GetBackingStore();
  if (result->storage->IsShared() || buffer->IsResizableByUserJavaScript()) {
    Nan::ThrowTypeError("Offset buffer must be fixed and unshared");
    return false;
  }

  result->length = view->Length();
  auto* bytes = static_cast<char*>(result->storage->Data());
  result->data = result->length
                     ? reinterpret_cast<int32_t*>(bytes + view->ByteOffset())
                     : nullptr;
  return true;
}

NAN_METHOD(ConvertStringOffsets) {
  auto* handle = StringViewHandle::From(info[0]);
  if (!handle) {
    return;
  }

  OffsetView input;
  OffsetView output;
  if (!ReadOffsets(info[1], &input)) {
    return;
  }
  if (!info[3]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected an offset direction");
  }

  std::shared_ptr<std::vector<int32_t>> allocated;
  v8::Local<v8::Value> result = info[2];
  if (info[2]->IsUndefined()) {
    allocated = std::make_shared<std::vector<int32_t>>(input.length);
    RecordDiagnosticString(&DataDiagnostics::string_output_allocations);
    RecordDiagnosticString(&DataDiagnostics::string_output_bytes,
                           input.length * sizeof(int32_t));
    auto buffer = sfmljs::MapShared(v8::Isolate::GetCurrent(),
                                    allocated,
                                    allocated->data(),
                                    allocated->size() * sizeof(int32_t));
    result = v8::Int32Array::New(buffer, 0, allocated->size());
  }
  if (!ReadOffsets(result, &output)) {
    return;
  }
  if (input.length != output.length) {
    return Nan::ThrowRangeError("Offset buffers must have equal lengths");
  }

  const auto& index = handle->owner()->GetIndex();
  const bool to_bytes = Nan::To<bool>(info[3]).FromJust();

  // Overlapping subarrays must behave like a snapshot of the original input.
  std::vector<int32_t> copied;
  const int32_t* source = input.data;
  if (input.storage == output.storage && input.data != output.data) {
    copied.assign(input.data, input.data + input.length);
    RecordDiagnosticString(&DataDiagnostics::string_input_copied_bytes,
                           input.length * sizeof(int32_t));
    source = copied.data();
  }

  RecordDiagnosticString(&DataDiagnostics::string_offset_rows, input.length);
  for (size_t i = 0; i < input.length; ++i) {
    const int32_t position = source[i];
    if (to_bytes) {
      const size_t character = static_cast<size_t>(std::max(position, 0));
      output.data[i] =
          index.offsets[std::min(character, index.offsets.size() - 1)];
    } else {
      const auto end = index.offsets.end() - 1;
      output.data[i] = static_cast<int32_t>(
          std::lower_bound(index.offsets.begin(), end, position) -
          index.offsets.begin());
    }
  }
  info.GetReturnValue().Set(result);
}

NAN_METHOD(StringViewOperation) {
  auto* handle = StringViewHandle::From(info[0]);
  if (!handle) {
    return;
  }

  Rml::String operation;
  if (!ReadString(info[1], &operation)) {
    return;
  }
  const auto value = handle->owner()->view();
  if (operation == "length") {
    info.GetReturnValue().Set(Nan::New(
        static_cast<uint32_t>(Rml::StringUtilities::LengthUTF8(value))));
    return;
  }

  if (operation == "toBytes" || operation == "toCharacters") {
    int64_t position = 0;
    if (!ReadStringInteger(info[2],
                           std::numeric_limits<int32_t>::min(),
                           std::numeric_limits<int32_t>::max(),
                           &position)) {
      return;
    }
    const auto& index = handle->owner()->GetIndex();
    int32_t result = 0;
    if (operation == "toBytes") {
      const size_t character =
          static_cast<size_t>(std::max(position, int64_t{0}));
      result = index.offsets[std::min(character, index.offsets.size() - 1)];
    } else {
      result = static_cast<int32_t>(std::lower_bound(index.offsets.begin(),
                                                     index.offsets.end() - 1,
                                                     position) -
                                    index.offsets.begin());
    }
    info.GetReturnValue().Set(Nan::New(result));
    return;
  }

  if (operation == "character" || operation == "forward" ||
      operation == "backward") {
    int64_t position = 0;
    const size_t maximum = operation == "forward"
                               ? value.size()
                               : (value.empty() ? 0 : value.size() - 1);
    if (!ReadStringInteger(info[2], 0, maximum, &position)) {
      return;
    }
    if (value.empty() && operation != "forward") {
      return Nan::ThrowRangeError("Cannot read an empty UTF-8 view");
    }

    const char* pointer = value.begin() + position;
    if (operation == "character") {
      info.GetReturnValue().Set(Nan::New(static_cast<uint32_t>(
          Rml::StringUtilities::ToCharacter(pointer, value.end()))));
    } else if (operation == "forward") {
      pointer = Rml::StringUtilities::SeekForwardUTF8(pointer, value.end());
      info.GetReturnValue().Set(
          Nan::New(static_cast<int32_t>(pointer - value.begin())));
    } else {
      // The native backward helper represents before-begin as a pointer.
      // Preserve its result with a numeric sentinel without forming that
      // pointer.
      while (position >= 0 &&
             (static_cast<uint8_t>(value.begin()[position]) & 0xc0) == 0x80) {
        --position;
      }
      info.GetReturnValue().Set(Nan::New(static_cast<int32_t>(position)));
    }
    return;
  }

  auto* other = StringViewHandle::From(info[2]);
  if (!other) {
    return;
  }
  const auto rhs = other->owner()->view();
  bool result = false;
  if (operation == "equals") {
    result = value == rhs;
  } else if (operation == "starts") {
    result = Rml::StringUtilities::StartsWith(value, rhs);
  } else if (operation == "ends") {
    result = Rml::StringUtilities::EndsWith(value, rhs);
  } else if (operation == "compare") {
    result = Rml::StringUtilities::StringCompareCaseInsensitive(value, rhs);
  } else {
    return Nan::ThrowTypeError("Unknown string view operation");
  }

  info.GetReturnValue().Set(result);
}

NAN_METHOD(StringUnary) {
  Rml::String operation;
  Rml::String value;
  if (!ReadString(info[0], &operation) || !ReadText(info[1], &value)) {
    return;
  }

  namespace strings = Rml::StringUtilities;
  if (operation == "lower") {
    value = strings::ToLower(std::move(value));
  } else if (operation == "upper") {
    value = strings::ToUpper(std::move(value));
  } else if (operation == "encode") {
    value = strings::EncodeRml(value);
  } else if (operation == "decode") {
    value = strings::DecodeRml(value);
  } else if (operation == "strip") {
    value = strings::StripWhitespace(value);
  } else if (operation == "trim") {
    strings::TrimTrailingDotZeros(value);
  } else if (operation == "replace") {
    if (info[2]->IsNumber() && info[3]->IsNumber()) {
      int64_t search = 0;
      int64_t replacement = 0;
      if (!ReadStringInteger(info[2], 0, 255, &search) ||
          !ReadStringInteger(info[3], 0, 255, &replacement)) {
        return;
      }
      value = strings::Replace(std::move(value),
                               static_cast<char>(search),
                               static_cast<char>(replacement));
    } else {
      Rml::String search;
      Rml::String replacement;
      if (!ReadString(info[2], &search) || !ReadString(info[3], &replacement)) {
        return;
      }
      value = strings::Replace(std::move(value), search, replacement);
    }
  } else {
    return Nan::ThrowTypeError("Unknown string operation");
  }

  info.GetReturnValue().Set(WriteString(value));
}

NAN_METHOD(ExpandString) {
  Rml::String value;
  int64_t delimiter = 0;
  if (!ReadText(info[0], &value) ||
      !ReadStringInteger(info[1], 0, 127, &delimiter)) {
    return;
  }
  if (!info[4]->IsBoolean()) {
    return Nan::ThrowTypeError("Expected a repeated delimiter flag");
  }

  Rml::StringList result;
  const bool ignore = Nan::To<bool>(info[4]).FromJust();
  if (info[2]->IsUndefined()) {
    Rml::StringUtilities::ExpandString(
        result, value, static_cast<char>(delimiter), ignore);
  } else {
    int64_t quote = 0;
    int64_t unquote = 0;
    if (!ReadStringInteger(info[2], 0, 127, &quote) ||
        !ReadStringInteger(info[3], 0, 127, &unquote)) {
      return;
    }
    Rml::StringUtilities::ExpandString(result,
                                       value,
                                       static_cast<char>(delimiter),
                                       static_cast<char>(quote),
                                       static_cast<char>(unquote),
                                       ignore);
  }

  auto array = Nan::New<v8::Array>(static_cast<int>(result.size()));
  for (uint32_t i = 0; i < result.size(); ++i) {
    array
        ->CreateDataProperty(
            Nan::GetCurrentContext(), i, WriteString(result[i]))
        .FromJust();
  }
  info.GetReturnValue().Set(array);
}

NAN_METHOD(JoinString) {
  if (!info[0]->IsArray()) {
    return Nan::ThrowTypeError("Expected an array of strings");
  }
  auto array = info[0].As<v8::Array>();
  Rml::StringList values;
  values.reserve(array->Length());
  for (uint32_t i = 0; i < array->Length(); ++i) {
    v8::Local<v8::Value> input;
    Rml::String value;
    if (!Nan::Get(array, i).ToLocal(&input) || !ReadString(input, &value)) {
      return;
    }
    values.push_back(std::move(value));
  }

  int64_t delimiter = 0;
  Rml::String result;
  if (!ReadStringInteger(info[1], 0, 127, &delimiter) ||
      !ReadString(info[2], &result)) {
    return;
  }
  Rml::StringUtilities::JoinString(
      result, values, static_cast<char>(delimiter));
  info.GetReturnValue().Set(WriteString(result));
}

NAN_METHOD(EncodeCharacters) {
  if (info[0]->IsNumber()) {
    int64_t character = 0;
    if (!ReadStringInteger(
            info[0], 0, std::numeric_limits<uint32_t>::max(), &character)) {
      return;
    }
    const auto value = static_cast<Rml::Character>(character);
    if (info[1]->IsTrue()) {
      info.GetReturnValue().Set(Nan::New(
          static_cast<uint32_t>(Rml::StringUtilities::BytesUTF8(value))));
    } else {
      info.GetReturnValue().Set(
          WriteString(Rml::StringUtilities::ToUTF8(value)));
    }
    return;
  }

  if (!info[0]->IsUint32Array()) {
    return Nan::ThrowTypeError("Expected a codepoint or Uint32Array");
  }
  auto view = info[0].As<v8::Uint32Array>();
  auto buffer = view->Buffer();
  if (buffer->WasDetached()) {
    return Nan::ThrowRangeError("Codepoint buffer is detached");
  }
  auto storage = buffer->GetBackingStore();
  if (storage->IsShared() || buffer->IsResizableByUserJavaScript()) {
    return Nan::ThrowTypeError("Codepoint buffer must be fixed and unshared");
  }
  if (view->Length() > std::numeric_limits<int>::max()) {
    return Nan::ThrowRangeError("Codepoint buffer exceeds the native range");
  }

  const auto* bytes = static_cast<const char*>(storage->Data());
  const auto* characters =
      view->Length()
          ? reinterpret_cast<const Rml::Character*>(bytes + view->ByteOffset())
          : nullptr;
  info.GetReturnValue().Set(WriteString(Rml::StringUtilities::ToUTF8(
      characters, static_cast<int>(view->Length()))));
}

}  // namespace

NAN_MODULE_INIT(InitializeRmlStrings) {
  // These immutable resources are independent of runtime owners and callbacks.
  SetStringMethod<CreateStringView>(target, "createStringView");
  SetStringMethod<StringViewText>(target, "stringViewText");
  SetStringMethod<StringViewBytes>(target, "stringViewBytes");
  SetStringMethod<StringViewIndex>(target, "stringViewIndex");
  SetStringMethod<StringViewOperation>(target, "stringViewOperation");
  SetStringMethod<ConvertStringOffsets>(target, "convertStringOffsets");
  SetStringMethod<StringUnary>(target, "stringUnary");
  SetStringMethod<ExpandString>(target, "expandString");
  SetStringMethod<JoinString>(target, "joinString");
  SetStringMethod<EncodeCharacters>(target, "encodeCharacters");
}

}  // namespace sfmlrmlui
