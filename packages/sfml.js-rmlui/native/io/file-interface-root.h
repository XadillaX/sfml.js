// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_NATIVE_IO_FILE_INTERFACE_ROOT_H_
#define PACKAGES_SFML_JS_RMLUI_NATIVE_IO_FILE_INTERFACE_ROOT_H_

#include <RmlUi/Core/FileInterface.h>

#include <cstdio>
#include <string>

namespace sfmlrmlui {

// Matches the upstream sample shell: try the resource root first, then the
// original path. A leading slash denotes a resource path, not a sandbox.
class FileInterfaceRoot final : public Rml::FileInterface {
 public:
  explicit FileInterfaceRoot(const std::string& root, bool use_root = true);

  Rml::FileHandle Open(const Rml::String& path) override;
  void Close(Rml::FileHandle file) override;
  size_t Read(void* buffer, size_t size, Rml::FileHandle file) override;
  // RmlUi's FileInterface requires the C stdio long offset type.
  bool Seek(Rml::FileHandle file,
            long offset,  // NOLINT(runtime/int)
            int origin) override;
  size_t Tell(Rml::FileHandle file) override;

 private:
  std::string root_;
  bool use_root_{true};
};

}  // namespace sfmlrmlui

#endif  // PACKAGES_SFML_JS_RMLUI_NATIVE_IO_FILE_INTERFACE_ROOT_H_
