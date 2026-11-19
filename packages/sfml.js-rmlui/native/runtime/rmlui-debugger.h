// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_DEBUGGER_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_DEBUGGER_H_

namespace Rml {
class Context;
class ElementDocument;
}  // namespace Rml

namespace sfmlrmlui {

// Close the native plugin while its documents, contexts and registries live.
void ShutdownDebugger();

// Removing the host also releases debug documents in a separate target.
void ReleaseDebuggerForContext(Rml::Context* context);

// Debugger internals must be released together through its plugin.
bool CanUnloadDebuggerDocument(Rml::ElementDocument* document);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_RUNTIME_RMLUI_DEBUGGER_H_
