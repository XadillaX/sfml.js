// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include "native/io/file-interface-root.h"

namespace sfmlrmlui {

FileInterfaceRoot::FileInterfaceRoot(const std::string& root, bool use_root)
    : root_(root), use_root_(use_root) {
  if (!root_.empty() && root_.back() != '/' && root_.back() != '\\') {
    root_ += '/';
  }
}

Rml::FileHandle FileInterfaceRoot::Open(const Rml::String& path) {
  const auto first = path.find_first_not_of("/\\");
  const auto relative = first == std::string::npos ? "" : path.substr(first);
  FILE* file = nullptr;
  if (use_root_) {
    file = std::fopen((root_ + relative).c_str(), "rb");
  }
  if (!file) {
    file = std::fopen(path.c_str(), "rb");
  }
  return reinterpret_cast<Rml::FileHandle>(file);
}

void FileInterfaceRoot::Close(Rml::FileHandle file) {
  std::fclose(reinterpret_cast<FILE*>(file));
}

size_t FileInterfaceRoot::Read(void* buffer,
                               size_t size,
                               Rml::FileHandle file) {
  return std::fread(buffer, 1, size, reinterpret_cast<FILE*>(file));
}

bool FileInterfaceRoot::Seek(Rml::FileHandle file,
                             long offset,  // NOLINT(runtime/int)
                             int origin) {
  return std::fseek(reinterpret_cast<FILE*>(file), offset, origin) == 0;
}

size_t FileInterfaceRoot::Tell(Rml::FileHandle file) {
  return static_cast<size_t>(std::ftell(reinterpret_cast<FILE*>(file)));
}

}  // namespace sfmlrmlui
