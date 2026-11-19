// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_DOCUMENTS_RMLUI_DOCUMENT_HEADER_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_DOCUMENTS_RMLUI_DOCUMENT_HEADER_H_

#include <nan.h>

#include "third_party/rmlui/Source/Core/DocumentHeader.h"

namespace sfmlrmlui {

// Copy a checked header before entering a document's native parsing stack.
bool CopyDocumentHeader(v8::Local<v8::Value> input,
                        Rml::DocumentHeader* output);
v8::Local<v8::Object> WrapDocumentHeader(const Rml::DocumentHeader& value);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_DOM_DOCUMENTS_RMLUI_DOCUMENT_HEADER_H_
