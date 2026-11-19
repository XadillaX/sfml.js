// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/FileInterface.h>

#include <algorithm>
#include <array>
#include <cstdio>
#include <cstring>
#include <iostream>
#include <limits>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "native/rendering/render-interface-sfml.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Window/VideoMode.hpp>

namespace {

using Renderer = sfmlrmlui::RenderInterfaceSFML;

void Require(bool condition, const char* message) {
  if (!condition) {
    throw std::runtime_error(message);
  }
}

// Only the application file boundary is replaced. Decode, premultiplication,
// SFML upload and texture/cache ownership all run through the real renderer.
class MemoryFile final : public Rml::FileInterface {
 public:
  enum class Failure {
    kNone,
    kOpen,
    kSeekEnd,
    kSeekStart,
    kShortRead,
    kThrowSeekEnd,
    kThrowSeekStart,
    kThrowTell,
    kThrowRead,
    kThrowClose,
    kThrowReadAndClose,
    kInvalidLength,
  };

  explicit MemoryFile(std::vector<Rml::byte> data, Failure failure)
      : data_(std::move(data)), failure_(failure) {}

  Rml::FileHandle Open(const Rml::String& path) override {
    Require(path == "memory/image.png", "Unexpected resource path");
    ++opens;
    return failure_ == Failure::kOpen ? 0 : 1;
  }

  void Close(Rml::FileHandle file) override {
    Require(file == 1, "Closing a foreign handle");
    ++closes;
    if (failure_ == Failure::kThrowClose ||
        failure_ == Failure::kThrowReadAndClose) {
      throw std::runtime_error("Injected close failure");
    }
  }

  size_t Read(void* buffer, size_t size, Rml::FileHandle file) override {
    Require(file == 1 && position_ == 0 && size == data_.size(),
            "Unexpected read range");
    ++reads;
    if (failure_ == Failure::kThrowRead ||
        failure_ == Failure::kThrowReadAndClose) {
      throw std::runtime_error("Injected read failure");
    }
    const size_t count = size - (failure_ == Failure::kShortRead ? 1 : 0);
    std::memcpy(buffer, data_.data(), count);
    position_ = count;
    return count;
  }

  using FileOffset = decltype(0L);

  bool Seek(Rml::FileHandle file, FileOffset offset, int origin) override {
    Require(file == 1 && offset == 0, "Unexpected seek");
    Require(origin == SEEK_SET || origin == SEEK_END, "Unexpected seek origin");
    ++seeks;
    if ((origin == SEEK_END && failure_ == Failure::kThrowSeekEnd) ||
        (origin == SEEK_SET && failure_ == Failure::kThrowSeekStart)) {
      throw std::runtime_error("Injected seek failure");
    }
    // A provider may leave a useful position even when reporting failure.
    // The renderer must honor the result before decoding any valid prefix.
    position_ = origin == SEEK_END ? data_.size() : 0;
    return !((origin == SEEK_END && failure_ == Failure::kSeekEnd) ||
             (origin == SEEK_SET && failure_ == Failure::kSeekStart));
  }

  size_t Tell(Rml::FileHandle file) override {
    Require(file == 1, "Telling a foreign handle");
    if (failure_ == Failure::kThrowTell) {
      throw std::runtime_error("Injected tell failure");
    }
    if (failure_ == Failure::kInvalidLength) {
      return std::numeric_limits<size_t>::max();
    }
    return position_;
  }

  unsigned opens{0};
  unsigned closes{0};
  unsigned seeks{0};
  unsigned reads{0};

 private:
  std::vector<Rml::byte> data_;
  Failure failure_;
  size_t position_{0};
};

class FileRegistration final {
 public:
  explicit FileRegistration(Rml::FileInterface* provider)
      : previous_(Rml::GetFileInterface()) {
    Rml::SetFileInterface(provider);
  }

  ~FileRegistration() { Rml::SetFileInterface(previous_); }

