// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_RMLUI_SCRIPT_HOST_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_RMLUI_SCRIPT_HOST_H_

#include <RmlUi/Core/Context.h>

#include <memory>

namespace sfmlrmlui {

struct LuaHost;
void SelectContextLuaHost(Rml::Context* context,
                          const std::shared_ptr<LuaHost>& host);

// Context selection and loaded documents retain captured host callbacks.
// Removal releases the selection; each existing document keeps its own host.
void ReleaseContextScriptHost(Rml::Context* context);
// Call after all documents and the upstream Factory have been destroyed.
void ReleaseScriptHosts();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_SCRIPTING_RMLUI_SCRIPT_HOST_H_
