// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/dom/documents/rmlui-xml.h"

#include <RmlUi/Core/StringUtilities.h>
#include <RmlUi/Core/URL.h>

#include <algorithm>
#include <memory>
#include <unordered_map>
#include <utility>

#include "native/dom/documents/rmlui-document-header.h"
#include "native/io/rmlui-stream.h"
#include "native/values/rmlui-variant.h"
#include "third_party/rmlui/Source/Core/XMLNodeHandlerDefault.h"

namespace sfmlrmlui {
namespace {

std::vector<std::weak_ptr<XMLParserState>>& Parsers() {
  static std::vector<std::weak_ptr<XMLParserState>> values;
  return values;
}

auto& Handlers() {
  static std::unordered_map<Rml::XMLNodeHandler*,
                            std::weak_ptr<XMLHandlerState>>
      values;
  return values;
}

auto& Registrations() {
  static std::unordered_map<Rml::String, std::shared_ptr<XMLHandlerState>>
      values;
  return values;
}

uint64_t& Revision() {
  static uint64_t revision = 1;
  return revision;
}

uint64_t HandlerGeneration() {
  return State().generation + (State().initialized ? 0 : 1);
}

bool& SetupTableExists() {
  static bool exists = false;
  return exists;
}

template <typename Collection>
void Sweep(Collection* collection, size_t* threshold) {
  if (collection->size() >= *threshold) {
    std::erase_if(*collection, [](const auto& entry) {
      if constexpr (requires { entry.second; }) {
        return entry.second.expired();
      } else {
        return entry.expired();
      }
    });
    *threshold = std::max<size_t>(64, collection->size() * 2);
  }
}

void TrackParser(const std::shared_ptr<XMLParserState>& state) {
  static size_t threshold = 64;
  Sweep(&Parsers(), &threshold);
  Parsers().push_back(state);
}

void TrackHandler(const std::shared_ptr<XMLHandlerState>& state) {
  static size_t threshold = 64;
  Sweep(&Handlers(), &threshold);
  Handlers()[state->value] = state;
}

void Put(v8::Local<v8::Object> output,
         const char* key,
         v8::Local<v8::Value> value) {
  output
      ->CreateDataProperty(
          Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), value)
      .FromJust();
}

bool Text(v8::Local<v8::Value> input, Rml::String* output) {
  if (!input->IsString()) {
    Nan::ThrowTypeError("Expected an XML string");
    return false;
  }
  Nan::Utf8String text(input);
  output->assign(*text, text.length());
  return true;
}

bool ReadFunctions(v8::Local<v8::Value> input,
                   bool required,
                   v8::Local<v8::Array>* output) {
  if (!input->IsArray() || input.As<v8::Array>()->Length() != 3) {
    Nan::ThrowTypeError("Expected three XML callbacks");
    return false;
  }
  *output = Nan::New<v8::Array>(3);
  for (uint32_t i = 0; i < 3; ++i) {
    v8::Local<v8::Value> value;
    if (!Nan::Get(input.As<v8::Array>(), i).ToLocal(&value)) {
      return false;
    }
    if (!value->IsFunction() && (required || !value->IsUndefined())) {
      Nan::ThrowTypeError("Expected an XML callback function");
      return false;
    }
    (*output)
        ->CreateDataProperty(Nan::GetCurrentContext(), i, value)
        .FromJust();
  }
  return true;
}

std::shared_ptr<XMLHandlerState> BorrowHandler(Rml::XMLNodeHandler* value) {
  auto state = Handlers()[value].lock();
  if (!state || state->generation != HandlerGeneration() ||
      (!state->owned && state->handler_revision != Revision())) {
    state = std::make_shared<XMLHandlerState>();
    state->value = value;
    state->generation = HandlerGeneration();
    state->handler_revision = Revision();
    TrackHandler(state);
  }
  return state;
}

v8::Local<v8::Value> NullableHandler(Rml::XMLNodeHandler* value) {
  return value ? static_cast<v8::Local<v8::Value>>(
                     WrapXMLHandler(BorrowHandler(value)))
               : static_cast<v8::Local<v8::Value>>(Nan::Null());
}

void CallbackEdge(const std::shared_ptr<XMLHandlerState>& state) {
  if (state->functions.IsEmpty()) {
    return;
  }
  // Pin the array before allocating a key or removing its previous edge.
  // Replacing the same registration can temporarily remove the last root.
  const auto functions = state->functions.Get(v8::Isolate::GetCurrent());
  const auto key = Nan::New("rml.xml.callbacks").ToLocalChecked();
  if (state->registrations) {
    state->functions.ClearWeak();
    if (!state->handle.IsEmpty()) {
      Nan::DeletePrivate(state->handle.Get(v8::Isolate::GetCurrent()), key)
          .FromJust();
    }
  } else {
    state->functions.SetWeak();
    if (!state->handle.IsEmpty()) {
      Nan::SetPrivate(
          state->handle.Get(v8::Isolate::GetCurrent()), key, functions)
          .FromJust();
    }
  }
}

NAN_METHOD(CreateBase) {
  const auto generation = State().generation;

  v8::Local<v8::Array> functions;
  if (!ReadFunctions(info[0], false, &functions)) {
    return;
  }
  if (!RuntimeReady() || generation != State().generation) {
    return Nan::ThrowError("Runtime changed while reading XML callbacks");
  }

  auto state = std::make_shared<XMLParserState>();
  state->generation = generation;
  state->functions.Reset(v8::Isolate::GetCurrent(), functions);
  state->functions.SetWeak();
  state->owned = MakeXMLBaseParser(state);
  state->value = state->owned.get();

  TrackParser(state);
  info.GetReturnValue().Set(WrapXMLParser(std::move(state)));
}

NAN_METHOD(CreateParser) {
  auto* root = ElementOf(info[0]);
  if (!root || IsContextRoot(root)) {
    if (root) {
      Nan::ThrowError("XMLParser requires an element or document root");
    }
    return;
  }

  auto state = std::make_shared<XMLParserState>();
  state->root = ShareElement(root);
  state->generation = State().generation;
  state->handler_revision = Revision();
  state->owned = std::make_unique<Rml::XMLParser>(root);
  state->value = state->owned.get();
  state->xml = static_cast<Rml::XMLParser*>(state->value);

  TrackParser(state);
  auto handle = WrapXMLParser(state);
  Nan::SetPrivate(handle, Nan::New("rml.xml.root").ToLocalChecked(), info[0])
      .FromJust();
  info.GetReturnValue().Set(handle);
}

NAN_METHOD(CreateHandler) {
  ClaimRuntimeSetup();
  const auto generation = HandlerGeneration();
  const auto revision = Revision();

  v8::Local<v8::Array> functions;
  if (!info[0]->IsNull() && !ReadFunctions(info[0], true, &functions)) {
    return;
  }
  if (generation != HandlerGeneration() || revision != Revision()) {
    return Nan::ThrowError("Runtime changed while reading XML callbacks");
  }

  auto state = std::make_shared<XMLHandlerState>();
  state->generation = generation;
  if (info[0]->IsNull()) {
    state->owned = std::make_shared<Rml::XMLNodeHandlerDefault>();
  } else {
    state->functions.Reset(v8::Isolate::GetCurrent(), functions);
    state->functions.SetWeak();
    state->owned = MakeXMLNodeHandler(state);
  }
  state->value = state->owned.get();
  TrackHandler(state);
  info.GetReturnValue().Set(WrapXMLHandler(std::move(state)));
}

NAN_METHOD(RegisterHandler) {
  ClaimRuntimeSetup();
  Rml::String tag;
  if (!Text(info[0], &tag)) {
    return;
  }
  auto state = info[1]->IsNull() ? nullptr : XMLHandlerOf(info[1]);
  if (!state && !info[1]->IsNull()) {
    return;
  }
  if (state && !state->owned) {
    return Nan::ThrowError("Register an owned XMLNodeHandler");
  }

  tag = Rml::StringUtilities::ToLower(tag);
  Rml::XMLParser::RegisterNodeHandler(tag, state ? state->owned : nullptr);
  SetupTableExists() = true;
  ++Revision();

  auto found = Registrations().find(tag);
  if (found != Registrations().end()) {
    --found->second->registrations;
    CallbackEdge(found->second);
    Registrations().erase(found);
  }

  if (state) {
    ++state->registrations;
    CallbackEdge(state);
    Registrations()[tag] = state;
    info.GetReturnValue().Set(WrapXMLHandler(std::move(state)));
  } else {
    info.GetReturnValue().SetNull();
  }
}

NAN_METHOD(GetHandler) {
  Rml::String tag;
  if (!Text(info[0], &tag)) {
    return;
  }

  if (!State().initialized && !SetupTableExists()) {
    info.GetReturnValue().SetNull();
    return;
  }

  info.GetReturnValue().Set(
      NullableHandler(Rml::XMLParser::GetNodeHandler(tag)));
}

template <bool persistent, bool inner>
NAN_METHOD(RegisterTag) {
  Rml::String tag;
  if (!Text(info[persistent ? 0 : 1], &tag)) {
    return;
  }
  if constexpr (persistent) {
    ClaimRuntimeSetup();
    Rml::XMLParser::RegisterPersistentCDATATag(tag);
    SetupTableExists() = true;
  } else if (auto state = XMLParserOf(info[0])) {
    if constexpr (inner) {
      state->value->RegisterInnerXMLAttribute(tag);
    } else {
      state->value->RegisterCDATATag(tag);
    }
  }
}

NAN_METHOD(IsCDATATag) {
  Rml::String tag;
  if (!Text(info[1], &tag)) {
    return;
  }
  if (auto state = XMLParserOf(info[0])) {
    info.GetReturnValue().Set(state->value->IsCDATATag(tag));
  }
}

v8::Local<v8::Array> WrapEvents(const std::vector<XMLEvent>& events) {
  auto result = Nan::New<v8::Array>();
  for (const auto& event : events) {
    auto record = Nan::New<v8::Object>();
    const bool data = event.kind == XMLEvent::Kind::kData;
    constexpr const char* names[] = {"start", "end", "data"};
    Put(record,
        "kind",
        Nan::New(names[static_cast<int>(event.kind)]).ToLocalChecked());
    Put(record, data ? "data" : "name", Nan::New(event.text).ToLocalChecked());
    if (data) {
      Put(record, "type", Nan::New(static_cast<int>(event.type)));
    } else if (event.kind == XMLEvent::Kind::kStart) {
      Put(record, "attributes", XMLAttributesToJs(event.attributes));
    }
    Put(record, "lineNumber", Nan::New(event.line));
    Put(record, "lineNumberOpenTag", Nan::New(event.open_line));
    result
        ->CreateDataProperty(Nan::GetCurrentContext(), result->Length(), record)
        .FromJust();
  }
  return result;
}

NAN_METHOD(Parse) {
  auto stream = ShareStream(info[1]);
  auto state = stream ? XMLParserOf(info[0]) : nullptr;
  if (!state) {
    return;
  }
  if (state->active || state->borrowed) {
    return Nan::ThrowError("XMLParser is already parsing");
  }

  const bool collecting = info[2]->IsTrue();
  if (collecting && state->xml) {
    return Nan::ThrowError("Use BaseXMLParser to collect XML events");
  }

  if (state->root) {
    auto* root = state->root->element.get();
    if (!root || !CanReplaceElementChildren(root)) {
      return;
    }
    State().active_elements.push_back(root);
  }

  state->active = true;
  state->collecting = collecting;
  state->events.clear();
  struct FinishParse {
    XMLParserState* state;
    ~FinishParse() {
      state->active = false;
      state->collecting = false;
      state->events.clear();
    }
  } finish{state.get()};

  state->value->Parse(stream->value.get());
  if (!State().callback_exception.IsEmpty()) {
    return;
  }
  if (stream->value->HasReadError()) {
    return Nan::ThrowError("XML source stream could not be read");
  }
  if (collecting) {
    info.GetReturnValue().Set(WrapEvents(state->events));
  }
}

template <bool open>
NAN_METHOD(GetLine) {
  if (auto state = XMLParserOf(info[0])) {
    info.GetReturnValue().Set(open ? state->value->GetLineNumberOpenTag()
                                   : state->value->GetLineNumber());
  }
}

NAN_METHOD(GetSource) {
  auto state = XMLParserOf(info[0]);
  if (!state) {
    return;
  }
  if (!state->active) {
    return Nan::ThrowError("XML source URL requires active parsing");
  }
  const auto* url =
      state->xml ? &state->xml->GetSourceURL() : XMLBaseSourceURL(state->value);
  if (!url) {
    return Nan::ThrowError("XML source URL requires active parsing");
  }
  info.GetReturnValue().Set(Nan::New(url->GetURL()).ToLocalChecked());
}

std::shared_ptr<XMLParserState> DocumentParser(v8::Local<v8::Value> input,
                                               bool active = false) {
  auto state = XMLParserOf(input);
  if (!state) {
    return {};
  }
  if (!state->xml || (active && !state->active)) {
    Nan::ThrowError("Expected an active XMLParser");
    return {};
  }
  return state;
}

NAN_METHOD(GetFrame) {
  if (auto state = DocumentParser(info[0])) {
    const auto* frame = state->xml->GetParseFrame();
    auto result = Nan::New<v8::Object>();
    Put(result, "tag", Nan::New(frame->tag).ToLocalChecked());
    Put(result, "element", WrapNullableElement(frame->element));
    Put(result, "nodeHandler", NullableHandler(frame->node_handler));
    Put(result, "childHandler", NullableHandler(frame->child_handler));
    info.GetReturnValue().Set(result);
  }
}

NAN_METHOD(GetHeader) {
  if (auto state = DocumentParser(info[0])) {
    info.GetReturnValue().Set(
        WrapDocumentHeader(*state->xml->GetDocumentHeader()));
  }
}

NAN_METHOD(SetHeader) {
  Rml::DocumentHeader copy;
  if (!CopyDocumentHeader(info[1], &copy)) {
    return;
  }
  if (auto state = DocumentParser(info[0], true)) {
    *state->xml->GetDocumentHeader() = std::move(copy);
  }
}

template <bool start>
NAN_METHOD(HandleElement) {
  Rml::String name;
  Rml::XMLAttributes attributes;
  if (!Text(info[1], &name)) {
    return;
  }
  if constexpr (start) {
    if (!ReadElementAttributes(info[2], &attributes)) {
      return;
    }
  }

  auto state = XMLParserOf(info[0]);
  if (!state) {
    return;
  }
  if (state->xml) {
    return Nan::ThrowError("XMLParser element handlers are protected");
  }
  if constexpr (start) {
    state->value->HandleElementStart(name, attributes);
  } else {
    state->value->HandleElementEnd(name);
  }
}

NAN_METHOD(HandleData) {
  Rml::String data;
  if (!Text(info[1], &data)) {
    return;
  }
  if (!info[2]->IsInt32()) {
    return Nan::ThrowTypeError("Expected an XMLDataType");
  }
  const int type = Nan::To<int>(info[2]).FromJust();
  if (type < 0 || type > static_cast<int>(Rml::XMLDataType::InnerXML)) {
    return Nan::ThrowRangeError("Expected an XMLDataType");
  }

  auto state = XMLParserOf(info[0]);
  if (!state) {
    return;
  }
  if (state->xml && !state->active) {
    return Nan::ThrowError("Expected an active XMLParser");
  }
  if (!state->xml && State().xml_callback_depth) {
    return Nan::ThrowError("Cannot dispatch BaseXMLParser from a callback");
  }

  state->value->HandleData(data, static_cast<Rml::XMLDataType>(type));
}

NAN_METHOD(PushHandler) {
  Rml::String tag;
  if (!Text(info[1], &tag)) {
    return;
  }
  if (auto state = DocumentParser(info[0], true)) {
    info.GetReturnValue().Set(state->xml->PushHandler(tag));
  }
}

NAN_METHOD(PushDefault) {
  if (auto state = DocumentParser(info[0], true)) {
    state->xml->PushDefaultHandler();
  }
}

template <int method>
NAN_METHOD(InvokeHandler) {
  Rml::String text;
  Rml::XMLAttributes attributes;
  if (!Text(info[2], &text)) {
    return;
  }
  if constexpr (method == 0) {
    if (!ReadElementAttributes(info[3], &attributes)) {
      return;
    }
  }
  int type = 0;
  if constexpr (method == 2) {
    if (!info[3]->IsInt32() || (type = Nan::To<int>(info[3]).FromJust()) < 0 ||
        type > static_cast<int>(Rml::XMLDataType::InnerXML)) {
      return Nan::ThrowTypeError("Expected an XMLDataType");
    }
  }
  auto handler = XMLHandlerOf(info[0]);
  auto parser = handler ? DocumentParser(info[1], true) : nullptr;
  if (!parser) {
    return;
  }
  if constexpr (method == 0) {
    info.GetReturnValue().Set(WrapNullableElement(
        handler->value->ElementStart(parser->xml, text, attributes)));
  } else if constexpr (method == 1) {
    info.GetReturnValue().Set(handler->value->ElementEnd(parser->xml, text));
  } else {
    info.GetReturnValue().Set(handler->value->ElementData(
        parser->xml, text, static_cast<Rml::XMLDataType>(type)));
  }
}

}  // namespace

