// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <RmlUi/Core/Core.h>
#include <RmlUi/Core/FileInterface.h>

#include <cstdint>
#include <cstdio>
#include <memory>
#include <utility>
#include <vector>

#include "native/rendering/render-interface-sfml.h"
#include <SFML/Graphics/Image.hpp>
#include <SFML/Graphics/Texture.hpp>

namespace sfmlrmlui {
namespace {

// Closing during unwinding preserves the original provider exception.
// Explicit close consumes the handle before invoking a potentially failing
// callback, so cleanup never retries a close that has already run.
class OpenTextureFile final {
 public:
  OpenTextureFile(Rml::FileInterface* provider, Rml::FileHandle handle)
      : provider_(provider), handle_(handle) {}

  OpenTextureFile(const OpenTextureFile&) = delete;
  OpenTextureFile& operator=(const OpenTextureFile&) = delete;

  ~OpenTextureFile() {
    if (handle_) {
      try {
        Close();
      } catch (...) {
      }
    }
  }

  void Close() {
    const auto handle = std::exchange(handle_, 0);
    if (handle) {
      provider_->Close(handle);
    }
  }

 private:
  Rml::FileInterface* provider_;
  Rml::FileHandle handle_;
};

}  // namespace

Rml::TextureHandle RenderInterfaceSFML::LoadTexture(
    Rml::Vector2i& texture_dimensions, const Rml::String& source) {
  const auto cached = preloaded_textures_.find(source);
  if (cached != preloaded_textures_.end()) {
    Diagnostics().Record(&DataDiagnostics::preload_texture_cache_hits);
    auto* texture = cached->second.get();
    auto& lease = preloaded_texture_leases_[texture];
    lease.texture = cached->second;
    ++lease.count;
    const auto size = texture->getSize();
    texture_dimensions = {static_cast<int>(size.x), static_cast<int>(size.y)};
    return reinterpret_cast<Rml::TextureHandle>(texture);
  }
  auto* file_interface = Rml::GetFileInterface();
  if (!file_interface) {
    return 0;
  }
  Diagnostics().Record(&DataDiagnostics::resource_main_thread_reads);
  const Rml::FileHandle file_handle = file_interface->Open(source);
  if (file_handle == 0) {
    return 0;
  }

  OpenTextureFile file(file_interface, file_handle);
  if (!file_interface->Seek(file_handle, 0, SEEK_END)) {
    file.Close();
    return 0;
  }
  const auto buffer_size = file_interface->Tell(file_handle);
  if (!buffer_size || buffer_size > std::vector<Rml::byte>().max_size() ||
      !file_interface->Seek(file_handle, 0, SEEK_SET)) {
    file.Close();
    return 0;
  }
  std::vector<Rml::byte> buffer(buffer_size);
  const auto read_size =
      file_interface->Read(buffer.data(), buffer_size, file_handle);
  file.Close();
  if (read_size != buffer_size) {
    return 0;
  }

  sf::Image image;
  if (!image.loadFromMemory(buffer.data(), buffer.size())) {
    return 0;
  }
  // Loaded files contain straight alpha; premultiply once before upload.
  const auto size = image.getSize();
  for (unsigned int x = 0; x < size.x; ++x) {
    for (unsigned int y = 0; y < size.y; ++y) {
      sf::Color color = image.getPixel(sf::Vector2u{x, y});
      color.r = static_cast<std::uint8_t>((color.r * color.a) / 255);
      color.g = static_cast<std::uint8_t>((color.g * color.a) / 255);
      color.b = static_cast<std::uint8_t>((color.b * color.a) / 255);
      image.setPixel(sf::Vector2u{x, y}, color);
    }
  }

  auto texture = std::make_unique<sf::Texture>();
  texture->setSmooth(true);
  texture->setRepeated(true);
  if (!texture->loadFromImage(image)) {
    return 0;
  }
  auto& counts = Diagnostics();
  counts.Record(&DataDiagnostics::texture_uploads);
  counts.Record(&DataDiagnostics::texture_upload_bytes,
                uint64_t{size.x} * size.y * 4);
  texture_dimensions = {static_cast<int>(size.x), static_cast<int>(size.y)};
  return reinterpret_cast<Rml::TextureHandle>(texture.release());
}

bool RenderInterfaceSFML::PreloadTexture(const std::string& source,
                                         const sf::Image& image) {
  auto texture = std::make_shared<sf::Texture>();
  texture->setSmooth(true);
  texture->setRepeated(true);
  if (!texture->loadFromImage(image)) {
    return false;
  }
  preloaded_textures_[source] = std::move(texture);
  const auto size = image.getSize();
  auto& counts = Diagnostics();
  counts.Record(&DataDiagnostics::texture_uploads);
  counts.Record(&DataDiagnostics::texture_upload_bytes,
                uint64_t{size.x} * size.y * 4);
  return true;
}

void RenderInterfaceSFML::ClearPreloadedTextures(const std::string* source) {
  if (source) {
    preloaded_textures_.erase(*source);
  } else {
    preloaded_textures_.clear();
  }
}

Rml::TextureHandle RenderInterfaceSFML::GenerateTexture(
    Rml::Span<const Rml::byte> source, Rml::Vector2i source_dimensions) {
  if (source_dimensions.x <= 0 || source_dimensions.y <= 0 || !source.data()) {
    return 0;
  }
  const auto dimensions = sf::Vector2u{
      static_cast<unsigned int>(source_dimensions.x),
      static_cast<unsigned int>(source_dimensions.y),
  };
  const uint64_t byte_count = uint64_t{dimensions.x} * dimensions.y * 4;
  if (byte_count > source.size()) {
    return 0;
  }
  const auto maximum = sf::Texture::getMaximumSize();
  if (dimensions.x > maximum || dimensions.y > maximum) {
    return 0;
  }

  auto texture = std::make_unique<sf::Texture>();
  if (!texture->resize(dimensions)) {
    return 0;
  }
  texture->setSmooth(true);
  texture->setRepeated(true);
  texture->update(source.data(), dimensions, sf::Vector2u{0, 0});
  Diagnostics().Record(&DataDiagnostics::texture_uploads);
  Diagnostics().Record(&DataDiagnostics::texture_upload_bytes, byte_count);
  return reinterpret_cast<Rml::TextureHandle>(texture.release());
}

void RenderInterfaceSFML::ReleaseTexture(Rml::TextureHandle texture) {
  if (texture != 0 &&
      reinterpret_cast<sf::Texture*>(texture) == batch_texture_) {
    FlushGeometry();
  }
  if (texture != 0) {
    auto* pointer = reinterpret_cast<sf::Texture*>(texture);
    const auto lease = preloaded_texture_leases_.find(pointer);
    if (lease != preloaded_texture_leases_.end()) {
      if (--lease->second.count == 0) {
        preloaded_texture_leases_.erase(lease);
      }
    } else {
      delete pointer;
    }
  }
}

}  // namespace sfmlrmlui
