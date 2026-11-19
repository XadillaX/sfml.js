// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/BaseXMLParser.h>
#include <RmlUi/Core/Dictionary.h>
#include <RmlUi/Core/StreamMemory.h>
#include <RmlUi/Core/URL.h>
#include <RmlUi/Core/XMLNodeHandler.h>
#include <RmlUi/Core/XMLParser.h>

#include <cassert>
#include <iostream>
#include <memory>
#include <type_traits>
#include <utility>

namespace {

struct Event {
  Rml::String kind;
  Rml::String text;
  Rml::XMLAttributes attributes;
  Rml::XMLDataType type{Rml::XMLDataType::Text};
  int line{0};
  int open_line{0};
  Rml::String source;
};

class CaptureParser : public Rml::BaseXMLParser {
 public:
  void HandleElementStart(const Rml::String& name,
                          const Rml::XMLAttributes& attributes) override {
    events.push_back({"start",
                      name,
                      attributes,
                      Rml::XMLDataType::Text,
                      GetLineNumber(),
                      GetLineNumberOpenTag(),
                      Source()});
  }

  void HandleElementEnd(const Rml::String& name) override {
    events.push_back({"end",
                      name,
                      {},
                      Rml::XMLDataType::Text,
                      GetLineNumber(),
                      GetLineNumberOpenTag(),
                      Source()});
  }

  void HandleData(const Rml::String& data, Rml::XMLDataType type) override {
    events.push_back({"data",
                      data,
                      {},
                      type,
                      GetLineNumber(),
                      GetLineNumberOpenTag(),
                      Source()});
  }

  bool HasSource() const { return GetSourceURLPtr() != nullptr; }
  Rml::Vector<Event> events;

 private:
  Rml::String Source() const {
    const auto* source = GetSourceURLPtr();
    return source ? source->GetURL() : Rml::String{};
  }
};

void CheckBaseVirtuals() {
  Rml::BaseXMLParser parser;
  assert(parser.GetLineNumber() == 0);
  assert(parser.GetLineNumberOpenTag() == 0);
  parser.HandleElementStart("manual", {});
  parser.HandleData("manual", Rml::XMLDataType::Text);
  parser.HandleElementEnd("manual");

  CaptureParser capture;
  capture.HandleElementStart("manual", {});
  capture.HandleData("manual", Rml::XMLDataType::CDATA);
  capture.HandleElementEnd("manual");
  assert(capture.events.size() == 3);
  assert(capture.events[0].kind == "start");
  assert(capture.events[1].type == Rml::XMLDataType::CDATA);
  assert(capture.events[2].kind == "end");
  assert(capture.events[0].source.empty());

  std::cout << "PASS native-xml-base-public-virtual-dispatch\n";
}

void CheckNativeParse() {
  CaptureParser parser;
  parser.RegisterCDATATag("RAW");
  parser.RegisterInnerXMLAttribute("capture");
  assert(parser.IsCDATATag("raw"));
  assert(parser.IsCDATATag("RAW"));
  assert(!parser.IsCDATATag("missing"));

  const Rml::String source =
      "<root key=\"a&amp;b\">\n<raw><b>literal</b></raw>"
      "<box capture=\"yes\"><i>inner</i></box><![CDATA[free]]></root>";
  Rml::StreamMemory stream(reinterpret_cast<const Rml::byte*>(source.data()),
                           source.size());
  stream.SetSourceURL("views/native-parser.rml");
  parser.Parse(&stream);
  assert(parser.events.size() == 10);
  assert(parser.events[0].text == "root");
  assert(Rml::Get(parser.events[0].attributes, "key", Rml::String{}) == "a&b");
  assert(parser.events[0].line == 1);
  assert(parser.events[2].line == 2);
  assert(parser.events[3].text == "<b>literal</b>");
  assert(parser.events[3].type == Rml::XMLDataType::CDATA);
  assert(parser.events[6].text == "<i>inner</i>");
  assert(parser.events[6].type == Rml::XMLDataType::InnerXML);
  assert(parser.events[8].text == "free");
  // Explicit CDATA appends to upstream text; registered raw tags use CDATA.
  assert(parser.events[8].type == Rml::XMLDataType::Text);
  assert(parser.events[9].kind == "end");
  for (const auto& event : parser.events) {
    assert(event.source == "views/native-parser.rml");
  }
  assert(parser.GetLineNumber() == 2);
  assert(parser.GetLineNumberOpenTag() == 2);
  assert(!parser.HasSource());

  std::cout << "PASS native-xml-tokenization-cdata-innerxml-source-lifetime\n";
}

class CaptureHandler : public Rml::XMLNodeHandler {
 public:
  explicit CaptureHandler(int* destroyed) : destroyed_(destroyed) {}
  ~CaptureHandler() override { ++*destroyed_; }

