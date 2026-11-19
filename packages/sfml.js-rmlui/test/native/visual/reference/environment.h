// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#ifndef PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_VISUAL_REFERENCE_ENVIRONMENT_H_
#define PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_VISUAL_REFERENCE_ENVIRONMENT_H_

#include <RmlUi/Core.h>

#include <cstdio>
#include <filesystem>
#include <iostream>
#include <utility>
#include <vector>

namespace visual_reference {

constexpr unsigned kWidth = 1024;
constexpr unsigned kHeight = 768;

// Use the same Samples-root resource resolution as the official shell.
class Files final : public Rml::FileInterface {
 public:
  explicit Files(std::filesystem::path samples)
      : samples_(std::move(samples)) {}

  Rml::FileHandle Open(const Rml::String& name) override {
    std::filesystem::path path(name);
    if (!std::filesystem::is_regular_file(path)) {
      path = samples_ / (name.starts_with("/") ? name.substr(1) : name);
    }
    return reinterpret_cast<Rml::FileHandle>(
        std::fopen(path.lexically_normal().c_str(), "rb"));
  }

  void Close(Rml::FileHandle file) override {
    std::fclose(reinterpret_cast<std::FILE*>(file));
  }

  size_t Read(void* buffer, size_t size, Rml::FileHandle file) override {
    return std::fread(buffer, 1, size, reinterpret_cast<std::FILE*>(file));
  }

  // Rml::FileInterface requires the platform C long in this virtual signature.
  bool Seek(Rml::FileHandle file,
            long offset,  // NOLINT(runtime/int)
            int origin) override {
    return std::fseek(reinterpret_cast<std::FILE*>(file), offset, origin) == 0;
  }

  size_t Tell(Rml::FileHandle file) override {
    return std::ftell(reinterpret_cast<std::FILE*>(file));
  }

 private:
  std::filesystem::path samples_;
};

class System final : public Rml::SystemInterface {
 public:
  double seconds{0};
  std::vector<Rml::String> warnings;
  std::vector<Rml::String> errors;

  double GetElapsedTime() override { return seconds; }

  bool LogMessage(Rml::Log::Type type, const Rml::String& message) override {
    if (type == Rml::Log::LT_ERROR) {
      errors.push_back(message);
    } else if (type == Rml::Log::LT_WARNING) {
      warnings.push_back(message);
    }
    return true;
  }
};

}  // namespace visual_reference

#endif  // PACKAGES_SFML_JS_RMLUI_TEST_NATIVE_VISUAL_REFERENCE_ENVIRONMENT_H_