uint64_t XMLHandlerRevision() {
  return Revision();
}

v8::Local<v8::Object> WrapXMLParser(std::shared_ptr<XMLParserState> state) {
  if (!state->handle.IsEmpty()) {
    return state->handle.Get(v8::Isolate::GetCurrent());
  }
  auto result = XMLParserHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), result);
  state->handle.SetWeak();
  if (!state->functions.IsEmpty()) {
    Nan::SetPrivate(result,
                    Nan::New("rml.xml.callbacks").ToLocalChecked(),
                    state->functions.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  return result;
}

v8::Local<v8::Object> WrapXMLHandler(std::shared_ptr<XMLHandlerState> state) {
  if (!state->handle.IsEmpty()) {
    return state->handle.Get(v8::Isolate::GetCurrent());
  }
  auto result = XMLHandlerHandle::Create(state);
  state->handle.Reset(v8::Isolate::GetCurrent(), result);
  state->handle.SetWeak();
  if (!state->functions.IsEmpty() && !state->registrations) {
    Nan::SetPrivate(result,
                    Nan::New("rml.xml.callbacks").ToLocalChecked(),
                    state->functions.Get(v8::Isolate::GetCurrent()))
        .FromJust();
  }
  return result;
}

std::shared_ptr<XMLParserState> XMLParserOf(v8::Local<v8::Value> input) {
  auto* handle = XMLParserHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an XML parser");
    return {};
  }
  auto state = handle->owner();
  if (!state->value || state->generation != State().generation ||
      (state->xml && state->handler_revision != Revision()) ||
      (state->root && !state->root->element)) {
    Nan::ThrowError("XMLParser is no longer valid");
    return {};
  }
  if (State().xml_callback_depth &&
      state->value != CurrentXMLCallbackParser()) {
    Nan::ThrowError("XML callback may access only its current parser");
    return {};
  }
  return state;
}