  Rml::Element* ElementStart(Rml::XMLParser*,
                             const Rml::String& name,
                             const Rml::XMLAttributes&) override {
    names.push_back(name);
    return nullptr;
  }

  bool ElementEnd(Rml::XMLParser*, const Rml::String& name) override {
    names.push_back(name);
    return false;
  }

  bool ElementData(Rml::XMLParser*,
                   const Rml::String& data,
                   Rml::XMLDataType) override {
    names.push_back(data);
    return true;
  }

  Rml::StringList names;

 private:
  int* destroyed_;
};

void CheckNativeRegistry() {
  int destroyed = 0;
  Rml::XMLParser::RegisterPersistentCDATATag("payload");
  auto handler = Rml::MakeShared<CaptureHandler>(&destroyed);
  auto* pointer = handler.get();
  Rml::WeakPtr<Rml::XMLNodeHandler> observer = handler;
  assert(Rml::XMLParser::RegisterNodeHandler("TAG", handler) == pointer);
  assert(Rml::XMLParser::GetNodeHandler("tag") == pointer);
  assert(Rml::XMLParser::GetNodeHandler("TAG") == nullptr);
  assert(pointer->ElementStart(nullptr, "start", {}) == nullptr);
  assert(!pointer->ElementEnd(nullptr, "end"));
  assert(pointer->ElementData(nullptr, "data", Rml::XMLDataType::InnerXML));
  assert((pointer->names == Rml::StringList{"start", "end", "data"}));

  handler.reset();
  assert(!observer.expired());
  assert(Rml::XMLParser::RegisterNodeHandler("tag", nullptr) == nullptr);
  assert(observer.expired());
  assert(destroyed == 1);
  assert(Rml::XMLParser::GetNodeHandler("tag") == nullptr);

  auto default_handler = Rml::MakeShared<CaptureHandler>(&destroyed);
  assert(Rml::XMLParser::RegisterNodeHandler("", default_handler) ==
         default_handler.get());
  assert(Rml::XMLParser::GetNodeHandler("") == nullptr);
  default_handler.reset();
  assert(destroyed == 1);
  Rml::XMLParser::ReleaseHandlers();
  assert(destroyed == 2);

  std::cout << "PASS native-xml-registry-shared-ownership-and-release\n";
}

void CheckFrameContracts() {
  static_assert(std::is_base_of_v<Rml::BaseXMLParser, Rml::XMLParser>);
  static_assert(std::is_constructible_v<Rml::XMLParser, Rml::Element*>);
  static_assert(std::has_virtual_destructor_v<Rml::BaseXMLParser>);
  static_assert(std::has_virtual_destructor_v<Rml::XMLNodeHandler>);
  static_assert(!std::is_copy_constructible_v<Rml::XMLNodeHandler>);
  static_assert(!std::is_move_constructible_v<Rml::XMLNodeHandler>);
  static_assert(std::is_same_v<
                decltype(std::declval<const Rml::XMLParser&>().GetParseFrame()),
                const Rml::XMLParser::ParseFrame*>);
  static_assert(std::is_same_v<
                decltype(std::declval<const Rml::XMLParser&>().GetSourceURL()),
                const Rml::URL&>);
  Rml::XMLParser::ParseFrame frame;
  assert(frame.tag.empty());
  assert(frame.element == nullptr);
  assert(frame.node_handler == nullptr);
  assert(frame.child_handler == nullptr);
  std::cout << "PASS native-xml-frame-defaults-and-interface-contracts\n";
}

}  // namespace

int main() {
  CheckBaseVirtuals();
  CheckNativeParse();
  CheckNativeRegistry();
  CheckFrameContracts();
}
