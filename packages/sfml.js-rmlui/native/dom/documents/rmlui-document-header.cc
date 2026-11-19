// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/dom/documents/rmlui-document-header.h"

#include <cstdint>
#include <memory>
#include <type_traits>
#include <utility>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {
namespace {

struct HeaderState {
  Rml::DocumentHeader value;
  uint64_t generation{0};
};

using HeaderHandle = sfmljs::SharedHandle<HeaderState>;
using ResourceList = Rml::DocumentHeader::ResourceList;

HeaderState* HeaderOf(v8::Local<v8::Value> input) {
  if (!RuntimeReady()) {
    return nullptr;
  }
  auto* handle = HeaderHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected a DocumentHeader");
    return nullptr;
  }
  auto* state = handle->owner().get();
  if (state->generation != State().generation) {
    Nan::ThrowError("DocumentHeader is no longer valid");
    return nullptr;
  }
  return state;
}

bool ReadText(v8::Local<v8::Value> input,
              Rml::String* output,
              bool path = false) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected a document header string");
    return false;
  }
  Nan::Utf8String text(input);
  output->assign(*text, text.length());
  if (path && output->find('\0') != Rml::String::npos) {
    Nan::ThrowTypeError("Document resource paths cannot contain a null byte");
    return false;
  }
  return true;
}

bool ReadField(v8::Local<v8::Object> input,
               const char* name,
               v8::Local<v8::Value>* output) {
  return Nan::Get(input, Nan::New(name).ToLocalChecked()).ToLocal(output);
}

bool ReadRecord(v8::Local<v8::Value> input, v8::Local<v8::Object>* output) {
  if (!input->IsObject() || input->IsArray() || input->IsFunction()) {
    Nan::ThrowTypeError("Expected a document header record");
    return false;
  }
  *output = input.As<v8::Object>();
  return true;
}

bool ReadPaths(v8::Local<v8::Value> input, Rml::StringList* output) {
  if (!input->IsArray()) {
    Nan::ThrowTypeError("Expected a document resource path array");
    return false;
  }
  const auto array = input.As<v8::Array>();
  const auto length = array->Length();
  output->reserve(length);
  for (uint32_t i = 0; i < length; ++i) {
    v8::Local<v8::Value> entry;
    Rml::String path;
    if (!Nan::Get(array, i).ToLocal(&entry) || !ReadText(entry, &path, true)) {
      return false;
    }
    output->push_back(std::move(path));
  }
  return true;
}

bool ReadResources(v8::Local<v8::Value> input, ResourceList* output) {
  if (!input->IsArray()) {
    Nan::ThrowTypeError("Expected a document header resource array");
    return false;
  }
  const auto array = input.As<v8::Array>();
  const auto length = array->Length();
  output->reserve(length);
  for (uint32_t i = 0; i < length; ++i) {
    v8::Local<v8::Value> entry;
    v8::Local<v8::Object> record;
    v8::Local<v8::Value> field;
    Rml::DocumentHeader::Resource resource;
    if (!Nan::Get(array, i).ToLocal(&entry) || !ReadRecord(entry, &record)) {
      return false;
    }
    if (!ReadField(record, "path", &field) ||
        (!field->IsUndefined() && !ReadText(field, &resource.path, true)) ||
        !ReadField(record, "content", &field) ||
        (!field->IsUndefined() && !ReadText(field, &resource.content)) ||
        !ReadField(record, "isInline", &field)) {
      return false;
    }
    if (!field->IsUndefined()) {
      if (!field->IsBoolean()) {
        Nan::ThrowTypeError("Expected a boolean document resource isInline");
        return false;
      }
      resource.is_inline = field->IsTrue();
    }
    if (!ReadField(record, "line", &field)) {
      return false;
    }
    if (!field->IsUndefined()) {
      if (!field->IsInt32()) {
        Nan::ThrowTypeError("Expected an int32 document resource line");
        return false;
      }
      resource.line = Nan::To<int>(field).FromJust();
    }
    output->push_back(std::move(resource));
  }
  return true;
}