std::shared_ptr<XMLHandlerState> XMLHandlerOf(v8::Local<v8::Value> input) {
  auto* handle = XMLHandlerHandle::TryFrom(input);
  if (!handle) {
    Nan::ThrowTypeError("Expected an XMLNodeHandler");
    return {};
  }
  auto state = handle->owner();
  if (!state->value || state->generation != HandlerGeneration() ||
      (!state->owned && state->handler_revision != Revision())) {
    Nan::ThrowError("XMLNodeHandler is no longer valid");
    return {};
  }
  return state;
}

void ReleaseXMLBindings() {
  for (auto& weak : Parsers()) {
    if (auto state = weak.lock()) {
      state->value = nullptr;
      state->xml = nullptr;
      state->owned.reset();
      state->root.reset();
      state->functions.Reset();
      if (!state->handle.IsEmpty()) {
        const auto handle = state->handle.Get(v8::Isolate::GetCurrent());
        Nan::DeletePrivate(handle,
                           Nan::New("rml.xml.callbacks").ToLocalChecked())
            .FromJust();
        Nan::DeletePrivate(handle, Nan::New("rml.xml.root").ToLocalChecked())
            .FromJust();
      }
      state->handle.Reset();
      state->events.clear();
    }
  }
  // Native shared handlers remain alive in Core's table until Shutdown.
  // Suppress JS after element/context teardown, then clear the host roots.
  for (auto& [pointer, weak] : Handlers()) {
    if (auto state = weak.lock()) {
      state->value = nullptr;
      state->functions.Reset();
      if (!state->handle.IsEmpty()) {
        Nan::DeletePrivate(state->handle.Get(v8::Isolate::GetCurrent()),
                           Nan::New("rml.xml.callbacks").ToLocalChecked())
            .FromJust();
      }
      state->handle.Reset();
      state->owned.reset();
      state->registrations = 0;
    }
  }
  Registrations().clear();
  Handlers().clear();
  Parsers().clear();
  if (!State().initialized && SetupTableExists()) {
    Rml::XMLParser::ReleaseHandlers();
  }
  SetupTableExists() = false;
  ++Revision();
}

