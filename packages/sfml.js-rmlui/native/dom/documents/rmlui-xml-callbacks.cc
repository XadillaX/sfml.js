// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Element.h>

#include <memory>
#include <utility>

#include "native/dom/documents/rmlui-xml.h"
#include "native/values/rmlui-variant.h"

namespace sfmlrmlui {
namespace {

class XMLCallbackScope final {
 public:
  explicit XMLCallbackScope(Rml::BaseXMLParser* parser, bool xml)
      : previous_(CurrentXMLCallbackParser()) {
    ++State().callback_depth;
    ++State().xml_callback_depth;
    CurrentXMLCallbackParser() = parser;

    lease_ = std::make_shared<XMLParserState>();
    lease_->value = parser;
    lease_->xml = xml ? static_cast<Rml::XMLParser*>(parser) : nullptr;
    lease_->generation = State().generation;
    lease_->handler_revision = XMLHandlerRevision();
    lease_->borrowed = true;
    lease_->active = true;
  }

  ~XMLCallbackScope() {
    lease_->value = nullptr;
    lease_->xml = nullptr;
    lease_->active = false;

    CurrentXMLCallbackParser() = previous_;
    --State().xml_callback_depth;
    --State().callback_depth;
  }

  v8::Local<v8::Object> Parser() { return WrapXMLParser(lease_); }

 private:
  Rml::BaseXMLParser* previous_;
  std::shared_ptr<XMLParserState> lease_;
};

bool Invoke(v8::Local<v8::Array> functions,
            int method,
            int count,
            v8::Local<v8::Value>* arguments,
            v8::Local<v8::Value>* result) {
  v8::Local<v8::Value> function;
  if (!Nan::Get(functions, method).ToLocal(&function) ||
      !function->IsFunction()) {
    return false;
  }

  RecordDiagnosticCallback(DiagnosticCallback::kParser);
  return function.As<v8::Function>()
      ->Call(Nan::GetCurrentContext(), Nan::Undefined(), count, arguments)
      .ToLocal(result);
}

class CallbackBaseParser final : public Rml::BaseXMLParser {
 public:
  explicit CallbackBaseParser(std::weak_ptr<XMLParserState> state)
      : state_(std::move(state)) {}

  void HandleElementStart(const Rml::String& name,
                          const Rml::XMLAttributes& attributes) override {
    Emit(XMLEvent::Kind::kStart, name, attributes, Rml::XMLDataType::Text);
  }

  void HandleElementEnd(const Rml::String& name) override {
    Emit(XMLEvent::Kind::kEnd, name, {}, Rml::XMLDataType::Text);
  }

  void HandleData(const Rml::String& data, Rml::XMLDataType type) override {
    Emit(XMLEvent::Kind::kData, data, {}, type);
  }

  const Rml::URL* SourceURL() const { return GetSourceURLPtr(); }

 private:
  void Emit(XMLEvent::Kind kind,
            const Rml::String& text,
            const Rml::XMLAttributes& attributes,
            Rml::XMLDataType type) {
    auto state = state_.lock();
    if (!state) {
      return;
    }

    if (state->collecting) {
      state->events.push_back({kind,
                               text,
                               attributes,
                               type,
                               GetLineNumber(),
                               GetLineNumberOpenTag()});
      return;
    }

    if (!CanInvokeCallback() || state->functions.IsEmpty()) {
      return;
    }

    Nan::HandleScope handles;
    Nan::TryCatch caught;
    XMLCallbackScope callback_scope(this, false);
    auto functions = state->functions.Get(v8::Isolate::GetCurrent());
    const int method = static_cast<int>(kind);
    v8::Local<v8::Value> arguments[] = {
        callback_scope.Parser(),
        Nan::New(text).ToLocalChecked(),
        kind == XMLEvent::Kind::kStart
            ? static_cast<v8::Local<v8::Value>>(XMLAttributesToJs(attributes))
            : static_cast<v8::Local<v8::Value>>(
                  Nan::New(static_cast<int>(type)))};
    v8::Local<v8::Value> returned;
    if (Invoke(functions,
               method,
               kind == XMLEvent::Kind::kEnd ? 2 : 3,
               arguments,
               &returned) &&
        !returned->IsUndefined()) {
      Nan::ThrowTypeError("XML base callbacks must return synchronously void");
    }
    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
    }
  }

  std::weak_ptr<XMLParserState> state_;
};

class CallbackNodeHandler final : public Rml::XMLNodeHandler {
 public:
  explicit CallbackNodeHandler(std::weak_ptr<XMLHandlerState> state)
      : state_(std::move(state)) {}