bool ReadHeader(v8::Local<v8::Value> input, Rml::DocumentHeader* output) {
  v8::Local<v8::Object> record;
  v8::Local<v8::Value> field;
  if (!ReadRecord(input, &record) || !ReadField(record, "source", &field) ||
      (!field->IsUndefined() && !ReadText(field, &output->source, true)) ||
      !ReadField(record, "title", &field) ||
      (!field->IsUndefined() && !ReadText(field, &output->title)) ||
      !ReadField(record, "templateResources", &field) ||
      (!field->IsUndefined() &&
       !ReadPaths(field, &output->template_resources)) ||
      !ReadField(record, "rcss", &field) ||
      (!field->IsUndefined() && !ReadResources(field, &output->rcss)) ||
      !ReadField(record, "scripts", &field) ||
      (!field->IsUndefined() && !ReadResources(field, &output->scripts))) {
    return false;
  }
  return true;
}

void Put(v8::Local<v8::Object> target,
         const char* key,
         v8::Local<v8::Value> value) {
  target
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

v8::Local<v8::Array> WrapPaths(const Rml::StringList& paths) {
  auto result = Nan::New<v8::Array>();
  for (const auto& path : paths) {
    result
        ->CreateDataProperty(Nan::GetCurrentContext(),
                             result->Length(),
                             Nan::New(path).ToLocalChecked())
        .FromJust();
  }
  return result;
}

v8::Local<v8::Array> WrapResources(const ResourceList& resources) {
  auto result = Nan::New<v8::Array>();
  for (const auto& resource : resources) {
    auto record = Nan::New<v8::Object>();
    Put(record, "path", Nan::New(resource.path).ToLocalChecked());
    Put(record, "content", Nan::New(resource.content).ToLocalChecked());
    Put(record, "isInline", Nan::New(resource.is_inline));
    Put(record, "line", Nan::New(resource.line));
    result
        ->CreateDataProperty(Nan::GetCurrentContext(), result->Length(), record)
        .FromJust();
  }
  return result;
}

NAN_METHOD(CreateHeader) {
  const auto generation = State().generation;
  Rml::DocumentHeader value;
  if (!ReadHeader(info[0], &value)) {
    return;
  }
  if (!RuntimeReady()) {
    return;
  }
  if (generation != State().generation) {
    return Nan::ThrowError("Runtime changed while reading DocumentHeader");
  }
  auto state = std::make_shared<HeaderState>();
  state->value = std::move(value);
  state->generation = generation;
  info.GetReturnValue().Set(HeaderHandle::Create(std::move(state)));
}

NAN_METHOD(ReplaceHeader) {
  Rml::DocumentHeader value;
  if (!ReadHeader(info[1], &value)) {
    return;
  }
  if (auto* state = HeaderOf(info[0])) {
    state->value = std::move(value);
  }
}

template <auto member>
NAN_METHOD(GetField) {
  if (auto* state = HeaderOf(info[0])) {
    const auto copy = state->value.*member;
    using Value = std::decay_t<decltype(copy)>;
    if constexpr (std::is_same_v<Value, Rml::StringList>) {
      info.GetReturnValue().Set(WrapPaths(copy));
    } else if constexpr (std::is_same_v<Value, ResourceList>) {
      info.GetReturnValue().Set(WrapResources(copy));
    } else {
      info.GetReturnValue().Set(Nan::New(copy).ToLocalChecked());
    }
  }
}

template <auto member>
NAN_METHOD(SetField) {
  using Value = std::decay_t<decltype(Rml::DocumentHeader{}.*member)>;
  Value value;
  bool valid;
  if constexpr (std::is_same_v<Value, Rml::StringList>) {
    valid = ReadPaths(info[1], &value);
  } else if constexpr (std::is_same_v<Value, ResourceList>) {
    valid = ReadResources(info[1], &value);
  } else {
    valid = ReadText(info[1], &value, member == &Rml::DocumentHeader::source);
  }
  if (valid) {
    // Record and indexed accessors must finish before borrowing the receiver.
    if (auto* state = HeaderOf(info[0])) {
      state->value.*member = std::move(value);
    }
  }
}

NAN_METHOD(Snapshot) {
  if (auto* state = HeaderOf(info[0])) {
    const auto copy = state->value;
    auto result = Nan::New<v8::Object>();
    Put(result, "source", Nan::New(copy.source).ToLocalChecked());
    Put(result, "title", Nan::New(copy.title).ToLocalChecked());
    Put(result, "templateResources", WrapPaths(copy.template_resources));
    Put(result, "rcss", WrapResources(copy.rcss));
    Put(result, "scripts", WrapResources(copy.scripts));
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(MergeHeader) {
  Rml::DocumentHeader source;
  if (!CopyDocumentHeader(info[1], &source)) {
    return;
  }
  if (auto* state = HeaderOf(info[0])) {
    // Self-merge must not insert a vector's own iterators into that vector.
    state->value.MergeHeader(source);
  }
}

NAN_METHOD(MergePaths) {
  Rml::StringList target;
  Rml::StringList source;
  Rml::String base;
  if (!ReadPaths(info[1], &target) || !ReadPaths(info[2], &source) ||
      !ReadText(info[3], &base, true)) {
    return;
  }
  if (auto* state = HeaderOf(info[0])) {
    state->value.MergePaths(target, source, base);
    info.GetReturnValue().Set(WrapPaths(target));
  }
}

NAN_METHOD(MergeResources) {
  ResourceList target;
  ResourceList source;
  if (!ReadResources(info[1], &target) || !ReadResources(info[2], &source)) {
    return;
  }
  if (auto* state = HeaderOf(info[0])) {
    state->value.MergeResources(target, source);
    info.GetReturnValue().Set(WrapResources(target));
  }
}

}  // namespace

bool CopyDocumentHeader(v8::Local<v8::Value> input,
                        Rml::DocumentHeader* output) {
  auto* state = HeaderOf(input);
  if (!state) {
    return false;
  }
  *output = state->value;
  return true;
}

v8::Local<v8::Object> WrapDocumentHeader(const Rml::DocumentHeader& value) {
  auto state = std::make_shared<HeaderState>();
  state->value = value;
  state->generation = State().generation;
  return HeaderHandle::Create(std::move(state));
}

NAN_MODULE_INIT(InitializeRmlDocumentHeader) {
  using Header = Rml::DocumentHeader;
  SetInstancerValueMethod<CreateHeader>(target, "createDocumentHeader");
  SetInstancerValueMethod<ReplaceHeader>(target, "replaceDocumentHeader");
  SetInstancerValueMethod<Snapshot, false, false, true>(
      target, "documentHeaderSnapshot");
  SetInstancerValueMethod<GetField<&Header::source>, false, false, true>(
      target, "documentHeaderGetSource");
  SetInstancerValueMethod<SetField<&Header::source>>(target,
                                                     "documentHeaderSetSource");
  SetInstancerValueMethod<GetField<&Header::title>, false, false, true>(
      target, "documentHeaderGetTitle");
  SetInstancerValueMethod<SetField<&Header::title>>(target,
                                                    "documentHeaderSetTitle");
  SetInstancerValueMethod<GetField<&Header::template_resources>,
                          false,
                          false,
                          true>(target, "documentHeaderGetTemplates");
  SetInstancerValueMethod<SetField<&Header::template_resources>>(
      target, "documentHeaderSetTemplates");
  SetInstancerValueMethod<GetField<&Header::rcss>, false, false, true>(
      target, "documentHeaderGetRcss");
  SetInstancerValueMethod<SetField<&Header::rcss>>(target,
                                                   "documentHeaderSetRcss");
  SetInstancerValueMethod<GetField<&Header::scripts>, false, false, true>(
      target, "documentHeaderGetScripts");
  SetInstancerValueMethod<SetField<&Header::scripts>>(
      target, "documentHeaderSetScripts");
  SetInstancerValueMethod<MergeHeader>(target, "documentHeaderMergeHeader");
  SetInstancerValueMethod<MergePaths>(target, "documentHeaderMergePaths");
  SetInstancerValueMethod<MergeResources>(target,
                                          "documentHeaderMergeResources");
}

}  // namespace sfmlrmlui
