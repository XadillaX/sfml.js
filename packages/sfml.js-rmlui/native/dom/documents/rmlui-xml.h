// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_DOCUMENTS_RMLUI_XML_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_DOCUMENTS_RMLUI_XML_H_

#include <RmlUi/Core/BaseXMLParser.h>
#include <RmlUi/Core/XMLNodeHandler.h>
#include <RmlUi/Core/XMLParser.h>

#include <cstdint>
#include <memory>
#include <vector>

#include "native/runtime/rmlui-state.h"

namespace sfmlrmlui {

struct XMLEvent {
  enum class Kind { kStart, kEnd, kData };
  Kind kind;
  Rml::String text;
  Rml::XMLAttributes attributes;
  Rml::XMLDataType type{Rml::XMLDataType::Text};
  int line{0};
  int open_line{0};
};

struct XMLParserState {
  std::unique_ptr<Rml::BaseXMLParser> owned;
  Rml::BaseXMLParser* value{nullptr};
  Rml::XMLParser* xml{nullptr};
  std::shared_ptr<ElementState> root;
  v8::Global<v8::Object> handle;
  v8::Global<v8::Array> functions;
  std::vector<XMLEvent> events;
  uint64_t generation{0};
  uint64_t handler_revision{0};
  bool borrowed{false};
  bool active{false};
  bool collecting{false};
};

struct XMLHandlerState {
  std::shared_ptr<Rml::XMLNodeHandler> owned;
  Rml::XMLNodeHandler* value{nullptr};
  v8::Global<v8::Object> handle;
  v8::Global<v8::Array> functions;
  uint64_t generation{0};
  uint64_t handler_revision{0};
  size_t registrations{0};
  bool active{false};
};

using XMLParserHandle = sfmljs::SharedHandle<XMLParserState>;
using XMLHandlerHandle = sfmljs::SharedHandle<XMLHandlerState>;

uint64_t XMLHandlerRevision();
Rml::BaseXMLParser*& CurrentXMLCallbackParser();
const Rml::URL* XMLBaseSourceURL(Rml::BaseXMLParser* parser);
v8::Local<v8::Object> WrapXMLParser(std::shared_ptr<XMLParserState> state);
v8::Local<v8::Object> WrapXMLHandler(std::shared_ptr<XMLHandlerState> state);
std::shared_ptr<XMLParserState> XMLParserOf(v8::Local<v8::Value> input);
std::shared_ptr<XMLHandlerState> XMLHandlerOf(v8::Local<v8::Value> input);
v8::Local<v8::Object> XMLAttributesToJs(const Rml::XMLAttributes& attributes);
std::unique_ptr<Rml::BaseXMLParser> MakeXMLBaseParser(
    const std::shared_ptr<XMLParserState>& state);
std::shared_ptr<Rml::XMLNodeHandler> MakeXMLNodeHandler(
    const std::shared_ptr<XMLHandlerState>& state);

// Invalidate checked handles before Core tears down its handler/observer pools.
void ReleaseXMLBindings();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_DOCUMENTS_RMLUI_XML_H_