NAN_MODULE_INIT(InitializeRmlXML) {
  SetRuntimeMethod<CreateBase>(target, "createXMLBaseParser");
  SetRuntimeMethod<CreateParser>(target, "createXMLParser");
  SetRuntimeMethod<CreateHandler, false, false>(target, "createXMLNodeHandler");
  SetRuntimeMethod<RegisterHandler, false, false>(target,
                                                  "xmlRegisterNodeHandler");
  SetXMLMethod<GetHandler, false>(target, "xmlGetNodeHandler");
  SetRuntimeMethod<RegisterTag<true, false>, false, false>(
      target, "xmlRegisterPersistentCDATATag");
  SetRuntimeMethod<RegisterTag<false, false>>(target, "xmlRegisterCDATATag");
  SetRuntimeMethod<RegisterTag<false, true>>(target,
                                             "xmlRegisterInnerXMLAttribute");
  SetRuntimeMethod<Parse>(target, "xmlParse");

  SetXMLMethod<IsCDATATag>(target, "xmlIsCDATATag");
  SetXMLMethod<GetLine<false>>(target, "xmlGetLineNumber");
  SetXMLMethod<GetLine<true>>(target, "xmlGetLineNumberOpenTag");
  SetXMLMethod<GetSource>(target, "xmlGetSourceURL");
  SetXMLMethod<GetFrame>(target, "xmlGetParseFrame");
  SetXMLMethod<GetHeader>(target, "xmlGetDocumentHeader");
  SetXMLMethod<SetHeader>(target, "xmlSetDocumentHeader");
  SetRuntimeMethod<HandleElement<true>>(target, "xmlHandleElementStart");
  SetRuntimeMethod<HandleElement<false>>(target, "xmlHandleElementEnd");
  SetXMLMethod<HandleData>(target, "xmlHandleData");

  SetXMLMethod<PushHandler>(target, "xmlPushHandler");
  SetXMLMethod<PushDefault>(target, "xmlPushDefaultHandler");

  SetXMLMethod<InvokeHandler<0>>(target, "xmlNodeElementStart");
  SetXMLMethod<InvokeHandler<1>>(target, "xmlNodeElementEnd");
  SetXMLMethod<InvokeHandler<2>>(target, "xmlNodeElementData");
}

}  // namespace sfmlrmlui