  Rml::Element* ElementStart(Rml::XMLParser* parser,
                             const Rml::String& name,
                             const Rml::XMLAttributes& attributes) override {
    Rml::Element* result = nullptr;
    Call(parser, 0, name, &attributes, Rml::XMLDataType::Text, &result);
    return result;
  }

  bool ElementEnd(Rml::XMLParser* parser, const Rml::String& name) override {
    return Call(parser, 1, name, nullptr, Rml::XMLDataType::Text, nullptr);
  }

  bool ElementData(Rml::XMLParser* parser,
                   const Rml::String& data,
                   Rml::XMLDataType type) override {
    return Call(parser, 2, data, nullptr, type, nullptr);
  }

 private:
  bool Call(Rml::XMLParser* parser,
            int method,
            const Rml::String& text,
            const Rml::XMLAttributes* attributes,
            Rml::XMLDataType type,
            Rml::Element** element) {
    auto state = state_.lock();
    if (!state || !CanInvokeCallback() || state->functions.IsEmpty()) {
      return false;
    }

    Nan::HandleScope handles;
    Nan::TryCatch caught;
    XMLCallbackScope callback_scope(parser, true);
    v8::Local<v8::Value> arguments[] = {
        callback_scope.Parser(),
        Nan::New(text).ToLocalChecked(),
        attributes
            ? static_cast<v8::Local<v8::Value>>(XMLAttributesToJs(*attributes))
            : static_cast<v8::Local<v8::Value>>(
                  Nan::New(static_cast<int>(type)))};

    bool result = false;
    if (state->active) {
      Nan::ThrowError("Recursive invocation of the same XML node handler");
    } else {
      state->active = true;

      struct ResetActive {
        XMLHandlerState* state;
        ~ResetActive() { state->active = false; }
      } reset{state.get()};

      v8::Local<v8::Value> returned;
      if (Invoke(state->functions.Get(v8::Isolate::GetCurrent()),
                 method,
                 method == 1 ? 2 : 3,
                 arguments,
                 &returned)) {
        if (returned->IsPromise()) {
          Nan::ThrowTypeError("XML node callbacks must return synchronously");
        } else if (element) {
          if (returned->IsNull()) {
            result = true;
          } else if (auto* value = ElementOf(returned)) {
            // Native stores the returned pointer past the callback. Accept
            // only a node already owned by the current parse subtree.
            auto* root = parser->GetParseFrame()->element;
            auto* ancestor = value;
            while (ancestor && ancestor != root) {
              ancestor = ancestor->GetParentNode();
            }
            if (!ancestor) {
              Nan::ThrowError("XML Element must belong to the parse subtree");
            } else {
              *element = value;
              result = true;
            }
          }
        } else if (!returned->IsBoolean()) {
          Nan::ThrowTypeError("XML node callback must return a boolean");
        } else {
          result = returned->IsTrue();
        }
      }
    }

    if (caught.HasCaught()) {
      CaptureCallbackException(caught.Exception());
      return false;
    }
    return result;
  }

  std::weak_ptr<XMLHandlerState> state_;
};

}  // namespace

Rml::BaseXMLParser*& CurrentXMLCallbackParser() {
  static Rml::BaseXMLParser* parser = nullptr;
  return parser;
}

const Rml::URL* XMLBaseSourceURL(Rml::BaseXMLParser* parser) {
  // Only owned CallbackBaseParser objects and their callback leases reach
  // this helper. XMLParser tokens use their own native source accessor.
  return static_cast<const CallbackBaseParser*>(parser)->SourceURL();
}

v8::Local<v8::Object> XMLAttributesToJs(const Rml::XMLAttributes& attributes) {
  auto result = Nan::New<v8::Object>();
  for (const auto& [key, value] : attributes) {
    v8::Local<v8::Value> converted;
    if (!VariantToJs(value).ToLocal(&converted)) {
      break;
    }
    result
        ->CreateDataProperty(
            Nan::GetCurrentContext(), Nan::New(key).ToLocalChecked(), converted)
        .FromJust();
  }
  return result;
}

std::unique_ptr<Rml::BaseXMLParser> MakeXMLBaseParser(
    const std::shared_ptr<XMLParserState>& state) {
  return std::make_unique<CallbackBaseParser>(state);
}

std::shared_ptr<Rml::XMLNodeHandler> MakeXMLNodeHandler(
    const std::shared_ptr<XMLHandlerState>& state) {
  return std::make_shared<CallbackNodeHandler>(state);
}

}  // namespace sfmlrmlui
