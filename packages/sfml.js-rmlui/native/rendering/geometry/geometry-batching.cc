// Copyright (c) 2026 XadillaX
// SPDX-License-Identifier: MIT

#include <algorithm>
#include <utility>
#include <vector>

#include "native/rendering/render-interface-sfml.h"

namespace sfmlrmlui {
namespace {

constexpr size_t kBatchCacheBytes = 32 * 1024 * 1024;
constexpr size_t kBatchCacheSlots = 512;

}  // namespace

size_t RenderInterfaceSFML::BatchCache::Bytes() const {
  return vertex_capacity * sizeof(sf::Vertex) +
         keys.capacity() * sizeof(BatchKey);
}

void RenderInterfaceSFML::BeginBatchRendering() {
  FlushGeometry();
  batch_cache_cursor_ = 0;
  batch_rendering_ = true;
}

void RenderInterfaceSFML::EndBatchRendering() {
  FlushGeometry();
  batch_rendering_ = false;
  while (batch_cache_.size() > batch_cache_cursor_) {
    batch_cache_bytes_ -= batch_cache_.back().Bytes();
    batch_cache_.pop_back();
  }
  auto& counts = Diagnostics();
  if (counts.active) {
    counts.geometry_batch_cache_bytes = std::max(
        counts.geometry_batch_cache_bytes, uint64_t{batch_cache_bytes_});
  }
}

bool RenderInterfaceSFML::EnsureSoloBuffer(CompiledGeometryRecord* record) {
  if (record->buffer) {
    return true;
  }
  auto buffer = std::make_shared<sf::VertexBuffer>(
      sf::PrimitiveType::Triangles, sf::VertexBuffer::Usage::Static);
  if (!buffer->create(record->vertex_count) ||
      !buffer->update(record->vertices.data())) {
    return false;
  }
  record->buffer = std::move(buffer);
  auto& counts = Diagnostics();
  counts.Record(&DataDiagnostics::geometry_uploads);
  counts.Record(&DataDiagnostics::geometry_upload_bytes,
                record->vertex_count * sizeof(sf::Vertex));
  return true;
}

RenderInterfaceSFML::BatchCache* RenderInterfaceSFML::AcquireBatchCache() {
  const size_t index = batch_cache_cursor_;
  const size_t old_bytes =
      index < batch_cache_.size() ? batch_cache_[index].Bytes() : 0;
  const size_t vertex_capacity =
      index < batch_cache_.size()
          ? std::max(batch_vertices_, batch_cache_[index].vertex_capacity)
          : batch_vertices_;
  const size_t key_capacity =
      index < batch_cache_.size()
          ? std::max(batch_commands_.size(),
                     batch_cache_[index].keys.capacity())
          : batch_commands_.size();
  const size_t new_bytes =
      vertex_capacity * sizeof(sf::Vertex) + key_capacity * sizeof(BatchKey);
  if (index >= kBatchCacheSlots ||
      batch_cache_bytes_ - old_bytes + new_bytes > kBatchCacheBytes) {
    return &batch_overflow_;
  }
  if (index == batch_cache_.size()) {
    batch_cache_.emplace_back();
  }
  ++batch_cache_cursor_;
  return &batch_cache_[index];
}

bool RenderInterfaceSFML::UploadBatch(BatchCache* cache) {
  size_t first = 0;
  size_t last = batch_commands_.size();
  // Stable offsets keep fragmented updates in one bounded GPU upload.
  if (cache->buffer && cache->keys.size() == batch_commands_.size()) {
    bool same_shape = true;
    size_t first_changed = last;
    size_t last_changed = 0;
    for (size_t i = 0; i < batch_commands_.size(); ++i) {
      const auto& next = batch_commands_[i].key;
      const auto& old = cache->keys[i];
      same_shape = same_shape && next.vertex_count == old.vertex_count;
      if (next != old) {
        first_changed = std::min(first_changed, i);
        last_changed = i + 1;
      }
    }
    if (same_shape && first_changed < last_changed) {
      first = first_changed;
      last = last_changed;
    }
  }

  size_t vertex_offset = 0;
  size_t vertex_count = 0;
  for (size_t i = 0; i < last; ++i) {
    if (i < first) {
      vertex_offset += batch_commands_[i].key.vertex_count;
    } else {
      vertex_count += batch_commands_[i].key.vertex_count;
    }
  }
  batch_staging_.clear();
  batch_staging_.reserve(vertex_count);
  for (size_t i = first; i < last; ++i) {
    const auto& command = batch_commands_[i];
    const auto offset = command.key.translation;
    for (auto vertex : command.geometry->vertices) {
      vertex.position += offset;
      batch_staging_.push_back(vertex);
    }
  }

  auto& counts = Diagnostics();
  counts.Record(&DataDiagnostics::geometry_batch_copied_bytes,
                vertex_count * sizeof(sf::Vertex));
  const size_t old_bytes = cache->Bytes();
  if (!cache->buffer || cache->vertex_capacity < batch_vertices_) {
    auto buffer = std::make_unique<sf::VertexBuffer>(
        sf::PrimitiveType::Triangles, sf::VertexBuffer::Usage::Dynamic);
    if (!buffer->create(batch_vertices_)) {
      return false;
    }
    cache->buffer = std::move(buffer);
    cache->vertex_capacity = batch_vertices_;
  }
  if (!cache->buffer->update(
          batch_staging_.data(), vertex_count, vertex_offset)) {
    if (cache != &batch_overflow_) {
      batch_cache_bytes_ += cache->Bytes() - old_bytes;
    }
    cache->keys.clear();
    return false;
  }
  if (cache != &batch_overflow_) {
    if (cache->keys.capacity() < batch_commands_.size()) {
      // Exact descriptor growth stays inside the cache budget.
      std::vector<BatchKey> keys(batch_commands_.size());
      cache->keys.swap(keys);
    } else {
      cache->keys.resize(batch_commands_.size());
    }
    for (size_t i = 0; i < batch_commands_.size(); ++i) {
      cache->keys[i] = batch_commands_[i].key;
    }
    batch_cache_bytes_ += cache->Bytes() - old_bytes;
  }
  counts.Record(&DataDiagnostics::geometry_uploads);
  counts.Record(&DataDiagnostics::geometry_upload_bytes,
                vertex_count * sizeof(sf::Vertex));
  return true;
}

void RenderInterfaceSFML::FlushGeometry() {
  if (batch_commands_.empty()) {
    return;
  }
  auto& counts = Diagnostics();
  counts.Record(&DataDiagnostics::geometry_batch_commands,
                batch_commands_.size());
  if (batch_commands_.size() == 1) {
    const auto& command = batch_commands_.front();
    DrawGeometry(command.geometry,
                 {command.key.translation.x, command.key.translation.y},
                 batch_texture_,
                 nullptr);
  } else {
    auto* cache = AcquireBatchCache();
    const bool hit = cache != &batch_overflow_ && cache->buffer &&
                     cache->keys.size() == batch_commands_.size() &&
                     std::equal(cache->keys.begin(),
                                cache->keys.end(),
                                batch_commands_.begin(),
                                [](const auto& key, const auto& command) {
                                  return key == command.key;
                                });
    counts.Record(hit ? &DataDiagnostics::geometry_batch_cache_hits
                      : &DataDiagnostics::geometry_batch_cache_misses);
    if (hit || UploadBatch(cache)) {
      DrawBuffer(*cache->buffer, batch_vertices_, {}, batch_texture_, nullptr);
    } else {
      // Failed merged allocations preserve the original draw sequence.
      for (const auto& command : batch_commands_) {
        DrawGeometry(command.geometry,
                     {command.key.translation.x, command.key.translation.y},
                     batch_texture_,
                     nullptr);
      }
    }
  }
  for (const auto& command : batch_commands_) {
    command.geometry->queued = false;
  }
  batch_commands_.clear();
  batch_vertices_ = 0;
  batch_texture_ = nullptr;
}

}  // namespace sfmlrmlui
