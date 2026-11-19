// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_IO_RMLUI_FILE_INTERFACE_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_IO_RMLUI_FILE_INTERFACE_H_

#include <string>

namespace sfmlrmlui {

// Preserves the selected provider; a root option cannot replace custom I/O.
bool PrepareFileInterface(const std::string* root);
// Workers may read a filesystem provider, never an owner-thread JS provider.
bool HasCustomFileInterface();
// An implicit default follows original stdio paths, without the root shell.
bool HasRootFileInterface();
// Call after native streams and Core have stopped borrowing file handles.
void ReleaseFileInterfaceBindings();

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_IO_RMLUI_FILE_INTERFACE_H_