 private:
  Rml::FileInterface* previous_;
};

sf::Image SourceImage() {
  sf::Image image({2, 2}, sf::Color(200, 100, 50, 128));
  image.setPixel({1, 1}, sf::Color(20, 40, 80, 255));
  return image;
}

std::vector<Rml::byte> EncodedImage() {
  const auto encoded = SourceImage().saveToMemory("png");
  Require(encoded.has_value(), "Cannot encode fixture PNG");
  return *encoded;
}

void SeekFailures() {
  for (const auto failure :
       {MemoryFile::Failure::kSeekEnd, MemoryFile::Failure::kSeekStart}) {
    Renderer renderer;
    MemoryFile file(EncodedImage(), failure);
    FileRegistration registration(&file);
    Rml::Vector2i dimensions{17, 23};
    const auto handle = renderer.LoadTexture(dimensions, "memory/image.png");
    renderer.ReleaseTexture(handle);
    Require(file.closes == 1, "Failed seek did not close the opened handle");
    Require(handle == 0, "Failed seek returned a usable texture");
    Require(file.reads == 0, "Failed seek still read the resource");
    Require(dimensions == Rml::Vector2i(17, 23),
            "Failed load changed dimensions");
  }
}

void ShortRead() {
  Renderer renderer;
  auto bytes = EncodedImage();
  // PNG decoding accepts trailing bytes. A short read of this valid prefix
  // must still fail the file transaction, independently of decoder tolerance.
  bytes.insert(bytes.end(), 8, 0);
  MemoryFile file(std::move(bytes), MemoryFile::Failure::kShortRead);
  FileRegistration registration(&file);
  Rml::Vector2i dimensions{17, 23};
  const auto handle = renderer.LoadTexture(dimensions, "memory/image.png");
  renderer.ReleaseTexture(handle);
  Require(handle == 0, "Short read accepted a decodable prefix");
  Require(file.closes == 1, "Short read leaked its file handle");
  Require(dimensions == Rml::Vector2i(17, 23), "Short read changed dimensions");
}

void CallbackExceptions() {
  for (const auto failure : {MemoryFile::Failure::kThrowSeekEnd,
                             MemoryFile::Failure::kThrowSeekStart,
                             MemoryFile::Failure::kThrowTell,
                             MemoryFile::Failure::kThrowRead,
                             MemoryFile::Failure::kThrowClose,
                             MemoryFile::Failure::kThrowReadAndClose}) {
    Renderer renderer;
    MemoryFile file(EncodedImage(), failure);
    FileRegistration registration(&file);
    Rml::Vector2i dimensions{17, 23};
    bool threw = false;
    try {
      const auto handle = renderer.LoadTexture(dimensions, "memory/image.png");
      renderer.ReleaseTexture(handle);
    } catch (const std::runtime_error& error) {
      threw = true;
      if (failure == MemoryFile::Failure::kThrowReadAndClose) {
        Require(std::string(error.what()) == "Injected read failure",
                "Cleanup replaced the original read exception");
      }
    }
    Require(threw, "File callback exception was swallowed");
    Require(file.closes == 1, "Exception did not close exactly once");
    Require(dimensions == Rml::Vector2i(17, 23),
            "Exception committed dimensions");
  }
}

void FileUpload() {
  sfmlrmlui::DataDiagnostics diagnostics;
  diagnostics.active = true;
  Renderer renderer(&diagnostics);
  MemoryFile file(EncodedImage(), MemoryFile::Failure::kNone);
  FileRegistration registration(&file);
  Rml::Vector2i dimensions;
  const auto handle = renderer.LoadTexture(dimensions, "memory/image.png");
  Require(handle != 0, "Valid image did not upload");
  const auto image = reinterpret_cast<sf::Texture*>(handle)->copyToImage();
  renderer.ReleaseTexture(handle);
  Require(dimensions == Rml::Vector2i(2, 2), "Wrong loaded dimensions");
  Require(image.getPixel({0, 0}) == sf::Color(100, 50, 25, 128),
          "File upload did not premultiply straight alpha exactly once");
  Require(image.getPixel({1, 1}) == sf::Color(20, 40, 80, 255),
          "File upload changed an opaque pixel");
  Require(file.opens == 1 && file.closes == 1 && file.reads == 1,
          "Successful upload did not retire its file handle");
  Require(diagnostics.texture_uploads == 1 &&
              diagnostics.texture_upload_bytes == 16,
          "Successful upload recorded the wrong byte count");
}

void FailedFiles() {
  Renderer renderer;
  for (const auto failure :
       {MemoryFile::Failure::kOpen, MemoryFile::Failure::kNone}) {
    MemoryFile file({1, 2, 3, 4}, failure);
    FileRegistration registration(&file);
    Rml::Vector2i dimensions{17, 23};
    Require(renderer.LoadTexture(dimensions, "memory/image.png") == 0,
            "Invalid file produced a texture");
    Require(file.closes == (failure == MemoryFile::Failure::kOpen ? 0 : 1),
            "Invalid file closed the wrong number of handles");
    Require(dimensions == Rml::Vector2i(17, 23),
            "Invalid file changed output dimensions");
  }
}

void InvalidLength() {
  Renderer renderer;
  MemoryFile file(EncodedImage(), MemoryFile::Failure::kInvalidLength);
  FileRegistration registration(&file);
  Rml::Vector2i dimensions{17, 23};
  Require(renderer.LoadTexture(dimensions, "memory/image.png") == 0,
          "Invalid file length produced a texture");
  Require(file.closes == 1, "Invalid length leaked its handle");
  Require(file.reads == 0, "Invalid length still read bytes");
  Require(dimensions == Rml::Vector2i(17, 23),
          "Invalid length changed output dimensions");
}

void MissingFileInterface() {
  Renderer renderer;
  FileRegistration registration(nullptr);
  Rml::Vector2i dimensions{17, 23};
  Require(renderer.LoadTexture(dimensions, "memory/image.png") == 0,
          "Missing provider produced a texture");
  Require(dimensions == Rml::Vector2i(17, 23),
          "Missing provider changed dimensions");
}

void GeneratedUpload() {
  Renderer renderer;
  const std::array<Rml::byte, 8> bytes{100, 50, 25, 128, 20, 40, 80, 255};
  const auto handle =
      renderer.GenerateTexture({bytes.data(), bytes.size()}, {2, 1});
  Require(handle != 0, "Valid generated texture did not upload");
  const auto image = reinterpret_cast<sf::Texture*>(handle)->copyToImage();
  renderer.ReleaseTexture(handle);
  Require(image.getSize() == sf::Vector2u(2, 1),
          "Wrong generated texture dimensions");
  Require(image.getPixel({0, 0}) == sf::Color(100, 50, 25, 128) &&
              image.getPixel({1, 0}) == sf::Color(20, 40, 80, 255),
          "Generated upload changed already premultiplied bytes");
}

void InvalidGeneratedInput() {
  sfmlrmlui::DataDiagnostics diagnostics;
  diagnostics.active = true;
  Renderer renderer(&diagnostics);
  const std::array<Rml::byte, 8> bytes{100, 50, 25, 128, 20, 40, 80, 255};
  for (const auto dimensions :
       {Rml::Vector2i{0, 1},
        Rml::Vector2i{1, 0},
        Rml::Vector2i{-1, 1},
        Rml::Vector2i{1, -1},
        Rml::Vector2i{std::numeric_limits<int>::max(), 1},
        Rml::Vector2i{std::numeric_limits<int>::max(),
                      std::numeric_limits<int>::max()}}) {
    Require(
        renderer.GenerateTexture({bytes.data(), bytes.size()}, dimensions) == 0,
        "Invalid dimensions did not return zero");
  }
  Require(renderer.GenerateTexture({bytes.data(), 7}, {2, 1}) == 0,
          "Short pixel span did not return zero");
  Require(renderer.GenerateTexture({}, {2, 1}) == 0,
          "Null pixel span did not return zero");
  const auto width = sf::Texture::getMaximumSize() + 1;
  std::vector<Rml::byte> excessive(static_cast<size_t>(width) * 4, 255);
  Require(renderer.GenerateTexture({excessive.data(), excessive.size()},
                                   {static_cast<int>(width), 1}) == 0,
          "Dimensions above the GPU limit produced a texture");
  Require(
      diagnostics.texture_uploads == 0 && diagnostics.texture_upload_bytes == 0,
      "Failed upload changed success counters");
}

void PreloadLeases() {
  Renderer renderer;
  const auto image = SourceImage();
  Require(renderer.PreloadTexture("memory/image.png", image),
          "Cannot preload valid texture");
  MemoryFile file({}, MemoryFile::Failure::kOpen);
  FileRegistration registration(&file);
  Rml::Vector2i dimensions;
  const auto first = renderer.LoadTexture(dimensions, "memory/image.png");
  const auto second = renderer.LoadTexture(dimensions, "memory/image.png");
  Require(first && first == second && file.opens == 0,
          "Preloaded texture read the file or duplicated its handle");
  renderer.ClearPreloadedTextures(nullptr);
  renderer.ReleaseTexture(first);
  const auto surviving = reinterpret_cast<sf::Texture*>(second)->copyToImage();
  Require(surviving.getPixel({1, 1}) == sf::Color(20, 40, 80, 255),
          "Eviction or first release invalidated the surviving lease");
  renderer.ReleaseTexture(second);
}

}  // namespace

int main() {
  sf::RenderWindow window(sf::VideoMode({40, 30}), "Native texture contracts");
  window.setVisible(false);
  int failures = 0;
  const auto run = [&failures](const char* name, auto test) {
    try {
      test();
      std::cout << "PASS native-texture-" << name << "\n";
    } catch (const std::exception& error) {
      std::cout << "FAIL native-texture-" << name << ": " << error.what()
                << "\n";
      ++failures;
    }
  };
  run("seek-failure", SeekFailures);
  run("short-read", ShortRead);
  run("callback-exception-close", CallbackExceptions);
  run("file-upload-premultiplied", FileUpload);
  run("invalid-files", FailedFiles);
  run("invalid-file-length", InvalidLength);
  run("missing-file-interface", MissingFileInterface);
  run("generated-upload-premultiplied", GeneratedUpload);
  run("preload-lease-survives-eviction", PreloadLeases);
  run("invalid-generated-input", InvalidGeneratedInput);
  return failures ? 1 : 0;
}
