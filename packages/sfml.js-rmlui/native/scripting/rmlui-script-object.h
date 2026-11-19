// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_RMLUI_SCRIPT_OBJECT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_RMLUI_SCRIPT_OBJECT_H_

#include <RmlUi/Core/Context.h>
#include <RmlUi/Core/Event.h>
#include <RmlUi/Core/ScriptInterface.h>
#include <nan.h>

namespace sfmlrmlui {

// Native overrides stay authoritative. Register their exact returned pointer
// and JS object before reading it; no pointer addresses enter JavaScript.
// A supplied ownership root follows DOM transfer; otherwise Native owns it.
bool RegisterNativeScriptObject(Rml::ScriptInterface* script,
                                Rml::ScriptObject pointer,
                                v8::Local<v8::Object> object,
                                Rml::Element* ownership_root = nullptr);
// Resolve only the registered association for this exact ScriptInterface.
v8::MaybeLocal<v8::Value> ReadScriptObject(Rml::ScriptInterface* script);
// Element changes reuse the queued parent-observer lease registry.
void RefreshScriptObjectOwnership();
void ReleaseScriptObjects();
// Context roots use the same incremental element lease ownership mechanism.
void BindOwnedContextScriptObject(Rml::Context* context,
                                  v8::Local<v8::Object> handle);
// Owned event handles retain their object without creating a native GC root.
void BindOwnedEventScriptObject(Rml::Event* event,
                                v8::Local<v8::Object> handle);
// Promote before Factory takes an event away from its collectible JS owner.
void PromoteEventScriptObject(Rml::Event* event);
void ClearEventScriptObjectEdge(v8::Local<v8::Object> handle);

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_RMLUI_SCRIPT_OBJECT_H_
